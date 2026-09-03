## 2024-05-20 - Explicit Form Label Association
**Learning:** React form inputs without explicit `id` and `htmlFor` association cause significant accessibility barriers for screen readers, even if structurally adjacent. Adding them provides immediate value without layout disruption.
**Action:** Always map `<label>` elements to their corresponding `<input>`/`<textarea>` via matching `htmlFor` and `id` properties in all new and existing form components.
