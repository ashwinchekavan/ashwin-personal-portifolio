// Everything site-wide lives here. Fill in the empty strings before launch.
export const SITE = {
  name: 'Ashwin Chekavan',
  title: 'Ashwin Chekavan | Entrepreneur, Strategist & Builder',
  description:
    'Entrepreneur, strategist and builder Ashwin Chekavan writes on business strategy, entrepreneurship, technology and building sustainable businesses.',
  tagline: 'Entrepreneur · Strategist · Builder',
  location: 'Bangalore, India',
  email: 'hello@ashwinchekavan.com',
  // Optional form backend (Formspree, Web3Forms, …). When empty the contact
  // form opens the visitor's mail app instead.
  formEndpoint: '',
  social: {
    linkedin: '',
    instagram: '',
    youtube: '',
    x: '',
  },
  businesses: {
    dreamRich: '',
    creatif: '',
  },
  bookUrl: '',
};

export const NAV = [
  { label: 'Home', href: '/#home' },
  { label: 'About', href: '/#about' },
  { label: 'Journey', href: '/#journey' },
  { label: 'Businesses', href: '/#businesses' },
  { label: 'Writing', href: '/writing/' },
  { label: 'Book', href: '/#book' },
  { label: 'Contact', href: '/#contact' },
];

// Internal links go through url() so the site also works if it is ever served
// from a sub-path (Astro's `base` option).
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export const url = (path = '/') => `${BASE}${path}`;

// SITE_URL is read when the server runs, so the address can change without a rebuild.
export const fullUrl = (path = '/') => new URL(url(path), process.env.SITE_URL ?? import.meta.env.SITE).href;

// Search results show about 155 characters of a description. Keep whole
// sentences that fit; otherwise cut on a word and add an ellipsis.
export function metaDescription(text: string, max = 155) {
  const clean = text.replace(/\s+/g, ' ').trim().replace(/\s*\S*…$/, '');
  if (clean.length <= max) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let fit = '';
  for (const sentence of sentences) {
    if ((fit + sentence).trim().length > max) break;
    fit += sentence;
  }
  if (fit.trim().length >= 70) return fit.trim();
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[\s,;:]+$/, '')}…`;
}

export function readingTime(body = '') {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));
}

export function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
