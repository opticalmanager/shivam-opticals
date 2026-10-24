import asyncio
import os
from PIL import Image
from winsdk.windows.graphics.imaging import BitmapDecoder
from winsdk.windows.media.ocr import OcrEngine
from winsdk.windows.storage import StorageFile

async def test():
    img_path = os.path.abspath('data/pdf_images/frames/page_1_opt.jpg')
    if not os.path.exists(img_path):
        print("File does not exist")
        return
        
    img = Image.open(img_path)
    print(f"Image size: {img.size}")
    
    file = await StorageFile.get_file_from_path_async(img_path)
    stream = await file.open_async(0)
    decoder = await BitmapDecoder.create_async(stream)
    bitmap = await decoder.get_software_bitmap_async()
    engine = OcrEngine.try_create_from_user_profile_languages()
    ocr_result = await engine.recognize_async(bitmap)
    
    words = []
    for line in ocr_result.lines:
        for w in line.words:
            rect = w.bounding_rect
            words.append((round(rect.y), round(rect.x), round(rect.width), round(rect.height), w.text))
            
    words.sort()
    for y, x, w, h, text in words[:35]:
        print(f"y={y:4d}, x={x:4d} (w={w:3d}, h={h:2d}): {text}")

if __name__ == "__main__":
    asyncio.run(test())
