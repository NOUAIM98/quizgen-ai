# QuizGen AI

An AI-powered education assistant for the Elastic + Google Cloud Hackathon.

## Features
- Upload PDFs → indexed in Elastic.
- Ask questions → Gemini generates answers with citations.
- Generate quizzes (MCQs, flashcards) from course materials.

## Tech Stack
- Elastic Cloud (hybrid search, vector database).
- Google Cloud Vertex AI (Gemini, embeddings).
- Next.js + Tailwind (frontend).
- Node.js + Express (backend).
- Cloud Run + Firebase Hosting (deployment).

## Setup
1. Clone repo.
2. Copy `.env.example` → `.env` and fill values.
3. Install dependencies for backend:
   ```bash
   cd api && npm install
