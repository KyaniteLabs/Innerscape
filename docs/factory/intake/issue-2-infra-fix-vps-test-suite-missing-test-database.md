        # Factory intake for issue #2: [Infra] Fix VPS test suite — missing test database

        Repository: `KyaniteLabs/Innerscape`
        Category: `llm_fix`
        Source issue: `#2`

        ## User request

        ## Problem
Integration tests pass locally but fail on VPS because the test database is not configured.

## Acceptance Criteria
- [ ] `npm test` passes on VPS
- [ ] Test DB is isolated from production DB
- [ ] CI pipeline can run tests

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
