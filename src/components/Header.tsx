import { Shield } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full py-6 px-4 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Shield className="w-10 h-10 text-neon-cyan" />
          <div className="absolute inset-0 w-10 h-10 rounded-full bg-neon-cyan/10 animate-pulse-glow" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wider neon-text-cyan">
          TRUTHLENS
        </h1>
      </div>
      <span className="ml-3 text-xs font-body text-muted-foreground tracking-widest uppercase mt-1">
        Fake News Detector
      </span>
    </header>
  );
};

export default Header;
