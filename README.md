# Mango challenge — Exercise 1: `<Range />`

Custom range slider (normal mode) built with Next.js 16 (App Router), React 19, React Query and CSS Modules.
No `<input type="range">`: the handles use Pointer Events.

## Run

```bash
npm install
npm run dev        # http://localhost:8080/exercise1
npm run build && npm run start   # production, also on port 8080
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run lint` | ESLint (includes React Compiler rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest, single run |
| `npx vitest run --coverage` | Single run with V8 coverage |

## URL contract

State lives in the URL search params (`/exercise1?rangeId=2&from=20&to=40`):

| Param | Meaning | Default / fallback |
| --- | --- | --- |
| `rangeId` | Which API record provides the bounds | `1`; unknown id falls back to the first record |
| `from` | Selected minimum | the bounds minimum |
| `to` | Selected maximum | the bounds maximum |

- Invalid, missing or out-of-bounds values are sanitised in memory; the URL is **not** rewritten on load.
- While dragging, a local draft is used. The URL is updated (`router.replace`, no history entry, no scroll) on pointer release, on every keyboard change and when an input is committed.

## API data normalisation

`GET https://6ace7995f338359cf1c38987.mockapi.io/api/v1/ranges` returns a list of `{ id, min, max }` with dirty data:

- `min > max` → the bounds are swapped (`68/13` → `13..68`).
- `min === max` → degenerate range: the component renders disabled with the same layout.
- `min = 0` is a valid value (never treated as "missing").
- Rows that are not `{ id: string, min: number, max: number }` are discarded.

The list is fetched once with React Query; the active record is picked by `rangeId`.

## Behaviour

- Integer values, `step = 1`. Handles never cross nor overlap (`minGap = 1`).
- Editable min/max inputs, clamped to the limit of their handle (Enter/blur commit, Escape reverts).
- Keyboard on handles: arrows ±1, PageUp/PageDown ±10, Home/End jump to the handle limits.
- Hover enlarges the handle (`grab` cursor), dragging shows `grabbing`.
- Skeleton and error states share the component's fixed height (no layout shift).
- Browser Back after a change leaves the page (`replace` is used on purpose).

## Architecture

```
src/
  app/
    layout.tsx                 # metadata + <QueryProvider>
    page.tsx                   # link to /exercise1
    exercise1/page.tsx         # Server Component: <Suspense><RangeContainer/></Suspense>
  styles/tokens.css            # design tokens (light/dark)
  providers/QueryProvider.tsx  # owns the QueryClient
  features/range/
    types.ts  constants.ts
    lib/        range-math.ts (pure math)   range-url.ts (pure URL <-> value)
    api/        ranges.api.ts (fetch + guards)   ranges.keys.ts
    hooks/      useRangeBounds  useRangeUrlState  useRangeDrag
                useRangeHandleControl  useEditableNumber
    components/ Range  RangeHandle  RangeTrack  RangeValueInput
                RangeSkeleton  RangeError  RangeContainer
  test/         setup, utils, fixtures, next/navigation mock, axe helper
```

- `lib/*` is pure (no React, DOM or Next).
- `Range` is fully controlled and unaware of Next, React Query or the URL; only `RangeContainer` wires the outside world.
- Styling uses CSS Modules and the tokens in `src/styles/tokens.css`; no Tailwind and no hard-coded colours in modules.
- React Compiler is enabled: no manual `useMemo` / `useCallback`.

## Testing

Vitest + React Testing Library + `user-event` (jsdom), `axe-core` for accessibility checks.
Covers the math and URL helpers, the API layer, the hooks, the components and the connected flow (`RangeContainer.integration.test.tsx`).
