import asyncio
import os
import re
import json
import pypdf
from PIL import Image
from winsdk.windows.graphics.imaging import BitmapDecoder
from winsdk.windows.media.ocr import OcrEngine
from winsdk.windows.storage import StorageFile

KNOWN_BRANDS = [
    "ARMANI EXCHANGE",
    "BEBE",
    "BURBERRY",
    "CARRERA",
    "EMPORIO ARMANI",
    "FRENCH CONNECTION",
    "IARRA",
    "IDOR",
    "INSIST",
    "PRODIGY",
    "QLOO",
    "RAYBAN",
    "RAY-BAN",
    "RAY BAN",
    "SCOTT",
    "SHIVAM",
    "SPRINT",
    "TOMMY HILFIGER",
    "XITE",
    "ZOE MILLER",
    "STERLING",
    "SUNFIRE",
    "SWISS",
    "DANIEL MORRIS",
    "EYE PLAYER",
    "FLORIES",
    "FOSS",
    "G GRAFFITTI",
    "GRAVITY",
    "JORGIO",
    "MASSI",
    "NOVA",
    "PARADOX",
    "SPARROW",
    "STEPPER",
    "SORRENTO",
    "SORRENTO BY SCOTT",
    "LCB",
    "BOSS",
]

# Luxury designer brands to prioritize for Dayal & Gem scraping
LUXURY_BRANDS = [
    "RAYBAN",
    "RAY-BAN",
    "RAY BAN",
    "BURBERRY",
    "CARRERA",
    "TOMMY HILFIGER",
    "VOGUE",
    "ARMANI EXCHANGE",
    "EMPORIO ARMANI",
    "BOSS",
    "SCOTT",
    "FRENCH CONNECTION",
    "STEPPER",
    "BEBE"
]

BEST_ANGLES_PDF2 = {
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

async def ocr_image_words(image_path):
    abs_path = os.path.abspath(image_path)
    file = await StorageFile.get_file_from_path_async(abs_path)
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
                "text": w.text.strip(),
                "x": rect.x,
                "y": rect.y,
                "w": rect.width,
                "h": rect.height
            })
    return words

def group_words_into_rows(words, y_threshold=14):
    # Sort words by vertical coordinate y
    words.sort(key=lambda w: (w["y"], w["x"]))
    
    rows = []
    current_row = []
    current_y = -999
    
    for w in words:
        if current_row and abs(w["y"] - current_y) > y_threshold:
            # Sort words in row from left to right
            current_row.sort(key=lambda item: item["x"])
            rows.append(current_row)
            current_row = [w]
            current_y = w["y"]
        else:
            if not current_row:
                current_y = w["y"]
            current_row.append(w)
            
    if current_row:
        current_row.sort(key=lambda item: item["x"])
        rows.append(current_row)
        
    return rows

