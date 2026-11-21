import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ChartHistoryTests(unittest.TestCase):
    def test_history_buckets_are_duration_weighted_and_skip_unavailable_intervals(self):
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
  { t: 25, v: 140 },
  { t: 75, v: 200 },
]));
"""
        result = subprocess.run(
            ["node", "-e", script, str(ROOT / "grid-monitor-card.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr or result.stdout)


if __name__ == "__main__":
    unittest.main()
