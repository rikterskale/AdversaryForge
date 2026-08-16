# Project artifact contract

After intake confirmation, every project is represented by a repository-shaped bundle:

```text
projects/<slug>/
├── project.yaml
├── threat-model.md
├── capabilities.yaml
├── acceptance-criteria.md
├── verification-plan.md
└── release-evidence/
    └── README.md
```

The static MVP downloads this bundle as JSON so it can be inspected or committed manually. A production backend should write the files to `projects/<slug>/` in an isolated branch, attach the intake approval and context snapshot, and open the design-review workflow.

The artifact bundle is generated only after the user reviews the answers and explicitly selects **Proceed to design**. It contains no credentials and defaults to denied network access, fixture-only filesystem access, and human approval for controlled actions.
