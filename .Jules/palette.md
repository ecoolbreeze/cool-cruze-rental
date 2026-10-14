## 2024-10-14 - Explicit Form Associations and Emoji Accessibility
**Learning:** Some elements in this app's forms rely solely on structural proximity for label association, and decorative success state emojis lack proper screen reader semantics.
**Action:** When adding or modifying forms, always ensure visible `<label>` elements are explicitly associated with their corresponding inputs using matching `htmlFor` and `id` attributes. Additionally, always give visual indicators (like the success `✅` emoji) proper accessibility semantics by adding `role="img"` and an appropriate `aria-label`.
