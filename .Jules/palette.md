## 2024-11-20 - Form Accessibility Strategies

**Learning:** Forms must always be accessible. Visual constraints often mean `<label>` tags are omitted in favor of placeholders, but this fails screen readers. There are two primary patterns:
1. When a visible `<label>` *is* present (like on the Contact page), explicitly associate it with its input using matching `htmlFor` and `id` attributes. Don't rely on simple proximity.
2. When a visible `<label>` *is not* present (like on the Rent Modal) due to visual design constraints and custom CSS is prohibited, use the `aria-label` attribute directly on the `<input>` or `<textarea>` element to provide the accessible name.

**Action:** Before building or updating any form, assess its visual layout. If there are visible labels, add `htmlFor` and `id`. If there are no visible labels, add `aria-label` directly on the input elements. Ensure all form fields have an accessible name.