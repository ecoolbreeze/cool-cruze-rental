
## 2024-05-18 - Form Field Accessibility Patterns
**Learning:** Found explicit label associations missing in standard forms (like `Contact.jsx`) and implicit label associations missing in forms with visual design constraints (like `RentModal.jsx` where inputs only have placeholders). Screen readers rely heavily on both to convey form purpose correctly.
**Action:** When working on form inputs, always implement explicit labeling using matching `id` and `htmlFor` for visible labels. When visual design strictly prevents a visible label (e.g. placeholder-only forms), ensure an `aria-label` attribute is applied directly to the input to convey the field's purpose to screen reader users without violating the "no custom CSS" rule.
