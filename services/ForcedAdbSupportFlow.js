const { execFileSync } = require('child_process');
const checkpoint = require('./Checkpoint');
const SupportTicketFlowComponent = require('./SupportTicketFlowComponent');

/**
 * Fast pure-adb Support ticket flow.
 * NEW ticket + reply. Fixed short pauses — almost no UI dumps (dumps are slow).
 */
class ForcedAdbSupportFlow {
  constructor() {
    this.udid = process.env.DEVICE_UDID || '';
  }

  /** @param {string[]} args */
  adb(args) {
    const base = this.udid ? ['-s', this.udid, ...args] : args;
    return execFileSync('adb', base, {
      encoding: 'utf8',
      timeout: 30000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  sleep(ms) {
    const buf = new Int32Array(new SharedArrayBuffer(4));
    Atomics.wait(buf, 0, 0, Math.max(0, ms));
  }

  tap(x, y) {
    this.adb(['shell', 'input', 'tap', String(x), String(y)]);
  }

  text(value) {
    const encoded = String(value).replace(/ /g, '%s');
    this.adb(['shell', 'input', 'text', encoded]);
  }

  key(code) {
    this.adb(['shell', 'input', 'keyevent', String(code)]);
  }

  dumpUi() {
    try {
      this.adb(['shell', 'uiautomator', 'dump', '/sdcard/support-flow.xml']);
      return this.adb(['shell', 'cat', '/sdcard/support-flow.xml']);
    } catch {
      return '';
    }
  }

  /**
   * @param {{
   *   title?: string,
   *   description?: string,
   *   phone?: string,
   *   reply?: string,
   * }} [options]
   */
  async execute(options = {}) {
    const title =
      options.title || SupportTicketFlowComponent.buildDynamicTitle();
    const description =
      options.description ||
      process.env.SUPPORT_TICKET_MESSAGE ||
      'My created buy i cant login properly please solve my problem';
    const phone = options.phone || process.env.SUPPORT_TICKET_PHONE || '01772559986';
    const replyBase =
      options.reply || process.env.SUPPORT_TICKET_REPLY || 'please solve my problem';
    const reply = `${replyBase} ${Date.now().toString().slice(-6)}`;

    console.log(`[Support:ADB] New ticket: ${title}`);
    console.log(`[Support:ADB] Reply: ${reply}`);

    await checkpoint.run('Launch → New Ticket form', async () => {
      try {
        this.adb(['shell', 'am', 'force-stop', 'com.aungsha.app']);
      } catch {
        // ignore
      }
      this.sleep(300);
      try {
        this.adb([
          'shell',
          'monkey',
          '-p',
          'com.aungsha.app',
          '-c',
          'android.intent.category.LAUNCHER',
          '1',
        ]);
      } catch {
        this.adb(['shell', 'am', 'start', '-n', 'com.aungsha.app/.MainActivity']);
      }
      this.sleep(2500);

      // Home → Support → New Ticket (fixed coords, no dump)
      this.tap(141, 2232);
      this.sleep(400);
      this.tap(895, 1346);
      this.sleep(900);
      this.tap(283, 1300);
      this.sleep(900);
    });

    await checkpoint.run('Fill + Submit ticket', async () => {
      this.tap(173, 628);
      this.sleep(150);

      this.tap(540, 995);
      this.sleep(150);
      this.text(title);
      this.sleep(200);

      this.tap(540, 1350);
      this.sleep(150);
      this.text(description);
      this.sleep(200);

      this.key(4);
      this.sleep(200);
      this.tap(540, 1710);
      this.sleep(150);
      this.text(phone);
      this.sleep(200);

      this.key(4);
      this.sleep(250);
      this.tap(540, 1892);
      this.sleep(1800);

      // One verify dump only
      const xml = this.dumpUi();
      if (!/My Tickets|#\d+|Ticket Details/.test(xml)) {
        this.tap(540, 1892);
        this.sleep(1200);
      }
      checkpoint.pass(`Submitted — ${title}`);
    });

    await checkpoint.run('Open ticket + reply', async () => {
      // If still Support Center, open My Tickets
      const xml0 = this.dumpUi();
      if (/Support Center/.test(xml0) && !/My Tickets/.test(xml0)) {
        this.tap(797, 1300);
        this.sleep(800);
      } else if (!/Ticket Details/.test(xml0)) {
        // list — open top card
        this.tap(540, 465);
        this.sleep(900);
      }

      this.tap(480, 2240);
      this.sleep(150);
      this.text(reply);
      this.sleep(200);
      this.key(4);
      this.sleep(200);
      this.tap(996, 2258);
      this.sleep(700);

      checkpoint.pass('Reply sent');
    });

    checkpoint.pass(`Support DONE — ${title}`);
    return { title, reply };
  }
}

module.exports = ForcedAdbSupportFlow;
