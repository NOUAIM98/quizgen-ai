import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [docId, setDocId] = useState("");
  const [msg, setMsg] = useState("");

  const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  async function onUpload(e) {
    e.preventDefault();
    if (!file || !title || !docId) return setMsg("Fill all fields and choose a PDF.");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);
    fd.append("docId", docId);

    try {
      const resp = await fetch(`${backend}/upload`, { method: "POST", body: fd });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Upload failed");
      setMsg(`Indexed ${data.chunksIndexed} chunks ✅`);
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-purple-700">QuizGen AI — Upload Course PDF</h1>
        <input className="input" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <input className="input" placeholder="Doc ID (unique)" value={docId} onChange={(e)=>setDocId(e.target.value)} />
        <input type="file" accept="application/pdf" onChange={(e)=>setFile(e.target.files?.[0])} />
        <button onClick={onUpload} className="px-4 py-2 bg-purple-700 text-white rounded-xl">Upload & Index</button>
        <p className="text-sm text-gray-600">{msg}</p>
        <div className="flex gap-3 text-sm pt-2">
          <a className="text-purple-700 underline" href="/chat">Go to Chat</a>
          <a className="text-purple-700 underline" href="/quiz">Generate Quiz</a>
        </div>
      </div>
      <style jsx>{`
        .input{border:1px solid #e5e7eb;border-radius:12px;padding:10px;width:100%}
      `}</style>
    </main>
  );
}
