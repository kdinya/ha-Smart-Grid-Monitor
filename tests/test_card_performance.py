import os
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CARD = ROOT / "grid-monitor-card.js"

PRELUDE = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  document: { hidden: false, addEventListener() {}, removeEventListener() {} },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const Editor = registry.get('grid-monitor-card-editor');
const makeCard = (states = {}, config = { prefix: 'grid_monitor' }) => {
  const card = Object.create(Card.prototype);
  card._config = config;
  card._entityOverrides = {};
  card._hass = { states };
  card._inView = true;
  return card;
};
const state = (value, extra = {}) => ({ state: value, attributes: {}, ...extra });
"""


def run_node(body):
    result = subprocess.run(
        ["node", "-e", PRELUDE + body, str(CARD)],
        capture_output=True,
        text=True,
        check=False,
        env={**os.environ, "TZ": "UTC"},
    )
    return result


class PeriodPickerStylingTests(unittest.TestCase):
    def test_period_panel_stacks_above_chart_and_spans_card_width_on_narrow_layouts(self):
        card = CARD.read_text(encoding="utf-8")
        self.assertIn(".card>*{position:relative;z-index:1}", card)
        self.assertIn(".chart-card>.chart-head{z-index:20}", card)
        self.assertIn(".chart-date-range{flex:1 1 auto;min-width:0;position:static}", card)
        self.assertIn(".chart-date-range-panel{position:absolute;top:calc(100% + 6px);left:0;right:0;", card)


class PowerSavingModeTests(unittest.TestCase):
    def test_power_saving_mode_is_opt_in_and_removes_continuous_effects(self):
        card = CARD.read_text(encoding="utf-8")
        self.assertIn("${this._ecoClass()}", card)
        self.assertEqual(card.count("${this._ecoClass()}"), 2)
        self.assertIn(".shell.eco *,.shell.eco *::before,.shell.eco *::after{animation:none!important;filter:none!important;backdrop-filter:none!important", card)
        self.assertIn(".shell.eco .gauge-fill-glow,.shell.eco .tower-halo,.shell.eco .tower-haze,.shell.eco .chart-glow{display:none}", card)
        self.assertIn('id="chk_performance"', card)
        result = run_node(r"""
const off = makeCard();
assert.equal(off._ecoClass(), '');
off._config = { prefix: 'grid_monitor', performance: false };
assert.equal(off._ecoClass(), '');
off._config = { prefix: 'grid_monitor', performance: true };
assert.equal(off._ecoClass(), ' eco');
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


