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


if __name__ == "__main__":
    unittest.main()
