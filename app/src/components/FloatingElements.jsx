export default function FloatingElements() {
  return (
    <div className="pointer-events-none" aria-hidden="true">
      <div className="absolute top-20 -left-32 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 -right-32 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-float-delayed" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/4 right-1/4 w-32 h-32 border border-cyan-500/20 rotate-45 animate-spin-slow" />
      <div className="absolute bottom-1/3 left-1/4 w-24 h-24 border border-blue-500/20 rounded-full animate-pulse-slow" />
    </div>
  );
}
