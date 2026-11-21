# Smart Grid Monitor

ESPHome firmware and Home Assistant interfaces for an ESP32-C3 + PZEM-004T v3.0 household grid monitor. The project reports live voltage, current, power, frequency, power factor, energy, cost, grid-quality events, PZEM communication outages, diagnostics, configuration controls and safe reset actions.

The repository now provides two supported interface paths. The recommended path is the HACS-installable `Smart Grid Monitor Card`, a responsive dark-neon frontend card. The dependency-free native Lovelace dashboard remains available as a fallback for installations where custom frontend resources are not desired.

The **Parameters** tab contains the power and voltage history charts. The **Energy** tab contains one bar chart with an **Energy / Cost** selector. It distributes increases from Home Assistant history of the cumulative counters into local-time hourly bars for periods under a day and for the Day view, and into one bar per local date for Week, Month and longer custom periods. It includes the final live increment, accounts for counter resets, and converts a Wh energy entity to the chart's kWh display unit. Energy and cost history is limited to data at or after the Statistics start; the Energy period selector remains independent of the Parameters chart.
Energy normalization accepts Wh, kWh and MWh. A missing or unsupported energy unit is reported explicitly instead of being silently treated as kWh.

The visual editor offers UAH/грн, EUR and USD display labels for cost figures. This is a label-only preference: it does not convert the stored UAH amounts, and tariff inputs remain in UAH/kWh.

## Preview

| Home (desktop) | Home (phone) |
| --- | --- |
| ![Home dashboard](docs/screenshots/home-desktop.jpg) | ![Home dashboard on a phone](docs/screenshots/home-mobile.jpg) |

| Parameters | Settings and diagnostics |
| --- | --- |
| ![Parameters tab](docs/screenshots/parameters-desktop.jpg) | ![Settings tab](docs/screenshots/settings-desktop.jpg) |

The previews are rendered from the card with sample data; they are not live Home Assistant captures.

## ESPHome setup and secret safety

1. Copy `esphome/secrets.example.yaml` to `esphome/secrets.yaml`.
2. Replace every `REPLACE_WITH_…` placeholder with your own values before compiling or flashing. Use different passwords for the fallback access point and OTA, each at least 16 characters; do not reuse the template or the Wi-Fi password.
3. Run `python3 esphome/check_secrets.py` from the repository root. The check reports missing or placeholder keys without printing any secret values.
4. Compile and flash with ESPHome after the check passes. The secret preflight uses PyYAML, which is included in an ESPHome Python environment; otherwise install the test dependency with `python3 -m pip install -r requirements-test.txt`.

Run the repository's fast local checks before opening a pull request:

```bash
python3 -m pip install -r requirements-test.txt
node --check grid-monitor-card.js
python3 -m unittest discover -s tests -v
```

After updating the firmware, the communication entities are `binary_sensor.grid_monitor_pzem_online`, `binary_sensor.grid_monitor_pzem_offline`, and `sensor.grid_monitor_power_source_status`. `binary_sensor.grid_monitor_on_inverter` is no longer provided because the project has no independent inverter/ATS input. Update any external automations that relied on the old inferred inverter entity.

## HACS installation

1. Open **HACS → Frontend → Custom repositories**.
2. Add `https://github.com/kdinya/ha-Smart-Grid-Monitor` and select **Dashboard / Lovelace**.
3. Install **Smart Grid Monitor Card**.
4. Refresh the Home Assistant browser or companion app. HACS normally registers the JavaScript resource automatically.
5. Add a manual card with the example below, or use the card picker.

```yaml
type: custom:grid-monitor-card
```

The card uses the default ESPHome prefix `grid_monitor`. If the device has another name, set `prefix` or provide explicit entity overrides:

```yaml
type: custom:grid-monitor-card
language: uk
name: Електрика будинку
prefix: grid_monitor
esp_power_mode: after_avr
```

`language` accepts `uk` or `en`. If omitted, the card follows the Home Assistant language when it can detect it. `currency` accepts `UAH`, `EUR` or `USD`, defaults to `UAH`, and changes the displayed label only; it does not convert values. `esp_power_mode` accepts `grid_shared`, `after_avr` or `independent` and defaults to `after_avr`. It describes how the ESP is powered; PZEM readings remain measurements of the mains in every mode, and the card does not infer the ESP supply from grid sensors. The card safely displays missing, unavailable and unknown entities instead of failing the whole dashboard. Loss of PZEM communication is reported as unavailable telemetry and an unknown power source; it is not treated as proof that the ESP is running from an inverter. The current firmware has no independent ATS/inverter confirmation input. Reset and restart actions ask for confirmation before calling the corresponding ESPHome button service.

