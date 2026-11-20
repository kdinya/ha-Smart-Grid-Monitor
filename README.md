# Smart Grid Monitor

ESPHome firmware and Home Assistant dashboard for an ESP32-C3 + PZEM-004T v3.0 household grid monitor.

The project combines reliable local measurements with a polished, Ukrainian-first Home Assistant interface inspired by the supplied dark neon reference. It reports live voltage, current, power, frequency, power factor, energy, cost, grid-quality events, inverter periods, diagnostics, configuration controls and safe reset actions.

## Repository layout

```text
esphome/
  grid-monitor.yaml       # ESPHome firmware
  secrets.example.yaml    # secret names and safe placeholders
home-assistant/
  lovelace/                # ready-to-paste native Lovelace dashboard
  packages/                # optional derived source/health sensors
docs/
  design-grid-monitor.md   # visual sketch and interaction decisions
```

## Quick start

1. Copy `esphome/secrets.example.yaml` to `esphome/secrets.yaml` and fill in your local values. Never commit `secrets.yaml`.
2. Compile and flash `esphome/grid-monitor.yaml` with ESPHome.
3. Add the ESPHome device to Home Assistant through the native ESPHome integration.
4. Follow [`home-assistant/README.md`](home-assistant/README.md) to add the dashboard.
5. Optionally enable the source-of-power package for a single friendly status sensor.

The dashboard uses only built-in Home Assistant Lovelace cards. No HACS dependency, external CDN, custom JavaScript resource or cloud service is required.

## Electrical safety

The PZEM module is connected to mains-voltage wiring. Use an enclosed, strain-relieved installation, keep the low-voltage and mains sections isolated, and work only with the breaker disconnected. Have a qualified electrician verify the CT and mains wiring if anything is uncertain.

## Development workflow

Changes are developed on feature branches and reviewed through pull requests. Keep firmware changes, Home Assistant presentation changes and documentation changes independently understandable. Run the ESPHome configuration check before merging firmware edits and use Home Assistant's **Check configuration** before enabling package changes.

## License

See [LICENSE](LICENSE).
