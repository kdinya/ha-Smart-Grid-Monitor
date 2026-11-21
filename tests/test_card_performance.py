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
    def test_period_panel_uses_top_layer_and_remains_sized_for_narrow_layouts(self):
        card = CARD.read_text(encoding="utf-8")
        self.assertIn(".card>*{position:relative;z-index:1}", card)
        self.assertIn(".chart-card>.chart-head{position:relative;z-index:20}", card)
        self.assertIn('popover="auto"', card)
        self.assertIn("panel.showPopover()", card)
        self.assertIn(":popover-open", card)
        self.assertIn(".chart-date-range-panel{position:fixed;inset:auto;", card)
        self.assertIn("z-index:2147483647", card)
        self.assertIn(".chart-date-range{flex:1 1 auto;min-width:0;position:relative}", card)


class NavigationClickTests(unittest.TestCase):
    def test_energy_and_settings_tabs_route_on_the_first_click(self):
        result = run_node(r"""
for (const [from, to] of [['params', 'energy'], ['energy', 'settings'], ['settings', 'energy'], ['energy', 'home']]) {
  const card = makeCard();
  card._activeTab = from;
  const view = { innerHTML: '' };
  const shell = { classList: { toggle() {} } };
  card.shadowRoot = {
    querySelector(selector) { return selector === '.shell' ? shell : selector === '.view' ? view : null; },
    querySelectorAll() { return []; },
  };
  card._closeChartDateRangePopover = () => {};
  card._clearChartScrub = () => {};
  card._activeContent = () => `content:${card._activeTab}`;
  card._queueChartMeasure = () => {};
  card._ensureHistory = () => {};
  card._ensureEnergyHistory = () => {};
  let rendered = '';
  card._render = () => { rendered = card._activeTab; };
  const button = {
    dataset: { tab: to },
    closest(selector) { return selector.includes('[data-tab]') ? this : null; },
  };
  card._handleCardClick({ target: button });
  assert.equal(card._activeTab, to, `${from} -> ${to} activates on one click`);
  if (from === 'home' || to === 'home') assert.equal(rendered, to);
  else assert.equal(view.innerHTML, `content:${to}`);
}
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_scroll_to_top_hides_when_its_fixed_rect_overlaps_a_visible_tab(self):
        result = run_node(r"""
let open = false;
let tabRect = { left: 300, right: 360, top: 710, bottom: 754, width: 60, height: 44 };
const button = {
  matches() { return open; },
  showPopover() { open = true; },
  hidePopover() { open = false; },
  getBoundingClientRect() { return { left: 300, right: 354, top: 710, bottom: 764, width: 54, height: 54 }; },
};
const tab = { getBoundingClientRect() { return tabRect; } };
const card = makeCard();
card.shadowRoot = { querySelector: () => button, querySelectorAll: () => [tab] };
card._scrollTop = () => 500;
card._updateScrollTopVisibility();
assert.equal(open, false, 'the scroll button must not cover a visible navigation tab');
tabRect = { left: 10, right: 90, top: 300, bottom: 344, width: 80, height: 44 };
card._updateScrollTopVisibility();
assert.equal(open, true, 'the scroll button remains available when the menu is clear');
tabRect = { left: 300, right: 360, top: 710, bottom: 754, width: 60, height: 44 };
card._updateScrollTopVisibility();
assert.equal(open, false, 'the scroll button hides if scrolling moves a tab beneath it');
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_date_range_popover_is_shifted_below_overlapping_visible_tabs(self):
        result = run_node(r"""
context.window.innerWidth = 390;
context.window.innerHeight = 800;
const tab = { getBoundingClientRect: () => ({ left: 0, right: 390, top: 40, bottom: 100, width: 390, height: 60 }) };
const card = makeCard();
card.shadowRoot = { querySelectorAll: () => [tab] };
const trigger = {
  getBoundingClientRect: () => ({ left: 140, right: 240, top: 12, bottom: 20 }),
  setAttribute() {},
};
const panel = {
  hidden: true,
  style: {},
  showPopover() {},
  getBoundingClientRect: () => ({ width: 380, height: 160 }),
};
card._positionChartDateRangePopover(trigger, panel);
assert.equal(panel.style.top, '108px', 'place the panel after the visible tab row');
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


class CurrencyDisplayTests(unittest.TestCase):
    def test_currency_choice_changes_labels_without_numeric_conversion(self):
        result = run_node(r"""
const cost = state('123.45', { attributes: { unit_of_measurement: 'UAH' } });
const dayTariff = state('0.22', { attributes: { unit_of_measurement: 'UAH/kWh', min: 0, max: 10, step: 0.01 } });
const states = {
  'sensor.grid_monitor_cost_today': cost,
  'number.grid_monitor_tariff_day': dayTariff,
};
const card = makeCard(states, { prefix: 'grid_monitor', language: 'uk', currency: 'EUR' });
const eur = card._formatted('cost_today', 2);
assert.equal(card._unit('cost_today'), 'EUR');
assert.equal(card._unit('cost_rate'), 'EUR/год');
assert.equal(card._unit('tariff'), 'EUR/кВт·год');
assert.equal(card._formatted('cost_today', 2), '123,45 EUR');
assert.equal(card._formatted('tariff_day', 2), '0,22 EUR/кВт·год');
assert.match(card._setting('tariff_day', 'Day tariff'), /грн\/кВт·год/);
card._config.currency = 'USD';
const usd = card._formatted('cost_today', 2);
assert.equal(usd, '123,45 USD');
assert.equal(eur.replace(' EUR', ''), usd.replace(' USD', ''));
card._config.currency = 'UAH';
assert.equal(card._formatted('cost_today', 2), '123,45 грн');
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
    def test_statistics_start_round_trips_through_home_assistant_input_text(self):
        result = run_node(r"""
const card = makeCard({ 'input_text.grid_monitor_statistics_start': state('2026-11-21T13:15:00.000Z') });
assert.equal(card._readStatsStart(), Date.parse('2026-11-21T13:15:00.000Z'));
let saved = null;
card._hass.callService = async (domain, service, data) => { saved = { domain, service, data }; };
(async () => {
  assert.equal(await card._writeStatsStart(Date.parse('2026-11-21T14:20:00.000Z')), true);
  assert.equal(saved.domain, 'input_text');
  assert.equal(saved.service, 'set_value');
  assert.equal(saved.data.entity_id, 'input_text.grid_monitor_statistics_start');
  assert.equal(saved.data.value, '2026-11-21T14:20:00.000Z');
  assert.equal(await card._writeStatsStart(null), true);
  assert.equal(saved.data.value, '');
})();
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_missing_statistics_helper_can_be_created_from_settings_by_admin(self):
        result = run_node(r"""
const card = makeCard({}, { prefix: 'grid_monitor', language: 'en' });
const markup = card._statsStartSetting();
assert.match(markup, /data-stats-helper-create/);
assert.match(markup, /Create helper/);
const existing = makeCard({ 'input_text.grid_monitor_statistics_start': state('') }, { prefix: 'grid_monitor', language: 'en' });
assert.equal(existing._canCreateStatsStartHelper(), false);
assert.doesNotMatch(existing._statsStartSetting(), /data-stats-helper-create/);
let request = null;
const dialogs = [];
card._hass.callWS = async (message) => { request = message; return { id: 'grid_monitor_statistics_start' }; };
card._showDialog = async (options) => { dialogs.push(options); return true; };
(async () => {
  assert.equal(await card._createStatsStartHelper(), true);
  assert.equal(request.type, 'input_text/create');
  assert.equal(request.name, 'Grid Monitor Statistics Start');
  assert.equal(request.min, 0);
  assert.equal(request.max, 32);
  assert.equal(request.icon, 'mdi:calendar-clock');
  assert.equal(dialogs[0].confirm, true, 'helper creation requires an explicit confirmation');
  assert.equal(card._canCreateStatsStartHelper(), false, 'a duplicate create button is hidden after success');
})().catch((error) => { console.error(error); process.exit(1); });
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_statistics_helper_creation_reports_admin_permission_errors(self):
        result = run_node(r"""
const card = makeCard({}, { prefix: 'grid_monitor', language: 'en' });
const dialogs = [];
card._hass.callWS = async () => { throw new Error('Admin required'); };
card._showDialog = async (options) => { dialogs.push(options); return true; };
(async () => {
  assert.equal(await card._createStatsStartHelper(), false);
  assert.equal(dialogs.length, 2, 'show confirm and a failure explanation, but no success dialog');
  assert.match(dialogs[1].message, /administrator/);
  assert.equal(card._canCreateStatsStartHelper(), true, 'retry stays available after a permission error');
})().catch((error) => { console.error(error); process.exit(1); });
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_statistics_helper_create_button_click_is_delegated(self):
        result = run_node(r"""
const card = makeCard();
card._closeChartDateRangePopover = () => {};
let calls = 0;
card._createStatsStartHelper = () => { calls += 1; };
const button = {
  dataset: { statsHelperCreate: '' },
  closest(selector) {
    if (selector === '.chart-date-range') return null;
    return selector.includes('[data-stats-helper-create]') ? this : null;
  },
};
card._handleCardClick({ target: button });
assert.equal(calls, 1);
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_statistics_helper_remains_canonical_for_custom_prefix_and_allows_override(self):
        result = run_node(r"""
const canonical = 'input_text.grid_monitor_statistics_start';
const savedAt = '2026-11-21T13:15:00.000Z';
const card = makeCard({ [canonical]: state(savedAt) }, { prefix: 'custom_esp' });
card._render = () => {};
card._scheduleHeartbeatExpiry = () => {};
card.setConfig({ prefix: 'custom_esp' });
assert.equal(card._config.entities.stats_start, canonical);
assert.equal(card._entity('stats_start'), canonical);
assert.equal(card._statsStart, Date.parse(savedAt), 'setConfig reloads the persisted helper after a card refresh');
let saved = null;
card._hass.callService = async (domain, service, data) => { saved = { domain, service, data }; };

const overrideId = 'input_text.house_statistics_start';
const overridden = makeCard({ [overrideId]: state('2026-11-20T10:00:00.000Z') }, { prefix: 'custom_esp' });
overridden._render = () => {};
overridden._scheduleHeartbeatExpiry = () => {};
overridden.setConfig({ prefix: 'custom_esp', entities: { stats_start: overrideId } });
assert.equal(overridden._config.entities.stats_start, overrideId);
assert.equal(overridden._entity('stats_start'), overrideId, 'an explicit helper override is not replaced by the canonical default');
assert.equal(overridden._statsStart, Date.parse('2026-11-20T10:00:00.000Z'));

(async () => {
  await card._writeStatsStart(Date.parse('2026-11-21T14:20:00.000Z'));
  assert.equal(saved.domain, 'input_text');
  assert.equal(saved.service, 'set_value');
  assert.equal(saved.data.entity_id, canonical, 'writes use the same canonical helper that reloads');
})().catch((error) => { console.error(error); process.exit(1); });
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_recorder_history_cleanup_targets_only_card_entities_and_requires_confirmation(self):
        result = run_node(r"""
const states = {
  'sensor.grid_monitor_voltage': state('230'),
  'sensor.grid_monitor_power': state('110'),
  'binary_sensor.grid_monitor_pzem_online': state('on'),
  'input_text.grid_monitor_statistics_start': state(''),
  'sensor.unrelated_temperature': state('22'),
};
const card = makeCard(states, { prefix: 'grid_monitor', language: 'en' });
const dialogs = [];
let request = null;
card._showDialog = async (options) => { dialogs.push(options); return true; };
card._hass.callService = async (domain, service, data) => { request = { domain, service, data }; };
(async () => {
  assert.deepEqual(JSON.parse(JSON.stringify(card._panelHistoryEntityIds())), [
    'binary_sensor.grid_monitor_pzem_online',
    'sensor.grid_monitor_power',
    'sensor.grid_monitor_voltage',
  ]);
  assert.equal(await card._deletePanelHistory('recorder'), true);
  assert.equal(dialogs[0].confirm, true);
  assert.match(dialogs[0].message, /3 entities/);
  assert.equal(request.domain, 'recorder');
  assert.equal(request.service, 'purge_entities');
  assert.deepEqual(JSON.parse(JSON.stringify(request.data)), {
    entity_id: ['binary_sensor.grid_monitor_pzem_online', 'sensor.grid_monitor_power', 'sensor.grid_monitor_voltage'],
    keep_days: 0,
  });
  assert.equal(Boolean(dialogs[1].confirm), false);
})().catch((error) => { console.error(error); process.exit(1); });
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_statistics_cleanup_uses_only_sensor_statistic_ids_and_reports_permission_failure(self):
        result = run_node(r"""
const states = {
  'sensor.grid_monitor_voltage': state('230'),
  'sensor.grid_monitor_power': state('110'),
  'binary_sensor.grid_monitor_pzem_online': state('on'),
  'sensor.unrelated_temperature': state('22'),
};
const card = makeCard(states, { prefix: 'grid_monitor', language: 'en' });
const dialogs = [];
let request = null;
card._showDialog = async (options) => { dialogs.push(options); return true; };
card._hass.callWS = async (message) => { request = message; };
(async () => {
  assert.equal(await card._deletePanelHistory('statistics'), true);
  assert.equal(dialogs[0].confirm, true);
  assert.match(dialogs[0].message, /2 sensors/);
  assert.deepEqual(JSON.parse(JSON.stringify(request)), {
    type: 'recorder/clear_statistics',
    statistic_ids: ['sensor.grid_monitor_power', 'sensor.grid_monitor_voltage'],
  });
  assert.equal(Boolean(dialogs[1].confirm), false);

  const denied = makeCard(states, { prefix: 'grid_monitor', language: 'en' });
  const deniedDialogs = [];
  denied._showDialog = async (options) => { deniedDialogs.push(options); return true; };
  denied._hass.callWS = async () => { throw new Error('Admin required'); };
  assert.equal(await denied._deletePanelHistory('statistics'), false);
  assert.equal(deniedDialogs.length, 2);
  assert.match(deniedDialogs[1].message, /administrator/);
})().catch((error) => { console.error(error); process.exit(1); });
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_history_cleanup_cancel_does_not_call_home_assistant(self):
        result = run_node(r"""
const card = makeCard({ 'sensor.grid_monitor_voltage': state('230') });
let calls = 0;
card._showDialog = async () => false;
card._hass.callService = async () => { calls += 1; };
(async () => {
  assert.equal(await card._deletePanelHistory('recorder'), false);
  assert.equal(calls, 0, 'canceling the confirmation never calls Recorder');
})().catch((error) => { console.error(error); process.exit(1); });
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_history_cleanup_buttons_use_delegated_click_handling(self):
        result = run_node(r"""
const card = makeCard();
card._closeChartDateRangePopover = () => {};
let kind = '';
card._deletePanelHistory = (value) => { kind = value; };
const button = {
  dataset: { historyDelete: 'statistics' },
  closest(selector) {
    if (selector === '.chart-date-range') return null;
    return selector.includes('[data-history-delete]') ? this : null;
  },
};
card._handleCardClick({ target: button });
assert.equal(kind, 'statistics');
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_changing_statistics_start_clears_energy_history_and_reloads_active_charts(self):
        result = run_node(r"""
const card = makeCard();
card._activeTab = 'energy';
card._historyRange = 'day';
card._historyRequest = 0;
card._historyLoading = false;
card._voltageHistoryRequest = 0;
card._voltageHistoryLoading = false;
card._statsStart = Date.parse('2026-11-20T00:00:00Z');
card._statsExtremesRequest = 0;
card._energyHistoryRequests = { energy_total: 3, cost_total: 7 };
card._energyHistoryLoading = { energy_total: true, cost_total: true };
card._energyHistory = { energy_total: [{ value: 99 }], cost_total: [{ value: 50 }] };
card._energyHistoryKeys = { energy_total: 'old-energy', cost_total: 'old-cost' };
card._energyHistoryAt = { energy_total: 1, cost_total: 1 };
card._energySelectedBar = { metricKey: 'energy_total', start: 1 };
card._clearChartScrub = () => {};
card._updateStatsControls = () => {};
card._applyStatsExtremes = () => {};
card._ensureStatsExtremes = () => {};
card._ensureHistory = () => {};
let refreshed = 0;
let loaded = 0;
card._refreshEnergyCharts = () => { refreshed += 1; };
card._ensureEnergyHistory = () => { loaded += 1; };
card._entity = (key) => `sensor.${key}`;
const oldKey = card._energyHistoryCacheKey('energy_total');

card._setStatsStart(Date.parse('2026-11-21T00:00:00Z'), false);
assert.notEqual(card._energyHistoryCacheKey('energy_total'), oldKey, 'the cache identity includes the statistics start');
assert.deepEqual(card._energyHistoryRequests, { energy_total: 4, cost_total: 8 });
assert.deepEqual(card._energyHistoryLoading, { energy_total: false, cost_total: false });
assert.equal(JSON.stringify(card._energyHistory), JSON.stringify({ energy_total: [], cost_total: [] }));
assert.deepEqual(card._energyHistoryKeys, { energy_total: '', cost_total: '' });
assert.deepEqual(card._energyHistoryAt, { energy_total: 0, cost_total: 0 });
assert.equal(card._energySelectedBar, null);
assert.equal(refreshed, 1);
assert.equal(loaded, 1);
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

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
