# Zenspace Site Revamp Batch 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship seven targeted changes (header logo, earring-category pages, dynamic Process forms, reviews carousel, videos placeholder, safety items, Locate-us button) on the existing Zenspace Next.js site, all built on the project's existing patterns.

**Architecture:** Extend Prisma schema with new tables (`EarringCategory`, `EarringProduct`, `ServiceForm`, `ServiceFormField`, `ServiceFormSubmission`, `SafetyItem`) and one column (`Review.video`). Reuse the generic admin patterns (`/api/admin/[table]`, `EntityList`, `EntityForm`, `forms.ts`, `revalidateTag`, `revalidatePath`, Supabase storage). Reuse `Marquee` for the reviews auto-carousel. New public modal component for service forms. Single Prisma migration + one idempotent seed runner for all new content.

**Tech Stack:** Next.js 16 (App Router), React 19, Prisma 7 + PostgreSQL, Supabase Storage, Tailwind 4, Framer Motion. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-20-zenspace-site-revamp-batch-2-design.md`.

**Project layout note:** The actual code lives inside the git **submodule** at `/Users/vanshsood/Projects/zenspace/app/` (separate `.git`). Inside that submodule we're on branch `site-revamp`. All code commits in this plan go into the submodule; the outer `zenspace` repo will get one final commit at the end updating the submodule pointer.

**Testing convention:** This project has no test framework wired up (no jest/vitest in `package.json`). The verification gate per task is `npx tsc --noEmit && npm run build` (inside `app/`) plus the **manual smoke check** included in each phase. Where a piece of pure server logic is non-trivial (the public submission endpoint), a one-shot script under `app/scripts/` is used in lieu of unit tests.

**Dev server:** A dev server is already running on port 3001 for the previous AZR work. The Zenspace dev server should be started separately on its default port (`npm run dev` inside `app/`) for the manual smoke checks at the end.

---

## Phase 0 — Setup

### Task 0.1: Confirm working tree and branches

**Files:** N/A (read-only)

- [ ] **Step 1: Verify submodule branch and clean state**

```bash
cd /Users/vanshsood/Projects/zenspace/app
git status --short
git branch --show-current
```

Expected: branch `site-revamp`, working tree relatively clean (any prior incidental edits unrelated to this plan stay out of our commits).

- [ ] **Step 2: Verify Prisma + DB connectivity**

```bash
cd /Users/vanshsood/Projects/zenspace/app
ls prisma/schema.prisma prisma/seed.ts
cat .env.local 2>/dev/null | grep -c DATABASE_URL || cat .env 2>/dev/null | grep -c DATABASE_URL
```

Expected: schema.prisma and seed.ts exist; DATABASE_URL is set.

### Task 0.2: Copy aftercare PDF into the project

**Files:**
- Create: `app/public/assets/aftercare.pdf`

- [ ] **Step 1: Copy the file**

```bash
cp "/Users/vanshsood/Downloads/after care 1 (1).pdf" /Users/vanshsood/Projects/zenspace/app/public/assets/aftercare.pdf
ls -lh /Users/vanshsood/Projects/zenspace/app/public/assets/aftercare.pdf
```

Expected: a PDF file is present at the new path with non-zero size.

- [ ] **Step 2: Commit the asset**

```bash
cd /Users/vanshsood/Projects/zenspace/app
git add public/assets/aftercare.pdf
git commit -m "assets: add aftercare PDF"
```

---

## Phase 1 — Prisma schema + migration + seed

This phase adds **all** new schema in one migration, then runs an idempotent seed that creates the three `ServiceForm` rows + their default fields, backfills `EarringCategory` from existing `EarringOption` rows, and sets `site_settings.aftercare_pdf` if unset.

### Task 1.1: Add new models + Review.video to `prisma/schema.prisma`

**Files:**
- Modify: `app/prisma/schema.prisma`

- [ ] **Step 1: Append new models and column**

Open `app/prisma/schema.prisma`. Locate the `Review` model and add a `video String?` field next to `photo`. Append the following at the end of the file (after the existing models):

```prisma
model EarringCategory {
  id          String           @id @default(uuid()) @db.Uuid
  slug        String           @unique
  name        String
  audience    String           // "kids" | "adults" | "both"
  description String?
  photo       String?
  sort_order  Int?             @default(0)
  products    EarringProduct[]
  @@map("earring_categories")
}

model EarringProduct {
  id          String          @id @default(uuid()) @db.Uuid
  category_id String          @db.Uuid
  category    EarringCategory @relation(fields: [category_id], references: [id], onDelete: Cascade)
  name        String
  photo       String?
  price_inr   Int?
  description String?
  sort_order  Int?            @default(0)
  @@map("earring_products")
}

model ServiceForm {
  id          String                 @id @default(uuid()) @db.Uuid
  slug        String                 @unique          // "custom-design" | "cover-up" | "piercing"
  title       String
  intro       String?
  sort_order  Int?                   @default(0)
  fields      ServiceFormField[]
  submissions ServiceFormSubmission[]
  @@map("service_forms")
}

model ServiceFormField {
  id         String      @id @default(uuid()) @db.Uuid
  form_id    String      @db.Uuid
  form       ServiceForm @relation(fields: [form_id], references: [id], onDelete: Cascade)
  key        String
  label      String
  type       String      // "text"|"tel"|"email"|"textarea"|"select"|"file"|"date"
  required   Boolean     @default(false)
  options    String[]    @default([])
  sort_order Int?        @default(0)
  @@unique([form_id, key])
  @@map("service_form_fields")
}

model ServiceFormSubmission {
  id         String      @id @default(uuid()) @db.Uuid
  form_id    String      @db.Uuid
  form       ServiceForm @relation(fields: [form_id], references: [id])
  payload    Json
  status     String      @default("new")   // "new" | "read" | "done"
  created_at DateTime    @default(now())
  @@map("service_form_submissions")
}

model SafetyItem {
  id         String  @id @default(uuid()) @db.Uuid
  audience   String              // "kids" | "adults" | "both"
  title      String
  body       String
  photo      String?
  sort_order Int?    @default(0)
  @@map("safety_items")
}
```

And in the existing `Review` model add:

```prisma
  video        String?
```

(Place it immediately below the `photo` line so the column ordering matches what admin forms will produce.)

- [ ] **Step 2: Format and validate the schema**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npx prisma format
npx prisma validate
```

Expected: both commands exit 0. `npx prisma validate` prints `The schema at … is valid`.

- [ ] **Step 3: Commit the schema change**

```bash
git add prisma/schema.prisma
git commit -m "prisma: add earring/service-form/safety models + Review.video"
```

### Task 1.2: Generate and apply the migration

**Files:**
- Create: `app/prisma/migrations/<timestamp>_batch_2_revamp/migration.sql` (auto-generated)

- [ ] **Step 1: Generate migration**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npx prisma migrate dev --name batch_2_revamp
```

Expected: a new migration directory under `prisma/migrations/` is created and applied to the dev DB. Prisma Client is regenerated.

- [ ] **Step 2: Verify tables exist**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npx tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); (async()=>{ console.log(await p.\$queryRaw\`SELECT table_name FROM information_schema.tables WHERE table_name IN ('earring_categories','earring_products','service_forms','service_form_fields','service_form_submissions','safety_items') ORDER BY table_name\`); await p.\$disconnect(); })()"
```

Expected: all six table names listed.

- [ ] **Step 3: Commit migration**

```bash
git add prisma/migrations
git commit -m "prisma: migrate batch 2 (earrings, service forms, safety, review.video)"
```

### Task 1.3: Idempotent seed for new content

**Files:**
- Create: `app/scripts/seed-batch-2.ts`

- [ ] **Step 1: Write the seed script**

Create `app/scripts/seed-batch-2.ts`:

