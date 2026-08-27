"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store";

export function ReduxProvider({ children }: { children: ReactNode }) {
  // Lazy `useState` initialiser rather than a ref written during render: the
  // store is still created exactly once per client, but nothing reads or
  // mutates a ref while rendering.
  const [store] = useState(makeStore);
  return <Provider store={store}>{children}</Provider>;
}
