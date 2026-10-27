# Project Working Rules – Baumarkt-Buddy

## Git
- Never commit directly to `main`. `main` is the released version that the
  team and testers use.
- Work on your own working branch (e.g. `claude/<short-topic>`).
- Commit and push to the working branch automatically after every completed
  change. Do not ask for permission for these commits.
- Commit messages in English: first line short (what was changed),
  followed by 2–3 lines (why, which request/prompt triggered it).
- When a feature or milestone is finished and working, open a pull request
  into `main` and tell me it is ready for review. I merge it myself.
- do not use any information or data which is stored in archives 

## Pull Requests and Merging
- The pull request description must summarize all changes on the branch:
  first line = name of the feature/milestone,
  then a bullet list of the main changes.
- When merging into `main`, use a regular merge (no squash).
- The merge commit message uses the same summary as the pull request.

## Change Documentation
- Log every change in CHANGELOG.md under "Unreleased":
  date, what was changed, why, and the triggering prompt (paraphrased).
- When a pull request into `main` is opened, move the "Unreleased" entries
  under a new milestone heading with the same summary as the pull request.
- Update README.md whenever features or usage change.
- Never commit code that doesn't work. Fix errors first, then commit.
