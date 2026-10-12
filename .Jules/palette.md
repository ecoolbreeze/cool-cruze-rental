## 2024-05-19 - Explicit Label Association
**Learning:** React elements like `<label>` require `htmlFor` instead of `for`, and `id` mapping on the input side to ensure screen reader association. Reliance on proximity or nesting alone is insufficient for robust accessibility.
**Action:** When working on form inputs, explicitly verify associations and always prefer `htmlFor`/`id` mapping.
