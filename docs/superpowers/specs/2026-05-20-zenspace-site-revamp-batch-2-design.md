# Zenspace Site Revamp — Batch 2 Design

Date: 2026-05-20
Status: Approved (design); pending spec review
Builds on: `2026-05-19-zenspace-site-revamp-design.md`

## Summary

Seven targeted changes to the Zenspace public site + admin, all built on the
existing patterns (Prisma models, generic `/api/admin/[table]` CRUD, `CrudList`
/ `EntityForm` / `forms.ts`, `revalidateTag` on writes, `AdminShell` sidebar):

1. **Header logo** — drop the new PNG, restore the older JPG image, place a
   stacked text wordmark beside it.
2. **Earring-metal categories** — turn the existing "Choose your earrings"
   cards into linked pages, each showcasing products in that metal; admin
   manages metals + per-metal products.
3. **The Process** — first three step cards open a fillable booking form
   (modal). After Care opens the aftercare PDF. All three forms have
   admin-editable field definitions.
4. **Reviews carousel** — keep the auto-scrolling marquee but drop fallback
   placeholders sooner (≥2 real reviews), add an optional video field per
   review, and an Instagram link in the section header.
5. **Homepage videos placeholder** — show a visible placeholder card in the
   "Watch us at work" strip whenever no `ShortVideo` rows exist.
6. **"What makes us safe?" sections** — new admin-managed safety items
   rendered on both kids and adults piercing pages.
7. **"Locate us" button** on both piercing pages, opening the Google Maps
   link.

Non-goals: email notifications for form submissions, payments, an external
CMS, mobile-app, SSO. New work runs alongside the existing `CustomRequest`
flow (kept for the legacy `/custom` page).

## 1. Header logo — `app/components/Navbar.tsx`

- Remove `logo-full.png` from `app/public/assets/` (and any other reference).
- Render `logo.jpg` (the pre-PNG image, already present) as a small mark on
  the left of the header — `next/image`, ~h-11 to match existing scale,
  `object-contain`.
- Beside the image, a stacked text wordmark in the existing serif:
  - "**Zenspace**" — `font-serif`, bold, size matching prior brand emphasis
  - "Tattoo and piercing" — same `font-serif`, `font-light`, slightly
    smaller, muted color (`text-stone-500`)
- OG image in `app/app/layout.tsx` already references `logo.jpg`; leave it.
- Mobile: same layout, scaled.

## 2. Earring-metal categories → product showcase pages

### Prisma schema additions
```
model EarringCategory {
  id          String   @id @default(uuid()) @db.Uuid
  slug        String   @unique
  name        String           // e.g. "Stainless Steel", "Gold", "Silver"
  audience    String           // "kids" | "adults" | "both"
  description String?
  photo       String?
  sort_order  Int?     @default(0)
  products    EarringProduct[]
  @@map("earring_categories")
}

model EarringProduct {
  id          String   @id @default(uuid()) @db.Uuid
  category_id String   @db.Uuid
  category    EarringCategory @relation(fields: [category_id], references: [id], onDelete: Cascade)
  name        String
  photo       String?
  price_inr   Int?
  description String?
  sort_order  Int?     @default(0)
  @@map("earring_products")
}
```

### Migration / data transition
- Add the new tables; do **not** drop `EarringOption` yet. Backfill: copy the
  three existing rows per audience (Stainless Steel / Gold / Silver) into
  `EarringCategory` with deterministic slugs (`stainless-steel`, `gold`,
  `silver`). `EarringOption` continues to exist (unused by new pages) until a
  follow-up cleanup.

### Public routes
- `/piercing/earrings/[slug]` — new dynamic route. Renders category hero
  (name, description, hero photo) + product grid (photo / name / price /
  description). 404 on unknown slug.
- The "Choose your earrings" cards inside `PiercingAudienceContent.tsx`
  become `<Link>`s to `/piercing/earrings/{slug}`. The cards are now driven
  by `EarringCategory` filtered by audience (and `both`), replacing the
  current `getEarringOptions(audience)` source.
- `lib/data.ts` gains `getEarringCategories(audience)` and
  `getEarringCategoryWithProducts(slug)`, both `unstable_cache`d and tagged.

