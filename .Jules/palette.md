## 2024-05-24 - explicit label and id association
**Learning:** For form accessibility, explicit `htmlFor` and `id` linking between visible labels and inputs must always be used, rather than relying on implicit structural relationships. When visible labels are omitted by design, explicit `aria-label`s directly on inputs are necessary to ensure screen reader accessibility.
**Action:** Always verify inputs and textareas either have a corresponding linked label or an explicit `aria-label` attribute on creation.
