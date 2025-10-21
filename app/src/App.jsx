import { useState } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

// UI Components
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import UploadSection from "./components/UploadSection.jsx";
import Features from "./components/Features.jsx";
import FloatingElements from "./components/FloatingElements.jsx";
import QuizDisplay from "./components/QuizDisplay.jsx";

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
    setLoading(true);
    setMessage("📤 Uploading file...");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("http://localhost:8080/api/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
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
    if (!topic && !docId)
      return toast.error("Please upload a file or enter a topic!");
    setLoading(true);
    setMessage("⚙️ Generating quiz...");

    try {
      const res = await fetch("http://localhost:8080/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: (topic || "").trim(),
          docId: docId || "",
          n: Number(num) || 10,
        }),
      });

      const data = await res.json();

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
          onFileUpload={(f) => setFile(f)}
          uploadedFile={file ? file.name : null}
          selectedTopic={topic}
          onTopicChange={setTopic}
          questionCount={num}
          onQuestionCountChange={setNum}
          onGenerate={() =>
            file ? handleUpload() : generateQuiz({ topic: topic })
          }
          isGenerating={loading}
        />
        <Features />
        {quiz.length > 0 && <QuizDisplay quizzes={quiz} />}

        {message && (
          <p className="text-center text-gray-400 mt-6 mb-10">{message}</p>
        )}

        {quiz.length > 0 && (
          <div className="max-w-3xl mx-auto mt-10 bg-slate-800/30 p-6 rounded-xl border border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">
              Generated Quiz
            </h3>
            <ul className="space-y-3 text-gray-200">
              {quiz.map((q, i) => (
                <li key={i} className="border-b border-slate-700 pb-2">
                  {i + 1}. {q.question}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
