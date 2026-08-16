#!/usr/bin/env node
import {createInterface} from 'node:readline/promises';
import {stdin as input, stdout as output} from 'node:process';
import {createDryRunPlan, getGuidance, readinessSummary, createSetupChecklist} from '../src/guidance.js';

const rl = createInterface({input, output});
const ask = async (question, fallback = '') => (await rl.question(`${question}${fallback ? ` [${fallback}]` : ''}: `)).trim() || fallback;
const printGuide = topic => { const guide = getGuidance(topic); console.log(`\n${guide.title}`); guide.steps.forEach((step, index) => console.log(`  ${index + 1}. ${step}`)); };

try {
  const command = process.argv[2] || 'help';
  if (command === 'help') {
    console.log('AdversaryForge guided CLI\n\nCommands: setup, init, verify, release-check, help');
    printGuide('setup');
  } else if (command === 'setup') {
    printGuide('setup');
    createSetupChecklist().forEach(check => console.log(`  ○ ${check.label} — ${check.help}`));
  } else if (command === 'init') {
    printGuide('intake');
    const project = {name: await ask('Tool name'), objective: await ask('Authorized objective'), boundary: await ask('Fixture boundary', 'Fixture targets only')};
    const plan = createDryRunPlan(project);
    console.log('\nPreview (dry-run only):');
    plan.steps.forEach(step => console.log(`  • ${step}`));
    const proceed = (await ask('Proceed to design? (yes/no)', 'no')).toLowerCase();
    console.log(proceed === 'yes' ? 'Design review queued; human approval is still required.' : 'Cancelled safely; no project was created.');
  } else if (command === 'verify') {
    printGuide('verification');
    console.log('Verification mode: fixture-only, planned, no live targets. Record evidence for each check in the GUI.');
  } else if (command === 'release-check') {
    printGuide('release');
    const checklist = createSetupChecklist();
    console.log(`\nRelease readiness: ${readinessSummary(checklist).completed}/${readinessSummary(checklist).total} standards complete.`);
    checklist.forEach(check => console.log(`  ○ ${check.label}`));
    console.log('Coverage is necessary but not sufficient; human release approval remains required.');
  } else {
    console.error(`Unknown command: ${command}`);
    process.exitCode = 1;
  }
} finally { rl.close(); }
