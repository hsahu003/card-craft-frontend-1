---
name: Sticker import in editor
overview: Add a sticker import panel to the SVG editor with category filtering from `public/assets/stickers`, and implement click-to-add centered stickers that can be dragged, resized, and deleted.
todos:
  - id: add-sticker-config
    content: Add global sticker config and category/item manifest with default category fallback.
    status: completed
  - id: build-sticker-sidebar-ui
    content: Add Stickers section with import toggle, category dropdown, and filtered sticker gallery.
    status: completed
  - id: insert-sticker-svg
    content: Implement click-to-add centered sticker image insertion into editable SVG.
    status: completed
  - id: wire-sticker-interactions
    content: Reuse/extend image interaction handlers for sticker drag, resize, and delete.
    status: completed
  - id: history-preview-integration
    content: Ensure sticker operations update undo/redo and preview refresh consistently.
    status: completed
  - id: validate-sticker-flow
    content: Run end-to-end verification for category filtering, insertion, interactions, and edge cases.
    status: completed
isProject: false
---

# Sticker Import Plan

## Scope

Implement a sticker workflow in the SVG editor with:

- Category dropdown sourced from folder names under `public/assets/stickers`.
- Sticker gallery filtered by selected category.
- Click-to-add behavior that inserts a sticker centered on the canvas.
- Post-insert interactions: drag, resize, and delete (same UX pattern as image objects where possible).
- Global default category configured in code.

## Files to update

- [app/editor/[id]/page.tsx](/home/hemendra/Banana/Software Projects/Greeting Card E-commerce/Codebase/frontend/app/editor/[id]/page.tsx)
- [lib/templates.ts](/home/hemendra/Banana/Software Projects/Greeting Card E-commerce/Codebase/frontend/lib/templates.ts) (only if existing editor config shape should host a pointer to global defaults; otherwise leave unchanged)
- [public/assets/stickers](/home/hemendra/Banana/Software Projects/Greeting Card E-commerce/Codebase/frontend/public/assets/stickers) (read-only source of sticker assets)
- Optional new config helper (recommended):
  - [lib/stickers.ts](/home/hemendra/Banana/Software Projects/Greeting Card E-commerce/Codebase/frontend/lib/stickers.ts)

## Implementation approach

### 1) Add sticker data model + config

- Create a small sticker config/helper module that defines:
  - `DEFAULT_STICKER_CATEGORY` (global constant).
  - Optional typed shape: `StickerCategory`, `StickerItem`.
  - A static manifest (or generated list if project already has one) mapping category -> sticker SVG paths.
- Validate default category against available categories and fallback to first non-empty category.

### 2) Add UI section in editor sidebar

- In field editor sidebar (`page.tsx`), add a new “Stickers” section with:
  - Import/expand control.
  - Category `<select>` bound to `selectedStickerCategory` state.
  - Grid/list of sticker thumbnails for that category.
- Use SVG files directly from `public/assets/stickers/...` paths as preview images.

### 3) Insert sticker into SVG document

- On sticker click:
  - Create SVG image element (`<image>`) in editable SVG root.
  - Set `href` to selected sticker asset path.
  - Compute centered placement in SVG coordinate space.
  - Initialize sensible width/height preserving aspect ratio.
- Track inserted stickers in existing editable object state so they participate in rerenders/preview updates.

### 4) Reuse interaction pipeline (drag/resize/delete)

- Integrate stickers with existing image interaction handlers in `page.tsx`:
  - Selection hit testing.
  - Drag move behavior.
  - Resize handles.
  - Delete action and cleanup.
- Keep behavior consistent with current image-zone UX to minimize new complexity.

### 5) State persistence + history

- Ensure sticker insert/move/resize/delete updates feed existing undo/redo snapshots.
- Ensure preview pane refreshes after sticker operations.

### 6) Guardrails + UX details

- Empty category: show “No stickers available”.
- Invalid default category: auto-fallback and avoid crashes.
- Keep section performant with lightweight thumbnail rendering.

## Verification checklist

- Category dropdown lists all sticker folders.
- Default category preselected from global config.
- Switching category filters sticker gallery correctly.
- Clicking sticker inserts it centered on SVG.
- Inserted sticker can be selected, dragged, resized, deleted.
- Undo/redo works for sticker add/move/resize/delete.
- Preview reflects sticker changes immediately.

