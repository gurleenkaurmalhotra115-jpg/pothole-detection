🚗 Project Release: PotholeAI — OpenCV Computer Vision & Gemini AI Road Auditing System!

How do you transform a standard road photo into an automated, verified municipal repair order? By combining classical computer vision pipelines with generative AI.

I’m excited to share **PotholeAI**, a full-stack complaint management and infrastructure auditing system built using **React, Python Flask, OpenCV, and Google Gemini AI**.

### 🛠️ The Tech Stack
* **Computer Vision**: Python OpenCV, NumPy
* **Generative AI**: Google Gemini AI (via `gemini-1.5-flash`)
* **Full-Stack Core**: React (Tailwind CSS) & Flask (thread-safe JSON store)

---

### 💡 High-Impact Features & Solutions:

1. **Multi-Stage OpenCV Edge Isolation**:
   To analyze road damage, I built a preprocessing pipeline in Python:
   * Smooths pixel noise via Gaussian blurs.
   * Runs adaptive Gaussian thresholding to compensate for shadows and varying sunlight.
   * Extracts sharp edge paths using a Canny Edge filter.
   * Combines masks and applies morphological closing with a `7x7` elliptical kernel to bridge edge gaps.
   * Evaluates contours by area, aspect ratio, and relative proximity to the image center.

2. **Interactive CV Pipeline Visualizer**:
   To show recruiters exactly how the code works, I built a tabbed visualizer in React. Instead of showing just a final outline, users can toggle between:
   * **Original Input** (Raw upload)
   * **Canny Boundaries** (Edges output)
   * **Morphological Closed Mask** (Gap-closing binary mask)
   * **Final Detections** (Annotated contour boxes & severity check)

3. **Gemini AI Complaint Generator**:
   If a pothole is confirmed, the CV engine sends key metrics (pixel area, bounding boxes, severity classification) to Google’s Gemini model, which drafts a formal, structured repair letter to the municipal road maintenance department.

4. **Differential Repair Verification**:
   Built a closed-loop system where contractors can upload "after" photos. The OpenCV pipeline runs a differential re-scan; if no pothole contours exceeding the threshold are detected, the system auto-resolves the ticket and stamps it as "repaired."

---

💻 **Explore the GitHub Repository**: [Link to your GitHub repository here]
🎥 **Live demo**: [Link to demo or attachment here]

Building this system deepened my understanding of pixel transformation arrays, spatial contour math, and combining deterministic computer vision with probabilistic generative AI. 

I'd love to hear your thoughts on combining classical CV with modern LLMs!

#ComputerVision #OpenCV #Python #ReactJS #GenerativeAI #Gemini #SoftwareEngineering #SmartCities #PortfolioProject
