## 2024-05-19 - Form Accessibility Linkages
**Learning:** Structural proximity of labels and inputs is insufficient for screen readers and touch accessibility. Elements must be explicitly linked (e.g., using `htmlFor` and `id`). When visual design constraints prevent explicit visible `<label>` elements, `aria-label` should be added to inputs to adhere to the rule against custom CSS while still maintaining accessibility.
**Action:** Always link visible labels to their inputs with `htmlFor` and `id`, and add `aria-label` to form elements when explicit visible labels cannot be used.