### Admin
- New sidebar group **"Piercing → Earrings"** with two routes:
  - `/admin/earrings` — `CrudList` over `earring_categories` (name, slug,
    audience, photo, description, sort_order).
  - `/admin/earrings/[id]` — edit category fields + nested
    `CrudList`/gallery for `earring_products` (mirrors
    `admin/categories/[id]` and `admin/artists/[id]` patterns).
- Generic CRUD route `/api/admin/earring_categories` and `earring_products`
  via existing `[table]` handler, with `revalidateTag('earrings')` and
  `revalidatePath('/piercing/kids')` + `/piercing/adults` on writes.

## 3. The Process — service forms

### Prisma schema additions
```
model ServiceForm {
  id          String   @id @default(uuid()) @db.Uuid
  slug        String   @unique          // "custom-design" | "cover-up" | "piercing"
  title       String
  intro       String?
  sort_order  Int?     @default(0)
  fields      ServiceFormField[]
  submissions ServiceFormSubmission[]
  @@map("service_forms")
}

model ServiceFormField {
  id          String   @id @default(uuid()) @db.Uuid
  form_id     String   @db.Uuid
  form        ServiceForm @relation(fields: [form_id], references: [id], onDelete: Cascade)
  key         String           // stable key for payload, unique per form
  label       String
  type        String           // "text"|"tel"|"email"|"textarea"|"select"|"file"|"date"
  required    Boolean  @default(false)
  options     String[]         // for select; otherwise empty
  sort_order  Int?     @default(0)
  @@unique([form_id, key])
  @@map("service_form_fields")
}

model ServiceFormSubmission {
  id          String   @id @default(uuid()) @db.Uuid
  form_id     String   @db.Uuid
  form        ServiceForm @relation(fields: [form_id], references: [id])
  payload     Json             // { fieldKey: value, ... }
  status      String   @default("new")   // "new" | "read" | "done"
  created_at  DateTime @default(now())
  @@map("service_form_submissions")
}
```

### Seeded data
Three `ServiceForm` rows on first migration:
- `custom-design` — "Tell us about your custom design"
- `cover-up`     — "Tell us about your cover-up"
- `piercing`     — "Book your piercing"

Seeded `ServiceFormField` rows (low-friction defaults; admin can add/remove/
reorder later):

**Common to all three (seed order 1–3):**
1. `name` — Name, text, required
2. `phone` — Phone, tel, required
3. `reference` — Reference image, file, optional

**Custom Design extras:**
4. `idea` — Idea description, textarea, required
5. `style` — Style preference, select, optional, options
   `["Minimal","Realistic","Blackwork","Colour","Other"]`
6. `placement` — Placement on body, text, optional
7. `size` — Approx size, text, optional

**Cover Up extras:**
4. `current_photo` — Photo of existing tattoo, file, required
5. `cover_idea` — What you'd like to cover with, textarea, required
6. `placement` — Placement on body, text, optional

**Piercing extras:**
4. `piercing_type` — Which piercing, select, required, options
   `["Ear lobe","Cartilage","Helix","Nose","Lip","Navel","Other"]`
5. `audience` — For whom, select, required, options `["Kids","Adults"]`
6. `preferred_date` — Preferred date, date, optional

### Public UX
- The 4 process cards in `PageContent.tsx` keep their visual look. First 3
  become `<button>`s that open a modal with the corresponding form (loaded
  from `getServiceForm(slug)`); after-care card becomes an `<a>` to
  `site_settings.aftercare_pdf`, opening in a new tab.
- Modal renders fields in `sort_order`. Files upload via the existing
  `/api/admin/upload` route (already used by admin uploads) gated by a
  signed upload endpoint reused for public submissions, or — simpler and
  preferred — by reusing the same Supabase Storage flow with a new public
  upload route `/api/service-forms/upload`. The form posts the resulting
  URLs + the rest of the payload to `/api/service-forms/[slug]`, which
  validates required fields, persists a `ServiceFormSubmission`, and
  returns success.
- Success state: confirmation toast + modal close. No email is sent.

### After Care card → PDF
- Copy `/Users/vanshsood/Downloads/after care 1 (1).pdf` into
  `app/public/assets/aftercare.pdf` as a one-time asset commit.
- Seed `site_settings.aftercare_pdf = '/assets/aftercare.pdf'` (only when
  it's currently NULL — don't overwrite a value an admin has already set).
