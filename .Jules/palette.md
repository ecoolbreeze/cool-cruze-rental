## 2024-05-18 - Missing htmlFor in Form Labels
**Learning:** Found multiple instances where `<label>` elements in forms (e.g., Contact and Admin Login) were missing the `htmlFor` attribute. This breaks standard accessibility practices and makes it harder for users with screen readers or those who click on labels to focus the associated input field.
**Action:** Always associate labels with their inputs using the `htmlFor` attribute linking to an `id` on the input, ensuring better accessibility.
