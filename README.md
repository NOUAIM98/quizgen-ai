```markdown
# QuizGen-AI

Turn PDFs or topics into **context-aware quizzes** using **Elastic** (hybrid search) + **Google Cloud (Cloud Run, Firebase, Gemini 2.5 Flash)**. Built for the **AI Accelerate Hackathon – Elastic + Google Cloud**.

---

## 🔗 Live

- **Web App:** https://quizgen-ai-18d50.web.app  
- **Backend (Cloud Run):** https://quizgen-api-86664155509.us-central1.run.app

---

## ✨ Features

- Upload PDF → extract → chunk → **index in Elastic** (scoped by `docId`)
- **Quiz generation** with **Gemini 2.5 Flash (v1)**:
  - 5 options per MCQ, **answer included**, short explanation
- **Fallback** to topic-based quiz when text is insufficient
- **CORS allowlist** for web.app/firebaseapp.com + localhost

---

## 🧰 Stack

| Layer      | Tech |
|-----------|------|
| Frontend  | React (Vite) + **Firebase Hosting** |
| Backend   | Node.js + Express on **Cloud Run** |
| AI        | **Vertex AI – Gemini 2.5 Flash (v1)** |
| Search    | **Elastic Cloud** (Serverless / managed) |
| Tooling   | gcloud CLI, Firebase CLI |

---

## 🏗️ Architecture

```

[Web (Firebase)]  --fetch-->  [Cloud Run API]
|                          |---> Elastic: index/query (docId, hybrid)
|                          |---> Vertex AI: Gemini 2.5 Flash (v1)
└────────── quiz JSON <────┘

````

---

## 📡 API

### POST `/api/upload`
- `multipart/form-data`: `file=@<pdf>`
- Extracts text, chunks, indexes to Elastic under `docId`.

**Response**
```json
{ "ok": true, "docId": "e72c...", "title": "file.pdf", "chunksIndexed": 37, "textLen": 12345 }
````

### POST `/api/quiz/generate`

* Body (one of):

```json
{ "docId": "e72c...", "numQuestions": 10 }
```

```json
{ "topic": "education", "numQuestions": 10 }
```

**Response**

```json
{
  "ok": true,
  "count": 10,
  "quiz": [{
    "question": "What is ...?",
    "options": ["A","B","C","D","E"],
    "answer": "B",
    "explanation": "..."
  }]
}
```

---

## ⚙️ Local Dev

### 1) Clone

```bash
git clone https://github.com/NOUAIM98/quizgen-ai.git
cd quizgen-ai
```

### 2) Environment

**`/api/.env.example`**

```env
# Google / Vertex AI
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
GEMINI_MODEL=gemini-2.5-flash

# Elastic
ELASTIC_URL=https://my-elasticsearch-project-xxxx.es.us-central1.gcp.elastic.cloud:443
ELASTIC_INDEX=myquizproject
ELASTIC_API_KEY=BASE64_ID_COLON_APIKEY  # id:apikey -> base64



**`/app/.env.example`**

```env
VITE_API=https://quizgen-api-86664155509.us-central1.run.app
```

> Copy each `.env.example` to `.env` (or `.env.production` for frontend) and fill values.

### 3) Run

```bash
# backend
cd api
npm i
npm run dev  # http://localhost:8080

# frontend
cd ../app
npm i
npm run dev  # http://localhost:5173
```

---

## ☁️ Deployment

### A) Cloud Run (backend)

**Bash / zsh**

```bash
cd api
gcloud run deploy quizgen-api --region us-central1 --source . \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_API_KEY=$GOOGLE_API_KEY,GEMINI_MODEL=gemini-2.5-flash,ELASTIC_URL=https://my-elasticsearch-project-xxxx.es.us-central1.gcp.elastic.cloud:443,ELASTIC_INDEX=myquizproject,ELASTIC_API_KEY=$ELASTIC_API_KEY,CORS_ALLOWED_ORIGINS=https://quizgen-ai-18d50.web.app,https://quizgen-ai-18d50.firebaseapp.com,http://localhost:5173,http://localhost:3000"
```

**PowerShell**

```powershell
cd api
gcloud run deploy quizgen-api --region us-central1 --source . `
  --allow-unauthenticated `
  --set-env-vars "GOOGLE_API_KEY=$env:GOOGLE_API_KEY,GEMINI_MODEL=gemini-2.5-flash,ELASTIC_URL=https://my-elasticsearch-project-xxxx.es.us-central1.gcp.elastic.cloud:443,ELASTIC_INDEX=myquizproject,ELASTIC_API_KEY=$env:ELASTIC_API_KEY,CORS_ALLOWED_ORIGINS=https://quizgen-ai-18d50.web.app,https://quizgen-ai-18d50.firebaseapp.com,http://localhost:5173,http://localhost:3000"
```

**Smoke test**

```bash
curl -s https://<run-app>/api/healthz
curl -s https://<run-app>/api/quiz/ping
```

### B) Firebase Hosting (frontend)

```bash
cd app
# point to Cloud Run
echo VITE_API=https://<run-app> > .env.production
npm run build
firebase deploy --only hosting
```

---

## 🔬 cURL Quick Tests (prod)

```bash
# Topic quiz
curl -s -X POST "https://<run-app>/api/quiz/generate" \
  -H "Content-Type: application/json" \
  -d '{"topic":"education","numQuestions":5}'

# Upload then quiz by docId
curl -s -X POST "https://<run-app>/api/upload" -F "file=@./docs/sample.pdf"
# -> take docId from response:
curl -s -X POST "https://<run-app>/api/quiz/generate" \
  -H "Content-Type: application/json" \
  -d '{"docId":"PUT_DOCID","numQuestions":5}'
```

---

## 📝 Hackathon Submission

* Live app + backend URL (above)
* Public GitHub repo with **README** + **LICENSE**
* 3-minute demo video (YouTube/Vimeo)
* Select **Elastic Challenge** on Devpost

---

## 🔒 Notes

* Only **Gemini 2.5 Flash (v1)** is used; no other LLMs
* No secrets in repo; all env via **Cloud Run**
* CORS allowlist enforced for web.app/firebaseapp.com + localhost

---

