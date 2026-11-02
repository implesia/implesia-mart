# Instructions for AI assistants and new developers

These rules apply to every AI tool and every person working in this repository. No AI may skip them.

## Before you start

1. Read every file in `docs/` (`docs/*.md`) before changing code:
   - `PROJECT_OVERVIEW.md`: what the repo is, stack, folders, how to run it.
   - `BUSINESS_LOGIC.md`: the rules each feature must keep.
   - `API.md`: which page uses which backend endpoint, through `lib/mart-api` and the BFF.
   - `CHANGELOG.md`: what changed and when.
   - `TODO.md`: known gaps and open work.
2. Read `AGENTS.md`: this Next.js version has breaking changes. Check `node_modules/next/dist/docs/` before writing Next.js code.
3. Run `git status` first. Never overwrite or discard someone else's uncommitted work or stashes.

## After every task

1. Add a dated entry to `docs/CHANGELOG.md` (newest first): what changed and the files touched.
2. Update `docs/BUSINESS_LOGIC.md` when a rule changes or a new rule appears.
3. Update `docs/API.md` when a page starts or stops using an endpoint.
4. Update `docs/TODO.md` when you finish an item or find a new one.
5. If the change needs the backend repo (`implesia-mart-backend`) to change, write in the CHANGELOG entry exactly what must change there (endpoint, field, error shape).

## Always

- Never commit or print secrets, `.env.local` values, API keys, passwords or tokens. Document variable names only.
- Use the existing brand tokens and components. No new colors, no redesign that was not asked for.
- Keep changes minimal and focused.
- Run `npm test`, `npm run lint`, `npm run typecheck` and `npm run build` before you commit.
- Commit only to the working branch. Never force-push, never push to `main`, never deploy without approval.
