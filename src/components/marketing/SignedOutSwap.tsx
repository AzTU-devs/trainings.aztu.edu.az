"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "@/features/auth/hooks";

/** Nothing to subscribe to: the value below never changes after mount. */
const noopSubscribe = () => () => {};

/**
 * Swaps a signed-out call to action ("Qeydiyyatdan keçin") for its signed-in
 * counterpart once the session is known, so the page never asks a signed-in
 * participant to create an account while the header already shows their
 * avatar. Both versions are rendered by the (static, ISR) server page and
 * passed in; this island only chooses between them.
 *
 * The first client render must print what the server printed (`children`).
 * The auth store cannot guarantee that on its own: a boundary that streams in
 * late (the home page's closing section behind <Suspense>) hydrates after
 * AuthHydrator's /me call has already settled the status to "authenticated",
 * and reading the store directly would then hydrate the signed-in text over
 * the signed-out HTML and throw a hydration error. So the swap is gated on a
 * "mounted" flag: useSyncExternalStore uses the server snapshot (false) while
 * hydrating and the client snapshot (true) right after, and a component
 * mounted by client navigation (no hydration) reads true at once.
 */
export function SignedOutSwap({ children, signedIn }: { children: ReactNode; signedIn: ReactNode }) {
  const { user, status } = useAuth();
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  // The same test as the header, so the page and the header always agree.
  return <>{mounted && status === "authenticated" && user ? signedIn : children}</>;
}
