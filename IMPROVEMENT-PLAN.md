# Neurodiverse AI MasterClass — Complete Improvement Plan

**Date**: 2026-04-09
**Status**: Ready for execution
**Goal**: Fix all design, copy, and structural issues in one pass. No more iteration.

---

## PART 1: STRUCTURAL / CSS FIXES (Execute First)

### 1.1 Unify the Design System
**Problem**: index.html has its own parallel CSS (different variable names, 880px vs 900px max-width, unique component classes). Child pages use theme.css. Two design systems = visual inconsistency.

**Fix**:
- [ ] Add `<link rel="stylesheet" href="css/theme.css">` to index.html `<head>`
- [ ] Remove from index.html inline `<style>`: all `:root` variables that duplicate theme.css
- [ ] Change index.html `.page` max-width from 880px to `var(--max-width)` (900px)
- [ ] Map index.html variable names to theme.css equivalents:
  - `--bg` -> `--purple-bg`
  - `--text` -> `--text-primary`
  - `--text-mid` -> `--text-secondary`
  - `--text-dim` -> `--text-muted`
  - `--accent` -> `--purple-neon`
  - `--accent2` -> keep (unique to index)
  - `--bg-card`, `--bg-card-hover`, `--border`, `--border-hover` -> keep (unique to index cards)
- [ ] Keep index.html's unique component classes (.hero, .journey, .c, .tiles) but use theme.css variables

### 1.2 Fix the rAF Animation Loop Leak
**Problem**: brain-animation.js starts a new requestAnimationFrame loop on every SPA page navigation. After 5 clicks, 5 loops running simultaneously.

**Fix**:
- [ ] Add at top of brain-animation.js IIFE: cancel any previous animation frame
  ```js
  if (window._brainAnimFrame) cancelAnimationFrame(window._brainAnimFrame);
  ```
- [ ] Store the frame ID: `window._brainAnimFrame = requestAnimationFrame(animate);`
- [ ] Guard resize listener: `if (!window._brainResizeAttached) { ... }`

### 1.3 Remove main.js Duplication
**Problem**: main.js and spa-router.js both add copy buttons, scroll handlers, and smooth scroll. Double-wrapping code blocks.

**Fix**:
- [ ] Add guard at top of main.js: `if (document.getElementById('spaMain')) return;`
- [ ] This makes main.js only run in standalone mode (direct file open), not in SPA

### 1.4 Fix h1 Display None
**Problem**: theme.css line 145 has `h1 { display: none }` — hides all h1 including brain header titles. Current fix uses SPA override but is fragile.

**Fix**:
- [ ] Change theme.css line 145 from `h1 { display: none; }` to `.page-wrapper > h1 { display: none; }` (only hides the redundant h1 inside page-wrapper, not brain header h1)
- [ ] Remove the `!important` override from app.html since it won't be needed

### 1.5 Fix columns-3 Missing Base Class
**Problem**: first-ai-conversation.html line 43 uses `class="columns-3"` without `columns` base class. The 3-stat row (Time/Energy/Tool) stacks vertically.

**Fix**:
- [ ] Change to `class="columns columns-3"` in first-ai-conversation.html

### 1.6 Fix Callout Hover Lift
**Problem**: Non-interactive callouts lift on hover (translateY -2px), creating false click affordance. Bad for ADHD users.

**Fix**:
- [ ] Remove `transform: translateY(-2px)` from `.callout:hover` in theme.css
- [ ] Keep the box-shadow for subtle depth

