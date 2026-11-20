# Home Assistant interface

This folder adds a polished Home Assistant interface for the ESPHome Grid Monitor. It uses native Lovelace cards, so there are no HACS or frontend JavaScript dependencies to install.

## Install the dashboard

1. Open Home Assistant and create a new dashboard from **Settings → Dashboards → Add dashboard**.
2. Open the dashboard menu, choose **Edit Dashboard → Raw configuration editor**.
3. Paste the content of [`lovelace/grid-monitor-dashboard.yaml`](lovelace/grid-monitor-dashboard.yaml).
4. Save and open the new **Мережа** view.

The dashboard assumes the default Home Assistant entity prefix `grid_monitor`. If your device has a different prefix, replace `grid_monitor_` in the YAML with the entity prefix shown under **Developer Tools → States**.

## Optional source-of-power sensor

The package in [`packages/grid_monitor.yaml`](packages/grid_monitor.yaml) adds a single friendly sensor with four states: `Мережа`, `Інвертор`, `Немає напруги або немає зв'язку з ESP`, and `Визначається`.

To enable it, add packages to `configuration.yaml`:

```yaml
homeassistant:
  packages: !include_dir_named packages
```

Copy the package into the configured packages directory, run **Settings → System → Check configuration**, and restart Home Assistant. If packages are already enabled, copy only the file into that directory.

## Entity coverage

The view exposes all entities produced by `esphome/grid-monitor.yaml`:

- live voltage, current, power, frequency and power factor;
- apparent, reactive and peak power, phase angle and voltage deviation;
- five-minute average, daily min/max and daily peak values;
- today/month/total energy and today/month/total cost;
- current tariff and cost rate;
- sag, swell and inverter counters and durations;
- `Mains Present`, `On Inverter`, ESP status and voltage alarm;
- thresholds, nominal voltage, tariffs and two-zone tariff switch;
- Wi-Fi, uptime, ESP temperature, IP and SSID diagnostics;
- reset and restart actions with confirmation prompts.

## Design notes

The layout follows the supplied reference: dark navy surfaces, electric-blue accents, green health state, amber inverter state, a prominent voltage gauge, metric tiles, a history graph and separate energy, event, configuration and diagnostics groups. The implementation intentionally favors stable built-in cards over a custom card dependency, which makes it easier to restore and maintain on a new Home Assistant installation.