```ts
/**
 * Idempotent seed for Batch 2:
 *  - 3 ServiceForms + their default ServiceFormFields
 *  - Backfill EarringCategory rows from existing EarringOption rows
 *  - Set site_settings.aftercare_pdf to /assets/aftercare.pdf if currently NULL
 *
 * Safe to re-run. Run with: npx tsx scripts/seed-batch-2.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type FieldSeed = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  sort_order: number;
};

const COMMON: FieldSeed[] = [
  { key: "name",      label: "Name",            type: "text",     required: true,  sort_order: 1 },
  { key: "phone",     label: "Phone",           type: "tel",      required: true,  sort_order: 2 },
  { key: "reference", label: "Reference image", type: "file",     required: false, sort_order: 3 },
];

const FORMS: Array<{ slug: string; title: string; intro: string; extras: FieldSeed[] }> = [
  {
    slug: "custom-design",
    title: "Tell us about your custom design",
    intro: "A few details help us prep the right artist and time. We'll get back on WhatsApp.",
    extras: [
      { key: "idea",       label: "Idea description", type: "textarea", required: true,  sort_order: 4 },
      { key: "style",      label: "Style preference", type: "select",   required: false, sort_order: 5, options: ["Minimal", "Realistic", "Blackwork", "Colour", "Other"] },
      { key: "placement",  label: "Placement on body", type: "text",    required: false, sort_order: 6 },
      { key: "size",       label: "Approx size",       type: "text",    required: false, sort_order: 7 },
    ],
  },
  {
    slug: "cover-up",
    title: "Tell us about your cover-up",
    intro: "Send us a clear photo of the existing tattoo and what you'd like to cover it with.",
    extras: [
      { key: "current_photo", label: "Photo of existing tattoo",  type: "file",     required: true,  sort_order: 4 },
      { key: "cover_idea",    label: "What you'd like to cover with", type: "textarea", required: true, sort_order: 5 },
      { key: "placement",     label: "Placement on body",         type: "text",     required: false, sort_order: 6 },
    ],
  },
  {
    slug: "piercing",
    title: "Book your piercing",
    intro: "Tell us who it's for and what you'd like done — we'll confirm a slot.",
    extras: [
      { key: "piercing_type",  label: "Which piercing",   type: "select", required: true,  sort_order: 4, options: ["Ear lobe","Cartilage","Helix","Nose","Lip","Navel","Other"] },
      { key: "audience",       label: "For whom",         type: "select", required: true,  sort_order: 5, options: ["Kids","Adults"] },
      { key: "preferred_date", label: "Preferred date",   type: "date",   required: false, sort_order: 6 },
    ],
  },
];

async function seedServiceForms() {
  for (const f of FORMS) {
    const existing = await db.serviceForm.findUnique({ where: { slug: f.slug } });
    const form = existing
      ? await db.serviceForm.update({ where: { id: existing.id }, data: { title: f.title, intro: f.intro } })
      : await db.serviceForm.create({ data: { slug: f.slug, title: f.title, intro: f.intro } });

    const desired = [...COMMON, ...f.extras];
    for (const fd of desired) {
      await db.serviceFormField.upsert({
        where: { form_id_key: { form_id: form.id, key: fd.key } },
        create: { form_id: form.id, key: fd.key, label: fd.label, type: fd.type, required: !!fd.required, options: fd.options ?? [], sort_order: fd.sort_order },
        update: { label: fd.label, type: fd.type, required: !!fd.required, options: fd.options ?? [], sort_order: fd.sort_order },
      });
    }
  }
}

async function backfillEarringCategories() {
  const opts = await db.earringOption.findMany();
  for (const o of opts) {
    const slug = (o.metal || "").toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug) continue;
    const existing = await db.earringCategory.findUnique({ where: { slug } });
    if (existing) continue;
    await db.earringCategory.create({
      data: {
        slug,
        name: o.metal || slug,
        audience: o.audience || "both",
        description: o.benefits ?? null,
        photo: o.photo ?? null,
        sort_order: o.sort_order ?? 0,
      },
    });
  }
}

async function setAftercarePdfDefault() {
  const s = await db.siteSettings.findUnique({ where: { id: 1 } });
  if (!s) return;                   // settings not seeded yet — skip
  if (s.aftercare_pdf) return;      // honor admin-set value
  await db.siteSettings.update({ where: { id: 1 }, data: { aftercare_pdf: "/assets/aftercare.pdf" } });
}

async function main() {
  await seedServiceForms();
  await backfillEarringCategories();
  await setAftercarePdfDefault();
  console.log("[seed-batch-2] complete");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
```

- [ ] **Step 2: Run the seed**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npx tsx scripts/seed-batch-2.ts
```

Expected: prints `[seed-batch-2] complete` with no errors.

- [ ] **Step 3: Spot-check seeded rows**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npx tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); (async()=>{ console.log('forms', await p.serviceForm.count()); console.log('fields', await p.serviceFormField.count()); console.log('categories', await p.earringCategory.count()); const s = await p.siteSettings.findUnique({ where:{ id:1 }}); console.log('aftercare', s?.aftercare_pdf); await p.\$disconnect(); })()"
```

Expected: `forms 3`, `fields 19` (3 commons × 3 forms + 4+3+3 extras = 19), categories ≥ 1, aftercare `/assets/aftercare.pdf`.

- [ ] **Step 4: Commit seed**

```bash
git add scripts/seed-batch-2.ts
git commit -m "seed: idempotent seed for service forms, earring categories, aftercare default"
```

---

## Phase 2 — Header logo

### Task 2.1: Replace Navbar logo with logo.jpg + text wordmark

**Files:**
- Modify: `app/components/Navbar.tsx`
- Delete: `app/public/assets/logo-full.png`

- [ ] **Step 1: Read the current Navbar.tsx**

```bash
cd /Users/vanshsood/Projects/zenspace/app
grep -n "logo-full\|logo.jpg\|Image\|Link href=\"/\"" components/Navbar.tsx
```

You'll see the existing `<Image src="/assets/logo-full.png" …>` wrapped in `<Link href="/">`.

- [ ] **Step 2: Edit the brand block in `components/Navbar.tsx`**

Replace the existing brand `<Link>` block (the one with `src="/assets/logo-full.png"`) with:

```tsx
<Link href="/" className="flex items-center gap-3 group" aria-label="Zenspace home">
  <Image
    src="/assets/logo.jpg"
    alt="Zenspace logo"
    width={64}
    height={64}
    priority
    className="h-10 w-10 rounded-full object-cover group-hover:scale-105 transition-transform"
  />
  <span className="flex flex-col leading-tight">
    <span className="font-serif font-bold text-stone-900 text-xl tracking-tight">Zenspace</span>
    <span className="font-serif font-light text-stone-500 text-[11px] tracking-wide">Tattoo and piercing</span>
  </span>
</Link>
```

Keep `import Image from "next/image"` and `import Link from "next/link"` (already present).

- [ ] **Step 3: Delete the PNG**

```bash
cd /Users/vanshsood/Projects/zenspace/app
rm public/assets/logo-full.png
grep -rn "logo-full.png" . --include="*.tsx" --include="*.ts" --include="*.json" 2>/dev/null
```

Expected: the `grep` returns nothing (no remaining references). If anything appears, edit those references to use `logo.jpg` or remove them.

- [ ] **Step 4: Type-check and build**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npx tsc --noEmit
npm run build
```

Expected: both succeed. No "module not found" for the logo image.

- [ ] **Step 5: Commit**

```bash
git add components/Navbar.tsx public/assets/logo-full.png
git commit -m "ui(navbar): restore logo.jpg + add Zenspace/Tattoo-and-piercing wordmark"
```

(`git add` on a deleted file stages the deletion.)

---

## Phase 3 — Earring categories (public pages + admin)

### Task 3.1: Data loaders + cache tag

**Files:**
- Modify: `app/lib/data.ts`

- [ ] **Step 1: Add tag + loaders**

In `app/lib/data.ts`, locate the `TAGS` constant (it lists existing cache tags). Add a new tag `earrings: "earrings"`. Then append these loaders near the existing ones (`getEarringOptions`, etc.):

```ts
export type EarringCategoryRow = {
  id: string;
  slug: string;
  name: string;
  audience: string;
  description: string | null;
  photo: string | null;
  sort_order: number | null;
};
export type EarringProductRow = {
  id: string;
  category_id: string;
  name: string;
  photo: string | null;
  price_inr: number | null;
  description: string | null;
  sort_order: number | null;
};

