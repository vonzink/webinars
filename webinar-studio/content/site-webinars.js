/* The webinars that are built into the site (they live in this repository and
   have their own folder under /webinars/). Webinar Studio lists them next to
   the ones made in the Studio, and a new webinar may not take one of their
   names. `editor` is set where Slide settings has been added to that deck. */
export const SITE_WEBINARS = Object.freeze([
  { slug: 'reverse-mortgages', title: 'Reverse Mortgages', url: '/webinars/reverse-mortgages/', editor: '/webinars/reverse-mortgages/editor.html' },
  { slug: 'first-home-without-mystery', title: 'Your first home, without the mystery.', url: '/webinars/first-home-without-mystery/', editor: '/webinars/first-home-without-mystery/editor.html' },
  { slug: 'homebuyers-webinar', title: 'The Homebuyer\'s Playbook', url: '/webinars/homebuyers-webinar/', editor: '/webinars/homebuyers-webinar/editor.html' },
  { slug: 'va', title: 'Understanding VA Loans', url: '/webinars/va/', editor: '/webinars/va/editor.html' },
  { slug: 'le-cd', title: 'Understand Your Loan Estimate and Closing Disclosure', url: '/webinars/le-cd/' },
]);

/* Names a created webinar cannot use: the built-in ones (by folder, and by the
   name their saved edits are stored under where that differs), and this folder. */
export const RESERVED_SLUGS = Object.freeze([...SITE_WEBINARS.map(webinar => webinar.slug), 'homebuyers', 'studio', 'webinar']);
