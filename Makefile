# Canonical operational commands.
# Docs reference these targets instead of repeating command strings.
#
# First-time bootstrap only: run `npm install` once to generate and commit package-lock.json,
# then use `make setup` (npm ci) on every machine after that.

.PHONY: setup doctor run report test lint typecheck

setup:
	npm ci

doctor:
	npx tsx src/cli/index.ts doctor

run:
	npx tsx src/cli/index.ts run $(APP) $(ARGS)

report:
	npx tsx src/cli/index.ts report $(RUN) $(ARGS)

test:
	npx vitest run

lint:
	npx eslint .

typecheck:
	npx tsc --noEmit
