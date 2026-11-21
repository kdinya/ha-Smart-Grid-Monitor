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

The package in [`packages/grid_monitor.yaml`](packages/grid_monitor.yaml) adds a friendly source-status sensor that distinguishes PZEM online with ESP supply unconfirmed, PZEM offline with source unknown, and waiting for PZEM. It also defines `input_text.grid_monitor_statistics_start`, which lets the HACS card store the statistics-start timestamp in Home Assistant and sync it across clients. This helper ID is canonical and does not change with a custom ESPHome prefix. The source-status sensor never reports `Grid Monitor Healthy` while ESP, PZEM telemetry, or voltage quality is unknown or unavailable; a PZEM timeout is never called inverter operation.

To enable it, add packages to `configuration.yaml`:

```yaml
homeassistant:
  packages: !include_dir_named packages
```

Copy the package into the configured packages directory, run **Settings → System → Check configuration**, and restart Home Assistant. If packages are already enabled, copy only the file into that directory. Alternatively, an administrator can create the statistics helper directly from the card's **Settings → Statistics** section using **Create helper**; the card uses Home Assistant's storage-backed helper creation and no YAML edit is needed. Without a helper, the date is held only by the current card instance and will not persist across reloads or devices.

## Delete this card's Home Assistant history

In the HACS card's **Settings** tab, the **Home Assistant history and statistics** section has separate buttons for Recorder history and Home Assistant statistics. Both actions require administrator permissions and show a confirmation. Create a Home Assistant backup first: deleted data cannot be recovered from the card.

**Delete Recorder history** calls `recorder.purge_entities` with `keep_days: 0`, targeting only the sensor and binary-sensor entities currently resolved by this card. It does not purge the whole Recorder database. **Delete HA statistics** separately clears short-term and long-term statistics for the card's sensor entities. Long-term statistics are not removed by Recorder history purge, so use the second button only when you also intend to delete those aggregates. These buttons do not reset ESPHome counters; use the existing **Reset PZEM Energy**, **Reset Cost Counters**, and other device reset actions for that.

## Entity coverage

The card's Parameters tab charts power and voltage; the Energy tab uses one chart with an Energy/Cost selector for cumulative energy and cost. The native view covers live voltage, current, power, frequency and power factor; apparent and reactive power, phase angle and voltage deviation; five-minute average, daily min/max and daily peak values; today/month/total energy and cost; current tariff and cost rate; sag and swell counters; PZEM communication outage counters and durations; PZEM, ESP and voltage alarm states; thresholds, nominal voltage, tariffs and two-zone tariff; Wi-Fi, uptime, ESP temperature, IP and SSID diagnostics; and reset/restart actions. The night tariff control appears only while `switch.grid_monitor_two_zone_tariff` is on.

## Design notes

The visual language follows the supplied reference: dark navy surfaces, electric-blue accents, green healthy state, amber unknown-source warning, a prominent voltage gauge, metric tiles and grouped energy, quality, event, settings and diagnostic sections. The native dashboard intentionally remains available because it can be restored without a custom JavaScript resource.
