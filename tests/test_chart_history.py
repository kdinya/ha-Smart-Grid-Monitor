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

    def test_pinch_zoom_and_axis_drag_keep_their_separate_behaviors(self):
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
const center = (live.start + live.end) / 2;
const pinch = {
  pointerType: 'touch', startDistance: 100, currentDistance: 200,
  rangeMs: span, deltaX: 80, plotWidth: 320, tStart: live.start, tEnd: live.end,
};
const pinched = card._chartPanTarget(pinch);
assert.equal(pinched.end - pinched.start, span / 2, 'pinch distance controls zoom');
assert.equal((pinched.start + pinched.end) / 2, center, 'moving the two-finger center does not pan the graph');
const axisPan = card._chartPanTarget({ pointerType: 'axis', startDistance: 1, currentDistance: 1, rangeMs: span, deltaX: 30, plotWidth: 300, tStart: live.start, tEnd: live.end });
assert.equal(axisPan.end - axisPan.start, span, 'dragging the time axis preserves the zoom level');
assert.equal((axisPan.start + axisPan.end) / 2, center - span / 10, 'dragging right moves toward older history');
const oneSecond = card._chartPanTarget({ pointerType: 'axis', rangeMs: 1000, deltaX: -30, plotWidth: 300, tStart: now - 10000, tEnd: now - 9000 });
assert.equal(oneSecond.end - oneSecond.start, 1000, 'time-axis pan preserves one-second zoom');
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
card._history = [
  { time: new Date('2026-11-21T10:05:00Z'), value: 210 },
  { time: new Date('2026-11-21T12:35:00Z'), value: 240 },
];
card._historyBounds = () => ({ start: Date.parse('2026-11-21T00:00:00Z'), end: Date.parse('2026-11-21T23:00:00Z') });
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

    def test_energy_cost_intervals_after_pzem_loss_are_marked_unavailable(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const start = Date.parse('2026-11-21T00:00:00Z');
const end = start + 3 * 3600e3;
const outage = start + 90 * 60e3;
const bounds = { start, end };
card._energyHistoryRange = 'day';
card._energyCustomRange = null;
card._energyHistoryBounds = () => bounds;
card._displayStatus = () => ({ pzemOnline: false, pzemOffline: true, esp: 'on' });
card._state = (key) => key === 'mains' ? { last_changed: new Date(outage).toISOString() } : { attributes: { unit_of_measurement: 'UAH' } };
card._locale = () => 'en-US';
card._lang = () => 'en';
card._currencyCode = () => 'UAH';
card._t = (key) => ({ stat_min: 'Min', stat_avg: 'Avg', stat_max: 'Max', energy_max_hour: 'Max per hour', pzem_offline_banner: 'PZEM offline; source unknown' })[key] || key;
card._escape = String;
card._formatChartStatTimestamp = () => 'time';
const history = [
  { time: new Date(start), value: 0 },
  { time: new Date(start + 3600e3), value: 1 },
  { time: new Date(start + 2 * 3600e3), value: 101 },
  { time: new Date(end), value: 102 },
];
const bars = card._energyHistoryBars(history, bounds, 'day');
assert.equal(bars[0].unavailable, undefined, 'confirmed hours before the outage remain visible');
assert.equal(bars[1].unavailable, true, 'the hour containing the loss of telemetry is not presented as a confirmed total');
assert.equal(bars[2].unavailable, true, 'later hours remain unknown while PZEM is offline');
const stats = card._chartStatsHtml('cost_total', history, 'energy');
assert.match(stats, /1 UAH/);
assert.doesNotMatch(stats, /100 UAH|101 UAH|102 UAH/, 'unconfirmed costs do not inflate the displayed extrema or average');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False, env={**os.environ, "TZ": "UTC"})
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
assert.match(svg, /class="energy-bars" data-chart-scope="energy"[^>]*data-energy-bar-count="3"/);
assert.equal((svg.match(/data-energy-bar="/g) || []).length, 3);
assert.match(svg, /role="button" tabindex="0" aria-pressed="false"/);
assert.match(svg, /<title>/, 'each bar includes an accessible tooltip');
assert.doesNotMatch(svg, /class="chart-line"|class="chart-glow"/);
assert.match(svg, /data-chart-pan-axis="true"/, 'energy graph exposes its time-axis pan zone');
assert.doesNotMatch(svg, /data-chart-zoom-handle/, 'range zoom handles are reserved for Parameters');
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

    def test_single_touch_scrubs_chart_and_axis_drag_starts_history_pan(self):
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
  closest: (selector) => selector === '[data-chart-zoom-handle]' ? null : selector === '[data-role="chart-plot"], [data-energy-plot]' ? plot : selector === '[data-chart-pan-axis]' && plot.axisHit ? plot : null,
  hasAttribute: (name) => name === 'data-energy-plot' && !!plot.energy,
  dataset: {},
  querySelector: (sel) => (sel === 'svg.chart, svg.energy-bars' || sel === 'svg.chart' ? chartSvg : null),
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

// 4. Two touches start pinch zoom, not horizontal panning
card._chartPointers = new Map();
card._chartPan = null;
card._chartTouchScrubbing = null;
let bufferRequests = 0;
card._panEnsureBuffer = () => { bufferRequests += 1; };
card._chartPointerDown({ pointerId: 10, pointerType: 'touch', clientX: 300, clientY: 100, target: plot });
assert.equal(card._chartTouchScrubbing, 10, 'first touch initiates scrub');
card._chartPointerDown({ pointerId: 11, pointerType: 'touch', clientX: 700, clientY: 100, target: plot });
assert.equal(card._chartTouchScrubbing, null, 'second touch cancels single touch scrub');
assert.ok(card._chartPan !== null, 'second touch starts the pinch gesture');
assert.equal(bufferRequests, 0, 'merely placing two fingers does not request older history');
const pinchNow = Date.now();
const unchanged = card._chartPanTarget({ ...card._chartPan, rangeMs: 60000, tStart: pinchNow - 60000, tEnd: pinchNow, deltaX: 90, startDistance: 100, currentDistance: 100 });
assert.equal(unchanged.end - unchanged.start, 60000, 'two-finger translation without a pinch does not change the range');
assert.ok(Math.abs((unchanged.start + unchanged.end) / 2 - (Date.now() - 30000)) < 1000, 'two-finger translation does not pan');
card._chartPan = null;
card._chartPointers = new Map();
card._chartScrubAtClientX = (x) => { card._mouseScrubX = x; };
card._chartPointerDown({ pointerId: 20, pointerType: 'mouse', button: 0, clientX: 400, target: plot, preventDefault() {} });
assert.equal(card._chartPan, null, 'mouse click in the plot does not start chart panning');
assert.equal(card._mouseScrubX, 400, 'mouse click continues to select a chart point');
plot.axisHit = true;
card._chartPointers = new Map();
card._chartPointerPlots = new Map();
card._chartPointerDown({ pointerId: 21, pointerType: 'touch', clientX: 500, clientY: 210, target: plot, preventDefault() {} });
assert.equal(card._chartPan?.pointerType, 'axis', 'one-finger drag on the time-axis zone starts horizontal panning');
assert.equal(card._chartPan?.scope, 'params', 'the time-axis gesture is bound to the parameters chart');
card._chartPan = null;
card._chartPointers = new Map();
plot.energy = true;
card._chartPointerDown({ pointerId: 22, pointerType: 'mouse', button: 0, clientX: 500, clientY: 210, target: plot, preventDefault() {} });
assert.equal(card._chartPan?.pointerType, 'axis', 'mouse drag on the energy time axis starts horizontal panning');
assert.equal(card._chartPan?.scope, 'energy', 'energy gestures use the energy history window');
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_dragged_chart_handles_apply_a_one_second_parameters_range(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const start = 1700000000000;
const end = start + 60000;
card._chartZoomSelectionBounds = () => ({ start, end });
card._chartZoomWindow = { start: start + 10000, end: start + 11000, dirty: true };
let applied;
card._setCustomChartRange = (a, b, scope) => { applied = { start: a, end: b, scope }; };
card._applyChartZoomSelection();
assert.deepEqual(applied, { start: start + 10000, end: start + 11000, scope: 'params' });
assert.equal(applied.end - applied.start, 1000, 'one-second selection is accepted');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False, env={**os.environ, "TZ": "UTC"})
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_zoom_handle_tracks_subsecond_pointer_motion_without_one_second_jumps(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const start = 1700000000000;
const end = start + 60000;
const chart = { dataset: { chartStart: String(start), chartEnd: String(end), chartW: '1000', chartX0: '100', chartX1: '900' } };
const drag = { pointerId: 1, bounds: { start, end }, chart, handle: 'start', rectLeft: 50, rectWidth: 1000, chartWidth: 1000, x0: 100, x1: 900, lastX: null, nodes: {} };
card._chartZoomDrag = drag;
card._chartZoomWindow = { start: start + 30000, end, dirty: false };
card._updateChartZoomSelection = () => {};
card._chartZoomSelectionMove({ pointerId: 1, clientX: 551, preventDefault() {} });
assert.equal(card._chartZoomWindow.start, start + 30075, 'a one-pixel move on a one-minute range should not quantize to a full second');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False, env={**os.environ, "TZ": "UTC"})
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_dragging_chart_handles_maps_to_precise_time_coordinates(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const start = 1700000000000;
const end = start + 60000;
const chart = {
  dataset: { chartStart: String(start), chartEnd: String(end), chartW: '1000', chartX0: '100', chartX1: '900' },
  getBoundingClientRect: () => ({ left: 50, width: 1000 }),
};
const plot = { querySelector: () => chart };
card._chartZoomSelectionBounds = () => ({ start, end });
card._chartZoomWindow = { start, end, dirty: false };
card._chartZoomDrag = {
  plot, chart, handle: 'start', pointerId: 1, bounds: { start, end },
  rectLeft: 50, rectWidth: 1000, chartWidth: 1000, x0: 100, x1: 900,
  frame: null, frameKind: null, lastX: null, nodes: {},
};
card._updateChartZoomSelection = () => {};
card._chartZoomSelectionMove({ pointerId: 1, clientX: 550, preventDefault() {} });
assert.equal(card._chartZoomWindow.start, start + 30000, 'dragged start handle maps to the middle of the time range');
assert.equal(card._chartZoomWindow.end, end, 'moving the start handle leaves the end in place');
assert.equal(card._chartZoomWindow.dirty, true);
card._chartZoomDrag.handle = 'end';
card._chartZoomSelectionMove({ pointerId: 1, clientX: 650, preventDefault() {} });
assert.equal(card._chartZoomWindow.end, start + 37500, 'dragged end handle follows the selected time without whole-second rounding');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False, env={**os.environ, "TZ": "UTC"})
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_zoom_handle_pointer_moves_are_coalesced_and_pointerup_flushes_latest_position(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const scheduled = new Map();
let frameId = 0;
const context = {
  window: {
    customCards: [],
    requestAnimationFrame(callback) { const id = ++frameId; scheduled.set(id, callback); return id; },
    cancelAnimationFrame(id) { scheduled.delete(id); },
  },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const drag = { pointerId: 1, frame: null, frameKind: null, pendingX: 0 };
const applied = [];
card._chartZoomDrag = drag;
card._applyChartZoomSelectionMove = (_drag, x) => applied.push(x);
const move = (x) => ({ pointerId: 1, clientX: x, preventDefault() {} });
card._queueChartZoomSelectionMove(move(10));
card._queueChartZoomSelectionMove(move(20));
assert.equal(scheduled.size, 1, 'only one animation frame is pending');
const [id, callback] = scheduled.entries().next().value;
scheduled.delete(id);
callback();
assert.deepEqual(applied, [20], 'the frame applies only the latest pointer position');
card._queueChartZoomSelectionMove(move(30));
card._chartZoomSelectionMove(move(40));
assert.equal(scheduled.size, 0, 'pointerup cancels the pending frame');
assert.deepEqual(applied, [20, 40], 'pointerup applies its final position immediately');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_time_axis_pan_responds_after_a_small_intentional_drag(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const plot = { isConnected: true };
const pan = { pointerIds: [1], pointerType: 'axis', startX: 100, deltaX: 0, live: false, startDistance: 1, currentDistance: 1 };
card._chartPan = pan;
card._chartPointers = new Map([[1, { x: 102, y: 0 }]]);
let previews = 0;
card._chartPanPreview = () => { previews += 1; };
card._updateChartPanFromPointers(pan, true);
assert.equal(pan.live, true, 'the visible pan strip responds after a small deliberate drag');
assert.equal(previews, 1, 'the preview starts immediately after the activation threshold');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_chart_pan_pointer_moves_are_coalesced_and_commit_only_on_release(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const scheduled = new Map();
let frameId = 0;
const context = {
  window: {
    customCards: [],
    requestAnimationFrame(callback) { const id = ++frameId; scheduled.set(id, callback); return id; },
    cancelAnimationFrame(id) { scheduled.delete(id); },
    setTimeout(callback) { const id = ++frameId; scheduled.set(id, callback); return id; },
    clearTimeout(id) { scheduled.delete(id); },
  },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
let previews = 0;
let commits = 0;
let deferredFlushes = 0;
let historyRequests = 0;
const plot = { releasePointerCapture() {}, classList: { remove() {} } };
const pan = {
  plot, pointerIds: [1], pointerType: 'axis', startX: 100, deltaX: 0,
  startDistance: 1, currentDistance: 1, live: false, frame: null,
  rangeMs: 60000, plotWidth: 300, tStart: 1000, tEnd: 61000,
};
card._chartPan = pan;
card._chartPointers = new Map([[1, { x: 100, y: 0 }]]);
card._chartPointerPlots = new Map([[1, plot]]);
card._chartPanPreview = () => { previews += 1; };
card._panEnsureBuffer = () => { historyRequests += 1; };
card._refreshChart = () => { throw new Error('full chart refresh during drag'); };
card._finishChartPan = () => { commits += 1; card._chartPan = null; };
card._flushDeferredChartUpdates = () => { deferredFlushes += 1; };
const move = (x) => ({ pointerId: 1, clientX: x, clientY: 0, preventDefault() {} });
card._chartPointerMove(move(120));
card._chartPointerMove(move(140));
assert.equal(scheduled.size, 1, 'pointer events are coalesced into one frame');
assert.equal(previews, 0, 'pointer event handlers do no chart work');
assert.equal(historyRequests, 0, 'dragging never fetches or merges history');
const [id, callback] = scheduled.entries().next().value;
scheduled.delete(id);
callback();
assert.equal(previews, 1, 'the frame updates the lightweight transform once');
assert.equal(pan.deltaX, 40, 'the frame uses the latest pointer position');
assert.equal(pan.live, true, 'the movement threshold is applied in the frame');
card._chartPointerMove(move(150));
assert.equal(scheduled.size, 1);
card._chartPointerEnd(move(155));
assert.equal(scheduled.size, 0, 'pointer release cancels any unneeded preview frame');
assert.equal(pan.deltaX, 55, 'release applies the exact final pointer position');
assert.equal(commits, 1, 'range commit happens once on release');
assert.equal(deferredFlushes, 1, 'deferred telemetry and chart updates resume after release');
assert.equal(historyRequests, 0, 'the gesture itself does not request buffer history');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_telemetry_changes_are_coalesced_until_chart_gesture_ends(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const scheduled = [];
const context = {
  window: { customCards: [], requestAnimationFrame(callback) { scheduled.push(callback); return scheduled.length; } },
  HTMLElement: class HTMLElement {},
  customElements: { define: (name, value) => registry.set(name, value) },
};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
let updates = 0;
card._hasRendered = true;
card._pendingChangedKeys = new Set();
card._updateScheduled = false;
card._chartPan = {};
card._chartZoomDrag = null;
card._chartGestureChangedKeys = new Set();
card._updateChanged = (changed) => { updates += 1; assert.deepEqual([...changed].sort(), ['power', 'voltage']); };
card._scheduleStateUpdate(new Set(['power']));
card._scheduleStateUpdate(new Set(['voltage']));
assert.equal(scheduled.length, 1, 'HA state events still share one animation frame');
scheduled.shift()();
assert.equal(updates, 0, 'telemetry DOM updates are skipped during the gesture');
assert.deepEqual([...card._chartGestureChangedKeys].sort(), ['power', 'voltage']);
card._chartPan = null;
card._chartRefreshPending = false;
card._energyChartRefreshPending = false;
card._chartFullRenderPending = false;
card._statsExtremesApplyPending = false;
card._ensureHistory = () => {};
card._ensureEnergyHistory = () => {};
card._ensureStatsExtremes = () => {};
card._flushDeferredChartUpdates();
assert.equal(updates, 1, 'latest telemetry changes are applied once on release');
assert.equal(card._chartGestureChangedKeys.size, 0);
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_chart_rebuilds_are_deferred_during_gesture_and_flushed_once(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
let domQueries = 0;
let svgBuilds = 0;
let chartStatsBuilds = 0;
let energyStatsBuilds = 0;
let appliedStats = 0;
card._chartZoomDrag = null;
card._chartPan = {};
card._chartRefreshPending = false;
card._energyChartRefreshPending = false;
card._chartFullRenderPending = false;
card._chartGestureChangedKeys = new Set();
card._statsExtremesApplyPending = false;
card.shadowRoot = { querySelector() { domQueries += 1; throw new Error('DOM should not be touched during gesture'); } };
card._refreshChart();
card._refreshEnergyCharts();
card._applyStatsExtremes();
assert.equal(domQueries, 0, 'chart rebuild, energy rebuild and stats bindings skip DOM work mid-gesture');
assert.equal(card._chartRefreshPending, true);
assert.equal(card._energyChartRefreshPending, true);
assert.equal(card._statsExtremesApplyPending, true);
const plot = { innerHTML: '' };
const stats = { innerHTML: '' };
const energyPlot = { dataset: {}, innerHTML: '' };
const energySelection = { innerHTML: '' };
const energyStats = { dataset: {}, innerHTML: '' };
const energyTitle = { textContent: '' };
card._chartPan = null;
card._chartZoomDrag = null;
card._activeTab = 'params';
card.shadowRoot = {
  querySelector(selector) {
    if (selector.includes('chart-plot')) return plot;
    if (selector.includes('chart-stats')) return stats;
    if (selector === '[data-energy-plot]') return energyPlot;
    if (selector === '[data-energy-selection]') return energySelection;
    if (selector === '[data-energy-stats]') return energyStats;
    if (selector === '[data-energy-chart-title]') return energyTitle;
    return null;
  },
  querySelectorAll() { return []; },
};
card._chartSvg = () => { svgBuilds += 1; return '<svg />'; };
card._chartStatsHtml = (_metric, _history, scope) => {
  if (scope === 'energy') energyStatsBuilds += 1;
  else chartStatsBuilds += 1;
  return '<div />';
};
card._energyChartMetric = 'energy_total';
card._energyHistory = { energy_total: [] };
card._energyHistoryLoading = { energy_total: false };
card._energyBarSvg = () => '<svg />';
card._energyBarSelectionHtml = () => '<div />';
card._t = (key) => key;
card._restoreChartScrub = () => true;
card._updateChartScrubber = () => {};
card._updateChartReadings = () => {};
card._updateChartZoomSelection = () => {};
card._updateRange = () => {};
card._updateValueBindings = () => { appliedStats += 1; };
card._ensureHistory = () => {};
card._ensureEnergyHistory = () => {};
card._ensureStatsExtremes = () => {};
card._flushDeferredChartUpdates();
assert.equal(svgBuilds, 1, 'one final SVG rebuild occurs after release');
assert.equal(chartStatsBuilds, 1, 'chart statistics rebuild once after release');
assert.equal(energyStatsBuilds, 1, 'energy statistics rebuild once after release');
assert.equal(appliedStats, 1, 'deferred statistics bindings apply once after release');
assert.equal(card._chartRefreshPending, false);
assert.equal(card._energyChartRefreshPending, false);
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_zoom_handle_drag_updates_handle_without_showing_a_confirm_button_mid_drag(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const node = () => {
  const attrs = new Map();
  return { attrs, textContent: '', disabled: true, hidden: true,
    getAttribute(name) { return attrs.has(name) ? attrs.get(name) : null; },
    setAttribute(name, value) { attrs.set(name, String(value)); } };
};
const nodes = { band: node(), startEdge: node(), endEdge: node(), startHandle: node(), endHandle: node(), applyButton: node() };
const drag = { chart: { dataset: { chartY0: '20', chartY1: '180' } }, bounds: { start: 1000, end: 61000 }, x0: 100, x1: 900, nodes };
card._chartZoomWindow = { start: 11000, end: 21000, dirty: true };
card._updateChartZoomSelection(drag, false);
assert.equal(nodes.startHandle.getAttribute('transform'), 'translate(233.33 0)', 'handle position previews immediately');
assert.equal(nodes.startHandle.getAttribute('aria-valuenow'), null, 'ARIA timestamps wait until release');
assert.equal(nodes.applyButton.hidden, true, 'confirmation remains hidden during the drag');
assert.equal(nodes.applyButton.disabled, true, 'button state remains untouched during the drag');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_zoom_confirm_button_only_appears_after_release_over_last_handle(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const button = { hidden: true, disabled: true, offsetWidth: 100, style: {} };
const plot = { clientWidth: 400, getBoundingClientRect: () => ({ left: 10 }) };
const chart = { dataset: { chartX0: '20', chartX1: '380', chartW: '400' }, getBoundingClientRect: () => ({ left: 10, width: 400 }), closest: () => plot };
card.shadowRoot = { querySelector: (selector) => selector === '[data-chart-zoom-apply]' ? button : chart };
card._chartZoomSelectionBounds = () => ({ start: 1000, end: 61000 });
card._chartZoomWindow = { start: 11000, end: 51000, dirty: true };
card._chartZoomConfirmHandle = 'end';
card._updateChartZoomConfirmButton();
assert.equal(button.hidden, false, 'confirmation appears after release');
assert.equal(button.disabled, false, 'confirmation can be applied');
assert.equal(button.style.left, '320px', 'confirmation is anchored over the last moved handle');
card._chartZoomConfirmHandle = null;
card._updateChartZoomConfirmButton();
assert.equal(button.hidden, true, 'button hides when no handle is waiting for confirmation');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_axis_pan_targets_energy_and_parameter_history_without_changing_scale(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const now = Date.now();
card._statsStart = now - 10 * 86400000;
const paramsStart = now - 2 * 3600000;
const paramsEnd = now - 3600000;
const params = card._chartPanTarget({ pointerType: 'axis', rangeMs: 3600000, deltaX: 30, plotWidth: 300, tStart: paramsStart, tEnd: paramsEnd });
assert.equal(params.end - params.start, 3600000, 'parameters pan keeps the visible duration');
assert.equal((params.start + params.end) / 2, (paramsStart + paramsEnd) / 2 - 360000, 'rightward drag reveals older parameter history');
const energyStart = now - 4 * 86400000;
const energyEnd = energyStart + 86400000;
const energy = card._chartPanTarget({ pointerType: 'axis', rangeMs: 86400000, deltaX: -15, plotWidth: 300, tStart: energyStart, tEnd: energyEnd });
assert.equal(energy.end - energy.start, 86400000, 'energy pan keeps the visible duration');
assert.equal((energy.start + energy.end) / 2, (energyStart + energyEnd) / 2 + 4320000, 'leftward drag reveals newer energy history');
const oneSecond = card._chartPanTarget({ pointerType: 'axis', rangeMs: 1000, deltaX: -30, plotWidth: 300, tStart: now - 10000, tEnd: now - 9000 });
assert.equal(oneSecond.end - oneSecond.start, 1000, 'one-second range remains one second while panning');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False, env={**os.environ, "TZ": "UTC"})
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_duration_formatting_keeps_pzem_offline_time_readable(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._lang = () => 'uk';
assert.equal(card._formatDuration(42), '42 с', 'short outages include seconds');
assert.equal(card._formatDuration(3725), '1 год 2 хв', 'longer outages are shown in hours and minutes');
assert.equal(card._formatDuration(90061), '1 д 1 год', 'multi-day durations stay compact');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_parameter_history_prefetches_one_visible_window_before_the_chart(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const start = 1700000000000;
const bounds = { start, end: start + 3600000 };
const fetch = card._historyPrefetchBounds(bounds);
assert.equal(fetch.start, start - 3600000, 'prefetch is one chart-width earlier');
assert.equal(fetch.end, bounds.end, 'prefetch does not extend beyond the current end');
card._statsStart = start - 1800000;
const clamped = card._historyPrefetchBounds(bounds);
assert.equal(clamped.start, start - 1800000, 'statistics start remains the lower limit');
assert.equal(clamped.end, bounds.end);
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_energy_chart_renders_buffered_bars_but_only_visible_bars_are_interactive(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const start = Date.parse('2026-10-01T12:00:00Z');
const end = start + 3600000;
card._energyHistoryRange = 'hour';
card._energyHistoryBounds = () => ({ start, end });
card._energyHistoryBufferStart = { energy_total: start - 2 * 3600000 };
card._energyHistoryBufferEnd = { energy_total: end };
card._chartW = 480;
card._locale = () => 'en-US';
card._lang = () => 'en';
card._currencyCode = () => 'UAH';
card._state = () => ({ attributes: { unit_of_measurement: 'kWh' } });
card._t = () => 'Electricity consumption';
card._escape = (value) => String(value);
card._id = (name) => `id-${name}`;
const svg = card._energyBarSvg('energy_total', [
  { time: new Date(start - 2 * 3600000), value: 0 },
  { time: new Date(start - 3600000), value: 1 },
  { time: new Date(start), value: 2 },
  { time: new Date(end), value: 3 },
], false);
assert.match(svg, /data-energy-bar-count="1"/, 'the chart reports its one visible bar');
assert.equal((svg.match(/<rect class="energy-bar/g) || []).length, 3, 'two cached bars are drawn before the visible bar');
assert.equal((svg.match(/data-energy-bar="/g) || []).length, 1, 'only the visible bar responds to selection');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False, env={**os.environ, "TZ": "UTC"})
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
assert.ok(!html.includes('data-chart-zoom="in"'), 'chart does not render old plus/minus zoom buttons');
assert.ok(html.includes('data-chart-zoom-apply') && html.includes('chart-zoom-confirm-button'), 'parameters chart renders a hidden confirmation button over the plot');
assert.ok(!html.includes('data-chart-zoom-actions'), 'the persistent apply row is removed');
assert.ok(!html.includes('<input type="range" data-chart-zoom-start') && !html.includes('<input type="range" data-chart-zoom-end'), 'no separate range sliders are rendered');
assert.ok(!html.includes('data-chart-history-navigator'), 'no separate history navigator is rendered');
const markers = card._chartZoomSelectionSvg(1000, 61000, 100, 900, 20, 190);
assert.equal((markers.match(/data-chart-zoom-handle=/g) || []).length, 2, 'two draggable triangular handles are drawn on the chart');
assert.ok(markers.includes('data-chart-zoom-band'), 'selected interval is highlighted on the graph');
assert.ok(markers.includes('role="slider"') && markers.includes('M-9 2H9L0 16Z'), 'handles are accessible and triangular');
assert.ok(!html.includes('chart-zoom-button'), 'chart does not render chart-zoom-button class');
assert.ok(html.includes('data-period="month"'), 'renders month period button');
assert.ok(html.indexOf('data-period="month"') < html.indexOf('chart-date-range'), 'Select period is placed to the right of Month button');
assert.ok(html.includes('Вибрати період'), 'button is renamed to Вибрати період');
assert.ok(html.includes('class="periods chart-range-periods"'), 'period buttons and date picker use a dedicated responsive group');
assert.ok(html.includes('class="periods chart-metric-periods"'), 'metric buttons use their own responsive group');
card._energyChartMetric = 'energy_total';
card._energyHistoryRange = 'day';
card._chartDateRangeHtml = () => '<div class="chart-date-range"></div>';
const energyControls = card._energyChartControlsHtml();
assert.ok(energyControls.includes('class="periods chart-range-periods"'), 'energy period controls use the same responsive group');
assert.ok(Card.CSS.includes('.periods.chart-range-periods{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))'), 'mobile period buttons occupy separate grid cells');
assert.ok(Card.CSS.includes('.shell:not(.home-active)>.header>.tabs-top .tab[data-tab="home"] .tab-icon{display:none}'), 'the home icon is hidden on narrow secondary tabs');
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_chart_date_range_picker_date_only_and_single_day_support(self):
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

card._t = (key) => ({
  chart_date_range: 'Вибрати період',
  chart_from: 'Від',
  chart_to: 'До',
  chart_apply: 'Показати',
  chart_date_error: 'Помилка дати',
})[key] || key;
card._escape = (s) => s;
card._instanceId = 'test1';
card._historyRange = 'day';
card._energyHistoryRange = 'day';
card._statsStart = Date.parse('2026-11-10T12:00:00Z');
card._historyBounds = () => ({ start: Date.parse('2026-11-20T00:00:00Z'), end: Date.parse('2026-11-21T00:00:00Z') });
card._energyHistoryBounds = () => ({ start: Date.parse('2026-11-20T00:00:00Z'), end: Date.parse('2026-11-21T00:00:00Z') });

// 1. HTML generation: date inputs, min/max constraints
const html = card._chartDateRangeHtml('params');
assert.ok(html.includes('type="hidden"'), 'draft date values are stored in hidden form fields');
assert.ok(html.includes('data-chart-calendar'), 'renders the custom month calendar container');
assert.ok(html.includes('data-chart-calendar') && html.includes('data-chart-date-apply') && html.includes('disabled'), 'the period picker opens a calendar with Show disabled until the range is complete');
assert.ok(!html.includes('data-chart-calendar-open'), 'there is no intermediate date-picker dialog');
assert.ok(!html.includes('type="datetime-local"'), 'date picker does not use native browser date-time controls');

// 2. Single day range application (same start and end date -> 24h span)
let appliedStart = null, appliedEnd = null, appliedScope = null;
card._setCustomChartRange = (s, e, sc) => { appliedStart = s; appliedEnd = e; appliedScope = sc; };
const mockPanel = {
  querySelector: () => ({ textContent: '' }),
};
card.shadowRoot = {
  querySelector: (sel) => {
    if (sel === '[data-chart-date-start]') return { value: '2026-11-20' };
    if (sel === '[data-chart-date-end]') return { value: '2026-11-20' };
    if (sel.includes('.chart-date-range-panel')) return mockPanel;
    return null;
  },
};
card._applyChartDateRange('params');
assert.ok(appliedStart !== null, 'range applied');
assert.equal(new Date(appliedStart).toISOString().slice(0, 10), '2026-11-20');
const span = appliedEnd - appliedStart;
assert.equal(span, 24 * 3600 * 1000, 'single day selection spans exactly 24 hours');

// 3. Clamping to _statsStart if user selects earlier date
card.shadowRoot = {
  querySelector: (sel) => {
    if (sel === '[data-chart-date-start]') return { value: '2026-11-05' };
    if (sel === '[data-chart-date-end]') return { value: '2026-11-15' };
    if (sel.includes('.chart-date-range-panel')) return mockPanel;
    return null;
  },
};
card._applyChartDateRange('params');
assert.ok(appliedStart >= card._statsStart, 'start is clamped to statsStart');
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


    def test_month_calendar_disables_dates_before_statistics_start_for_both_chart_scopes(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._locale = () => 'uk-UA';
card._t = (key) => ({ chart_calendar_previous: 'Попередній місяць', chart_calendar_next: 'Наступний місяць' })[key] || key;
card._escape = (value) => String(value);
card._chartDateRangeMin = () => '2026-11-01';
card._chartDateRangeMax = () => '2026-11-22';
card._formatDateInput = (timestamp) => new Date(timestamp).toISOString().slice(0, 10);
for (const scope of ['params', 'energy']) {
  card._chartCalendarState = { scope, month: '2026-11', start: '2026-11-10', end: '2026-11-18' };
  const html = card._chartCalendarContentHtml(scope, '2026-11');
  const dayBeforeStatsStart = html.match(new RegExp(`<button[^>]*data-chart-calendar-day="2026-10-26"[^>]*>`))?.[0] || '';
  const startDay = html.match(new RegExp(`<button[^>]*data-chart-calendar-day="2026-11-10"[^>]*>`))?.[0] || '';
  const endDay = html.match(new RegExp(`<button[^>]*data-chart-calendar-day="2026-11-18"[^>]*>`))?.[0] || '';
  assert.ok(dayBeforeStatsStart.includes('aria-disabled="true"'), `${scope}: date before statistics start is disabled and dimmed`);
  assert.ok(!startDay.includes('aria-disabled="true"') && startDay.includes('range-start'), `${scope}: start date is highlighted and selectable`);
  assert.ok(!endDay.includes('aria-disabled="true"') && endDay.includes('range-end'), `${scope}: end date is highlighted and selectable`);
  assert.ok(html.includes('in-range'), `${scope}: dates inside the selected range are highlighted`);
}
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_document_touch_dismisses_whole_picker_but_keeps_inside_and_toggle_clicks(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
let rangeClosed = 0;
card._closeChartDateRangePopover = () => { rangeClosed += 1; card._chartCalendarState = null; };
card._chartCalendarState = { scope: 'params' };
const outside = { matches: () => false };
card._handleChartDateDocumentPointerDown({ composedPath: () => [outside] });
assert.equal(rangeClosed, 1, 'touching anywhere outside the calendar popover closes the whole picker');
const panel = { matches: (selector) => selector === '.chart-date-range-panel' };
const showButton = { matches: () => false };
card._chartCalendarState = { scope: 'params' };
card._handleChartDateDocumentPointerDown({ composedPath: () => [showButton, panel], target: showButton });
assert.equal(rangeClosed, 1, 'interactions inside the calendar window stay open until Show runs');
const dateButton = { matches: (selector) => selector === '[data-chart-calendar-day]' };
card._chartCalendarState = { scope: 'params' };
card._handleChartDateDocumentPointerDown({ composedPath: () => [dateButton, panel], target: dateButton });
assert.equal(rangeClosed, 1, 'calendar date buttons remain usable');
const toggle = { matches: (selector) => selector === '[data-chart-date-toggle]' };
card._chartCalendarState = { scope: 'params' };
card._handleChartDateDocumentPointerDown({ composedPath: () => [toggle], target: toggle });
assert.equal(rangeClosed, 1, 'the period toggle is left for its click handler to close');
card._chartCalendarState = { scope: 'params' };
card._handleChartDateDocumentScroll();
assert.equal(rangeClosed, 2, 'scrolling the page also dismisses the date picker');
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_touching_elsewhere_inside_card_closes_the_whole_calendar_popover(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
let closed = 0;
card._chartCalendarState = { scope: 'params' };
card.shadowRoot = {};
card._closeChartDateRangePopover = () => { closed += 1; card._chartCalendarState = null; };
const outside = { matches: () => false, closest: () => null };
card._handleChartDatePointerDown({ target: outside, composedPath: () => [outside] });
assert.equal(closed, 1, 'touching any card content outside the calendar dismisses the full popover');
const panel = { matches: (selector) => selector === '.chart-date-range-panel' };
const inside = { matches: () => false, closest: () => null };
card._chartCalendarState = { scope: 'params' };
card._handleChartDatePointerDown({ target: inside, composedPath: () => [inside, panel] });
assert.equal(closed, 1, 'touching within the calendar window keeps it open');
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)



    def test_chart_plot_drag_initiates_pan_and_targets_correctly(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const now = Date.now();
card._statsStart = now - 10 * 86400000;
const tStart = now - 7200000;
const tEnd = now - 3600000;
const target = card._chartPanTarget({
  pointerType: 'drag',
  rangeMs: 3600000,
  deltaX: 40,
  plotWidth: 400,
  tStart,
  tEnd,
  buf: { start: now - 14400000, end: now, items: [] }
});
assert.equal(target.end - target.start, 3600000, 'drag maintains visible duration');
assert.ok(target.start < tStart, 'dragging right shifts target to older history');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_refresh_chart_includes_zoom_actions_markup(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._t = () => 'Apply';
card._escape = (s) => s;
const html = card._chartZoomActionsHtml();
assert.ok(html.includes('data-chart-zoom-apply'), 'zoom actions include data-chart-zoom-apply button');
assert.ok(html.includes('chart-zoom-confirm-button'), 'button has confirm button class');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_pzem_live_offline_duration_computed_when_sensor_reports_zero(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
card._t = (key) => key === 'h' ? 'год' : key === 'm' ? 'хв' : key === 's' ? 'с' : key;
card._effectiveEspStatus = () => 'on';
card._raw = (key) => {
  if (key === 'inverter') return 'on';
  if (key === 'mains') return 'off';
  if (key === 'inverter_current_duration') return '0';
  return 'unknown';
};
const tenSecAgo = new Date(Date.now() - 15000).toISOString();
card._state = (key) => ({
  state: '0',
  last_changed: tenSecAgo,
  attributes: { unit_of_measurement: 's' }
});
card.config = { lang: 'uk' };
const durationText = card._formatted('inverter_current_duration');
assert.ok(durationText.includes('15') || durationText.includes('с'), 'computed live duration shows seconds elapsed');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_zoom_confirm_button_is_positioned_above_active_handle(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const button = { style: {}, offsetWidth: 80 };
const plot = { clientWidth: 500, getBoundingClientRect: () => ({ left: 0, width: 500 }) };
const chart = {
  dataset: { chartStart: '1000', chartEnd: '3000', chartW: '500', chartX0: '50', chartX1: '450' },
  getBoundingClientRect: () => ({ left: 0, width: 500 }),
  closest: () => plot,
};
card.shadowRoot = {
  querySelector: (sel) => {
    if (sel === '[data-chart-zoom-apply]') return button;
    if (sel === '[data-role="chart-plot"] svg.chart') return chart;
    return null;
  },
};
card._chartZoomConfirmHandle = 'end';
card._chartZoomWindow = { start: 1000, end: 2000, dirty: true };
card._chartZoomSelectionBounds = () => ({ start: 1000, end: 3000 });
card._updateChartZoomConfirmButton();
assert.equal(button.style.top, '-34px', 'button is elevated above the handle mark');
assert.ok(!button.hidden, 'button is visible when dirty');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_chart_pan_target_allows_bidirectional_panning(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const now = 1700000000000;
const tStart = now - 60000;
const tEnd = now - 30000;
const panPast = {
  pointerType: 'axis',
  rangeMs: 30000,
  plotWidth: 300,
  deltaX: 100, // dragging rightwards scrolls timeline back to past
  tStart,
  tEnd,
  buf: { start: now - 3600000, end: now, items: [] },
};
const targetPast = card._chartPanTarget(panPast, now);
assert.ok(targetPast.start < tStart, 'panning moves backwards into earlier history');

const panFuture = {
  pointerType: 'axis',
  rangeMs: 30000,
  plotWidth: 300,
  deltaX: -100, // dragging leftwards scrolls timeline towards future/present
  tStart,
  tEnd,
  buf: { start: now - 3600000, end: now, items: [] },
};
const targetFuture = card._chartPanTarget(panFuture, now);
assert.ok(targetFuture.start > tStart, 'panning moves forwards into more recent history');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_pinch_zoom_scales_around_finger_midpoint(self):
        script = r"""
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
const context = { window: { customCards: [] }, HTMLElement: class HTMLElement {}, customElements: { define: (name, value) => registry.set(name, value) } };
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const Card = registry.get('grid-monitor-card');
const card = Object.create(Card.prototype);
const now = 1700000000000;
const tStart = now - 100000;
const tEnd = now;
// Two fingers placed at 20% of the chart width (alpha = 0.2)
const pan = {
  pointerType: 'touch',
  rangeMs: 100000,
  plotWidth: 500,
  pinchAlpha: 0.2,
  startDistance: 100,
  currentDistance: 200, // pinch out: scale = 0.5 (zoom in)
  deltaX: 0,
  tStart,
  tEnd,
};
const focalTime = tStart + 0.2 * 100000;
const target = card._chartPanTarget(pan, now);
const nextRange = target.end - target.start;
assert.equal(nextRange, 50000, 'zoomed range is halved');
const newFocalTime = target.start + 0.2 * nextRange;
assert.equal(Math.round(newFocalTime), Math.round(focalTime), 'time at 20% position remains identical');
"""
        result = subprocess.run(["node", "-e", script, str(ROOT / "grid-monitor-card.js")], capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

class VoltageAxisTests(unittest.TestCase):
    def test_voltage_axis_ignores_outage_zeros_and_fits_real_values(self):
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
const series = (values) => values.map((v, index) => ({ t: index, v }));

// Outage zeros must not stretch the axis down to 0: small swings stay visible.
const withOutage = card._chartScale(series([229, 0, 233, 231, 0, 227]), 'voltage');
assert.ok(withOutage.lo >= 220, `axis starts near real voltage, got ${withOutage.lo}`);
assert.ok(withOutage.max <= 240, `axis ends near real voltage, got ${withOutage.max}`);
assert.ok(withOutage.lo < 227 && withOutage.max > 233, 'axis covers every real value');

// Same axis as without the zeros.
const withoutOutage = card._chartScale(series([229, 233, 231, 227]), 'voltage');
assert.equal(withOutage.lo, withoutOutage.lo);
assert.equal(withOutage.max, withoutOutage.max);
assert.equal(withOutage.step, withoutOutage.step);

// Only outage samples: fall back to the plain power-style scale starting at 0.
const onlyOutage = card._chartScale(series([0, 0]), 'voltage');
assert.equal(onlyOutage.lo, 0);
assert.ok(onlyOutage.max > 0);
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


PRELUDE_CLARITY = r"""
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
const at = (minutes, value, extra = {}) => ({ time: new Date(Date.UTC(2026, 10, 21, 0, 0, 0) + minutes * 60e3), value, ...extra });
"""


def run_clarity(body):
    return subprocess.run(
        ["node", "-e", PRELUDE_CLARITY + body, str(ROOT / "grid-monitor-card.js")],
        capture_output=True,
        text=True,
        check=False,
        env={**os.environ, "TZ": "UTC"},
    )


class VoltageAxisDetailTests(unittest.TestCase):
    def run_axis(self, body):
        return subprocess.run(
            ["node", "-e", PRELUDE_CLARITY + body, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
            env={**os.environ, "TZ": "UTC"},
        )

    def test_voltage_axis_hugs_the_curve_so_small_swings_use_the_full_height(self):
        result = self.run_axis(r"""
const series = (values) => values.map((v, index) => ({ t: index, v }));
const scale = card._chartScale(series([229, 231, 233, 230, 232]), 'voltage');
assert.ok(scale.max - scale.lo <= 8, `axis span ${scale.max - scale.lo} stays tight around 229-233 V`);
assert.ok(scale.lo <= 229 && scale.max >= 233, 'axis covers every plotted value');
assert.equal(scale.count, (scale.max - scale.lo) / scale.step);
assert.ok(scale.count >= 2 && scale.count <= 4);
// A wider swing picks a coarser step but still covers the data.
const wide = card._chartScale(series([205, 245, 230]), 'voltage');
assert.ok(wide.lo <= 205 && wide.max >= 245 && wide.count <= 4);
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_outage_zeros_and_rare_deep_dips_do_not_squash_the_curve(self):
        result = self.run_axis(r"""
const base = [];
for (let i = 0; i < 100; i += 1) base.push(229 + (i % 5));   // 229..233 V
const clean = card._chartScale(base.map((v, index) => ({ t: index, v })), 'voltage');
const withOutage = card._chartScale([0, 0, 0, ...base, 0].map((v, index) => ({ t: index, v })), 'voltage');
assert.equal(withOutage.lo, clean.lo);
assert.equal(withOutage.max, clean.max);
// Two isolated deep dips out of ~100 points must not stretch the axis down to 120 V.
const withDips = card._chartScale([120, ...base, 118].map((v, index) => ({ t: index, v })), 'voltage');
assert.ok(withDips.max - withDips.lo <= 8, `axis span ${withDips.max - withDips.lo} ignores rare dips`);
// Sustained low voltage is real data and does widen the axis.
const sustained = [];
for (let i = 0; i < 100; i += 1) sustained.push(i < 40 ? 190 : 230);
const wide = card._chartScale(sustained.map((v, index) => ({ t: index, v })), 'voltage');
assert.ok(wide.lo <= 190 && wide.max >= 230);
// Only outages: plain 0-based axis.
const only = card._chartScale([0, 0].map((v, index) => ({ t: index, v })), 'voltage');
assert.equal(only.lo, 0);
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_every_bucket_extreme_is_drawn_again_for_long_voltage_ranges(self):
        result = self.run_axis(r"""
const history = [];
for (let minute = 0; minute < 240; minute += 1) history.push(at(minute, 230 + (minute % 2 ? 3 : -3)));
const start = history[0].time.getTime();
const points = card._bucketHistory(start, start + 240 * 60e3, 8, history);
assert.ok(points.length > 8, 'bucket extremes are kept, no averaging');
assert.ok(points.some((point) => point.v === 227) && points.some((point) => point.v === 233));
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


class LongRangeClarityTests(unittest.TestCase):
    def test_voltage_minimum_and_average_ignore_outage_zeros_and_keep_true_extremes(self):
        result = run_clarity(r"""
card._chartMetric = 'voltage';
card._historyRange = 'day';
card._locale = () => 'en-GB';
card._lang = () => 'en';
card._t = (key) => ({ stat_min: 'Min', stat_avg: 'Avg', stat_max: 'Max' })[key];
card._escape = (value) => String(value);
card._historyBounds = () => ({ start: Date.UTC(2026, 10, 21, 0, 0, 0), end: Date.UTC(2026, 10, 21, 23, 0, 0) });
card._history = [at(10, 228), at(20, 0, { outage: true }), at(30, 232), at(40, 0, { outage: true }), at(50, 236), at(60, 229)];
// The plotted series is averaged (and contains zeros), but statistics must come from real measurements.
card._chartData = () => ({ series: [{ t: 1, v: 0 }, { t: 2, v: 231 }] });
const html = card._chartStatsHtml();
assert.match(html, /Min<\/span><b>228 V<\/b>/, html);
assert.match(html, /Max<\/span><b>236 V<\/b>/, html);
assert.match(html, /Avg<\/span><b>231\.3 V<\/b>/, html);
card._voltageHistory = card._history;
const range = card._voltageRangeStats();
assert.equal(range.min, 228);
assert.equal(range.max, 236);
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)

    def test_chart_minimum_never_counts_zero_for_power_or_voltage(self):
        result = run_clarity(r"""
card._historyRange = 'day';
card._locale = () => 'en-GB';
card._lang = () => 'en';
card._t = (key) => ({ stat_min: 'Min', stat_avg: 'Avg', stat_max: 'Max' })[key];
card._escape = (value) => String(value);
card._historyBounds = () => ({ start: Date.UTC(2026, 10, 21, 0, 0, 0), end: Date.UTC(2026, 10, 21, 23, 0, 0) });
card._history = [at(10, 120)];
card._chartMetric = 'power';
card._chartData = () => ({ series: [{ t: 1, v: 0 }, { t: 2, v: 80 }, { t: 3, v: 900 }] });
const html = card._chartStatsHtml();
assert.match(html, /Min<\/span><b>80 W<\/b>/, html);
""")
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


if __name__ == "__main__":
    unittest.main()
