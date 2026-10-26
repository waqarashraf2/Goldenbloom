import os
from PIL import Image

def generate():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    logo_path = os.path.join(script_dir, 'assets', 'images', 'logo.png')
    
    if not os.path.exists(logo_path):
        print("Logo not found at", logo_path)
        return

    logo = Image.open(logo_path).convert('RGBA')

    sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }

    fg_sizes = {
        'mipmap-mdpi': 108,
        'mipmap-hdpi': 162,
        'mipmap-xhdpi': 216,
        'mipmap-xxhdpi': 324,
        'mipmap-xxxhdpi': 432,
    }

    targets = [
        os.path.join(script_dir, 'assets', 'icons'),
        os.path.join(script_dir, 'android', 'app', 'src', 'main', 'res')
    ]

    for base_dir in targets:
        for folder, size in sizes.items():
            out_dir = os.path.join(base_dir, folder)
            os.makedirs(out_dir, exist_ok=True)
            
            # 1. Standard ic_launcher.png (opaque white bg, centered logo)
            icon = Image.new('RGBA', (size, size), (255, 255, 255, 255))
            target_w = int(size * 0.8)
            aspect = logo.size[1] / logo.size[0]
            target_h = int(target_w * aspect)
            if target_h > int(size * 0.8):
                target_h = int(size * 0.8)
                target_w = int(target_h / aspect)
            resized = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
            icon.paste(resized, ((size - target_w) // 2, (size - target_h) // 2), resized)
            icon.save(os.path.join(out_dir, 'ic_launcher.png'))
            icon.save(os.path.join(out_dir, 'ic_launcher_round.png'))
            
            # 2. Adaptive foreground ic_launcher_foreground.png
            fg_size = fg_sizes[folder]
            fg = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
            target_w = int(fg_size * 0.6)
            target_h = int(target_w * aspect)
            if target_h > int(fg_size * 0.6):
                target_h = int(fg_size * 0.6)
                target_w = int(target_h / aspect)
            resized_fg = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
            fg.paste(resized_fg, ((fg_size - target_w) // 2, (fg_size - target_h) // 2), resized_fg)
            fg.save(os.path.join(out_dir, 'ic_launcher_foreground.png'))
            
            print(f"Generated {folder} in {base_dir}")

        # Create drawable/ic_launcher_background.xml
        draw_dir = os.path.join(base_dir, 'drawable')
        os.makedirs(draw_dir, exist_ok=True)
        with open(os.path.join(draw_dir, 'ic_launcher_background.xml'), 'w', encoding='utf-8') as f:
            f.write('<?xml version="1.0" encoding="utf-8"?>\n'
                    '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n'
                    '    android:width="108dp"\n'
                    '    android:height="108dp"\n'
                    '    android:viewportWidth="108"\n'
                    '    android:viewportHeight="108">\n'
                    '    <path\n'
                    '        android:fillColor="#FFFFFF"\n'
                    '        android:pathData="M0,0h108v108h-108z"/>\n'
                    '</vector>\n')

        # Create mipmap-anydpi-v26/ic_launcher.xml & ic_launcher_round.xml
        v26_dir = os.path.join(base_dir, 'mipmap-anydpi-v26')
        os.makedirs(v26_dir, exist_ok=True)
        xml_content = ('<?xml version="1.0" encoding="utf-8"?>\n'
                       '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
                       '    <background android:drawable="@drawable/ic_launcher_background"/>\n'
                       '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n'
                       '</adaptive-icon>\n')
        with open(os.path.join(v26_dir, 'ic_launcher.xml'), 'w', encoding='utf-8') as f:
            f.write(xml_content)
        with open(os.path.join(v26_dir, 'ic_launcher_round.xml'), 'w', encoding='utf-8') as f:
            f.write(xml_content)

    print("All icons successfully generated and saved!")

if __name__ == '__main__':
    generate()
