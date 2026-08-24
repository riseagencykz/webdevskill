# SEO & Metadata

Relevant for any publicly reachable page. Skip entirely for app screens behind a
login — and make sure those are `noindex`.

## Per-Page Essentials

```tsx
export const metadata = {
  title: 'Cold brew subscription — Roasted weekly | Acme Coffee',  // ≤ 60 chars
  description: 'Fresh single-origin beans roasted to order and delivered every '
             + 'two weeks. Pause or cancel anytime.',              // ≤ 155 chars
  alternates: { canonical: 'https://acme.com/subscribe' },
  openGraph: {
    title: 'Cold brew subscription',
    description: 'Roasted to order, delivered every two weeks.',
    url: 'https://acme.com/subscribe',
    images: [{ url: '/og/subscribe.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
}
```

- Every page has a **unique** title and description. Templated duplicates across
  1,000 pages are worse than none.
- Canonical URL on every page — the single biggest source of duplicate-content
  problems is the same page reachable via query params, trailing slash, and
  `www`. Pick one form and redirect (301) the rest.
- OG image: 1200×630, under ~1 MB, readable at thumbnail size. Generate
  dynamically (`next/og`) for content pages.

## Crawlability

- One canonical URL per piece of content. Filters and sorts either get
  `noindex` or a canonical to the base page.
- `robots.txt` allows the crawl and points at the sitemap.
- `sitemap.xml` generated from real routes, with `lastmod`. Exclude
  redirects, `noindex`, and 404s.
- Return real status codes: 404 for missing, 301 for permanent moves, 302 for
  temporary. A "not found" page returning 200 gets the empty page indexed.
- Content that matters must be in the server-rendered HTML. Anything that only
  appears after a client fetch is a coin flip for indexing.

## Structured Data

Add JSON-LD matching the page's actual content — `Article`, `Product` (with
`offers`, `aggregateRating`), `FAQPage`, `BreadcrumbList`, `Organization`,
`LocalBusiness`.

```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"Cold Brew Kit",
 "offers":{"@type":"Offer","price":"39.00","priceCurrency":"USD",
 "availability":"https://schema.org/InStock"}}
</script>
```

Never mark up content that is not visible on the page — that is a manual-action
risk, not a shortcut.

## Content and Links

- One `<h1>` stating what the page is about, in the user's words.
- Descriptive link text. "Read the pricing breakdown", not "click here".
- Internal links between related pages; orphan pages rarely rank.
- Images: real `alt` text and descriptive filenames.

## Technical Signals

- HTTPS everywhere; HTTP redirects to HTTPS.
- Core Web Vitals are a ranking input — see `performance.md`.
- Mobile-first: the mobile rendering is what gets indexed.
- `hreflang` for multi-language sites, with reciprocal tags and `x-default`.

## Pre-Launch Checklist

- [ ] Staging/preview environments are `noindex` (this is the classic disaster)
- [ ] Titles and descriptions unique on every indexable page
- [ ] Canonicals correct; one host form; consistent trailing slash
- [ ] `sitemap.xml` + `robots.txt` reachable and accurate
- [ ] OG/Twitter cards render correctly in a share debugger
- [ ] 404 returns 404; removed pages 301 to a relevant page
- [ ] Structured data validates in the Rich Results Test
