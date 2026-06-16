# Template Editor Features

The template editor is a powerful, interactive SVG-based field editor that allows users to customize templates before purchasing. Below is a comprehensive list of its current features:

## General Capabilities
- **Live SVG Preview**: A real-time, interactive preview area that renders the template and updates instantly as changes are made.
- **Undo / Redo System**: Full history tracking (Ctrl+Z / Ctrl+Shift+Z) to easily revert or re-apply changes.
- **Export to PDF**: High-quality rasterization and PDF generation for downloading or printing customized templates.
- **Selection Management**: Select single or multiple elements (text, stickers) at once.
- **Duplicate & Delete**: Quickly duplicate or delete selected elements using a dedicated "Selection" toolbar or keyboard shortcuts (Delete/Backspace).

## Text Field Editing
- **Auto-Detection**: Automatically identifies text elements in the SVG designated as editable (e.g., `id="editable_*"`).
- **Inline Editing**: Edit text directly by clicking on the element in the preview.
- **Multi-line Support**: The inline editor automatically provides a multi-line input area for paragraphs and standard inputs for single lines.
- **Font Sizing**: Increase or decrease the font size dynamically using dedicated `+` / `-` buttons in the sidebar.
- **Drag & Position**: Click and drag to reposition text elements freely across the canvas.

## Image Zones
- **Auto-Detection**: Automatically identifies predefined image drop zones (e.g., `id="image_zone_*"`).
- **Image Uploading**: Upload local image files directly into specific zones via the sidebar.
- **Image Panning**: Click and drag the uploaded image within the preview to adjust its position (masked inside the zone).
- **Zoom Control**: Use a sidebar slider to zoom in/out (scale 100% to 300%) on the uploaded image.
- **Image Flipping**: Horizontal flip control to mirror the uploaded image without affecting the mask zone.
- **Remove & Replace**: Easily remove an uploaded image or swap it out for a new one.

## Stickers
- **Sticker Library**: Browse categorized stickers through a dedicated dropdown in the sidebar.
- **Drag & Drop**: Drag stickers from the library directly onto the SVG preview canvas to place them exactly where you want.
- **Click to Add**: Click any sticker to instantly add it to the center of the canvas.
- **Resizing & Repositioning**: Resize handles on selected stickers allow scaling, and they can be freely dragged around the canvas.

## UI / UX Enhancements
- **Hover Overlays & Handles**: Visually displays bounding boxes and resize handles when hovering or selecting elements.
- **Contextual Left Panel**: The sidebar dynamically changes to show relevant controls based on what is selected in the preview.
- **Performance Optimization**: Fast rendering and interaction handling using optimized state management and direct DOM manipulation for the SVG canvas.
