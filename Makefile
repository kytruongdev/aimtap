# Canonical operational commands.
# Docs reference these targets instead of repeating command strings.
#
# First-time bootstrap only: run `npm install` once to generate and commit package-lock.json,
# then use `make setup` (npm ci) on every machine after that.

.PHONY: setup doctor run run-assert-fail report test lint typecheck

setup:
	npm ci

doctor:
	npx tsx src/cli/index.ts doctor

# Default run: the regression suite, expected all green. Intentional-failure demonstrations
# (@assert-fail) are excluded so the result reads clean. Override the filter via ARGS if needed.
run:
	@test -n "$(APP)" || { echo "Usage: make run APP=<app-id> [ARGS=\"--tag @foo\"]"; exit 1; }
	npx tsx src/cli/index.ts run $(APP) --tag "not @assert-fail" $(ARGS)

# On-demand: run only the intentional-failure demonstrations (@assert-fail). These fail by design to
# exercise the failing-step screenshot + failure report path; not part of the green suite.
run-assert-fail:
	@test -n "$(APP)" || { echo "Usage: make run-assert-fail APP=<app-id>"; exit 1; }
	npx tsx src/cli/index.ts run $(APP) --tag "@assert-fail" $(ARGS)

report:
	npx tsx src/cli/index.ts report $(RUN) $(ARGS)

test:
	npx vitest run

lint:
	npx eslint .

typecheck:
	npx tsc --noEmit
