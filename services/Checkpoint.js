/**
 * Console checkpoint reporter — every step shows PASSED / FAILED.
 */
class Checkpoint {
  constructor() {
    this.results = [];
  }

  reset() {
    this.results = [];
  }

  pass(name) {
    const row = { name, status: 'PASSED' };
    this.results.push(row);
    console.log(`  [PASSED] ${name}`);
    return row;
  }

  fail(name, err) {
    const detail = err && err.message ? err.message : err ? String(err) : '';
    const row = { name, status: 'FAILED', detail };
    this.results.push(row);
    console.log(`  [FAILED] ${name}${detail ? ` — ${detail}` : ''}`);
    return row;
  }

  /**
   * Run a step; logs PASSED or FAILED. Re-throws on failure.
   * @param {string} name
   * @param {() => Promise<unknown>} fn
   */
  async run(name, fn) {
    try {
      const value = await fn();
      this.pass(name);
      return value;
    } catch (err) {
      this.fail(name, err);
      throw err;
    }
  }

  /**
   * Soft check — logs FAILED but does not throw (caller decides).
   * @param {string} name
   * @param {boolean} ok
   * @param {string} [detail]
   */
  assert(name, ok, detail = '') {
    if (ok) {
      this.pass(name);
      return true;
    }
    this.fail(name, detail || 'condition false');
    return false;
  }

  summary() {
    const passed = this.results.filter((r) => r.status === 'PASSED').length;
    const failed = this.results.filter((r) => r.status === 'FAILED').length;
    const line = '='.repeat(52);
    console.log(`\n${line}`);
    console.log('  CHECKPOINT SUMMARY');
    console.log(line);
    for (const r of this.results) {
      console.log(`  [${r.status}] ${r.name}`);
    }
    console.log(line);
    console.log(`  Total: ${this.results.length}  PASSED: ${passed}  FAILED: ${failed}`);
    console.log(`${line}\n`);
    return { passed, failed, total: this.results.length };
  }
}

module.exports = new Checkpoint();
