/**
 * Base Page Object — shared waiting, tapping, typing helpers.
 * All page classes extend this (POM + OOP inheritance).
 */
class BasePage {
  /**
   * @param {WebdriverIO.Browser} driver
   */
  constructor(driver) {
    this.driver = driver;
    this.defaultTimeout = 12000;
    // Pause so steps are visible on slow emulator UI (ms). Set STEP_PAUSE_MS=0 to skip.
    this.stepPauseMs = Number(process.env.STEP_PAUSE_MS ?? 1800);
  }

  /**
   * Human-visible pause + terminal note (emulator follow-along).
   */
  async show(label) {
    if (label) console.log(`    [EMU] ${label}`);
    if (this.stepPauseMs > 0) {
      await this.driver.pause(this.stepPauseMs);
    }
  }

  /**
   * Resolve the first existing element from selector candidates.
   * @param {string[]} selectors
   * @param {number} timeout
   */
  async findFirst(selectors, timeout = this.defaultTimeout) {
    let matched;

    await this.driver.waitUntil(
      async () => {
        for (const selector of selectors) {
          const el = await this.driver.$(selector);
          if (await el.isExisting()) {
            matched = el;
            return true;
          }
        }
        return false;
      },
      {
        timeout,
        interval: 400,
        timeoutMsg: `Element not found: ${selectors.join(' | ')}`,
      }
    );

    return matched;
  }

  async tap(selectors, timeout = this.defaultTimeout) {
    const el = await this.findFirst(selectors, timeout);
    try {
      const loc = await el.getLocation();
      const size = await el.getSize();
      await this.tapAt(
        Math.round(loc.x + size.width / 2),
        Math.round(loc.y + size.height / 2)
      );
    } catch {
      await el.click();
    }
    return el;
  }

  async tapAt(x, y) {
    await this.driver.execute('mobile: clickGesture', { x, y });
  }

  async scroll(direction = 'up', percent = 0.5) {
    await this.driver.execute('mobile: scrollGesture', {
      left: 80,
      top: 700,
      width: 900,
      height: 1000,
      direction,
      percent,
    });
  }

  async type(selectors, value) {
    const el = await this.findFirst(selectors);
    await el.click();
    await this.driver.pause(300);
    try {
      await el.clearValue();
    } catch {
      // Flutter fields often reject clearValue
    }
    try {
      await this.driver.execute('mobile: type', { text: String(value) });
    } catch {
      await this.driver.keys(String(value));
    }
    return el;
  }

  /**
   * Fast visibility check — does not burn a long wait when missing.
   */
  async isVisible(selectors, timeout = 1500) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      for (const selector of selectors) {
        try {
          const el = await this.driver.$(selector);
          if ((await el.isExisting()) && (await el.isDisplayed())) {
            return true;
          }
        } catch {
          // try next
        }
      }
      await this.driver.pause(250);
    }
    return false;
  }

  async getText(selectors) {
    const el = await this.findFirst(selectors);
    return (await el.getText()).trim();
  }

  async hideKeyboardSafe() {
    try {
      if (await this.driver.isKeyboardShown()) {
        await this.driver.hideKeyboard();
      }
    } catch {
      // Keyboard may already be hidden on some devices.
    }
  }
}

module.exports = BasePage;
