---
name: Editor text undo/redo
overview: Add an application-level undo/redo stack for text editing, drag-move, and resize by snapshotting restorable state at the right transaction boundaries, then applying snapshots on undo/redo while keeping React state (`textValues`, `zoneStates`) in sync with `svgDocRef`.
todos:
  - id: history-types
    content: Add EditorHistoryEntry { svg, zoneStates } + stack helpers + isApplyingHistoryRef guard
    status: completed
  - id: capture-push
    content: Wire capture on inline first-input, panel focus-once, txt/resize mousedown+mouseup wasDrag
    status: completed
  - id: apply-undo-redo
    content: "Implement applySnapshot: parse doc, setZoneStates, rescan textValues, bump previewVersion"
    status: completed
  - id: ui-shortcuts
    content: Add toolbar Undo/Redo + keyboard shortcuts guarded by input focus
    status: completed
isProject: false
---

# Text undo/redo in SVG editor

## Current behavior (relevant to history)

- **Source of truth for export/cart** is `[svgDocRef](app/editor/[id]/page.tsx)` (parsed `Document`). The preview is built by serializing this doc each time `[previewVersion](app/editor/[id]/page.tsx)` changes (`[useEffect` ~254+](app/editor/[id]/page.tsx)).
- **Text content**: React `[textValues](app/editor/[id]/page.tsx)` mirrors editable fields; inline editor and panel update `svgDocRef` during typing (`input` / `onChange`).
- **Move**: `[onMouseMove](app/editor/[id]/page.tsx)` for `drag.type === "txt"` mutates `x`/`y` on tspans (or `<text>`) in both `svgDocRef` and the live preview clone.
- **Resize**: `[onMouseMove](app/editor/[id]/page.tsx)` for `drag.type === "resize"` updates `font-size`, tspan spacing, and positions (`applyFontSize`, `respaceTspansByFontSize`, `updatePosition`).
- **Images**: a separate `[useEffect` on `zoneStates](app/editor/[id]/page.tsx)` (lines ~190–251) mutates the same `svgDocRef` for image zones.

Because `**zoneStates` also writes into `svgDocRef`**, a robust approach is to store **both** in each history entry so undo/redo does not leave the side panel / image effect fighting a restored SVG.

## Recommended snapshot shape

Each history entry:

- `svg: string` — `new XMLSerializer().serializeToString(svgDocRef.current)` (full document).
- `zoneStates: Record<string, ImageZoneState>` — **deep clone** of current `[zoneStates](app/editor/[id]/page.tsx)` (e.g. `structuredClone` or `JSON` if acceptable for your targets; note `b64` strings are large).

Keep `**past`** and `**future`** stacks (max depth ~20–30 to cap memory), plus an `**isApplyingHistoryRef`** flag to avoid recording history while applying undo/redo.

## When to push a “before” snapshot onto `past` (and clear `future`)

Only when `!isApplyingHistoryRef`:


| Action               | When to push                                                        | Notes                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inline text edit** | On **first `input`** of an open overlay session                     | Doc already mutates every keystroke; one undo step per editing session. Use a ref flag reset when opening/closing the overlay.                                                    |
| **Left panel text**  | On **focus** of a field, once per focus (or debounced first change) | Avoids one stack entry per keystroke. Reset the flag on **blur**.                                                                                                                 |
| **Text drag**        | On **mouseup** if `wasDrag`                                         | On **mousedown** (when `drag` is set for `txt`), store `snapshotBefore = captureHistoryEntry()` in a ref; on **mouseup** if moved, `pushPast(snapshotBefore)` and clear `future`. |
| **Resize**           | Same pattern as drag                                                | Store `snapshotBefore` on mousedown when resize starts; push on **mouseup** if `wasDrag`.                                                                                         |


Do **not** push on click-to-edit when the user never moves the mouse (no drag): only store `snapshotBefore` on mousedown and **discard** it if `!wasDrag` on mouseup for text drag/resize.

## Undo / redo application

1. **Undo** (if `past` non-empty): serialize **current** entry, `pop` **previous** from `past`, `push` current onto `future`, set `isApplyingHistoryRef = true`, replace `svgDocRef` by parsing `previous.svg`, `setZoneStates(previous.zoneStates)`, **rebuild `textValues`** by scanning `[id^="editable_"]` elements (same pattern as initial load ~138–142), `setTextValues(...)`, `setPreviewVersion(v => v+1)`, then `isApplyingHistoryRef = false`.
2. **Redo**: symmetric using `future` and `past`.
3. Ensure any **open** inline overlay is closed or ignored when undo runs (or skip if overlay open—simplest is to close overlay first or document “close editor before undo”).

## UI and shortcuts

- Add **Undo** / **Redo** controls in the top bar (`[~1269+](app/editor/[id]/page.tsx)`), disabled when `past.length === 0` / `future.length === 0`.
- **Keyboard**: `Ctrl+Z` / `Cmd+Z` and `Ctrl+Shift+Z` / `Cmd+Shift+Z` — use a `window` `keydown` listener with `**if (target is INPUT/TEXTAREA or contentEditable) return`** so native undo still works while typing in panel or inline overlay. Optionally focus the preview container with `tabIndex={0}` for canvas-focused shortcuts.

## File organization

- Implement a small helper module (e.g. `[lib/editor-text-history.ts](lib/editor-text-history.ts)`) with pure types + stack helpers, **or** keep helpers colocated in `[page.tsx](app/editor/[id]/page.tsx)` if you prefer minimal file count.
- Wire `captureHistoryEntry`, `pushPastIfNeeded`, `undo`, `redo` from `[EditorPage](app/editor/[id]/page.tsx)` using refs for stacks (avoid re-rendering on every keystroke); use **minimal state** (`historyTick`) only to re-enable/disable toolbar buttons if needed.

## Edge cases to handle explicitly

- **Panel `onChange`** currently sets `docEl.textContent` (line ~1309), which can break multiline `tspan` structure; undo snapshots still restore the full SVG. No change required for undo/redo itself, but be aware when testing.
- **Initial load**: do not seed `past` until the first user-driven text action.
- **Memory**: cap stack depth; document that very large embedded images in `zoneStates` multiply memory use.

## Testing checklist

- Type in inline editor → undo restores previous text; redo restores.
- Type in left panel (one session) → single undo step.
- Drag text → undo restores position; redo restores.
- Resize text → undo restores size/position; redo restores.
- Upload image, then edit text → undo text does not corrupt image UI (paired snapshot).

