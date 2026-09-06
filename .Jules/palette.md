## 2026-09-06 - Explicit Form Control Associations
**Learning:** Relying solely on structural proximity (wrapping inputs in divs next to labels, or using placeholders) leaves screen readers without explicit context, causing accessibility issues.
**Action:** Always ensure visible `<label>` elements use `htmlFor` matching the input `id`, and use `aria-label` for inputs where visual design constraints prevent explicit visible labels.
