
## 2024-05-18 - Avoid Implicit Structural Labeling
**Learning:** Structural proximity of labels to inputs without explicit `htmlFor` and `id` linking leads to poor screen reader accessibility. Also, using placeholders instead of labels provides insufficient context to users using assistive tech.
**Action:** Always link visible `<label>` to `<input>` with `htmlFor` and `id`. When design constraints require omitting visible labels, always use an explicit `aria-label` attribute on the input.
