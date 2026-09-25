## 2024-05-18 - Explicit Label Associations in Forms
**Learning:** This app frequently relies on structural proximity for form labels instead of explicit `htmlFor` and `id` associations, which impairs accessibility for screen readers on standard text inputs and textareas.
**Action:** Always ensure explicit association using `htmlFor` matching the input `id` when writing or refactoring form components in this app.
