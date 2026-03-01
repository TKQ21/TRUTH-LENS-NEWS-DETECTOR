import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

interface NewsInputProps {
  onVerify: (text: string) => void;
  isLoading: boolean;
}

const NewsInput = ({ onVerify, isLoading }: NewsInputProps) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onVerify(text.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-5">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a news headline, article, or URL here..."
          rows={5}
          className="w-full rounded-xl bg-muted/50 backdrop-blur-sm p-5 text-foreground placeholder:text-muted-foreground font-body text-base resize-none focus:outline-none neon-border-cyan transition-all duration-300 focus:shadow-[0_0_25px_hsl(var(--neon-cyan)/0.3)]"
        />
      </div>

      <button
        type="submit"
        disabled={!text.trim() || isLoading}
        className="w-full py-4 rounded-xl font-display font-semibold text-sm tracking-widest uppercase neon-glow-btn text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-300"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Verify News
          </>
        )}
      </button>
    </form>
  );
};

export default NewsInput;
