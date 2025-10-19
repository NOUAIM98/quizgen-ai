import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [docId, setDocId] = useState("");
  const [msg, setMsg] = useState("");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  async function onUpload(e) {
    e.preventDefault();
    if (!file) return setMsg("Choose a PDF.");

    const fd = new FormData();
    fd.append("file", file);
    if (title) fd.append("title", title); // optional

    try {
      const resp = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: fd });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Upload failed");
      setDocId(data.docId);
      setMsg(`Indexed ${data.chunksIndexed} chunks • docId: ${data.docId}`);
    } catch (err) {
      setMsg(err.message);
    }
  }

  function copyId() {
    if (!docId) return;
    navigator.clipboard.writeText(docId);
    setMsg("docId copied!");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-purple-700">QuizGen-AI — Upload PDF</h1>

        <input className="input" placeholder="Title (optional)"
               value={title} onChange={(e)=>setTitle(e.target.value)} />
        <input type="file" accept="application/pdf"
               onChange={(e)=>setFile(e.target.files?.[0] || null)} />

        <button onClick={onUpload}
          className="px-4 py-2 bg-purple-700 text-white rounded-xl">Upload & Index</button>

        {docId && (
          <div className="rounded-lg bg-purple-50 p-3 text-sm">
            <div className="font-medium">docId</div>
            <div className="break-all">{docId}</div>
            <div className="mt-2 flex gap-3">
              <button onClick={copyId} className="px-3 py-1 rounded bg-white border">Copy</button>
              <a className="px-3 py-1 rounded bg-purple-600 text-white"
                 href={`/quiz?docId=${encodeURIComponent(docId)}&n=15`}>Use for Quiz</a>
              <a className="px-3 py-1 rounded border" href={`/chat?docId=${encodeURIComponent(docId)}`}>Ask Chat</a>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600">{msg}</p>
      </div>

      <style jsx>{`
        .input{border:1px solid #e5e7eb;border-radius:12px;padding:10px;width:100%}
      `}</style>
    </main>
  );
}
