# Guided troubleshooting

## The console does not load

Confirm that the server is running from the repository root:

```powershell
python -m http.server 8080
```

Then open `http://localhost:8080`. If port 8080 is busy, use another port and open the matching URL.

## Verification fails before the browser starts

Confirm Node.js 22 or newer is installed:

```powershell
node --version
```

Run the two checks separately to identify the failing layer:

```powershell
npm test
npm run verify
```

## An intake answer appears to be lost

Use **Back** to return to the previous question. The harness preserves existing answers. From the review screen, use **Change answers** or **Add functionality** to revise the project before confirmation.

## A feature was entered incorrectly

Remove it with the `×` control beside the feature, add the replacement, and continue to review. No project is created until **Proceed to design** is explicitly selected.

## A verification run fails

Treat the failure as a review state. Do not bypass the gate. Record the failing check, update the implementation or test fixture, rerun `npm test` and `npm run verify`, and review the release-readiness evidence again.
