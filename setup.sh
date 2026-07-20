#!/bin/bash
# PotholeAI — One-shot setup script
# Usage: chmod +x setup.sh && ./setup.sh

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     🕳  PotholeAI Setup Script       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Backend ───────────────────────────────────────────────────────────────────
echo "▶ Setting up Python backend..."
cd backend

python3 -m venv venv
source venv/bin/activate

pip install -q --upgrade pip
pip install -q -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  Created backend/.env from template."
  echo "   → Add your GEMINI_API_KEY to backend/.env before running."
fi

mkdir -p uploads data

echo "✅ Backend ready."
deactivate
cd ..

# ── Frontend ──────────────────────────────────────────────────────────────────
echo ""
echo "▶ Setting up React frontend..."
cd frontend

npm install --silent

echo "✅ Frontend ready."
cd ..

# ── Instructions ──────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║             Setup Complete! 🎉                   ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║                                                  ║"
echo "║  1. Edit backend/.env → add GEMINI_API_KEY       ║"
echo "║                                                  ║"
echo "║  2. Start backend:                               ║"
echo "║     cd backend                                   ║"
echo "║     source venv/bin/activate                     ║"
echo "║     python app.py                                ║"
echo "║                                                  ║"
echo "║  3. Start frontend (new terminal):               ║"
echo "║     cd frontend                                  ║"
echo "║     npm start                                    ║"
echo "║                                                  ║"
echo "║  → App: http://localhost:3000                    ║"
echo "║  → API: http://localhost:5000                    ║"
echo "║                                                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
