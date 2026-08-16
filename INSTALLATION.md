# Installation and first run

AdversaryForge is currently a static MVP and requires no runtime dependencies beyond Node.js 22+ for verification and Python 3 for the local web server.

## Install

```powershell
git clone https://github.com/rikterskale/AdversaryForge.git
cd AdversaryForge
node --version
python --version
```

There is no dependency install step for the MVP. Run the verification suite with:

```powershell
npm test
npm run verify
```

## Run the console

```powershell
python -m http.server 8080
```

Open `http://localhost:8080` and choose **Tool factory**. Start a project, answer the intake questions, add or remove functionality, review the captured answers, and explicitly choose **Proceed to design**.

## Expected first-run result

The browser should render the control plane, open the guided intake, preserve answers when going back, allow late feature additions from the review screen, and show a queued design request after explicit confirmation. The MVP does not execute scans, payloads, connectors, or live-target actions.