export const getEarringCategories = unstable_cache(
  async (audience: "kids" | "adults"): Promise<EarringCategoryRow[]> => {
    return withTimeout<EarringCategoryRow[]>(
      async () => (await db.earringCategory.findMany({
        where: { audience: { in: [audience, "both"] } },
        orderBy: [{ sort_order: "asc" }, { name: "asc" }],
      })) as EarringCategoryRow[],
      [],
    );
  },
  ["earring_categories_by_audience"],
  { tags: [TAGS.earrings], revalidate: 3600 },
);

export const getEarringCategoryWithProducts = unstable_cache(
  async (slug: string): Promise<{ category: EarringCategoryRow; products: EarringProductRow[] } | null> => {
    return withTimeout<{ category: EarringCategoryRow; products: EarringProductRow[] } | null>(
      async () => {
        const cat = await db.earringCategory.findUnique({ where: { slug } });
        if (!cat) return null;
        const products = await db.earringProduct.findMany({
          where: { category_id: cat.id },
          orderBy: [{ sort_order: "asc" }, { name: "asc" }],
        });
        return { category: cat as EarringCategoryRow, products: products as EarringProductRow[] };
      },
      null,
    );
  },
  ["earring_category_with_products"],
  { tags: [TAGS.earrings], revalidate: 3600 },
);
```

(The `unstable_cache`, `withTimeout`, and `TAGS` import patterns are already established in this file.)

- [ ] **Step 2: Type-check**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npx tsc --noEmit
```

Expected: success.

- [ ] **Step 3: Wire cache invalidation in the generic admin route**

Open `app/app/api/admin/[table]/route.ts`. Locate the table→tags map (where existing tables like `reviews`, `studio_photos` invalidate tags). Add entries for both new tables, both invalidating the `earrings` tag and revalidating `/piercing/kids` and `/piercing/adults` (so the cards update immediately):

```ts
// inside the per-table invalidation switch:
case "earring_categories":
case "earring_products":
  revalidateTag("earrings");
  revalidatePath("/piercing/kids");
  revalidatePath("/piercing/adults");
  break;
```

- [ ] **Step 4: Commit loaders + tag wiring**

```bash
git add lib/data.ts app/api/admin/\[table\]/route.ts
git commit -m "data: earring category/product loaders + cache invalidation"
```

### Task 3.2: Public `/piercing/earrings/[slug]` page

**Files:**
- Create: `app/app/(site)/piercing/earrings/[slug]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getEarringCategoryWithProducts } from "@/lib/data";

export const dynamic = "force-static";
export const revalidate = 3600;

export default async function EarringCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEarringCategoryWithProducts(slug);
  if (!data) notFound();
  const { category, products } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-violet-50/40">
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-12 text-center">
        <p className="text-sm text-stone-500 mb-2">
          <Link href="/piercing" className="hover:text-stone-700">Piercing</Link> · {category.audience === "kids" ? "Kids" : category.audience === "adults" ? "Adults" : "All ages"}
        </p>
        <h1 className="font-serif text-5xl md:text-6xl text-stone-900 tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="text-stone-600 max-w-2xl mx-auto mt-4 leading-relaxed">{category.description}</p>
        )}
        {category.photo && (
          <div className="relative w-full max-w-3xl mx-auto aspect-[16/9] mt-10 rounded-[2rem] overflow-hidden shadow-lg">
            <Image src={category.photo} alt={category.name} fill className="object-cover" sizes="(min-width: 768px) 768px, 100vw" />
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        {products.length === 0 ? (
          <p className="text-center text-stone-500 italic">More designs coming soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-white/80 backdrop-blur-md border border-stone-200/60 rounded-[2rem] overflow-hidden shadow-lg flex flex-col">
                <div className="relative aspect-square bg-stone-100">
                  {p.photo ? (
                    <Image src={p.photo} alt={p.name} fill className="object-cover" sizes="(min-width: 768px) 30vw, 100vw" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-stone-400">No image</div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-serif text-xl text-stone-900 mb-1">{p.name}</h3>
                  {p.price_inr != null && (
                    <p className="text-stone-700 text-sm font-medium mb-2">₹{p.price_inr.toLocaleString("en-IN")}</p>
                  )}
                  {p.description && <p className="text-stone-600 leading-relaxed text-sm">{p.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Build**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npm run build
```

Expected: build succeeds; the new dynamic route is listed in the route table.

- [ ] **Step 3: Commit**

```bash
git add app/\(site\)/piercing/earrings
git commit -m "feat(piercing): public earring category page"
```

### Task 3.3: Wire the kids/adults "Choose your earrings" cards to links + DB source

**Files:**
- Modify: `app/components/PiercingAudienceContent.tsx`
- Modify: `app/app/(site)/piercing/kids/page.tsx`
- Modify: `app/app/(site)/piercing/adults/page.tsx`

- [ ] **Step 1: Update the audience pages to fetch new model**

In both `piercing/kids/page.tsx` and `piercing/adults/page.tsx`, replace the `getEarringOptions(audience)` call with `getEarringCategories(audience)` and pass the result down as `categories` prop (rename the prop on the component too).

For each page, change the import:

```ts
import { getEarringCategories } from "@/lib/data";
```

and the data fetch line:

```ts
const categories = await getEarringCategories("kids"); // or "adults"
```

Pass to the component as `<PiercingAudienceContent audience="kids" earringCategories={categories} … />`.

- [ ] **Step 2: Update `PiercingAudienceContent.tsx`**

- Change the prop name from `earrings` / similar to `earringCategories: EarringCategoryRow[]` (import the type from `@/lib/data`).
- Inside the "Choose your earrings" section, wrap each card in `<Link href={`/piercing/earrings/${e.slug}`} className="block hover:opacity-95 transition-opacity">…</Link>`. Replace the existing static "metal" text with `category.name`. Replace the "benefits" body with `category.description`. The "photo" still drives the card image; render the same `Gem` icon fallback when there's no photo.

(The minimal patch: replace `e.metal` → `e.name`, `e.benefits` → `e.description`, `e.photo` → `e.photo`; wrap the existing `<motion.div>…</motion.div>` JSX in a `<Link href={`/piercing/earrings/${e.slug}`}>` and add `block` + a hover transition class. Keep the `key={e.id}`.)

- [ ] **Step 3: Type-check + build**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npx tsc --noEmit
npm run build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add app/\(site\)/piercing/kids/page.tsx app/\(site\)/piercing/adults/page.tsx components/PiercingAudienceContent.tsx
git commit -m "feat(piercing): wire earring cards to category pages"
```

### Task 3.4: Admin pages for earring categories + products

**Files:**
- Create: `app/app/admin/earrings/page.tsx` (list)
- Create: `app/app/admin/earrings/new/page.tsx`
- Create: `app/app/admin/earrings/[id]/page.tsx` (edit category + nested products)
- Modify: `app/app/admin/_components/forms.ts` (add field defs)
- Modify: `app/app/admin/_components/AdminShell.tsx` (sidebar entry)

- [ ] **Step 1: Add field defs to `forms.ts`**

Append:

```ts
export const EARRING_CATEGORY_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", required: true, placeholder: "Stainless Steel, Gold, Silver …" },
  { key: "slug", label: "Slug (optional)", help: "Becomes /piercing/earrings/<slug>. Auto-generated from name if blank." },
  { key: "audience", label: "Audience (kids / adults / both)", required: true, placeholder: "kids" },
  { key: "photo", label: "Cover photo", type: "image" },
  { key: "description", label: "Description", type: "textarea" },
];

export const EARRING_PRODUCT_FIELDS: FieldDef[] = [
  { key: "name", label: "Name", required: true },
  { key: "photo", label: "Photo", type: "image" },
  { key: "price_inr", label: "Price (₹ INR)", type: "number" },
  { key: "description", label: "Description", type: "textarea" },
];
```

- [ ] **Step 2: Create list page `app/admin/earrings/page.tsx`**

```tsx
import { EntityList } from "../_components/EntityList";

type Row = { id: string; name: string; slug: string; audience: string; photo: string | null };

