"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { acceptQuote } from "@/lib/actions/requests";
import { Button } from "@/components/ui/button";

interface AcceptQuoteButtonProps {
  quoteId: string;
}

export function AcceptQuoteButton({ quoteId }: AcceptQuoteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAccept = () => {
    setError(null);
    startTransition(async () => {
      const result = await acceptQuote({ quoteId });
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="w-full space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        onClick={handleAccept}
        disabled={isPending}
        className="w-full"
        data-testid="accept-quote-button"
      >
        {isPending ? "Accepting..." : "Accept Quote"}
      </Button>
    </div>
  );
}
