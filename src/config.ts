// Everything site-wide lives here. Fill in the empty strings before launch.
export const SITE = {
  name: 'Ashwin Chekavan',
  title: 'Ashwin Chekavan — Entrepreneur, Business Strategist & Builder',
  description:
    'Ashwin Chekavan is an entrepreneur and business strategist from Bangalore, India, building businesses, systems and ideas across infrastructure, technology, creative industries and real estate.',
  tagline: 'Entrepreneur · Business Strategist · Builder',
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

export function readingTime(body = '') {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));
}

export function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
