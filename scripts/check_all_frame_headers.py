import asyncio
import os
import re
from PIL import Image
from winsdk.windows.graphics.imaging import BitmapDecoder
from winsdk.windows.media.ocr import OcrEngine
from winsdk.windows.storage import StorageFile

BEST_ANGLES_FRAMES = {
    1: 90,
    2: 90,
    3: 0,
    4: 270,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
    13: 90,
    14: 0,
    15: 270,
    16: 0,
    17: 0,
}

async def check_headers():
    engine = OcrEngine.try_create_from_user_profile_languages()
    for p in range(1, 18):
        orig_img_path = f"data/pdf_images/frames/page_{p}.jpg"
        if not os.path.exists(orig_img_path): continue
        angle = BEST_ANGLES_FRAMES.get(p, 0)
        if angle != 0:
            target_path = f"data/pdf_images/frames/page_{p}_opt.jpg"
            img = Image.open(orig_img_path)
            img.rotate(angle, expand=True).save(target_path)
        else:
            target_path = orig_img_path
            
        file = await StorageFile.get_file_from_path_async(os.path.abspath(target_path))
        stream = await file.open_async(0)
        decoder = await BitmapDecoder.create_async(stream)
        bitmap = await decoder.get_software_bitmap_async()
        res = await engine.recognize_async(bitmap)
        
        # Look for brand words (x < 250)
        brands_found = []
        for line in res.lines:
            t = line.text.strip().upper()
            if any(k in t for k in ["TOMMY", "HILFIGER", "CARRERA", "RAY", "BAN", "VOGUE", "BURBERRY", "BOSS", "ARMANI", "IARRA", "IDOR", "INSIST", "PRODIGY", "SHIVAM", "SPRINT", "XITE", "ZOE"]):
                if "ITEM" not in t and "PRICE" not in t:
                    brands_found.append(t)
        print(f"Frames Page {p:2d} (Angle {angle:3d}°): {brands_found}")

if __name__ == "__main__":
    asyncio.run(check_headers())
