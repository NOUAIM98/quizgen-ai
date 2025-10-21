import { Upload } from "lucide-react";

export default function UploadSection({
  onFileUpload,
  uploadedFile,
  selectedTopic,
  onTopicChange,
  questionCount,
  onQuestionCountChange,
  onGenerate,
  isGenerating,
}) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* PDF Upload */}
        <div className="group">
          <label className="block text-white mb-3">Upload PDF</label>

          {/* Hidden file input */}
          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileUpload(file);
            }}
          />

          {/* Upload area */}
          <label
            htmlFor="file-upload"
            className="relative p-12 border-2 border-dashed border-cyan-500/30 rounded-2xl bg-slate-900/30 backdrop-blur-sm hover:border-cyan-500/60 transition-all cursor-pointer group-hover:shadow-lg group-hover:shadow-cyan-500/10 group-hover:scale-[1.02] transform duration-300 flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-cyan-400" />
            </div>
            <p className="text-white mb-2">
              {uploadedFile ? uploadedFile : "Click to upload PDF"}
            </p>
            <p className="text-cyan-400 text-sm">or drag and drop</p>
          </label>
        </div>

        {/* Topic Input */}
        <div>
          <label className="block text-white mb-3">Or Enter Topic</label>
          <div className="p-8 border border-slate-700/50 rounded-2xl bg-slate-900/30 backdrop-blur-sm hover:border-cyan-500/30 transition-all">
            <input
              type="text"
              value={selectedTopic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="e.g., Quantum Physics, World History..."
              className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none h-14 rounded-xl px-4 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Number of Questions + Button */}
      <div className="flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1">
          <label className="block text-white mb-3">Number of Questions</label>
          <div className="relative">
            <select
              value={questionCount}
              onChange={(e) => onQuestionCountChange(Number(e.target.value))}
              className="w-full bg-slate-900/30 border border-slate-700/50 text-white h-14 rounded-xl backdrop-blur-sm px-4 appearance-none focus:border-cyan-500/30 focus:outline-none transition-all"
            >
              {[5, 10, 15, 20, 25, 30].map((count) => (
                <option key={count} value={count}>
                  {count} Questions
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
              ▾
            </span>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-12 h-14 rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? "Generating..." : "Generate Quiz"}
        </button>
      </div>
    </section>
  );
}
