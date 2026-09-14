## 2024-05-18 - [Form Accessibility in Contact Form]
**Learning:** Found that visible `<label>` elements in `Contact.jsx` form components were not explicitly associated with their inputs using `htmlFor` and `id` attributes. This structural proximity works visually but degrades the experience for screen readers and negatively affects click targets.
**Action:** Always ensure that visible `<label>` elements are explicitly linked to their corresponding inputs with matching `htmlFor` and `id` attributes when building or reviewing forms.
