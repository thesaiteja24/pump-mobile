## TypeScript & Typing Rules

- Follow strict TypeScript typing across the entire codebase.
- Reuse existing types from the `types/` directory whenever possible.
- Before creating a new type, always check whether an existing type can be reused or extended.
- If a type is only relevant to a single standalone component, it may be defined within that component file.
- Shared or domain-specific types must be placed in the appropriate modular/domain-based type file instead of duplicating definitions.

### Forbidden

- Do not use `any`.
- Do not use `@ts-ignore`.
- Do not bypass type safety unless explicitly instructed.

### Preferred Alternatives

- Use framework-provided types whenever available.
- Use utility types (`Partial`, `Pick`, `Omit`, `Record`, etc.) where appropriate.
- Prefer explicit interfaces/types over implicit object typing.
- Prefer `unknown` over `any` when type safety is uncertain.

---

## Code Quality Rules

Before completing any task, always run:

```bash
npm run typecheck
npm run lint
```

### Completion Requirements

- Ensure there are no TypeScript errors.
- Ensure there are no ESLint errors or warnings.
- Fix all issues before considering the task complete.

---

## Project Structure Rules

- Maintain modular and domain-based organization.
- Avoid duplicate types, utilities, or services.
- Keep related logic grouped within its feature/domain.
- Shared logic should be extracted into reusable utilities/hooks/services.

---

## Expo / React Native Rules

- Use functional components only.
- Use hooks instead of class components.
- Prefer reusable UI components over duplicated JSX.
- See that if a particular component or repetition can be avoided by making it a proper reusable component or extending a old component's functionality
- Keep components focused and reasonably small.
- Avoid unnecessary re-renders and expensive computations inside render functions.

---

## Imports & Formatting

- Keep imports auto-sorted.
- Remove unused imports.
- Group imports consistently:
  1. React / React Native
  2. External libraries
  3. Internal modules
  4. Relative imports

- Maintain clean spacing and formatting across files.

---

## Logging Rules

- Avoid `console.log`.
- Use structured logging utilities where applicable.
- `console.warn` and `console.error` are allowed for debugging and error reporting.
