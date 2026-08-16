# New-user release-readiness standard

## Goal

Every release must provide a concrete, evidence-backed first-run experience for a new user: proven installation, guided troubleshooting, full-feature validation, tested recovery paths, and complete documentation. A coverage percentage alone is never sufficient for release approval.

## Required evidence

### Proven installation

- A clean checkout completes the documented setup.
- Required runtime versions are checked.
- The console starts using the documented command.
- A new user can reach the guided intake.

### Guided troubleshooting

- Common startup, port, browser, and verification failures are documented.
- Error messages identify the failed step and the next action.
- A clean rerun procedure is documented.

### Full-feature validation

- Every user-facing intake question is exercised.
- Features can be added, removed, reviewed, and added again later.
- Back navigation preserves answers.
- The final confirmation is explicit and does not execute work.

### Tested recovery paths

- Empty answers are rejected without losing progress.
- A user can return from review to change answers.
- A user can remove a mistaken feature and add a replacement.
- A failed verification run leaves the project in a reviewable state.

### Documentation

- Installation and first run are documented.
- Safety boundary and authorized-use expectations are visible.
- Release evidence, known limitations, and troubleshooting are documented.

## Release gate

The release is blocked unless all five areas have passing CI evidence and a human reviewer confirms that the documented first-run flow matches the current product. The CI workflow enforces 100% line, function, and branch coverage for the tested harness domain, but the new-user standard remains a separate required gate.
