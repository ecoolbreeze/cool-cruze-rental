## 2024-05-23 - Form Accessibility Labeling
**Learning:** React form inputs without explicitly associated `htmlFor`/`id` labels or `aria-label` attributes cause accessibility barriers for screen readers, as structural proximity of a `<label>` is often insufficient.
**Action:** Always associate visible labels with inputs using `htmlFor` and `id`, and provide `aria-label` for inputs lacking visible labels due to visual design constraints.