### 1.7 Fix Text Contrast
**Problem**: `--text-muted` (#64748b) on `--purple-bg` (#0A0A14) = 3.8:1 contrast. Fails WCAG AA. This color is used for card metadata (time, energy) — critical info for ND users.

**Fix**:
- [ ] Change `--text-muted` from `#64748b` to `#8494ad` (~5.0:1 contrast)
- [ ] Or use `--text-secondary` for `.card-meta` and `.tile-sub`

### 1.8 Fix index.html Noise Texture
**Problem**: Uses `content: url(...)` which renders at 200x200 fixed size instead of `background-image` which tiles.

**Fix**:
- [ ] Change `body::before` in index.html from `content: url(...)` to match theme.css approach with `background-image`

### 1.9 Fix your-progress.html Dead End
**Problem**: Last page has no "Home" exit — just Previous link and empty span.

**Fix**:
- [ ] Replace empty `<span>` with: `<a href="index.html" class="nav-link">Back to Course Home</a>`

---

## PART 2: UX COPY FIXES

### 2.1 Duplicate Content Across Track Pages
**Problem**: All 6 track pages (writing-voice, research, work, creative, life, mcp) repeat identical boilerplate:
- "The output addresses YOUR specific situation. If it feels generic, add more context." (4-5x per page)
- "What you'll build" (4-6x per page)
- "Do this now" (4-5x per page)
- "Low Energy" (4-5x per page)

**Assessment**: The repetition within a single page IS the design pattern — each workshop section follows the same structure. This is intentional scaffolding for ND users. **Keep the structure, but vary the copy slightly per instance.**

**Fix**:
- [ ] For "What good looks like" callouts: change the generic "The output addresses YOUR specific situation" to a specific example for each workshop
  - WP1 Email: "The draft matches your voice and handles the specific tone needed"
  - WP2 Meeting: "The prep covers the actual attendees and topics"  
  - WP3 Status: "The report pulls from your real notes, not generic templates"
  - etc.

### 2.2 Redundant Text in Callout Bodies
**Problem**: Several pages have "workflows" repeated:
- creative-projects: "Real workflows for creative project workflows"
- research-analysis: Already fixed ("Real workflows for research & analysis")

**Fix**:
- [ ] creative-projects.html: "Real workflows for creative projects — saved to your databases."
- [ ] life-management.html: "Real workflows for life management — saved to your databases."
- [ ] mcp-automation.html: "Real workflows for MCP & automation — saved to your databases."
- [ ] work-productivity.html: "Real workflows for work & productivity — saved to your databases."

### 2.3 Missing Pills on Child Pages
**Problem**: Home page has pill badge "Your pace is the right pace. Start anywhere." Child pages have no pill — empty space in brain header.

**Fix**: Add relevant pills to child pages:
- [ ] Setup pages: "15 min | Any energy"
- [ ] Track pages: "Pick one workshop. That's enough."
- [ ] Resource pages: "Reference — always available"
- [ ] Template pages: "Copy, customize, use today"
- [ ] Progress page: "Everything saves automatically"

### 2.4 Inconsistent Callout Icon Patterns
**Problem**: Some pages use emoji-in-span (`<span class="callout-icon">emoji</span>`), others just have emoji as first character. The structure should be consistent.

**Fix**:
- [ ] Verify all callouts use: `<span class="callout-icon">EMOJI</span><div class="callout-title">TITLE</div>`
- [ ] Pages to check: writing-voice, dopamine-menu, emergency-toolkit

### 2.5 Nav Footer Label Consistency
**Problem**: Some nav links show "Research" (short), others show "Research & Analysis" (full). Previous labels should use short names, Next labels can use full names.

**Fix**:
- [ ] Standardize all prev links to short form: "Research", "Work", "Creative", "Life", "MCP"
- [ ] Standardize all next links to descriptive form: "Research & Analysis", "Work & Productivity", etc.

### 2.6 Tone Fix
**Problem**: life-management.html says "Be ruthless. 3 things max for today." — "ruthless" is potentially triggering for ND users who already judge themselves harshly.

**Fix**:
- [ ] Change to: "Be honest. 3 things max for today."

---

## PART 3: VISUAL CONSISTENCY FIXES

### 3.1 Brain Header Height Inconsistency  
**Problem**: Home page uses `brain-header--hub` (520px). Child pages use default (420px). Empty space at bottom of child headers where pill would be.

**Fix**: 
- [ ] Either add pills to all child pages (2.3 above) OR reduce child header height to 360px in brain-header.css

### 3.2 Card Component Differences
**Problem**: index.html uses `.c` class for cards (custom). Child pages use `.card` class from theme.css. Different border radius, padding, hover effects.

**Assessment**: These are genuinely different components — index cards are compact navigation cards, child page cards are content cards. **Keep both but ensure colors and border-radius match.**

**Fix**:
- [ ] Ensure index.html `.c` border-radius matches theme.css `--radius` (12px)
- [ ] Ensure `.c` hover effects use same timing as `.card` hover

### 3.3 Details/Toggle Padding
**Problem**: writing-voice.html has extra padding on details content (details > :not(summary) gets padding from theme.css + the page may add its own).

**Fix**:
- [ ] Verify no inline padding overrides on details content across all pages

---

## EXECUTION ORDER

1. **CSS structural fixes** (1.1-1.9) — do these first, they affect everything
2. **Copy fixes** (2.1-2.6) — do these second, file by file
3. **Visual polish** (3.1-3.3) — do these last

**Total estimated changes**: ~25 files touched
**Approach**: One commit per part, not per fix

---

## PART 4: COPY AUDIT FINDINGS (from UX copy review)

### 4.1 quick-win-library.html Has Test Markers
**Problem**: 🎯 emoji appears in 15+ unintended locations — scroll-progress, mesh-orbs, particles, overlays, breadcrumbs. These are development artifacts from emoji replacement gone wrong.

**Fix**:
- [ ] Remove all 🎯 from non-content HTML elements (mesh-orb divs, particle divs, overlay divs, breadcrumb structure)

### 4.2 "Workflows" Word Duplication in Track Pages  
**Problem**: Multiple track page intro callouts say "Real workflows for X workflows"

**Fix** (already partially done, verify remaining):
- [ ] creative-projects.html: "Real workflows for creative projects — saved to your databases."
- [ ] work-productivity.html: "Real workflows for work & productivity — saved to your databases."
- [ ] life-management.html: "Real workflows for life management — saved to your databases."
- [ ] mcp-automation.html: "Real workflows for MCP & automation — saved to your databases."

### 4.3 Generic "What Good Looks Like" Copy
**Problem**: All 6 track pages use identical text: "The output addresses YOUR specific situation. If it feels generic, add more context." (appears 4-5x per page, ~25 total instances)

**Assessment**: This IS the design pattern. But varying it slightly per workshop would feel less robotic.

**Fix**: LOW PRIORITY — keep for launch, improve later.

### 4.4 Tone: "Be Ruthless" 
**Problem**: life-management.html LM1 says "Be ruthless. 3 things max for today."

**Fix**:
- [ ] Change to "Be honest. 3 things max for today."

### 4.5 No Pill Badges on Any Child Pages
**Problem**: Only index.html has the pill "Your pace is the right pace. Start anywhere." All 21 child pages have empty pill space in brain header.

**Fix**: Add context-appropriate pills:
- [ ] Setup pages (first-ai-conversation through memory-projects): pill text varies per page
- [ ] Track pages (writing through mcp): "Pick one workshop. That's enough."
- [ ] Resource pages (reference, playground, skill): "Reference — always available"
- [ ] Template pages (recipe, dopamine, emergency): "Copy, customize, use today"
- [ ] Progress page: "Everything saves automatically"

### 4.6 Overall Tone Assessment: PASSES
The copy is consistently supportive, non-shaming, permission-giving. Key patterns working well:
- "Low energy version" on nearly every page
- "That's enough" / "Both are valid" / "No pressure"
- Zero instances of "should", "must", "easy", "simple", "just" in shaming contexts
- Research citations grounded, academic tone
- Emergency toolkit is compassionate and non-judgmental

---

## FILES TO MODIFY

| File | Changes |
|------|---------|
| css/theme.css | h1 selector fix, callout hover, text-muted contrast |
| css/brain-header.css | Optional: child header height |
| app.html | Remove fragile h1 override (after theme.css fix) |
| js/brain-animation.js | rAF cleanup, resize guard |
| js/main.js | SPA guard |
| index.html | Add theme.css link, unify variables, fix noise texture, fix max-width |
| first-ai-conversation.html | Fix columns-3 class |
| writing-voice.html | Verify callout structure |
| research-analysis.html | Already fixed |
| work-productivity.html | Fix "workflows workflows", vary callout copy |
| creative-projects.html | Fix "workflows workflows", vary callout copy |
| life-management.html | Fix "workflows workflows", tone fix, vary callout copy |
| mcp-automation.html | Fix "workflows workflows", vary callout copy |
| dopamine-menu.html | Verify callout structure |
| emergency-toolkit.html | Verify callout structure |
| your-progress.html | Add home exit link |
| All child pages | Add pill text to brain headers |
