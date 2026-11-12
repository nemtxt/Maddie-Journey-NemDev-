# Phase 5 — Responsive and accessibility manual QA

**Release:** v3.2  
**Status:** Manual browser/device visual checks not completed in this code-only development pass. The automated suite verifies semantic structures, behaviors, and style safeguards but cannot conclusively establish absence of clipping at actual rendered viewport widths.

## Viewport matrix

| Viewport | Required verification |
| --- | --- |
| 320 × 568 | Dashboard metrics, drawer access, swipeable tabs, independent table horizontal scrolling, employee reader close/Previous/Next |
| 375 × 667 | Full-viewport landing, keyboard-visible search and filters, no page-wide horizontal scrolling |
| 390 × 844 | Mobile drawer focus and scroll lock, table labels, all eight employee detail tabs |
| 430 × 932 | Review status table overflow, division comparison and table scrolling |
| 768 × 1024 | Sidebar/tablet transition, chart readability, dialog dimensions |
| 1024 × 768 | Desktop sidebar open/collapsed, topbar and division controls |
| 1440 × 900 | Continuous monitoring hierarchy, dense reporting and modal centering |
| 1920 × 1080 | Maximum content width, sidebar rail, typography and focus indicators |

## Checks

1. Use mouse, touch, Tab, Shift+Tab, Enter, Space, Escape and arrow keys; verify visible focus and meaningful active-state announcements.
2. On mobile, open the drawer, tab through its links, close with Escape and by tapping the shade; focus should return to Menu. The underlying page should not be keyboard-operable or scroll while the drawer is open.
3. In each table, verify all columns can be reached horizontally and the keyboard can scroll overflowed regions. No page-level horizontal overflow outside intended scroll containers.
4. Open employee reader from overview, division and filtered directory. Inspect every detail tab; the modal should scroll internally while its close control remains reachable.
5. Switch light/dark themes, enable reduced motion and OS forced colors, try 200% browser zoom and screen-reader navigation.
6. Confirm 51 fictional people, eight divisions and every read-only data visualization still agree with the sample dataset.
7. Check the landing at desktop and portrait/landscape mobile heights: the full-bleed photo fills the viewport, controls remain visible and the entry screen has no page scroll.

Report viewport, browser/device, screenshot evidence, issue severity and remediation commit for every failed check. **Do not mark visual QA passed solely from automated tests.**
