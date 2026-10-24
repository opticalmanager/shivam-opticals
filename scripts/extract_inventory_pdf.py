import asyncio
import os
import re
import json
import pypdf
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

async def ocr_image(image_path):
    abs_path = os.path.abspath(image_path)
    file = await StorageFile.get_file_from_path_async(abs_path)
    stream = await file.open_async(0)
    decoder = await BitmapDecoder.create_async(stream)
    bitmap = await decoder.get_software_bitmap_async()
    engine = OcrEngine.try_create_from_user_profile_languages()
    ocr_result = await engine.recognize_async(bitmap)
    return [line.text.strip() for line in ocr_result.lines if line.text.strip()]

def parse_lines_for_brand_and_items(lines, default_category):
    extracted_items = []
    current_brand = "UNKNOWN"
    
    # Regex patterns
    item_code_pattern = re.compile(r'^(SG|FR)\d{4,5}[A-Z]?$', re.IGNORECASE)
    
    for idx, raw_line in enumerate(lines):
        line = raw_line.strip()
        upper_line = line.upper()
        
        # Check for Brand header
        brand_match = None
        for b in KNOWN_BRANDS:
            if upper_line == b or upper_line.startswith(b + " ") or upper_line.endswith(" " + b):
                # Avoid matching TOTAL lines
                if "TOTAL" not in upper_line:
                    brand_match = b
                    break
        
        if brand_match:
            current_brand = brand_match
            continue
            
        # Try to find tokens matching Item Code (SG... or FR...)
        tokens = line.split()
        code_idx = -1
        for i, t in enumerate(tokens):
            clean_t = re.sub(r'[^A-Z0-9]', '', t.upper())
            # Handle common OCR misread of 'S' as 'SCJ' or 'S0' or '$'
            if clean_t.startswith("SCJ") or clean_t.startswith("S0"):
                clean_t = "SG" + clean_t[2:]
            if clean_t.startswith("SG") or clean_t.startswith("FR"):
                if len(clean_t) >= 6 and any(c.isdigit() for c in clean_t):
                    code_idx = i
                    tokens[i] = clean_t
                    break
                    
        if code_idx != -1:
            item_code = tokens[code_idx]
            # Rest of the line has model, color, price
            remaining = tokens[code_idx+1:]
            
            # Look for price (integer, typically 700 to 45000)
            price = None
            price_idx = -1
            for p_i in range(len(remaining) - 1, -1, -1):
                clean_num = re.sub(r'[^\d]', '', remaining[p_i])
                if clean_num and len(clean_num) >= 3 and len(clean_num) <= 6:
                    val = int(clean_num)
                    if 500 <= val <= 90000:
                        price = val
                        price_idx = p_i
                        break
                        
            model = ""
            color = "MIX"
            
            if price_idx != -1:
                desc_tokens = remaining[:price_idx]
                if len(desc_tokens) == 1:
                    model = desc_tokens[0]
                elif len(desc_tokens) >= 2:
                    model = desc_tokens[0]
                    color = " ".join(desc_tokens[1:])
            elif remaining:
                model = remaining[0]
                if len(remaining) > 1:
                    color = " ".join(remaining[1:])
                    
            if not model:
                model = item_code
                
            extracted_items.append({
                "category": default_category,
                "brand": current_brand,
                "itemCode": item_code,
                "model": model.strip(),
                "color": color.strip(),
                "price": price if price else 1990,
                "rawLine": line
            })
            
    return extracted_items

async def process_pdf(pdf_path, category, prefix):
    print(f"Reading PDF: {pdf_path} ({category})...")
    reader = pypdf.PdfReader(pdf_path)
    total_pages = len(reader.pages)
    print(f"Total pages: {total_pages}")
    
    img_dir = os.path.join(process_cwd, "data", "pdf_images", prefix)
    os.makedirs(img_dir, exist_ok=True)
    
    all_items = []
    
    for page_num in range(total_pages):
        page = reader.pages[page_num]
        if not page.images:
            continue
            
        img = page.images[0]
        img_path = os.path.join(img_dir, f"page_{page_num+1}.jpg")
        with open(img_path, "wb") as f:
            f.write(img.data)
            
        lines = await ocr_image(img_path)
        items = parse_lines_for_brand_and_items(lines, category)
        print(f"  Page {page_num+1}/{total_pages}: {len(lines)} lines OCR'd -> {len(items)} items found")
        all_items.extend(items)
        
    return all_items

async def main():
    global process_cwd
    process_cwd = os.getcwd()
    
    uploaded_dir = r"C:\Users\Gaurav\.gemini\antigravity\brain\0e87aa63-fbed-4f19-b294-485c7f197a9a\.user_uploaded"
    pdf1 = os.path.join(uploaded_dir, "media_1792590639256_42943251.pdf") # Sunglasses (7 pages)
    pdf2 = os.path.join(uploaded_dir, "media_1792590639275_ce6400e2.pdf") # Frames (17 pages)
    
    sunglasses_items = await process_pdf(pdf1, "sunglasses", "sunglasses")
    frames_items = await process_pdf(pdf2, "eyeglasses", "frames")
    
    all_inventory = sunglasses_items + frames_items
    
    output_path = os.path.join(process_cwd, "data", "inventory_extracted.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_inventory, f, indent=2)
        
    print(f"\n--- EXTRACTION COMPLETE ---")
    print(f"Total Sunglasses extracted: {len(sunglasses_items)}")
    print(f"Total Frames extracted: {len(frames_items)}")
    print(f"Total Inventory items extracted: {len(all_inventory)}")
    print(f"Saved to: {output_path}")

if __name__ == "__main__":
    asyncio.run(main())
