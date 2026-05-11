"""
Extract brain from dark background — creates transparent PNGs.
Removes Gemini watermark, aggressive background removal, soft edges.
"""
from PIL import Image, ImageFilter
import numpy as np

def extract_brain(input_path, output_path, threshold=25, feather=4):
    img = Image.open(input_path).convert('RGBA')
    w, h = img.size

    # Crop out bottom-right Gemini watermark (roughly 80x80 corner)
    data = np.array(img)
    data[h-90:, w-90:, :] = [0, 0, 0, 0]

    # Calculate luminance
    r, g, b = data[:,:,0].astype(float), data[:,:,1].astype(float), data[:,:,2].astype(float)
    luminance = 0.299 * r + 0.587 * g + 0.114 * b

    # Soft alpha ramp: fully transparent below threshold, fully opaque above upper
    upper = threshold + 60
    alpha = np.clip((luminance - threshold) * (255.0 / (upper - threshold)), 0, 255).astype(np.uint8)
    data[:,:,3] = alpha

    result = Image.fromarray(data)

    # Feather edges
    alpha_ch = result.split()[3]
    alpha_ch = alpha_ch.filter(ImageFilter.GaussianBlur(radius=feather))
    result.putalpha(alpha_ch)

    result.save(output_path, 'PNG', optimize=True)
    print(f"Saved: {output_path} ({w}x{h})")

# Dim brain: very subtle glow, needs lower threshold to keep the outline
extract_brain(
    'C:/Users/Maple/Downloads/Gemini_Generated_Image_gvvtxpgvvtxpgvvt.png',
    'brain-dim.png',
    threshold=15, feather=3
)

# Lit brain: vibrant colors, can be more aggressive with bg removal
extract_brain(
    'C:/Users/Maple/Downloads/Gemini_Generated_Image_br56babr56babr56.png',
    'brain-lit.png',
    threshold=28, feather=4
)

print("Done!")
