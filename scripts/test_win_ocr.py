import asyncio
import os
from winsdk.windows.graphics.imaging import BitmapDecoder
from winsdk.windows.media.ocr import OcrEngine
from winsdk.windows.storage import StorageFile

async def ocr_image(image_path):
    abs_path = os.path.abspath(image_path)
    file = await StorageFile.get_file_from_path_async(abs_path)
    stream = await file.open_async(0) # 0 = Read
    decoder = await BitmapDecoder.create_async(stream)
    bitmap = await decoder.get_software_bitmap_async()
    engine = OcrEngine.try_create_from_user_profile_languages()
    ocr_result = await engine.recognize_async(bitmap)
    
    print(f"--- OCR EXTRACTED TEXT FROM {image_path} ---")
    for line in ocr_result.lines:
        print(line.text)

if __name__ == "__main__":
    asyncio.run(ocr_image("data/pdf_images/pdf1_page1.jpg"))
