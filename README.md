# AdversaryForge

AdversaryForge is a dependency-free MVP console for an AI-assisted security-tool factory. It treats the model as an accelerator for design, implementation, testing, and documentation while the harness supplies repository context, policy gates, evidence, auditability, and repeatable release workflows.

## Run locally

This MVP is intentionally dependency-free. Open `index.html` in a browser, or serve the folder with any static file server:

```powershell
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Verify locally

The MVP has a dependency-free Node test and release contract:

```powershell
npm test
npm run verify
```

`npm test` enforces 100% line, function, and branch coverage for the harness release-readiness domain. `npm run verify` checks that the documented installation, guided intake, recovery paths, and release standard are present.

## MVP workflow

- Review the control plane and active tool builds.
- Move a tool through repository intake, threat modeling, implementation, verification, documentation, and release readiness.
- Inspect reusable workflows, evidence-backed findings, policy gates, and append-only audit activity.

## Guided GUI and CLI

The MVP is interactive for new users: **Guided setup** and **Help center** explain each workflow, intake answers can be edited or recovered, and review includes a safe dry-run preview before anything is created. The terminal companion uses the same guidance:

```powershell
npm run forge -- setup
npm run forge -- init
npm run forge -- verify
npm run forge -- release-check
```

The CLI wizard never contacts targets. It previews the plan, asks before proceeding, and keeps human approval required.
- Keep action approval, immutable scope, and connector isolation visible as first-class product concepts.

## Safety boundary

The current UI is a front-end harness shell with mock state. It does not execute payloads, scan targets, access credentials, or connect to external systems. A production backend should preserve the same defaults: explicit authorization, immutable scope, human approval for controlled actions, complete audit logs, secret isolation, fixture-first testing, signed artifacts, and rate-limited connectors.

## Suggested production boundary

The next backend should expose four deliberately separate services: a context/indexing service for repository snapshots; an orchestration service for model proposals and workflow state; a verification service that runs isolated fixture tests and policy checks; and an artifact service for evidence, documentation, SBOMs, and signed releases. The model should propose changes through structured contracts, while the harness decides what may execute.

## CI and release readiness

The first-class CI process lives in `.github/workflows/ci.yml`. It proves clean installation prerequisites, enforces 100% coverage for the tested core, validates the static product contract, starts the documented local server, and publishes release evidence. The separate [new-user release-readiness standard](docs/release-readiness.md) requires proven installation, guided troubleshooting, full-feature validation, tested recovery paths, and documentation—not merely a coverage threshold.

The machine-readable [release-readiness goal](docs/release-readiness.json) defines the five required standards and keeps human approval separate from automated coverage.

After both verification gates pass, CI builds a reproducible MVP release bundle containing the application, documentation, release manifest, SBOM, and checksums. The bundle is published as a workflow artifact and remains explicitly unsigned until a real signing key and internal registry are configured.

See the [guided troubleshooting guide](docs/troubleshooting.md) for startup, verification, intake recovery, and failed-run recovery paths.

Confirmed intake answers generate a repository-shaped [project artifact bundle](docs/project-artifacts.md) with a project manifest, threat model, capability declaration, acceptance criteria, and release-evidence checklist. The static MVP downloads the bundle as JSON; a production backend should commit the files to `projects/<slug>/` on an isolated branch.