class StateSnapshotTests(unittest.TestCase):
    def test_snapshot_reuses_unchanged_entries_and_reports_only_real_changes(self):
        result = run_node(r"""
const voltage = state('230', { attributes: { unit_of_measurement: 'V' }, last_updated: 't1' });
const card = makeCard({ 'sensor.grid_monitor_voltage': voltage });
const first = card._captureStateSnapshot();
assert.equal(first.voltage.state, '230');

// Same object references: entries are reused as they are, nothing is reported.
const second = card._captureStateSnapshot(first);
assert.strictEqual(second.voltage, first.voltage);
assert.equal(card._diffStateSnapshots(first, second).size, 0);

// New object, identical values and only a bumped last_reported: no UI update is needed.
card._hass = { states: { 'sensor.grid_monitor_voltage': { ...voltage, last_reported: 't2' } } };
const third = card._captureStateSnapshot(second);
assert.notStrictEqual(third.voltage, second.voltage);
assert.equal(card._diffStateSnapshots(second, third).size, 0);

// New state value is reported for that key only.
card._hass = { states: { 'sensor.grid_monitor_voltage': state('231', { attributes: { unit_of_measurement: 'V' }, last_updated: 't3' }) } };
const fourth = card._captureStateSnapshot(third);
assert.deepEqual([...card._diffStateSnapshots(third, fourth)], ['voltage']);

// Timestamp-driven keys react to last_updated even when the value is the same.
card._hass = { states: { 'sensor.grid_monitor_voltage': state('231', { attributes: { unit_of_measurement: 'V' }, last_updated: 't4' }) } };
const fifth = card._captureStateSnapshot(fourth);
assert.deepEqual([...card._diffStateSnapshots(fourth, fifth)], ['voltage']);

// An entity that disappears is a change.
card._hass = { states: {} };
const sixth = card._captureStateSnapshot(fifth);
assert.deepEqual([...card._diffStateSnapshots(fifth, sixth)], ['voltage']);
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_entity_resolution_keeps_aliases_overrides_and_follows_config_changes(self):
        result = run_node(r"""
const card = makeCard({
  'sensor.x_voltage': state('unavailable'),
  'sensor.x_grid_voltage': state('231'),
}, { prefix: 'x' });
assert.equal(card._entity('voltage'), 'sensor.x_grid_voltage');
card._hass = { states: { 'sensor.x_voltage': state('230'), 'sensor.x_grid_voltage': state('231') } };
assert.equal(card._entity('voltage'), 'sensor.x_voltage');
assert.equal(card._entity('no_such_key'), '');

// An explicit, non-default override always wins.
card._config = { prefix: 'x', entities: { voltage: 'sensor.custom_v' } };
card._entityOverrides = { voltage: 'sensor.custom_v' };
assert.equal(card._entity('voltage'), 'sensor.custom_v');

// A new config object is not served from the previous config's cache.
card._config = { prefix: 'y' };
card._entityOverrides = {};
assert.equal(card._entity('voltage'), 'sensor.y_voltage');
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


class BackgroundPauseTests(unittest.TestCase):
    def test_hass_updates_are_deferred_while_hidden_and_applied_on_resume(self):
        result = run_node(r"""
const card = makeCard();
card._hasRendered = true;
let applied = 0;
card._applyHass = function () { applied += 1; this._hassDirty = false; };

context.document.hidden = true;
const hidden = { states: { a: state('1') } };
card.hass = hidden;
assert.equal(applied, 0, 'no work while the page is hidden');
assert.equal(card._hassDirty, true);
assert.strictEqual(card._hass, hidden, 'latest hass is still kept for service calls');

context.document.hidden = false;
card._resumeUpdates();
assert.equal(applied, 1);
assert.equal(card._hassDirty, false);

card._inView = false;
card.hass = { states: {} };
assert.equal(applied, 1, 'no work while scrolled out of view');
card._inView = true;
card.hass = { states: {} };
assert.equal(applied, 2);
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_history_and_statistics_requests_are_not_sent_while_hidden(self):
        result = run_node(r"""
const card = makeCard();
card._activeTab = 'params';
card._statsStart = Date.now() - 3600e3;
let history = 0;
let stats = 0;
let voltage = 0;
card._loadHistory = () => { history += 1; };
card._loadVoltageHistory = () => { voltage += 1; };
card._loadStatsExtremes = () => { stats += 1; };
card._historyWindowToken = () => '';
card._historyKey = '';
card._voltageHistoryKey = '';
card._statsExtremesKey = '';

context.document.hidden = true;
card._ensureHistory();
card._ensureStatsExtremes();
assert.deepEqual([history, voltage, stats], [0, 0, 0]);

context.document.hidden = false;
card._ensureHistory();
card._ensureStatsExtremes();
assert.equal(history, 1);
assert.equal(stats, 1);
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


class IncrementalStatisticsTests(unittest.TestCase):
    def test_statistics_start_refresh_reads_only_new_history_and_merges_extremes(self):
        result = run_node(r"""
const statsStart = Date.parse('2026-11-01T00:00:00Z');
const card = makeCard();
card._statsStart = statsStart;
card._statsExtremes = null;
card._statsExtremesKey = '';
card._statsExtremesAt = 0;
card._statsExtremesCursor = NaN;
card._statsExtremesRequest = 0;
let applied = 0;
card._applyStatsExtremes = () => { applied += 1; };

const paths = [];
const reply = (rows) => (path) => {
  paths.push(path);
  const ids = decodeURIComponent(path.split('filter_entity_id=')[1].split('&')[0]).split(',');
  return Promise.resolve(ids.map((id, index) => [{ entity_id: id, state: String(rows[index][0]), last_changed: '2026-11-02T00:00:00Z' }, { state: String(rows[index][1]), last_changed: '2026-11-02T01:00:00Z' }]));
};

(async () => {
  // order: voltage, current, power, frequency, power_factor
  card._hass.callApi = (method, path) => reply([[230, 240], [2, 5], [400, 1200], [49.9, 50.1], [0.9, 0.95]])(path);
  const token = card._statsExtremesCacheToken();
  await card._loadStatsExtremes(token);
  assert.equal(card._statsExtremes.voltage.min, 230);
  assert.equal(card._statsExtremes.voltage.max, 240);
  assert.equal(card._statsExtremesKey, token);
  assert.ok(Number.isFinite(card._statsExtremesCursor));
  const firstStart = Date.parse(decodeURIComponent(paths[0].split('history/period/')[1].split('?')[0]));
  assert.equal(firstStart, statsStart, 'first load reads from the statistics start');

  // Refresh: new data only, merged with what is already known.
  const cursor = card._statsExtremesCursor;
  card._hass.callApi = (method, path) => reply([[250, 225], [1, 3], [300, 900], [50.0, 50.2], [0.92, 0.97]])(path);
  await card._loadStatsExtremes(token);
  const secondStart = Date.parse(decodeURIComponent(paths[1].split('history/period/')[1].split('?')[0]));
  assert.ok(secondStart > statsStart, 'refresh does not re-read everything since the start');
  assert.equal(secondStart, cursor - 120e3, 'refresh starts at the previous cursor with a small overlap');
  assert.equal(card._statsExtremes.voltage.min, 225);
  assert.equal(card._statsExtremes.voltage.max, 250);
  assert.equal(card._statsExtremes.power.max, 1200);
  assert.equal(card._statsExtremes.power.min, 300);
  assert.equal(card._statsExtremes.current.min, 1);
  assert.equal(card._statsExtremes.current.max, 5);

  // A failed refresh keeps what is already known.
  card._hass.callApi = () => Promise.reject(new Error('offline'));
  await card._loadStatsExtremes(token);
  assert.equal(card._statsExtremes.voltage.min, 225);
  assert.ok(Number.isFinite(card._statsExtremesCursor));

  // Changing the statistics start (cursor reset) forces a full read again.
  card._statsExtremes = null;
  card._statsExtremesCursor = NaN;
  card._statsExtremesKey = '';
  card._hass.callApi = (method, path) => reply([[231, 232], [1, 2], [100, 200], [50, 50], [0.9, 0.9]])(path);
  await card._loadStatsExtremes(card._statsExtremesCacheToken());
  const lastStart = Date.parse(decodeURIComponent(paths[paths.length - 1].split('history/period/')[1].split('?')[0]));
  assert.equal(lastStart, statsStart);
  assert.equal(card._statsExtremes.voltage.max, 232);

  // A failed first load clears the extremes and retries from the start next time.
  card._statsExtremes = null;
  card._statsExtremesCursor = NaN;
  card._statsExtremesKey = '';
  card._hass.callApi = () => Promise.reject(new Error('offline'));
  await card._loadStatsExtremes(card._statsExtremesCacheToken());
  assert.equal(JSON.stringify(card._statsExtremes), '{}');
  assert.ok(Number.isNaN(card._statsExtremesCursor));
})().catch((error) => { console.error(error); process.exit(1); });
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_merge_handles_missing_and_null_extremes(self):
        result = run_node(r"""
const card = makeCard();
const merged = card._mergeStatsExtremes(
  { voltage: { min: 220, max: 240 }, current: { min: null, max: null } },
  { voltage: { min: null, max: 250 }, current: { min: 1, max: 2 }, power: { min: 5, max: 9 } },
);
assert.deepEqual(JSON.parse(JSON.stringify(merged)), {
  voltage: { min: 220, max: 250 },
  current: { min: 1, max: 2 },
  power: { min: 5, max: 9 },
});
assert.deepEqual(JSON.parse(JSON.stringify(card._mergeStatsExtremes(null, null))), {});
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


if __name__ == "__main__":
    unittest.main()
