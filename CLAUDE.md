# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build (TypeScript errors are ignored — see next.config.mjs)
npm run lint     # Run ESLint
npm start        # Run production server
```

No test framework is configured.

## Architecture Overview

**Stack:** Next.js 15 App Router · React 19 · Tailwind CSS v4 · shadcn/ui (New York style, Radix UI primitives)

**Two parallel card editors exist:**
- `/app/editor/[id]` — Primary, custom SVG-based editor. Supports undo/redo, multi-select, snap guides, sticker rotation, regional language transliteration, and PDF export (jsPDF). This is the production-quality editor.
- `/app/fabric-editor/[id]` — Secondary, Fabric.js canvas-based editor. Simpler implementation.

**State management:** React Context API only (no Redux/Zustand). All contexts live in `/contexts/` and are mounted in the root layout. Data is persisted to localStorage with user-aware keys (`${key}:${email}` for logged-in users, plain key for guests). On login, guest data merges into user data.

**Auth:** Entirely client-side via `localStorage` (`/lib/auth-storage.ts` + `hooks/useAuth.ts`). No backend auth integration.

**Template data:** Single source of truth in `/lib/templates.ts` — 14 templates with multi-language metadata (English, Hindi, Marathi).

## SVG Editor Conventions

The SVG-based editor (`/app/editor/[id]`) reads editable zones from SVG templates using these `data-*` attributes:
- `data-text-zone` — editable text area
- `data-sticker-zone` — sticker placement area
- `data-img-zone` — image upload zone

Element ID prefixes: `editable_` (text), `image_zone_` (image zones), `sticker_` (stickers).

Undo/redo history is capped at 50 entries. Sticker rotation snaps to 0°, 90°, 180°, 270°, 360°.

SVG utility functions are in `/lib/svg-utils.ts` and `/lib/editor-history.ts`.

## Key Directories

| Path | Purpose |
|------|---------|
| `/app` | Next.js App Router pages and API routes |
| `/app/api/stickers` | GET sticker data by category |
| `/app/api/transliteration` | POST regional language text transliteration |
| `/components/ui` | shadcn/ui primitives (~40 components) |
| `/components/home` | Hero carousel, template grid for homepage |
| `/contexts` | Cart, User, Orders, Wishlist context providers |
| `/hooks` | `useAuth`, `use-mobile`, `use-toast` |
| `/lib` | Shared utilities: SVG tools, editor history, templates, auth |
| `/public` | Static assets and card SVG templates |

## Styling

Tailwind v4 (configured via PostCSS `@tailwindcss/postcss`, not the classic `tailwind.config.js`). Theme uses OKLch color-space CSS custom properties defined in `app/globals.css`. Dark mode via `.dark` class. Path alias `@/*` maps to the project root.

## Notable Config

- `next.config.mjs` has `typescript.ignoreBuildErrors: true` and `images.unoptimized: true`.
- `tsconfig.json` has strict mode enabled.
- shadcn config is in `components.json`.
