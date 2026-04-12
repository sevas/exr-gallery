# Image Viewer Specification

## Overview

The Image Viewer is a web-based image analysis tool for viewing and analyzing raster images. It supports multiple image formats, pixel-level inspection, histogram analysis, and specialized Bayer pattern visualization.

## Supported Formats

| Format | Extension | Bit Depth | Notes |
|--------|-----------|-----------|-------|
| PNG | `.png` | 8-bit | Grayscale and RGB |
| JPEG | `.jpg`, `.jpeg` | 8-bit | RGB only |
| OpenEXR | `.exr` | 32-bit float | HDR support, grayscale and RGB |

## Features

### Image Loading

- **Sample Images**: Dropdown menu with pre-loaded test images
- **File Upload**: Local file picker supporting PNG, JPG, and EXR formats
- Images are loaded into memory as RGBA float32 arrays for uniform processing

### View Controls

#### Pan & Zoom
- **Pan**: Click and drag to pan the image
- **Zoom**: Mouse wheel to zoom in/out
  - Normal scroll: 10% zoom step
  - Ctrl + scroll: 100% zoom step (fast zoom)
- **Zoom Range**: 10% to 5000%
- **Reset View**: Button to reset pan and zoom to default

#### Rendering
- Pixelated rendering (nearest neighbor) when zoom ≥ 400%
- Smooth rendering (bilinear) when zoom < 400%

### Level Adjustment

- **Min/Max Levels**: Double slider with numeric inputs on each side
- **Range**: Automatically initialized to image min/max values
- **Auto Button**: Reset levels to image statistics
- **Mapping**: Linear mapping from [min, max] to display range [0, 255]

### Colormaps (Grayscale Images Only)

| Colormap | Description |
|----------|-------------|
| Grayscale | Linear black to white gradient |
| Viridis | Perceptually uniform, colorblind-friendly (purple → yellow) |
| Plasma | Perceptually uniform (purple → orange → yellow) |

### Pixel Picker

- Displays coordinates and value under mouse cursor
- **Grayscale**: Shows single value
- **RGB**: Shows R, G, B values
- **Float images**: 4 decimal places
- **Integer images**: Whole numbers

### Rectangle Selection & Histogram

1. Click "Select Area" button to enter selection mode
2. Click and drag to draw rectangle on image
3. Histogram panel appears showing value distribution:
   - **Grayscale**: White bars
   - **RGB**: Overlapping red/green/blue bars with transparency
4. X-axis: Value range (min to max in selection)
5. Y-axis: Pixel count
6. Header shows total pixel count in selection
7. "Clear Selection" button to remove selection

### Bayer Pattern Support

For images with "bayer" in the filename:

- **Channel Selector**: Dropdown to select R, G1, G2, B, or All
- **RGGB Pattern Layout**:
  ```
  R  G1 R  G1 ...
  G2 B  G2 B  ...
  R  G1 R  G1 ...
  ```
- **Channel Extraction**: Selected channel creates new half-size image (width/2 × height/2)
- Extracted image contains only the selected channel's pixels

| Channel | Source Pixels |
|---------|---------------|
| R | Even rows, even columns |
| G1 | Even rows, odd columns |
| G2 | Odd rows, even columns |
| B | Odd rows, odd columns |

### Status Bar

Displays image metadata:
- Filename
- Dimensions (width × height)
- Color mode (Grayscale / RGB)
- Data type (uint8 / float32)
- Value range [min - max]

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Image Viewer                                        │
├─────────────────────────────────────────────────────┤
│ [Sample Images ▼] [Upload] [Levels ═══●═══●═══]    │
│ [Colormap ▼] [Bayer ▼] [Zoom: 100%] [-][+][Reset]  │
│ [📊 Select Area] [Clear Selection]                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│                   ┌──────────┐      ┌─────────────┐│
│                   │  Image   │      │(x, y) Val   ││
│                   │  Canvas  │      └─────────────┘│
│                   │          │      ┌─────────────┐│
│                   │          │      │ Histogram   ││
│                   └──────────┘      │ ▄▄▆█▇▅▃▂▁   ││
│                                     │ 0.00  255.00││
│                                     └─────────────┘│
├─────────────────────────────────────────────────────┤
│ filename.png │ 800×600 │ RGB │ uint8 │ [0 - 255]   │
└─────────────────────────────────────────────────────┘
```

## Technical Implementation

### Dependencies
- React 18+
- Three.js EXRLoader (for OpenEXR support)
- HTML5 Canvas API

### Data Flow
1. Image loaded → decoded to RGBA array
2. Statistics computed (min, max, mean)
3. On render: levels applied → colormap applied → canvas drawn
4. Transform (pan/zoom) applied via canvas context

### Performance Considerations
- Images stored as typed arrays (Uint8Array or Float32Array)
- Rendering uses offscreen canvas for level/colormap processing
- Histogram binning uses 256 bins with dynamic normalization
