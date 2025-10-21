import logoImage from "../assets/f343b39cf3269d73f13595ce056a119eacb77dec.png";

export default function Header() {
  return (
    <header className="border-b border-slate-800/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="QuizGen-AI" className="h-10" />
        </div>
        <nav className="flex gap-8">
          <a
            href="#features"
            className="text-gray-300 hover:text-cyan-400 transition-colors"
          >
            Features
          </a>
        </nav>
      </div>
    </header>
  );
}
