#!/usr/bin/env python3
"""Reject missing or example ESPHome secrets without printing secret values."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import yaml

REQUIRED = ("wifi_ssid", "wifi_password", "fallback_password", "api_key", "ota_password")
PLACEHOLDERS = (
    "replace_with",
    "changemefallback",
    "changemeota",
    "yourwifi",
    "generate-with-esphome-or-openssl-rand-base64-32",
)
PASSWORD_KEYS = ("fallback_password", "ota_password")


def read_flat_yaml(path: Path) -> dict[str, object]:
    """Parse secrets as YAML so quoted escapes and comments match ESPHome semantics."""
    try:
        values = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError:
        # Parser diagnostics may include source lines, which can contain secret values.
        raise ValueError("Invalid YAML syntax in secrets file") from None
    if values is None:
        return {}
    if not isinstance(values, dict):
        raise ValueError("Secrets file must contain a top-level mapping")
    return {key: value for key, value in values.items() if isinstance(key, str)}


def validate(path: Path) -> list[str]:
    if not path.is_file():
        return [f"Missing {path}; copy secrets.example.yaml to secrets.yaml and fill it in."]
    try:
        values = read_flat_yaml(path)
    except (OSError, ValueError) as error:
        return [str(error)]

    problems: list[str] = []
    for key in REQUIRED:
        value = values.get(key)
        if value is None or (isinstance(value, str) and not value.strip()):
            problems.append(f"Missing required key: {key}")
        elif not isinstance(value, str):
            problems.append(f"Use a quoted string for: {key}")

    for key in REQUIRED:
        raw = values.get(key)
        if not isinstance(raw, str):
            continue
        value = raw.strip().lower()
        if value and any(marker in value for marker in PLACEHOLDERS):
            problems.append(f"Replace the example placeholder for: {key}")
    for key in PASSWORD_KEYS:
        raw = values.get(key)
        if not isinstance(raw, str):
            continue
        value = raw.strip()
        if value and not any(marker in value.lower() for marker in PLACEHOLDERS) and len(value) < 16:
            problems.append(f"Use a unique password of at least 16 characters for: {key}")
    fallback = values.get("fallback_password", "")
    ota = values.get("ota_password", "")
    wifi = values.get("wifi_password", "")
    fallback = fallback.strip() if isinstance(fallback, str) else ""
    ota = ota.strip() if isinstance(ota, str) else ""
    wifi = wifi.strip() if isinstance(wifi, str) else ""
    if fallback and ota and fallback == ota:
        problems.append("fallback_password and ota_password must be different")
    if fallback and wifi and fallback == wifi:
        problems.append("fallback_password and wifi_password must be different")
    if ota and wifi and ota == wifi:
        problems.append("ota_password and wifi_password must be different")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, default=Path(__file__).with_name("secrets.yaml"))
    args = parser.parse_args()
    problems = validate(args.file)
    if problems:
        for problem in problems:
            print(f"ERROR: {problem}", file=sys.stderr)
        return 1
    print("ESPHome secrets check passed. Secret values were not displayed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