def parse_page_rows(rows, default_category, active_brand="UNKNOWN"):
    items = []
    current_brand = active_brand
    
    for row in rows:
        row_text = " ".join(w["text"] for w in row).strip()
        upper_row = row_text.upper()
        
        # 1. Check for Brand Header
        matched_brand = None
        for b in KNOWN_BRANDS:
            if b in upper_row and "TOTAL" not in upper_row and "ITEM" not in upper_row:
                matched_brand = b
                break
        if matched_brand:
            current_brand = matched_brand
            continue
            
        # Skip header or total rows
        if "ITEM CODE" in upper_row or "TOTAL :" in upper_row or "GRAND TOTAL" in upper_row or "STOCK /SALE" in upper_row:
            continue
            
        # 2. Look for item code token (SG... or FR...)
        code_idx = -1
        clean_code = ""
        for i, w in enumerate(row):
            t = re.sub(r'[^A-Za-z0-9]', '', w["text"]).upper()
            # Common OCR typos
            if t.startswith("SCJ") or t.startswith("S0"):
                t = "SG" + t[2:]
            if t.startswith("FRO") or t.startswith("FR0") or t.startswith("FR"):
                t = "FR" + re.sub(r'^[A-Z]+', '', t)
                if not t.startswith("FR"): t = "FR" + t
            if (t.startswith("SG") or t.startswith("FR")) and len(t) >= 6 and any(c.isdigit() for c in t):
                code_idx = i
                clean_code = t
                break
                
        if code_idx == -1:
            continue
            
        # 3. Find model, color, price from tokens to the right of item code
        right_tokens = [w["text"] for w in row[code_idx+1:]]
        if not right_tokens:
            continue
            
        # Find price (number between 500 and 99999)
        price = None
        price_idx = -1
        for p_i in range(len(right_tokens) - 1, -1, -1):
            clean_num = re.sub(r'[^\d]', '', right_tokens[p_i])
            if clean_num and 500 <= int(clean_num) <= 90000:
                price = int(clean_num)
                price_idx = p_i
                break
                
        model = ""
        color = "MIX"
        
        if price_idx != -1:
            desc_tokens = right_tokens[:price_idx]
            if len(desc_tokens) == 1:
                model = desc_tokens[0]
            elif len(desc_tokens) >= 2:
                model = desc_tokens[0]
                color = " ".join(desc_tokens[1:])
        else:
            model = right_tokens[0]
            if len(right_tokens) > 1:
                color = " ".join(right_tokens[1:])
                
        # Clean model name
        model = re.sub(r'[^\w\-/]', '', model)
        if not model or len(model) < 2:
            model = clean_code
            
        # Clean color
        color = re.sub(r'[^\w\-/#]', ' ', color).strip()
        if not color: color = "MIX"
        
        # Standardize Brand name
        canonical_brand = current_brand
        if canonical_brand in ["RAYBAN", "RAY-BAN", "RAY BAN"]:
            canonical_brand = "Ray-Ban"
        elif canonical_brand == "BURBERRY":
            canonical_brand = "Burberry"
        elif canonical_brand == "CARRERA":
            canonical_brand = "Carrera"
        elif canonical_brand == "TOMMY HILFIGER":
            canonical_brand = "Tommy Hilfiger"
        elif canonical_brand == "VOGUE":
            canonical_brand = "Vogue"
        elif canonical_brand == "ARMANI EXCHANGE":
            canonical_brand = "Armani Exchange"
        elif canonical_brand == "EMPORIO ARMANI":
            canonical_brand = "Emporio Armani"
        elif canonical_brand == "BOSS":
            canonical_brand = "Boss"
        elif canonical_brand == "SCOTT":
            canonical_brand = "Scott"
        elif canonical_brand == "FRENCH CONNECTION":
            canonical_brand = "French Connection"
        elif canonical_brand == "STEPPER":
            canonical_brand = "Stepper"
        elif canonical_brand == "BEBE":
            canonical_brand = "Bebe"

        # Model prefix canonicalization override
        m_upper = model.upper()
        if m_upper.startswith("RB") or m_upper.startswith("0RB") or m_upper.startswith("RJ") or m_upper.startswith("0RX"):
            canonical_brand = "Ray-Ban"
        elif m_upper.startswith("VO") or m_upper.startswith("0VO"):
            canonical_brand = "Vogue"
        elif m_upper.startswith("CA") or m_upper.startswith("0CA") or m_upper.startswith("CAPR"):
            canonical_brand = "Carrera"
        elif m_upper.startswith("TH") and any(c.isdigit() for c in m_upper):
            canonical_brand = "Tommy Hilfiger"
        elif m_upper.startswith("AX"):
            canonical_brand = "Armani Exchange"
        elif m_upper.startswith("EA"):
            canonical_brand = "Emporio Armani"
        elif m_upper.startswith("BOSS"):
            canonical_brand = "Boss"
        elif m_upper.startswith("FC") or m_upper.startswith("FCL"):
            canonical_brand = "French Connection"
        elif m_upper.startswith("SI") and any(c.isdigit() for c in m_upper):
            canonical_brand = "Stepper"
        elif m_upper.startswith("BB") and any(c.isdigit() for c in m_upper):
            canonical_brand = "Bebe"
        elif m_upper.startswith("B") and len(m_upper) >= 4 and m_upper[1:5].isdigit() and canonical_brand in ["Burberry", "UNKNOWN", "TOMMY HILFIGER"]:
            canonical_brand = "Burberry"

        is_luxury = canonical_brand in [
            "Ray-Ban", "Burberry", "Carrera", "Tommy Hilfiger", "Vogue",
            "Armani Exchange", "Emporio Armani", "Boss", "Scott",
            "French Connection", "Stepper", "Bebe"
        ]
        
        items.append({
            "category": default_category,
            "brand": canonical_brand,
            "isLuxury": is_luxury,
            "itemCode": clean_code,
            "model": model,
            "color": color,
            "price": price if price else 1990,
            "rawText": row_text
        })
        
    return items, current_brand

