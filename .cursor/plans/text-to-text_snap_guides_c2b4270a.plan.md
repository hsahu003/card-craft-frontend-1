---
name: Text-to-Text Snap Guides
overview: Add peer text alignment guides/snapping so dragging one editable text can align to another editable text’s edges and center axes. Reuse current drag and guide infrastructure with minimal changes in snapping inputs and guide rendering.
todos:
  - id: peer-snap-api
    content: Add peer-aware text snapping helper and return guide metadata.
    status: completed
  - id: collect-peer-boxes
    content: Collect other editable text box geometries during text drag in page.tsx.
    status: completed
  - id: render-peer-guides
    content: Render vertical/horizontal peer guides with existing guide primitives.
    status: completed
  - id: apply-peer-snaps
    content: Apply snapped target positions via existing shiftX/shiftY transform path.
    status: completed
  - id: verify-peer-alignment
    content: Validate all six alignment types across multiline/single-line texts and edge cases.
    status: completed
isProject: false
---

# Implement Text-to-Text Alignment Snap Guides

## Goal

Enable dragging `editable_` text A to snap relative to text B with guides for:

- left-to-left
- right-to-right
- top-to-top
- bottom-to-bottom
- center-x to center-x
- center-y to center-y

## Current integration points

- Drag loop already computes live text box and calls snapping in `[/home/hemendra/Banana/Software Projects/Greeting Card E-commerce/Codebase/frontend/app/editor/[id]/page.tsx](/home/hemendra/Banana/Software%20Projects/Greeting%20Card%20E-commerce/Codebase/frontend/app/editor/%5Bid%5D/page.tsx)`.
- Canvas/frame snapping utility and guide primitives are in `[/home/hemendra/Banana/Software Projects/Greeting Card E-commerce/Codebase/frontend/lib/editor-svg-utils.ts](/home/hemendra/Banana/Software%20Projects/Greeting%20Card%20E-commerce/Codebase/frontend/lib/editor-svg-utils.ts)`.

## Plan

1. Extend snapping utility to support peer targets

- In `[/home/hemendra/Banana/Software Projects/Greeting Card E-commerce/Codebase/frontend/lib/editor-svg-utils.ts](/home/hemendra/Banana/Software%20Projects/Greeting%20Card%20E-commerce/Codebase/frontend/lib/editor-svg-utils.ts)`, add a new function (or extend `applySnap`) that accepts:
  - dragged box geometry (`cx`, `cy`, `w`, `h`)
  - optional peer text boxes (excluding the dragged id)
- For each peer, compute candidate alignments for:
  - `left`, `right`, `top`, `bottom`, `cx`, `cy`
- Choose nearest candidate per axis within threshold; return snapped position + selected peer guide metadata.

1. Gather peer text boxes during drag

- In text-drag branch of `[/home/hemendra/Banana/Software Projects/Greeting Card E-commerce/Codebase/frontend/app/editor/[id]/page.tsx](/home/hemendra/Banana/Software%20Projects/Greeting%20Card%20E-commerce/Codebase/frontend/app/editor/%5Bid%5D/page.tsx)`, compute all other editable text overlay rects using existing `overlay_<tid>` rects / `textOverlayRect(...)`.
- Pass these peer boxes into the new peer-aware snap function each `mousemove`.

1. Render peer alignment guides

- Reuse `createGuideLine(...)` + `hideGuides(...)` in `[/home/hemendra/Banana/Software Projects/Greeting Card E-commerce/Codebase/frontend/lib/editor-svg-utils.ts](/home/hemendra/Banana/Software%20Projects/Greeting%20Card%20E-commerce/Codebase/frontend/lib/editor-svg-utils.ts)`.
- Draw guide lines at matched peer coordinates:
  - vertical guides for `left/right/cx`
  - horizontal guides for `top/bottom/cy`
- Keep current frame guides behavior; if peer snap is chosen on an axis, prefer peer guide for that axis to avoid conflicting visuals.

1. Apply snap to dragged text transform

- Continue current movement model in `[/home/hemendra/Banana/Software Projects/Greeting Card E-commerce/Codebase/frontend/app/editor/[id]/page.tsx](/home/hemendra/Banana/Software%20Projects/Greeting%20Card%20E-commerce/Codebase/frontend/app/editor/%5Bid%5D/page.tsx)`: compute target rect (`nx/ny`) then convert to `shiftX/shiftY` and apply to live/doc tspans.
- Ensure snapping updates overlay rect and handles in real time (existing path already does this).

1. Verify behavior and edge cases

- Two texts with different widths/heights.
- Multiline and single-line combinations.
- Centered (`text-anchor="middle"`) and non-centered text.
- Ensure no snapping to self.
- Confirm guides disappear when leaving threshold.

## Acceptance checks

- Dragging text A near text B edges/centers shows corresponding guide line and snaps at threshold.
- Snap works for all six requested alignments.
- Existing canvas/frame snapping remains functional and non-jittery.
- No regressions in resize, undo/redo, or text edit open/commit flows.

