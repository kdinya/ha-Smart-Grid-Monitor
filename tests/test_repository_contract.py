import json
import unittest
from pathlib import Path

import yaml
from yaml.nodes import MappingNode, ScalarNode, SequenceNode

ROOT = Path(__file__).resolve().parents[1]


class ESPHomeSafeLoader(yaml.SafeLoader):
    pass


def _unknown_tag(loader, tag_suffix, node):
    if isinstance(node, ScalarNode):
        return loader.construct_scalar(node)
    if isinstance(node, SequenceNode):
        return loader.construct_sequence(node)
    if isinstance(node, MappingNode):
        return loader.construct_mapping(node)
    raise TypeError(f"Unsupported YAML node: {type(node).__name__}")


ESPHomeSafeLoader.add_multi_constructor("!", _unknown_tag)


def _walk(value):
    if isinstance(value, dict):
        yield value
        for nested in value.values():
            yield from _walk(nested)
    elif isinstance(value, list):
        for nested in value:
            yield from _walk(nested)


class RepositoryContractTests(unittest.TestCase):
    def test_hacs_manifest_is_valid_json(self):
        manifest = json.loads((ROOT / "hacs.json").read_text(encoding="utf-8"))
        self.assertTrue(manifest)

    def test_esphome_and_home_assistant_yaml_parse(self):
        paths = (
            "esphome/grid-monitor.yaml",
            "home-assistant/packages/grid_monitor.yaml",
            "home-assistant/lovelace/grid-monitor-dashboard.yaml",
        )
        for relative in paths:
            with self.subTest(path=relative):
                yaml.load((ROOT / relative).read_text(encoding="utf-8"), Loader=ESPHomeSafeLoader)

    def test_wide_home_layout_places_tabs_beside_voltage_panel(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        home = card.split("    _home() {", 1)[1].split("    _id(name)", 1)[0]
        side_tabs = "${this._tabs('side')}"
        self.assertIn(side_tabs, home)
        self.assertLess(home.index(side_tabs), home.index('<div class="metrics">'))
        self.assertLess(home.index("${this._headRightHtml(status)}"), home.index(side_tabs))
        self.assertIn("@container (min-width:960px)", card)
        self.assertIn(".shell.home-active>.tabs-top{display:none}", card)
        self.assertIn(".home-view .main-right>.tabs-side{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin:0;align-self:stretch;width:100%}", card)
        self.assertIn(".home-view .main-grid>.voltage{grid-column:1;grid-row:1}", card)
        self.assertIn(".home-view .main-right{display:contents}", card)
        self.assertIn(".metric-icon .icon{width:40px;height:40px}", card)
        self.assertIn(".metric-value{font-size:clamp(30px,3.4cqw,46px);margin:0}", card)
        # Status updates must keep home-active, otherwise the top tab bar reappears next to the side tabs.
        self.assertIn("${this._activeTab === 'home' ? ' home-active' : ''}", card)
        self.assertIn("grid-template-rows:auto", card)
        self.assertIn(".voltage:after{display:none}", card)

    def test_home_status_is_top_right_without_wifi_icon_and_gauge_is_10_percent_larger(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        self.assertIn(".voltage-brand{display:flex;align-items:flex-start", card)
        self.assertIn(".voltage-brand .home-status{flex:none;align-self:flex-start;", card)
        self.assertIn("margin-left:auto", card.split(".voltage-brand .home-status{", 1)[1].split("}", 1)[0])
        self.assertIn("<div class=\"headright home-status\">", card)
        self.assertNotIn('data-role="wifi-icon"', card)
        self.assertNotIn("_updateWifiTitle", card)
        last_gauge_rule = card[card.rfind(".voltage-gauge{"):].split("}", 1)[0]
        self.assertIn("width:min(110%,594px)", last_gauge_rule)

    def test_other_pages_keep_full_width_content_below_the_top_right_menu(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        header = card.split("    _headerHtml() {", 1)[1].split("    _home() {", 1)[0]
        render = card.split("    _render() {", 1)[1].split("    _activeContent()", 1)[0]
        self.assertNotIn("_headRightHtml", header)
        self.assertIn("${this._tabs('top')}", header)
        self.assertIn("${this._activeTab === 'home' ? this._tabs('top') : ''}", render)
        header_call = "${this._activeTab === 'home' ? '' : this._headerHtml()}"
        self.assertLess(render.index(header_call), render.index('<div class="page-layout">'))
        self.assertNotIn("${this._activeTab === 'home' ? '' : this._tabs('side')}", render)
        self.assertIn(".shell:not(.home-active)>.header>.tabs-top{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));flex:0 0 45%;width:45%;min-width:360px;max-width:560px;margin:0 0 0 auto", card)
        self.assertIn(".shell:not(.home-active)>.header>.tabs-top .tab{padding:15px 8px}", card)
        self.assertIn(".shell:not(.home-active)>.page-layout{display:block}", card)
        self.assertIn(".shell:not(.home-active)>.page-layout>.tabs-side{display:none}", card)

    def test_chart_scrubber_shows_full_width_historical_measurements_and_metric_correct_marker(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        self.assertIn("data-role=\"chart-scrubber\"", card)
        self.assertIn("data-role=\"chart-readings\"", card)
        self.assertIn("data-chart-reading=\"${key}\"", card)
        for key in ("current", "power", "apparent_power", "phase_angle", "reactive_power", "power_factor"):
            self.assertIn(f"key: '{key}'", card)
        self.assertIn("const metricKey = this._chartMetric || 'power';", card)
        self.assertIn("this._num(metricKey)", card)
        self.assertIn("chart.dataset.chartMin", card)
        self.assertIn(".chart-reading-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))", card)
        self.assertIn("this._queueChartReadings(point.t)", card)
        self.assertIn(".shell:not(.home-active)>.page-layout{display:block}", card)
        self.assertIn(".shell:not(.home-active)>.page-layout>.tabs-side{display:none}", card)

    def test_daily_voltage_and_power_minima_ignore_invalid_restored_values(self):
        firmware = (ROOT / "esphome/grid-monitor.yaml").read_text(encoding="utf-8")
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        self.assertIn("id(g_v_min) <= 150.0f || id(g_v_min) > 300.0f", firmware)
        self.assertIn("v > 150.0f && v <= 300.0f", firmware)
        self.assertIn("id(g_p_min) <= 0.0f || id(g_p_min) > 30000.0f", firmware)
        self.assertIn("x > 0.0f && x < id(g_p_min)", firmware)
        self.assertIn("accuracy_decimals: 1", firmware.split('name: "Power Min Today"', 1)[1].split('name: "Current Min Today"', 1)[0])
        self.assertIn("minDigits: 1, maxDigits: 0", card)
        self.assertIn('data-value-key="power_min" data-value-digits="1"', card)

    def test_gauge_arc_ticks_and_marker_share_one_geometry(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        self.assertIn("const GAUGE = {", card)
        self.assertIn("const gaugeMarker = (progress)", card)
        # The marker used to be computed on a different centre than the arc.
        self.assertNotIn("(180 + progress * 1.8)", card)

    def test_daily_min_max_stats_and_confirmed_reset_are_exposed(self):
        firmware = (ROOT / "esphome/grid-monitor.yaml").read_text(encoding="utf-8")
        dashboard = (ROOT / "home-assistant/lovelace/grid-monitor-dashboard.yaml").read_text(encoding="utf-8")
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        for name in [
            "Power Min Today", "Current Min Today", "Frequency Min Today", "Frequency Max Today",
            "Power Factor Min Today", "Power Factor Max Today", "Reset Daily Min Max Stats",
        ]:
            self.assertIn(f'name: "{name}"', firmware)
        self.assertIn("script.execute: reset_daily_stats", firmware)
        self.assertIn("button.grid_monitor_reset_daily_min_max_stats", card)
        self.assertIn("button.grid_monitor_reset_daily_min_max_stats", dashboard)
        self.assertIn("reset_stats: ['reset_daily_min_max_stats', 'reset_stats']", card)
        self.assertIn("this._action('reset_stats'", card)
        self.assertIn("'reset_stats', 'restart'", card)

    def test_chart_preserves_spikes_and_voltage_minimum_matches_plotted_period(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        self.assertIn("first: null, last: null, min: null, minPositive: null, max: null", card)
        self.assertIn("if (!bucket.min || sample.v < bucket.min.v) bucket.min = sample", card)
        self.assertIn("if (sample.v > 0 && (!bucket.minPositive || sample.v < bucket.minPositive.v)) bucket.minPositive = sample", card)
        self.assertIn("if (!bucket.max || sample.v > bucket.max.v) bucket.max = sample", card)
        self.assertIn("[bucket.first, bucket.min, bucket.minPositive, bucket.max, bucket.last]", card)
        self.assertIn("metricKey === 'power' ? plottedValues.filter((value) => value > 0) : plottedValues", card)
        self.assertIn("this._historyBounds(range)", card)
        self.assertIn("start.setHours(0, 0, 0, 0)", card)
        self.assertIn("start.getDay() + 6", card)
        self.assertIn("start.setDate(1)", card)
        self.assertIn("this._chartData(this._voltageHistory, 'voltage')", card)
        self.assertIn("data-role=\"voltage-min-period\"", card)
        self.assertNotIn('data-value-key=\"voltage_min\"', card)
        self.assertIn("range_title: 'Діапазон напруги на графіку'", card)

    def test_chart_is_measured_and_rescaled_to_the_card_width(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        self.assertIn("new ResizeObserver(() => this._queueChartMeasure())", card)
        self.assertIn("this._chartW", card)
        self.assertIn("hour12: false", card)

    def test_unavailable_values_use_compact_placeholders(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        self.assertIn(".metric-value.empty{", card)
        self.assertIn(".voltage-value.empty{", card)

    def test_dashboard_shows_explicit_voltage_status_not_stale_alarm(self):
        dashboard = yaml.load(
            (ROOT / "home-assistant/lovelace/grid-monitor-dashboard.yaml").read_text(encoding="utf-8"),
            Loader=ESPHomeSafeLoader,
        )
        quality_tiles = [node for node in _walk(dashboard) if node.get("name") == "Якість напруги"]
        self.assertTrue(quality_tiles, "Expected a voltage quality tile")
        self.assertEqual(quality_tiles[0].get("entity"), "sensor.grid_monitor_voltage_status")


    def test_pzem_values_are_validated_and_live_values_update_quickly(self):
        firmware = yaml.load(
            (ROOT / "esphome/grid-monitor.yaml").read_text(encoding="utf-8"),
            Loader=ESPHomeSafeLoader,
        )
        pzem = next(sensor for sensor in firmware["sensor"] if sensor.get("platform") == "pzemac")
        self.assertEqual(pzem["update_interval"], "2s")
        limits = {
            "voltage": "300.0f",
            "current": "100.0f",
            "power": "30000.0f",
            "frequency": "70.0f",
            "power_factor": "1.0f",
            "energy": "10000000.0f",
        }
        for name, maximum in limits.items():
            with self.subTest(sensor=name):
                sensor = pzem[name]
                self.assertNotIn("throttle_average", str(sensor))
                self.assertIn("6s", [entry.get("timeout") for entry in sensor["filters"] if isinstance(entry, dict) and "timeout" in entry])
                filter_source = "\n".join(entry.get("lambda", "") for entry in sensor["filters"] if isinstance(entry, dict))
                self.assertIn("isfinite(x)", filter_source)
                self.assertIn(f"x > {maximum}", filter_source)
        firmware_source = (ROOT / "esphome/grid-monitor.yaml").read_text(encoding="utf-8")
        self.assertIn("std::isfinite(", firmware_source)
        self.assertNotRegex(firmware_source, r"(?<![:\w])isfinite\s*\(")
        self.assertIn("on_value", pzem["voltage"])
        self.assertNotIn("on_raw_value", pzem["voltage"])
        derived = {sensor.get("name"): sensor for sensor in firmware["sensor"] if sensor.get("platform") == "template"}
        derived.update({sensor.get("name"): sensor for sensor in firmware["text_sensor"] if sensor.get("platform") == "template"})
        for name in ("Apparent Power", "Reactive Power", "Phase Angle", "Voltage Deviation", "Cost Rate", "Voltage Status"):
            with self.subTest(derived_sensor=name):
                self.assertEqual(derived[name]["update_interval"], "2s")
        uptime = next(sensor for sensor in firmware["sensor"] if sensor.get("platform") == "uptime")
        self.assertEqual(uptime["update_interval"], "5s")

    def test_card_expires_stale_esp_heartbeat_and_hides_old_measurements(self):
        import subprocess
        import textwrap

        script = textwrap.dedent("""
            const assert = require('node:assert/strict');
            const fs = require('node:fs');
            const vm = require('node:vm');
            let Card;
            class HTMLElement {}
            const context = {
              window: { customCards: [] },
              customElements: { define: (name, value) => { if (name === 'grid-monitor-card') Card = value; } },
              HTMLElement,
              Date,
              Intl,
              console,
              setTimeout,
              clearTimeout,
            };
            vm.runInNewContext(fs.readFileSync('grid-monitor-card.js', 'utf8'), context);
            const card = Object.create(Card.prototype);
            card._config = { prefix: 'grid_monitor', entities: {}, language: 'en' };
            card._entityOverrides = {};
            card._hass = { language: 'en', states: {
              'binary_sensor.grid_monitor_esp_status': { state: 'on' },
              'sensor.grid_monitor_uptime': { state: '123', last_updated: new Date(Date.now() - 1000).toISOString() },
              'sensor.grid_monitor_voltage': { state: '238.4', attributes: { unit_of_measurement: 'V' } },
              'sensor.grid_monitor_power_source_status': { state: 'pzem_online_source_unconfirmed' },
              'binary_sensor.grid_monitor_pzem_online': { state: 'on' },
              'binary_sensor.grid_monitor_voltage_out_of_range': { state: 'off' },
            } };
            assert.equal(card._effectiveEspStatus(), 'on');
            assert.equal(card._num('voltage'), 238.4);
            card._hass.states['sensor.grid_monitor_uptime'].last_updated = new Date(Date.now() - 20000).toISOString();
            assert.equal(card._effectiveEspStatus(), 'off');
            assert.equal(card._num('voltage'), null);
            assert.equal(card._formatted('voltage'), 'Unavailable');
            assert.equal(card._displayStatus().status, 'Offline');
        """)
        result = subprocess.run(["node", "-e", script], cwd=ROOT, text=True, capture_output=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
