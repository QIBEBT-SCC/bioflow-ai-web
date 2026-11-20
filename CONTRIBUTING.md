# Branches and releases

- `master` is the default branch and the source of releases. `dev` is the integration branch.
  Both require pull requests and the **Frontend checks** status check.
- Create `feature/<topic>` or `fix/<topic>` from `dev`. Open the pull request against `dev`,
  squash merge after CI passes, and delete the topic branch.
- After integration testing, open a release pull request from `dev` to `master` and merge
  with a merge commit. For an urgent production fix, branch `hotfix/<topic>` from the deployed
  release, release the fix, and bring the fix back into both long-lived branches as needed.
- Frontend and backend versions are independent. Tag the released frontend commit with a
  SemVer tag such as `v1.0.0-beta.1`, then publish the matching GitHub Release to build the
  GHCR image. Link related frontend and backend pull requests and record the tested backend
  version in the release notes.
