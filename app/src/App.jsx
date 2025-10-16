import { useState } from "react";

function App() {
  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateQuiz = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic first");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (data.quiz) setQuiz(data.quiz);
      else throw new Error("Invalid response");
    } catch (err) {
      console.error(err);
      alert("Error generating quiz");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f9fc",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        fontFamily: "Inter, sans-serif",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", color: "#2c3e50", marginBottom: "1.5rem" }}>
        QuizGen-AI 🎯
      </h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "30px" }}>
        <input
          type="text"
          placeholder="Enter a topic..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{
            padding: "10px 15px",
            width: "260px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            outline: "none",
            fontSize: "1rem",
          }}
        />
        <button
          onClick={generateQuiz}
          disabled={loading}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: loading ? "#888" : "#4b7bec",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.3s",
          }}
        >
          {loading ? "Generating..." : "Generate Quiz"}
        </button>
      </div>

      <div style={{ width: "100%", maxWidth: "700px" }}>
        {quiz.map((q, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "10px",
              marginBottom: "15px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>
              {i + 1}. {q.question}
            </h3>
            <ul style={{ marginLeft: "20px", marginBottom: "10px" }}>
              {q.options.map((opt, j) => (
                <li key={j}>{opt}</li>
              ))}
            </ul>
            <strong style={{ color: "#2ecc71" }}>✅ Answer:</strong> {q.answer}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
