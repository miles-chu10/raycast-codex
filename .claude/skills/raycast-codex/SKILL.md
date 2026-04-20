```markdown
# raycast-codex Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill provides a comprehensive guide to the development patterns and conventions used in the `raycast-codex` repository. The codebase is written in TypeScript and does not use a specific framework. It emphasizes consistent file naming, import/export styles, and includes patterns for writing and running tests. This guide will help contributors quickly align with the project's standards and workflows.

## Coding Conventions

### File Naming
- Use **kebab-case** for all file names.
  - Example:  
    ```
    my-component.ts
    utils-helper.ts
    ```

### Import Style
- Use **relative imports** for modules within the project.
  - Example:
    ```typescript
    import { helperFunction } from './utils-helper';
    ```

### Export Style
- Both **named** and **default exports** are used.
  - Named export example:
    ```typescript
    export function doSomething() { ... }
    ```
  - Default export example:
    ```typescript
    export default MyComponent;
    ```

### Commit Patterns
- Commit messages are **freeform** with no strict prefixing.
- Average commit message length: ~26 characters.
  - Example:
    ```
    add new search feature
    fix typo in helper
    update readme
    ```

## Workflows

### Adding a New Feature
**Trigger:** When implementing a new functionality.
**Command:** `/add-feature`

1. Create a new TypeScript file using kebab-case.
2. Implement the feature using relative imports for dependencies.
3. Export your functions or components (named or default as appropriate).
4. Write corresponding test files with the `.test.` pattern.
5. Commit your changes with a concise, descriptive message.

### Fixing a Bug
**Trigger:** When addressing a reported bug.
**Command:** `/fix-bug`

1. Locate the relevant file(s) using kebab-case naming.
2. Make the necessary code changes.
3. Update or add tests to cover the bug fix.
4. Commit with a clear message describing the fix.

### Writing and Running Tests
**Trigger:** When verifying code functionality.
**Command:** `/run-tests`

1. Write test files using the `.test.` pattern (e.g., `my-component.test.ts`).
2. Use the project's testing framework (unknown, check project docs or scripts).
3. Run the tests using the appropriate command (e.g., `npm test` or similar).

## Testing Patterns

- Test files follow the `*.test.*` naming convention.
  - Example: `utils-helper.test.ts`
- The specific testing framework is not detected; check project documentation or scripts for details.
- Place test files alongside or near the files they test.

## Commands
| Command      | Purpose                                  |
|--------------|------------------------------------------|
| /add-feature | Start the workflow for adding a feature  |
| /fix-bug     | Begin the process for fixing a bug       |
| /run-tests   | Run all test files in the codebase       |
```