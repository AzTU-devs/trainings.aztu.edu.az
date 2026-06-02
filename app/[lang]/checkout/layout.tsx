import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/10 py-10">{children}</main>
    </div>
  );
}
