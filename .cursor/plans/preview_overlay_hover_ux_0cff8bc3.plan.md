---
name: Preview overlay hover UX
overview: Show editable text + sticker overlay rects only when the mouse is inside the preview; keep selected element visible outside; add hover highlight fill for the hovered element only.
todos:
  - id: hover-state
    content: Add preview hover state (mouseenter/leave) and expose to preview logic.
    status: completed
  - id: overlay-visibility
    content: Hide/show text + sticker overlays based on preview hover state, while keeping selected overlay visible outside preview.
    status: completed
  - id: hover-fill
    content: Implement hovered overlay fill (#e6dcdc17) for text and stickers, only for hovered element.
    status: completed
  - id: qa
    content: Verify behavior across selection, drag/resize, and preview rebuilds.
    status: completed
isProject: false
---

# Preview Overlay Hover UX Plan

## Goal

Update the SVG preview overlay behavior in the editor so:

- When the mouse is **outside** the preview, **no dotted rect overlays** are shown for editable text or stickers **except** the currently selected element (if any).
- When the mouse is **inside** the preview, dotted rect overlays are shown around **all** editable text and stickers.
- When hovering a specific editable text or sticker, its overlay rect gets a subtle fill `#e6dcdc17` while keeping the border.

## Primary file

- [app/editor/[id]/page.tsx](/home/hemendra/Banana/Software Projects/Greeting Card E-commerce/Codebase/frontend/app/editor/[id]/page.tsx)

## Current implementation notes (what we’ll leverage)

- Text overlays are created as `<rect id="overlay_${tid}" data-text-zone="${tid}">`.
- Sticker overlays are created as `<rect id="sticker_overlay_${sid}" data-sticker-zone="${sid}">`.
- Selection state exists for text (`renderTextHandles`) and stickers (`renderStickerHandles`) and is rebuilt each preview render.

## Implementation approach

### 1) Track whether mouse is inside preview

- Add a React state/ref, e.g. `isPreviewHovering`, updated by:
  - `onMouseEnter` / `onMouseLeave` on the preview container (`previewContainerRef` div).
- Ensure this state is available inside the preview-render effect.

### 2) Control overlay visibility based on hover state + selection

Inside the preview-render effect (after overlays are created):

- If `isPreviewHovering` is `false`:
  - Hide all text overlays (`#overlay_`*) and sticker overlays (`#sticker_overlay_`*) by setting `style.display = "none"`.
  - If a selected text id exists, re-show only that overlay (`display = ""`) and render its handles.
  - If a selected sticker id exists, re-show only that overlay (`display = ""`) and render its handles.
- If `isPreviewHovering` is `true`:
  - Show all overlays (`display = ""`).
  - Keep current selection behavior unchanged.

### 3) Add hover highlight fill (only hovered overlay)

- Add listeners to the rendered `svgEl` for `mouseover`/`mouseout` (or `mousemove`) and detect:
  - `target.closest('[data-text-zone]')`
  - `target.closest('[data-sticker-zone]')`
- On hover of a specific overlay:
  - Set its `fill` attribute to `#e6dcdc17`.
  - Reset all other overlays’ fill to `transparent` (or empty) so only the hovered one is filled.
- On leaving overlays (or leaving preview):
  - Reset all overlay fills back to transparent.

### 4) Edge cases

- During drag/resize, hover effects should not cause flicker:
  - Prefer to keep the currently interacted overlay highlighted (treat as hovered).
- If both a text and sticker could be “selected”, prioritize the most recent selection when deciding what stays visible outside preview.

## Verification checklist

- Mouse outside preview: no overlay rects visible; if an element is selected, only its rect + handles remain visible.
- Mouse inside preview: all overlay rects visible for editable text and stickers.
- Hover a text overlay: only that rect gets fill `#e6dcdc17`.
- Hover a sticker overlay: only that rect gets fill `#e6dcdc17`.
- Move mouse off overlays (still inside preview): fill clears, borders remain.
- Undo/redo and preview rebuilds do not break overlay visibility/hover behavior.