- The After Care card's `onClick` becomes a target=_blank link to that URL.
- Existing admin field at `/admin/piercing-content` (`aftercare_pdf`)
  continues to work — admin can re-upload to override.

### Admin
- New sidebar group **"Booking forms"**:
  - `/admin/service-forms` — list of the 3 forms (seeded) with edit links.
  - `/admin/service-forms/[id]` — edit title/intro + nested CRUD over
    `service_form_fields` (label, key auto-derived from label, type,
    required toggle, options[] for selects, drag-sort). Mirrors the
    artist→portfolio admin pattern.
  - `/admin/submissions` — combined inbox of `service_form_submissions`
    across all 3 forms (filter by form, by status). Row open view shows the
    full payload, the reference image preview if uploaded, and lets admin
    mark `read`/`done`.
- Generic CRUD via `/api/admin/service_forms`, `service_form_fields`,
  `service_form_submissions`. Public submission endpoint is **separate**
  (`/api/service-forms/[slug]`) and **does NOT** go through the admin auth
  layer — anyone can POST a submission.

## 4. Reviews carousel + per-review video + Instagram link

### Schema
- Add `video String?` to `Review` (nullable URL).

### Public — `app/components/PageContent.tsx` reviews block
- Marquee stays (you confirmed "auto carousel"). Already pause-on-hover,
  prefers-reduced-motion-aware.
- Lower fallback threshold: defaults render only when `reviews.length < 2`
  (was `< 3`). Once an admin uploads ≥2 reviews, only real ones display.
- `ReviewCard` rendering precedence: `video` → autoplay muted loop (mirrors
  `ShortVideoCard`); else `photo` → image; else a muted placeholder
  graphic.
- Section header gains a small **"Follow us on Instagram →"** link
  rendering `site_settings.instagram` (only when non-empty). Sits next to
  the heading.

### Admin
- `/admin/reviews/[id]` form gains a "Video (optional)" upload field next
  to the existing photo field. Same upload mechanism. Listed alongside
  photo in `forms.ts`.

## 5. Homepage videos placeholder

- In `PageContent.tsx`'s "Watch us at work" section: when `videos.length === 0`,
  render exactly **one** placeholder card with the same aspect/shape as a
  real `ShortVideoCard` — muted gradient background, a centered play icon,
  caption "Video coming soon". No interaction. Disappears when any
  `ShortVideo` exists.
- *Assumption (open question): "the video section was supposedly another
  thing not this" — I'm interpreting that as the homepage videos strip,
  which is the only video-rendering section without a current placeholder.
  If you meant another spot (e.g. a piercing page), call it out at spec
  review and the implementation plan will redirect.*

## 6. "What makes us safe?" section

### Schema
```
model SafetyItem {
  id          String   @id @default(uuid()) @db.Uuid
  audience    String           // "kids" | "adults" | "both"
  title       String
  body        String
  photo       String?
  sort_order  Int?     @default(0)
  @@map("safety_items")
}
```

### Public
- New section component `<SafetyItems audience={…} />` rendered inside
  `PiercingAudienceContent.tsx` on both `/piercing/kids` and
  `/piercing/adults`. Title "What makes us safe?" (h2). Rows stacked: photo
  on the left, title (bold) over body (muted) on the right.
- Filtered by `audience` matching the current page OR `both`. Sorted by
  `sort_order`.
- `lib/data.ts` adds `getSafetyItems(audience)`.

### Admin
- New `/admin/safety-items` (under the existing "Piercing" sidebar group)
  with a `CrudList` over `safety_items` (audience picker, title, body
  textarea, photo upload, sort_order).
- Writes `revalidatePath` both piercing routes.

## 7. "Locate us" button

- A new button rendered near the hero on both `/piercing/kids` and
  `/piercing/adults` (inside `PiercingAudienceContent.tsx`). Anchor
  `target="_blank" rel="noopener noreferrer"` to:
  `https://maps.app.goo.gl/4Aez6HYucSTLEqp57`.
- Hard-coded as a top-of-file constant in the component. If you later want
  it admin-editable, the same `SiteSettings` field
  (`maps_url String?`) can hold it and the constant is swapped for the
  setting — out of scope for this batch.

## Cross-cutting concerns

- **Cache tags** — every new admin write calls
  `revalidateTag('earrings' | 'service-forms' | 'safety' | 'reviews')` and
  `revalidatePath` on the public routes touched.
