# Contributing

How work reaches the main branch of aimtap. This is a process convention plus repository
configuration, not a platform-enforced mechanism (BR-006).

All content in this repository is written in English — code, comments, `.feature` files and
identifiers (BR-013, BC-10).

## Branches, commits and pull requests

- **One user story = one pull request.** The PR title carries the user story code (for example
  `US-4.1: Report generation`).
- **One ticket = one commit**, following Conventional Commits (`feat:`, `fix:`, `refactor:`,
  `test:`, `docs:`, `chore:`), with the commit ordered by the ticket dependencies.
- Work items and their structure live in `docs/tickets/` (`conventions.md`, `board.md`).

## Test cases and Page Objects enter main only through an approved PR

Test cases (`.feature` files and their step definitions) and Page Objects reach the main branch
only through a pull request that has been reviewed and approved (BR-006). Approval is enforced by
repository branch protection, not by the platform code.

Reviewers confirm the checklist in `.github/pull_request_template.md`, which maps the UC-04 review
list to the business rules:

| Review item | Rule |
|---|---|
| The behaviour description and the implementation agree | BR-010, NFR-09 |
| The test case is in the right test feature and checks one behaviour | BR-016 |
| Locators live in a Page Object, not in step definitions | BR-007 |
| The opening step sets up the state and data the test case needs | BR-005 |
| No real test-data values; new items go into `test-data.example.json` | BR-017 |
| Content is in English | BR-013 |

## Gates before merge

Every PR must be green on:

```
make typecheck
make lint      # includes module-boundary rules (eslint-plugin-boundaries)
make test
```

Device-touching code is not unit-tested against a real device; the PR states how that part was
verified manually (`docs/tickets/conventions.md` §3.1).

## Test data and secrets

- Real values live outside the repository: the Claude API key in the root `.env.local`, and per-app
  test data in `apps/<app-id>/test-data.local.json` — both git-ignored (ADR-009).
- The repository holds only templates: `.env.example` and `apps/<app-id>/test-data.example.json`
  with placeholder values. A new data item is added to the example template, never with a real
  value (BR-017, NFR-04).

## Where to look

- `docs/tickets/conventions.md` — ticket structure and Definition of Done.
- `docs/architecture/coding-convention.md` — code style and execution rules.
- `docs/architecture/north-star.md` — module boundaries and architecture.
