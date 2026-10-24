import asyncio
import os
import re
from winsdk.windows.graphics.imaging import BitmapDecoder
from winsdk.windows.media.ocr import OcrEngine
from winsdk.windows.storage import StorageFile

async def test_band_extraction():
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
                'h': round(rect.height),
                'mid_y': round(rect.y + rect.height / 2)
            })
            
    # Group words into horizontal rows based on mid_y
    words.sort(key=lambda w: w['mid_y'])
    
    rows = []
    current_row = []
    current_mid_y = -999
    
    for w in words:
        if current_row and abs(w['mid_y'] - current_mid_y) > 10:
            current_row.sort(key=lambda item: item['x'])
            rows.append((current_mid_y, current_row))
            current_row = [w]
            current_mid_y = w['mid_y']
        else:
            if not current_row:
                current_mid_y = w['mid_y']
            current_row.append(w)
            
    if current_row:
        current_row.sort(key=lambda item: item['x'])
        rows.append((current_mid_y, current_row))
        
    print(f"Total geometric rows found: {len(rows)}")
    
    # Process each row into columns by X-band
    parsed_items = []
    current_brand = "UNKNOWN"
    
    for mid_y, row_words in rows:
        row_text = " ".join(w['text'] for w in row_words)
        upper = row_text.upper()
        
        # Check brand header
        if "ARMANI EXCHANGE" in upper: current_brand = "Armani Exchange"; continue
        if "BEBE" in upper: current_brand = "Bebe"; continue
        if "BURBERRY" in upper: current_brand = "Burberry"; continue
        if "CARRERA" in upper: current_brand = "Carrera"; continue
        if "EMPORIO ARMANI" in upper: current_brand = "Emporio Armani"; continue
        if "RAY" in upper and "BAN" in upper: current_brand = "Ray-Ban"; continue
        if "TOMMY HILFIGER" in upper: current_brand = "Tommy Hilfiger"; continue
        if "VOGUE" in upper: current_brand = "Vogue"; continue
        
        # Skip headers / totals
        if "ITEM DESC" in upper or "PRICE" in upper or "TOTAL" in upper or "SALE DETAILS" in upper:
            continue
            
        # Segment words into bands:
        # Col 2: Code (x: 250 - 450)
        # Col 3: Model (x: 450 - 670)
        # Col 4: Color (x: 670 - 840)
        # Col 5: Price (x: 840 - 990)
        code_tokens = [w['text'] for w in row_words if 240 <= w['x'] < 460]
        model_tokens = [w['text'] for w in row_words if 460 <= w['x'] < 670]
        color_tokens = [w['text'] for w in row_words if 670 <= w['x'] < 840]
        price_tokens = [w['text'] for w in row_words if 840 <= w['x'] < 990]
        
        raw_code = "".join(code_tokens)
        raw_model = " ".join(model_tokens).strip()
        raw_color = " ".join(color_tokens).strip()
        raw_price = "".join(price_tokens).strip()
        
        # Must have at least a model or code or price to be an inventory row
        if not raw_model and not raw_code:
            continue
            
        parsed_items.append({
            'mid_y': mid_y,
            'brand': current_brand,
            'code': raw_code,
            'model': raw_model,
            'color': raw_color,
            'price': raw_price,
            'raw': row_text
        })
        
    print(f"\nExtracted {len(parsed_items)} inventory rows from Page 1:")
    for item in parsed_items[:30]:
        print(f"[{item['brand']:15s}] Code: {item['code']:12s} | Model: {item['model']:15s} | Color: {item['color']:12s} | Price: {item['price']}")

if __name__ == "__main__":
    asyncio.run(test_band_extraction())
