import asyncio
import os
from winsdk.windows.graphics.imaging import BitmapDecoder
from winsdk.windows.media.ocr import OcrEngine
from winsdk.windows.storage import StorageFile

async def test():
    img_path = os.path.abspath('data/pdf_images/sunglasses/page_1.jpg')
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
            words.append({
                'text': w.text,
                'x': round(rect.x),
                'y': round(rect.y),
                'w': round(rect.width),
                'h': round(rect.height)
            })
            
    # Print width and height of image
    print(f"Total words: {len(words)}")
    # Find all words that look like item codes (SG...)
    code_words = [w for w in words if 'SG' in w['text'].upper() or 'SCJ' in w['text'].upper()]
    print(f"Found {len(code_words)} code-like words.")
    for cw in code_words[:10]:
        print(f"Code: '{cw['text']}' at y={cw['y']}, x={cw['x']}")
        # Look for words on the same horizontal line (y within +/- 10px)
        same_line = [w for w in words if abs(w['y'] - cw['y']) <= 8]
        same_line.sort(key=lambda item: item['x'])
        line_str = " | ".join([f"{w['text']} (x={w['x']})" for w in same_line])
        print(f"   Line: {line_str}")

if __name__ == "__main__":
    asyncio.run(test())
