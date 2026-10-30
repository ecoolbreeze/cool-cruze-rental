## 2026-10-30 - Explicit Form Label Association
**Learning:** Found a recurring pattern in the 'form-group' structures across the application where labels lack explicit associations to their inputs (missing htmlFor and id), relying purely on visual proximity. Screen readers struggle with this.
**Action:** Always add explicit 'htmlFor' attributes on '<label>' elements that exactly match the 'id' attribute of the associated '<input>' or '<textarea>' when using the form-group pattern.
