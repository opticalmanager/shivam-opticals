import asyncio
import os
import re
import json
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

IGNORE_MODELS = {
    "XSS", "IIFMIF5C", "CODE", "PRICE", "BRAND", "ITEM", "TOTAL", "GRAND",
    "DETAILS", "SALE", "FRAMES", "SUNGLASS", "STOCK", "DATED", "ST", "RATE", "MIX", "SHEET", "METAL"
}

def clean_ocr_text(s):
    if not s: return ""
    return re.sub(r'[\s]+', ' ', s).strip()

def clean_model_code(raw_model):
    if not raw_model: return ""
    m = raw_model.upper().strip()
    m = m.replace("'", "").replace(",", "").replace("`", "").replace(";", "")
    m = re.sub(r'[\(\)\{\}\[\]]', '', m)
    
    # Fix common OCR substitutions
    m = re.sub(r'^VOS', 'VO5', m)
    m = re.sub(r'SIJ$', 'SU', m)
    m = re.sub(r'\.S', '5', m) # e.g. B43.S8 -> B4358
    m = re.sub(r'1\)45', '105', m) # BB31)45 -> BB3105
    m = re.sub(r'^THI', 'TH1', m) # THI112 -> TH1112
    m = re.sub(r'^CA\.', 'CA', m) # CA.3020 -> CA3020
    m = re.sub(r'TlT$', '', m) # BOSS1424TlT -> BOSS1424
    m = re.sub(r'IW\)SS', 'BOSS', m) # IW)SS1441 -> BOSS1441
    m = re.sub(r'^13', 'B', m) # OCR misread B as 13 in Burberry e.g. 132172 -> B2172
    m = re.sub(r'^R\s*B\.', 'RB', m) # R B.S364 -> RB5364
    
    # Remove trailing 1 or I artifact on 4-digit Ray-Ban or standard models:
    # e.g. RB30251 -> RB3025, RB44601 -> RB4460, RB34471 -> RB3447
    m = re.sub(r'(\d{4})1$', r'\1', m)
    
    m = re.sub(r'[^A-Z0-9\-/]', '', m)
    return m

def detect_designer_brand(model_str):
    if not model_str: return None, False
    m = model_str.upper()
    
    # Ray-Ban: RB... RJ... 0RB... RX... 0RX...
    if re.match(r'^(?:0?RB|RJ|0?RX)\d+', m):
        return "Ray-Ban", True
    # Carrera: CA... 0CA... CAPR...
    if re.match(r'^(?:0?CA|CAPR)\d+', m) or m.startswith("CA-") or m.startswith("CAPRW") or m.startswith("CA"):
        if any(c.isdigit() for c in m):
            return "Carrera", True
    # Burberry: B followed by 4 digits or B-3167, etc.
    if re.match(r'^B-?\d{4}', m) or re.match(r'^B\d{4}', m):
        return "Burberry", True
    # Boss: BOSS...
    if m.startswith("BOSS"):
        return "Boss", True
    # Tommy Hilfiger: TH...
    if re.match(r'^TH\d+', m):
        return "Tommy Hilfiger", True
    # Vogue: VO...
    if re.match(r'^(?:0?VO)\d+', m):
        return "Vogue", True
    # Armani Exchange: AX...
    if re.match(r'^AX\d+', m):
        return "Armani Exchange", True
    # Emporio Armani: EA...
    if re.match(r'^EA\d+', m):
        return "Emporio Armani", True
    # Bebe: BB...
    if re.match(r'^BB\d+', m):
        return "Bebe", True
    # French Connection: FC...
    if re.match(r'^FC\d+', m):
        return "French Connection", True
    # Stepper: SI...
    if re.match(r'^SI\d+', m):
        return "Stepper", True
        
    return None, False

def clean_item_code(raw_code, prefix_fallback="SG"):
    if not raw_code: return ""
    c = raw_code.upper().replace(" ", "").replace(".", "")
    c = re.sub(r'^SCJ', 'SG', c)
    c = re.sub(r'^S00', 'SG00', c)
    c = re.sub(r'^SGOOI', 'SG001', c)
    c = re.sub(r'^SCJOOI', 'SG001', c)
    c = re.sub(r'^FRO', 'FR0', c)
    c = re.sub(r'^FROOI\)', 'FR000', c)
    c = re.sub(r'^FROD', 'FR00', c)
    c = re.sub(r'[^A-Z0-9]', '', c)
    if not c.startswith("SG") and not c.startswith("FR"):
        if any(char.isdigit() for char in c):
            c = prefix_fallback + c
    return c

def clean_price_val(raw_price):
    if not raw_price: return None
    nums = re.findall(r'\d+', raw_price.replace(" ", "").replace(",", "").replace(".", ""))
    if nums:
        val = int(nums[0])
        if val > 150000:
            val_str = str(val)
            if val_str.endswith("00"):
                val = int(val_str[:-2])
        if 500 <= val <= 95000:
            return val
    return None