export default function Page() {
  return (
    <EntityList<Row>
      table="earring_categories"
      title="Earring categories"
      basePath="/admin/earrings"
      columns={[
        { key: "photo", label: "Cover", image: true },
        { key: "name", label: "Name" },
        { key: "audience", label: "Audience" },
        { key: "slug", label: "Slug" },
      ]}
    />
  );
}
```

- [ ] **Step 3: Create `app/admin/earrings/new/page.tsx`**

```tsx
import { EntityForm } from "../../_components/EntityForm";
import { EARRING_CATEGORY_FIELDS } from "../../_components/forms";

export default function Page() {
  return (
    <EntityForm
      table="earring_categories"
      fields={EARRING_CATEGORY_FIELDS}
      returnTo="/admin/earrings"
      defaults={{ audience: "both", sort_order: 0 }}
    />
  );
}
```

- [ ] **Step 4: Create `app/admin/earrings/[id]/page.tsx`**

This page shows the category edit form **plus** an inline product manager. Pattern follows `admin/categories/[id]/page.tsx` (which manages category photos similarly). Read that file first and mirror it:

```bash
cd /Users/vanshsood/Projects/zenspace/app
sed -n '1,200p' app/admin/categories/\[id\]/page.tsx
```

Then create the equivalent for earrings:

```tsx
"use client";

import { use } from "react";
import { EntityForm } from "../../_components/EntityForm";
import { EARRING_CATEGORY_FIELDS, EARRING_PRODUCT_FIELDS } from "../../_components/forms";
import { InlineEntityCrud } from "../../_components/InlineEntityCrud"; // see Step 4a

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="space-y-10">
      <EntityForm
        table="earring_categories"
        id={id}
        fields={EARRING_CATEGORY_FIELDS}
        returnTo="/admin/earrings"
      />
      <InlineEntityCrud
        table="earring_products"
        title="Products in this category"
        parentKey="category_id"
        parentValue={id}
        fields={EARRING_PRODUCT_FIELDS}
      />
    </div>
  );
}
```

- [ ] **Step 4a: Decide on inline products component**

Look at how `admin/categories/[id]/page.tsx` handles inline photos — it most likely uses `InlinePhotoLibrary` from `_components/`. For products we need text fields (not just an image library), so **either**:

  - **(a) Reuse `InlinePhotoLibrary`** if it already supports name + price text fields per row — read the file:

    ```bash
    sed -n '1,80p' app/app/admin/_components/InlinePhotoLibrary.tsx
    ```

  - **(b) Create a tiny new component** `app/app/admin/_components/InlineEntityCrud.tsx` that lists rows of an arbitrary table where one column equals `parentValue`, with add/edit/delete using the generic `/api/admin/[table]` and `/api/admin/[table]/[id]` routes. Use existing `EntityForm` for the row editor in a slide-over or inline.

The simpler path is **(b)** — write `InlineEntityCrud` mirroring `EntityList` but filtered + with create/edit/delete inline. If that turns out larger than ~120 LOC, downgrade to the simpler approach of linking to a full `/admin/earring-products?category_id=…` page (acceptable, deferred to a follow-up). For this batch, take whichever path is shorter once you've read InlinePhotoLibrary.

Choose and commit Step 4 + Step 4a in a single commit:

```bash
git add app/admin/earrings app/admin/_components/forms.ts app/admin/_components/InlineEntityCrud.tsx
git commit -m "feat(admin): earring categories + nested products CRUD"
```

- [ ] **Step 5: Add sidebar entries**

In `app/app/admin/_components/AdminShell.tsx`, locate the `NAV_GROUPS` array and add an item inside the **"Piercing"** group:

```ts
{ href: "/admin/earrings", label: "Earring categories" },
```

- [ ] **Step 6: Build**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npm run build
```

Expected: success. New `/admin/earrings` and `/admin/earrings/[id]` routes appear.

- [ ] **Step 7: Commit sidebar**

```bash
git add app/admin/_components/AdminShell.tsx
git commit -m "feat(admin): sidebar entry for Earring categories"
```

---

## Phase 4 — Service forms (Process cards open booking forms)

### Task 4.1: Data loaders + cache tag

**Files:**
- Modify: `app/lib/data.ts`
- Modify: `app/app/api/admin/[table]/route.ts`

- [ ] **Step 1: Add tag and loaders**

In `lib/data.ts`, extend `TAGS` with `serviceForms: "service-forms"`. Then add:

```ts
export type ServiceFormFieldRow = {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
  sort_order: number | null;
};
export type ServiceFormRow = {
  id: string;
  slug: string;
  title: string;
  intro: string | null;
  fields: ServiceFormFieldRow[];
};

export const getServiceForm = unstable_cache(
  async (slug: string): Promise<ServiceFormRow | null> => {
    return withTimeout<ServiceFormRow | null>(
      async () => {
        const f = await db.serviceForm.findUnique({
          where: { slug },
          include: { fields: { orderBy: [{ sort_order: "asc" }] } },
        });
        return (f as unknown as ServiceFormRow) ?? null;
      },
      null,
    );
  },
  ["service_form_by_slug"],
  { tags: [TAGS.serviceForms], revalidate: 3600 },
);
```

- [ ] **Step 2: Wire cache invalidation for the four new tables**

In `app/api/admin/[table]/route.ts`, add cases:

```ts
case "service_forms":
case "service_form_fields":
  revalidateTag("service-forms");
  break;
case "service_form_submissions":
  // submissions don't affect public pages; nothing to revalidate
  break;
case "safety_items":
  revalidateTag("safety");
  revalidatePath("/piercing/kids");
  revalidatePath("/piercing/adults");
  break;
```

(The `safety` tag will be referenced in Phase 7; declaring the case now is fine since adding a tag that's not yet read is harmless.)

- [ ] **Step 3: Commit**

```bash
git add lib/data.ts app/api/admin/\[table\]/route.ts
git commit -m "data: service form loaders + admin cache invalidation"
```

### Task 4.2: Public file upload endpoint (anonymous, rate-limited)

**Files:**
- Create: `app/app/api/service-forms/upload/route.ts`

- [ ] **Step 1: Write the endpoint**

```ts
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
]);

// Very simple in-memory token bucket: 5 uploads / 5 min / IP.
const HITS = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const arr = (HITS.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  HITS.set(ip, arr);
  return arr.length > 5;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "file too large" }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "type not allowed" }, { status: 400 });

  const sb = createServiceClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `submissions/${Date.now()}-${safeName}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage.from("media").upload(path, buf, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = sb.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
```

- [ ] **Step 2: Build to verify it compiles**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add app/api/service-forms/upload/route.ts
git commit -m "feat(api): public service-form upload endpoint (rate-limited)"
```

### Task 4.3: Public submission endpoint

**Files:**
- Create: `app/app/api/service-forms/[slug]/route.ts`

- [ ] **Step 1: Write the endpoint**

```ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = new PrismaClient();

// Same in-memory token bucket as upload route. Keep separate counters per route.
const HITS = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const arr = (HITS.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  HITS.set(ip, arr);
  return arr.length > 5;
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const { slug } = await params;
  const form = await db.serviceForm.findUnique({
    where: { slug },
    include: { fields: { orderBy: [{ sort_order: "asc" }] } },
  });
  if (!form) return NextResponse.json({ error: "unknown form" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Validate required fields present + non-empty.
  for (const f of form.fields) {
    if (!f.required) continue;
    const v = (body as Record<string, unknown>)[f.key];
    if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
      return NextResponse.json({ error: `missing: ${f.key}` }, { status: 400 });
    }
  }

  // Build a sanitized payload of only known keys (drops unknown junk).
  const known = new Set(form.fields.map((f) => f.key));
  const payload: Record<string, unknown> = {};
  for (const k of known) payload[k] = (body as Record<string, unknown>)[k] ?? null;

  await db.serviceFormSubmission.create({
    data: { form_id: form.id, payload },
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Smoke-test the endpoint with a script**

Create `app/scripts/test-service-form-submit.ts` (then run, then delete — don't commit):

```ts
import http from "node:http";

function post(path: string, body: any): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ host: "localhost", port: 3000, path, method: "POST", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(data) } }, (r) => {
      let buf = "";
      r.on("data", (c) => { buf += c; });
      r.on("end", () => resolve({ status: r.statusCode ?? 0, body: buf }));
    });
    req.on("error", reject);
    req.write(data); req.end();
  });
}

