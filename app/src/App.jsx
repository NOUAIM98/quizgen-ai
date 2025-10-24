import { useState } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import UploadSection from "./components/UploadSection.jsx";
import Features from "./components/Features.jsx";
import FloatingElements from "./components/FloatingElements.jsx";
import QuizDisplay from "./components/QuizDisplay.jsx";

// --- API base (supports either env name) ---
const API_BASE = String(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API || ""
).replace(/\/$/, ""); // remove trailing slash

if (!API_BASE) {
  // Helpful during dev; remove if you use Firebase rewrite proxying /api/**
  console.error("Missing VITE_API_BASE_URL (or VITE_API).");
}

async function readJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const txt = await res.text();
    throw new Error(`Non-JSON from ${res.url}: ${res.status} ${txt.slice(0,120)}`);
  }
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status} ${txt}`);
  }
  return res.json();
}

export default function App() {
  const [file, setFile] = useState(null);
  const [topic, setTopic] = useState("");
  const [num, setNum] = useState(10);
  const [quiz, setQuiz] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Upload file ---
  async function handleUpload() {
    if (!file) return toast.error("Please select a PDF file first!");
    if (!API_BASE) return toast.error("API base URL not configured.");
    setLoading(true);
    setMessage("📤 Uploading file...");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: form });
      const data = await readJson(res);

      if (data.ok && data.docId) {
        toast.success("✅ Upload complete. Generating quiz...");
        setMessage("✅ Upload complete. Generating quiz...");
        await generateQuiz({ docId: data.docId });
      } else {
        toast.error("❌ Upload failed!");
        setMessage("❌ Upload failed: " + (data.message || "no document ID"));
      }
    } catch (err) {
      toast.error("Upload error");
      setMessage("❌ Upload error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Generate quiz ---
  async function generateQuiz({ topic = "", docId = "" }) {
    if (!topic && !docId) return toast.error("Please upload a file or enter a topic!");
    if (!API_BASE) return toast.error("API base URL not configured.");
    setLoading(true);
    setMessage("⚙️ Generating quiz...");

    try {
      const res = await fetch(`${API_BASE}/api/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: (topic || "").trim(),
          docId: docId || "",
          n: Number(num) || 10,
        }),
      });
      const data = await readJson(res);

      if (data.ok) {
        toast.success(`✅ Generated ${data.count} questions`);
        setQuiz(data.quiz);
        setMessage(`✅ Generated ${data.count} questions`);
      } else {
        toast.error("Quiz generation failed");
        setMessage(`❌ Quiz generation failed: ${data.message}`);
      }
    } catch (err) {
      toast.error("Generation error");
      setMessage("❌ Quiz generation error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      <Toaster position="top-right" />
      <FloatingElements />

      {/* Background stars */}
      <div className="absolute inset-0 opacity-50">
        {Array.from({ length: 50 }, (_, index) => (
          <div
            key={index}
            className="absolute w-1 h-1 bg-white rounded-full animate-starry"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main layout */}
      <div className="relative z-10">
        <Header />
        <Hero />
        <UploadSection
          onFileUpload={setFile}
          uploadedFile={file ? file.name : null}
          selectedTopic={topic}
          onTopicChange={setTopic}
          questionCount={num}
          onQuestionCountChange={setNum}
          onGenerate={() => (file ? handleUpload() : generateQuiz({ topic }))}
          isGenerating={loading}
        />
        <Features />
        {quiz.length > 0 && <QuizDisplay quizzes={quiz} />}

        {message && (
          <p className="text-center text-gray-400 mt-6 mb-10">{message}</p>
        )}
      </div>
    </div>
  );
}
