import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "esphome"))
from check_secrets import read_flat_yaml, validate  # noqa: E402


class CheckSecretsTests(unittest.TestCase):
    def _write(self, body: str) -> Path:
        handle = tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False)
        self.addCleanup(lambda: Path(handle.name).unlink(missing_ok=True))
        handle.write(body)
        handle.close()
        return Path(handle.name)

    def _base(self, fallback: str, ota: str, wifi: str = "wifi-secret") -> str:
        return (
            'wifi_ssid: "grid"\n'
            f'wifi_password: "{wifi}"\n'
            f'fallback_password: "{fallback}"\n'
            'api_key: "encryption-key"\n'
            f'ota_password: "{ota}"\n'
        )

    def test_decodes_escapes_before_password_length_check(self):
        path = self._write(
            'wifi_ssid: "grid"\n'
            'wifi_password: "wifi-secret"\n'
            'fallback_password: "' + r'\x61' * 8 + '"\n'
            'api_key: "encryption-key"\n'
            'ota_password: "0123456789abcdef"\n'
        )
        self.assertIn(
            "Use a unique password of at least 16 characters for: fallback_password",
            validate(path),
        )

    def test_compares_decoded_values_for_password_reuse(self):
        path = self._write(self._base(r'\x61' * 16, "a" * 16))
        self.assertIn(
            "fallback_password and ota_password must be different",
            validate(path),
        )

    def test_preserves_hash_inside_quoted_scalar_and_strips_comment(self):
        path = self._write(
            'wifi_ssid: "grid #1" # comment\n'
            'wifi_password: "wifi-secret" # comment\n'
            'fallback_password: "abcdefghijklmnop#x" # comment\n'
            'api_key: "encryption-key" # comment\n'
            'ota_password: "qrstuvwxyzABCDEF" # comment\n'
        )
        values = read_flat_yaml(path)
        self.assertEqual(values["wifi_ssid"], "grid #1")
        self.assertEqual(values["fallback_password"], "abcdefghijklmnop#x")
        self.assertEqual(validate(path), [])

    def test_reports_parse_errors_without_echoing_secret_text(self):
        secret = "super-secret-value"
        path = self._write(f'fallback_password: "{secret}\n')
        errors = validate(path)
        self.assertEqual(errors, ["Invalid YAML syntax in secrets file"])
        self.assertNotIn(secret, " ".join(errors))


if __name__ == "__main__":
    unittest.main()