(async () => {
  console.log("unknown form:", await post("/api/service-forms/does-not-exist", {}));
  console.log("missing required:", await post("/api/service-forms/custom-design", {})); // missing name+phone+idea
  console.log("good:",            await post("/api/service-forms/custom-design", { name: "T", phone: "1", idea: "Z" }));
})();
```

Run (against the dev server which you'll start in a separate terminal: `cd app && npm run dev`):

```bash
cd /Users/vanshsood/Projects/zenspace/app
npx tsx scripts/test-service-form-submit.ts
```

Expected:
- unknown form → status 404
- missing required → status 400 with `error: "missing: name"` (or similar)
- good → status 200 `{ "ok": true }`

Then delete the test script:

```bash
rm app/scripts/test-service-form-submit.ts
```

- [ ] **Step 3: Commit endpoint**

```bash
git add app/api/service-forms
git commit -m "feat(api): public service-form submission endpoint with validation"
```

### Task 4.4: Public service-form modal component

**Files:**
- Create: `app/components/ServiceFormModal.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useEffect, useState } from "react";
import type { ServiceFormRow, ServiceFormFieldRow } from "@/lib/data";

type Props = {
  form: ServiceFormRow;
  open: boolean;
  onClose: () => void;
};

export function ServiceFormModal({ form, open, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setValues({}); setDone(false); setError(null); setSubmitting(false); }
  }, [open]);

  if (!open) return null;

  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/service-forms/upload", { method: "POST", body: fd });
    if (!r.ok) return null;
    const j = await r.json();
    return j.url as string;
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      // Convert any File entries to uploaded URLs first.
      const payload: Record<string, unknown> = {};
      for (const f of form.fields) {
        const v = values[f.key];
        payload[f.key] = v ?? null;
      }
      const r = await fetch(`/api/service-forms/${form.slug}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setError(j.error ?? "Submission failed"); return; }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[2rem] max-w-lg w-full max-h-[90vh] overflow-y-auto p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="float-right text-stone-400 hover:text-stone-700">✕</button>
        <h3 className="font-serif text-2xl text-stone-900 mb-1">{form.title}</h3>
        {form.intro && <p className="text-stone-500 text-sm mb-5">{form.intro}</p>}

        {done ? (
          <div className="py-6 text-center">
            <p className="text-stone-900 font-medium text-lg">Thanks — we'll be in touch.</p>
            <button onClick={onClose} className="mt-5 px-4 py-2 rounded-full bg-stone-900 text-white text-sm">Close</button>
          </div>
        ) : (
          <div className="space-y-4">
            {form.fields.map((f) => (
              <Field key={f.id} f={f} value={values[f.key] ?? ""} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} uploadFile={uploadFile} />
            ))}
            {error && <p className="text-rose-600 text-sm">{error}</p>}
            <button
              disabled={submitting}
              onClick={submit}
              className="w-full mt-2 px-4 py-3 rounded-full bg-stone-900 text-white font-medium disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ f, value, onChange, uploadFile }: { f: ServiceFormFieldRow; value: string; onChange: (v: string) => void; uploadFile: (file: File) => Promise<string | null> }) {
  const label = (
    <label className="text-xs uppercase tracking-wide text-stone-500 block mb-1">
      {f.label} {f.required && <span className="text-rose-500">*</span>}
    </label>
  );
  const base = "w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-white";
  if (f.type === "textarea") {
    return (
      <div>{label}<textarea className={base} rows={4} value={value} onChange={(e) => onChange(e.target.value)} required={f.required} /></div>
    );
  }
  if (f.type === "select") {
    return (
      <div>{label}
        <select className={base} value={value} onChange={(e) => onChange(e.target.value)} required={f.required}>
          <option value="">Select…</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (f.type === "file") {
    return (
      <div>{label}
        <input
          type="file"
          accept="image/*,application/pdf"
          className="text-sm"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await uploadFile(file);
            if (url) onChange(url);
          }}
          required={f.required && !value}
        />
        {value && <p className="text-xs text-stone-500 mt-1 truncate">Uploaded: {value}</p>}
      </div>
    );
  }
  // text / tel / email / date — native input types
  const type = f.type === "tel" || f.type === "email" || f.type === "date" ? f.type : "text";
  return (
    <div>{label}
      <input type={type} className={base} value={value} onChange={(e) => onChange(e.target.value)} required={f.required} />
    </div>
  );
}
```

- [ ] **Step 2: Build**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add components/ServiceFormModal.tsx
git commit -m "feat(public): ServiceFormModal renderer for admin-driven forms"
```

### Task 4.5: Wire the Process cards on the homepage

**Files:**
- Modify: `app/components/PageContent.tsx`
- Modify: `app/app/(site)/page.tsx` (to fetch the three forms)

- [ ] **Step 1: Fetch forms on the home page**

In `app/(site)/page.tsx`, fetch the three forms alongside the existing data:

```ts
import { getServiceForm, getSiteSettings, /* …existing… */ } from "@/lib/data";

const [settings, /* …existing… */, customDesignForm, coverUpForm, piercingForm] = await Promise.all([
  getSiteSettings(),
  /* …existing… */
  getServiceForm("custom-design"),
  getServiceForm("cover-up"),
  getServiceForm("piercing"),
]);

// pass to PageContent:
<PageContent
  /* …existing props… */
  serviceForms={{
    "custom-design": customDesignForm,
    "cover-up": coverUpForm,
    "piercing": piercingForm,
  }}
/>
```

- [ ] **Step 2: Update `PageContent.tsx` Process section**

In the `(PageContent.tsx)` file, locate the `{[ { t: "Custom Design", ... } ]}` static array around the current "The Process" section. Replace it with an array that includes a `slug` per entry and binds to admin-fetched forms passed via props:

```tsx
// near the top of the component:
const [openForm, setOpenForm] = useState<null | "custom-design" | "cover-up" | "piercing">(null);
const PROCESS = [
  { slug: "custom-design", t: "Custom Design", d: "Personalized designs with attention to placement, proportions and skin tone." },
  { slug: "cover-up",       t: "Cover Up",      d: "Thoughtfully planned cover-ups using strategic layering for clean results." },
  { slug: "piercing",       t: "Piercing",      d: "Professional piercings done with sterile equipment and precise placement." },
  { slug: null,             t: "After Care",    d: "Clear aftercare instructions to support healing and help your tattoo stay sharp." },
] as const;
```

In the JSX map of the Process cards, change each step to be either a `<button>` (if `step.slug`) that calls `setOpenForm(step.slug)`, or an `<a href={settings?.aftercare_pdf ?? "/assets/aftercare.pdf"} target="_blank" rel="noopener noreferrer">` for After Care:

```tsx
{PROCESS.map((step, i) => {
  const inner = (
    <motion.div variants={STAGGER_CHILD} whileHover={{ y: -10 }} className="…existing card classes…">
      <div className="w-12 h-12 rounded-full bg-stone-900 text-stone-50 flex items-center justify-center font-serif text-xl mb-6">{i + 1}</div>
      <h3 className="font-serif text-2xl mb-3">{step.t}</h3>
      <p className="text-stone-500 leading-relaxed text-sm">{step.d}</p>
    </motion.div>
  );
  if (step.slug) return <button key={i} type="button" onClick={() => setOpenForm(step.slug)} className="text-left">{inner}</button>;
  return <a key={i} href={settings?.aftercare_pdf ?? "/assets/aftercare.pdf"} target="_blank" rel="noopener noreferrer">{inner}</a>;
})}
```

Below the section (or at the bottom of the component) mount one modal per form:

```tsx
{(["custom-design", "cover-up", "piercing"] as const).map((slug) => {
  const f = serviceForms[slug];
  if (!f) return null;
  return <ServiceFormModal key={slug} form={f} open={openForm === slug} onClose={() => setOpenForm(null)} />;
})}
```

Add the import: `import { ServiceFormModal } from "./ServiceFormModal";`.

- [ ] **Step 3: Build**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npm run build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add app/\(site\)/page.tsx components/PageContent.tsx
git commit -m "feat(public): Process cards open booking modals; After Care opens PDF"
```

### Task 4.6: Admin pages — service forms list, edit + fields, submissions inbox

**Files:**
- Create: `app/app/admin/service-forms/page.tsx`
- Create: `app/app/admin/service-forms/[id]/page.tsx`
- Create: `app/app/admin/submissions/page.tsx`
- Create: `app/app/admin/submissions/[id]/page.tsx`
- Modify: `app/app/admin/_components/forms.ts`
- Modify: `app/app/admin/_components/AdminShell.tsx`

- [ ] **Step 1: Add field defs in `forms.ts`**

```ts
export const SERVICE_FORM_FIELDS: FieldDef[] = [
  { key: "title", label: "Form title", required: true },
  { key: "intro", label: "Intro text", type: "textarea" },
];

// For ServiceFormField rows. `type` and `options` need a custom UI;
// we still expose them as text/textarea here so admins can edit them.
// Custom UI for `options` is built directly in the page.
export const SERVICE_FORM_FIELD_FIELDS: FieldDef[] = [
  { key: "label", label: "Label (shown to user)", required: true },
  { key: "key", label: "Key (machine name, no spaces)", required: true, help: "lowercase, alphanumerics + underscores; cannot change without breaking past submissions referring to this key" },
  { key: "type", label: "Type", required: true, help: "text | tel | email | textarea | select | file | date" },
  { key: "required", label: "Required (true / false)", help: "Type 'true' or 'false'" },
  { key: "options", label: "Options for select (comma-separated)", help: "Only used when type is 'select'." },
  { key: "sort_order", label: "Sort order", type: "number" },
];
```

(Note: this leans on the existing free-text EntityForm. A future iteration can convert `type`, `required`, `options` into proper controls — out of scope for this batch.)

- [ ] **Step 2: Service forms list (`service-forms/page.tsx`)**

```tsx
import { EntityList } from "../_components/EntityList";

type Row = { id: string; slug: string; title: string; intro: string | null };

export default function Page() {
  return (
    <EntityList<Row>
      table="service_forms"
      title="Booking forms"
      basePath="/admin/service-forms"
      columns={[
        { key: "slug", label: "Slug" },
        { key: "title", label: "Title" },
        { key: "intro", label: "Intro", truncate: true },
      ]}
    />
  );
}
```

- [ ] **Step 3: Service-form edit page with nested fields list (`service-forms/[id]/page.tsx`)**

```tsx
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { EntityForm } from "../../_components/EntityForm";
import { SERVICE_FORM_FIELDS } from "../../_components/forms";

type Field = { id: string; form_id: string; key: string; label: string; type: string; required: boolean; options: string[]; sort_order: number | null };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    // Generic admin GET may or may not honor query filters; filter client-side to be safe.
    const r = await fetch(`/api/admin/service_form_fields`, { cache: "no-store" });
    const arr: Field[] = await r.json().catch(() => []);
    setFields(arr.filter((f) => f.form_id === id).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function del(fid: string) {
    if (!confirm("Delete this field?")) return;
    await fetch(`/api/admin/service_form_fields/${fid}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-10">
      <EntityForm
        table="service_forms"
        id={id}
        fields={SERVICE_FORM_FIELDS}
        returnTo="/admin/service-forms"
      />

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl text-stone-700">Form fields</h2>
          <Link href={`/admin/service-forms/${id}/fields/new`} className="text-sm px-3 py-1.5 rounded-md border border-stone-300 hover:bg-stone-50">+ Add field</Link>
        </div>
        {loading ? <p className="text-stone-500 text-sm">Loading…</p> : fields.length === 0 ? (
          <p className="text-stone-500 text-sm italic">No fields yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-stone-400 uppercase"><th className="text-left py-2">Sort</th><th className="text-left">Label</th><th className="text-left">Key</th><th className="text-left">Type</th><th className="text-left">Required</th><th></th></tr></thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.id} className="border-t border-stone-100">
                  <td className="py-2 tabular-nums text-stone-500">{f.sort_order ?? 0}</td>
                  <td>{f.label}</td>
                  <td className="font-mono text-xs text-stone-500">{f.key}</td>
                  <td>{f.type}</td>
                  <td>{f.required ? "yes" : "—"}</td>
                  <td className="text-right">
                    <Link href={`/admin/service-forms/${id}/fields/${f.id}`} className="text-stone-500 hover:text-stone-900 mr-3">Edit</Link>
                    <button className="text-rose-500 hover:text-rose-700" onClick={() => del(f.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

Plus a new-field page `app/admin/service-forms/[id]/fields/new/page.tsx`:

```tsx
"use client";
import { use } from "react";
import { EntityForm } from "../../../../_components/EntityForm";
import { SERVICE_FORM_FIELD_FIELDS } from "../../../../_components/forms";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <EntityForm
      table="service_form_fields"
      fields={SERVICE_FORM_FIELD_FIELDS}
      returnTo={`/admin/service-forms/${id}`}
      defaults={{ form_id: id, required: "false", options: "", sort_order: 100 }}
    />
  );
}
```

And an edit page `app/admin/service-forms/[id]/fields/[fid]/page.tsx`:

```tsx
"use client";
import { use } from "react";
import { EntityForm } from "../../../../_components/EntityForm";
import { SERVICE_FORM_FIELD_FIELDS } from "../../../../_components/forms";

export default function Page({ params }: { params: Promise<{ id: string; fid: string }> }) {
  const { id, fid } = use(params);
  return (
    <EntityForm
      table="service_form_fields"
      id={fid}
      fields={SERVICE_FORM_FIELD_FIELDS}
      returnTo={`/admin/service-forms/${id}`}
    />
  );
}
```

The generic admin route already supports POST/PATCH/DELETE for any table key, so no API changes needed beyond the cache-tag entries from Task 4.1.

**Note on `options` storage:** Admin enters comma-separated. The generic admin API stores the value as a string in a `string[]` column → schema mismatch. Fix: handle this in the generic admin route. Open `app/app/api/admin/[table]/route.ts` and, in the POST/PATCH normalization step (look for where each table massages payload), add:

```ts
if (table === "service_form_fields") {
  if (typeof body.options === "string") {
    body.options = body.options.split(",").map((s: string) => s.trim()).filter(Boolean);
  } else if (!Array.isArray(body.options)) {
    body.options = [];
  }
  if (typeof body.required === "string") body.required = body.required.trim().toLowerCase() === "true";
}
```

Place this above the actual `prisma.<table>.create/update` call. (If the route uses a single `db.<table>.upsert(...)` keyed by name, do the same coercion just before.)

- [ ] **Step 4: Submissions inbox**

`app/admin/submissions/page.tsx`:

```tsx
import { EntityList } from "../_components/EntityList";

type Row = { id: string; form_id: string; status: string; created_at: string };

export default function Page() {
  return (
    <EntityList<Row>
      table="service_form_submissions"
      title="Form submissions"
      basePath="/admin/submissions"
      columns={[
        { key: "created_at", label: "When" },
        { key: "form_id", label: "Form" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
```

`app/admin/submissions/[id]/page.tsx`:

```tsx
"use client";
import { use, useEffect, useState } from "react";

type Sub = { id: string; form_id: string; payload: Record<string, unknown>; status: string; created_at: string };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [s, setS] = useState<Sub | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/admin/service_form_submissions/${id}`);
      if (r.ok) setS(await r.json());
    })();
  }, [id]);

  async function setStatus(next: string) {
    if (!s) return;
    await fetch(`/api/admin/service_form_submissions/${id}`, { method: "PATCH", body: JSON.stringify({ status: next }), headers: { "content-type": "application/json" } });
    setS({ ...s, status: next });
  }

  if (!s) return <p className="text-stone-500">Loading…</p>;
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <p className="text-xs text-stone-500 uppercase">Received</p>
        <p className="text-sm">{new Date(s.created_at).toLocaleString()}</p>
      </div>
      <div>
        <p className="text-xs text-stone-500 uppercase mb-2">Payload</p>
        <dl className="text-sm space-y-2">
          {Object.entries(s.payload).map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-2">
              <dt className="text-stone-500 font-mono">{k}</dt>
              <dd className="col-span-2">
                {typeof v === "string" && (v.startsWith("http://") || v.startsWith("https://"))
                  ? <a href={v} target="_blank" rel="noopener noreferrer" className="underline">{v}</a>
                  : String(v ?? "—")}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setStatus("read")} className="px-3 py-1.5 rounded-md border border-stone-300 text-sm">Mark read</button>
        <button onClick={() => setStatus("done")} className="px-3 py-1.5 rounded-md border border-stone-300 text-sm">Mark done</button>
        <span className="text-xs text-stone-500 self-center">current: {s.status}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add sidebar entries**

