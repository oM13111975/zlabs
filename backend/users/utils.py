import re
import io
from pdfminer.high_level import extract_text
import PyPDF2

def extract_metadata_from_resume(file_obj):
    """
    Final Ultra-Precision scanner.
    - Uses Lookbehind/Lookahead to isolate phone numbers even when attached to icons.
    - Specifically excludes digits from URLs or ID strings.
    """
    try:
        # 1. Multi-Engine Extraction
        text = ""
        try:
            text = extract_text(file_obj)
        except Exception:
            pass

        if len(text.strip()) < 50:
            try:
                file_obj.seek(0)
                reader = PyPDF2.PdfReader(file_obj)
                fallback_text = ""
                for page in reader.pages:
                    fallback_text += page.extract_text() or ""
                if len(fallback_text.strip()) > len(text.strip()):
                    text = fallback_text
            except Exception:
                pass
        
        # 2. Refined Email Extraction
        email = ""
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = re.findall(email_pattern, text)
        
        if emails:
            raw_email = emails[0].strip().lower()
            artifacts = ['pe', 'en', 'envelope', 'email', 'mail', 'id', 'p']
            cleaned_email = raw_email
            for art in artifacts:
                if raw_email.startswith(art) and len(raw_email) > (len(art) + 3):
                    potential = raw_email[len(art):]
                    if re.match(r'^[a-z]', potential):
                        cleaned_email = potential
                        break
            email = cleaned_email

        # 3. Refined Phone Extraction (Anti-Collision)
        phone = ""
        # Lookbehind (?<!\d) ensures we don't start inside another number (like a LinkedIn ID)
        # Lookahead (?!\d) ensures we don't end inside another number
        
        # Priority 1: Standalone 10 digits starting with 6-9
        p1 = re.findall(r'(?<!\d)([6-9]\d{9})(?!\d)', text)
        
        # Priority 2: Standalone 12 digits starting with 91, middle is 6-9
        p2 = re.findall(r'(?<!\d)(?:91|0)([6-9]\d{9})(?!\d)', text)
        
        if p1:
            phone = p1[0]
        elif p2:
            phone = p2[0]
        else:
            # Last resort: just any bounded 10 digits
            p3 = re.findall(r'(?<!\d)(\d{10})(?!\d)', text)
            if p3: phone = p3[0]

        return {
            "email": email,
            "phone": phone
        }
    except Exception as e:
        print(f"Final precision extraction failed: {e}")
        return {"email": "", "phone": ""}
