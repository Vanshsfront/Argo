# Zenspace Site Revamp — Design

Date: 2026-05-19
Status: Approved (design); pending spec review

## Goal

Apply a batch of content, layout, and admin changes to the existing Zenspace
Next.js 16 site without introducing a CMS framework. Extend existing patterns:
new Prisma models + `SiteSettings` fields, the generic `/api/admin/[table]`
route, and the `CrudList`/`EntityForm` admin components, with a regrouped admin
sidebar.

## Non-goals

- No shopping cart, checkout, or payments. Piercing pages are informational.
- No generic page→section→block CMS. Changes are targeted.
- No email integration for the custom-design form (stored in DB only).

## Architecture summary

- **Public site** lives under `app/app/(site)`, composed of server pages that
  call cached loaders in `lib/data.ts` and render client components in
  `components/`.
- **Admin** lives under `app/app/admin`, using `AdminShell` (sidebar nav),
  `CrudList`/`EntityForm`/`forms.ts`, and the generic CRUD API at
  `app/app/api/admin/[table]/route.ts` (+ `[id]`). Writes call
  `revalidateTag`/`revalidatePath` to refresh the public site.
- New content reuses these mechanisms: new Prisma models become new `[table]`
  keys with tag/path busting, new `forms.ts` field defs, and new sidebar pages.

## Schema additions (`prisma/schema.prisma`)

### New `SiteSettings` fields
- `aftercare_pdf String?` — uploaded PDF URL.
- `piercing_kids_title String?`, `piercing_kids_intro String?` — Kids page copy.
- `piercing_adults_title String?`, `piercing_adults_intro String?` — Adults page copy.
- `about_title String?` (default "Workspace where we create magic"),
  `about_heading String?` (default "About Zenspace"),
  `about_body String?` — About page copy. Existing About paragraphs become
  editable via `about_body` (textarea, paragraph-per-blank-line).

### New model `ShortVideo`
```
id String @id @default(uuid()) @db.Uuid
video    String           // uploaded vertical video URL (9:16)
poster   String?          // optional thumbnail/poster image
caption  String?
sort_order Int? @default(0)
@@map("short_videos")
```

### New model `EarringOption`
```
id String @id @default(uuid()) @db.Uuid
audience  String           // "kids" | "adults"
metal     String           // "stainless_steel" | "gold" | "silver"
photo     String?
benefits  String?          // benefit/description text (kids emphasize safety)
sort_order Int? @default(0)
@@map("earring_options")
```
A page renders its three metal options for the matching `audience`.

### New model `CustomRequest`
```
id String @id @default(uuid()) @db.Uuid
name        String
phone       String
email       String?
description String
reference   String?         // optional uploaded reference image URL
created_at  DateTime? @default(now()) @db.Timestamptz(6)
@@map("custom_requests")
```

A Prisma migration (or `db push` per existing workflow) plus `seed.ts`
defaults where reasonable. `lib/data.ts` gains cached loaders
(`getShortVideos`, `getEarringOptions(audience)`) and tags
(`short_videos`, `earring_options`, `custom_requests`); the API route's
`TABLE_TAGS`/`bust()` and `ModelKey` union are extended for the new tables
with appropriate `revalidatePath` calls (`/`, `/piercing/kids`,
`/piercing/adults`, `/about`, `/custom`).

## Feature designs

### 1. Navbar (`components/Navbar.tsx`)
- Replace the "Book consultation" CTA (desktop line ~103-105 and mobile
  line ~167-171) with **"Locate us"** linking to `/contact`.
- "Zenspace" wordmark (line 41): add `font-bold`.
- Convert the single "Piercing" link (desktop line 98, mobile line 163) into
  a dropdown matching the existing Category dropdown pattern (hover/click,
  `openMenu` state extended to include `"piercing"`), with two entries:
  **Kids** → `/piercing/kids`, **Adults** → `/piercing/adults`. Active state
  when `pathname?.startsWith("/piercing")`.

### 2. Piercing pages
- New route `app/app/(site)/piercing/kids/page.tsx` and
  `app/app/(site)/piercing/adults/page.tsx`. Each is a server page loading
  `getSiteSettings`, `getPiercingPhotos`, and `getEarringOptions(audience)`,
  rendering a shared client component `PiercingAudienceContent` with an
  `audience` prop.
- `PiercingAudienceContent` sections: hero (audience title/intro from
  settings with sensible defaults), **earring options** block — three cards
  (Stainless Steel / Gold / Silver) each with photo + benefits text;
  Kids copy emphasizes child safety/hypoallergenic — gallery (existing
  piercing photos), an **aftercare PDF** download button shown when
  `settings.aftercare_pdf` is set, and Book/WhatsApp CTA (reuse existing
  WhatsApp href helper).
- `app/app/(site)/piercing/page.tsx` becomes a compact landing linking to
  `/piercing/kids` and `/piercing/adults` (so existing `/piercing` links and
  the home "Know More" buttons still work).
