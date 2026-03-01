import { Shield } from "lucide-react";

const LoadingAnimation = () => {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="relative w-24 h-24">
        <Shield className="w-24 h-24 text-neon-cyan/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
        </div>
      </div>

      {/* Scan line effect */}
      <div className="w-full max-w-md h-1 rounded-full overflow-hidden bg-muted">
        <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-neon-cyan to-transparent animate-scan" />
      </div>

      <div className="space-y-1 text-center">
        <p className="font-display text-sm tracking-widest neon-text-cyan animate-pulse-glow">
          SCANNING
        </p>
        <p className="text-xs text-muted-foreground font-body">
          Cross-referencing with trusted sources...
        </p>
      </div>
    </div>
  );
};

export default LoadingAnimation;
