# Branch Protection Rules

## Required Status Checks for Main Branch

The following status checks must pass before merging to `main`:

### Quality Gates
- ✅ **PR Protection Checks** - Validates PR conditions and prevents unauthorized merges
- ✅ **Code Quality & Linting** - TypeScript, ESLint, Prettier, Security Audit
- ✅ **Test Suite** - Unit and integration tests across Node.js versions
- ✅ **Build Application** - Successful application build
- ✅ **Merge Protection Gate** - Final validation before merge approval

### Security & Compliance
- ✅ **Security Scan** - Trivy vulnerability scanner and CodeQL analysis

### Performance (for develop branch)
- ✅ **Performance Testing** - Lighthouse CI and load testing

## Branch Protection Rules

### Main Branch
- **Require pull request reviews before merging**: 2 reviewers required
- **Require status checks to pass before merging**: All checks listed above
- **Require branches to be up to date before merging**: Yes
- **Do not allow bypassing the above settings**: Yes

### Develop Branch  
- **Require pull request reviews before merging**: 1 reviewer required
- **Require status checks to pass before merging**: Quality gates only
- **Require branches to be up to date before merging**: Yes
- **Do not allow bypassing the above settings**: Yes

## Automated Protections

1. **No direct pushes to main/develop** - All changes must go through PRs
2. **Secret detection** - GitGuardian scans for hardcoded secrets
3. **Dependency security** - Automated security audits
4. **Code quality** - Zero tolerance for linting errors
5. **Test coverage** - All tests must pass across multiple Node.js versions
6. **Build validation** - Application must build successfully
7. **Security scanning** - Vulnerability scanning before merge

## PR Requirements

- ✅ Must have description
- ✅ Must pass all quality gates
- ✅ Must not contain hardcoded secrets
- ✅ Must not introduce security vulnerabilities
- ✅ Must maintain code quality standards
- ✅ Must have passing tests
- ✅ Must build successfully

## Emergency Bypass

In emergency situations, repository administrators can:
1. Temporarily disable branch protection
2. Merge critical fixes
3. Re-enable protection immediately

This should be documented in the repository's incident response plan.