async def extract_page_inventory(engine, img_path, default_category):
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
                'w': round(rect.width),
                'h': round(rect.height),
                'mid_y': round(rect.y + rect.height / 2)
            })
            
    words.sort(key=lambda w: w['mid_y'])
    
    rows = []
    current_row = []
    current_mid_y = -999
    
    for w in words:
        if current_row and abs(w['mid_y'] - current_mid_y) > 8:
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
        
    items = []
    prefix_code = "SG" if default_category == "sunglasses" else "FR"
    
    if default_category == "sunglasses":
        x_code = (240, 440)
        x_model = (440, 670)
        x_color = (670, 840)
        x_price = (840, 990)
    else:
        x_code = (180, 330)
        x_model = (330, 500)
        x_color = (500, 620)
        x_price = (620, 750)
        
    for mid_y, row_words in rows:
        row_text = " ".join(w['text'] for w in row_words)
        upper = row_text.upper()
        
        # Skip table headers / summary rows
        if any(h in upper for h in ["ITEM DESC", "PRICE", "TOTAL", "SALE DETAILS", "GRAND TOTAL"]):
            continue
            
        code_tokens = [w['text'] for w in row_words if x_code[0] <= w['x'] < x_code[1]]
        model_tokens = [w['text'] for w in row_words if x_model[0] <= w['x'] < x_model[1]]
        color_tokens = [w['text'] for w in row_words if x_color[0] <= w['x'] < x_color[1]]
        price_tokens = [w['text'] for w in row_words if x_price[0] <= w['x'] < x_price[1]]
        
        raw_code = "".join(code_tokens)
        raw_model = " ".join(model_tokens).strip()
        raw_color = " ".join(color_tokens).strip()
        raw_price = "".join(price_tokens).strip()
        
        code = clean_item_code(raw_code, prefix_code)
        model = clean_model_code(raw_model)
        price = clean_price_val(raw_price)
        color = clean_ocr_text(raw_color) or "MIX"
        
        if model in IGNORE_MODELS:
            continue
            
        # Detect designer brand
        brand, is_luxury = detect_designer_brand(model)
        
        # If not matched yet, check for Burberry 3991/73 style or Bebe
        if not is_luxury and color and "/" in color:
            parts = color.split("/")
            if len(parts[0]) == 4 and parts[0].isdigit():
                model = parts[0]
                color = parts[1]
                brand, is_luxury = "Burberry", True
                
        # If still not luxury, mark as Local / Wholesale line
        if not is_luxury:
            brand = "Shivam Local Atelier"
            is_luxury = False
            if not model:
                model = code or "FRAME-STANDARD"
                
        items.append({
            "category": default_category,
            "brand": brand,
            "isLuxury": is_luxury,
            "itemCode": code or f"{prefix_code}{len(items)+1:05d}",
            "model": model,
            "color": color,
            "price": price if price else 1990,
            "rawText": row_text
        })
        
    return items

async def main():
    engine = OcrEngine.try_create_from_user_profile_languages()
    all_items = []
    
    print("=== Processing PDF 1: Sunglasses (7 pages) ===")
    for p in range(1, 8):
        img_path = f"data/pdf_images/sunglasses/page_{p}.jpg"
        if not os.path.exists(img_path): continue
        items = await extract_page_inventory(engine, img_path, "sunglasses")
        lux_count = sum(1 for i in items if i["isLuxury"])
        print(f"  Sunglasses Page {p}/7: Extracted {len(items):2d} items ({lux_count:2d} Designer Luxury)")
        all_items.extend(items)
        
    print(f"\nTotal Sunglasses Extracted: {len(all_items)} (Target: ~328)\n")
    sunglasses_count = len(all_items)
    
    print("=== Processing PDF 2: Frames (17 pages) ===")
    for p in range(1, 18):
        angle = BEST_ANGLES_FRAMES.get(p, 0)
        orig_img_path = f"data/pdf_images/frames/page_{p}.jpg"
        if not os.path.exists(orig_img_path): continue
        
        if angle != 0:
            target_img_path = f"data/pdf_images/frames/page_{p}_opt.jpg"
            img = Image.open(orig_img_path)
            img.rotate(angle, expand=True).save(target_img_path)
        else:
            target_img_path = orig_img_path
            
        items = await extract_page_inventory(engine, target_img_path, "eyeglasses")
        lux_count = sum(1 for i in items if i["isLuxury"])
        print(f"  Frames Page {p:2d}/17: Extracted {len(items):2d} items ({lux_count:2d} Designer Luxury)")
        all_items.extend(items)
        
    frames_count = len(all_items) - sunglasses_count
    print(f"\nTotal Frames Extracted: {frames_count} (Target: ~1,038)")
    print(f"Grand Total Extracted: {len(all_items)} items")
    
    luxury_items = [i for i in all_items if i["isLuxury"]]
    local_items = [i for i in all_items if not i["isLuxury"]]
    
    print(f"\n================ EXTRACTION TOTALS ================")
    print(f"Total Luxury / Designer Items: {len(luxury_items)}")
    print(f"Total In-House / Local Wholesale Items: {len(local_items)}")
    
    brand_counts = {}
    for item in luxury_items:
        brand_counts[item["brand"]] = brand_counts.get(item["brand"], 0) + 1
    print("\nBreakdown of Luxury Items:")
    for b, count in sorted(brand_counts.items(), key=lambda x: -x[1]):
        print(f"  - {b:20s}: {count:3d} items")
        
    with open("data/inventory_extracted.json", "w", encoding="utf-8") as f:
        json.dump(all_items, f, indent=2)
    print("\nSaved complete inventory to data/inventory_extracted.json")
    
    with open("data/local_brands_pending.json", "w", encoding="utf-8") as f:
        json.dump(local_items, f, indent=2)
    print("Saved local wholesale lines to data/local_brands_pending.json")

if __name__ == "__main__":
    asyncio.run(main())
