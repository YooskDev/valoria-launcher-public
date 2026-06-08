import os
import sys
from PIL import Image

def main():
    icon_path = 'app-icon.png'
    if not os.path.exists(icon_path):
        print(f"{icon_path} not found")
        sys.exit(1)
        
    img = Image.open(icon_path).convert("RGBA")
    
    target_dir = 'src-tauri/icons'
    os.makedirs(target_dir, exist_ok=True)
    
    sizes = {
        '32x32.png': (32, 32),
        '64x64.png': (64, 64),
        '128x128.png': (128, 128),
        '128x128@2x.png': (256, 256),
        'icon.png': (512, 512),
        'Square30x30Logo.png': (30, 30),
        'Square44x44Logo.png': (44, 44),
        'Square71x71Logo.png': (71, 71),
        'Square89x89Logo.png': (89, 89),
        'Square107x107Logo.png': (107, 107),
        'Square142x142Logo.png': (142, 142),
        'Square150x150Logo.png': (150, 150),
        'Square284x284Logo.png': (284, 284),
        'Square310x310Logo.png': (310, 310),
        'StoreLogo.png': (50, 50),
    }
    
    for filename, size in sizes.items():
        resized = img.resize(size, Image.Resampling.LANCZOS)
        resized.save(os.path.join(target_dir, filename))
        
    # Save as ICO (requires multiple sizes)
    img.save(os.path.join(target_dir, 'icon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    
    print("Icons generated successfully!")

if __name__ == "__main__":
    main()
