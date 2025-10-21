import { FileText, BrainCircuit, Zap } from "lucide-react";

const features = [
  {
    id: "upload",
    title: "Upload PDFs",
    description: "Support for multiple file formats",
    icon: FileText,
    tilt: "-5deg",
  },
  {
    id: "ai",
    title: "AI Powered",
    description: "Advanced question generation",
    icon: BrainCircuit,
    tilt: "0deg",
  },
  {
    id: "instant",
    title: "Instant Results",
    description: "Get quizzes in seconds",
    icon: Zap,
    tilt: "5deg",
  },
];

export default function Features() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-6 py-20">
      <div className="grid md:grid-cols-3 gap-8">
        {features.map(({ id, title, description, icon: Icon, tilt }) => (
          <div
            key={id}
            className="group relative p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-500 hover:scale-105 transform"
            style={{
              transform: `perspective(1000px) rotateY(${tilt})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 rounded-2xl transition-all duration-500" />
            <div className="relative">
              <Icon className="w-12 h-12 mb-4 text-cyan-400" />
              <h3 className="text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