In `AdminShell.tsx`'s `NAV_GROUPS`, add a new group **"Booking forms"** with:

```ts
{ group: "Booking forms", items: [
  { href: "/admin/service-forms", label: "Forms & fields" },
  { href: "/admin/submissions", label: "Submissions" },
]},
```

- [ ] **Step 6: Build**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npm run build
```

Expected: success.

- [ ] **Step 7: Commit**

```bash
git add app/admin/service-forms app/admin/submissions app/admin/_components/forms.ts app/admin/_components/AdminShell.tsx app/api/admin/\[table\]/route.ts
git commit -m "feat(admin): service forms editor + submissions inbox"
```

---

## Phase 5 — Reviews carousel improvements

### Task 5.1: Lower fallback threshold + Instagram link

**Files:**
- Modify: `app/components/PageContent.tsx`

- [ ] **Step 1: Change the fallback threshold**

Find the line:

```ts
const displayedReviews = (reviews?.length ?? 0) >= 3 ? reviews : [...(reviews ?? []), ...PLACEHOLDER_REVIEWS].slice(0, 3);
```

Replace with:

```ts
const displayedReviews = (reviews?.length ?? 0) >= 2 ? reviews : [...(reviews ?? []), ...PLACEHOLDER_REVIEWS].slice(0, 2);
```

Also update the conditional that switches between grid and marquee:

```tsx
{displayedReviews.length <= 2 ? (
  <div className="max-w-7xl mx-auto px-6 grid sm:grid-cols-2 gap-6">
    {/* … */}
  </div>
) : (
  <Marquee durationSec={70}> {/* unchanged */} </Marquee>
)}
```

- [ ] **Step 2: Add the Instagram link in the section header**

Locate the reviews section heading (likely "What our clients say" or similar). Below the heading add:

```tsx
{settings?.instagram && (
  <p className="text-center mb-6">
    <a
      href={settings.instagram}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 underline-offset-4 hover:underline"
    >
      Follow us on Instagram →
    </a>
  </p>
)}
```

(`settings` is already passed into `PageContent` per the existing call site.)

- [ ] **Step 3: Build**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npm run build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add components/PageContent.tsx
git commit -m "feat(reviews): lower fallback threshold to 2; add Instagram link"
```

