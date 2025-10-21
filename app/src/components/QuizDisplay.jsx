import { useState } from "react";

export default function QuizDisplay({ quizzes = [] }) {
  if (!quizzes.length) return null;

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">
        Generated Quiz
      </h2>

      <div className="space-y-6">
        {quizzes.map((q, i) => (
          <QuestionBox
            key={i}
            index={i}
            question={q.question}
            options={q.options}
            answer={q.answer}
            explanation={q.explanation}
          />
        ))}
      </div>
    </section>
  );
}

function QuestionBox({ question, options = [], answer, explanation, index }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="p-6 border border-slate-700/50 bg-slate-900/40 rounded-xl shadow-lg hover:border-cyan-500/40 transition-all">
      <p className="text-lg font-medium mb-3 text-white">
        {index + 1}. {question}
      </p>

      {/* Display multiple-choice options */}
      {options && options.length > 0 && (
        <ul className="mt-3 space-y-2 pl-4 text-gray-300">
          {options.map((opt, idx) => (
            <li key={idx} className="list-disc hover:text-cyan-300">
              {opt}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setShowAnswer(!showAnswer)}
        className="mt-4 text-sm text-cyan-400 hover:text-cyan-300 underline transition"
      >
        {showAnswer ? "Hide Answer" : "Show Answer"}
      </button>

      {showAnswer && (
        <div className="mt-4 space-y-2">
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-green-400 font-semibold">Answer:</p>
            <p className="text-gray-200">{answer}</p>
          </div>

          {explanation && (
            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700">
              <p className="text-blue-400 font-semibold">Explanation:</p>
              <p className="text-gray-300">{explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