async def main():
    uploaded_dir = r"C:\Users\Gaurav\.gemini\antigravity\brain\0e87aa63-fbed-4f19-b294-485c7f197a9a\.user_uploaded"
    pdf1 = os.path.join(uploaded_dir, "media_1792590639256_42943251.pdf")
    pdf2 = os.path.join(uploaded_dir, "media_1792590639275_ce6400e2.pdf")
    
    all_inventory = []
    
    # 1. Process PDF 1 (Sunglasses - 7 pages)
    print("--- Processing PDF 1: Sunglasses ---")
    active_brand = "ARMANI EXCHANGE"
    for p in range(1, 8):
        img_path = f"data/pdf_images/sunglasses/page_{p}.jpg"
        if not os.path.exists(img_path): continue
        words = await ocr_image_words(img_path)
        rows = group_words_into_rows(words, y_threshold=14)
        items, active_brand = parse_page_rows(rows, "sunglasses", active_brand)
        print(f"  Page {p}/7: Extracted {len(items)} items (Current Brand: {active_brand})")
        all_inventory.extend(items)
        
    # 2. Process PDF 2 (Frames - 17 pages with auto rotation)
    print("\n--- Processing PDF 2: Frames ---")
    active_brand = "TOMMY HILFIGER"
    for p in range(1, 18):
        angle = BEST_ANGLES_PDF2.get(p, 0)
        img_orig_path = f"data/pdf_images/frames/page_{p}.jpg"
        if not os.path.exists(img_orig_path): continue
        
        if angle != 0:
            target_img_path = f"data/pdf_images/frames/page_{p}_opt.jpg"
            img = Image.open(img_orig_path)
            img.rotate(angle, expand=True).save(target_img_path)
        else:
            target_img_path = img_orig_path
            
        words = await ocr_image_words(target_img_path)
        rows = group_words_into_rows(words, y_threshold=14)
        items, active_brand = parse_page_rows(rows, "eyeglasses", active_brand)
        print(f"  Page {p}/17 (Angle {angle}°): Extracted {len(items)} items (Current Brand: {active_brand})")
        all_inventory.extend(items)
        
    # Stats
    luxury_items = [item for item in all_inventory if item["isLuxury"]]
    local_items = [item for item in all_inventory if not item["isLuxury"]]
    
    print("\n================ EXTRACTION TOTALS ================")
    print(f"Total Items Extracted: {len(all_inventory)}")
    print(f"Total Luxury / Designer Brand Items: {len(luxury_items)}")
    print(f"Total In-House / Local Wholesale Items: {len(local_items)}")
    
    brand_counts = {}
    for item in all_inventory:
        brand_counts[item["brand"]] = brand_counts.get(item["brand"], 0) + 1
    print("\nBreakdown by Brand:")
    for b, count in sorted(brand_counts.items(), key=lambda x: -x[1]):
        print(f"  - {b:20s}: {count} items")
        
    # Save structured dataset
    out_path = "data/inventory_extracted.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_inventory, f, indent=2)
    print(f"\nSaved all inventory data to: {out_path}")
    
    # Save local brands to separate file as requested
    local_out_path = "data/local_brands_pending.json"
    with open(local_out_path, "w", encoding="utf-8") as f:
        json.dump(local_items, f, indent=2)
    print(f"Saved local/in-house pending brands to: {local_out_path}")

if __name__ == "__main__":
    asyncio.run(main())
