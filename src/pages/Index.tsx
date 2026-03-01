import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import NewsInput from "@/components/NewsInput";
import LoadingAnimation from "@/components/LoadingAnimation";
import ResultCard, { type VerificationResult } from "@/components/ResultCard";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();

  const handleVerify = async (text: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("verify-news", {
        body: { text },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data as VerificationResult);
    } catch (err: any) {
      console.error("Verification error:", err);
      toast({
        title: "Verification Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg relative">
      {/* Ambient glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-4 pb-20">
        <Header />

        {/* Hero tagline */}
        <div className="text-center mt-6 mb-10 max-w-xl mx-auto space-y-3">
          <h2 className="font-display text-lg md:text-xl font-semibold tracking-wide text-foreground">
            Verify Before You <span className="neon-text-cyan">Believe</span>
          </h2>
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            Paste any news headline, article, or URL. Our AI cross-references trusted sources to tell you if it's real or fake — in seconds.
          </p>
        </div>

        {/* Input */}
        <NewsInput onVerify={handleVerify} isLoading={isLoading} />

        {/* Loading */}
        {isLoading && (
          <div className="mt-10 w-full max-w-3xl">
            <LoadingAnimation />
          </div>
        )}

        {/* Result */}
        {result && !isLoading && (
          <div className="mt-10 w-full">
            <ResultCard result={result} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
