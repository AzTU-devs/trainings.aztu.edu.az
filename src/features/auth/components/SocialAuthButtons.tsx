"use client";

import { Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

export function SocialAuthButtons() {
  const onApple = () => {
    if (typeof window === "undefined") return;
    window.location.href = `${env.NEXT_PUBLIC_API_URL}/api/auth/oauth/apple/start`;
  };

  return (
    <div className="grid gap-2">
      <Button
        variant="outline"
        type="button"
        onClick={onApple}
        className="h-11 w-full"
      >
        <Apple className="size-4" />
        Continue with Apple
      </Button>
    </div>
  );
}
