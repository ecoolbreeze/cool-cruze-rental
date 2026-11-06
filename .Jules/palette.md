## 2024-05-24 - Explicit Form Label Associations
**Learning:** Found instances where structural proximity was used instead of explicit association for form fields (e.g. contact form). Relying on proximity without `htmlFor`/`id` matching leads to poor screen reader support and reduced clickable area for inputs.
**Action:** Always ensure visible `<label>` elements are explicitly associated with their corresponding inputs using matching `htmlFor` and `id` attributes, instead of relying solely on structural proximity.
