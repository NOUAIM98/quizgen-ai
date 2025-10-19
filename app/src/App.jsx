import { useState } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [topic, setTopic] = useState("");
  const [num, setNum] = useState(10);
  const [quiz, setQuiz] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleUpload() {
    if (!file) return alert("Select a PDF first!");
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
        setMessage("✅ Upload complete. Generating quiz...");
        await generateQuiz({ docId: data.docId });
      } else {
        setMessage("❌ Upload failed: " + (data.message || "no document ID"));
      }
    } catch (err) {
      setMessage("❌ Upload error: " + err.message);
    } finally {
      setLoading(false);
    }
  }
  

  async function generateQuiz({ topic = "", docId = "" }) {
    setLoading(true);
    setMessage("⚙️ Generating quiz...");
    try {
      const res = await fetch("http://localhost:8080/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, docId, n: num }),
      });
      const data = await res.json();

      if (data.ok) {
        setQuiz(data.quiz);
        setMessage(`✅ Generated ${data.count} questions`);
      } else {
        setMessage(`❌ Quiz generation failed: ${data.message}`);
      }
    } catch (err) {
      setMessage("❌ Quiz generation error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2rem", color: "#222" }}>QuizGen-AI</h1>
      <p style={{ color: "#666" }}>Upload a PDF or enter a topic manually</p>

      <div style={{ marginBottom: "20px" }}>
        <label><b>Enter Topic:</b></label>{" "}
        <input
          type="text"
          placeholder="e.g. Artificial Intelligence"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{ padding: "6px", width: "250px", marginRight: "10px" }}
        />
        <label><b># of Questions:</b></label>{" "}
        <select
          value={num}
          onChange={(e) => setNum(Number(e.target.value))}
          style={{ marginLeft: "5px", padding: "4px" }}
        >
          {[5, 10, 15, 20, 25, 30].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <button
          onClick={() => generateQuiz({ topic })}
          disabled={!topic || loading}
          style={{
            marginLeft: "10px",
            padding: "6px 12px",
            background: "#4B0EAC",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Generate from Topic
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            marginLeft: "10px",
            padding: "6px 12px",
            background: "#9C6FE4",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {loading ? "Processing..." : "Upload PDF & Generate"}
        </button>
      </div>

      <p>{message}</p>

      {quiz.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          {quiz.map((q, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "12px",
                marginBottom: "12px",
                background: "#fafafa",
              }}
            >
              <strong>{i + 1}. {q.question}</strong>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {q.options.map((opt, j) => (
                  <li key={j}>• {opt}</li>
                ))}
              </ul>
              <details>
                <summary style={{ color: "#4B0EAC", cursor: "pointer" }}>
                  Show Answer
                </summary>
                <p><b>Answer:</b> {q.answer}</p>
                <p><b>Why:</b> {q.explanation}</p>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
