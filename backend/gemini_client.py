import os
import google.generativeai as genai
from typing import Optional

# Configure Gemini
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

def _get_model():
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable not set.")
    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel('gemini-1.5-flash')


def generate_complaint(
    location: str,
    severity: str,
    area: float,
    confidence: float,
    bounding_box: Optional[dict] = None
) -> str:
    """
    Generate a formal complaint text using Gemini based on detection results.
    Falls back to template if API unavailable.
    """
    try:
        model = _get_model()

        severity_desc = {
            'high': 'extremely dangerous, large pothole posing serious risk to vehicles and pedestrians',
            'medium': 'moderately sized pothole causing vehicle damage and road hazard',
            'low': 'small pothole that may worsen without timely intervention'
        }.get(severity, 'pothole')

        size_context = ""
        if bounding_box:
            size_context = f"The pothole spans approximately {bounding_box['width']}x{bounding_box['height']} pixels in the captured image."

        prompt = f"""You are a formal road maintenance complaint writer for a municipal corporation.

Generate a professional, concise complaint letter (3-4 sentences) reporting a pothole.

Details:
- Location: {location}
- Severity Level: {severity.upper()} — {severity_desc}
- Detection Confidence: {int(confidence * 100)}%
- Contour Area: {int(area)} sq pixels
- {size_context}

The complaint should:
1. Clearly state the pothole location and its danger level
2. Mention potential risks to road users
3. Urgently request repair based on severity (HIGH = immediate, MEDIUM = within a week, LOW = scheduled)
4. Be addressed to the Road Maintenance Department

Write ONLY the complaint text, no headers or signatures."""

        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        return _fallback_complaint(location, severity, confidence)


def _fallback_complaint(location: str, severity: str, confidence: float) -> str:
    urgency = {
        'high': 'immediate',
        'medium': 'urgent',
        'low': 'scheduled'
    }.get(severity, 'prompt')

    return (
        f"This is to formally report the presence of a {severity}-severity pothole detected at {location}. "
        f"The pothole was identified via AI-assisted image analysis with {int(confidence * 100)}% confidence "
        f"and poses a risk to vehicular and pedestrian safety. "
        f"We respectfully request {urgency} inspection and repair by the Road Maintenance Department."
    )
