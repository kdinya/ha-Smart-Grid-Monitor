#!/usr/bin/env python3
"""Reject missing or example ESPHome secrets without printing secret values."""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REQUIRED = ("wifi_ssid", "wifi_password", "fallback_password", "api_key", "ota_password")
PLACEHOLDERS = (
    "replace_with",
    "changemefallback",
    "changemeota",
    "yourwifi",
    "generate-with-esphome-or-openssl-rand-base64-32",
)
PASSWORD_KEYS = ("fallback_password", "ota_password")


def _strip_yaml_comment(value: str) -> str:
    """Strip a YAML comment outside a quoted scalar without losing literal # characters."""
    quote = value[0] if value.startswith(("\"", "'")) else None
    index = 0
    while index < len(value):
        char = value[index]
        if quote == "\"" and char == "\\":
            index += 2
            continue
        if quote == "'" and char == "'" and index + 1 < len(value) and value[index + 1] == "'":
            index += 2
            continue
        if quote and char == quote:
            quote = None
        elif not quote and char == "#" and (index == 0 or value[index - 1].isspace()):
            return value[:index].rstrip()
        index += 1
    return value.strip()


def read_flat_yaml(path: Path) -> dict[str, str]:
    """Read the simple top-level key/value shape used by ESPHome secrets.yaml."""
    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        match = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*?)\s*$", line)
        if not match:
            continue
        key, raw_value = match.groups()
        value = _strip_yaml_comment(raw_value)
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key] = value
    return values


def validate(path: Path) -> list[str]:
    if not path.is_file():
        return [f"Missing {path}; copy secrets.example.yaml to secrets.yaml and fill it in."]
    values = read_flat_yaml(path)
    problems = [f"Missing required key: {key}" for key in REQUIRED if not values.get(key, "").strip()]
    for key in REQUIRED:
        value = values.get(key, "").strip().lower()
        if value and any(marker in value for marker in PLACEHOLDERS):
            problems.append(f"Replace the example placeholder for: {key}")
    for key in PASSWORD_KEYS:
        value = values.get(key, "").strip()
        if value and not any(marker in value.lower() for marker in PLACEHOLDERS) and len(value) < 16:
            problems.append(f"Use a unique password of at least 16 characters for: {key}")
    fallback = values.get("fallback_password", "").strip()
    ota = values.get("ota_password", "").strip()
    wifi = values.get("wifi_password", "").strip()
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
