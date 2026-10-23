# Agent instructions

## Start each task

- Read `CONTEXT.md`, `README.md`, and any instructions in the directories being changed.
- Check `git status --short` before editing. Preserve existing user changes.
- Follow the user's current request and keep changes focused on it.
- Use `CONTEXT.md` to resume work, but verify its claims against the code when needed.

## Project

- Deeparture V2 is a standalone travel inventory and enquiry application. The current correction branch extends Phase 2B Rev 1.3; read `docs/phase2b/REVIEW_CORRECTIONS_2026-10-20.md` and its evidence matrix before working on acceptance.
- `backend/`: Node.js, Express, MongoDB/Mongoose API.
- `frontend/`: Next.js and React application.
- Use a separate development database. Never point local development at production.
- Keep secrets out of tracked files and work logs. Keep email delivery in test mode unless explicitly authorized otherwise.

## Validation

- Backend changes: run `npm run check` and relevant `npm test` tests from `backend/`.
- Frontend changes: run `npm run build` from `frontend/` when dependencies and configuration are available.
- Select additional checks based on the change; read scripts before running verification that may require services or modify data.
- For documentation-only changes, check the diff and referenced paths; application tests are unnecessary.
- Record what actually ran and its result. Never claim an unrun check passed.

## Keep work traceable

- Update `CONTEXT.md` after meaningful work and before ending a session.
- Record the task, changes, validation, outstanding issues, and concrete next steps.
- Clearly distinguish completed work from planned work and unverified assumptions.
- Add a dated entry to the work log, using Asia/Dhaka dates, and keep current status concise.
- Do not commit, push, deploy, or send messages unless the user authorizes those actions.
- End with a short report of what changed, verification, and anything still blocked.
