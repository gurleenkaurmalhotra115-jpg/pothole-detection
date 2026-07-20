import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename

import storage
from detector import detect_pothole
from gemini_client import generate_complaint

complaints_bp = Blueprint('complaints', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}


def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def make_error(message: str, code: int = 400):
    return jsonify({'error': message}), code


# ── POST /complaints ──────────────────────────────────────────────────────────
@complaints_bp.route('', methods=['POST'])
def create_complaint():
    if 'image' not in request.files:
        return make_error("No image file provided.")
    
    file = request.files['image']
    location = request.form.get('location', 'Unknown Location').strip()

    if not file or not allowed_file(file.filename):
        return make_error("Invalid file type. Use PNG, JPG, JPEG, or WEBP.")

    complaint_id = str(uuid.uuid4())[:8].upper()
    timestamp = datetime.now(timezone.utc).isoformat()

    # Save original image
    ext = file.filename.rsplit('.', 1)[1].lower()
    img_filename = f"{complaint_id}_before.{ext}"
    annotated_filename = f"{complaint_id}_annotated.{ext}"
    edges_filename = f"{complaint_id}_edges.{ext}"
    closed_filename = f"{complaint_id}_closed.{ext}"

    upload_dir = current_app.config['UPLOAD_FOLDER']
    img_path = os.path.join(upload_dir, img_filename)
    annotated_path = os.path.join(upload_dir, annotated_filename)
    edges_path = os.path.join(upload_dir, edges_filename)
    closed_path = os.path.join(upload_dir, closed_filename)
    file.save(img_path)

    # Run detection
    result = detect_pothole(
        img_path,
        output_path=annotated_path,
        edge_path=edges_path,
        closed_path=closed_path
    )

    if not result.detected:
        # Still create complaint but with no-detection status
        complaint = {
            'id': complaint_id,
            'timestamp': timestamp,
            'location': location,
            'image': img_filename,
            'annotated_image': None,
            'edges_image': edges_filename if os.path.exists(edges_path) else None,
            'closed_image': closed_filename if os.path.exists(closed_path) else None,
            'severity': None,
            'contour_area': 0,
            'confidence': 0,
            'bounding_box': None,
            'complaint_text': None,
            'status': 'no_detection',
            'after_image': None,
            'verification_result': None,
            'verified_at': None,
        }
        storage.create(complaint)
        return jsonify({
            'id': complaint_id,
            'detected': False,
            'message': result.message,
            'complaint': complaint,
        }), 200

    # Generate complaint text via Gemini
    complaint_text = generate_complaint(
        location=location,
        severity=result.severity,
        area=result.contour_area,
        confidence=result.confidence,
        bounding_box=result.bounding_box,
    )

    complaint = {
        'id': complaint_id,
        'timestamp': timestamp,
        'location': location,
        'image': img_filename,
        'annotated_image': annotated_filename if os.path.exists(annotated_path) else None,
        'edges_image': edges_filename if os.path.exists(edges_path) else None,
        'closed_image': closed_filename if os.path.exists(closed_path) else None,
        'severity': result.severity,
        'contour_area': result.contour_area,
        'confidence': result.confidence,
        'bounding_box': result.bounding_box,
        'complaint_text': complaint_text,
        'status': 'reported',
        'after_image': None,
        'verification_result': None,
        'verified_at': None,
    }
    storage.create(complaint)

    return jsonify({
        'id': complaint_id,
        'detected': True,
        'severity': result.severity,
        'confidence': result.confidence,
        'message': result.message,
        'complaint_text': complaint_text,
        'complaint': complaint,
    }), 201


# ── GET /complaints ───────────────────────────────────────────────────────────
@complaints_bp.route('', methods=['GET'])
def list_complaints():
    filters = {}
    if request.args.get('status'):
        filters['status'] = request.args.get('status')
    if request.args.get('severity'):
        filters['severity'] = request.args.get('severity')

    complaints = storage.get_all(filters)
    stats = storage.get_stats()

    return jsonify({'complaints': complaints, 'stats': stats, 'count': len(complaints)})


# ── GET /complaints/<id> ──────────────────────────────────────────────────────
@complaints_bp.route('/<complaint_id>', methods=['GET'])
def get_complaint(complaint_id):
    complaint = storage.get_by_id(complaint_id)
    if not complaint:
        return make_error("Complaint not found.", 404)
    return jsonify(complaint)


# ── PUT /complaints/<id>/status ───────────────────────────────────────────────
@complaints_bp.route('/<complaint_id>/status', methods=['PUT'])
def update_status(complaint_id):
    data = request.get_json()
    if not data or 'status' not in data:
        return make_error("Missing 'status' field.")

    valid_statuses = ['reported', 'in_progress', 'repaired', 'no_detection']
    new_status = data['status']
    if new_status not in valid_statuses:
        return make_error(f"Invalid status. Must be one of: {valid_statuses}")

    updated = storage.update(complaint_id, {
        'status': new_status,
        'status_updated_at': datetime.now(timezone.utc).isoformat(),
        'status_note': data.get('note', ''),
    })

    if not updated:
        return make_error("Complaint not found.", 404)

    return jsonify({'message': 'Status updated.', 'complaint': updated})


# ── POST /complaints/<id>/verify ──────────────────────────────────────────────
@complaints_bp.route('/<complaint_id>/verify', methods=['POST'])
def verify_complaint(complaint_id):
    complaint = storage.get_by_id(complaint_id)
    if not complaint:
        return make_error("Complaint not found.", 404)

    if 'after_image' not in request.files:
        return make_error("No after_image file provided.")

    file = request.files['after_image']
    if not file or not allowed_file(file.filename):
        return make_error("Invalid file type.")

    ext = file.filename.rsplit('.', 1)[1].lower()
    after_filename = f"{complaint_id}_after.{ext}"
    upload_dir = current_app.config['UPLOAD_FOLDER']
    after_path = os.path.join(upload_dir, after_filename)
    file.save(after_path)

    # Re-detect on after image
    result = detect_pothole(after_path)

    if result.detected:
        verification = 'failed'
        status = complaint.get('status', 'in_progress')
        msg = f"Pothole still detected ({result.severity} severity). Repair not verified."
    else:
        verification = 'verified'
        status = 'repaired'
        msg = "No pothole detected. Repair verified ✅"

    updated = storage.update(complaint_id, {
        'after_image': after_filename,
        'verification_result': verification,
        'verified_at': datetime.now(timezone.utc).isoformat(),
        'status': status,
    })

    return jsonify({
        'message': msg,
        'verified': verification == 'verified',
        'complaint': updated,
    })


# ── GET /complaints/uploads/<filename> ───────────────────────────────────────
@complaints_bp.route('/uploads/<filename>', methods=['GET'])
def serve_image(filename):
    upload_dir = os.path.abspath(current_app.config['UPLOAD_FOLDER'])
    return send_from_directory(upload_dir, filename)
