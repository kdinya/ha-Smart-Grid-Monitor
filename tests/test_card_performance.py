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


class PeriodPickerDialogTests(unittest.TestCase):
    def test_period_picker_is_a_modal_on_the_shadow_root_not_an_inline_panel(self):
        card = CARD.read_text(encoding="utf-8")
        self.assertNotIn("chart-date-range-panel", card)
        self.assertNotIn("<details class=\"chart-date-range", card)
        self.assertIn("data-chart-date-open", card)
        self.assertIn("this.shadowRoot.append(root);", card)
        self.assertIn("root.className = 'app-dialog-backdrop';", card)
        self.assertIn(".app-dialog-backdrop{position:fixed;inset:0;z-index:99999;", card)
        self.assertIn("[data-chart-date-open], [data-chart-date-close], [data-chart-date-apply]", card)
        self.assertIn("event.target?.matches?.('[data-chart-date-root]')", card)

    def test_open_button_replaces_details_and_stays_next_to_the_period_buttons(self):
        result = run_node(r"""
const card = makeCard();
card._historyRange = 'month';
card._historyBounds = () => ({ start: 0, end: 0 });
const html = card._chartDateRangeHtml();
assert.ok(html.includes('data-chart-date-open'));
assert.ok(html.includes('class="chart-date-range '));
assert.ok(!html.includes('<details'));
assert.ok(!html.includes('data-chart-date-start'), 'inputs live in the dialog only');
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


class LayoutAndIndicatorTests(unittest.TestCase):
    def test_online_indicator_is_static_on_every_tab(self):
        card = CARD.read_text(encoding="utf-8")
        self.assertNotIn("ledPulse", card)
        self.assertNotIn(".device-status.online i{animation", card)
        self.assertIn(".dot{display:inline-block;width:12px;height:12px;background:var(--green)", card)

    def test_content_below_the_menu_is_lifted_30px_on_non_home_tabs(self):
        card = CARD.read_text(encoding="utf-8")
        self.assertIn(".shell:not(.home-active)>.page-layout{margin-top:-30px}", card)
        self.assertIn(".shell:not(.home-active)>.header{z-index:2}", card)


class EnergyChartTests(unittest.TestCase):
    def test_energy_tab_has_kwh_and_uah_chart_with_the_same_controls_as_parameters(self):
        result = run_node(r"""
const card = makeCard({
  'sensor.grid_monitor_energy_today': state('3.5', { attributes: { unit_of_measurement: 'kWh' } }),
  'sensor.grid_monitor_cost_today': state('12.4', { attributes: { unit_of_measurement: 'UAH' } }),
});
card._historyBounds = () => ({ start: Date.now() - 3600e3, end: Date.now() });
card._activeTab = 'energy';
const html = card._energy();
assert.ok(html.includes('class="card chart-card detailed-chart"'), 'chart is on the energy tab');
assert.ok(html.includes('data-metric="energy_today"') && html.includes('data-metric="cost_today"'));
assert.ok(!html.includes('data-metric="power"') && !html.includes('data-metric="voltage"'));
['hour', 'day', 'week', 'month'].forEach((period) => assert.ok(html.includes(`data-period="${period}"`)));
assert.ok(html.includes('data-chart-date-open') && html.includes('data-role="chart-scrubber"') && html.includes('data-role="chart-stats"'));
assert.ok(html.includes('Енергія, кВт·год') && html.includes('Вартість, грн'));
assert.equal(card._chartMetric, 'energy_today');
// Readings for a selected time are energy related on this tab.
assert.ok(html.includes('data-chart-reading="energy_today"') && html.includes('data-chart-reading="cost_today"') && html.includes('data-chart-reading="tariff"'));
assert.ok(!html.includes('data-chart-reading="power_factor"'));

card._activeTab = 'params';
const params = card._params();
assert.ok(params.includes('data-metric="power"') && params.includes('data-metric="voltage"'));
assert.ok(!params.includes('data-metric="energy_today"'));
assert.equal(card._chartMetric, 'power', 'switching tabs falls back to a metric of that tab');
assert.ok(params.includes('data-chart-reading="power_factor"'));
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_history_is_requested_for_the_selected_energy_entity(self):
        result = run_node(r"""
const card = makeCard({ 'sensor.grid_monitor_energy_today': state('1') });
card._activeTab = 'energy';
card._chartMetric = 'power';
const keys = [];
card._loadHistory = (key) => { keys.push(key); };
card._ensureHistory();
assert.equal(card._chartMetric, 'energy_today');
assert.equal(keys.length, 1);
assert.ok(keys[0].endsWith(':energy_today:sensor.grid_monitor_energy_today'), keys[0]);
card._chartMetric = 'cost_today';
card._ensureHistory();
assert.ok(keys[keys.length - 1].endsWith(':cost_today:sensor.grid_monitor_cost_today'));
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_axis_for_small_decimal_quantities_uses_round_steps(self):
        result = run_node(r"""
const card = makeCard();
const check = (max, step, count) => {
  const scale = card._niceScaleFine(max);
  assert.equal(scale.step, step, `step for ${max}`);
  assert.equal(scale.count, count, `count for ${max}`);
  assert.ok(scale.max >= max, `axis covers ${max}`);
};
check(3.5, 1, 4);
check(12.4, 5, 3);
check(0.8, 0.25, 4);
check(180, 50, 4);
check(0, 0.025, 4);
card._chartMetric = 'cost_today';
assert.equal(card._chartScale([{ v: 12.4 }, { v: 0 }]).lo, 0);
card._chartMetric = 'power';
assert.equal(card._chartScale([{ v: 400 }, { v: 0 }]).max, 600);
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


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
