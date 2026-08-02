<!--
PR title should carry the ticket code, e.g. "US-4.1: Report generation" or "TICKET-024: ...".
Test cases and Page Objects reach the main branch only through an approved PR (BR-006).
-->

## Summary

<!-- What this PR delivers and why. Link the user story / ticket. -->

**User story / ticket:**

## Type of change

- [ ] Platform code (`src/`)
- [ ] App test cases / Page Objects (`apps/`)
- [ ] Docs / process

## Checklist — every PR

- [ ] **Behaviour matches implementation** — the behaviour description and what actually runs agree (BR-010, NFR-09).
- [ ] **English only** — code, comments, `.feature` text and identifiers (BR-013, BC-10).
- [ ] **No secrets or real test-data values committed**; any new data item is added to `apps/<app-id>/test-data.example.json` as a placeholder (BR-017, NFR-04).
- [ ] **Gates green:** `make typecheck`, `make lint` (includes module boundaries), `make test`.
- [ ] **Conventional Commits**, one commit per ticket, message in English.

## Checklist — test cases / Page Objects (UC-04, if `apps/` changed)

- [ ] The test case sits in the right **test feature** and checks **exactly one behaviour** (BR-016).
- [ ] **Locators live in a Page Object**, not scattered across step definitions (BR-007).
- [ ] The **opening step sets up** the state and data the test case needs; consumed data is created there, not stored (BR-005, BR-017).
- [ ] The screen name passed to `find(locator, screenName)` matches the Page Object of that screen (ADR-011).

## How to verify

<!-- Commands for the automated gates; manual steps for any device-touching part (conventions §3.1). -->

## Definition of Done

Meets `docs/tickets/conventions.md` §3 (ticket) and §4 (user story). An approved review is required before merge (BR-006).
