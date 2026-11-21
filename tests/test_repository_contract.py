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
        self.assertIn("@container (min-width:960px)", card)
        self.assertIn(".shell.home-active>.tabs-top{display:none}", card)
        self.assertIn(".home-view .main-grid>.tabs-side{display:grid;grid-column:2;grid-row:1;", card)

    def test_dashboard_shows_explicit_voltage_status_not_stale_alarm(self):
        dashboard = yaml.load(
            (ROOT / "home-assistant/lovelace/grid-monitor-dashboard.yaml").read_text(encoding="utf-8"),
            Loader=ESPHomeSafeLoader,
        )
        quality_tiles = [node for node in _walk(dashboard) if node.get("name") == "Якість напруги"]
        self.assertTrue(quality_tiles, "Expected a voltage quality tile")
        self.assertEqual(quality_tiles[0].get("entity"), "sensor.grid_monitor_voltage_status")


if __name__ == "__main__":
    unittest.main()
