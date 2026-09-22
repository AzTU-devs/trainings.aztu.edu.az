"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The "contributors" pattern (home §04, /experts): a sticky portrait panel
 * that follows whichever expert name or row the visitor points at or tabs
 * to. Everything visible is rendered on the server — the provider only
 * chooses which of the pre-rendered `panels` to show — so the island ships
 * no formatting logic and prints the same markup on the server and in the
 * browser (the first panel is `initialId` in both).
 *
 * The panel keeps the last expert chosen when the pointer leaves, like a
 * caption that stays with the last picture looked at; resetting on leave
 * would make it flicker while the pointer crosses the gaps between names.
 */

type Ctx = { active: string; setActive: (id: string) => void };

const HoverContext = createContext<Ctx | null>(null);

function useHover(): Ctx {
  const ctx = useContext(HoverContext);
  if (!ctx) throw new Error("ExpertHover parts must sit inside <ExpertHoverProvider>");
  return ctx;
}

export function ExpertHoverProvider({
  panels,
  initialId,
  children,
}: {
  /** One pre-rendered panel per expert id (server components are fine here). */
  panels: Record<string, ReactNode>;
  initialId: string;
  children: ReactNode;
}) {
  const [active, setActiveState] = useState(initialId);
  // Ignore ids without a panel (a trigger for the invite slot, say), so the
  // panel never goes blank.
  const setActive = useCallback(
    (id: string) => {
      if (id in panels) setActiveState(id);
    },
    [panels],
  );
  const value = useMemo(() => ({ active, setActive }), [active, setActive]);
  return (
    <HoverContext.Provider value={value}>
      <PanelsContext.Provider value={panels}>{children}</PanelsContext.Provider>
    </HoverContext.Provider>
  );
}

const PanelsContext = createContext<Record<string, ReactNode>>({});

/**
 * Where the active expert's panel renders. `aria-live="polite"`: a keyboard
 * or screen-reader user who tabs through the names hears the panel's facts
 * (department, badges, figures) that the name link alone does not carry.
 */
export function ExpertHoverPanel({ className }: { className?: string }) {
  const { active } = useHover();
  const panels = useContext(PanelsContext);
  return (
    <div aria-live="polite" className={className}>
      {panels[active] ?? null}
    </div>
  );
}

/**
 * Wraps one name or row. It makes the wrapped expert the active one on
 * pointer-enter and on focus (focus events bubble in React, so a link inside
 * is enough), and marks itself `data-active` so the caller can style the
 * current name (`[data-active] > a`, or Tailwind `data-active:`).
 */
export function ExpertHoverTrigger({
  id,
  as: Tag = "span",
  className,
  children,
}: {
  id: string;
  as?: "span" | "li" | "div";
  className?: string;
  children: ReactNode;
}) {
  const { active, setActive } = useHover();
  const on = active === id;
  return (
    <Tag
      data-active={on ? "" : undefined}
      className={cn(className)}
      onPointerEnter={() => setActive(id)}
      onFocus={() => setActive(id)}
    >
      {children}
    </Tag>
  );
}
