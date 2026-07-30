"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

export default function LangError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">{t("errors.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {error.message || t("errors.description")}
        </p>
        <Button onClick={reset}>{t("errors.tryAgain")}</Button>
      </div>
    </div>
  );
}
