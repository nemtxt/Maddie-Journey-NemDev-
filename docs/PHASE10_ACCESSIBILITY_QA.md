# Phase 10 — v3.7 Responsive and Accessibility Acceptance

**Scope:** Public fictional monitoring prototype · 51 employees · 8 divisions · 13 read-only screens. No live data or source connections.

**Status:** Automated source and simulated-event tests cover the listed v3.7 code fixes. **Not verified:** real-device rendering, screenshot comparisons, actual screen readers, 200% zoom and touch keyboard behavior. No browser/device pass is asserted by this document.

## Implemented and code-testable

| Code correction | Expected outcome | Automated evidence |
| --- | --- | --- |
| Functional person picker | The existing choose-employee action opens a real read-only division-scoped list and returns to the monitoring view without writes | Simulated picker and selection regression |
| Inert background for centered dialogs | Employee, division and employee-picker previews do not expose the underlying workspace to sequential keyboard or AT navigation | Modal HTML isolation and cleanup checks |
| Mobile-to-desktop breakpoint recovery | An open mobile drawer closes when crossing 761px and unlocks the workspace | Simulated resize checks on both sides of breakpoint |
| Employee tab Home/End | Home selects Overview and End selects Profile, with aria-selected and panel label updated | Simulated keydown against nine tabs |
| Horizontal tab visibility | Selecting a tab focuses it and scrolls to nearest inline edge | Scroll invocation and focus assertions |
| 320–380px and short-height safeguards | Return labels wrap, pager has room and modal fits a short viewport | CSS safeguard assertions, NOT real pixel checks |
| Forced colors | Selected tab retains an explicit high-contrast cue | CSS safeguard assertion, NOT verified screen reader/color rendering |

## Physical/browser test matrix (pending)

| Viewport | Required manual checks | Result |
| --- | --- | --- |
| 320 × 568 | All 13 routes, 201 Files missing names, calendar controls, return/pager wrapping, modal internal scroll | Not verified |
| 375 × 667 | Employee tabs with 200% zoom, all nine sections, menu touch targets, no page-wide overflow | Not verified |
| 430 × 932 | Long document titles, modal focus, three-month Calendar and KPI/Review tables | Not verified |
| 768 × 1024 | Drawer to tablet transition, navigation tabs and Journey board horizontal scrolling | Not verified |
| 1024 × 768 | Context action wrapping, modal keyboard operation and Compact/Comfortable display | Not verified |
| 1440 × 900 | Sidebar expand/collapse, employee return focus, light/dark themes | Not verified |
| 1920 × 1080 | Maximum workspace width, division grid and scoped metrics | Not verified |

Also inspect 390 × 844, mobile landscape at 320 × 568-equivalent, browser 200% zoom and increased text size. Verify 51-person totals and percentages against the existing sample snapshot after each bug fix.

## Keyboard and assistive-technology script

1. Navigate using Tab, Shift+Tab, Enter, Space, Escape, ArrowLeft/ArrowRight, Home and End. Confirm the nine employee tabs announce selected state, a correctly labelled tabpanel, and a visible focus indicator.
2. From Directory search, 201 Files Missing/Not checked, an Attention category and a selected Calendar date, open a preview. Confirm only the modal is exposed to the keyboard and screen-reader virtual cursor. Close with Back, Escape and backdrop; focus must return to the precise initiating control, including within a horizontally scrolled table.
3. Open mobile navigation and rotate or resize across 760/761px. Confirm the drawer disappears, main content is usable, focus lands on the heading, and no invisible modal traps navigation.
4. Inspect light/dark themes, forced colors, prefers-reduced-motion and Save-Data. Compare Compact/Comfortable tables at all widths. Confirm Anime.js is optional and does not gate content.
5. On Windows test Chrome/Edge with NVDA; on iPhone Safari test VoiceOver; on Android Chrome test TalkBack. Also run Chrome/Firefox/Safari where available. These are **manual requirements**, not claimed as completed.
6. Inspect all 13 screens for layout, overlays, wrapping, keyboard scroll and no unintended document editing, login, upload or source-state changes.

## Defect evidence and release gate

For every issue record: route, browser version, OS/device, viewport, zoom, theme, Compact/Comfortable state, reproduction steps, expected/actual behavior, severity (blocker/high/medium/low), screenshot or screen recording, fix commit and retest result.

**Sign-off criteria:** No blocker/high issues; all routes and all nine employee tabs accessible; all tested widths free of unintended page overflow; read-only 51-person calculations preserved; automated checks green; explicit reviewer sign-off from real-device and screen-reader evidence. Until then Phase 10 is **implemented in code, not manually accepted**.
