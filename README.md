# SomNexra — Shopify Theme

A custom Online Store 2.0 theme built for a single hero product (26W brushless neck & shoulder massager, $75.99) sold to cold Meta/Facebook ad traffic. Mobile-first, conversion-focused, calm wellness aesthetic.

Every place the brand name appears in storefront copy is an editable theme setting or section default, so wording can be adjusted entirely from the theme editor.

## Install

**Option A — Zip upload (fastest):**

```bash
zip -r somnexra-theme.zip assets config layout locales sections snippets templates
```

Then in Shopify admin: **Online Store → Themes → Add theme → Upload zip file.**

**Option B — GitHub integration:** Online Store → Themes → Add theme → Connect from GitHub, and pick this repo/branch. Shopify syncs the theme folders at the repo root.

## First-time setup checklist

1. **Product**: create your massager product with a Color option (White / Grey), price $75.99, and a compare-at price for the struck-through anchor. Enable inventory tracking — the product page's low-stock indicator reads real inventory and only appears at/below the threshold you set (no fake scarcity).
2. **Homepage links**: in the theme editor, point the Hero button, Sticky buy bar button, and Cart drawer empty-state button at your product page.
3. **Cart drawer** (edit it from any page in the theme editor): set the free-shipping threshold (0 hides the bar) and pick the upsell product (e.g. the same massager, so buyers add a second unit).
4. **Upsell section on the product page**: paste a variant ID into "Variant ID to quick-add" to make "Add a second unit" one-tap, and create an automatic discount (e.g. Buy 2, save 10%) in Admin → Discounts so the bundle promise is real.
5. **Images**: every image slot is a placeholder until you upload — hero lifestyle shot, showcase rows, testimonial photos, product gallery.
6. **Menus**: the header/footer use the default `main-menu` and `footer` menus (Admin → Navigation).
7. **Reviews**: the review section is editor-managed to start (edit stars/counts/review cards in the theme editor). When you install a review app later (Judge.me, Loox…), replace that section with the app's block and update the rating text above the product title.

## What's inside

- **Homepage**: hero (paid-traffic landing), trust bar, problem/solution, lifestyle showcase, testimonials with photos, FAQ, mobile sticky buy bar.
- **Product page**: scroll-snap gallery with tap-to-zoom lightbox, compare-at pricing with save-% pill, color swatches, quantity, AJAX add-to-cart + dynamic Buy Now, trust badges under the button, honest inventory-driven stock indicator, accordion details (how it works / in the box / specs / shipping), star-breakdown review section with photo reviews, bundle/upsell section, sticky mobile add-to-cart bar.
- **Cart**: slide-out drawer (Section Rendering API — no page reloads), free-shipping progress bar, in-drawer upsell. `/cart` page kept as a no-JS fallback.
- **Tech**: two small vanilla-JS files (product JS loads only on product pages), lazy-loaded images with srcset, system of CSS custom properties driven by theme settings, 2 font families (Playfair Display + DM Sans, both from Shopify's free font library), fully editable via sections/blocks — no code edits needed for copy, images, colors, or fonts.

## Theme settings

**Theme settings → Colors** controls the whole palette. Defaults: warm cream background `#FAF8F4`, charcoal text `#2E2A26`, deep sage accent `#3E5C50`, terracotta highlight `#B4552D` (sale/urgency only), amber stars.
