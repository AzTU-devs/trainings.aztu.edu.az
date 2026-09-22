import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  // The footer's imprint year, taken here on the server and handed down, so
  // the client never reads its own clock during render (hydration). On an
  // ISR page it is as fresh as the page itself.
  return <SiteShell year={new Date().getFullYear()}>{children}</SiteShell>;
}
