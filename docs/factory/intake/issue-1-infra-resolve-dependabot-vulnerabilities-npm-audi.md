        # Factory intake for issue #1: [Infra] Resolve Dependabot vulnerabilities — npm audit fix

        Repository: `KyaniteLabs/Innerscape`
        Category: `llm_fix`
        Source issue: `#1`

        ## User request

        ## Problem
161 Dependabot vulnerabilities (mostly transitive) flagged in the monorepo.

## Scope
- Run `npm audit fix` across all workspaces
- Review remaining unfixable vulnerabilities for actual risk
- Update lockfile

## Acceptance Criteria
- [ ] `npm audit` shows zero critical/high vulnerabilities
- [ ] All 118 tests still pass
- [ ] TypeScript strict mode still clean

        ## Factory interpretation

        This issue was picked up by `issue-closer`, but no safe code edit was
        produced by the configured agent providers. The Factory is therefore
        converting the issue into an implementation contract instead of silently
        skipping it.

        ## Acceptance contract

        - Confirm the desired behavior from the issue title and body.
        - Identify the smallest implementation slice that can ship independently.
        - Add or update tests/proofs for that slice before merging implementation.
        - Keep credentials, local machine paths, and deployment secrets out of the repo.
        - Close or update the source issue when the implementation PR lands.

        ## Next Factory action

        Dispatch a repo worker against this contract. If the request is too broad,
        split it into smaller `agent-ready` issues with concrete acceptance checks.
