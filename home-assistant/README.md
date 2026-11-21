# Home Assistant interface

This folder contains the native Lovelace fallback for the ESPHome Grid Monitor. The repository root also contains the recommended HACS frontend card, [`grid-monitor-card.js`](../grid-monitor-card.js).

## Recommended: install the HACS card

Open **HACS → Frontend → Custom repositories**, add `https://github.com/kdinya/ha-Smart-Grid-Monitor` as **Dashboard / Lovelace**, and install **Smart Grid Monitor Card**. HACS registers the root-level `grid-monitor-card.js` resource. After a browser refresh, add:

```yaml
type: custom:grid-monitor-card
language: uk
```

The default entity IDs use the `grid_monitor` prefix. Use `prefix: another_device_slug` if the ESPHome device has a different name. The card supports Ukrainian and English, follows the Home Assistant locale when `language` is omitted, and renders unavailable or missing entities safely.

## Dependency-free dashboard

1. Open Home Assistant and create a dashboard from **Settings → Dashboards → Add dashboard**.
2. Open the dashboard menu and choose **Edit Dashboard → Raw configuration editor**.
3. Paste [`lovelace/grid-monitor-dashboard.yaml`](lovelace/grid-monitor-dashboard.yaml).
4. Save and open the **Мережа** view.

The dashboard assumes the default Home Assistant entity prefix `grid_monitor`. If your device has a different prefix, replace `grid_monitor_` in the YAML with the entity prefix shown under **Developer Tools → States**.

## Optional source-status and health entities

The package in [`packages/grid_monitor.yaml`](packages/grid_monitor.yaml) adds a friendly source-status sensor that distinguishes PZEM online with ESP supply unconfirmed, PZEM offline with source unknown, and waiting for PZEM. It also creates `input_text.grid_monitor_statistics_start`, which lets the HACS card store the statistics-start timestamp in Home Assistant and sync it across clients. It never reports `Grid Monitor Healthy` while ESP, PZEM telemetry, or voltage quality is unknown or unavailable; a PZEM timeout is never called inverter operation.

To enable it, add packages to `configuration.yaml`:

```yaml
homeassistant:
  packages: !include_dir_named packages
```

Copy the package into the configured packages directory, run **Settings → System → Check configuration**, and restart Home Assistant. If packages are already enabled, copy only the file into that directory. The statistics-start control remains usable without the helper, but it will not persist across reloads or devices until the package is enabled.

## Entity coverage

The card's Parameters tab charts power and voltage; the Energy tab uses one chart with an Energy/Cost selector for cumulative energy and cost. The native view covers live voltage, current, power, frequency and power factor; apparent and reactive power, phase angle and voltage deviation; five-minute average, daily min/max and daily peak values; today/month/total energy and cost; current tariff and cost rate; sag and swell counters; PZEM communication outage counters and durations; PZEM, ESP and voltage alarm states; thresholds, nominal voltage, tariffs and two-zone tariff; Wi-Fi, uptime, ESP temperature, IP and SSID diagnostics; and reset/restart actions. The night tariff control appears only while `switch.grid_monitor_two_zone_tariff` is on.

## Design notes

The visual language follows the supplied reference: dark navy surfaces, electric-blue accents, green healthy state, amber unknown-source warning, a prominent voltage gauge, metric tiles and grouped energy, quality, event, settings and diagnostic sections. The native dashboard intentionally remains available because it can be restored without a custom JavaScript resource.
