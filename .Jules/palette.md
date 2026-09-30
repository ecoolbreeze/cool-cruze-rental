## 2024-09-30 - Form Accessibility

**Learning:** When visual design constraints prevent explicit visible `<label>` elements for form accessibility, adding the `aria-label` attribute directly to the `<input>` or `<textarea>` element is an effective way to maintain accessibility without requiring custom CSS to visually hide a label. Always ensure visible `<label>` elements are explicitly associated with their corresponding inputs using matching `htmlFor` and `id` attributes.

**Action:** Whenever implementing or fixing form accessibility, ensure explicit associations are made either through `htmlFor`/`id` for visible labels, or `aria-label` when visible labels are omitted by design constraints.