- In `components/PageContent.tsx`, the Kids card "Book Now"/"Know More"
  (lines ~196-212) points to `/piercing/kids`; the Adults card
  (lines ~252-268) points to `/piercing/adults`.

### 3. Home short-form videos (`components/PageContent.tsx`)
- New section inserted after the studio marquee (~line 139). Renders
  `getShortVideos()` (passed from `app/app/(site)/page.tsx`). Each video:
  9:16 card, `<video muted loop playsInline preload="metadata">`, autoplay
  when scrolled into view (IntersectionObserver) with optional `poster`.
  Horizontal scroll/marquee consistent with the existing `Marquee`. Section
  hidden when there are no videos.

### 4. Custom design form (`/custom`)
- New route `app/app/(site)/custom/page.tsx` rendering a client form
  component. Fields: name (required), phone (required), email, description
  (required, textarea), reference image (optional, reuse upload endpoint
  `/api/admin/upload` or a public-safe equivalent — see Open question O1).
- On submit, POST to a new route handler that inserts a `CustomRequest`.
  Success/error inline state. Linked from the Adults/Kids pages and a nav or
  CTA entry point.

### 5. Reviews slider (`components/PageContent.tsx` `ReviewCard`)
- Replace the 64px circular avatar (lines ~472-475) with a large client
  photo occupying the top of the card (e.g. `aspect-[4/5]` or a tall image),
  name + stars below, review text under that. Present reviews as a
  slider/carousel (reuse `Marquee` or a swipeable track) rather than small
  circles. Keep placeholder behavior.

### 6. Footer fix
- Diagnose root cause via systematic-debugging before changing code.
  Hypotheses to verify: root `app/app/layout.tsx` body not
  `flex flex-col min-h-screen` so `<main className="flex-1">` /
  footer placement misbehaves; or a fixed/overlay element or Lenis
  smooth-scroll covering it; or footer dark-on-dark. Fix the confirmed
  cause so the footer renders at the bottom on every page.

### 7. About page (`components/AboutContent.tsx`)
- Big `<h1>` (line 39) becomes `settings.about_title` default
  **"Workspace where we create magic"**. Remove/repurpose the italic
  subtitle (lines 40-42).
- Replace the 4-photo grid (lines 78-99) with **two overlapped photos**
  (e.g. one large, one offset/overlapping with shadow & ring).
- Add an **"About Zenspace"** heading (`settings.about_heading`) below the
  left photo, directly above the paragraph block (lines ~70-75). Paragraphs
  come from `settings.about_body` (split on blank lines) with the current
  text as default.

### 8. Admin rework (`app/app/admin/_components/AdminShell.tsx` + pages)
Regroup the sidebar so each website section is its own editable page with
structured photo upload that mirrors the live layout. Target sections:

- **Home / Hero** — existing hero text/image, studio strip photos, the new
  short-form videos (`short_videos` CrudList), closing CTA copy.
- **Piercing (Kids & Adults)** — Kids copy + Kids earring options/photos;
  Adults copy + Adults earring options/photos; aftercare PDF upload.
  `earring_options` managed via CrudList filtered/labeled by audience.
- **About** — `about_title`, `about_heading`, `about_body`, and the two
  About photos (reuse `studio_photos` or a dedicated set — see O2).
- **Reviews & Custom requests** — reviews CrudList (photo field guidance
  updated for the larger display) + a read-only/deletable inbox list of
  `custom_requests`.

Implementation: extend `NAV` in `AdminShell` into grouped entries; add
`forms.ts` field defs for `ShortVideo`, `EarringOption`; add admin pages
under `app/app/admin/<section>/` reusing `CrudList`/`EntityForm`; site
settings page reorganized to surface the new fields under the right
sections. Each photo field uses the existing `ImageUpload`/`MultiImageUpload`
with help text describing how/where it appears on the site. Aftercare PDF
upload may need the upload endpoint to accept `application/pdf` (see O1).

## Open questions (resolve during planning, sensible defaults chosen)

- **O1 — Upload endpoint for public/PDF:** the custom-design form's
  reference image and the aftercare PDF need uploads. Default: extend the
  existing `/api/admin/upload` (or add a small public upload route) to accept
  images for the public form and `application/pdf` for admin. Validate type
  and size.
- **O2 — About photos source:** default to a dedicated handling (two slots)
  rather than overloading `studio_photos`, to keep the About admin section
  self-contained. Final call during planning.

## Testing

- Build passes (`npm run build`, which runs `prisma generate`).
- Manual: nav (Locate us link, bold wordmark, Piercing dropdown), Kids and
  Adults pages render with earring options + aftercare PDF, home videos
  section, custom form submits and appears in admin, reviews show large
  photos, footer visible on every page, About new layout, each admin section
  edits and reflects on the site after revalidation.
- Where practical, follow TDD for the form submission handler and any data
  helpers.
