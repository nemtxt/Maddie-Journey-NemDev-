# Phase 6 — Motion and interaction QA

**Release:** v3.3. **Status:** 66 source-level tests passed; rendered browser/device performance verification remains pending.

| Condition | Acceptance target |
| --- | --- |
| Normal route change | At most two header/summary surfaces, no list animation, ≤165 ms |
| Employee preview | Single ≤155 ms entrance; tab rerenders do not restart the motion |
| Mobile drawer | One ≤150 ms entrance; Escape and close remain immediate |
| Filters | Immediate table/count updates; optional single-label feedback ≤110 ms |
| Directory search | Only visible result table/count and clear control are updated |
| Reduced motion | No Anime.js calls; content and focus work normally |
| Save-Data or hidden tab | Skip motion |
| Blocked/throwing CDN | Entire read-only prototype stays usable |
| Missing/invalid sample | Accessible recovery alert and reload link, no invented live data |
| 320px to 1920px | No animation-triggered clipping, data tables remain independently scrollable |

In DevTools Performance, compare Dashboard → Directory, search typing, board/list switch, employee modal opening and mobile drawer opening at normal and throttled CPU settings. Record any scripting long tasks, layout shifts, dropped frames, interaction latency and screenshot/device conditions before asserting performance targets. Check with reduced motion, offline CDN, Save-Data, and landscape mobile. **No measured FPS or timing figures are claimed in this code update.**
