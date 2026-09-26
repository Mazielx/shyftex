# AGENTS.md — Project Rules for AI Agents

## Project: SHYFTEX

### Core Rules

1. **Language:** All code, comments, variable names, commit messages, and documentation in ENGLISH.
2. **Types:** All code must be fully typed. No `any` unless absolutely unavoidable and documented.
3. **No Secrets:** Never commit API keys, passwords, tokens. Use environment variables.
4. **Mock Data:** All mock/demo data MUST be clearly marked with `isMock: true` and `source: 'MOCK'`.
5. **Money:** Never use floating point for monetary calculations. Use the `Money` value object.
6. **Domain Purity:** Domain layer (`src/domain/`) has ZERO external imports from infrastructure.
7. **Provider Pattern:** All external services go through provider interfaces.
8. **Error Handling:** Every async operation must have error handling. No silent failures.
9. **Testing:** Core business logic must have unit tests. Optimization engine must have exhaustive tests.
10. **Honesty:** Never present mock data as real. Never claim functionality exists when it doesn't.

### Code Style
- Prefer `const` over `let`
- Functions should be small and focused
- Early returns over deep nesting
- Descriptive variable/function names
- No magic numbers — use named constants
- Single responsibility per function/class

### File Organization
- One export per file preferred
- Colocate related files
- Feature-based organization in screens
- Shared code in `lib/` or `shared/`

### Git
- Meaningful commit messages
- One logical change per commit
- No commits with secrets

### Security Checklist (every PR)
- [ ] No hardcoded secrets
- [ ] Input validated
- [ ] Auth required where needed
- [ ] SQL injection prevented (Prisma handles this)
- [ ] XSS prevented
- [ ] Error messages don't leak internals
- [ ] Rate limiting on sensitive endpoints
