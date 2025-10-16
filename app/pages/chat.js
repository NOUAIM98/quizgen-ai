import { useState } from "react";

export default function Chat() {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [busy, setBusy] = useState(false);
  const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  async function ask() {
    if (!q.trim()) return;
    setBusy(true);
    setAnswer(""); setSources([]);
    try {
      const resp = await fetch(`${backend}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Ask failed");
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (e) {
      setAnswer(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-purple-700">Chat</h1>
        <div className="flex gap-2">
          <input className="flex-1 input" placeholder="Ask a question…" value={q} onChange={(e)=>setQ(e.target.value)} />
          <button onClick={ask} disabled={busy} className="px-4 py-2 bg-purple-700 text-white rounded-xl">{busy?"…":"Ask"}</button>
        </div>
        {answer && (
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="whitespace-pre-wrap">{answer}</p>
            {!!sources.length && (
              <div className="pt-3 text-sm text-gray-600">
                <b>Sources:</b>{" "}
                {sources.map((s,i)=>(<span key={i}>[{s.title}, page {s.page}] </span>))}
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx>{`.input{border:1px solid #e5e7eb;border-radius:12px;padding:10px}`}</style>
    </main>
  );
}
