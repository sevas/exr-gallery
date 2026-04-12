# Image Viewer Specification

## Overview

The Image Viewer is a web-based image analysis tool for viewing and analyzing raster images. It supports multiple image formats, pixel-level inspection, multiple ROI histogram analysis with statistics, and specialized Bayer pattern visualization.

## Supported Formats

| Format | Extension | Bit Depth | Notes |
|--------|-----------|-----------|-------|
| PNG | `.png` | 8-bit | Grayscale and RGB |
| JPEG | `.jpg`, `.jpeg` | 8-bit | RGB only |
| OpenEXR | `.exr` | 32-bit float | HDR support, grayscale and RGB |

## Features

### Image Loading

- **Sample Images**: Dropdown menu with pre-loaded test images including:
  - Natural photos (river, leaves, coast) in color, grayscale, and Bayer versions
  - Noise test images (quadrant and gradient variations)
  - Gradient and checkerboard patterns
  - HDR EXR test patterns
- **File Upload**: Local file picker supporting PNG, JPG, and EXR formats
- Images are loaded into memory as RGBA float32 arrays for uniform processing

### View Controls

#### Pan & Zoom
- **Pan**: Click and drag to pan the image
- **Zoom**: Mouse wheel to zoom in/out (centered on mouse position)
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
- **Bayer mode**: Only shows value when hovering over selected channel pixels

### Multiple ROI Selection & Histogram

1. Click "Select Area" button to enter selection mode
2. Click and drag to draw rectangle on image (Shift+drag to pan while in selection mode)
3. Multiple ROIs supported - each creates a separate histogram panel
4. ROIs are color-coded with matching rectangle outlines and histogram headers
5. Histogram panels display:
   - **Header**: ROI number, pixel count, close button
   - **Plot**: Value distribution
     - Grayscale: White bars
     - RGB: Overlapping red/green/blue bars with transparency
   - **X-axis**: Value range (min to max in selection)
   - **Y-axis**: Pixel count
   - **Statistics**: μ (mean), σ (standard deviation), SNR (signal-to-noise ratio)
6. ROIs are cleared when changing images
7. Close individual ROIs with × button on histogram panel

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
- Histogram and pixel picker filter to selected channel pixels only

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
│ [📊 Select Area]                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│      ┌────────────────┐         ┌─────────────────┐│
│      │    ┌────┐      │         │(x, y) Val       ││
│      │    │ROI1│ Image│         └─────────────────┘│
│      │    └────┘      │         ┌─ROI 1 (1024 px)─┐│
│      │         ┌────┐ │         │ ▄▄▆█▇▅▃▂▁    [×]││
│      │         │ROI2│ │         │ μ=128 σ=15 SNR=8││
│      │         └────┘ │         ├─ROI 2 (512 px)──┤│
│      └────────────────┘         │ ▂▃▅▇█▇▅▃▂    [×]││
│                                 │ μ=100 σ=25 SNR=4││
│                                 └─────────────────┘│
├─────────────────────────────────────────────────────┤
│ filename.png │ 800×600 │ RGB │ uint8 │ [0 - 255]   │
└─────────────────────────────────────────────────────┘
```

## Sample Images

### Natural Photos
- `photo_river.jpg` - River landscape
- `photo_leaves.jpg` - Autumn leaves
- `photo_coast.jpg` - Coastal scene
- Grayscale versions (`_gray.png`)
- Bayer RGGB versions (`_bayer.png`)

### Noise Test Images
- `noise_rgb.png`, `noise_gray.png`, `noise_bayer.png` - Four quadrants with σ=5, 15, 30, 60
- `noise_gradient_rgb.png`, `noise_gradient_gray.png`, `noise_gradient_bayer.png` - σ varies 2→50 left to right

### Test Patterns
- `gradient_gray.png` - Horizontal grayscale gradient
- `gradient_rgb.png` - Horizontal color ramp
- `checkerboard_gray.png` - 32px checkerboard pattern
- `testpattern_gray.exr`, `testpattern_rgb.exr` - HDR test patterns

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
5. ROI selections overlay drawn with color-coded rectangles

### Performance Considerations
- Images stored as typed arrays (Uint8Array or Float32Array)
- Rendering uses offscreen canvas for level/colormap processing
- Histogram binning uses 256 bins with dynamic normalization
- ROI statistics computed on-demand when selection completes
