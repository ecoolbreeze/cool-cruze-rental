## 2024-05-20 - Forms Accessibility
**Learning:** For form inputs that do not have visible labels due to design constraints (like in `RentModal.jsx`), using `aria-label` provides necessary context to screen readers. For inputs that do have visible labels (like in `Contact.jsx`), associating the label with the input using `htmlFor` and `id` is the proper way to ensure accessibility.
**Action:** When adding or fixing form inputs, evaluate if visible labels are present. Use `htmlFor` and `id` for visible labels, and `aria-label` when visual labels are omitted.
