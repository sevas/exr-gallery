# EXR Gallery

A web-based image gallery for viewing OpenEXR (HDR) images. Built with React and Vite, this application allows you to browse through a collection of EXR files with carousel navigation and autoplay functionality.

## Features

- 🖼️ **EXR Image Support** - Display OpenEXR high dynamic range images in the browser
- 🎠 **Carousel Navigation** - Browse images with Previous/Next buttons
- ▶️ **Autoplay Mode** - Automatic slideshow with 1-second intervals
- 📊 **Image Metrics** - Displays resolution and load time for each image
- 🎨 **HDR Tone Mapping** - Automatic exposure adjustment for proper HDR display
- ⚡ **Fast Loading** - Built with Vite for optimal performance

## Technologies

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Three.js** - EXR image loading and processing
- **Canvas API** - Image rendering

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sevas/exr-gallery.git
   cd exr-gallery
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

Create an optimized production build:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

## Usage

- Click **Previous (❮)** or **Next (❯)** buttons to navigate between images
- Click **▶ Autoplay** to start automatic slideshow
- Click **⏸ Pause** to stop autoplay
- View image resolution and load time below each image

## Adding Your Own Images

Place your EXR files in the `public` folder and update the image array in `src/App.jsx`:

```javascript
const images = [
  '/your-image1.exr',
  '/your-image2.exr',
  // ... add more images
]
```

## License

MIT
