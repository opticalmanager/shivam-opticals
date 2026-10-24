import asyncio
import os
import re
from winsdk.windows.graphics.imaging import BitmapDecoder
from winsdk.windows.media.ocr import OcrEngine
from winsdk.windows.storage import StorageFile

async def inspect_designer_frame_pages():
    engine = OcrEngine.try_create_from_user_profile_languages()
    for p in [6, 7, 14]:
        img_path = f"data/pdf_images/frames/page_{p}.jpg"
        file = await StorageFile.get_file_from_path_async(os.path.abspath(img_path))
        stream = await file.open_async(0)
        decoder = await BitmapDecoder.create_async(stream)
        bitmap = await decoder.get_software_bitmap_async()
        res = await engine.recognize_async(bitmap)
        
        words = []
        for line in res.lines:
            for w in line.words:
                rect = w.bounding_rect
                words.append({
                    'text': w.text,
                    'x': round(rect.x),
                    'y': round(rect.y),
                    'mid_y': round(rect.y + rect.height / 2)
                })
        words.sort(key=lambda w: w['mid_y'])
        
        rows = []
        curr = []
        curr_y = -999
        for w in words:
            if curr and abs(w['mid_y'] - curr_y) > 8:
                rows.append(curr)
                curr = [w]
                curr_y = w['mid_y']
            else:
                if not curr: curr_y = w['mid_y']
                curr.append(w)
        if curr: rows.append(curr)
        
        print(f"\n--- Frames Page {p} ---")
        for row in rows:
            # Code: 180-330, Model: 330-500, Color: 500-620, Price: 620-750
            code = "".join([w['text'] for w in row if 180 <= w['x'] < 330])
            model = " ".join([w['text'] for w in row if 330 <= w['x'] < 500]).strip()
            color = " ".join([w['text'] for w in row if 500 <= w['x'] < 620]).strip()
            price = "".join([w['text'] for w in row if 620 <= w['x'] < 750]).strip()
            if model and not any(k in model.upper() for k in ["DESC", "ITEM", "CODE", "PRICE", "DETAILS", "SUNGLASS", "TOTAL", "GRAND"]):
                print(f"  Code: {code:12s} | Model: {model:18s} | Color: {color:10s} | Price: {price}")

if __name__ == "__main__":
    asyncio.run(inspect_designer_frame_pages())
