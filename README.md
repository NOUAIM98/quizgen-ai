Here’s your **final complete README.md** with the added `.env.example` section and polished formatting — fully ready for GitHub ✅

---

# **QuizGen-AI**

## 🚀 Project Overview

**QuizGen-AI** is a hackathon project built for the **AI Accelerate Hackathon (Elastic + Google Cloud Challenge)**.
The app turns uploaded PDFs into **context-aware quizzes** by combining **Elastic Serverless Search**, **Google Cloud Run**, **Firebase Hosting**, and **Vertex AI’s Gemini 2.5 Flash** model.

The goal is to demonstrate **hybrid search with generative AI** while delivering an educational tool that produces instant, high-quality assessments from learning material.

---

## ✨ Features

* 🔒 **Secure PDF upload** pipeline with text extraction via `pdf-js` and `pdf-parse` fallback.
* 🔎 **Elastic-powered indexing and retrieval** scoped by `docId`.
* 🧠 **Quiz generation with Gemini 2.5 Flash**, ensuring:

  * Exactly **five options per MCQ**
  * **Answer always included** in options
  * **Concise explanations**
* ⚡ **Smart fallback** to topic-based quizzes when uploaded text is insufficient.
* 📊 **Inline observability** logs chunk counts and text lengths (no separate debug route).
* 🏁 Ready for hackathon deliverables: live demo hosting, MIT license, and 3-minute demo video.

---

## 🧰 Tech Stack

| Layer                 | Technology                                          |
| --------------------- | --------------------------------------------------- |
| **Frontend**          | React, hosted on **Firebase Hosting**               |
| **Backend**           | Node.js + Express, deployed on **Google Cloud Run** |
| **Search**            | **Elastic Serverless Search** (GCP endpoint)        |
| **AI**                | **Gemini 2.5 Flash API** via **Vertex AI**          |
| **Storage / Hosting** | **Google Cloud Platform**, **Firebase**             |

---

## 🏗️ Architecture Diagram

*(Placeholder — add `docs/architecture.png` or similar illustration)*

```
[Client] --upload--> [Express API] --index--> [Elastic Search]
          \--request quiz--> [Gemini 2.5 Flash via Vertex AI] --> [Client UI]
```

---

## 🧩 API Endpoints

### **POST /api/upload**

**Request:**

* Multipart form-data with PDF file.
  **Process:**
* Extracts text using `pdf-js`, falls back to `pdf-parse`.
* Chunks and indexes content into Elasticsearch under a generated `docId`.
  **Response:**

```json
{
  "docId": "string",
  "chunkCount": 12,
  "message": "Indexed successfully"
}
```

---

### **POST /api/quiz/generate**

**Request:**

```json
{
  "docId": "string",
  "n": 5
}
```

**Process:**

* Fetches indexed text, builds prompt, calls **Gemini 2.5 Flash**.
* Ensures 5 options per question, includes valid answer + explanation.
* If text is insufficient, generates a topic-based quiz.
  **Response:**

```json
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D", "E"],
      "answer": "B",
      "explanation": "string"
    }
  ],
  "sourceMeta": {}
}
```

---

## ⚙️ Installation & Setup

### **Prerequisites**

* Node.js **v18+**
* Yarn or npm
* Firebase CLI
* gcloud CLI

---

### **Local Setup**

```bash
git clone https://github.com/NOUAIM98/quizgen-ai.git
cd quizgen-ai
npm install
```

---

### **Environment Variables**

Create `.env` files for both backend (`/server/.env`) and frontend if needed.

#### 📄 Example `.env.example`

```env
# Elastic Search Configuration
ELASTIC_URL=https://your-elastic-instance.es.amazonaws.com
ELASTIC_API_KEY=your-elastic-api-key
ELASTIC_INDEX=quizgen-docs

# Google AI / Vertex API Key
GOOGLE_API_KEY=your-vertex-api-key

# Optional (Frontend)
REACT_APP_API_URL=https://your-cloud-run-service-url
```

> ⚠️ Ensure you have access to **Vertex AI Gemini 2.5 Flash** and proper **Elasticsearch** permissions before running locally.

---

### **Running Locally**

```bash
# Backend
cd server
npm run dev

# Frontend
cd ../web
npm start
```

---

## ☁️ Deployment Guide

### **Backend → Google Cloud Run**

```bash
# Build container image
gcloud builds submit --tag gcr.io/<project-id>/quizgen-api

# Deploy service
gcloud run deploy quizgen-api \
  --image gcr.io/<project-id>/quizgen-api \
  --region <region> \
  --allow-unauthenticated
```

Then set your environment variables:

```bash
gcloud run services update quizgen-api \
  --set-env-vars ELASTIC_URL=...,ELASTIC_API_KEY=...,GOOGLE_API_KEY=...
```

Add the Cloud Run **HTTPS URL** to your frontend `.env`.

---

### **Frontend → Firebase Hosting**

```bash
# Inside /web
npm run build
firebase init hosting
firebase deploy --only hosting
```

✅ Configure frontend to use the Cloud Run API endpoint.
✅ Verify that upload and quiz generation both work.

---

## 📦 Hackathon Submission Notes

* Public GitHub repo with `README.md` and `LICENSE`
* Hosted live demo (Firebase + Cloud Run URLs)
* 3-minute demo video uploaded to YouTube
* Add both URLs to your **Devpost submission**

---

## 📜 License

This project is licensed under the **MIT License**.
See the [LICENSE](./LICENSE) file for details.

---

## 🙌 Acknowledgements

* **Elastic + Google Cloud Hackathon 2025** organizers and mentors
* **Google Cloud Run**, **Firebase Hosting**, **Vertex AI**, and **Elastic Serverless** teams for their tools and APIs
* Built with ❤️ by **Mohamed Nouaim El Aakil**

---

