# quizgen-ai
Folder structure :
quizgen-ai/
 ├── api/                # Backend (Node/Express)
 │   ├── package.json
 │   ├── src/
 │   │   ├── index.js    # Express app entry
 │   │   ├── routes/
 │   │   │   ├── ask.js
 │   │   │   ├── quiz.js
 │   │   │   └── upload.js
 │   │   └── utils/
 │   │       ├── elastic.js
 │   │       ├── vertex.js
 │   │       └── pdfParser.js
 │   └── Dockerfile
 │
 ├── app/                # Frontend (Next.js + Tailwind)
 │   ├── package.json
 │   ├── pages/
 │   │   ├── index.js
 │   │   ├── chat.js
 │   │   └── quiz.js
 │   └── components/
 │       ├── ChatBubble.jsx
 │       ├── QuizCard.jsx
 │       └── UploadDropzone.jsx
 │
 ├── README.md
 ├── .env.example
 └── LICENSE
