## 2024-05-18 - [Form Explicit Labels]
**Learning:** For optimal UX and accessibility in forms, structural proximity (placing `<label>` and `<input>` next to each other) is not sufficient. Without explicit `htmlFor` (React) and matching `id` bindings, clicking the label text will not focus the input field. This is a common and easily fixable pattern that drastically improves the feel of forms.
**Action:** Always verify that every `<label>` has an `htmlFor` pointing to the exact `id` of its corresponding input element.
