"""
Script to generate test images for the Image Viewer
Creates PNG and EXR test patterns with different characteristics
"""

import os
import numpy as np
from PIL import Image
import requests
from io import BytesIO

# Output directory
OUTPUT_DIR = "public/viewer"

def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

def rgb_to_bayer_rggb(rgb_array):
    """
    Extract RGGB Bayer pattern from RGB image.
    Pattern:
      Row 0: R G R G ...
      Row 1: G B G B ...
      Row 2: R G R G ...
      ...
    """
    height, width = rgb_array.shape[:2]
    bayer = np.zeros((height, width), dtype=rgb_array.dtype)
    
    # Even rows: R at even cols, G at odd cols
    bayer[0::2, 0::2] = rgb_array[0::2, 0::2, 0]  # R
    bayer[0::2, 1::2] = rgb_array[0::2, 1::2, 1]  # G
    
    # Odd rows: G at even cols, B at odd cols
    bayer[1::2, 0::2] = rgb_array[1::2, 0::2, 1]  # G
    bayer[1::2, 1::2] = rgb_array[1::2, 1::2, 2]  # B
    
    return bayer

def download_natural_photos():
    """Download natural photos from picsum.photos"""
    photos = [
        {"id": "1015", "name": "photo_river"},      # River landscape
        {"id": "1039", "name": "photo_leaves"},     # Autumn leaves  
        {"id": "1043", "name": "photo_coast"},      # Coastal scene
    ]
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    for photo in photos:
        try:
            # Download color version
            url = f"https://picsum.photos/id/{photo['id']}/800/600.jpg"
            print(f"Downloading {photo['name']}...")
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            img = Image.open(BytesIO(response.content))
            img.save(f"{OUTPUT_DIR}/{photo['name']}.jpg", quality=90)
            print(f"  Created: {OUTPUT_DIR}/{photo['name']}.jpg")
            
            # Create grayscale version
            gray = img.convert('L')
            gray.save(f"{OUTPUT_DIR}/{photo['name']}_gray.png")
            print(f"  Created: {OUTPUT_DIR}/{photo['name']}_gray.png")
            
            # Create RGGB Bayer pattern version
            rgb_array = np.array(img)
            bayer = rgb_to_bayer_rggb(rgb_array)
            bayer_img = Image.fromarray(bayer, mode='L')
            bayer_img.save(f"{OUTPUT_DIR}/{photo['name']}_bayer.png")
            print(f"  Created: {OUTPUT_DIR}/{photo['name']}_bayer.png")
            
        except Exception as e:
            print(f"  Error downloading {photo['name']}: {e}")

def generate_gradient_gray():
    """256x256 grayscale gradient from black to white"""
    img = np.zeros((256, 256), dtype=np.uint8)
    for x in range(256):
        img[:, x] = x
    
    Image.fromarray(img, mode='L').save(f"{OUTPUT_DIR}/gradient_gray.png")
    print(f"Created: {OUTPUT_DIR}/gradient_gray.png")

def generate_gradient_rgb():
    """256x256 RGB color ramp"""
    img = np.zeros((256, 256, 3), dtype=np.uint8)
    
    # Create color gradient: red -> yellow -> green -> cyan -> blue -> magenta -> red
    for x in range(256):
        t = x / 255.0 * 6  # 0 to 6
        if t < 1:
            r, g, b = 255, int(255 * t), 0
        elif t < 2:
            r, g, b = int(255 * (2 - t)), 255, 0
        elif t < 3:
            r, g, b = 0, 255, int(255 * (t - 2))
        elif t < 4:
            r, g, b = 0, int(255 * (4 - t)), 255
        elif t < 5:
            r, g, b = int(255 * (t - 4)), 0, 255
        else:
            r, g, b = 255, 0, int(255 * (6 - t))
        
        img[:, x] = [r, g, b]
    
    Image.fromarray(img, mode='RGB').save(f"{OUTPUT_DIR}/gradient_rgb.png")
    print(f"Created: {OUTPUT_DIR}/gradient_rgb.png")

