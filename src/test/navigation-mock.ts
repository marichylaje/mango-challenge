import { act } from "@testing-library/react";
import { useSyncExternalStore } from "react";
import { vi } from "vitest";

interface ReplaceOptions {
  readonly scroll?: boolean;
}

const listeners = new Set<() => void>();
let pathname = "/exercise1";
let snapshot = new URLSearchParams();

const replace = vi.fn((href: string, _options?: ReplaceOptions): void => {
  void _options;
  const [path, query = ""] = href.split("?");
  pathname = path;
  setSnapshot(query);
});

const router = { replace, push: vi.fn(), back: vi.fn(), refresh: vi.fn() };

function setSnapshot(query: string): void {
  snapshot = new URLSearchParams(query);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;

/** Factory for `vi.mock("next/navigation", ...)`: stateful router/searchParams. */
export const navigationMockModule = {
  useSearchParams: () =>
    useSyncExternalStore(subscribe, getSnapshot, getSnapshot),
  useRouter: () => router,
  usePathname: () => pathname,
};

export interface NextNavigationMock {
  readonly replace: typeof replace;
  setQuery(query: string): void;
}

export function mockNextNavigation(initialQuery = ""): NextNavigationMock {
  replace.mockClear();
  pathname = "/exercise1";
  snapshot = new URLSearchParams(initialQuery);
  return {
    replace,
    setQuery: (query) => {
      act(() => setSnapshot(query));
    },
  };
}
