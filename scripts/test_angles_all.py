import asyncio
import os
import re
from PIL import Image
from winsdk.windows.graphics.imaging import BitmapDecoder
from winsdk.windows.media.ocr import OcrEngine
from winsdk.windows.storage import StorageFile

async def test_frame_angles():
    engine = OcrEngine.try_create_from_user_profile_languages()
    
    for p in range(1, 18):
        orig_path = f"data/pdf_images/frames/page_{p}.jpg"
        if not os.path.exists(orig_path): continue
        
        # Test 0, 90, 180, 270
        best_angle = 0
        best_fr_count = 0
        best_total = ""
        
        for angle in [0, 90, 180, 270]:
            rot_path = f"data/pdf_images/frames/page_{p}_test_{angle}.jpg"
            img = Image.open(orig_path)
            if angle != 0:
                img = img.rotate(angle, expand=True)
            img.save(rot_path)
            
            file = await StorageFile.get_file_from_path_async(os.path.abspath(rot_path))
            stream = await file.open_async(0)
            decoder = await BitmapDecoder.create_async(stream)
            bitmap = await decoder.get_software_bitmap_async()
            res = await engine.recognize_async(bitmap)
            
            text = " ".join([l.text for l in res.lines]).upper()
            fr_matches = len(re.findall(r'FR\d{4,6}', text))
            totals = re.findall(r'TOTAL\s*:\s*\d+', text)
            
            if fr_matches > best_fr_count:
                best_fr_count = fr_matches
                best_angle = angle
                best_total = ", ".join(totals)
                
            os.remove(rot_path)
            
        print(f"Frames Page {p:2d}: Best Angle = {best_angle:3d}° | FR codes found = {best_fr_count:2d} | Totals = {best_total}")

if __name__ == "__main__":
    asyncio.run(test_frame_angles())