def generate_checkerboard():
    """256x256 checkerboard pattern"""
    img = np.zeros((256, 256), dtype=np.uint8)
    
    block_size = 32
    for y in range(256):
        for x in range(256):
            if ((x // block_size) + (y // block_size)) % 2 == 0:
                img[y, x] = 255
    
    Image.fromarray(img, mode='L').save(f"{OUTPUT_DIR}/checkerboard_gray.png")
    print(f"Created: {OUTPUT_DIR}/checkerboard_gray.png")

def generate_noise_images():
    """
    Generate noise images with varying noise levels across different regions.
    Creates RGB, grayscale, and Bayer versions.
    """
    width, height = 512, 512
    
    # Create base image with 4 quadrants of different noise levels
    # Each quadrant has a constant mean with different standard deviations
    mean_value = 128
    noise_levels = [5, 15, 30, 60]  # std dev for each quadrant
    
    # Generate RGB noise image
    rgb_noise = np.zeros((height, width, 3), dtype=np.uint8)
    
    quadrants = [
        (0, 0, height//2, width//2),           # Top-left: low noise
        (0, width//2, height//2, width),       # Top-right: medium-low noise
        (height//2, 0, height, width//2),      # Bottom-left: medium-high noise
        (height//2, width//2, height, width),  # Bottom-right: high noise
    ]
    
    for i, (y1, x1, y2, x2) in enumerate(quadrants):
        noise = np.random.normal(mean_value, noise_levels[i], (y2-y1, x2-x1, 3))
        rgb_noise[y1:y2, x1:x2] = np.clip(noise, 0, 255).astype(np.uint8)
    
    Image.fromarray(rgb_noise, mode='RGB').save(f"{OUTPUT_DIR}/noise_rgb.png")
    print(f"Created: {OUTPUT_DIR}/noise_rgb.png (quadrants: σ={noise_levels})")
    
    # Generate grayscale noise image
    gray_noise = np.zeros((height, width), dtype=np.uint8)
    
    for i, (y1, x1, y2, x2) in enumerate(quadrants):
        noise = np.random.normal(mean_value, noise_levels[i], (y2-y1, x2-x1))
        gray_noise[y1:y2, x1:x2] = np.clip(noise, 0, 255).astype(np.uint8)
    
    Image.fromarray(gray_noise, mode='L').save(f"{OUTPUT_DIR}/noise_gray.png")
    print(f"Created: {OUTPUT_DIR}/noise_gray.png (quadrants: σ={noise_levels})")
    
    # Generate Bayer pattern noise image
    # First create RGB, then extract Bayer pattern
    bayer_rgb = np.zeros((height, width, 3), dtype=np.uint8)
    
    for i, (y1, x1, y2, x2) in enumerate(quadrants):
        noise = np.random.normal(mean_value, noise_levels[i], (y2-y1, x2-x1, 3))
        bayer_rgb[y1:y2, x1:x2] = np.clip(noise, 0, 255).astype(np.uint8)
    
    bayer = rgb_to_bayer_rggb(bayer_rgb)
    Image.fromarray(bayer, mode='L').save(f"{OUTPUT_DIR}/noise_bayer.png")
    print(f"Created: {OUTPUT_DIR}/noise_bayer.png (quadrants: σ={noise_levels})")
    
    # Generate horizontal gradient noise (noise varies smoothly left to right)
    rgb_gradient_noise = np.zeros((height, width, 3), dtype=np.uint8)
    
    for x in range(width):
        # Noise level increases from left (σ=2) to right (σ=50)
        sigma = 2 + (x / width) * 48
        noise = np.random.normal(mean_value, sigma, (height, 3))
        rgb_gradient_noise[:, x] = np.clip(noise, 0, 255).astype(np.uint8)
    
    Image.fromarray(rgb_gradient_noise, mode='RGB').save(f"{OUTPUT_DIR}/noise_gradient_rgb.png")
    print(f"Created: {OUTPUT_DIR}/noise_gradient_rgb.png (σ varies 2→50 left to right)")
    
    gray_gradient_noise = np.zeros((height, width), dtype=np.uint8)
    
    for x in range(width):
        sigma = 2 + (x / width) * 48
        noise = np.random.normal(mean_value, sigma, height)
        gray_gradient_noise[:, x] = np.clip(noise, 0, 255).astype(np.uint8)
    
    Image.fromarray(gray_gradient_noise, mode='L').save(f"{OUTPUT_DIR}/noise_gradient_gray.png")
    print(f"Created: {OUTPUT_DIR}/noise_gradient_gray.png (σ varies 2→50 left to right)")
    
    # Bayer version of gradient noise
    bayer_gradient_rgb = np.zeros((height, width, 3), dtype=np.uint8)
    
    for x in range(width):
        sigma = 2 + (x / width) * 48
        noise = np.random.normal(mean_value, sigma, (height, 3))
        bayer_gradient_rgb[:, x] = np.clip(noise, 0, 255).astype(np.uint8)
    
    bayer_gradient = rgb_to_bayer_rggb(bayer_gradient_rgb)
    Image.fromarray(bayer_gradient, mode='L').save(f"{OUTPUT_DIR}/noise_gradient_bayer.png")
    print(f"Created: {OUTPUT_DIR}/noise_gradient_bayer.png (σ varies 2→50 left to right)")


def generate_exr_gray():
    """256x256 float32 grayscale EXR with HDR values"""
    try:
        import OpenEXR
        import Imath
    except ImportError:
        print("OpenEXR not installed. Skipping EXR generation.")
        print("Install with: pixi add openexr-python")
        return
    
    # Create gradient with HDR values (0 to 10)
    data = np.zeros((256, 256), dtype=np.float32)
    for x in range(256):
        data[:, x] = (x / 255.0) * 10.0  # Range 0-10 for HDR
    
    # Write EXR
    header = OpenEXR.Header(256, 256)
    header['channels'] = {
        'R': Imath.Channel(Imath.PixelType(Imath.PixelType.FLOAT)),
        'G': Imath.Channel(Imath.PixelType(Imath.PixelType.FLOAT)),
        'B': Imath.Channel(Imath.PixelType(Imath.PixelType.FLOAT)),
    }
    
    out = OpenEXR.OutputFile(f"{OUTPUT_DIR}/testpattern_gray.exr", header)
    out.writePixels({
        'R': data.tobytes(),
        'G': data.tobytes(),
        'B': data.tobytes(),
    })
    out.close()
    print(f"Created: {OUTPUT_DIR}/testpattern_gray.exr")

def generate_exr_rgb():
    """256x256 float32 RGB EXR with HDR values"""
    try:
        import OpenEXR
        import Imath
    except ImportError:
        print("OpenEXR not installed. Skipping EXR generation.")
        return
    
    # Create RGB test pattern with HDR values
    r_data = np.zeros((256, 256), dtype=np.float32)
    g_data = np.zeros((256, 256), dtype=np.float32)
    b_data = np.zeros((256, 256), dtype=np.float32)
    
    for y in range(256):
        for x in range(256):
            # Gradient with some HDR hotspots
            r_data[y, x] = (x / 255.0) * 2.0
            g_data[y, x] = (y / 255.0) * 2.0
            b_data[y, x] = ((255 - x) / 255.0) * 2.0
            
            # Add bright spots
            if (x - 64) ** 2 + (y - 64) ** 2 < 400:
                r_data[y, x] = 5.0
            if (x - 192) ** 2 + (y - 64) ** 2 < 400:
                g_data[y, x] = 5.0
            if (x - 128) ** 2 + (y - 192) ** 2 < 400:
                b_data[y, x] = 5.0
    
    header = OpenEXR.Header(256, 256)
    header['channels'] = {
        'R': Imath.Channel(Imath.PixelType(Imath.PixelType.FLOAT)),
        'G': Imath.Channel(Imath.PixelType(Imath.PixelType.FLOAT)),
        'B': Imath.Channel(Imath.PixelType(Imath.PixelType.FLOAT)),
    }
    
    out = OpenEXR.OutputFile(f"{OUTPUT_DIR}/testpattern_rgb.exr", header)
    out.writePixels({
        'R': r_data.tobytes(),
        'G': g_data.tobytes(),
        'B': b_data.tobytes(),
    })
    out.close()
    print(f"Created: {OUTPUT_DIR}/testpattern_rgb.exr")

def main():
    ensure_output_dir()
    print("Generating test images for Image Viewer...\n")
    
    # Natural photos
    download_natural_photos()
    print()
    
    # PNG images (always work)
    generate_gradient_gray()
    generate_gradient_rgb()
    generate_checkerboard()
    generate_noise_images()
    
    # EXR images (require OpenEXR library)
    generate_exr_gray()
    generate_exr_rgb()
    
    print("\nDone!")

if __name__ == "__main__":
    main()