- **Permissions** — admin pages remain behind the existing admin gate.
  Public submission endpoints (`/api/service-forms/[slug]` and
  `/api/service-forms/upload`) are public and rate-limited via a simple
  per-IP token bucket (already used pattern, or add a 5/min limit if not
  present).
- **Validation** — server-side rejects submissions missing required fields
  or referencing unknown form slugs. File uploads validated (mime + size
  ≤ existing limit).
- **Backward compatibility** — `EarringOption` table stays in place; the
  homepage and existing pages keep rendering. `CustomRequest` /
  `/custom` flow untouched.
- **No new dependencies.** Reuse `Marquee`, `next/image`, `framer-motion`,
  existing dropzone wrapper, existing Supabase storage helper.

## File-level scope

**New files:**
- Prisma migration `prisma/migrations/…_batch_2_revamp/migration.sql`
- `app/app/(site)/piercing/earrings/[slug]/page.tsx`
- `app/app/api/service-forms/[slug]/route.ts`
- `app/app/api/service-forms/upload/route.ts`
- `app/app/admin/earrings/page.tsx`, `…/new/page.tsx`, `…/[id]/page.tsx`
- `app/app/admin/service-forms/page.tsx`, `…/[id]/page.tsx`
- `app/app/admin/submissions/page.tsx`, `…/[id]/page.tsx`
- `app/app/admin/safety-items/page.tsx`, `…/new/page.tsx`, `…/[id]/page.tsx`
- `app/components/ServiceFormModal.tsx`, `app/components/SafetyItems.tsx`,
  `app/components/VideoPlaceholderCard.tsx`
- `app/lib/seed-batch-2.ts` (idempotent seed for forms/fields and aftercare
  PDF setting).
- `app/public/assets/aftercare.pdf`

**Modified files:**
- `app/components/Navbar.tsx` (logo)
- `app/components/PageContent.tsx` (process cards → form launchers,
  reviews section + Instagram, videos placeholder)
- `app/components/PiercingAudienceContent.tsx` (earring cards become links,
  add SafetyItems + Locate-us button)
- `app/components/ReviewCard.tsx` (video preference + placeholder)
- `app/lib/data.ts` (loaders for new models)
- `app/app/admin/_components/forms.ts` (review video field; new entity
  field defs)
- `app/app/admin/_components/AdminShell.tsx` (new sidebar entries)
- `prisma/schema.prisma` (new models + Review.video)
- `app/public/assets/` (delete `logo-full.png`)

## Verification (manual, on dev)

1. Header shows logo.jpg + "Zenspace" / "Tattoo and piercing" stacked text.
   `logo-full.png` is gone from `/public/assets/` and no JSX references it.
2. `/piercing/kids` and `/piercing/adults` show "Choose your earrings"
   cards as before; each card is now a link to
   `/piercing/earrings/<slug>`. Each target page lists products.
3. Admin: `/admin/earrings` lists Stainless Steel / Gold / Silver (per
   audience). Creating a product on Gold appears immediately on the public
   `/piercing/earrings/gold` page.
4. Homepage process: click Custom Design → modal opens with seeded fields
   (Name/Phone/Reference + Idea/Style/Placement/Size). Submitting stores a
   row visible in `/admin/submissions`. After Care card opens
   `/assets/aftercare.pdf` in a new tab.
5. Admin: in `/admin/service-forms/<id>`, add a new field → it appears in
   the public modal on next page load.
6. Reviews: with 0 admin reviews, defaults show. Add 1 admin review →
   defaults still pad to 2 visible. Add a 2nd → defaults disappear, only
   real ones show, marqueeing. The new "Follow us on Instagram →" link
   appears when `site_settings.instagram` is set.
7. Admin review form has a Video field. Upload one → that card autoplays
   muted on the homepage.
8. Homepage "Watch us at work" with zero `ShortVideo` rows shows a
   single placeholder card with a play icon. Upload one video → placeholder
   disappears, video plays.
9. Both piercing pages show a "What makes us safe?" section with admin-
   managed items, plus a "Locate us" button that opens the Google Maps URL
   in a new tab.

## Open question (resolve at spec review)

- **Section #5 interpretation**: confirm the "video placeholder is a
  different section" refers to the homepage "Watch us at work" videos
  strip. If not, name the exact section and the plan will redirect.
