---
name: rotation-handles
overview: Add rotation handles for editable-text and stickers, with free-drag rotation, selection UI updates, and undo/redo integration.
todos:
  - id: render-rotate-handles
    content: Add rotation handles to `renderTextHandles` and `renderStickerHandles` in `app/editor/[id]/page.tsx` (with dataset attrs).
    status: completed
  - id: rotate-drag-state
    content: Extend `DragState` and update `onMouseDown` to start a rotation drag when the rotation handle is grabbed; capture pending history snapshot and pivot/angles.
    status: completed
  - id: apply-rotation-and-update-overlays
    content: "Implement rotation logic in `onMouseMove`: compute angle from mouse around pivot, set `transform` on both live + svgDoc elements, and update selection overlays + handle positions live."
    status: completed
  - id: sync-rotation-during-move-resize
    content: Update existing text/sticker move + resize handlers to keep `transform` pivot in sync when angle != 0 (prevents drift).
    status: completed
  - id: undo-redo-and-preview-version
    content: Update `onMouseUp` to include rotate types in history snapshot pushing and bump `previewVersion` once per completed rotation drag.
    status: completed
isProject: false
---

## What to implement

Add a new rotation handle to the existing selection handle groups for:

- editable text (`editable_*` rendered as `<text>` with `overlay_...` and resize corner handles)
- stickers (`sticker_*` rendered as `<image>` with `sticker_overlay_...` and resize corner handles)

A user should be able to drag the rotation handle to rotate the selected element.

## Key constraints from the current code

- Selection visuals are rendered by `renderTextHandles(tid)` / `renderStickerHandles(sid)` inside `app/editor/[id]/page.tsx`.
- Drag behavior is handled via `onMouseDown` -> `drag` state -> `onMouseMove` -> `onMouseUp`.
- Undo/redo uses `textHistoryApiRef.current.pendingDragSnapshot = captureHistoryEntry()` at drag start and `pushPastSnapshot()` on drag end.

## Implementation steps (todos)

1. Update selection rendering to include rotation handle
  - File: `[frontend/app/editor/[id]/page.tsx](app/editor/[id]/page.tsx)`
  - In `renderTextHandles(tid)`:
    - Compute selection rect (`overlay_...` x/y/w/h).
    - Add an extra SVG handle (small circle/rect) placed above the top edge at `cx = x + w/2`, `cy = y - offset` (offset based on handle size).
    - Tag it with attributes, e.g. `data-rotate-handle="1"`, `data-rotate-kind="txt"`, `data-rotate-id="<tid>"`.
  - In `renderStickerHandles(sid)`:
    - Same idea but using `sticker_overlay_...` dimensions.
2. Add rotation drag state + math
  - File: `app/editor/[id]/page.tsx`
  - Extend the local `DragState` union with rotation variants:
    - `type: "rotate-txt" | "rotate-sticker"`
    - store: `id`, `overlay`, `sx/sy`, `pivotX/pivotY`, `startAngle`, `startMouseAngle`, and `moved`.
  - In `onMouseDown`:
    - Detect `target.closest('[data-rotate-handle="1"]')`.
    - Resolve element id + kind.
    - Compute pivot:
      - sticker: `pivotX = x + w/2`, `pivotY = y + h/2` from the sticker element attributes.
      - text: `pivotX/pivotY` from `textOverlayRect(liveText)` center.
    - Read current rotation angle from the element (store in `data-rotation-angle` and/or parse `transform="rotate(...)"`).
    - Set `textHistoryApiRef.current.pendingDragSnapshot = captureHistoryEntry()`.
    - Set `drag`.
3. Apply rotation during mouse move + update selection visuals
  - File: `app/editor/[id]/page.tsx`
  - In `onMouseMove` add cases for rotation drag:
    - Convert mouse position from `clientX/clientY` to SVG user units (using `getScale()` and the `svgEl` bounding rect).
    - Compute `currMouseAngle = atan2(mouseY - pivotY, mouseX - pivotX)` and `nextAngle = startAngle + (currMouseAngle - startMouseAngle)`.
    - Set on both live preview element and `svgDocRef.current` element:
      - `data-rotation-angle = nextAngle`
      - `transform = rotate(nextAngle pivotX pivotY)`
    - Update selection overlays:
      - For text: update its `overlay_...` rect using `textOverlayRect(liveText)`.
      - For stickers: update `sticker_overlay_...` bounds using rotated-rect bbox math (rotate the four corners of the unrotated sticker rectangle around pivot, then set min/max into x/y/width/height).
    - Call `renderTextHandles(id)` / `renderStickerHandles(id)` so the rotation handle stays positioned.
4. Keep transform stable during move + resize
  - File: `app/editor/[id]/page.tsx`
  - In existing move/resize handlers for `drag.type === "txt"`, `drag.type === "resize"`, `drag.type === "sticker"`, `drag.type === "stickerResize"`:
    - After applying geometry changes, if the element has a stored non-zero rotation angle, recompute pivot (center) and rewrite the `transform` so rotation remains around the element center.
  - This prevents “rotation drift” when the user drags/resizes a rotated element.
5. Undo/redo + preview rebuild integration
  - File: `app/editor/[id]/page.tsx`
  - In `onMouseUp`:
    - Include rotation drag types in the existing “pushPastSnapshot on wasDrag” condition.
    - For sticker rotation, call `setPreviewVersion(v => v + 1)` when `wasDrag`.
    - For text rotation, call `setPreviewVersion(v => v + 1)` when `wasDrag`.

## Files likely to change

- `frontend/app/editor/[id]/page.tsx`

## Acceptance criteria

- Selecting a sticker shows a rotation handle; dragging it rotates the sticker visually.
- Selecting an editable text shows a rotation handle; dragging it rotates the text visually.
- Rotation selection box/handles update continuously while rotating.
- Undo/redo (`Ctrl+Z` / `Ctrl+Shift+Z`) reverts/reattaches the element rotation.
- After rotation, dragging/resizing the element doesn’t cause rotational pivot drift.

