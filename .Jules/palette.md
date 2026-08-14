## 2024-08-14 - Fix Form Accessibility
**Learning:** Found a recurring pattern in this app's forms where explicit label linkages (`htmlFor` + `id`) and explicit `aria-label`s on placeholder-only inputs were missing. This made the forms inaccessible to screen readers and harmed the usability since clicking a label wouldn't focus the corresponding input.
**Action:** When adding inputs, ensure they either have a linked label (`<label htmlFor="ID">...<input id="ID"...`) or an explicit `aria-label` attribute if relying on visual placeholders.