### Power-saving mode

On low-end tablets the continuous glow animations and background blur can keep the CPU, GPU and battery busy. Set `performance: true` (or use the *Power-saving mode* switch in the visual editor) to turn off continuous animations, background blur and glow effects; the layout, colours and data are unchanged:

```yaml
type: custom:grid-monitor-card
performance: true
```

The option is off by default. Independently of it, the card follows the system `prefers-reduced-motion` setting. While the page is in the background or the card is out of view, the card pauses its history and statistics requests and resumes them when it becomes visible again. The *statistics start* min/max values are loaded in full once and then refreshed with only the new history.

Card display options such as the name, ESPHome prefix, language, ESP power arrangement and entity overrides belong to the Lovelace dashboard configuration, not to browser-local storage. Storage-mode dashboards keep that configuration in Home Assistant so the same dashboard uses it on each client; YAML-mode dashboards keep it in the dashboard YAML. ESPHome device settings such as voltage thresholds, tariff values and the two-zone switch are separate device entities and already use ESPHome restore settings, so they persist on the controller across restarts. The statistics-start selection is stored by Home Assistant in `input_text.grid_monitor_statistics_start` when the optional package is enabled; that helper ID remains the same even when the ESPHome prefix is customized. See the package instructions below.

## Manual card installation

Download `grid-monitor-card.js` into `<config>/www/`, add `/local/grid-monitor-card.js` as a **JavaScript module** under **Settings → Dashboards → Resources**, then refresh the browser. HACS is preferred because it manages the resource and updates.

## Native dashboard fallback

Copy [`home-assistant/lovelace/grid-monitor-dashboard.yaml`](home-assistant/lovelace/grid-monitor-dashboard.yaml) into a dashboard's raw configuration editor. It uses only built-in Home Assistant cards and has no HACS dependency. Installation details and the optional source-status, health and cross-device statistics helper package are in [`home-assistant/README.md`](home-assistant/README.md).

## Repository layout

```text
esphome/
  grid-monitor.yaml       # ESPHome firmware
  secrets.example.yaml    # safe secret names and placeholders
home-assistant/
  lovelace/                # native dependency-free dashboard
  packages/                # optional source/health sensors and statistics helper
grid-monitor-card.js       # HACS Lovelace card
docs/
  design-grid-monitor.md   # visual sketch and interaction decisions
AGENTS.md                  # repository contribution and AI rules
hacs.json                  # HACS frontend metadata
```

## Coverage

Both interfaces cover the firmware's live electrical values, energy and cost counters, tariff settings, voltage quality, daily minimum and maximum values, PZEM communication outage counts and durations, ESP diagnostics, configuration numbers, two-zone tariff switch, reset buttons (including the daily min/max reset) and restart button. The frontend reads entities exposed by ESPHome; it does not infer inverter operation from a PZEM timeout.

## Statistics start

In the card's **Settings** tab, the **Statistics** section lets you pick a date and time. After applying it, Energy and Cost charts exclude data before that moment; the Parameters chart gets a «From HH:MM» period, and minimum, maximum and peak values on the tiles and range cards are calculated from Home Assistant history since then. Clearing the field returns the charts to their regular ranges and the tiles to firmware daily values. With the optional package enabled, Home Assistant stores the ISO timestamp in `input_text.grid_monitor_statistics_start`, so it follows the dashboard across devices and browser sessions, including cards configured with a custom ESPHome prefix. Without the helper, the selection is session-only and is lost when the card reloads. The setting limits Energy data but does not change the Energy tab's selected hour/day/week/month/custom period.

To delete the card's Recorder history or long-term sensor statistics, use the matching confirmation button in **Settings → Actions**. These buttons use the same layout and styling as the other action buttons, and target only entities referenced by this card; they do not clear the entire Recorder database.

## Electrical safety

The PZEM module is connected to mains-voltage wiring. Use an enclosed, strain-relieved installation, keep the low-voltage and mains sections isolated, and work only with the breaker disconnected. Have a qualified electrician verify the CT and mains wiring if anything is uncertain.

## Development workflow

Use focused feature branches and pull requests. Run `node --check grid-monitor-card.js`, validate `hacs.json`, run the ESPHome-secret-aware YAML checks when YAML changes, and run `git diff --check` before pushing. Never commit `esphome/secrets.yaml`, credentials or access tokens.

## License

See [LICENSE](LICENSE).
