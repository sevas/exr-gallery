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
    
    # EXR images (require OpenEXR library)
    generate_exr_gray()
    generate_exr_rgb()
    
    print("\nDone!")

if __name__ == "__main__":
    main()
