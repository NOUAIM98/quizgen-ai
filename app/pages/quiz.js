import React, { useState } from "react";

export default function QuizPage() {
  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return alert("Please enter a topic!");
    setLoading(true);
    setQuiz([]);

    try {
      const res = await fetch("http://localhost:8080/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz");

      console.log("✅ Quiz received:", data);
      setQuiz(data.quiz || []);
    } catch (err) {
      alert("Error generating quiz");
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "700px",
        margin: "auto",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "2rem", color: "#4B0EAC" }}>🎯 QuizGen-AI</h1>

      <div style={{ marginTop: "20px" }}>
        <input
          type="text"
          placeholder="Enter a topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{
            padding: "10px",
            width: "70%",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: "10px 20px",
            marginLeft: "10px",
            backgroundColor: "#4B0EAC",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate Quiz"}
        </button>
      </div>

      {quiz.length > 0 && (
        <div style={{ marginTop: "40px", textAlign: "left" }}>
          <h2>🧩 Generated Quiz:</h2>
          {quiz.map((q, i) => (
            <div
              key={i}
              style={{
                marginBottom: "20px",
                padding: "15px",
                border: "1px solid #e5e5e5",
                borderRadius: "10px",
                background: "#fafafa",
              }}
            >
              <h3>{i + 1}. {q.question}</h3>
              <ul>
                {q.options.map((opt, j) => (
                  <li key={j}>{opt}</li>
                ))}
              </ul>
              <p>
                <b>Answer:</b> {q.answer}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
