import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ExternalLink } from "lucide-react";

export interface VerificationResult {
  status: "real" | "misleading" | "fake" | "unverified";
  confidence: number;
  explanation: string;
  suspiciousElements: string[];
  matchedSources: string[];
  missingFacts: string[];
}

const statusConfig = {
  real: {
    label: "Real News",
    icon: CheckCircle2,
    borderClass: "neon-border-green",
    textClass: "text-status-real",
    bgClass: "bg-status-real/10",
  },
  misleading: {
    label: "Misleading / Partially True",
    icon: AlertTriangle,
    borderClass: "neon-border-yellow",
    textClass: "text-status-misleading",
    bgClass: "bg-status-misleading/10",
  },
  fake: {
    label: "Fake News",
    icon: XCircle,
    borderClass: "neon-border-red",
    textClass: "text-status-fake",
    bgClass: "bg-status-fake/10",
  },
  unverified: {
    label: "Unverified / No Data Found",
    icon: HelpCircle,
    borderClass: "neon-border-blue",
    textClass: "text-status-unverified",
    bgClass: "bg-status-unverified/10",
  },
};

const ResultCard = ({ result }: { result: VerificationResult }) => {
  const config = statusConfig[result.status];
  const Icon = config.icon;

  return (
    <div className={`w-full max-w-3xl mx-auto rounded-xl glass-card ${config.borderClass} p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      {/* Status badge & confidence */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${config.bgClass}`}>
          <Icon className={`w-6 h-6 ${config.textClass}`} />
          <span className={`font-display text-sm font-bold tracking-wider ${config.textClass}`}>
            {config.label}
          </span>
        </div>

        {/* Confidence meter */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-body">Confidence</span>
          <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                result.status === "real"
                  ? "bg-status-real"
                  : result.status === "misleading"
                  ? "bg-status-misleading"
                  : result.status === "fake"
                  ? "bg-status-fake"
                  : "bg-status-unverified"
              }`}
              style={{ width: `${result.confidence}%` }}
            />
          </div>
          <span className={`font-display text-sm font-bold ${config.textClass}`}>
            {result.confidence}%
          </span>
        </div>
      </div>

      {/* Explanation */}
      <div className="space-y-2">
        <h3 className="font-display text-xs tracking-widest text-muted-foreground uppercase">
          AI Explanation
        </h3>
        <p className="font-body text-sm leading-relaxed text-foreground/90">
          {result.explanation}
        </p>
      </div>

      {/* Suspicious elements */}
      {result.suspiciousElements.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display text-xs tracking-widest text-muted-foreground uppercase">
            Suspicious Elements
          </h3>
          <ul className="space-y-1">
            {result.suspiciousElements.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-body text-foreground/80">
                <AlertTriangle className="w-4 h-4 text-status-misleading mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing facts */}
      {result.missingFacts.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display text-xs tracking-widest text-muted-foreground uppercase">
            Missing / Manipulated Facts
          </h3>
          <ul className="space-y-1">
            {result.missingFacts.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-body text-foreground/80">
                <XCircle className="w-4 h-4 text-status-fake mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Matched sources */}
      {result.matchedSources.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display text-xs tracking-widest text-muted-foreground uppercase">
            Matched Trusted Sources
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.matchedSources.map((source, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan text-xs font-body border border-neon-cyan/20"
              >
                <ExternalLink className="w-3 h-3" />
                {source}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultCard;
