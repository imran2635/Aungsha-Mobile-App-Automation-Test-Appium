/**
 * Support ticket flow — NEW ticket every run + reply message.
 *
 *   npm.cmd run test:support:ticket
 *
 * Env (optional):
 *   SUPPORT_TICKET_TITLE        base title (stamp appended every run)
 *   SUPPORT_TICKET_FIXED_TITLE  set 1 to disable dynamic stamp
 *   SUPPORT_TICKET_MESSAGE      describe text
 *   SUPPORT_TICKET_PHONE        default: 01772559986
 *   SUPPORT_TICKET_REPLY        default: please solve my problem
 *   SUPPORT_FORCE_ADB=1         adb-only (default for reliability)
 *   SUPPORT_USE_APPIUM=1        try Appium first, ADB fallback on UIA2 crash
 *
 * Always: create NEW ticket → open it → send reply.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

if (!process.env.SUPPORT_TICKET_TITLE) {
  process.env.SUPPORT_TICKET_TITLE = 'account creating problem';
}
if (!process.env.SUPPORT_TICKET_MESSAGE) {
  process.env.SUPPORT_TICKET_MESSAGE =
    'My created buy i cant login properly please solve my problem';
}
if (!process.env.SUPPORT_TICKET_PHONE) {
  process.env.SUPPORT_TICKET_PHONE = '01772559986';
}
if (!process.env.SUPPORT_TICKET_REPLY) {
  process.env.SUPPORT_TICKET_REPLY = 'please solve my problem';
}

const checkpoint = require('../services/Checkpoint');
const ForcedAdbSupportFlow = require('../services/ForcedAdbSupportFlow');
const SupportTicketFlowComponent = require('../services/SupportTicketFlowComponent');
const { runStandaloneFlow } = require('../services/runStandaloneFlow');

function isUiCrash(err) {
  const msg = String((err && (err.message || err)) || '');
  return /UiAutomation|instrumentation|not running|session not created|cannot be proxied|socket hang up/i.test(
    msg
  );
}

async function runAdbFlow(reason) {
  console.log(`\n[Support] ADB full flow — new ticket + reply (${reason})\n`);
  checkpoint.reset();
  const flow = new ForcedAdbSupportFlow();
  try {
    await flow.execute();
  } finally {
    checkpoint.summary();
  }
}

(async () => {
  const useAppium = String(process.env.SUPPORT_USE_APPIUM || '') === '1';

  if (!useAppium) {
    await runAdbFlow('default — create + reply');
    return;
  }

  try {
    await runStandaloneFlow((driver) => new SupportTicketFlowComponent(driver));
  } catch (err) {
    if (isUiCrash(err)) {
      await runAdbFlow(err.message || 'UiAutomator2 crash');
      return;
    }
    console.error(err);
    process.exit(1);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
