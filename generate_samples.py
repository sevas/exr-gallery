"""
Script to download sample images and create blur variations
"""

import os
import requests
from PIL import Image, ImageFilter
from io import BytesIO

# Output directory
OUTPUT_DIR = "public/samples"

# Sample images from various free sources (Unsplash Source API, Lorem Picsum)
SAMPLE_IMAGES = [
    {
        "name": "landscape",
        "url": "https://picsum.photos/id/10/1024/768.jpg",  # Forest with pond
    },
    {
        "name": "architecture", 
        "url": "https://picsum.photos/id/101/1024/768.jpg",  # City buildings
    },
    {
        "name": "nature",
        "url": "https://picsum.photos/id/15/1024/768.jpg",  # River through forest
    },
]

# Blur levels (Gaussian blur radius)
BLUR_LEVELS = {
    "original": 0,
    "blur_medium": 3,
    "blur_heavy": 8,
}

def download_image(url, name):
    """Download image from URL"""
    try:
        print(f"Downloading {name}...")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return BytesIO(response.content)
    except Exception as e:
        print(f"Error downloading {name}: {e}")
        return None

def create_blur_variations(img_data, name):
    """Create blur variations of an image"""
    try:
        img = Image.open(img_data)
        
        # Convert to RGB if necessary (handle PNG with transparency)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Resize to consistent dimensions (800x600 for comparison)
        target_size = (800, 600)
        img = img.resize(target_size, Image.Resampling.LANCZOS)
        
        for blur_name, blur_radius in BLUR_LEVELS.items():
            output_path = f"{OUTPUT_DIR}/{name}_{blur_name}.jpg"
            
            if blur_radius == 0:
                # Original (no blur)
                img.save(output_path, "JPEG", quality=90)
            else:
                # Apply Gaussian blur
                blurred = img.filter(ImageFilter.GaussianBlur(radius=blur_radius))
                blurred.save(output_path, "JPEG", quality=90)
            
            print(f"  Created: {output_path}")
        
        return True
    except Exception as e:
        print(f"Error processing {name}: {e}")
        return False

def main():
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("Generating sample images with blur variations...\n")
    
    for sample in SAMPLE_IMAGES:
        name = sample["name"]
        url = sample["url"]
        
        # Download image
        img_data = download_image(url, name)
        if img_data:
            # Create blur variations
            create_blur_variations(img_data, name)
            print()
    
    print("Done! Sample images created in", OUTPUT_DIR)

if __name__ == "__main__":
    main()
