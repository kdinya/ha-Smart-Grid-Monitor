import os
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ChartHistoryTests(unittest.TestCase):
    def test_history_buckets_preserve_spikes_and_skip_unavailable_intervals(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._history = [
  { time: new Date(0), value: 100 },
  { time: new Date(40), value: 300 },
  { time: new Date(50), value: null },
  { time: new Date(75), value: 200 },
];
const result = card._bucketHistory(0, 100, 2).map(({ t, v }) => ({ t, v }));
assert.equal(JSON.stringify(result), JSON.stringify([
  { t: 0, v: 100 },
  { t: 40, v: 300 },
  { t: 75, v: 200 },
]));
card._history = [
  { time: new Date(0), value: 100 },
  { time: new Date(40), value: 2500 },
  { time: new Date(45), value: 100 },
];
const spikeAndReturn = card._bucketHistory(0, 100, 1).map(({ t, v }) => ({ t, v }));
assert.equal(JSON.stringify(spikeAndReturn), JSON.stringify([
  { t: 0, v: 100 },
  { t: 40, v: 2500 },
  { t: 45, v: 100 },
]));
card._history = [
  { time: new Date(0), value: 0 },
  { time: new Date(10), value: 250 },
  { time: new Date(20), value: 3 },
  { time: new Date(30), value: 0 },
];
const positiveMinimum = card._bucketHistory(0, 100, 1).map(({ t, v }) => ({ t, v }));
assert.equal(JSON.stringify(positiveMinimum), JSON.stringify([
  { t: 0, v: 0 },
  { t: 10, v: 250 },
  { t: 20, v: 3 },
  { t: 30, v: 0 },
]));
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


    def test_stats_start_overrides_min_max_from_history(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._config = {};
card._statsStart = Date.UTC(2026, 10, 21, 13, 0);
const ids = {};
card._entity = (key) => ids[key] || `sensor.${key}`;
const series = [
  [{ entity_id: 'sensor.voltage', state: '230' }, { state: 'unavailable' }, { state: '241.5' }, { state: '9999' }, { state: '218' }],
  [{ entity_id: 'sensor.current', state: '0' }, { state: '3' }, { state: '1.5' }],
  [{ entity_id: 'sensor.power', state: '0' }, { state: '700' }, { state: '120' }],
  [{ entity_id: 'sensor.frequency', state: '49.9' }, { state: '50.2' }],
  [{ entity_id: 'sensor.power_factor', state: '0.9' }, { state: '0.99' }],
];
const result = card._computeStatsExtremes(series);
assert.deepEqual({ ...result.voltage }, { min: 218, max: 241.5 });
assert.deepEqual({ ...result.current }, { min: 1.5, max: 3 });
assert.deepEqual({ ...result.power }, { min: 120, max: 700 });
assert.deepEqual({ ...result.frequency }, { min: 49.9, max: 50.2 });
assert.deepEqual({ ...result.power_factor }, { min: 0.9, max: 0.99 });
assert.equal(JSON.stringify(card._historyBounds('since', 5)).includes(String(card._statsStart)), true);
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_calendar_history_ranges_start_at_local_boundaries(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const now = Date.parse('2026-11-25T12:34:56.789Z');
const expected = {
  hour: '2026-11-25T11:34:56.789Z',
  day: '2026-11-24T22:00:00.000Z',
  week: '2026-11-22T22:00:00.000Z',
  month: '2026-10-31T22:00:00.000Z',
};
for (const [range, start] of Object.entries(expected)) {
  const bounds = card._historyBounds(range, now);
  assert.equal(new Date(bounds.start).toISOString(), start, range);
  assert.equal(bounds.end, now, range);
}
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "Europe/Kyiv"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_power_minimum_ignores_zero_and_does_not_round_positive_to_zero(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._chartMetric = 'power';
card._chartData = () => ({ series: [{ v: 0 }, { v: 250 }, { v: 0.03 }, { v: 0 }] });
card._history = [{ value: 0 }, { value: 250 }, { value: 0.03 }, { value: 0 }];
card._locale = () => 'en-US';
card._lang = () => 'en';
card._t = (key) => ({ stat_min: 'Min.', stat_avg: 'Avg.', stat_max: 'Max.' })[key];
card._escape = (value) => String(value).replaceAll('<', '&lt;');
let html = card._chartStatsHtml();
assert.match(html, /Min\.<\/span><b>&lt;0\.1 W<\/b>/);
card._chartData = () => ({ series: [{ v: 0 }, { v: 0 }] });
card._history = [{ value: 0 }, { value: 0 }];
html = card._chartStatsHtml();
assert.match(html, /Min\.<\/span><b>—<\/b>/);
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_history_ignores_implausible_power_samples(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._config = { entities: {} };
card._historyRange = 'hour';
card._historyRequest = 0;
card._historyLoading = false;
card._entity = () => 'sensor.grid_monitor_power';
card._refreshChart = () => {};
card._hass = { callApi: async () => [[
  { state: '250', last_changed: '2026-11-21T10:00:00Z' },
  { state: '75000000', last_changed: '2026-11-21T10:01:00Z' },
  { state: '-5', last_changed: '2026-11-21T10:02:00Z' },
  { state: '30000', last_changed: '2026-11-21T10:03:00Z' },
  { state: 'unavailable', last_changed: '2026-11-21T10:04:00Z' },
]] };
(async () => {
  await card._loadHistory('k');
  assert.deepEqual(card._history.map((h) => h.value), [250, null, null, 30000, null]);
})().catch((error) => { console.error(error); process.exit(1); });
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


    def test_selected_time_loads_all_readings_from_states_not_after_selection(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const timestamp = Date.parse('2026-11-21T10:00:00.000Z');
const keys = ['current', 'power', 'apparent_power', 'phase_angle', 'reactive_power', 'power_factor'];
const ids = Object.fromEntries(keys.map((key) => [key, `sensor.grid_monitor_${key}`]));
const states = Object.fromEntries(Object.values(ids).map((id) => [id, { state: '1' }]));
const values = ['1.23', '142.6', '150.2', '18.2', '49.1', '0.95'];
const groups = keys.map((key, index) => [{
  entity_id: ids[key], state: values[index], last_updated: new Date(timestamp - 2000).toISOString(),
}]);
groups[0].push({ entity_id: ids.current, state: '9.99', last_updated: new Date(timestamp + 1000).toISOString() });
let requestedPath = '';
card._config = { prefix: 'grid_monitor' };
card._entityOverrides = {};
card._entity = (key) => ids[key];
card._hass = { states, callApi: async (method, path) => { requestedPath = `${method} ${path}`; return groups; } };
card._scrubTime = timestamp;
card._chartReadings = {};
card._chartReadingsAt = null;
card._chartReadingsLoading = false;
card._chartReadingsError = false;
card._chartReadingsRequest = 0;
card._chartReadingsQueuedTime = null;
card._updateChartReadings = () => {};
(async () => {
  await card._loadChartReadings(timestamp);
  assert.match(requestedPath, /^GET history\/period\//);
  assert.match(requestedPath, /filter_entity_id=/);
  assert.equal(card._chartReadings.current, 1.23);
  assert.equal(card._chartReadings.power, 142.6);
  assert.equal(card._chartReadings.apparent_power, 150.2);
  assert.equal(card._chartReadings.phase_angle, 18.2);
  assert.equal(card._chartReadings.reactive_power, 49.1);
  assert.equal(card._chartReadings.power_factor, 0.95);
  assert.equal(card._chartReadingsAt, timestamp);
  assert.equal(card._chartReadingsLoading, false);
})().catch((error) => { console.error(error); process.exit(1); });
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_live_marker_uses_voltage_value_scale_and_unit(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const chart = {
  dataset: { chartMin: '200', chartMax: '250', chartY0: '20', chartY1: '220', chartX1: '900' },
  querySelector: () => null,
};
let marker;
card._scrubTime = null;
card._chartPts = [];
card._chartMetric = 'voltage';
card.shadowRoot = { querySelector: () => chart };
card._num = (key) => { assert.equal(key, 'voltage'); return 230; };
card._lang = () => 'en';
card._locale = () => 'en-US';
card._setChartMarker = (_chart, x, y, text) => { marker = { x, y, text }; };
card._updateChartCurrent();
assert.equal(marker.x, 900);
assert.equal(marker.y, 100);
assert.equal(marker.text, '230 V');
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_chart_pan_and_zoom_preserve_exact_custom_date_windows(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._historyRange = 'hour';
card._historyCustomRange = null;
const now = Date.now() - 1000;
const live = card._historyBounds('hour', now);
const span = live.end - live.start;
const olderShift = card._chartPanShiftForDelta(80, span, 320);
assert.equal(olderShift, span / 4);
card._historyRange = 'custom';
card._historyCustomRange = { start: live.start - olderShift, end: live.end - olderShift };
const older = card._historyBounds();
assert.equal(older.end - older.start, span);
assert.equal(older.end, live.end - olderShift);
assert.ok(older.end < live.end, 'dragging right browses older data');
assert.ok(card._chartPanShiftForDelta(-80, span, 320) < 0, 'dragging left browses newer data');
assert.match(card._historyWindowToken(), /:custom:/);
let zoomed;
card._chartTimeBounds = () => ({ tStart: now - 3600000, tEnd: now, rangeMs: 3600000 });
card._setCustomChartRange = (start, end) => { zoomed = { start, end }; };
card._zoomChart('in');
assert.equal(zoomed.end - zoomed.start, 1800000, 'zoom-in halves the visible time window');
assert.ok(zoomed.end <= Date.now(), 'zoom window does not extend into the future');
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_chart_minimum_and_maximum_include_local_time_or_date(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._chartMetric = 'voltage';
card._historyRange = 'day';
card._history = [{ value: 210 }, { value: 240 }];
card._locale = () => 'en-GB';
card._lang = () => 'en';
card._t = (key) => ({ stat_min: 'Min', stat_avg: 'Avg', stat_max: 'Max' })[key];
card._escape = (value) => String(value).replaceAll('<', '&lt;');
card._chartData = () => ({ series: [
  { v: 210, t: Date.parse('2026-11-21T10:05:00Z') },
  { v: 240, t: Date.parse('2026-11-21T12:35:00Z') },
] });
let html = card._chartStatsHtml();
assert.match(html, /Min<\/span><b>210 V<\/b><small>10:05<\/small>/);
assert.match(html, /Max<\/span><b>240 V<\/b><small>12:35<\/small>/);
card._historyRange = 'month';
html = card._chartStatsHtml();
assert.match(html, /Min<\/span><b>210 V<\/b><small>21\/11\/2026<\/small>/);
assert.match(html, /Max<\/span><b>240 V<\/b><small>21\/11\/2026<\/small>/);
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)



    def test_stats_start_strictly_bounds_chart_and_extremes(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);

// 1. When statsStart is set, all history bounds cannot precede statsStart
const statsStart = Date.parse('2026-11-21T10:00:00Z');
const now = Date.parse('2026-11-21T16:00:00Z');
card._statsStart = statsStart;
card._historyCustomRange = null;

// Day range would normally start at midnight 2026-11-21 00:00:00Z
const dayBounds = card._historyBounds('day', now);
assert.equal(dayBounds.start, statsStart, 'day bound cannot be earlier than statsStart');

// Month range would start at 1st of month
const monthBounds = card._historyBounds('month', now);
assert.equal(monthBounds.start, statsStart, 'month bound cannot be earlier than statsStart');

// Custom range earlier than statsStart is clamped
card._historyCustomRange = { start: statsStart - 7200000, end: now };
const customBounds = card._historyBounds('custom', now);
assert.equal(customBounds.start, statsStart, 'custom range cannot start before statsStart');

// 2. Pan and Zoom cannot navigate before statsStart
const panTarget = card._chartPanTarget({
  pointerType: 'mouse',
  rangeMs: 3600000,
  deltaX: 500, // dragging far right to see earlier data
  plotWidth: 300,
  tStart: statsStart + 1800000,
  tEnd: statsStart + 5400000,
});
assert.ok(panTarget.start >= statsStart, 'pan target cannot precede statsStart');

let customSet = null;
card._setCustomChartRange = (s, e) => { customSet = { s, e }; };
card._chartTimeBounds = () => ({ tStart: statsStart, tEnd: statsStart + 3600000, rangeMs: 3600000 });
card._zoomChart('out');
assert.ok(customSet.s >= statsStart, 'zoom-out cannot expand before statsStart');

// 3. parseHistoryResponse clamps / excludes items before statsStart
const rawResponse = [[
  { last_changed: '2026-11-21T08:00:00Z', state: '220' }, // ended before statsStart
  { last_changed: '2026-11-21T09:30:00Z', state: '215' }, // active across statsStart
  { last_changed: '2026-11-21T11:00:00Z', state: '235' }, // after statsStart
]];
const parsed = card._parseHistoryResponse(rawResponse, 'voltage');
assert.equal(parsed.length, 2, 'state that ended before statsStart is dropped');
assert.equal(parsed[0].time.getTime(), statsStart, 'earlier active state is clamped to statsStart');
assert.equal(parsed[0].value, 215);
assert.equal(parsed[1].value, 235);

// 4. _computeStatsExtremes ignores states that ended before statsStart
const metricSeries = [
  [
    { entity_id: 'sensor.voltage', last_changed: '2026-11-21T07:00:00Z', state: '190' }, // ended before statsStart - was lowest
    { entity_id: 'sensor.voltage', last_changed: '2026-11-21T09:00:00Z', state: '260' }, // ended before statsStart - was highest
    { entity_id: 'sensor.voltage', last_changed: '2026-11-21T09:45:00Z', state: '225' }, // active at statsStart
    { entity_id: 'sensor.voltage', last_changed: '2026-11-21T12:00:00Z', state: '230' },
  ],
];
card._entity = (key) => `sensor.${key}`;
const extremes = card._computeStatsExtremes(metricSeries);
assert.equal(extremes.voltage.min, 225, '190V before statsStart is ignored');
assert.equal(extremes.voltage.max, 230, '260V before statsStart is ignored');

// 5. _chartStatsHtml ignores points before statsStart
card._chartMetric = 'voltage';
card._historyRange = 'day';
card._history = [{ time: new Date(statsStart - 3600000), value: 180 }, { time: new Date(statsStart + 3600000), value: 230 }];
card._locale = () => 'en-GB';
card._lang = () => 'en';
card._t = (key) => ({ stat_min: 'Min', stat_avg: 'Avg', stat_max: 'Max' })[key];
card._escape = (v) => String(v);
card._formatChartStatTimestamp = () => '12:00';
card._chartData = () => ({ series: [
  { v: 180, t: statsStart - 3600000 },
  { v: 230, t: statsStart + 3600000 },
] });
const html = card._chartStatsHtml();
assert.ok(!html.includes('180'), 'min before statsStart is not shown');
assert.ok(html.includes('230'), 'sample after statsStart is shown');

// 6. Ensure statsStart timestamp is not displayed outside settings
assert.equal(card._statsNote(), '', 'stats note on home tab is empty');
card._t = (key) => ({ chart_title: 'Chart', since: 'Period', hour: 'Hour', day: 'Day', week: 'Week', month: 'Month' })[key] || key;
card._svg = () => '';
card._chartDateRangeHtml = () => '';
card._chartStatsHtml = () => '';
card._chartSvg = () => '';
card._chartScrubberHtml = () => '';
card._chartReadingsHtml = () => '';
const chartHtml = card._chart();
assert.ok(!chartHtml.includes('10:00'), 'chart period button does not show start time');
assert.ok(!chartHtml.includes('data-period="since"'), 'chart does not display period button next to month');
assert.ok(!chartHtml.includes('Period'), 'chart does not display Period button outside settings');
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


    def test_cumulative_energy_and_cost_history_tracks_deltas_and_counter_resets(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._state = () => ({ attributes: { unit_of_measurement: 'kWh' } });
const start = Date.parse('2026-10-01T00:00:00Z');
const end = Date.parse('2026-10-01T00:50:00Z');
const response = [[
  { state: '10', last_changed: '2026-09-30T23:59:00Z' },
  { state: '12', last_changed: '2026-10-01T00:10:00Z' },
  { state: '15', last_changed: '2026-10-01T00:20:00Z' },
  { state: '2', last_changed: '2026-10-01T00:30:00Z' },
  { state: '5', last_changed: '2026-10-01T00:40:00Z' },
]];
for (const metric of ['energy_total', 'cost_total']) {
  const history = card._parseCumulativeHistory(response, metric, { start, end }, 999);
  assert.equal(JSON.stringify(history.map(({ value }) => value)), JSON.stringify([0, 2, 5, 7, 10, 10]));
  assert.equal(JSON.stringify(history.map(({ time }) => time.getTime())), JSON.stringify([
    start, Date.parse('2026-10-01T00:10:00Z'), Date.parse('2026-10-01T00:20:00Z'),
    Date.parse('2026-10-01T00:30:00Z'), Date.parse('2026-10-01T00:40:00Z'), end,
  ]));
}

// A live counter must not be appended to a custom range that ended in the past.
const past = card._parseCumulativeHistory(response, 'energy_total', { start, end }, 5000);
assert.equal(past.at(-1).value, 10);

// A live delta replaces the endpoint even if history already has a sample at `end`.
const liveEnd = Date.now();
const liveStart = liveEnd - 20 * 60e3;
const liveResponse = [[
  { state: '100', last_changed: new Date(liveStart - 60e3).toISOString() },
  { state: '102', last_changed: new Date(liveEnd).toISOString() },
]];
card._state = () => ({ last_changed: new Date(liveEnd).toISOString(), attributes: { unit_of_measurement: 'kWh' } });
const live = card._parseCumulativeHistory(liveResponse, 'energy_total', { start: liveStart, end: liveEnd }, 103);
assert.equal(live.at(-1).time.getTime(), liveEnd);
assert.equal(live.at(-1).value, 3);

// A recent custom range must not consume a state updated after its end boundary.
const recentPastEnd = Date.now() - 30e3;
const recentPastStart = recentPastEnd - 20 * 60e3;
card._state = () => ({ last_changed: new Date(recentPastEnd + 30e3).toISOString(), attributes: { unit_of_measurement: 'kWh' } });
const recentPast = card._parseCumulativeHistory([[
  { state: '100', last_changed: new Date(recentPastStart - 60e3).toISOString() },
  { state: '102', last_changed: new Date(recentPastEnd).toISOString() },
]], 'energy_total', { start: recentPastStart, end: recentPastEnd }, 103);
assert.equal(recentPast.at(-1).value, 2);

// Bucketing retains the terminal cumulative value instead of dropping its zero-duration endpoint.
card._chartW = 280;
const chartData = card._chartData([
  { time: new Date(liveStart), value: 0 },
  { time: new Date(liveStart + 10 * 60e3), value: 2 },
  { time: new Date(liveEnd), value: 3 },
], 'energy_total', { bounds: { start: liveStart, end: liveEnd }, range: 'hour', includeCurrent: false });
assert.equal(chartData.series.at(-1).t, liveEnd);
assert.equal(chartData.series.at(-1).v, 3);
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


    def test_energy_interval_bars_use_deltas_not_cumulative_counter_levels(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._locale = () => 'en-US';
card._state = () => ({ attributes: { unit_of_measurement: 'kWh' } });
const start = Date.parse('2026-10-01T00:00:00Z');
const end = Date.parse('2026-10-03T00:00:00Z');

// The absolute counter is about 3 million, but the two daily increases are only 100 and 300.
const response = [[
  { state: '2998500', last_changed: new Date(start - 30 * 60e3).toISOString() },
  { state: '2998600', last_changed: new Date(start + 12 * 3600e3).toISOString() },
  { state: '2998600', last_changed: new Date(start + 24 * 3600e3).toISOString() },
  { state: '2998900', last_changed: new Date(start + 36 * 3600e3).toISOString() },
  { state: '2998900', last_changed: new Date(end).toISOString() },
]];
const history = card._parseCumulativeHistory(response, 'energy_total', { start, end }, NaN);
const daily = card._energyHistoryBars(history, { start, end }, 'week');
assert.equal(JSON.stringify(daily.map(({ value }) => Math.round(value))), JSON.stringify([100, 300]));
assert.equal(Math.round(daily.reduce((sum, bar) => sum + bar.value, 0)), 400);
assert.ok(daily.every((bar) => bar.value < 1000), 'the cumulative 2,998,900 counter is never plotted as an interval amount');

// A sparse counter update spanning hour boundaries is apportioned by elapsed overlap.
const shortEnd = start + 3 * 3600e3;
const hourly = card._energyHistoryBars([
  { time: new Date(start), value: 0 },
  { time: new Date(start + 3600e3), value: 4 },
  { time: new Date(start + 2 * 3600e3), value: 8 },
  { time: new Date(shortEnd), value: 10 },
], { start, end: shortEnd }, 'day');
assert.equal(JSON.stringify(hourly.map(({ value }) => Math.round(value))), JSON.stringify([4, 4, 2]));
assert.equal(hourly.reduce((sum, bar) => sum + bar.value, 0), 10);
const sparse = card._energyHistoryBars([
  { time: new Date(start), value: 0 }, { time: new Date(shortEnd), value: 3 },
], { start, end: shortEnd }, 'day');
assert.equal(JSON.stringify(sparse.map(({ value }) => Math.round(value))), JSON.stringify([1, 1, 1]), 'a sparse increase is apportioned across its elapsed span');
const customStart = Date.parse('2026-10-01T10:30:00Z');
const customEnd = Date.parse('2026-10-01T13:15:00Z');
const customHours = card._energyHistoryBars([
  { time: new Date(customStart), value: 0 }, { time: new Date(customEnd), value: 1 },
], { start: customStart, end: customEnd }, 'custom');
assert.equal(customHours.length, 4, 'a custom range shorter than a day includes each intersected local hour');

// Resets are already represented as monotonic increments by the cumulative-history parser.
const resetEnd = start + 50 * 60e3;
const resetHistory = card._parseCumulativeHistory([[
  { state: '10', last_changed: new Date(start - 60e3).toISOString() },
  { state: '12', last_changed: new Date(start + 10 * 60e3).toISOString() },
  { state: '15', last_changed: new Date(start + 20 * 60e3).toISOString() },
  { state: '2', last_changed: new Date(start + 30 * 60e3).toISOString() },
  { state: '5', last_changed: new Date(start + 40 * 60e3).toISOString() },
]], 'energy_total', { start, end: resetEnd }, NaN);
const resetBars = card._energyHistoryBars(resetHistory, { start, end: resetEnd }, 'day');
assert.equal(Math.round(resetBars.reduce((sum, bar) => sum + bar.value, 0)), 10);
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


    def test_energy_bars_follow_calendar_hours_days_and_dst(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._locale = () => 'en-GB';
const hours = (start, end) => card._energyHistoryBars([
  { time: new Date(start), value: 0 }, { time: new Date(end), value: 0 },
], { start, end }, 'day');
const localStart = new Date(2026, 10, 21, 0, 0, 0, 0).getTime();
const localNoon = new Date(2026, 10, 21, 12, 15, 0, 0).getTime();
assert.equal(hours(localStart, localNoon).length, 13, 'today includes each clock hour and its current partial hour');
const hourPreset = card._energyHistoryBars([
  { time: new Date(localStart), value: 0 }, { time: new Date(localStart + 3600e3), value: 1 },
], { start: localStart, end: localStart + 3600e3 }, 'hour');
assert.equal(hourPreset.length, 1, 'the rolling one-hour preset is represented by one bar');

const firstDay = new Date(2026, 9, 1, 0, 0, 0, 0).getTime();
const thirdDay = new Date(2026, 9, 3, 0, 0, 0, 0).getTime();
const daily = card._energyHistoryBars([
  { time: new Date(firstDay), value: 0 }, { time: new Date(thirdDay), value: 0 },
], { start: firstDay, end: thirdDay }, 'month');
assert.equal(daily.length, 2, 'month view uses one bar per local date');

const springStart = new Date(2026, 2, 29, 0, 0, 0, 0).getTime();
const springEnd = new Date(2026, 2, 30, 0, 0, 0, 0).getTime();
assert.equal(hours(springStart, springEnd).length, 23, 'spring DST day has 23 local-hour bars');
const autumnStart = new Date(2026, 9, 25, 0, 0, 0, 0).getTime();
const autumnEnd = new Date(2026, 9, 26, 0, 0, 0, 0).getTime();
const autumn = hours(autumnStart, autumnEnd);
assert.equal(autumn.length, 25, 'autumn DST day has 25 local-hour bars');
const repeatedHours = autumn.filter(({ label }) => label.startsWith('03'));
assert.equal(repeatedHours.length, 2, 'the repeated autumn hour has two bars');
assert.notEqual(repeatedHours[0].label, repeatedHours[1].label, 'the repeated hours have distinct local labels');
assert.match(repeatedHours[0].fullLabel, /03:00 UTC\+03–03:00 UTC\+02/, 'the first repeated-hour tooltip records both offsets');
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "Europe/Kyiv"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


    def test_energy_history_normalizes_wh_to_kwh_for_chart_display(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const start = Date.parse('2026-10-01T00:00:00Z');
card._state = () => ({ attributes: { unit_of_measurement: 'Wh' } });
const history = card._parseCumulativeHistory([[
  { state: '100000', last_changed: new Date(start - 60e3).toISOString() },
  { state: '103000', last_changed: new Date(start + 60e3).toISOString() },
]], 'energy_total', { start, end: start + 60e3 }, NaN);
assert.equal(history.at(-1).value, 3, '3,000 Wh must be represented as 3 kWh on the chart');
assert.equal(card._energyHistoryUnitFactor('cost_total'), 1, 'cost values remain unchanged');
card._state = () => ({ attributes: { unit_of_measurement: 'kWh' } });
assert.equal(card._energyHistoryUnitFactor('energy_total'), 1, 'kWh values stay in kWh');
card._state = () => ({ attributes: { unit_of_measurement: 'MWh' } });
assert.equal(card._energyHistoryUnitFactor('energy_total'), 1000, 'MWh values are converted to kWh');
card._state = () => ({ attributes: { unit_of_measurement: 'MJ' } });
assert.equal(card._energyHistoryUnitFactor('energy_total'), null, 'unsupported units are rejected');
assert.equal(JSON.stringify(card._parseCumulativeHistory([], 'energy_total', { start, end: start + 60e3 }, 10)), '[]', 'unsupported units do not produce chart data');
card._state = () => ({ attributes: {} });
assert.equal(card._energyHistoryUnitFactor('energy_total'), null, 'a missing unit is not silently assumed to be kWh');
card._escape = String;
card._t = (key) => key === 'energy_unit_unsupported' ? 'Unsupported energy unit' : key;
assert.match(card._energyBarSvg('energy_total', [], false), /Unsupported energy unit/);
assert.match(card._chartStatsHtml('energy_total', [], 'energy'), /Unsupported energy unit/);
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


    def test_energy_period_is_independent_but_statistics_start_clips_energy_and_cost(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._historyRange = 'month';
card._historyCustomRange = null;
card._statsStart = Date.parse('2026-10-01T00:15:00Z');
card._energyHistoryRange = 'day';
card._energyCustomRange = null;
card._entity = (key) => `sensor.${key}`;
card._state = () => ({ attributes: { unit_of_measurement: 'kWh' } });
card._updateChartDateRangeControls = () => {};
card._closeChartDateRangePopover = () => {};
card._clearEnergyHistory = () => {};
card._refreshEnergyCharts = () => {};
card._ensureEnergyHistory = () => {};
const customStart = Date.parse('2026-09-20T00:00:00Z');
const customEnd = Date.parse('2026-10-02T00:00:00Z');
card._setCustomChartRange(customStart, customEnd, 'energy');
assert.equal(card._energyHistoryRange, 'custom');
assert.equal(JSON.stringify(card._energyHistoryBounds()), JSON.stringify({ start: card._statsStart, end: customEnd }));
assert.equal(card._historyRange, 'month');
assert.equal(card._historyCustomRange, null);

// Preset and custom Energy windows cannot include data before the configured start.
const now = Date.parse('2026-10-01T00:45:00Z');
for (const range of ['hour', 'day', 'week', 'month']) {
  const bounds = card._energyHistoryBounds(range, now);
  assert.equal(bounds.start, card._statsStart, `${range} starts at the statistics start when it falls inside the period`);
  assert.equal(bounds.end, now);
}
const beforeStats = Date.parse('2026-09-30T23:00:00Z');
const middle = Date.parse('2026-10-01T00:30:00Z');
const afterStats = Date.parse('2026-10-01T01:00:00Z');
card._energyHistoryRange = 'custom';
card._energyCustomRange = { start: beforeStats, end: afterStats };
const bounds = card._energyHistoryBounds();
assert.equal(bounds.start, card._statsStart);
assert.equal(bounds.end, afterStats);
card._energyCustomRange = { start: beforeStats, end: Date.parse('2026-10-01T00:10:00Z') };
const emptyBounds = card._energyHistoryBounds();
assert.equal(emptyBounds.start, card._statsStart);
assert.equal(emptyBounds.end, card._statsStart, 'a custom range ending before the start is empty, not earlier data');
card._energyCustomRange = { start: beforeStats, end: afterStats };

card._state = () => ({ attributes: { unit_of_measurement: 'kWh' } });
card._locale = () => 'en-US';
card._lang = () => 'en';
card._currencyCode = () => 'UAH';
card._t = (key) => ({ stat_min: 'Min', stat_avg: 'Avg', stat_max: 'Max', energy_max_hour: 'Max per hour', energy_max_day: 'Max per day' })[key] || key;
card._escape = (value) => String(value);
card._formatChartStatTimestamp = () => 'time';
const energy = card._parseCumulativeHistory([[
  { state: '2998000', last_changed: '2026-09-30T22:00:00Z' },
  { state: '2998600', last_changed: '2026-09-30T23:30:00Z' },
  { state: '2998602', last_changed: '2026-10-01T00:30:00Z' },
  { state: '2998606', last_changed: '2026-10-01T01:00:00Z' },
]], 'energy_total', bounds, NaN);
assert.equal(JSON.stringify(energy.map(({ value }) => value)), JSON.stringify([0, 2, 6]));
const energyBars = card._energyHistoryBars(energy, bounds, 'custom');
assert.equal(energyBars.length, 1);
assert.equal(energyBars[0].value, 6, 'pre-start counter growth is excluded while post-start increments are retained');
const energyHtml = card._chartStatsHtml('energy_total', energy, 'energy');
assert.match(energyHtml, /Min<\/span><b>6 kWh<\/b>/);
assert.match(energyHtml, /Avg<\/span><b>6 kWh<\/b>/);
assert.match(energyHtml, /Max per hour<\/span><b>6 kWh<\/b>/);
assert.doesNotMatch(energyHtml, /2,998,606/);

const cost = card._parseCumulativeHistory([[
  { state: '50000', last_changed: '2026-09-30T22:00:00Z' },
  { state: '51000', last_changed: '2026-09-30T23:30:00Z' },
  { state: '51025', last_changed: '2026-10-01T00:30:00Z' },
  { state: '51075', last_changed: '2026-10-01T01:00:00Z' },
]], 'cost_total', bounds, NaN);
const costBars = card._energyHistoryBars(cost, bounds, 'custom');
assert.equal(costBars[0].value, 75, 'cost history also includes only increments after the statistics start');
assert.match(card._chartStatsHtml('cost_total', cost, 'energy'), /75 UAH/);
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_energy_max_stat_is_the_largest_hour_or_day_bucket_not_period_total(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._state = () => ({ attributes: { unit_of_measurement: 'kWh' } });
card._locale = () => 'en-US';
card._lang = () => 'en';
card._currencyCode = () => 'UAH';
card._t = (key) => ({ stat_min: 'Min', stat_avg: 'Avg', energy_max_hour: 'Max per hour', energy_max_day: 'Max per day' })[key] || key;
card._escape = String;
card._formatChartStatTimestamp = () => 'time';
card._energyCustomRange = null;

const start = Date.parse('2026-11-21T00:00:00Z');
const hourlyHistory = [
  { time: new Date(start), value: 0 },
  { time: new Date(start + 3600e3), value: 1.2 },
  { time: new Date(start + 2 * 3600e3), value: 2.96 },
];
card._energyHistoryRange = 'day';
card._energyHistoryBounds = () => ({ start, end: start + 2 * 3600e3 });
const hourlyBars = card._energyHistoryBars(hourlyHistory, card._energyHistoryBounds(), 'day');
assert.equal(hourlyBars.reduce((sum, bar) => sum + bar.value, 0), 2.96);
assert.equal(Math.max(...hourlyBars.map((bar) => bar.value)), 1.76);
const hourlyStats = card._chartStatsHtml('energy_total', hourlyHistory, 'energy');
assert.match(hourlyStats, /Max per hour<\/span><b>1\.76 kWh<\/b>/);

const dayEnd = start + 2 * 24 * 3600e3;
const dailyHistory = [
  { time: new Date(start), value: 0 },
  { time: new Date(start + 24 * 3600e3), value: 1.2 },
  { time: new Date(dayEnd), value: 2.96 },
];
card._energyHistoryRange = 'week';
card._energyHistoryBounds = () => ({ start, end: dayEnd });
const dailyStats = card._chartStatsHtml('energy_total', dailyHistory, 'energy');
assert.match(dailyStats, /Max per day<\/span><b>1\.76 kWh<\/b>/);
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_metric_info_buttons_render_on_requested_tiles_and_open_explanation(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const text = {
  power: 'Потужність', current: 'Струм', frequency: 'Частота', pf: 'Коеф. потужності',
  apparent: 'Повна потужність', reactive: 'Реактивна потужність', phase: 'Кут фази',
  metric_info_button: 'Пояснення показника', info_reactive_power: 'Reactive power explanation',
};
card._t = (key) => text[key] || key;
card._escape = String;
card._num = () => 12.5;
card._formatted = () => '12,5';
card._unit = () => 'W';
card._locale = () => 'uk-UA';
card._svg = () => '';

for (const key of ['power', 'current', 'frequency', 'power_factor']) {
  const html = card._heroMetric(key, key, 1);
  assert.match(html, new RegExp(`data-metric-info="${key}"`));
  assert.match(html, /aria-label="Пояснення показника:/);
}
for (const [key, label] of [
  ['apparent_power', 'Повна потужність'],
  ['reactive_power', 'Реактивна потужність'],
  ['phase_angle', 'Кут фази'],
]) {
  const html = card._detail(key, label, 1);
  assert.match(html, new RegExp(`data-metric-info="${key}"`));
  assert.match(html, /class="detail metric-info-card"/);
}
assert.doesNotMatch(card._detail('voltage_deviation', 'Відхилення напруги', 1), /data-metric-info/);

let opened;
card._showDialog = (options) => { opened = options; };
const clicked = {
  dataset: { metricInfo: 'reactive_power' },
  closest(selector) {
    if (selector === '[data-dialog-action]') return null;
    if (selector === '[data-metric-info]') return this;
    return null;
  },
};
card._handleCardClick({ target: clicked });
assert.equal(JSON.stringify(opened), JSON.stringify({
  title: 'Реактивна потужність',
  message: 'Reactive power explanation',
  info: true,
}));
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_energy_tab_renders_one_chart_with_energy_cost_toggle(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._energyChartMetric = 'energy_total';
card._energyHistoryRange = 'day';
card._energyHistory = { energy_total: [], cost_total: [] };
card._energyHistoryLoading = { energy_total: false, cost_total: false };
card._raw = () => 'off';
card._t = (key) => key;
card._escape = String;
card._formatted = () => '0';
card._svg = () => '';
card._energyCoinArt = () => '';
card._plugArt = () => '';
card._detail = () => '';
card._tariffBars = () => '';
card._chartDateRangeHtml = () => '';
card._chartStatsHtml = () => '';
card._energyBarSvg = () => '';
const html = card._energy();
assert.equal((html.match(/class="card chart-card energy-history-card"/g) || []).length, 1);
assert.equal((html.match(/data-energy-plot="/g) || []).length, 1);
assert.match(html, /data-energy-metric="energy_total"[^>]*aria-pressed="true"/);
assert.match(html, /data-energy-metric="cost_total"[^>]*aria-pressed="false"/);
assert.match(html, /data-energy-plot="energy_total"/);

let selector = '';
const plot = { dataset: {}, innerHTML: '' };
const stats = { dataset: {}, innerHTML: '' };
const title = { textContent: '' };
const metricButtons = ['energy_total', 'cost_total'].map((metric) => ({
  dataset: { energyMetric: metric },
  active: false,
  attributes: {},
  classList: { toggle: (_name, active) => { metricButtons.find((button) => button.dataset.energyMetric === metric).active = active; } },
  setAttribute: (name, value) => { metricButtons.find((button) => button.dataset.energyMetric === metric).attributes[name] = value; },
}));
card.shadowRoot = {
  querySelector: (query) => ({ '[data-energy-plot]': plot, '[data-energy-stats]': stats, '[data-energy-chart-title]': title })[query],
  querySelectorAll: () => metricButtons,
};
card._energyBarSvg = (metric) => `svg-${metric}`;
card._chartStatsHtml = (metric) => `stats-${metric}`;
card._closeChartDateRangePopover = () => {};
const button = { dataset: { energyMetric: 'cost_total' } };
card._handleCardClick({ target: { closest: (query) => {
  if (query === '.chart-date-range' || query === '[data-dialog-action]' || query === '[data-metric-info]') return null;
  selector = query;
  return button;
} } });
assert.match(selector, /\[data-energy-metric\]/);
assert.equal(card._energyChartMetric, 'cost_total');
assert.equal(plot.dataset.energyPlot, 'cost_total');
assert.equal(plot.innerHTML, 'svg-cost_total');
assert.equal(stats.dataset.energyStats, 'cost_total');
assert.equal(stats.innerHTML, 'stats-cost_total');
assert.equal(title.textContent, 'cost_chart_title');
assert.equal(metricButtons[0].attributes['aria-pressed'], 'false');
assert.equal(metricButtons[1].attributes['aria-pressed'], 'true');
assert.equal(metricButtons[0].active, false);
assert.equal(metricButtons[1].active, true);
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_energy_renderer_outputs_interval_bars_without_line_series(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const start = Date.parse('2026-10-01T00:00:00Z');
card._energyHistoryRange = 'day';
card._energyHistoryBounds = () => ({ start, end: start + 3 * 3600e3 });
card._chartW = 480;
card._locale = () => 'en-US';
card._lang = () => 'en';
card._currencyCode = () => 'UAH';
card._state = () => ({ attributes: { unit_of_measurement: 'kWh' } });
card._t = () => 'Electricity consumption';
card._escape = (value) => String(value);
const svg = card._energyBarSvg('energy_total', [
  { time: new Date(start), value: 0 },
  { time: new Date(start + 3600e3), value: 1.25 },
  { time: new Date(start + 2 * 3600e3), value: 2.5 },
  { time: new Date(start + 3 * 3600e3), value: 4 },
], false);
assert.match(svg, /class="energy-bars" data-energy-bar-count="3"/);
assert.equal((svg.match(/data-energy-bar="/g) || []).length, 3);
assert.match(svg, /role="button" tabindex="0" aria-pressed="false"/);
assert.match(svg, /<title>/, 'each bar includes an accessible tooltip');
assert.doesNotMatch(svg, /class="chart-line"|class="chart-glow"/);
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


    def test_energy_bar_click_and_keyboard_show_selected_interval_and_value(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const bars = [
  { start: 1000, end: 2000, fullLabel: 'October 01, 09:00–10:00', value: 1.25 },
  { start: 2000, end: 3000, fullLabel: 'October 01, 10:00–11:00', value: 42.5 },
];
card._energyChartMetric = 'cost_total';
card._energyHistoryRange = 'day';
card._energyHistory = { energy_total: [], cost_total: [] };
card._energyHistoryLoading = { energy_total: false, cost_total: false };
card._energyHistoryBounds = () => ({ start: 1000, end: 3000 });
card._energyHistoryBars = () => bars;
card._locale = () => 'en-US';
card._lang = () => 'en';
card._currencyCode = () => 'EUR';
card._t = (key) => key === 'energy_selected_interval' ? 'Selected interval' : key;
card._escape = String;
card._energyBarSvg = (metric) => `svg-${metric}`;
card._chartStatsHtml = (metric) => `stats-${metric}`;
card._closeChartDateRangePopover = () => {};
const plot = { dataset: {}, innerHTML: '' };
const selection = { innerHTML: '' };
const stats = { dataset: {}, innerHTML: '' };
const title = { textContent: '' };
let focused = false;
const focusTarget = { focus: () => { focused = true; } };
card.shadowRoot = {
  querySelector: (query) => ({
    '[data-energy-plot]': plot,
    '[data-energy-selection]': selection,
    '[data-energy-stats]': stats,
    '[data-energy-chart-title]': title,
    '[data-energy-bar="0"]': focusTarget,
  })[query],
  querySelectorAll: () => [],
};
const clickTarget = { dataset: { energyBar: '1' }, closest(query) {
  if (query === '.chart-date-range' || query === '[data-dialog-action]' || query === '[data-metric-info]') return null;
  return this;
} };
card._handleCardClick({ target: clickTarget });
assert.deepEqual({ ...card._energySelectedBar }, { metricKey: 'cost_total', start: 2000 });
assert.match(selection.innerHTML, /Selected interval/);
assert.match(selection.innerHTML, /October 01, 10:00–11:00/);
assert.match(selection.innerHTML, /42\.5 EUR/);
assert.equal(plot.innerHTML, 'svg-cost_total');
assert.equal(stats.innerHTML, 'stats-cost_total');

let prevented = false;
card._handleCardKeydown({
  key: 'Enter',
  target: { dataset: { energyBar: '0' }, closest: () => ({ dataset: { energyBar: '0' } }) },
  preventDefault: () => { prevented = true; },
});
assert.equal(prevented, true);
assert.deepEqual({ ...card._energySelectedBar }, { metricKey: 'cost_total', start: 1000 });
assert.match(selection.innerHTML, /October 01, 09:00–10:00/);
assert.match(selection.innerHTML, /1\.25 EUR/);
assert.equal(focused, true, 'keyboard activation keeps focus on the re-rendered selected bar');
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_single_touch_scrubs_chart_and_updates_slider_synchronously(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);

// Setup state and mock DOM
card._chartPointers = new Map();
card._chartPan = null;
card._chartTouchScrubbing = null;
card._scrubTime = null;
card._chartMetric = 'power';
card._lang = () => 'uk';
card._locale = () => 'uk-UA';
card._t = (key) => key;
card._formatChartTimestamp = (t) => String(t);
card._formatChartReading = () => '';
card._queueChartReadings = (t, immediate) => { card._queued = { t, immediate }; };
card._renderChartPoint = (point) => { card._renderedPoint = point; };
card._updateChartReadings = () => {};

const slider = { value: '0', disabled: false };
const label = { textContent: '' };
const live = { disabled: true };
let plot;
const chartSvg = {
  dataset: { chartStart: '1000', chartEnd: '2000', chartW: '1000', chartX0: '100', chartX1: '900', chartY0: '20', chartY1: '200' },
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 220 }),
  querySelector: () => null,
};
plot = {
  captured: [],
  setPointerCapture: (id) => plot.captured.push(id),
  releasePointerCapture: (id) => { plot.captured = plot.captured.filter(x => x !== id); },
  closest: () => plot,
  querySelector: (sel) => (sel === 'svg.chart' ? chartSvg : null),
  classList: { add: () => {}, remove: () => {} },
};
card.shadowRoot = {
  querySelector: (sel) => {
    if (sel === 'svg.chart' || sel === '.chart') return chartSvg;
    if (sel === '[data-role="chart-scrubber"]') return slider;
    if (sel === '[data-role="chart-selected-time"]') return label;
    if (sel === '[data-chart-live]') return live;
    if (sel === '[data-role="chart-plot"]') return plot;
    return null;
  },
};

card._chartPts = [
  { x: 100, y: 100, v: 50, t: 1000 },
  { x: 500, y: 80, v: 200, t: 1500 },
  { x: 900, y: 60, v: 500, t: 2000 },
];

// 1. Single touch pointerdown initiates scrubbing and captures pointer
card._chartPointerDown({
  pointerId: 1,
  pointerType: 'touch',
  clientX: 500,
  clientY: 100,
  target: plot,
});
assert.equal(card._chartTouchScrubbing, 1, 'single touch sets _chartTouchScrubbing');
assert.equal(card._chartPan, null, 'single touch does not start chart pan');
assert.deepEqual(plot.captured, [1], 'pointer capture was requested on plot');
assert.equal(card._scrubTime, 1500, 'scrubs to nearest point at clientX');
assert.equal(slider.value, '500', 'slider synchronously updates to 50%');

// 2. Single touch move updates scrub time and slider position
card._chartScrubAtClientX(900);
assert.equal(card._scrubTime, 2000, 'scrubs to end point');
assert.equal(slider.value, '1000', 'slider synchronously updates to 100%');

// 3. Pointer end releases touch scrub and queues immediate readings load
card._chartPointerEnd({
  pointerId: 1,
  clientX: 900,
  clientY: 100,
});
assert.equal(card._chartTouchScrubbing, null, 'touch scrubbing is cleared on pointer end');
assert.deepEqual(card._queued, { t: 2000, immediate: true }, 'readings load queued immediately on touch release');

// 4. Two touches start pan instead of touch scrub
card._chartPointers = new Map();
card._chartPan = null;
card._chartTouchScrubbing = null;
card._chartPointerDown({ pointerId: 10, pointerType: 'touch', clientX: 300, clientY: 100, target: plot });
assert.equal(card._chartTouchScrubbing, 10, 'first touch initiates scrub');
card._chartPointerDown({ pointerId: 11, pointerType: 'touch', clientX: 700, clientY: 100, target: plot });
assert.equal(card._chartTouchScrubbing, null, 'second touch cancels single touch scrub');
assert.ok(card._chartPan !== null, 'second touch starts 2-finger pan');
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_chart_places_select_period_next_to_month_and_removes_zoom_buttons(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = {
  window: { customCards: [] },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._lang = () => 'uk';
card._t = (key) => {
  const dict = {
    chart_title: 'Детальний графік',
    hour: 'Год',
    day: 'День',
    week: 'Тиждень',
    month: 'Місяць',
    chart_date_range: 'Вибрати період',
    chart_from: 'Від',
    chart_to: 'До',
    chart_apply: 'Показати',
  };
  return dict[key] || key;
};
card._escape = (s) => s;
card._svg = () => '<svg></svg>';
card._historyRange = 'day';
card._chartMetric = 'power';
card._historyBounds = () => ({ start: 1000, end: 2000 });
card._formatDateTimeInput = () => '2026-11-21T18:00';
card._statsStart = null;
card._chartStatsHtml = () => '';
card._chartSvg = () => '';
card._chartScrubberHtml = () => '';
card._chartReadingsHtml = () => '';

const html = card._chart();
assert.ok(!html.includes('data-chart-zoom'), 'chart does not render plus/minus zoom buttons');
assert.ok(!html.includes('chart-zoom-button'), 'chart does not render chart-zoom-button class');
assert.ok(html.includes('data-period="month"'), 'renders month period button');
assert.ok(html.indexOf('data-period="month"') < html.indexOf('chart-date-range'), 'Select period is placed to the right of Month button');
assert.ok(html.includes('Вибрати період'), 'button is renamed to Вибрати період');
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

if __name__ == "__main__":
    unittest.main()