### Task 5.2: Per-review video field + ReviewCard preference

**Files:**
- Modify: `app/components/PageContent.tsx` (only the `ReviewCard` function)
- Modify: `app/app/admin/_components/forms.ts` (add `video` to REVIEW_FIELDS)

- [ ] **Step 1: Extend `ReviewCard`**

In `PageContent.tsx`, locate `function ReviewCard(...)`. Replace the inner image block with:

```tsx
<div className="relative w-full aspect-[4/5] bg-stone-200">
  {r.video ? (
    <video
      src={r.video}
      poster={r.photo || undefined}
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    />
  ) : r.photo ? (
    <Image src={r.photo} alt={r.client_name} fill className="object-cover" sizes="(min-width: 768px) 380px, 100vw" />
  ) : (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7L8 5z"/></svg>
    </div>
  )}
</div>
```

(Adds video preference + a clearly-visible placeholder graphic when neither video nor photo is set.)

- [ ] **Step 2: Add the `video` admin field**

In `forms.ts`, extend `REVIEW_FIELDS`:

```ts
export const REVIEW_FIELDS: FieldDef[] = [
  { key: "client_name", label: "Client name", required: true },
  { key: "photo", label: "Client photo", type: "image", required: false, help: "Optional if a video is uploaded." },
  { key: "video", label: "Client video (optional)", type: "url", help: "Upload via a separate tool or paste a public URL." },
  { key: "rating", label: "Rating (1–5)", type: "number" },
  { key: "review", label: "Review text", type: "textarea" },
];
```

**Note:** the existing `EntityForm` supports `image` and `url` types but not a generic file upload. Pasting a URL is the path of least resistance; if a richer upload UX is needed it's a follow-up.

- [ ] **Step 3: Build**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npm run build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add components/PageContent.tsx app/admin/_components/forms.ts
git commit -m "feat(reviews): per-review video + placeholder graphic"
```

---

## Phase 6 — Homepage videos placeholder

### Task 6.1: VideoPlaceholderCard + integration

**Files:**
- Create: `app/components/VideoPlaceholderCard.tsx`
- Modify: `app/components/PageContent.tsx`

- [ ] **Step 1: Write the placeholder card**

```tsx
export function VideoPlaceholderCard() {
  return (
    <div className="relative w-[320px] aspect-[9/16] rounded-[2rem] overflow-hidden shadow-lg shrink-0 bg-gradient-to-br from-stone-100 to-stone-300 flex items-center justify-center">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor" className="text-stone-50/90" aria-hidden>
        <path d="M8 5v14l11-7L8 5z" />
      </svg>
      <p className="absolute bottom-5 left-0 right-0 text-center text-sm text-stone-50/90 font-medium">Video coming soon</p>
    </div>
  );
}
```

- [ ] **Step 2: Render it in `PageContent.tsx` when no videos exist**

Locate the existing videos section ("Watch us at work"). Change the inner JSX from `<Marquee>{videos.map(...)}</Marquee>` to conditionally render the placeholder when `videos.length === 0`:

```tsx
{videos.length === 0 ? (
  <div className="flex justify-center px-6"><VideoPlaceholderCard /></div>
) : (
  <Marquee durationSec={80}>
    {videos.map((v: any) => (
      <ShortVideoCard key={v.id} src={v.video} poster={v.poster} caption={v.caption} />
    ))}
  </Marquee>
)}
```

Add the import: `import { VideoPlaceholderCard } from "./VideoPlaceholderCard";`.

- [ ] **Step 3: Build**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npm run build
```

Expected: success.

- [ ] **Step 4: Commit**

```bash
git add components/VideoPlaceholderCard.tsx components/PageContent.tsx
git commit -m "feat(public): video placeholder card when no ShortVideo rows exist"
```

---

## Phase 7 — Safety items

### Task 7.1: Data loader

**Files:**
- Modify: `app/lib/data.ts`

- [ ] **Step 1: Add tag + loader**

Extend `TAGS` with `safety: "safety"`. Then add:

```ts
export type SafetyItemRow = {
  id: string;
  audience: string;
  title: string;
  body: string;
  photo: string | null;
  sort_order: number | null;
};

export const getSafetyItems = unstable_cache(
  async (audience: "kids" | "adults"): Promise<SafetyItemRow[]> => {
    return withTimeout<SafetyItemRow[]>(
      async () => (await db.safetyItem.findMany({
        where: { audience: { in: [audience, "both"] } },
        orderBy: [{ sort_order: "asc" }],
      })) as SafetyItemRow[],
      [],
    );
  },
  ["safety_items_by_audience"],
  { tags: [TAGS.safety], revalidate: 3600 },
);
```

The `safety_items` cache invalidation case in the admin route was already added in Task 4.1.

### Task 7.2: SafetyItems component + integration on piercing pages

