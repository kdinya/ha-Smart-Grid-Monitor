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
        self.assertIn(".voltage-gauge{width:min(110%,594px);margin:-4px 0 0}", card)
        self.assertIn(".voltage-gauge{width:min(100%,410px);margin:-7px 0 -4px;transform:translateY(-4px)}", card)

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
        self.assertIn(".shell:not(.home-active)>.page-layout{display:block;margin-top:-40px}", card)
        self.assertEqual(card.count(".shell:not(.home-active)>.page-layout{display:block;margin-top:-40px}"), 2)
        self.assertIn(".shell:not(.home-active)>.header{align-items:flex-start;padding-bottom:1px;z-index:2}", card)
        self.assertIn(".shell:not(.home-active)>.page-layout>.tabs-side{display:none}", card)

    def test_energy_tab_has_one_history_chart_with_energy_cost_toggle(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        params_chart = card.split("    _chart() {", 1)[1].split("    _readStatsStart()", 1)[0]
        self.assertIn("['power', 'voltage'].map", params_chart)
        self.assertNotIn("energy_total", params_chart)
        self.assertNotIn("cost_total", params_chart)
        energy = card.split("    _energy() {", 1)[1].split("    _energyChartControlsHtml()", 1)[0]
        self.assertIn("${this._energyChart()}", energy)
        self.assertNotIn("${this._energyChart('cost_total')}", energy)
        chart = card.split("    _energyChartControlsHtml()", 1)[1].split("    _energyCoinArt()", 1)[0]
        self.assertIn("['energy_total', 'energy_metric_energy'], ['cost_total', 'energy_metric_cost']", chart)
        self.assertIn("data-energy-metric=\"${key}\"", chart)
        self.assertIn('data-energy-plot="${metricKey}"', chart)
        self.assertIn("this._energyBarSvg(metricKey, this._energyHistory[metricKey]", chart)
        self.assertIn("_energyHistoryBars(history, bounds, range)", card)
        self.assertIn("class=\"energy-bars\" data-energy-bar-count=\"${bars.length}\"", card)
        self.assertIn("energy_total: { digits: 3, plausible: [0, 1e7], unit: () => 'kWh' }", card)
        self.assertIn("cost_total: { digits: 2, plausible: [0, 1e9], unit: (lang, currency = 'UAH') => (currency === 'UAH' && lang === 'uk' ? 'грн' : currency) }", card)

    def test_visual_editor_currency_selector_is_persisted_and_explicitly_display_only(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        editor = card.split("class GridMonitorCardEditor", 1)[1].split("customElements.define('grid-monitor-card-editor'", 1)[0]
        self.assertIn('id="sel_currency"', editor)
        self.assertLess(editor.index('id="sel_lang"'), editor.index('id="sel_currency"'))
        self.assertIn("setValue('#sel_currency', ['UAH', 'EUR', 'USD'].includes(this._config.currency) ? this._config.currency : 'UAH')", editor)
        self.assertIn("this._config.currency = e.target.value", editor)
        self.assertIn("Only the label changes; numbers are not converted", card)
        self.assertIn("this._currencyUnit(key, 'UAH')", card)

    def test_night_tariff_is_conditional_in_card_and_native_dashboard(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        settings = card.split("    _settings() {", 1)[1].split("    _chipArt()", 1)[0]
        energy = card.split("    _energy() {", 1)[1].split("    _energyChartControlsHtml()", 1)[0]
        tariff = card.split("    _tariffBars() {", 1)[1].split("    _settings()", 1)[0]
        self.assertIn("twoZone ? this._setting('tariff_night'", settings)
        self.assertIn("${twoZone ? row('tariff_night', 'night', 'night-rate', night) : ''}", tariff)
        self.assertIn("${twoZone ? `<div class=\"detail tariff-state\"", energy)
        self.assertIn("${twoZone ? `<span class=\"rate-pulse\"", energy)

        dashboard = yaml.load(
            (ROOT / "home-assistant/lovelace/grid-monitor-dashboard.yaml").read_text(encoding="utf-8"),
            Loader=ESPHomeSafeLoader,
        )
        conditionals = [node for node in _walk(dashboard) if node.get("type") == "conditional"]
        night_cards = [node for node in conditionals if node.get("card", {}).get("entity") == "number.grid_monitor_tariff_night"]
        self.assertTrue(night_cards)
        self.assertEqual(night_cards[0]["conditions"][0]["entity"], "switch.grid_monitor_two_zone_tariff")
        self.assertEqual(night_cards[0]["conditions"][0]["state"], "on")

    def test_statistics_start_is_stored_in_home_assistant_helper_not_browser_storage(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        package = yaml.load(
            (ROOT / "home-assistant/packages/grid_monitor.yaml").read_text(encoding="utf-8"),
            Loader=ESPHomeSafeLoader,
        )
        self.assertIn("input_text.grid_monitor_statistics_start", card)
        self.assertIn("if (key !== 'stats_start')", card)
        self.assertIn("key === 'stats_start' ? 'grid_monitor'", card)
        self.assertIn("callService('input_text', 'set_value'", card)
        self.assertNotIn("localStorage?.setItem", card)
        self.assertEqual(card.count("localStorage"), 2)  # read and remove, only for migrating the legacy browser value
        self.assertIn("_migrateStatsStart", card)
        self.assertEqual(package["input_text"]["grid_monitor_statistics_start"]["max"], 32)
        migrate = card[card.index("_migrateStatsStart(allowLegacy) {"):card.index("_canCreateStatsStartHelper() {")]
        # The old browser date is loaded before the helper is required, so it is not dropped while the helper is missing.
        self.assertLess(migrate.index("this._legacyStatsStart()"), migrate.index("!helperReady"))
        self.assertIn("_dropLegacyStatsStart()", migrate)
        # The status line reflects the real helper state on the first render, not only after a later update.
        self.assertIn('data-role="stats-start-sync">${this._escape(this._statsSyncText())}', card)

    def test_period_picker_respects_statistics_start_and_highlights_custom_period(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        # Both the parameters and the energy picker use the statistics start as the lower bound.
        self.assertNotIn("!isEnergy && Number.isFinite(this._statsStart) ? ` min=", card)
        html = card[card.index("_chartDateRangeHtml(scope = 'params') {"):card.index("_closeChartDateRangePopover(panel = null) {")]
        self.assertIn("this._chartDateRangeMin()", html)
        apply_range = card[card.index("_applyChartDateRange(scope = 'params') {"):card.index("_setCustomChartRange(start, end")]
        # An earlier moment is moved to the start instead of producing a warning.
        self.assertIn("this._clampChartDateInput(startInput)", apply_range)
        self.assertIn("Math.max(start, this._statsStart)", apply_range)
        self.assertNotIn("chart_date_error_earlier", apply_range)
        self.assertIn("addEventListener('focusout'", card)
        # Choosing a custom period highlights the picker button of that chart only.
        controls = card[card.index("_updateChartDateRangeControls(scope = 'params') {"):card.index("_applyChartDateRange(scope = 'params') {")]
        self.assertIn("this._chartDateRangeMin()", controls)
        self.assertIn("this._syncChartPeriodHighlight(scope)", controls)
        self.assertIn("data-chart-date-toggle][data-chart-scope=\"${scope}\"]", controls)

    def test_scroll_to_top_is_fixed_and_smooth_for_home_assistant_scroll_containers(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        self.assertIn('popover="manual" data-scroll-top aria-label=', card)
        self.assertIn("document.addEventListener('scroll', this._scrollVisibilityHandler, { capture: true, passive: true })", card)
        self.assertIn("button.showPopover()", card)
        self.assertIn("this._overlapsVisibleTab(button)", card)
        self.assertIn("window.scrollTo({ top: 0, behavior: 'smooth' })", card)
        self.assertIn("scroller.scrollTo({ top: 0, behavior: 'smooth' })", card)
        self.assertIn(".back-to-top{position:fixed;", card)
        self.assertIn("const tabRects = this._visibleTabRects()", card)

    def test_plug_illustration_uses_rounded_european_pins_and_side_contacts(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        plug = card.split("    _plugArt() {", 1)[1].split("    _tariffBars()", 1)[0]
        self.assertIn('width="7" height="26" rx="3.5"', plug)
        self.assertIn("Side grounding contacts typical of a Schuko-style plug", plug)
        self.assertNotIn("Electric Plasma Arc between prongs", plug)

    def test_date_picker_uses_top_layer_and_online_indicators_are_static(self):
        import re

        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        self.assertIn('popover="auto"', card)
        self.assertIn("panel.showPopover()", card)
        self.assertIn(".chart-date-range-panel:popover-open{display:flex}", card)
        self.assertIn(".chart-date-range-panel{position:fixed;inset:auto;", card)
        self.assertIn("z-index:2147483647", card)
        self.assertNotRegex(card, r"\.dot\{[^}]*animation")
        connection_rules = re.findall(r"\.connection[^{}]*\{[^{}]*\}", card)
        self.assertTrue(connection_rules)
        self.assertTrue(all("animation" not in rule for rule in connection_rules))

    def test_settings_tab_uses_centered_gear_and_places_history_controls_in_actions(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        settings_icon = card.split("    settings: '", 1)[1].split("',", 1)[0]
        self.assertNotIn("transform=", settings_icon)
        self.assertIn("fill-rule=\"evenodd\"", settings_icon)
        self.assertIn("M24 17a7 7 0 1 0 0 14 7 7 0 1 0 0-14Z", settings_icon)
        settings = card.split("    _settings() {", 1)[1].split("    _chipArt()", 1)[0]
        action_grid = settings.split('<div class="action-grid">', 1)[1].split("</div>", 1)[0]
        self.assertIn("${this._historyCleanupActions()}", action_grid)
        self.assertEqual(action_grid.count("this._action("), 5)
        cleanup = card.split("    _historyCleanupActions() {", 1)[1].split("    _updateHistoryCleanupControls()", 1)[0]
        self.assertIn('class="action-button danger"', cleanup)
        self.assertIn("<span>${this._svg(icon)}</span>${this._escape(this._t(labelKey))}", cleanup)
        self.assertIn("data-actions-toggle", settings)
        self.assertIn("${this._actionsOpen ? '' : 'hidden'}", settings)
        self.assertIn("actions_open", card)
        self.assertNotIn("history-delete-button", card)
        self.assertNotIn("history-cleanup-actions", card)
        self.assertIn("history_cleanup_hint", settings)
        self.assertIn(".action-grid{grid-template-columns:repeat(5,minmax(0,1fr))}", card)
        self.assertIn(".action-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;overflow:visible}", card)
        self.assertIn(".action-grid .action-button:nth-child(5){grid-column:1/-1}", card)
        self.assertNotIn("minmax(104px,1fr)", card)

    def test_home_places_esp_power_scheme_in_final_pzem_banner(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        home = card.split("    _home() {", 1)[1].split("    _id(", 1)[0]
        self.assertIn('class="card info info-system"', home)
        self.assertNotIn('class="info-system-section"', home)
        self.assertEqual(home.count('data-role="home-mains"'), 1)
        self.assertEqual(home.count('data-role="esp-power-label"'), 1)
        pzem_card = home.split('class="card info info-system"', 1)[1].split('</div></div>', 1)[0]
        self.assertNotIn('data-role="esp-power-label"', pzem_card)
        banner = home.split('class="card banner ', 1)[1]
        self.assertIn('data-role="home-banner-label"', banner)
        self.assertIn('data-role="esp-power-label"', banner)
        self.assertIn('data-role="esp-power-note"', banner)
        self.assertIn(".bottom-status{grid-template-columns:repeat(4,minmax(0,1fr))", card)

    def test_mobile_layout_prioritizes_voltage_and_avoids_horizontal_action_scrolling(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        self.assertIn(".home-view .main-grid>.voltage{grid-column:1;grid-row:1}", card)
        self.assertIn(".home-view .main-right>.metrics{grid-column:1;grid-row:2}", card)
        self.assertIn(".voltage-gauge{width:min(100%,410px);margin:-7px 0 -4px;transform:translateY(-4px)}", card)
        self.assertIn(".voltage-brand,.voltage-gauge,.state-indicator{transform:translateY(-4px)}", card)
        self.assertIn(".detail-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}", card)
        self.assertIn(".settings-grid{grid-template-columns:1fr}", card)

    def test_voltage_panel_reduces_vertical_padding_and_lowers_caption(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        self.assertIn('<text x="250" y="298" text-anchor="middle" class="voltage-label">', card)
        self.assertIn('viewBox="0 0 500 342"', card)
        self.assertIn('y="334" text-anchor="middle" class="gauge-end"', card)
        self.assertIn(".voltage{padding:5px 12px 4px;justify-content:space-between}", card)
        self.assertIn("@container (max-width:760px){.voltage{padding:5px 10px 4px}}", card)

    def test_non_home_header_aligns_with_menu_and_reduces_content_gap(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        self.assertIn(".shell:not(.home-active)>.header{align-items:flex-start;padding-bottom:1px;z-index:2}", card)
        self.assertIn("@container (max-width:959px){.shell:not(.home-active)>.header{padding-bottom:1px}.shell:not(.home-active)>.header>.tabs-top{margin-bottom:0}}", card)
        self.assertIn(".shell:not(.home-active)>.header>.tabs-top{margin:0 0 4px}", card)

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
        self.assertIn(".shell:not(.home-active)>.page-layout{display:block;margin-top:-40px}", card)
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
        self.assertIn("metricKey === 'power' ? plottedPoints.filter((point) => point.v > 0) : plottedPoints", card)
        self.assertIn("this._historyBounds(range)", card)
        self.assertIn("_chartDateRangeHtml()", card)
        self.assertIn('type="datetime-local" ${startKey}', card)
        self.assertIn("isEnergy ? 'data-energy-chart-date-start' : 'data-chart-date-start'", card)
        self.assertNotIn("data-chart-zoom=\"in\"", card)
        self.assertIn("chart_date_range", card)
        self.assertIn("this._chartPointerDistance(points)", card)
        self.assertIn("this._setCustomChartRange(start, end)", card)
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
        self.assertIn("this._activeTab === 'energy' ? '[data-energy-plot]' : '[data-role=\"chart-plot\"]'", card)
        self.assertIn("if (this._activeTab === 'energy') this._refreshEnergyCharts()", card)

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

    def test_house_night_scene_and_tower_artwork_without_sheen(self):
        card = (ROOT / "grid-monitor-card.js").read_text(encoding="utf-8")
        # Tower artwork must not contain the left diagonal sheen glare streak
        self.assertNotIn("id('sheen')", card)
        self.assertNotIn("sheen", card)
        # House artwork must contain the night scene elements
        self.assertIn("house-night-scene", card)
        self.assertIn("houseSky", card)
        self.assertIn("poleWood", card)
        self.assertIn("house-wire-pulse", card)
        self.assertIn("houseWireFlow", card)
        self.assertIn(".shell.eco .house-wire-pulse{animation:none!important}", card)


if __name__ == "__main__":
    unittest.main()
