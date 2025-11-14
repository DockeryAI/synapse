# Universal Coding Standards

**Applies to:** All AI code builders (Claude, ChatGPT, Cursor, GitHub Copilot, etc.)

**Purpose:** Ensure consistent, high-quality code across all development workflows.

---

## Core Principles

### 1. Git as Source of Truth
✅ **Always:**
- Commit meaningful changes with descriptive messages
- Push to remote after significant features
- Use semantic versioning for releases (v1.0.0, v1.1.0, v2.0.0)
- Tag releases: `git tag v1.0.0 && git push --tags`

❌ **Never:**
- Rely on non-Git persistence
- Commit sensitive data (API keys, passwords, secrets)
- Force push to main/master without explicit approval
- Commit without testing locally first

---

### 2. File Editing Best Practices
✅ **Always:**
- Show full file content when editing (unless file > 500 lines)
- Preserve exact indentation (tabs vs spaces)
- Maintain consistent code style with existing files
- Run formatters/linters before committing

❌ **Never:**
- Use partial diffs without context
- Mix formatting changes with logic changes
- Introduce syntax errors
- Remove code without understanding its purpose

---

### 3. Documentation Requirements
✅ **Always:**
- Update README.md when adding major features
- Document complex functions with JSDoc/docstrings
- Keep CHANGELOG.md current with version releases
- Update .buildrunner/features.json when shipping features

❌ **Never:**
- Leave TODO comments without tracking tickets
- Write code without inline comments for complex logic
- Skip API documentation for endpoints
- Forget to document breaking changes

---

### 4. Testing Standards
✅ **Always:**
- Write tests for critical business logic
- Test error paths, not just happy paths
- Run test suite before committing
- Document test setup requirements

❌ **Never:**
- Skip tests for "simple" functions
- Commit failing tests
- Disable tests to make CI pass
- Test only in local environment

---

### 5. Security & Safety
✅ **Always:**
- Validate all user inputs
- Sanitize data before database queries (SQL injection prevention)
- Use environment variables for secrets
- Follow principle of least privilege
- Implement proper error handling

❌ **Never:**
- Hard-code API keys or passwords
- Trust user input without validation
- Expose stack traces to end users
- Use `eval()` or equivalent on user input
- Commit .env files to git

---

### 6. Code Organization
✅ **Always:**
- Follow project's existing directory structure
- Use meaningful file and variable names
- Keep functions small and single-purpose
- Extract repeated code into utilities
- Group related code into modules

❌ **Never:**
- Create "kitchen sink" utility files
- Use cryptic abbreviations
- Nest code more than 4 levels deep
- Mix concerns (UI logic in database layer, etc.)
- Leave dead/commented code in commits

---

### 7. Dependency Management
✅ **Always:**
- Lock dependency versions (package-lock.json, requirements.txt)
- Document why each dependency is needed
- Keep dependencies up to date
- Use stable, well-maintained libraries

❌ **Never:**
- Install packages without checking license
- Use deprecated packages
- Include unused dependencies
- Pin to specific patch versions unless necessary

---

### 8. Error Handling
✅ **Always:**
- Handle expected errors gracefully
- Log errors with context
- Provide user-friendly error messages
- Fail fast for unrecoverable errors
- Use try/catch or equivalent in production code

❌ **Never:**
- Swallow exceptions silently
- Use generic "Error occurred" messages
- Expose internal error details to users
- Continue execution after critical failures
- Use exceptions for control flow

---

### 9. Performance Considerations
✅ **Always:**
- Profile before optimizing
- Cache expensive computations
- Use appropriate data structures
- Consider scalability from the start
- Monitor resource usage

❌ **Never:**
- Premature optimization
- N+1 database queries in loops
- Loading entire datasets into memory
- Blocking operations on main thread
- Ignoring time complexity

---

### 10. Code Review Checklist

Before marking feature complete:
- [ ] Code runs without errors
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No console.log/print statements left behind
- [ ] No hardcoded values that should be configurable
- [ ] Error handling implemented
- [ ] Security vulnerabilities addressed
- [ ] Performance acceptable
- [ ] Code follows project style guide
- [ ] Commit message is descriptive

---

## Language-Specific Standards

### JavaScript/TypeScript
- Use `const` by default, `let` when necessary, never `var`
- Prefer async/await over callbacks
- Use TypeScript strict mode
- Follow airbnb or standard style guide

### Python
- Follow PEP 8 style guide
- Use type hints for function signatures
- Prefer list comprehensions over map/filter
- Use virtual environments

### Shell Scripts
- Use `set -euo pipefail` for safety
- Quote all variables: `"$VAR"`
- Use shellcheck for validation
- Prefer zsh/bash over sh when possible

---

## Feature Registry Integration

When you complete a feature:
1. Update `.buildrunner/features.json`
2. Mark feature status as "complete"
3. List all modified components
4. Update version number if releasing
5. Regenerate STATUS.md: `node .buildrunner/scripts/generate-status.mjs`
6. Commit with semantic commit message: `feat: Complete GitHub integration`

---

## Questions?

If standards conflict or are unclear:
1. Follow existing code patterns in the project
2. Ask the project owner for clarification
3. Document the decision for future reference
4. Update these standards if broadly applicable

---

**Last Updated:** 2025-11-14
**Version:** 3.0.0
**Applies To:** All projects using Build Runner governance
