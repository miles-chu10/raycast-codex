```markdown
# raycast-codex Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `raycast-codex` TypeScript codebase. It covers file and code organization, import/export styles, commit message guidelines, and how to write and run tests. While no explicit workflow automation is detected, this guide provides suggested commands and step-by-step instructions for common development tasks.

## Coding Conventions

### File Naming
- Use **kebab-case** for all filenames.
  - Example:  
    ```
    my-component.ts
    user-service.test.ts
    ```

### Import Style
- Use **relative imports** for internal modules.
  - Example:
    ```typescript
    import { helper } from './utils/helper';
    ```

### Export Style
- Use a **mixed export style** (both named and default exports may be present).
  - Example:
    ```typescript
    // Named export
    export function fetchData() { ... }

    // Default export
    export default MyComponent;
    ```

### Commit Messages
- Use the `chore` prefix for maintenance commits.
- Keep commit messages concise (average ~32 characters).
  - Example:
    ```
    chore: update dependencies
    chore: fix typo in helper
    ```

## Workflows

### Adding a New Feature
**Trigger:** When implementing a new functionality  
**Command:** `/add-feature`

1. Create a new file in kebab-case.
2. Implement the feature using TypeScript.
3. Use relative imports for dependencies.
4. Export your module (named or default as appropriate).
5. Write a corresponding test file (`*.test.ts`).
6. Commit changes with a clear message (e.g., `chore: add user login feature`).

### Running Tests
**Trigger:** When verifying code correctness  
**Command:** `/run-tests`

1. Identify test files by the `*.test.*` pattern.
2. Use the project's test runner (framework unknown; check documentation or scripts).
3. Run all tests and review output.

### Refactoring Code
**Trigger:** When improving code structure or readability  
**Command:** `/refactor`

1. Update relevant files, maintaining kebab-case naming.
2. Use relative imports for any new or moved modules.
3. Adjust exports as needed (named/default).
4. Update or add tests if necessary.
5. Commit with a message like `chore: refactor user service`.

## Testing Patterns

- Test files follow the `*.test.*` naming convention (e.g., `user-service.test.ts`).
- The specific testing framework is not detected; check for test scripts or documentation.
- Place tests alongside or near the code under test.
- Example test file:
  ```typescript
  import { fetchData } from './fetch-data';

  test('fetchData returns expected result', () => {
    expect(fetchData()).toBeDefined();
  });
  ```

## Commands
| Command       | Purpose                                   |
|---------------|-------------------------------------------|
| /add-feature  | Scaffold and implement a new feature      |
| /run-tests    | Run all test files in the codebase        |
| /refactor     | Refactor code and update related tests    |
```
