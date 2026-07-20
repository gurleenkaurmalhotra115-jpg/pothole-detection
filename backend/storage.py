import json
import os
import threading
from typing import List, Optional, Dict, Any

_lock = threading.Lock()
COMPLAINTS_FILE = os.environ.get('COMPLAINTS_FILE', 'data/complaints.json')


def _load() -> List[Dict]:
    if not os.path.exists(COMPLAINTS_FILE):
        return []
    try:
        with open(COMPLAINTS_FILE, 'r') as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, IOError):
        return []


def _save(complaints: List[Dict]) -> None:
    os.makedirs(os.path.dirname(COMPLAINTS_FILE), exist_ok=True)
    with open(COMPLAINTS_FILE, 'w') as f:
        json.dump(complaints, f, indent=2, default=str)


def get_all(filters: Optional[Dict] = None) -> List[Dict]:
    with _lock:
        data = _load()
    if not filters:
        return data
    result = data
    if filters.get('status'):
        result = [c for c in result if c.get('status') == filters['status']]
    if filters.get('severity'):
        result = [c for c in result if c.get('severity') == filters['severity']]
    return sorted(result, key=lambda x: x.get('timestamp', ''), reverse=True)


def get_by_id(complaint_id: str) -> Optional[Dict]:
    with _lock:
        data = _load()
    return next((c for c in data if c['id'] == complaint_id), None)


def create(complaint: Dict) -> Dict:
    with _lock:
        data = _load()
        data.append(complaint)
        _save(data)
    return complaint


def update(complaint_id: str, updates: Dict) -> Optional[Dict]:
    with _lock:
        data = _load()
        for i, c in enumerate(data):
            if c['id'] == complaint_id:
                data[i].update(updates)
                _save(data)
                return data[i]
    return None


def delete(complaint_id: str) -> bool:
    with _lock:
        data = _load()
        original_len = len(data)
        data = [c for c in data if c['id'] != complaint_id]
        if len(data) < original_len:
            _save(data)
            return True
    return False


def get_stats() -> Dict[str, Any]:
    with _lock:
        data = _load()
    total = len(data)
    by_status = {}
    by_severity = {}
    for c in data:
        s = c.get('status', 'unknown')
        sv = c.get('severity', 'unknown')
        by_status[s] = by_status.get(s, 0) + 1
        by_severity[sv] = by_severity.get(sv, 0) + 1
    return {
        'total': total,
        'by_status': by_status,
        'by_severity': by_severity,
    }