**Files:**
- Create: `app/components/SafetyItems.tsx`
- Modify: `app/components/PiercingAudienceContent.tsx`
- Modify: `app/app/(site)/piercing/kids/page.tsx` + `.../adults/page.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Image from "next/image";
import type { SafetyItemRow } from "@/lib/data";

export function SafetyItems({ items }: { items: SafetyItemRow[] }) {
  if (items.length === 0) return null;
  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-10 text-center">What makes us safe?</h2>
      <div className="space-y-8">
        {items.map((it) => (
          <div key={it.id} className="grid md:grid-cols-[260px_1fr] gap-6 items-start">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100">
              {it.photo && (
                <Image src={it.photo} alt={it.title} fill className="object-cover" sizes="(min-width: 768px) 260px, 100vw" />
              )}
            </div>
            <div>
              <h3 className="font-serif text-xl text-stone-900 mb-2">{it.title}</h3>
              <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{it.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Pass items down**

In both `piercing/kids/page.tsx` and `piercing/adults/page.tsx`, add to the `Promise.all`:

```ts
const safetyItems = await getSafetyItems("kids"); // or "adults"
```

and pass as `<PiercingAudienceContent … safetyItems={safetyItems} />`.

- [ ] **Step 3: Render in `PiercingAudienceContent.tsx`**

Accept the new prop:

```tsx
safetyItems: SafetyItemRow[];
```

Import the component and render right above the existing piercing photos gallery section:

```tsx
import { SafetyItems } from "./SafetyItems";
// …in the JSX:
<SafetyItems items={safetyItems} />
```

- [ ] **Step 4: Build**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npm run build
```

Expected: success.

- [ ] **Step 5: Commit**

```bash
git add components/SafetyItems.tsx components/PiercingAudienceContent.tsx app/\(site\)/piercing/kids/page.tsx app/\(site\)/piercing/adults/page.tsx lib/data.ts
git commit -m "feat(piercing): What-makes-us-safe section + loader"
```

### Task 7.3: Admin pages for safety items

**Files:**
- Create: `app/app/admin/safety-items/page.tsx`
- Create: `app/app/admin/safety-items/new/page.tsx`
- Create: `app/app/admin/safety-items/[id]/page.tsx`
- Modify: `app/app/admin/_components/forms.ts`
- Modify: `app/app/admin/_components/AdminShell.tsx`

- [ ] **Step 1: Add field def**

```ts
export const SAFETY_ITEM_FIELDS: FieldDef[] = [
  { key: "audience", label: "Audience (kids / adults / both)", required: true, placeholder: "both" },
  { key: "title", label: "Title", required: true },
  { key: "body", label: "Body", type: "textarea", required: true },
  { key: "photo", label: "Photo", type: "image" },
  { key: "sort_order", label: "Sort order", type: "number" },
];
```

- [ ] **Step 2: List page**

```tsx
// app/app/admin/safety-items/page.tsx
import { EntityList } from "../_components/EntityList";

type Row = { id: string; audience: string; title: string; photo: string | null; sort_order: number | null };

export default function Page() {
  return (
    <EntityList<Row>
      table="safety_items"
      title="What makes us safe"
      basePath="/admin/safety-items"
      columns={[
        { key: "photo", label: "Photo", image: true },
        { key: "audience", label: "Audience" },
        { key: "title", label: "Title" },
        { key: "sort_order", label: "Sort" },
      ]}
    />
  );
}
```

- [ ] **Step 3: New + edit pages**

`app/admin/safety-items/new/page.tsx`:

```tsx
import { EntityForm } from "../../_components/EntityForm";
import { SAFETY_ITEM_FIELDS } from "../../_components/forms";

export default function Page() {
  return <EntityForm table="safety_items" fields={SAFETY_ITEM_FIELDS} returnTo="/admin/safety-items" defaults={{ audience: "both", sort_order: 0 }} />;
}
```

`app/admin/safety-items/[id]/page.tsx`:

```tsx
"use client";
import { use } from "react";
import { EntityForm } from "../../_components/EntityForm";
import { SAFETY_ITEM_FIELDS } from "../../_components/forms";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EntityForm table="safety_items" id={id} fields={SAFETY_ITEM_FIELDS} returnTo="/admin/safety-items" />;
}
```

- [ ] **Step 4: Sidebar entry**

In `AdminShell.tsx`'s NAV_GROUPS, add to the **"Piercing"** group:

```ts
{ href: "/admin/safety-items", label: "What makes us safe" },
```

- [ ] **Step 5: Build + commit**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npm run build
git add app/admin/safety-items app/admin/_components/forms.ts app/admin/_components/AdminShell.tsx
git commit -m "feat(admin): safety items CRUD"
```

---

## Phase 8 — "Locate us" button on piercing pages

### Task 8.1: Add the button

**Files:**
- Modify: `app/components/PiercingAudienceContent.tsx`

- [ ] **Step 1: Add constant + button**

Near the top of `PiercingAudienceContent.tsx`, after imports, add:

```ts
const MAPS_URL = "https://maps.app.goo.gl/4Aez6HYucSTLEqp57";
```

Inside the hero / CTA section (where the existing WhatsApp button lives), add an anchor button next to it:

```tsx
<a
  href={MAPS_URL}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/80 border border-stone-200 text-stone-900 text-sm font-medium hover:bg-white shadow-sm"
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  Locate us
</a>
```

- [ ] **Step 2: Build**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add components/PiercingAudienceContent.tsx
git commit -m "feat(piercing): Locate-us button (Google Maps short link)"
```

---

## Phase 9 — Final verification + outer-repo submodule bump

### Task 9.1: Run full build and manual smoke checks

**Files:** N/A

- [ ] **Step 1: Full build**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npx tsc --noEmit
npm run build
```

Expected: both succeed.

- [ ] **Step 2: Start dev server (separate terminal)**

```bash
cd /Users/vanshsood/Projects/zenspace/app
npm run dev
```

Note the port (likely 3000 or 3001 if 3000 is taken).

- [ ] **Step 3: Manual smoke checklist**

Go through each page and confirm:

  1. **Header** (`/`): logo.jpg image renders on the left; "Zenspace" bold + "Tattoo and piercing" light beside it.
  2. **Homepage Process**: Custom Design / Cover Up / Piercing each open a modal with seeded fields when clicked. After Care opens `/assets/aftercare.pdf` in a new tab. Submit a form via the modal → confirm the success state; verify a row appears in `/admin/submissions`.
  3. **Homepage videos**: with 0 `ShortVideo` rows, a single "Video coming soon" placeholder card appears in the strip.
  4. **Homepage reviews**: with ≥2 admin reviews, defaults disappear; with 1 admin review you see 1 real + 1 placeholder; the "Follow us on Instagram →" link appears whenever `site_settings.instagram` is set.
  5. **Admin → Reviews → Edit**: a "Client video (optional)" field is visible.
  6. **Piercing pages** (`/piercing/kids`, `/piercing/adults`): "Choose your earrings" cards link to `/piercing/earrings/<slug>`. The new "What makes us safe?" section renders below the existing content. "Locate us" button opens the Google Maps URL in a new tab.
  7. **Earring category page** (`/piercing/earrings/gold` etc.): renders hero + product grid; "More designs coming soon" when no products.
  8. **Admin → Earring categories**: list shows Stainless Steel / Gold / Silver per audience (from backfill). Adding a product to Gold appears immediately on `/piercing/earrings/gold` (after a refresh).
  9. **Admin → Booking forms**: list shows all 3 seeded forms; editing one shows the seeded fields; adding a new field appears in the public modal on next page load.
  10. **Admin → Safety items**: CRUD works; adding an item with audience=kids shows on `/piercing/kids`.

- [ ] **Step 4: If any check fails**

Re-open the relevant phase, run the targeted task again, fix, recommit. Do **not** mark Phase 9 complete until every item above passes.

### Task 9.2: Bump submodule pointer in outer repo

**Files:** outer-repo `app` submodule reference

- [ ] **Step 1: Commit submodule pointer**

```bash
cd /Users/vanshsood/Projects/zenspace
git add app
git status --short
git commit -m "chore: bump app submodule for batch 2 site revamp"
git log -1 --oneline
```

Expected: a single commit updating the `app` submodule pointer. (Do not stage `photos/` — that's pre-existing untracked content unrelated to this work.)

---

## Out of scope (deferred)

- Email or WhatsApp notification on new form submissions
- Drag-sort UX for service form fields (admin sets `sort_order` numerically)
- Pretty UI for the `type`/`required`/`options` columns in the field editor (current implementation uses raw text + admin-route coercion)
- Dropping the legacy `EarringOption` table and migrating its admin away (done in a follow-up once new categories are verified in production)
- Admin-editable `MAPS_URL` (move into `site_settings.maps_url` later)
