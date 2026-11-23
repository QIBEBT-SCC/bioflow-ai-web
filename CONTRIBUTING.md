# Contributing to BioFlow AI Web

Thank you for contributing to BioFlow AI Web! This guide covers the local development setup, branching conventions, and release workflow.

## Development Environment

- **Node.js**: 22+
- **Package manager**: [pnpm](https://pnpm.io/) (version pinned via `packageManager` in [package.json](./package.json))

Install locked dependencies from a source checkout:

```bash
corepack enable pnpm
pnpm install --frozen-lockfile
```

Configure `BACKEND_API_URL` in `.env.development` (for example, `BACKEND_API_URL=http://localhost:8000/api/v1`) to point the runtime `/api/v1/[...path]` proxy to a running BioFlow AI backend, then start the development server:

```bash
pnpm dev
```

### Quality Checks and Code Style

```bash
pnpm lint
pnpm format
pnpm exec react-doctor --diff dev --no-score --yes --offline
pnpm build
```

- **Formatting & linting**: Biome (2-space indent, single quotes, semicolons as needed; see [biome.json](./biome.json)).
- **CI checks**: Biome, React Doctor (when a diff base commit is available), and the production build in [pr-ci.yml](./.github/workflows/pr-ci.yml) (`Frontend checks`) are blocking on both `dev` and `master`. They run on pull requests to `master` and `dev`, as well as pushes to `master`.

## Branches and Pull Requests

- `master` is the default branch and the source of releases. `dev` is the integration branch. Both require pull requests and the **Frontend checks** status check.
- Create `feature/<topic>` or `fix/<topic>` branches from `dev`. Open pull requests against `dev`, wait for **Frontend checks** CI to pass, squash merge, and delete the topic branch.
- After integration testing, open a release pull request from `dev` to `master` and merge with a merge commit.
- For an urgent production fix, branch `hotfix/<topic>` from the deployed release, release the fix, and bring the fix back into both `master` and `dev` as needed.

## Releases

Frontend and backend versions are independent.

1. In the `dev` -> `master` release pull request, bump the SemVer `version` in [package.json](./package.json) (supported formats: `X.Y.Z` or `X.Y.Z-{alpha|beta|rc}.N`, for example, `1.0.0-beta.2` or `1.0.0`).
2. After merging to `master` with a merge commit, trigger the **Release & Publish Docker Image** workflow ([release.yml](./.github/workflows/release.yml)) from the `master` branch in GitHub Actions (optionally run with `dry_run: true` first to verify without pushing or releasing).
3. The release workflow automates:
   - Validating [package.json](./package.json) metadata and SemVer version, deriving the matching Git tag (for example, `1.0.0-beta.2` -> `v1.0.0-beta.2`) and GHCR image tags (`<version>`, plus `<major>.<minor>`, `<major>`, and `latest` for stable releases).
   - Building the Docker image and running container inspection and HTTP smoke tests against the standalone Next.js server.
   - Publishing the image to GitHub Container Registry (`ghcr.io/qibebt-scc/bioflow-ai-web`).
   - Creating the GitHub Release on the released commit with generated release notes and the published image tags and digest.
4. Afterwards, edit the generated GitHub Release notes to link related frontend and backend pull requests and record the tested backend version along with any environment or deployment changes.
