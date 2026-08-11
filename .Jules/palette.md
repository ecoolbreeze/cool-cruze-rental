## 2026-08-11 - Missing Form Label Bindings
**Learning:** The `.form-group` components use `<label>` without `htmlFor` attributes, which breaks label-click-to-focus behavior and reduces tap target sizes for mobile users.
**Action:** Always explicitly bind form labels to their respective inputs using matching `id` and `htmlFor` attributes to ensure keyboard accessibility and larger touch areas.
