import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, verifySession } from './lib/auth';

const notFound = () => new Response('Not found', { status: 404 });
const hostOnly = (value: string | null) => (value ?? '').split(',')[0].trim().split(':')[0].toLowerCase();

// The host name the visitor used. A hosting proxy may pass it in X-Forwarded-Host.
const requestHost = (headers: Headers) => hostOnly(headers.get('x-forwarded-host') ?? headers.get('host'));

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const { headers, method } = context.request;
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/');

  // With ADMIN_HOST set, the admin area exists only on that host name, and
  // that host serves nothing but the admin area and the files it needs.
  const adminHost = process.env.ADMIN_HOST?.toLowerCase();
  if (adminHost) {
    const onAdminHost = requestHost(headers) === adminHost;
    if (isAdminPath && !onAdminHost) return notFound();
    if (onAdminHost && !isAdminPath) {
      if (pathname === '/') return context.redirect('/admin/');
      const isAsset = /^\/(_astro|_image|uploads)\b/.test(pathname) || pathname === '/favicon.svg';
      if (!isAsset) return notFound();
    }
  }

  const isPublicWritingPage = pathname === '/writing' || /^\/writing\/[^/]+$/.test(pathname);
  const isRead = method === 'GET' || method === 'HEAD';

  // One address for the whole site: www.<site> sends visitors and search engines
  // to the SITE_URL host in a single 301 (adding the /writing/ slash on the way).
  const site = new URL(process.env.SITE_URL ?? import.meta.env.SITE);
  if (isRead && requestHost(headers) === `www.${site.hostname}`) {
    const path = isPublicWritingPage ? `${pathname}/` : pathname;
    return new Response(null, { status: 301, headers: { Location: `${site.origin}${path}${context.url.search}` } });
  }

  if (isPublicWritingPage && isRead) {
    return context.redirect(`${pathname}/${context.url.search}`, 301);
  }

  if (!isAdminPath) return next();

  // Changes must come from the admin pages themselves, not from another site.
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = headers.get('origin');
    if (!origin || hostOnly(new URL(origin).host) !== requestHost(headers)) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  const session = verifySession(context.cookies.get(SESSION_COOKIE)?.value);
  context.locals.admin = session?.username;

  const isLogin = pathname.replace(/\/$/, '') === '/admin/login';
  if (!session && !isLogin) {
    return pathname.startsWith('/api/')
      ? Response.json({ error: 'Please sign in again.' }, { status: 401 })
      : context.redirect('/admin/login/');
  }

  const response = await next();
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
});
