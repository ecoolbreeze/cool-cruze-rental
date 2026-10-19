## 2024-10-19 - Form and Emoji Semantics
**Learning:** Found multiple instances of forms where labels were visually present but not programmatically linked to inputs via `htmlFor` and `id`. Additionally, decorative/success emojis were missing aria-labels.
**Action:** Always verify label associations and add `role="img"` with `aria-label` to standalone emojis in success states to ensure screen reader compatibility.
