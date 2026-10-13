## 2024-05-18 - Form Accessibility Constraints
**Learning:** Sometimes visible `<label>` elements cannot be added due to strict visual design constraints that prevent custom CSS or layout changes (e.g., in RentModal.jsx where placeholders serve as visual labels).
**Action:** When a visible `<label>` cannot be added or properly linked via `htmlFor`, directly apply `aria-label` to the `<input>` or `<textarea>` to maintain accessibility without violating styling constraints.
