## 2026-10-17 - Form Accessibility: Labels and Inputs
**Learning:** Always ensure visible `<label>` elements are explicitly associated with their corresponding inputs using matching `htmlFor` and `id` attributes, instead of relying solely on structural proximity. When visual design constraints prevent explicit visible `<label>` elements, add the `aria-label` attribute directly to the `<input>` or `<textarea>` element.
**Action:** Apply `htmlFor` and `id` pairings to visible labels in `Contact.jsx`, and use `aria-label` for placeholder-only inputs in `RentModal.jsx`.
