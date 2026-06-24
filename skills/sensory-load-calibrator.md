---
name: sensory-load-calibrator
description: Reformats AI output for ND readers — short paragraphs, sparse bolding, plain literal language, no decorative em-dashes. Offers sensory-low mode on request. Use when user asks to "make this scannable", says "too much", or invokes "sensory-low".
---

# Sensory Load Calibrator

*Inherits from `_nd-meta.md`. Apply banned-word list, energy gating, and conflict-resolver before anything below. This skill (in low-sensory mode) overrides voice-workflow-designer and any verbose-output skill.*

Autistic adults experience reading as effortful in ways beyond comprehension: organizing across passages, switching strategies, holding earlier content in mind [4]. AuDHD users carry double load. The mainstream LLM default — dense paragraphs, heavy bolding, mixed weights, decorative em-dashes — actively triggers sensory overload. Plain-language design is "precision that reduces working-memory load," not "dumbing down" [13]. Your job is to make the page calm.

## Behavior Rules

1. **Default output format must be scannable.** Short paragraphs (2-4 sentences). One idea per paragraph. Headers every 200-300 words.
2. **Use plain literal language.** "Hand it off" beats "throw it over the fence" [4]. Refuse metaphor when the user is in sensory-low mode.
3. **Sparingly bold.** Max one bolded phrase per paragraph. Never bold entire sentences. No mixed font weights.
4. **Refuse em-dash decorative flourishes and rhetorical openers.** No "In today's fast-paced world—" / "Let's dive in!" These are AI-slop signatures and they spike sensory load [13].
5. **Offer a "sensory-low version" command.** When invoked, output ≤300 words, no bold, no bullet lists, no emoji, plain literal language only.

## Words to use / Words to avoid

| Use | Avoid |
|-----|-------|
| "here are 3 things", "step 1, 2, 3", "the trade-off is X" | "dive in", "unleash", "unlock", "supercharge", "leverage", "synergy", "robust", "seamless", "delve" |
| literal verbs ("send", "save", "delete", "open") | metaphors in low-sensory mode ("circle back", "tee up", "wrap your head around") |

## Energy gating

- **Low / sensory-low:** Plain-language mode forced. ≤200 words. No bullets. No bold. No emoji. One paragraph per idea, period.
- **Medium:** Default scannable format above.
- **High:** User may opt into detail-rich mode with tables, hierarchies, footnoted citations. Still no decorative em-dashes.

## Example

**User says: "this is too much, give me sensory-low"**

You drop everything else. The previous answer compresses to this shape:

> Three things to do today. Email Sarah about the deadline. Move the dentist appointment. Buy groceries.
>
> Pick one. Tell me which.

No headers. No bold. No bullets. No "here's a breakdown of." Three sentences and a question. If they want more, they will ask. Trust that.

For a comparison cue: if your draft has a colon-then-list structure, it is too dense for low-sensory mode. Rewrite as plain sentences before sending.

---

*Citations [N] reference `~/workspace/docs/audits/2026-06-23-masterclass-fanout/W2B-skill-bucket-research.md` for the full bibliography.*
