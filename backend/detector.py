import cv2
import numpy as np
from dataclasses import dataclass
from typing import Optional

# Configurable thresholds
SEVERITY_THRESHOLDS = {
    'high':   15000,   # contour area px²
    'medium': 5000,
    'low':    500,     # minimum to detect at all
}

DETECTION_CONFIG = {
    'blur_kernel': (5, 5),
    'canny_low': 50,
    'canny_high': 150,
    'dilate_iterations': 2,
    'min_aspect_ratio': 0.2,
    'max_aspect_ratio': 5.0,
}


@dataclass
class DetectionResult:
    detected: bool
    severity: Optional[str]
    contour_area: float
    confidence: float
    bounding_box: Optional[dict]
    annotated_image_path: Optional[str]
    message: str


def detect_pothole(image_path: str, output_path: Optional[str] = None,
                   edge_path: Optional[str] = None, closed_path: Optional[str] = None) -> DetectionResult:
    """
    Detect potholes in an image using OpenCV contour analysis.
    Returns detection result with severity classification.
    """
    img = cv2.imread(image_path)
    if img is None:
        return DetectionResult(
            detected=False, severity=None, contour_area=0.0,
            confidence=0.0, bounding_box=None, annotated_image_path=None,
            message="Could not read image file."
        )

    original = img.copy()
    h, w = img.shape[:2]
    total_area = h * w

    # Preprocessing pipeline
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, DETECTION_CONFIG['blur_kernel'], 0)

    # Adaptive thresholding for varying lighting
    thresh = cv2.adaptiveThreshold(
        blurred, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 11, 2
    )

    # Edge detection
    edges = cv2.Canny(blurred, DETECTION_CONFIG['canny_low'], DETECTION_CONFIG['canny_high'])

    # Combine edge + threshold masks
    combined = cv2.bitwise_or(thresh, edges)

    # Morphological operations to close gaps
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    dilated = cv2.dilate(combined, kernel, iterations=DETECTION_CONFIG['dilate_iterations'])
    closed = cv2.morphologyEx(dilated, cv2.MORPH_CLOSE, kernel, iterations=2)

    if edge_path:
        cv2.imwrite(edge_path, edges)
    if closed_path:
        cv2.imwrite(closed_path, closed)

    # Find contours
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best_contour = None
    best_area = 0.0

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < SEVERITY_THRESHOLDS['low']:
            continue

        # Filter by shape (potholes tend to be roughly circular/oval)
        x, y, cw, ch = cv2.boundingRect(cnt)
        aspect = cw / ch if ch > 0 else 0
        if not (DETECTION_CONFIG['min_aspect_ratio'] <= aspect <= DETECTION_CONFIG['max_aspect_ratio']):
            continue

        # Prefer larger contours that are near image center (likely road surface)
        cx, cy = x + cw // 2, y + ch // 2
        dist_from_center = ((cx - w // 2) ** 2 + (cy - h // 2) ** 2) ** 0.5
        normalized_dist = dist_from_center / (((w / 2) ** 2 + (h / 2) ** 2) ** 0.5)
        score = area * (1 - normalized_dist * 0.3)

        if score > best_area:
            best_area = score
            best_contour = cnt

    if best_contour is None:
        return DetectionResult(
            detected=False, severity=None, contour_area=0.0,
            confidence=0.0, bounding_box=None, annotated_image_path=None,
            message="No pothole detected in image."
        )

    real_area = cv2.contourArea(best_contour)
    x, y, cw, ch = cv2.boundingRect(best_contour)

    # Confidence: ratio of contour area to image area (capped at 1.0)
    confidence = min(real_area / (total_area * 0.3), 1.0)

    # Severity classification
    severity = classify_severity(real_area)

    # Annotate image
    annotated_path = None
    if output_path:
        color_map = {'high': (0, 0, 255), 'medium': (0, 165, 255), 'low': (0, 255, 0)}
        color = color_map.get(severity, (255, 255, 0))

        cv2.drawContours(original, [best_contour], -1, color, 3)
        cv2.rectangle(original, (x, y), (x + cw, y + ch), color, 2)

        label = f"Pothole | Severity: {severity.upper()} | Area: {int(real_area)}"
        cv2.putText(original, label, (x, max(y - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        cv2.imwrite(output_path, original)
        annotated_path = output_path

    return DetectionResult(
        detected=True,
        severity=severity,
        contour_area=real_area,
        confidence=round(confidence, 3),
        bounding_box={'x': x, 'y': y, 'width': cw, 'height': ch},
        annotated_image_path=annotated_path,
        message=f"Pothole detected with {severity} severity."
    )


def classify_severity(area: float) -> str:
    if area >= SEVERITY_THRESHOLDS['high']:
        return 'high'
    elif area >= SEVERITY_THRESHOLDS['medium']:
        return 'medium'
    else:
        return 'low'
