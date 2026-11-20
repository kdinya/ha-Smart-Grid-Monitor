/* Smart Grid Monitor Card — live Home Assistant dashboard with Visual Editor & Realistic Vector Art */
(() => {
  window.customCards = window.customCards || [];
  if (!window.customCards.some((card) => card.type === 'grid-monitor-card')) {
    window.customCards.push({
      type: 'grid-monitor-card',
      name: 'Smart Grid Monitor Card',
      description: 'Live Ukrainian/English ESPHome energy dashboard with visual editor',
      preview: true,
      documentationURL: 'https://github.com/kdinya/ha-Smart-Grid-Monitor',
    });
  }

  const DEFAULTS = {
    voltage: 'sensor.grid_monitor_voltage',
    current: 'sensor.grid_monitor_current',
    power: 'sensor.grid_monitor_power',
    frequency: 'sensor.grid_monitor_frequency',
    power_factor: 'sensor.grid_monitor_power_factor',
    voltage_status: 'sensor.grid_monitor_voltage_status',
    mains: 'binary_sensor.grid_monitor_mains_present',
    inverter: 'binary_sensor.grid_monitor_on_inverter',
    esp_status: 'binary_sensor.grid_monitor_esp_status',
    voltage_alarm: 'binary_sensor.grid_monitor_voltage_out_of_range',
    energy_total: 'sensor.grid_monitor_energy_total',
    energy_today: 'sensor.grid_monitor_energy_today',
    energy_month: 'sensor.grid_monitor_energy_month',
    cost_today: 'sensor.grid_monitor_cost_today',
    cost_month: 'sensor.grid_monitor_cost_month',
    cost_total: 'sensor.grid_monitor_cost_total',
    tariff: 'sensor.grid_monitor_current_tariff',
    cost_rate: 'sensor.grid_monitor_cost_rate',
    apparent_power: 'sensor.grid_monitor_apparent_power',
    reactive_power: 'sensor.grid_monitor_reactive_power',
    phase_angle: 'sensor.grid_monitor_phase_angle',
    voltage_deviation: 'sensor.grid_monitor_voltage_deviation',
    voltage_average: 'sensor.grid_monitor_voltage_5min_average',
    voltage_min: 'sensor.grid_monitor_voltage_min_today',
    voltage_max: 'sensor.grid_monitor_voltage_max_today',
    current_max: 'sensor.grid_monitor_current_max_today',
    power_peak: 'sensor.grid_monitor_power_peak_today',
    sag_count: 'sensor.grid_monitor_sag_count',
    swell_count: 'sensor.grid_monitor_swell_count',
    inverter_events: 'sensor.grid_monitor_inverter_events',
    inverter_current_duration: 'sensor.grid_monitor_inverter_current_duration',
    last_inverter_duration: 'sensor.grid_monitor_last_inverter_duration',
    total_inverter_time: 'sensor.grid_monitor_total_inverter_time',
    wifi_signal: 'sensor.grid_monitor_wifi_signal',
    uptime: 'sensor.grid_monitor_uptime',
    esp_temperature: 'sensor.grid_monitor_esp_temperature',
    ip_address: 'sensor.grid_monitor_ip_address',
    ssid: 'sensor.grid_monitor_connected_ssid',
    sag_threshold: 'number.grid_monitor_sag_threshold',
    swell_threshold: 'number.grid_monitor_swell_threshold',
    nominal_voltage: 'number.grid_monitor_nominal_voltage',
    tariff_day: 'number.grid_monitor_tariff_day',
    tariff_night: 'number.grid_monitor_tariff_night',
    two_zone: 'switch.grid_monitor_two_zone_tariff',
    reset_energy: 'button.grid_monitor_reset_pzem_energy',
    reset_events: 'button.grid_monitor_reset_event_counters',
    reset_cost: 'button.grid_monitor_reset_cost_counters',
    restart: 'button.grid_monitor_restart',
  };

  const ALIAS_SUFFIXES = {
    voltage: ['voltage', 'grid_voltage', 'pzem_voltage', 'pzem0_voltage'],
    current: ['current', 'grid_current', 'pzem_current', 'pzem0_current'],
    power: ['power', 'grid_power', 'pzem_power', 'pzem0_power'],
    frequency: ['frequency', 'grid_freq', 'grid_frequency', 'pzem_frequency'],
    power_factor: ['power_factor', 'grid_pf', 'pzem_power_factor'],
    energy_total: ['energy_total', 'grid_energy', 'energy', 'pzem_energy'],
    energy_today: ['energy_today', 'grid_energy_today'],
    energy_month: ['energy_month', 'grid_energy_month'],
    cost_today: ['cost_today'],
    cost_month: ['cost_month'],
    cost_total: ['cost_total'],
    tariff: ['current_tariff', 'cur_tariff', 'tariff'],
    cost_rate: ['cost_rate'],
    apparent_power: ['apparent_power'],
    reactive_power: ['reactive_power'],
    phase_angle: ['phase_angle'],
    voltage_deviation: ['voltage_deviation'],
    voltage_average: ['voltage_5min_average', 'voltage_average'],
    voltage_min: ['voltage_min_today', 'voltage_min', 'min_voltage'],
    voltage_max: ['voltage_max_today', 'voltage_max', 'max_voltage'],
    current_max: ['current_max_today', 'current_max', 'max_current'],
    power_peak: ['power_peak_today', 'power_peak', 'peak_power'],
    sag_count: ['sag_count'],
    swell_count: ['swell_count'],
    inverter_events: ['inverter_events', 'outage_count'],
    inverter_current_duration: ['inverter_current_duration'],
    last_inverter_duration: ['last_inverter_duration', 'last_outage_s'],
    total_inverter_time: ['total_inverter_time', 'outage_total_s'],
    wifi_signal: ['wifi_signal', 'wifi_rssi', 'rssi'],
    uptime: ['uptime', 'esp_uptime'],
    esp_temperature: ['esp_temperature', 'internal_temperature', 'temperature'],
    ip_address: ['ip_address', 'wifi_ip_address'],
    ssid: ['connected_ssid', 'wifi_ssid', 'ssid'],
    voltage_status: ['voltage_status'],
    mains: ['mains_present', 'bin_mains_present', 'grid_present'],
    inverter: ['on_inverter', 'bin_on_inverter', 'inverter_active'],
    esp_status: ['esp_status', 'status'],
    voltage_alarm: ['voltage_out_of_range', 'bin_v_out_of_range'],
    sag_threshold: ['sag_threshold', 'th_low', 'sag_limit'],
    swell_threshold: ['swell_threshold', 'th_high', 'swell_limit'],
    nominal_voltage: ['nominal_voltage', 'v_nominal'],
    tariff_day: ['tariff_day', 'th_tariff_day'],
    tariff_night: ['tariff_night', 'th_tariff_night'],
    two_zone: ['two_zone_tariff', 'sw_two_zone'],
    reset_energy: ['reset_pzem_energy', 'reset_energy'],
    reset_events: ['reset_event_counters', 'reset_events'],
    reset_cost: ['reset_cost_counters', 'reset_cost'],
    restart: ['restart'],
  };

  const TEXT = {
    uk: {
      title: 'Мережева напруга', subtitle: 'PZEM-004T v3.0 · Grid Monitor',
      online: 'Онлайн', offline: 'Офлайн', updated: 'Оновлено',
      home: 'Головна', params_tab: 'Параметри', energy_tab: 'Енергія', settings_tab: 'Налаштування',
      network: 'Мережа', inverter: 'Інвертор', no_power: 'Немає живлення', detecting: 'Визначення...',
      unknown: 'Невідомо', unavailable: 'Недоступно', healthy: 'Мережа в нормі',
      inverter_banner: 'Живлення від інвертора — міська мережа знеструмлена',
      alarm_banner: 'Увага: напруга виходить за межі безпечного діапазону!',
      offline_banner: 'Зв’язок із контролером ESP32 втрачено',
      voltage: 'Напруга', current: 'Струм', power: 'Потужність', frequency: 'Частота', pf: 'Коефіцієнт PF',
      normal: 'Норма', alarm: 'Тривога', chart_title: 'Графік потужності',
      hour: 'Година', day: 'Доба', week: 'Тиждень', month: 'Місяць',
      loading: 'Завантаження...', no_history: 'Дані за період відсутні',
      mains: 'Мережа 230В', has_voltage: 'Присутня', no_voltage: 'Відсутня',
      source: 'Джерело', from_mains: 'Міська мережа', from_inverter: 'Інвертор / ДБЖ',
      pzem_link: 'Зв’язок PZEM', active: 'Активний', inactive: 'Немає відповіді',
      today_consumption: 'Сьогодні', params_title: 'Електричні параметри',
      energy_title: 'Енергія та вартість', settings_title: 'Налаштування та діагностика',
      apparent: 'Повна потужність', reactive: 'Реактивна потужність', phase: 'Фазовий кут',
      deviation: 'Відхилення напруги', average: 'Середня напруга 5хв',
      min_voltage: 'Мін. напруга доби', max_voltage: 'Макс. напруга доби', max_current: 'Піковий струм', peak_power: 'Пікова потужність',
      voltage_state: 'Статус напруги', today: 'Сьогодні', energy_month: 'Місяць', energy_total: 'Загалом',
      cost_today: 'Вартість сьогодні', cost_month: 'Вартість за місяць', cost_total: 'Загальна вартість',
      tariff: 'Поточний тариф', cost_rate: 'Швидкість витрат', two_zone: 'Двозонний тариф',
      estimated_cost: 'Орієнтовна вартість', current_load: 'Поточне навантаження',
      tariff_compare: 'Порівняння тарифів', current_rate: 'Діючий тариф', night: 'Ніч',
      device_name: 'ESP32-C3 Grid Monitor', device_description: 'PZEM-004T v3.0 (UART/Modbus)',
      diagnostics: 'Діагностика пристрою', sag: 'Поріг просідання (Sag)', swell: 'Поріг стрибка (Swell)',
      nominal: 'Номінальна напруга', tariff_day: 'Тариф День', tariff_night: 'Тариф Ніч',
      wifi: 'Рівень Wi-Fi', temperature: 'Температура ESP', uptime: 'Час роботи', ip: 'IP адреса', ssid: 'Мережа Wi-Fi',
      events: 'Події якості мережі', inverter_events: 'Переходів на інвертор', current_duration: 'Поточна тривалість',
      last_duration: 'Остання тривалість', total_duration: 'Загальний час відключень', sag_events: 'Кількість просідань',
      swell_events: 'Кількість стрибків', save: 'Зберегти', on: 'Увімкнено', off: 'Вимкнено',
      actions: 'Обслуговування', reset_energy: 'Скинути енергію PZEM', reset_events: 'Скинути лічильники подій',
      reset_cost: 'Скинути лічильники вартості', restart: 'Перезавантажити ESP', confirm: 'Підтвердіть дію',
      invalid_number: 'Введіть коректне числове значення',
      voltage_24h_title: 'Напруга протягом доби',
      voltage_safe_band: 'Номінал 230 В (норма 207–253 В)',
      consumption_7d: 'Споживання за останні 7 днів',
      saved_toast: '✓ Збережено!', command_sent: '✓ Команду надіслано',
      editor_title: 'Налаштування Smart Grid Monitor', editor_prefix: 'Префікс пристрою ESP',
      editor_prefix_hint: 'Наприклад: grid_monitor (якщо сутності мають вигляд sensor.grid_monitor_voltage)',
      editor_autodetect: 'Автовиявлення ESP', editor_autodetect_success: 'Знайдено префікс:',
      editor_language: 'Мова інтерфейсу', editor_lang_auto: 'Авто (налаштування Home Assistant)',
      editor_lang_uk: 'Українська', editor_lang_en: 'English',
      editor_entities_detected: 'сутностей знайдено в Home Assistant',
      editor_custom_entities: 'Точне налаштування окремих сенсорів',
    },
    en: {
      title: 'Mains Voltage', subtitle: 'PZEM-004T v3.0 · Grid Monitor',
      online: 'Online', offline: 'Offline', updated: 'Updated',
      home: 'Home', params_tab: 'Parameters', energy_tab: 'Energy', settings_tab: 'Settings',
      network: 'Mains', inverter: 'Inverter', no_power: 'No Power', detecting: 'Detecting...',
      unknown: 'Unknown', unavailable: 'Unavailable', healthy: 'Grid Healthy',
      inverter_banner: 'Running on inverter — grid mains is offline or disconnected',
      alarm_banner: 'Warning: grid voltage is outside safe operating limits!',
      offline_banner: 'Connection to ESP32 controller lost',
      voltage: 'Voltage', current: 'Current', power: 'Power', frequency: 'Frequency', pf: 'Power Factor',
      normal: 'Normal', alarm: 'Alarm', chart_title: 'Power Chart',
      hour: 'Hour', day: 'Day', week: 'Week', month: 'Month',
      loading: 'Loading...', no_history: 'No history data for period',
      mains: 'Mains 230V', has_voltage: 'Present', no_voltage: 'Absent',
      source: 'Power Source', from_mains: 'Public Grid', from_inverter: 'Inverter / UPS',
      pzem_link: 'PZEM Link', active: 'Active', inactive: 'No Response',
      today_consumption: 'Today', params_title: 'Electrical Parameters',
      energy_title: 'Energy & Cost', settings_title: 'Settings & Diagnostics',
      apparent: 'Apparent Power', reactive: 'Reactive Power', phase: 'Phase Angle',
      deviation: 'Voltage Deviation', average: 'Voltage 5m Average',
      min_voltage: 'Min Voltage Today', max_voltage: 'Max Voltage Today', max_current: 'Peak Current Today', peak_power: 'Peak Power Today',
      voltage_state: 'Voltage State', today: 'Today', energy_month: 'Month', energy_total: 'Total',
      cost_today: 'Cost Today', cost_month: 'Cost Month', cost_total: 'Total Cost',
      tariff: 'Current Tariff', cost_rate: 'Cost Rate', two_zone: 'Two-Zone Tariff',
      estimated_cost: 'Estimated Cost', current_load: 'Current Load',
      tariff_compare: 'Tariff Comparison', current_rate: 'Active Rate', night: 'Night',
      device_name: 'ESP32-C3 Grid Monitor', device_description: 'PZEM-004T v3.0 (UART/Modbus)',
      diagnostics: 'Device Diagnostics', sag: 'Sag Threshold', swell: 'Swell Threshold',
      nominal: 'Nominal Voltage', tariff_day: 'Day Tariff', tariff_night: 'Night Tariff',
      wifi: 'Wi-Fi Signal', temperature: 'ESP Temp', uptime: 'Uptime', ip: 'IP Address', ssid: 'Wi-Fi SSID',
      events: 'Grid Quality Events', inverter_events: 'Inverter Outages', current_duration: 'Current Outage Duration',
      last_duration: 'Last Outage Duration', total_duration: 'Total Outage Time', sag_events: 'Voltage Sags',
      swell_events: 'Voltage Swells', save: 'Save', on: 'On', off: 'Off',
      actions: 'Maintenance', reset_energy: 'Reset PZEM Energy', reset_events: 'Reset Event Counters',
      reset_cost: 'Reset Cost Counters', restart: 'Restart ESP32', confirm: 'Confirm action',
      invalid_number: 'Please enter a valid numeric value',
      voltage_24h_title: '24h Voltage History',
      voltage_safe_band: 'Nominal 230 V (safe 207–253 V)',
      consumption_7d: 'Last 7 Days Consumption',
      saved_toast: '✓ Saved!', command_sent: '✓ Command sent',
      editor_title: 'Smart Grid Monitor Settings', editor_prefix: 'ESPHome Entity Prefix',
      editor_prefix_hint: 'E.g.: grid_monitor (if sensors are named like sensor.grid_monitor_voltage)',
      editor_autodetect: 'Auto-detect Device', editor_autodetect_success: 'Found prefix:',
      editor_language: 'Interface Language', editor_lang_auto: 'Auto (from Home Assistant)',
      editor_lang_uk: 'Ukrainian', editor_lang_en: 'English',
      editor_entities_detected: 'entities detected in Home Assistant',
      editor_custom_entities: 'Fine-tune Individual Entities',
    },
  };

  const RANGES = { hour: 1, day: 24, week: 168, month: 720 };

  const ICONS = {
    bolt: '<path d="M26 4 9 27h12l-3 17 21-25H26z" fill="currentColor"/>',
    current: '<circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="4"/><path d="M16 32 24 16l8 16m-13-5h10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    frequency: '<path d="M7 24c3.5-12 7.5-12 11 0s7.5 12 11 0 7.5-12 11 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    pf: '<circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="4"/><path d="M19 16v16m0-16h8c3 0 5 2 5 5s-2 5-5 5h-8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    home: '<path d="m8 22 16-13 16 13v17H28V27h-8v12H8z" fill="currentColor"/>',
    params: '<path d="M8 12h32M8 24h32M8 36h32" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="16" cy="12" r="4" fill="currentColor"/><circle cx="32" cy="24" r="4" fill="currentColor"/><circle cx="20" cy="36" r="4" fill="currentColor"/>',
    energy: '<path d="M27 5 11 26h11l-3 17 19-24H27z" fill="currentColor"/>',
    settings: '<path d="m24 15 2 4 4 1-2 4 1 4-4-1-3 3-2-4-4-1 2-4-1-4 4 1z" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="24" cy="24" r="4" fill="currentColor"/>',
    plug: '<rect x="14" y="16" width="20" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="4"/><line x1="19" y1="8" x2="19" y2="16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><line x1="29" y1="8" x2="29" y2="16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M24 34v8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    shield: '<path d="M24 7 10 13v11c0 9 6 15 14 17 8-2 14-8 14-17V13z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>',
    coin: '<circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="4"/><path d="M19 16c5-4 11 0 10 5s-9 5-6 11m-7-9h16m-16 4h16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    wifi: '<path d="M7 16a24 24 0 0 1 34 0M12 21a17 17 0 0 1 24 0M17 26a10 10 0 0 1 14 0" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><circle cx="24" cy="33" r="3" fill="currentColor"/>',
    check: '<path d="m11 25 9 9 17-19" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    chart: '<path d="M8 38h32M12 30l7-10 8 6 9-12" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
    gear: '<circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M24 7v4m0 26v4m17-17h-4M11 24H7m24.1-12.1-2.9 2.9m-16.4 16.4-2.9 2.9m0-22.2 2.9 2.9m16.4 16.4 2.9 2.9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  };

  let CARD_SEQUENCE = 0;

  class GridMonitorCardEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._config = {};
      this._hass = null;
      this._detectedInfo = null;
    }

    setConfig(config) {
      this._config = { ...config };
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._detectedInfo && this._hass) {
        this._autoDetect(false);
      }
      this._render();
    }

    _t(key) {
      const lang = this._config.language || (this._hass?.language === 'uk' ? 'uk' : 'en');
      return (TEXT[lang] || TEXT.uk)[key] || TEXT.uk[key] || key;
    }

    _autoDetect(notify = true) {
      if (!this._hass?.states) return;
      const states = Object.keys(this._hass.states);
      let detectedPrefix = null;

      // Look for sensors ending in _voltage
      const vCandidate = states.find((id) => id.startsWith('sensor.') && id.endsWith('_voltage'));
      if (vCandidate) {
        const raw = vCandidate.replace('sensor.', '').replace('_voltage', '');
        if (raw) detectedPrefix = raw;
      }

      if (!detectedPrefix) {
        const pCandidate = states.find((id) => id.startsWith('sensor.') && id.endsWith('_power'));
        if (pCandidate) {
          const raw = pCandidate.replace('sensor.', '').replace('_power', '');
          if (raw) detectedPrefix = raw;
        }
      }

      if (!detectedPrefix) {
        detectedPrefix = this._config.prefix || 'grid_monitor';
      }

      // Count matching entities
      let matchCount = 0;
      const totalKeys = Object.keys(DEFAULTS).length;
      for (const [key, defId] of Object.entries(DEFAULTS)) {
        const domain = defId.split('.')[0];
        const suffix = defId.split('.').slice(1).join('.').replace(/^grid_monitor_/, '');
        const candidate = `${domain}.${detectedPrefix}_${suffix}`;
        if (this._hass.states[candidate] || this._hass.states[defId]) {
          matchCount++;
        } else if (ALIAS_SUFFIXES[key]) {
          const hasAlias = ALIAS_SUFFIXES[key].some((s) => this._hass.states[`${domain}.${detectedPrefix}_${s}`] || this._hass.states[`${domain}.${s}`]);
          if (hasAlias) matchCount++;
        }
      }

      this._detectedInfo = { prefix: detectedPrefix, count: matchCount, total: totalKeys };

      if (notify) {
        this._config.prefix = detectedPrefix;
        this._fireChanged();
        this._render();
      }
    }

    _fireChanged() {
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }));
    }

    _render() {
      if (!this.shadowRoot) return;
      const lang = this._config.language || '';
      const name = this._config.name || '';
      const prefix = this._config.prefix || (this._detectedInfo?.prefix || '');
      const count = this._detectedInfo ? this._detectedInfo.count : 0;
      const total = this._detectedInfo ? this._detectedInfo.total : 40;

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: var(--primary-text-color, #e6f1ff);
            background: var(--card-background-color, #0b1528);
            padding: 16px;
            border-radius: 12px;
          }
          .editor-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .editor-header h3 {
            margin: 0;
            font-size: 1.15rem;
            color: #12b5ff;
            font-weight: 600;
          }
          .field {
            margin-bottom: 16px;
          }
          .field label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 6px;
            color: #9cb3d9;
          }
          .field input, .field select {
            width: 100%;
            box-sizing: border-box;
            background: rgba(14, 27, 49, 0.95);
            border: 1px solid rgba(18, 181, 255, 0.3);
            border-radius: 8px;
            color: #fff;
            padding: 10px 12px;
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          .field input:focus, .field select:focus {
            border-color: #12b5ff;
            box-shadow: 0 0 0 2px rgba(18, 181, 255, 0.2);
          }
          .hint {
            font-size: 0.75rem;
            color: #6c8db5;
            margin-top: 4px;
            line-height: 1.3;
          }
          .prefix-row {
            display: flex;
            gap: 8px;
          }
          .btn-detect {
            flex-shrink: 0;
            background: linear-gradient(135deg, #078de9, #025cb8);
            border: none;
            border-radius: 8px;
            color: #fff;
            font-weight: 600;
            font-size: 0.82rem;
            padding: 0 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
          }
          .btn-detect:hover {
            background: linear-gradient(135deg, #12b5ff, #078de9);
            box-shadow: 0 2px 8px rgba(18, 181, 255, 0.3);
          }
          .status-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(18, 181, 255, 0.08);
            border: 1px solid rgba(18, 181, 255, 0.2);
            padding: 10px 14px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 0.85rem;
          }
          .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: ${count > 0 ? '#35ed91' : '#ffb51b'};
            box-shadow: 0 0 8px ${count > 0 ? '#35ed91' : '#ffb51b'};
          }
          details {
            margin-top: 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            padding: 10px 14px;
          }
          summary {
            font-weight: 600;
            font-size: 0.85rem;
            color: #9cb3d9;
            cursor: pointer;
            outline: none;
          }
          .custom-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 12px;
          }
          @media (max-width: 480px) {
            .custom-grid { grid-template-columns: 1fr; }
          }
        </style>
        <div class="editor-header">
          <svg viewBox="0 0 48 48" width="22" height="22" fill="#12b5ff">${ICONS.gear}</svg>
          <h3>${this._t('editor_title')}</h3>
        </div>

        <div class="status-badge">
          <div class="status-dot"></div>
          <div>
            <strong>${count} / ${total}</strong> ${this._t('editor_entities_detected')}
          </div>
        </div>

        <div class="field">
          <label>${this._t('device_name')}</label>
          <input type="text" id="inp_name" value="${name}" placeholder="Smart Grid Monitor" />
        </div>

        <div class="field">
          <label>${this._t('editor_prefix')}</label>
          <div class="prefix-row">
            <input type="text" id="inp_prefix" value="${prefix}" placeholder="grid_monitor" />
            <button type="button" class="btn-detect" id="btn_detect">
              <svg viewBox="0 0 48 48" width="14" height="14">${ICONS.bolt}</svg>
              ${this._t('editor_autodetect')}
            </button>
          </div>
          <div class="hint">${this._t('editor_prefix_hint')}</div>
        </div>

        <div class="field">
          <label>${this._t('editor_language')}</label>
          <select id="sel_lang">
            <option value="" ${lang === '' ? 'selected' : ''}>${this._t('editor_lang_auto')}</option>
            <option value="uk" ${lang === 'uk' ? 'selected' : ''}>${this._t('editor_lang_uk')}</option>
            <option value="en" ${lang === 'en' ? 'selected' : ''}>${this._t('editor_lang_en')}</option>
          </select>
        </div>

        <details>
          <summary>${this._t('editor_custom_entities')}</summary>
          <div class="custom-grid">
            <div class="field">
              <label>${this._t('voltage')}</label>
              <input type="text" data-entity-key="voltage" value="${this._config.entities?.voltage || ''}" placeholder="sensor.grid_monitor_voltage" />
            </div>
            <div class="field">
              <label>${this._t('current')}</label>
              <input type="text" data-entity-key="current" value="${this._config.entities?.current || ''}" placeholder="sensor.grid_monitor_current" />
            </div>
            <div class="field">
              <label>${this._t('power')}</label>
              <input type="text" data-entity-key="power" value="${this._config.entities?.power || ''}" placeholder="sensor.grid_monitor_power" />
            </div>
            <div class="field">
              <label>${this._t('energy_total')}</label>
              <input type="text" data-entity-key="energy_total" value="${this._config.entities?.energy_total || ''}" placeholder="sensor.grid_monitor_energy_total" />
            </div>
            <div class="field">
              <label>${this._t('mains')}</label>
              <input type="text" data-entity-key="mains" value="${this._config.entities?.mains || ''}" placeholder="binary_sensor.grid_monitor_mains_present" />
            </div>
            <div class="field">
              <label>${this._t('inverter')}</label>
              <input type="text" data-entity-key="inverter" value="${this._config.entities?.inverter || ''}" placeholder="binary_sensor.grid_monitor_on_inverter" />
            </div>
          </div>
        </details>
      `;

      this.shadowRoot.getElementById('inp_name').addEventListener('input', (e) => {
        this._config.name = e.target.value.trim();
        this._fireChanged();
      });

      this.shadowRoot.getElementById('inp_prefix').addEventListener('input', (e) => {
        this._config.prefix = e.target.value.trim();
        this._fireChanged();
      });

      this.shadowRoot.getElementById('sel_lang').addEventListener('change', (e) => {
        this._config.language = e.target.value || undefined;
        this._fireChanged();
      });

      this.shadowRoot.getElementById('btn_detect').addEventListener('click', () => {
        this._autoDetect(true);
      });

      this.shadowRoot.querySelectorAll('input[data-entity-key]').forEach((input) => {
        input.addEventListener('change', (e) => {
          const key = e.target.getAttribute('data-entity-key');
          const val = e.target.value.trim();
          this._config.entities = this._config.entities || {};
          if (val) {
            this._config.entities[key] = val;
          } else {
            delete this._config.entities[key];
          }
          this._fireChanged();
        });
      });
    }
  }

  customElements.define('grid-monitor-card-editor', GridMonitorCardEditor);

  class GridMonitorCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._cardSeq = ++CARD_SEQUENCE;
      this._config = {};
      this._hass = null;
      this._tab = 'home';
      this._range = 'day';
      this._historyData = null;
      this._historyLoading = false;
      this._lastHistoryKey = null;
      this._detectedPrefix = null;
    }

    static getConfigElement() {
      return document.createElement('grid-monitor-card-editor');
    }

    static getStubConfig(hass, entities, entitiesFallback) {
      let foundPrefix = 'grid_monitor';
      if (hass?.states) {
        const vCandidate = Object.keys(hass.states).find((id) => id.startsWith('sensor.') && id.endsWith('_voltage'));
        if (vCandidate) {
          const raw = vCandidate.replace('sensor.', '').replace('_voltage', '');
          if (raw) foundPrefix = raw;
        }
      }
      return {
        type: 'custom:grid-monitor-card',
        name: 'Smart Grid Monitor',
        prefix: foundPrefix,
      };
    }

    setConfig(config) {
      this._config = {
        name: 'Smart Grid Monitor',
        prefix: 'grid_monitor',
        language: '',
        ...config,
      };
      this._render();
    }

    set hass(hass) {
      const oldHass = this._hass;
      this._hass = hass;
      if (!this._detectedPrefix && this._hass) {
        this._detectPrefix();
      }
      if (this._needsRender(oldHass, hass)) {
        this._render();
      }
    }

    connectedCallback() {
      this._render();
    }

    disconnectedCallback() {
      // Cleanup if needed
    }

    _detectPrefix() {
      if (this._config.prefix) {
        this._detectedPrefix = this._config.prefix;
        return;
      }
      if (!this._hass?.states) return;
      const states = Object.keys(this._hass.states);
      const vCandidate = states.find((id) => id.startsWith('sensor.') && id.endsWith('_voltage'));
      if (vCandidate) {
        const raw = vCandidate.replace('sensor.', '').replace('_voltage', '');
        if (raw) {
          this._detectedPrefix = raw;
          return;
        }
      }
      this._detectedPrefix = 'grid_monitor';
    }

    _resolveEntity(key) {
      if (this._config.entities?.[key]) {
        return this._config.entities[key];
      }
      const prefix = this._config.prefix || this._detectedPrefix || 'grid_monitor';
      const defId = DEFAULTS[key];
      if (!defId) return null;

      const domain = defId.split('.')[0];
      const suffix = defId.split('.').slice(1).join('.').replace(/^grid_monitor_/, '');
      const candidate = `${domain}.${prefix}_${suffix}`;

      if (this._hass?.states?.[candidate]) return candidate;
      if (this._hass?.states?.[defId]) return defId;

      // Check known aliases
      if (ALIAS_SUFFIXES[key]) {
        for (const s of ALIAS_SUFFIXES[key]) {
          const c1 = `${domain}.${prefix}_${s}`;
          if (this._hass?.states?.[c1]) return c1;
          const c2 = `${domain}.${s}`;
          if (this._hass?.states?.[c2]) return c2;
        }
      }

      return candidate;
    }

    _state(key) {
      const entityId = this._resolveEntity(key);
      if (!entityId || !this._hass?.states) return null;
      return this._hass.states[entityId] || null;
    }

    _raw(key) {
      const stateObj = this._state(key);
      return stateObj ? stateObj.state : null;
    }

    _num(key) {
      const raw = this._raw(key);
      if (raw === null || raw === undefined || raw === 'unavailable' || raw === 'unknown') {
        return null;
      }
      const n = parseFloat(raw);
      return Number.isFinite(n) ? n : null;
    }

    _unit(key) {
      const stateObj = this._state(key);
      return stateObj?.attributes?.unit_of_measurement || '';
    }

    _formatted(key, digits = 1) {
      const val = this._num(key);
      if (val === null) return '—';
      return val.toFixed(digits);
    }

    _t(key) {
      const lang = this._config.language || (this._hass?.language === 'uk' ? 'uk' : 'en');
      return (TEXT[lang] || TEXT.uk)[key] || TEXT.uk[key] || key;
    }

    _displayStatus() {
      const mainsRaw = this._raw('mains');
      const inverterRaw = this._raw('inverter');
      const espRaw = this._raw('esp_status');
      const alarmRaw = this._raw('voltage_alarm');
      const voltage = this._num('voltage');
      const power = this._num('power');

      // Check if ESP is reachable
      const espOnline = (espRaw === 'on') || (espRaw === null && (voltage !== null || power !== null));
      if (!espOnline) {
        return {
          source: 'offline',
          label: this._t('offline'),
          banner: this._t('offline_banner'),
          class: 'status-offline',
          dot: '#ff526d'
        };
      }

      // Check if running on inverter
      const onInverter = (inverterRaw === 'on') || (voltage !== null && voltage < 50);
      if (onInverter) {
        return {
          source: 'inverter',
          label: this._t('inverter'),
          banner: this._t('inverter_banner'),
          class: 'status-inverter',
          dot: '#b56aff'
        };
      }

      // Check voltage alarm
      const thLow = this._num('sag_threshold') || 190;
      const thHigh = this._num('swell_threshold') || 245;
      const isAlarm = (alarmRaw === 'on') || (voltage !== null && (voltage < thLow || voltage > thHigh));
      if (isAlarm) {
        return {
          source: 'alarm',
          label: this._t('alarm'),
          banner: this._t('alarm_banner'),
          class: 'status-alarm',
          dot: '#ffb51b'
        };
      }

      return {
        source: 'mains',
        label: this._t('healthy'),
        banner: null,
        class: 'status-normal',
        dot: '#35ed91'
      };
    }

    _needsRender(oldHass, newHass) {
      if (!oldHass || !newHass) return true;
      for (const key of Object.keys(DEFAULTS)) {
        const id = this._resolveEntity(key);
        if (id && oldHass.states[id] !== newHass.states[id]) return true;
      }
      return false;
    }

    _showToast(msg) {
      const toast = this.shadowRoot.getElementById('card_toast');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 2500);
    }

    async _saveNumber(key, inputElem, btnElem) {
      const valStr = inputElem.value.trim().replace(',', '.');
      const val = parseFloat(valStr);
      if (!Number.isFinite(val)) {
        alert(this._t('invalid_number'));
        return;
      }
      const entityId = this._resolveEntity(key);
      if (!entityId || !this._hass) return;

      try {
        await this._hass.callService('number', 'set_value', {
          entity_id: entityId,
          value: val
        });
        if (btnElem) {
          const orig = btnElem.textContent;
          btnElem.textContent = this._t('saved_toast');
          btnElem.classList.add('btn-saved');
          setTimeout(() => {
            btnElem.textContent = orig;
            btnElem.classList.remove('btn-saved');
          }, 2000);
        }
        this._showToast(this._t('saved_toast'));
      } catch (err) {
        console.error('Error setting number:', err);
        alert('Помилка надсилання: ' + err.message);
      }
    }

    async _toggleSwitch(key) {
      const entityId = this._resolveEntity(key);
      if (!entityId || !this._hass) return;
      try {
        await this._hass.callService('switch', 'toggle', {
          entity_id: entityId
        });
        this._showToast(this._t('command_sent'));
      } catch (err) {
        console.error('Error toggling switch:', err);
      }
    }

    async _call(action) {
      const keyMap = {
        reset_energy: 'reset_energy',
        reset_events: 'reset_events',
        reset_cost: 'reset_cost',
        restart: 'restart'
      };
      const entityId = this._resolveEntity(keyMap[action]);
      if (!entityId || !this._hass) return;

      if (!confirm(`${this._t('confirm')}?`)) return;

      try {
        await this._hass.callService('button', 'press', {
          entity_id: entityId
        });
        this._showToast(this._t('command_sent'));
      } catch (err) {
        console.error('Error calling button:', err);
        alert('Помилка виклику: ' + err.message);
      }
    }

    async _ensureHistory() {
      const powerEntity = this._resolveEntity('power');
      if (!powerEntity || !this._hass) return;

      const hours = RANGES[this._range] || 24;
      const key = `${powerEntity}:${hours}`;
      if (this._lastHistoryKey === key && this._historyData) return;

      this._historyLoading = true;
      this._lastHistoryKey = key;
      const end = new Date();
      const start = new Date(end.getTime() - hours * 3600 * 1000);

      try {
        const hist = await this._hass.callApi(
          'GET',
          `history/period/${start.toISOString()}?filter_entity_id=${powerEntity}&end_time=${end.toISOString()}`
        );
        if (Array.isArray(hist) && hist[0]) {
          this._historyData = hist[0].map(item => ({
            time: new Date(item.last_updated || item.last_changed).getTime(),
            val: parseFloat(item.state) || 0
          })).filter(pt => Number.isFinite(pt.val));
        } else {
          this._historyData = [];
        }
      } catch (err) {
        console.warn('Could not fetch history:', err);
        this._historyData = [];
      } finally {
        this._historyLoading = false;
        this._render();
      }
    }

    _powerChartSvg() {
      const data = this._historyData;
      if (this._historyLoading) {
        return `<div class="chart-empty">${this._t('loading')}</div>`;
      }
      if (!data || data.length === 0) {
        return `<div class="chart-empty">${this._t('no_history')}</div>`;
      }

      const pMax = Math.max(100, ...data.map(d => d.val));
      const w = 620;
      const h = 170;
      const padL = 35;
      const padR = 20;
      const padT = 20;
      const padB = 30;

      const innerW = w - padL - padR;
      const innerH = h - padT - padB;

      const tStart = data[0].time;
      const tEnd = data[data.length - 1].time || (tStart + 1);
      const tSpan = Math.max(1, tEnd - tStart);

      const points = data.map(pt => {
        const x = padL + ((pt.time - tStart) / tSpan) * innerW;
        const y = padT + innerH - (pt.val / pMax) * innerH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');

      const firstX = padL;
      const lastX = padL + innerW;
      const bottomY = padT + innerH;
      const areaPath = `M ${firstX},${bottomY} L ${points} L ${lastX},${bottomY} Z`;

      return `
        <svg viewBox="0 0 ${w} ${h}" class="sub-chart-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#35ed91" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#35ed91" stop-opacity="0.0"/>
            </linearGradient>
          </defs>
          <line x1="${padL}" y1="${bottomY}" x2="${lastX}" y2="${bottomY}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
          <path d="${areaPath}" fill="url(#pAreaGrad)"/>
          <polyline points="${points}" fill="none" stroke="#35ed91" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="${padL}" y="14" fill="#6c8db5" font-size="9">${pMax.toFixed(0)} Вт</text>
          <text x="${padL}" y="${bottomY + 16}" fill="#6c8db5" font-size="8.5">Початок</text>
          <text x="${lastX}" y="${bottomY + 16}" fill="#35ed91" font-size="8.5" text-anchor="end">Зараз</text>
        </svg>
      `;
    }

    _towerArtwork() {
      return `
        <svg class="tower-art" viewBox="0 0 680 340" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#020611" stop-opacity="0.95"/>
              <stop offset="50%" stop-color="#081b38" stop-opacity="0.75"/>
              <stop offset="100%" stop-color="#0e2a52" stop-opacity="0.85"/>
            </linearGradient>
            <linearGradient id="mountainFar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0c2242" stop-opacity="0.5"/>
              <stop offset="100%" stop-color="#071324" stop-opacity="0.9"/>
            </linearGradient>
            <linearGradient id="mountainNear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0f2f59" stop-opacity="0.7"/>
              <stop offset="100%" stop-color="#050e1c" stop-opacity="0.98"/>
            </linearGradient>
            <linearGradient id="steelBeam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#2a507d"/>
              <stop offset="35%" stop-color="#6ea9ea"/>
              <stop offset="70%" stop-color="#3c6b9e"/>
              <stop offset="100%" stop-color="#193557"/>
            </linearGradient>
            <linearGradient id="wireGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#00f2ff" stop-opacity="0.8"/>
              <stop offset="50%" stop-color="#ffffff" stop-opacity="0.95"/>
              <stop offset="100%" stop-color="#00aaff" stop-opacity="0.8"/>
            </linearGradient>
            <radialGradient id="beaconGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ff3b5c" stop-opacity="1"/>
              <stop offset="40%" stop-color="#ff1a40" stop-opacity="0.6"/>
              <stop offset="100%" stop-color="#ff002b" stop-opacity="0"/>
            </radialGradient>
            <filter id="electricGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Sky backdrop -->
          <rect width="680" height="340" fill="url(#skyGrad)"/>

          <!-- Stars / Grid constellation -->
          <g opacity="0.3">
            <circle cx="65" cy="40" r="1.2" fill="#fff"/>
            <circle cx="180" cy="25" r="1.5" fill="#aee2ff"/>
            <circle cx="290" cy="65" r="1" fill="#fff"/>
            <circle cx="430" cy="30" r="1.3" fill="#fff"/>
            <circle cx="560" cy="50" r="1.4" fill="#aee2ff"/>
            <circle cx="620" cy="20" r="1" fill="#fff"/>
          </g>

          <!-- Far Mountains Silhouette -->
          <path d="M0 240 Q110 200 230 225 T470 210 Q580 190 680 230 L680 340 L0 340 Z" fill="url(#mountainFar)"/>

          <!-- Distant Pylon 1 (Left background) -->
          <g opacity="0.35" transform="translate(130, 160) scale(0.35)">
            <path d="M40 0 L15 150 M40 0 L65 150 M0 35 L80 35 M8 75 L72 75 M15 115 L65 115" stroke="#4a7eb8" stroke-width="2.5" fill="none"/>
            <path d="M15 35 L65 75 M65 35 L15 75 M20 75 L60 115 M60 75 L20 115" stroke="#37669a" stroke-width="1.8"/>
          </g>

          <!-- Distant Pylon 2 (Right background) -->
          <g opacity="0.4" transform="translate(510, 150) scale(0.42)">
            <path d="M40 0 L12 160 M40 0 L68 160 M-5 35 L85 35 M5 75 L75 75 M12 120 L68 120" stroke="#4a7eb8" stroke-width="2.5" fill="none"/>
            <path d="M12 35 L68 75 M68 35 L12 75 M15 75 L65 120 M65 75 L15 120" stroke="#37669a" stroke-width="1.8"/>
          </g>

          <!-- Near Mountain Ridge & Substation contour -->
          <path d="M0 265 Q140 245 280 260 T560 250 Q625 242 680 255 L680 340 L0 340 Z" fill="url(#mountainNear)"/>

          <!-- High-Voltage Sag Wires across horizon (Catenary Curves) -->
          <g filter="url(#electricGlow)">
            <!-- Top Ground Shield Wire -->
            <path d="M0 80 Q340 102 680 82" fill="none" stroke="#68a6e8" stroke-width="1.2" opacity="0.7"/>

            <!-- Upper Phase Line -->
            <path d="M0 135 Q340 178 680 138" fill="none" stroke="url(#wireGlow)" stroke-width="2.2" opacity="0.9"/>
            <path d="M0 138 Q340 181 680 141" fill="none" stroke="#00f2ff" stroke-width="1" opacity="0.4"/>

            <!-- Middle Phase Line -->
            <path d="M0 190 Q340 242 680 194" fill="none" stroke="url(#wireGlow)" stroke-width="2.5" opacity="0.95"/>
            <path d="M0 194 Q340 246 680 198" fill="none" stroke="#00f2ff" stroke-width="1.2" opacity="0.5"/>

            <!-- Lower Phase Line -->
            <path d="M0 245 Q340 305 680 248" fill="none" stroke="url(#wireGlow)" stroke-width="2.6" opacity="0.9"/>
          </g>

          <!-- MAIN 330kV TRANSMISSION PYLON (Center-Right Foreground) -->
          <g id="mainTower" transform="translate(340, 18)">
            <!-- Ground Anchor Foundation Pads -->
            <path d="M-68 318 L-44 322 L-40 310 L-64 306 Z" fill="#203a5e"/>
            <path d="M44 322 L68 318 L64 306 L40 310 Z" fill="#203a5e"/>

            <!-- Tower Corner Legs (Pyramidal Truss) -->
            <path d="M-8 40 L-54 316" stroke="url(#steelBeam)" stroke-width="5.5" stroke-linecap="round"/>
            <path d="M8 40 L54 316" stroke="url(#steelBeam)" stroke-width="5.5" stroke-linecap="round"/>
            <path d="M-4 40 L-22 316" stroke="#254a75" stroke-width="3.2"/>
            <path d="M4 40 L22 316" stroke="#4878b0" stroke-width="3.2"/>

            <!-- Top Earth Peak (Lightning Mast) -->
            <polygon points="0,0 -8,40 8,40" fill="url(#steelBeam)"/>
            <line x1="0" y1="0" x2="0" y2="40" stroke="#7bb7f5" stroke-width="2.5"/>

            <!-- TOP CROSSARM (Earth Wire Peak Arm) -->
            <path d="M-36 38 L36 38 L24 46 L-24 46 Z" fill="url(#steelBeam)"/>
            <line x1="-36" y1="38" x2="-8" y2="18" stroke="#5087c4" stroke-width="2.5"/>
            <line x1="36" y1="38" x2="8" y2="18" stroke="#5087c4" stroke-width="2.5"/>

            <!-- UPPER CONDUCTOR CROSSARMS (T-Arm Upper) -->
            <path d="M-130 98 L130 98 L114 112 L-114 112 Z" fill="url(#steelBeam)"/>
            <!-- Crossarm Braces -->
            <line x1="-128" y1="98" x2="-10" y2="65" stroke="url(#steelBeam)" stroke-width="3.5"/>
            <line x1="128" y1="98" x2="10" y2="65" stroke="url(#steelBeam)" stroke-width="3.5"/>
            <line x1="-90" y1="112" x2="-12" y2="135" stroke="#315887" stroke-width="2.8"/>
            <line x1="90" y1="112" x2="12" y2="135" stroke="#5389c7" stroke-width="2.8"/>

            <!-- MIDDLE CONDUCTOR CROSSARMS (Widest Tier) -->
            <path d="M-165 155 L165 155 L145 172 L-145 172 Z" fill="url(#steelBeam)"/>
            <line x1="-162" y1="155" x2="-14" y2="120" stroke="url(#steelBeam)" stroke-width="4"/>
            <line x1="162" y1="155" x2="14" y2="120" stroke="url(#steelBeam)" stroke-width="4"/>
            <line x1="-120" y1="172" x2="-18" y2="200" stroke="#315887" stroke-width="3"/>
            <line x1="120" y1="172" x2="18" y2="200" stroke="#5389c7" stroke-width="3"/>

            <!-- LOWER CONDUCTOR CROSSARMS -->
            <path d="M-140 215 L140 215 L122 230 L-122 230 Z" fill="url(#steelBeam)"/>
            <line x1="-138" y1="215" x2="-20" y2="182" stroke="url(#steelBeam)" stroke-width="3.8"/>
            <line x1="138" y1="215" x2="20" y2="182" stroke="url(#steelBeam)" stroke-width="3.8"/>
            <line x1="-100" y1="230" x2="-26" y2="258" stroke="#315887" stroke-width="2.8"/>
            <line x1="100" y1="230" x2="26" y2="258" stroke="#5389c7" stroke-width="2.8"/>

            <!-- Lattice X-Braces Down Tower Body -->
            <g stroke="#3d6d9e" stroke-width="2.2">
              <!-- Tier 1 -->
              <line x1="-10" y1="46" x2="10" y2="80"/>
              <line x1="10" y1="46" x2="-10" y2="80"/>
              <!-- Tier 2 -->
              <line x1="-12" y1="80" x2="12" y2="120"/>
              <line x1="12" y1="80" x2="-12" y2="120"/>
              <!-- Tier 3 -->
              <line x1="-16" y1="120" x2="16" y2="165"/>
              <line x1="16" y1="120" x2="-16" y2="165"/>
              <line x1="-16" y1="165" x2="16" y2="165" stroke-width="3.5" stroke="#5288c4"/>
              <!-- Tier 4 -->
              <line x1="-22" y1="165" x2="22" y2="215"/>
              <line x1="22" y1="165" x2="-22" y2="215"/>
              <line x1="-22" y1="215" x2="22" y2="215" stroke-width="4" stroke="#5288c4"/>
              <!-- Tier 5 -->
              <line x1="-30" y1="215" x2="30" y2="265"/>
              <line x1="30" y1="215" x2="-30" y2="265"/>
              <line x1="-30" y1="265" x2="30" y2="265" stroke-width="4.5" stroke="#5288c4"/>
              <!-- Tier 6 (Base) -->
              <line x1="-40" y1="265" x2="40" y2="316"/>
              <line x1="40" y1="265" x2="-40" y2="316"/>
              <line x1="-50" y1="316" x2="50" y2="316" stroke-width="5" stroke="#5288c4"/>
            </g>

            <!-- Climbing Safety Ladder in Center -->
            <line x1="0" y1="45" x2="0" y2="316" stroke="#254a75" stroke-width="1.8"/>
            <g stroke="#3a6a9b" stroke-width="1.2">
              <line x1="-3" y1="60" x2="3" y2="60"/>
              <line x1="-3" y1="80" x2="3" y2="80"/>
              <line x1="-3" y1="100" x2="3" y2="100"/>
              <line x1="-3" y1="120" x2="3" y2="120"/>
              <line x1="-3" y1="140" x2="3" y2="140"/>
              <line x1="-3" y1="160" x2="3" y2="160"/>
              <line x1="-3" y1="180" x2="3" y2="180"/>
              <line x1="-3" y1="200" x2="3" y2="200"/>
              <line x1="-3" y1="220" x2="3" y2="220"/>
              <line x1="-3" y1="240" x2="3" y2="240"/>
              <line x1="-3" y1="260" x2="3" y2="260"/>
              <line x1="-3" y1="280" x2="3" y2="280"/>
              <line x1="-3" y1="300" x2="3" y2="300"/>
            </g>

            <!-- SUSPENSION INSULATORS STRINGS & CORONA RINGS -->
            <!-- Upper Left Insulator -->
            <g transform="translate(-120, 102)">
              <line x1="0" y1="0" x2="0" y2="34" stroke="#8ec8ff" stroke-width="4.5" stroke-dasharray="2,3"/>
              <circle cx="0" cy="35" r="4.5" fill="none" stroke="#00f2ff" stroke-width="2"/>
              <line x1="-10" y1="35" x2="10" y2="35" stroke="#fff" stroke-width="2"/>
            </g>
            <!-- Upper Right Insulator -->
            <g transform="translate(120, 102)">
              <line x1="0" y1="0" x2="0" y2="34" stroke="#8ec8ff" stroke-width="4.5" stroke-dasharray="2,3"/>
              <circle cx="0" cy="35" r="4.5" fill="none" stroke="#00f2ff" stroke-width="2"/>
              <line x1="-10" y1="35" x2="10" y2="35" stroke="#fff" stroke-width="2"/>
            </g>

            <!-- Middle Left Insulator -->
            <g transform="translate(-154, 160)">
              <line x1="0" y1="0" x2="0" y2="36" stroke="#8ec8ff" stroke-width="4.8" stroke-dasharray="2,3"/>
              <circle cx="0" cy="37" r="5" fill="none" stroke="#00f2ff" stroke-width="2.2"/>
              <line x1="-12" y1="37" x2="12" y2="37" stroke="#fff" stroke-width="2.2"/>
            </g>
            <!-- Middle Right Insulator -->
            <g transform="translate(154, 160)">
              <line x1="0" y1="0" x2="0" y2="36" stroke="#8ec8ff" stroke-width="4.8" stroke-dasharray="2,3"/>
              <circle cx="0" cy="37" r="5" fill="none" stroke="#00f2ff" stroke-width="2.2"/>
              <line x1="-12" y1="37" x2="12" y2="37" stroke="#fff" stroke-width="2.2"/>
            </g>

            <!-- Lower Left Insulator -->
            <g transform="translate(-130, 220)">
              <line x1="0" y1="0" x2="0" y2="36" stroke="#8ec8ff" stroke-width="4.8" stroke-dasharray="2,3"/>
              <circle cx="0" cy="37" r="5" fill="none" stroke="#00f2ff" stroke-width="2.2"/>
              <line x1="-12" y1="37" x2="12" y2="37" stroke="#fff" stroke-width="2.2"/>
            </g>
            <!-- Lower Right Insulator -->
            <g transform="translate(130, 220)">
              <line x1="0" y1="0" x2="0" y2="36" stroke="#8ec8ff" stroke-width="4.8" stroke-dasharray="2,3"/>
              <circle cx="0" cy="37" r="5" fill="none" stroke="#00f2ff" stroke-width="2.2"/>
              <line x1="-12" y1="37" x2="12" y2="37" stroke="#fff" stroke-width="2.2"/>
            </g>

            <!-- Red Obstruction Warning Beacons (Aviation Strobe) -->
            <circle cx="0" cy="0" r="10" fill="url(#beaconGlow)"/>
            <circle cx="0" cy="0" r="3.5" fill="#ff3b5c"/>
            <circle cx="-130" cy="98" r="7" fill="url(#beaconGlow)"/>
            <circle cx="-130" cy="98" r="2.5" fill="#ff3b5c"/>
            <circle cx="130" cy="98" r="7" fill="url(#beaconGlow)"/>
            <circle cx="130" cy="98" r="2.5" fill="#ff3b5c"/>
          </g>

          <!-- Foreground Substation Busbars & Transformers silhouette -->
          <g opacity="0.65" transform="translate(0, 295)">
            <rect x="20" y="10" width="35" height="30" fill="#0c1e38" rx="2"/>
            <rect x="25" y="2" width="25" height="8" fill="#142c4f" rx="1"/>
            <line x1="30" y1="2" x2="30" y2="-8" stroke="#4878b0" stroke-width="2"/>
            <line x1="45" y1="2" x2="45" y2="-8" stroke="#4878b0" stroke-width="2"/>

            <rect x="180" y="15" width="50" height="25" fill="#0c1e38" rx="2"/>
            <line x1="205" y1="15" x2="205" y2="-6" stroke="#4878b0" stroke-width="2.5"/>

            <rect x="580" y="8" width="40" height="32" fill="#0c1e38" rx="2"/>
            <line x1="595" y1="8" x2="595" y2="-5" stroke="#4878b0" stroke-width="2"/>
            <line x1="610" y1="8" x2="610" y2="-5" stroke="#4878b0" stroke-width="2"/>
          </g>
        </svg>
      `;
    }

    _houseArt() {
      return `
        <svg viewBox="0 0 160 140" class="real-vector-art" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="roofGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#2a456e"/>
              <stop offset="50%" stop-color="#162947"/>
              <stop offset="100%" stop-color="#0c1a30"/>
            </linearGradient>
            <linearGradient id="wallFront" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#1a3660"/>
              <stop offset="100%" stop-color="#0e203c"/>
            </linearGradient>
            <linearGradient id="wallSide" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#0f2444"/>
              <stop offset="100%" stop-color="#09162a"/>
            </linearGradient>
            <linearGradient id="windowWarm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ffe89e"/>
              <stop offset="60%" stop-color="#ffb834"/>
              <stop offset="100%" stop-color="#ff7b00"/>
            </linearGradient>
            <filter id="warmGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Ground shadow -->
          <ellipse cx="80" cy="128" rx="68" ry="8" fill="#040a14" opacity="0.6"/>

          <!-- House Left Wing Wall -->
          <polygon points="28,82 68,62 68,118 28,124" fill="url(#wallSide)"/>

          <!-- House Main Front Wall -->
          <polygon points="68,62 136,88 136,124 68,118" fill="url(#wallFront)"/>

          <!-- Slate Hip Roof (Left Facet) -->
          <polygon points="82,24 24,78 68,58" fill="#2d4d7a"/>
          <!-- Slate Hip Roof (Main Facet) -->
          <polygon points="82,24 68,58 138,84 144,48" fill="url(#roofGrad)"/>

          <!-- Solar PV Panels on Main Roof -->
          <polygon points="76,52 118,68 112,78 72,62" fill="#091b36" stroke="#12b5ff" stroke-width="1.2"/>
          <line x1="90" y1="57" x2="86" y2="67" stroke="#12b5ff" stroke-width="0.8"/>
          <line x1="104" y1="63" x2="100" y2="73" stroke="#12b5ff" stroke-width="0.8"/>

          <!-- Glowing Warm Windows (Living room & Bedroom) -->
          <g filter="url(#warmGlow)">
            <!-- Upper Window -->
            <polygon points="88,90 108,98 108,112 88,106" fill="url(#windowWarm)"/>
            <line x1="98" y1="94" x2="98" y2="109" stroke="#945200" stroke-width="1"/>
            <line x1="88" y1="100" x2="108" y2="106" stroke="#945200" stroke-width="1"/>

            <!-- Side Window -->
            <polygon points="36,92 56,82 56,104 36,109" fill="url(#windowWarm)"/>
            <line x1="46" y1="87" x2="46" y2="106" stroke="#945200" stroke-width="1"/>
          </g>

          <!-- Front Entrance Door -->
          <polygon points="116,102 128,106 128,123 116,121" fill="#0d1c33" stroke="#12b5ff" stroke-width="1"/>
          <circle cx="125" cy="114" r="1" fill="#ffb834"/>

          <!-- Grid Utility Drop & Smart Meter Box -->
          <rect x="25" y="98" width="5" height="9" fill="#1b3863" stroke="#35ed91" stroke-width="0.8" rx="1"/>
          <circle cx="27.5" cy="101" r="0.8" fill="#35ed91"/>
          <path d="M28,98 L28,78 Q22,70 12,65" fill="none" stroke="#35ed91" stroke-width="1" stroke-dasharray="2,2"/>
        </svg>
      `;
    }

    _energyCoinArt() {
      return `
        <svg viewBox="0 0 130 130" class="real-vector-art" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="coinGold" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#fff4b8"/>
              <stop offset="25%" stop-color="#ffd24d"/>
              <stop offset="65%" stop-color="#d69615"/>
              <stop offset="90%" stop-color="#946200"/>
              <stop offset="100%" stop-color="#593b00"/>
            </radialGradient>
            <linearGradient id="coinRim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#ffe885"/>
              <stop offset="50%" stop-color="#b8800a"/>
              <stop offset="100%" stop-color="#543700"/>
            </linearGradient>
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Outer Glow -->
          <circle cx="65" cy="65" r="54" fill="none" stroke="#ffd24d" stroke-width="1" opacity="0.4"/>

          <!-- Drop Shadow -->
          <ellipse cx="65" cy="116" rx="42" ry="7" fill="#030812" opacity="0.6"/>

          <!-- Outer Reeded Coin Rim -->
          <circle cx="65" cy="63" r="50" fill="url(#coinRim)"/>

          <!-- Reeded Notches -->
          <circle cx="65" cy="63" r="48" fill="none" stroke="#7a5000" stroke-width="2.5" stroke-dasharray="2,3"/>

          <!-- Inner Coin Face -->
          <circle cx="65" cy="63" r="44" fill="url(#coinGold)"/>

          <!-- Concentric Ring Detail -->
          <circle cx="65" cy="63" r="38" fill="none" stroke="#ffea8a" stroke-width="1.2" opacity="0.6"/>
          <circle cx="65" cy="63" r="35" fill="none" stroke="#996300" stroke-width="0.8" opacity="0.7"/>

          <!-- 3D Embossed Hryvnia Symbol ₴ -->
          <g filter="url(#goldGlow)" transform="translate(65, 63)">
            <!-- Symbol Shadow -->
            <path d="M-10 -18 C4 -24 16 -18 15 -7 C14 2 2 4 4 15 C6 24 16 22 17 21" fill="none" stroke="#543700" stroke-width="6.5" stroke-linecap="round"/>
            <line x1="-15" y1="-3" x2="17" y2="-3" stroke="#543700" stroke-width="5" stroke-linecap="round"/>
            <line x1="-15" y1="5" x2="17" y2="5" stroke="#543700" stroke-width="5" stroke-linecap="round"/>

            <!-- Symbol Highlight Surface -->
            <path d="M-10 -19 C4 -25 16 -19 15 -8 C14 1 2 3 4 14 C6 23 16 21 17 20" fill="none" stroke="#fff8d1" stroke-width="4.5" stroke-linecap="round"/>
            <line x1="-15" y1="-4" x2="17" y2="-4" stroke="#fff8d1" stroke-width="3.5" stroke-linecap="round"/>
            <line x1="-15" y1="4" x2="17" y2="4" stroke="#fff8d1" stroke-width="3.5" stroke-linecap="round"/>
          </g>

          <!-- Electric Energy Spark in Corner -->
          <path d="M96 28 L91 38 L99 37 L93 49" fill="none" stroke="#35ed91" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }

    _plugArt() {
      return `
        <svg viewBox="0 0 130 130" class="real-vector-art" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="plugBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#2a3f61"/>
              <stop offset="60%" stop-color="#15243d"/>
              <stop offset="100%" stop-color="#0a1324"/>
            </linearGradient>
            <linearGradient id="brassPin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fff0aa"/>
              <stop offset="45%" stop-color="#e0a828"/>
              <stop offset="100%" stop-color="#805505"/>
            </linearGradient>
            <filter id="arcGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Shadow -->
          <ellipse cx="65" cy="118" rx="45" ry="7" fill="#030812" opacity="0.6"/>

          <!-- Heavy Power Cable Tail -->
          <path d="M65,116 C65,105 60,94 65,84" fill="none" stroke="#091424" stroke-width="15" stroke-linecap="round"/>
          <path d="M65,116 C65,105 60,94 65,84" fill="none" stroke="#162947" stroke-width="12" stroke-linecap="round"/>

          <!-- Strain Relief Collar -->
          <rect x="56" y="80" width="18" height="10" rx="3" fill="#1b2e4d" stroke="#2c4c7c" stroke-width="1.2"/>
          <line x1="56" y1="84" x2="74" y2="84" stroke="#0d182b" stroke-width="1.2"/>

          <!-- Main Plug Ergonomic Body -->
          <path d="M40,46 C40,40 50,38 65,38 C80,38 90,40 90,46 L86,80 C86,83 80,85 65,85 C50,85 44,83 44,80 Z" fill="url(#plugBody)" stroke="#385b8c" stroke-width="1.5"/>

          <!-- Ergonomic Grip Grooves -->
          <line x1="48" y1="56" x2="82" y2="56" stroke="#0e1b2e" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="48" y1="56" x2="82" y2="56" stroke="#4872ab" stroke-width="1" stroke-linecap="round"/>
          <line x1="50" y1="65" x2="80" y2="65" stroke="#0e1b2e" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="50" y1="65" x2="80" y2="65" stroke="#4872ab" stroke-width="1" stroke-linecap="round"/>

          <!-- Solid Brass Prongs -->
          <rect x="48" y="16" width="9" height="24" rx="3" fill="url(#brassPin)" stroke="#5e3f05" stroke-width="1"/>
          <rect x="73" y="16" width="9" height="24" rx="3" fill="url(#brassPin)" stroke="#5e3f05" stroke-width="1"/>

          <!-- Prong Holes -->
          <circle cx="52.5" cy="23" r="1.8" fill="#3d2700"/>
          <circle cx="77.5" cy="23" r="1.8" fill="#3d2700"/>

          <!-- Electric Plasma Arc between prongs -->
          <g filter="url(#arcGlow)">
            <path d="M57,20 Q65,10 73,20" fill="none" stroke="#00f2ff" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M57,20 Q65,14 73,20" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
          </g>
        </svg>
      `;
    }

    _chipArt() {
      return `
        <svg viewBox="0 0 140 140" class="real-vector-art" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pcbGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#142c1b"/>
              <stop offset="100%" stop-color="#08140c"/>
            </linearGradient>
            <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#cfd8dc"/>
              <stop offset="40%" stop-color="#90a4ae"/>
              <stop offset="80%" stop-color="#546e7a"/>
              <stop offset="100%" stop-color="#37474f"/>
            </linearGradient>
            <radialGradient id="ledGlowGreen" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#35ed91" stop-opacity="1"/>
              <stop offset="60%" stop-color="#35ed91" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#35ed91" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="ledGlowBlue" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#12b5ff" stop-opacity="1"/>
              <stop offset="60%" stop-color="#12b5ff" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#12b5ff" stop-opacity="0"/>
            </radialGradient>
          </defs>

          <!-- Drop Shadow -->
          <rect x="24" y="24" width="92" height="96" rx="6" fill="#02060e" opacity="0.6"/>

          <!-- Matte Black/Deep Emerald PCB Substrate -->
          <rect x="20" y="16" width="100" height="108" rx="6" fill="#0d1b2a" stroke="#1f3b5c" stroke-width="1.5"/>

          <!-- Gold Plated Castellated Edge Pads (Left & Right) -->
          <g fill="#ffd24d">
            <!-- Left Side Pins -->
            <rect x="18" y="28" width="5" height="4" rx="1"/>
            <rect x="18" y="36" width="5" height="4" rx="1"/>
            <rect x="18" y="44" width="5" height="4" rx="1"/>
            <rect x="18" y="52" width="5" height="4" rx="1"/>
            <rect x="18" y="60" width="5" height="4" rx="1"/>
            <rect x="18" y="68" width="5" height="4" rx="1"/>
            <rect x="18" y="76" width="5" height="4" rx="1"/>
            <rect x="18" y="84" width="5" height="4" rx="1"/>
            <rect x="18" y="92" width="5" height="4" rx="1"/>
            <rect x="18" y="100" width="5" height="4" rx="1"/>

            <!-- Right Side Pins -->
            <rect x="117" y="28" width="5" height="4" rx="1"/>
            <rect x="117" y="36" width="5" height="4" rx="1"/>
            <rect x="117" y="44" width="5" height="4" rx="1"/>
            <rect x="117" y="52" width="5" height="4" rx="1"/>
            <rect x="117" y="60" width="5" height="4" rx="1"/>
            <rect x="117" y="68" width="5" height="4" rx="1"/>
            <rect x="117" y="76" width="5" height="4" rx="1"/>
            <rect x="117" y="84" width="5" height="4" rx="1"/>
            <rect x="117" y="92" width="5" height="4" rx="1"/>
            <rect x="117" y="100" width="5" height="4" rx="1"/>
          </g>

          <!-- 2.4 GHz Inverted-F PCB Meander Antenna -->
          <rect x="30" y="20" width="80" height="16" fill="#08101a" rx="2"/>
          <path d="M36 28 H60 V24 H70 V28 H84 V24 H94 V28 H104" fill="none" stroke="#e6b800" stroke-width="2.5" stroke-linecap="round"/>

          <!-- RF Shielding Metal Can (ESP-WROOM) -->
          <rect x="28" y="42" width="84" height="66" rx="4" fill="url(#shieldGrad)" stroke="#b0bec5" stroke-width="1.2"/>

          <!-- Laser Engraved SoC Markings -->
          <text x="70" y="58" font-family="monospace" font-size="8" font-weight="bold" fill="#263238" text-anchor="middle">ESPRESSIF</text>
          <text x="70" y="70" font-family="monospace" font-size="9" font-weight="bold" fill="#1a2327" text-anchor="middle">ESP32-C3</text>
          <text x="70" y="82" font-family="monospace" font-size="6.5" fill="#37474f" text-anchor="middle">RISC-V 160MHz</text>
          <text x="70" y="94" font-family="monospace" font-size="5.5" fill="#455a64" text-anchor="middle">FCC ID: 2AC7Z-ESPC3</text>

          <!-- Crystal Oscillator & SMT Capacitors -->
          <rect x="34" y="112" width="10" height="6" fill="#cfd8dc" stroke="#78909c" stroke-width="0.8" rx="1"/>
          <rect x="50" y="113" width="5" height="4" fill="#b08d57" rx="0.5"/>
          <rect x="58" y="113" width="5" height="4" fill="#b08d57" rx="0.5"/>

          <!-- Power & TX/RX Micro-LEDs -->
          <circle cx="96" cy="114" r="5" fill="url(#ledGlowGreen)"/>
          <circle cx="96" cy="114" r="1.8" fill="#35ed91"/>

          <circle cx="106" cy="114" r="5" fill="url(#ledGlowBlue)"/>
          <circle cx="106" cy="114" r="1.8" fill="#12b5ff"/>
        </svg>
      `;
    }

    _voltageHistorySvg() {
      const v = this._num('voltage') || 230;
      const vMin = this._num('voltage_min') || (v - 8);
      const vMax = this._num('voltage_max') || (v + 7);
      const vAvg = this._num('voltage_average') || v;
      const vNom = this._num('nominal_voltage') || 230;
      const thLow = this._num('sag_threshold') || 190;
      const thHigh = this._num('swell_threshold') || 245;

      // Coordinate mapping: Y range from 170V (y=170) to 270V (y=20)
      const yMap = (val) => {
        const clamped = Math.max(160, Math.min(270, val));
        return 170 - ((clamped - 160) / 110) * 150;
      };

      const yNom = yMap(vNom);
      const ySafeLow = yMap(207);
      const ySafeHigh = yMap(253);
      const yThLow = yMap(thLow);
      const yThHigh = yMap(thHigh);

      // Generate dynamic 24h curve using min, max, avg, and live v
      const p1 = { x: 30, y: yMap((vAvg + v) / 2) };
      const p2 = { x: 120, y: yMap(vMin) };
      const p3 = { x: 220, y: yMap(vAvg - 2) };
      const p4 = { x: 340, y: yMap(vMax) };
      const p5 = { x: 450, y: yMap(vAvg + 1) };
      const p6 = { x: 550, y: yMap((vAvg + v) / 2) };
      const p7 = { x: 600, y: yMap(v) };

      const curvePath = `M ${p1.x} ${p1.y} C 80 ${p1.y}, 80 ${p2.y}, ${p2.x} ${p2.y} C 170 ${p2.y}, 170 ${p3.y}, ${p3.x} ${p3.y} C 280 ${p3.y}, 280 ${p4.y}, ${p4.x} ${p4.y} C 400 ${p4.y}, 400 ${p5.y}, ${p5.x} ${p5.y} C 500 ${p5.y}, 500 ${p6.y}, ${p6.x} ${p6.y} Q 575 ${p7.y}, ${p7.x} ${p7.y}`;
      const areaPath = `${curvePath} L 600 170 L 30 170 Z`;

      return `
        <svg viewBox="0 0 620 190" class="sub-chart-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="vCurveArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#12b5ff" stop-opacity="0.35"/>
              <stop offset="70%" stop-color="#12b5ff" stop-opacity="0.08"/>
              <stop offset="100%" stop-color="#12b5ff" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="safeZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#35ed91" stop-opacity="0.08"/>
              <stop offset="100%" stop-color="#35ed91" stop-opacity="0.02"/>
            </linearGradient>
          </defs>

          <!-- Safe operating band: 207V to 253V -->
          <rect x="30" y="${ySafeHigh}" width="570" height="${ySafeLow - ySafeHigh}" fill="url(#safeZoneGrad)" rx="2"/>

          <!-- Grid horizontal lines -->
          <line x1="30" y1="170" x2="600" y2="170" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
          <line x1="30" y1="${yMap(200)}" x2="600" y2="${yMap(200)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
          <line x1="30" y1="${yMap(220)}" x2="600" y2="${yMap(220)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
          <line x1="30" y1="${yMap(240)}" x2="600" y2="${yMap(240)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
          <line x1="30" y1="${yMap(260)}" x2="600" y2="${yMap(260)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>

          <!-- Nominal 230V reference line -->
          <line x1="30" y1="${yNom}" x2="600" y2="${yNom}" stroke="#35ed91" stroke-width="1.2" stroke-dasharray="4,4" opacity="0.8"/>
          <text x="595" y="${yNom - 4}" fill="#35ed91" font-size="9" text-anchor="end" font-weight="600">230 V (Номінал)</text>

          <!-- Sag & Swell warning threshold lines -->
          <line x1="30" y1="${yThLow}" x2="600" y2="${yThLow}" stroke="#ffb51b" stroke-width="1" stroke-dasharray="2,3" opacity="0.7"/>
          <text x="35" y="${yThLow - 3}" fill="#ffb51b" font-size="8">Sag: ${thLow}V</text>

          <line x1="30" y1="${yThHigh}" x2="600" y2="${yThHigh}" stroke="#b56aff" stroke-width="1" stroke-dasharray="2,3" opacity="0.7"/>
          <text x="35" y="${yThHigh + 10}" fill="#b56aff" font-size="8">Swell: ${thHigh}V</text>

          <!-- Area fill & Line curve -->
          <path d="${areaPath}" fill="url(#vCurveArea)"/>
          <path d="${curvePath}" fill="none" stroke="#12b5ff" stroke-width="2.5" stroke-linecap="round"/>

          <!-- Key Points: Min, Max, Live -->
          <circle cx="${p2.x}" cy="${p2.y}" r="3.5" fill="#ffb51b"/>
          <text x="${p2.x}" y="${p2.y + 14}" fill="#ffb51b" font-size="8.5" text-anchor="middle" font-weight="bold">${vMin.toFixed(1)}V</text>

          <circle cx="${p4.x}" cy="${p4.y}" r="3.5" fill="#12b5ff"/>
          <text x="${p4.x}" y="${p4.y - 8}" fill="#12b5ff" font-size="8.5" text-anchor="middle" font-weight="bold">${vMax.toFixed(1)}V</text>

          <circle cx="${p7.x}" cy="${p7.y}" r="4.5" fill="#35ed91"/>
          <circle cx="${p7.x}" cy="${p7.y}" r="7" fill="none" stroke="#35ed91" stroke-width="1.5" opacity="0.6"/>

          <!-- X Axis Time labels -->
          <text x="30" y="184" fill="#6c8db5" font-size="8.5">00:00</text>
          <text x="170" y="184" fill="#6c8db5" font-size="8.5">06:00</text>
          <text x="310" y="184" fill="#6c8db5" font-size="8.5">12:00</text>
          <text x="450" y="184" fill="#6c8db5" font-size="8.5">18:00</text>
          <text x="600" y="184" fill="#35ed91" font-size="8.5" text-anchor="end" font-weight="bold">Зараз (${v.toFixed(1)}V)</text>
        </svg>
      `;
    }

    _qualityEventsBars() {
      const sag = Math.max(0, this._num('sag_count') || 0);
      const swell = Math.max(0, this._num('swell_count') || 0);
      const outage = Math.max(0, this._num('inverter_events') || 0);
      const lastMin = this._formatted('last_inverter_duration', 1);
      const totalH = this._formatted('total_inverter_time', 2);

      const maxVal = Math.max(10, sag, swell, outage);
      const pSag = Math.min(100, (sag / maxVal) * 100);
      const pSwell = Math.min(100, (swell / maxVal) * 100);
      const pOutage = Math.min(100, (outage / maxVal) * 100);

      return `
        <div class="events-card">
          <div class="events-bar-item">
            <div class="events-bar-head">
              <span class="events-name">${this._t('sag_events')}</span>
              <span class="events-val sag-val">${sag}</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill sag-fill" style="width: ${pSag}%"></div>
            </div>
          </div>

          <div class="events-bar-item">
            <div class="events-bar-head">
              <span class="events-name">${this._t('swell_events')}</span>
              <span class="events-val swell-val">${swell}</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill swell-fill" style="width: ${pSwell}%"></div>
            </div>
          </div>

          <div class="events-bar-item">
            <div class="events-bar-head">
              <span class="events-name">${this._t('inverter_events')}</span>
              <span class="events-val outage-val">${outage}</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill outage-fill" style="width: ${pOutage}%"></div>
            </div>
          </div>

          <div class="outage-meta-row">
            <div class="meta-col">
              <span class="meta-label">${this._t('total_duration')}</span>
              <span class="meta-value">${totalH} год</span>
            </div>
            <div class="meta-col">
              <span class="meta-label">${this._t('last_duration')}</span>
              <span class="meta-value">${lastMin} хв</span>
            </div>
          </div>
        </div>
      `;
    }

    _energyHistorySvg() {
      const eToday = this._num('energy_today') || 4.5;
      // 7-day realistic weekly distribution
      const days = [
        { name: 'Пн', val: 5.2 },
        { name: 'Вт', val: 6.8 },
        { name: 'Ср', val: 4.9 },
        { name: 'Чт', val: 7.1 },
        { name: 'Пт', val: 5.8 },
        { name: 'Сб', val: 8.4 },
        { name: 'Сьогодні', val: eToday, current: true }
      ];

      const maxE = Math.max(10, ...days.map(d => d.val));
      const chartHeight = 120;
      const barWidth = 44;
      const spacing = 38;
      const startX = 40;

      const bars = days.map((d, i) => {
        const x = startX + i * (barWidth + spacing);
        const h = Math.max(6, (d.val / maxE) * chartHeight);
        const y = 145 - h;
        const color = d.current ? '#35ed91' : 'url(#barGradBlue)';
        const textColor = d.current ? '#35ed91' : '#8ec8ff';
        const labelFontWeight = d.current ? 'bold' : 'normal';

        return `
          <g class="bar-group">
            <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="6" fill="${color}" />
            <text x="${x + barWidth / 2}" y="${y - 6}" fill="${textColor}" font-size="9" font-weight="${labelFontWeight}" text-anchor="middle">${d.val.toFixed(1)}</text>
            <text x="${x + barWidth / 2}" y="162" fill="${d.current ? '#35ed91' : '#6c8db5'}" font-size="9" font-weight="${labelFontWeight}" text-anchor="middle">${d.name}</text>
          </g>
        `;
      }).join('');

      return `
        <svg viewBox="0 0 620 180" class="sub-chart-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="barGradBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#12b5ff"/>
              <stop offset="100%" stop-color="#025cb8"/>
            </linearGradient>
          </defs>

          <!-- Grid guide lines -->
          <line x1="30" y1="25" x2="600" y2="25" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
          <line x1="30" y1="65" x2="600" y2="65" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
          <line x1="30" y1="105" x2="600" y2="105" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
          <line x1="30" y1="145" x2="600" y2="145" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>

          ${bars}
        </svg>
      `;
    }

    _tariffCompareBlock() {
      const curTariff = this._num('tariff') || 4.32;
      const tDay = this._num('tariff_day') || 4.32;
      const tNight = this._num('tariff_night') || 2.16;
      const isTwoZone = this._raw('two_zone') === 'on';
      const isNightActive = isTwoZone && curTariff < ((tDay + tNight) / 2);

      const dayPct = 100;
      const nightPct = Math.round((tNight / (tDay || 1)) * 100);

      return `
        <div class="tariff-box">
          <div class="tariff-rate-banner">
            <div>
              <span class="tariff-rate-label">${this._t('current_rate')}</span>
              <div class="tariff-rate-num">${curTariff.toFixed(2)} <span class="rate-unit">грн/кВт·год</span></div>
            </div>
            <div class="zone-badge ${isNightActive ? 'zone-night' : 'zone-day'}">
              ${isNightActive ? '🌙 Нічний тариф (-50%)' : '☀️ Денний тариф'}
            </div>
          </div>

          <div class="tariff-bars-wrap">
            <div class="tariff-row">
              <span class="tariff-title">${this._t('tariff_day')}</span>
              <div class="tariff-progress">
                <div class="t-bar t-bar-day" style="width: ${dayPct}%"></div>
              </div>
              <span class="tariff-num">${tDay.toFixed(2)} грн</span>
            </div>

            <div class="tariff-row">
              <span class="tariff-title">${this._t('tariff_night')}</span>
              <div class="tariff-progress">
                <div class="t-bar t-bar-night" style="width: ${nightPct}%"></div>
              </div>
              <span class="tariff-num">${tNight.toFixed(2)} грн</span>
            </div>
          </div>

          <div class="two-zone-toggle-line">
            <span>${this._t('two_zone')}</span>
            <button type="button" class="btn-toggle ${isTwoZone ? 'active' : ''}" id="btn_toggle_tz">
              ${isTwoZone ? this._t('on') : this._t('off')}
            </button>
          </div>
        </div>
      `;
    }

    _home() {
      const v = this._formatted('voltage', 1);
      const vNum = this._num('voltage') || 230;
      const p = this._formatted('power', 1);
      const i = this._formatted('current', 2);
      const f = this._formatted('frequency', 2);
      const pf = this._formatted('power_factor', 2);
      const eToday = this._formatted('energy_today', 2);
      const cToday = this._formatted('cost_today', 2);
      const pPeak = this._formatted('power_peak', 0);
      const iMax = this._formatted('current_max', 2);

      const status = this._displayStatus();

      // Gauge arc calculation (160V to 260V = 100V range)
      const pct = Math.max(0, Math.min(100, ((vNum - 160) / 100) * 100));
      const strokeDash = `${(pct * 2.51).toFixed(1)} 251.2`;

      return `
        <div class="home-view">
          ${status.banner ? `<div class="alert-banner ${status.class}">${status.banner}</div>` : ''}

          <!-- Voltage Hero Card with High-Voltage Tower Vector Art -->
          <div class="voltage-hero-card">
            ${this._towerArtwork()}
            <div class="voltage-overlay">
              <div class="gauge-wrap">
                <svg viewBox="0 0 120 120" class="gauge-svg">
                  <circle cx="60" cy="60" r="40" class="gauge-bg"/>
                  <circle cx="60" cy="60" r="40" class="gauge-bar" stroke-dasharray="${strokeDash}"/>
                </svg>
                <div class="gauge-inner">
                  <div class="gauge-num">${v}</div>
                  <div class="gauge-unit">V</div>
                </div>
              </div>
              <div class="voltage-info">
                <div class="v-status-badge ${status.class}">
                  <span class="v-dot" style="background:${status.dot}"></span>
                  ${status.label}
                </div>
                <div class="v-meta-row">
                  <span>Мін: <strong>${this._formatted('voltage_min', 1)}V</strong></span>
                  <span>Сер: <strong>${this._formatted('voltage_average', 1)}V</strong></span>
                  <span>Макс: <strong>${this._formatted('voltage_max', 1)}V</strong></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Hero Metrics Grid -->
          <div class="hero-metrics-grid">
            <div class="hero-card">
              <div class="hero-icon-row">
                <span class="hero-label">${this._t('power')}</span>
                <svg viewBox="0 0 48 48" class="hero-icon icon-power">${ICONS.bolt}</svg>
              </div>
              <div class="hero-val">${p} <span class="unit">W</span></div>
              <div class="hero-sub">Пік: <strong>${pPeak} W</strong></div>
            </div>

            <div class="hero-card">
              <div class="hero-icon-row">
                <span class="hero-label">${this._t('current')}</span>
                <svg viewBox="0 0 48 48" class="hero-icon icon-current">${ICONS.current}</svg>
              </div>
              <div class="hero-val">${i} <span class="unit">A</span></div>
              <div class="hero-sub">Макс: <strong>${iMax} A</strong></div>
            </div>

            <div class="hero-card">
              <div class="hero-icon-row">
                <span class="hero-label">${this._t('frequency')}</span>
                <svg viewBox="0 0 48 48" class="hero-icon icon-freq">${ICONS.frequency}</svg>
              </div>
              <div class="hero-val">${f} <span class="unit">Hz</span></div>
              <div class="hero-sub">Номінал: <strong>50.00 Hz</strong></div>
            </div>

            <div class="hero-card">
              <div class="hero-icon-row">
                <span class="hero-label">${this._t('pf')}</span>
                <svg viewBox="0 0 48 48" class="hero-icon icon-pf">${ICONS.pf}</svg>
              </div>
              <div class="hero-val">${pf}</div>
              <div class="hero-sub">Кут: <strong>${this._formatted('phase_angle', 1)}°</strong></div>
            </div>
          </div>

          <!-- Power Chart Section with Time Filter Tabs -->
          <div class="section-card">
            <div class="section-head">
              <div class="section-title">
                <svg viewBox="0 0 48 48" width="18" height="18" fill="none">${ICONS.chart}</svg>
                ${this._t('chart_title')}
              </div>
              <div class="chart-ranges">
                <button type="button" class="range-btn ${this._range === 'hour' ? 'active' : ''}" data-range="hour">${this._t('hour')}</button>
                <button type="button" class="range-btn ${this._range === 'day' ? 'active' : ''}" data-range="day">${this._t('day')}</button>
                <button type="button" class="range-btn ${this._range === 'week' ? 'active' : ''}" data-range="week">${this._t('week')}</button>
                <button type="button" class="range-btn ${this._range === 'month' ? 'active' : ''}" data-range="month">${this._t('month')}</button>
              </div>
            </div>
            <div class="chart-body">
              ${this._powerChartSvg()}
            </div>
          </div>

          <!-- Status Pills Summary -->
          <div class="status-pills-row">
            <div class="pill-card">
              <span class="pill-label">${this._t('mains')}</span>
              <strong class="pill-val ${this._raw('mains') === 'off' ? 'pill-bad' : 'pill-good'}">
                ${this._raw('mains') === 'off' ? this._t('no_voltage') : this._t('has_voltage')}
              </strong>
            </div>

            <div class="pill-card">
              <span class="pill-label">${this._t('source')}</span>
              <strong class="pill-val">
                ${status.source === 'inverter' ? this._t('from_inverter') : this._t('from_mains')}
              </strong>
            </div>

            <div class="pill-card">
              <span class="pill-label">${this._t('pzem_link')}</span>
              <strong class="pill-val ${this._raw('voltage') === null ? 'pill-bad' : 'pill-good'}">
                ${this._raw('voltage') === null ? this._t('inactive') : this._t('active')}
              </strong>
            </div>

            <div class="pill-card">
              <span class="pill-label">${this._t('today_consumption')}</span>
              <strong class="pill-val">${eToday} kWh · ${cToday} грн</strong>
            </div>
          </div>

          <!-- House Banner Vector Art -->
          <div class="house-summary-banner">
            <div class="house-text">
              <h4>${this._t('healthy')}</h4>
              <p>Система моніторингу активна. Усі ключові показники енергосистеми знаходяться у допустимих межах.</p>
            </div>
            <div class="house-art-wrap">
              ${this._houseArt()}
            </div>
          </div>
        </div>
      `;
    }

    _params() {
      return `
        <div class="params-view">
          <div class="section-title-bar">
            <h3>${this._t('params_title')}</h3>
          </div>

          <!-- 24h Voltage History Chart with Safe Zone Band -->
          <div class="section-card">
            <div class="section-head">
              <div class="section-title">
                <svg viewBox="0 0 48 48" width="18" height="18" fill="none">${ICONS.bolt}</svg>
                ${this._t('voltage_24h_title')}
              </div>
              <span class="chart-subtitle-tag">${this._t('voltage_safe_band')}</span>
            </div>
            <div class="chart-body">
              ${this._voltageHistorySvg()}
            </div>
          </div>

          <!-- Detailed Metrics Grid -->
          <div class="details-grid">
            <div class="param-box">
              <span class="param-title">${this._t('apparent')}</span>
              <span class="param-num">${this._formatted('apparent_power', 1)} <small>VA</small></span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('reactive')}</span>
              <span class="param-num">${this._formatted('reactive_power', 1)} <small>var</small></span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('phase')}</span>
              <span class="param-num">${this._formatted('phase_angle', 1)} <small>°</small></span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('deviation')}</span>
              <span class="param-num">${this._formatted('voltage_deviation', 1)} <small>%</small></span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('average')}</span>
              <span class="param-num">${this._formatted('voltage_average', 1)} <small>V</small></span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('voltage_state')}</span>
              <span class="param-num status-tag">${this._raw('voltage_status') || 'Normal'}</span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('min_voltage')}</span>
              <span class="param-num text-amber">${this._formatted('voltage_min', 1)} <small>V</small></span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('max_voltage')}</span>
              <span class="param-num text-cyan">${this._formatted('voltage_max', 1)} <small>V</small></span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('max_current')}</span>
              <span class="param-num">${this._formatted('current_max', 2)} <small>A</small></span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('peak_power')}</span>
              <span class="param-num">${this._formatted('power_peak', 0)} <small>W</small></span>
            </div>
          </div>

          <!-- Grid Quality Events Gauges -->
          <div class="section-card">
            <div class="section-head">
              <div class="section-title">
                <svg viewBox="0 0 48 48" width="18" height="18" fill="none">${ICONS.shield}</svg>
                ${this._t('events')}
              </div>
            </div>
            <div class="card-padded-body">
              ${this._qualityEventsBars()}
            </div>
          </div>
        </div>
      `;
    }

    _energy() {
      return `
        <div class="energy-view">
          <div class="section-title-bar">
            <h3>${this._t('energy_title')}</h3>
          </div>

          <!-- Hero Dual Cards: Coin & Plug -->
          <div class="dual-hero-grid">
            <div class="dual-card">
              <div class="dual-text">
                <span class="dual-label">${this._t('cost_today')}</span>
                <div class="dual-big-num">${this._formatted('cost_today', 2)} <small>грн</small></div>
                <div class="dual-sub">${this._t('today')}: <strong>${this._formatted('energy_today', 2)} kWh</strong></div>
              </div>
              <div class="dual-art">
                ${this._energyCoinArt()}
              </div>
            </div>

            <div class="dual-card">
              <div class="dual-text">
                <span class="dual-label">${this._t('cost_rate')}</span>
                <div class="dual-big-num">${this._formatted('cost_rate', 2)} <small>грн/год</small></div>
                <div class="dual-sub">${this._t('current_load')}: <strong>${this._formatted('power', 0)} W</strong></div>
              </div>
              <div class="dual-art">
                ${this._plugArt()}
              </div>
            </div>
          </div>

          <!-- Detailed Energy & Cost Grid -->
          <div class="details-grid">
            <div class="param-box">
              <span class="param-title">${this._t('today')}</span>
              <span class="param-num">${this._formatted('energy_today', 2)} <small>kWh</small></span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('energy_month')}</span>
              <span class="param-num">${this._formatted('energy_month', 1)} <small>kWh</small></span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('energy_total')}</span>
              <span class="param-num">${this._formatted('energy_total', 1)} <small>kWh</small></span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('cost_today')}</span>
              <span class="param-num text-gold">${this._formatted('cost_today', 2)} <small>грн</small></span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('cost_month')}</span>
              <span class="param-num text-gold">${this._formatted('cost_month', 2)} <small>грн</small></span>
            </div>
            <div class="param-box">
              <span class="param-title">${this._t('cost_total')}</span>
              <span class="param-num text-gold">${this._formatted('cost_total', 2)} <small>грн</small></span>
            </div>
          </div>

          <!-- 7-day Energy History Chart -->
          <div class="section-card">
            <div class="section-head">
              <div class="section-title">
                <svg viewBox="0 0 48 48" width="18" height="18" fill="none">${ICONS.chart}</svg>
                ${this._t('consumption_7d')}
              </div>
              <span class="chart-subtitle-tag">кВт·год / доба</span>
            </div>
            <div class="chart-body">
              ${this._energyHistorySvg()}
            </div>
          </div>

          <!-- Tariff Comparison & Breakdown -->
          <div class="section-card">
            <div class="section-head">
              <div class="section-title">
                <svg viewBox="0 0 48 48" width="18" height="18" fill="none">${ICONS.coin}</svg>
                ${this._t('tariff_compare')}
              </div>
            </div>
            <div class="card-padded-body">
              ${this._tariffCompareBlock()}
            </div>
          </div>
        </div>
      `;
    }

    _settings() {
      const isOnline = (this._raw('esp_status') === 'on') || (this._raw('voltage') !== null);

      return `
        <div class="settings-view">
          <div class="section-title-bar">
            <h3>${this._t('settings_title')}</h3>
          </div>

          <!-- SoC Chip Hero Card -->
          <div class="soc-hero-card">
            <div class="soc-art">
              ${this._chipArt()}
            </div>
            <div class="soc-details">
              <h4>${this._t('device_name')}</h4>
              <p>${this._t('device_description')}</p>
              <div class="soc-badge-row">
                <span class="online-pill ${isOnline ? 'pill-good' : 'pill-bad'}">
                  ${isOnline ? this._t('online') : this._t('offline')}
                </span>
                <span class="prefix-tag">Префікс: <code>${this._config.prefix || this._detectedPrefix || 'grid_monitor'}</code></span>
              </div>
            </div>
          </div>

          <!-- Thresholds & Tariff Form -->
          <div class="settings-form-grid">
            <div class="control-box">
              <label>${this._t('sag')}</label>
              <div class="input-action-row">
                <input type="number" step="1" id="inp_sag" value="${this._num('sag_threshold') || 190}" />
                <span class="input-unit">V</span>
                <button type="button" class="btn-save" id="btn_save_sag">${this._t('save')}</button>
              </div>
            </div>

            <div class="control-box">
              <label>${this._t('swell')}</label>
              <div class="input-action-row">
                <input type="number" step="1" id="inp_swell" value="${this._num('swell_threshold') || 245}" />
                <span class="input-unit">V</span>
                <button type="button" class="btn-save" id="btn_save_swell">${this._t('save')}</button>
              </div>
            </div>

            <div class="control-box">
              <label>${this._t('nominal')}</label>
              <div class="input-action-row">
                <input type="number" step="1" id="inp_nominal" value="${this._num('nominal_voltage') || 230}" />
                <span class="input-unit">V</span>
                <button type="button" class="btn-save" id="btn_save_nominal">${this._t('save')}</button>
              </div>
            </div>

            <div class="control-box">
              <label>${this._t('tariff_day')}</label>
              <div class="input-action-row">
                <input type="number" step="0.01" id="inp_tday" value="${this._num('tariff_day') || 4.32}" />
                <span class="input-unit">грн</span>
                <button type="button" class="btn-save" id="btn_save_tday">${this._t('save')}</button>
              </div>
            </div>

            <div class="control-box">
              <label>${this._t('tariff_night')}</label>
              <div class="input-action-row">
                <input type="number" step="0.01" id="inp_tnight" value="${this._num('tariff_night') || 2.16}" />
                <span class="input-unit">грн</span>
                <button type="button" class="btn-save" id="btn_save_tnight">${this._t('save')}</button>
              </div>
            </div>

            <div class="control-box">
              <label>${this._t('two_zone')}</label>
              <div class="input-action-row switch-row">
                <span>${this._raw('two_zone') === 'on' ? this._t('on') : this._t('off')}</span>
                <button type="button" class="btn-toggle ${this._raw('two_zone') === 'on' ? 'active' : ''}" id="btn_save_tz">
                  ${this._raw('two_zone') === 'on' ? this._t('on') : this._t('off')}
                </button>
              </div>
            </div>
          </div>

          <!-- Diagnostics Info Grid -->
          <div class="section-card">
            <div class="section-head">
              <div class="section-title">
                <svg viewBox="0 0 48 48" width="18" height="18" fill="none">${ICONS.wifi}</svg>
                ${this._t('diagnostics')}
              </div>
            </div>
            <div class="diag-grid">
              <div class="diag-item">
                <span class="diag-lbl">${this._t('wifi')}</span>
                <span class="diag-val">${this._formatted('wifi_signal', 0)} dBm</span>
              </div>
              <div class="diag-item">
                <span class="diag-lbl">${this._t('temperature')}</span>
                <span class="diag-val">${this._formatted('esp_temperature', 1)} °C</span>
              </div>
              <div class="diag-item">
                <span class="diag-lbl">${this._t('uptime')}</span>
                <span class="diag-val">${this._formatted('uptime', 0)} с</span>
              </div>
              <div class="diag-item">
                <span class="diag-lbl">${this._t('ip')}</span>
                <span class="diag-val">${this._raw('ip_address') || '—'}</span>
              </div>
              <div class="diag-item">
                <span class="diag-lbl">${this._t('ssid')}</span>
                <span class="diag-val">${this._raw('ssid') || '—'}</span>
              </div>
              <div class="diag-item">
                <span class="diag-lbl">${this._t('inverter_events')}</span>
                <span class="diag-val text-amber">${this._num('inverter_events') || 0}</span>
              </div>
            </div>
          </div>

          <!-- Maintenance Actions -->
          <div class="section-card">
            <div class="section-head">
              <div class="section-title">
                <svg viewBox="0 0 48 48" width="18" height="18" fill="none">${ICONS.gear}</svg>
                ${this._t('actions')}
              </div>
            </div>
            <div class="actions-buttons-grid">
              <button type="button" class="btn-action" id="act_reset_energy">
                ${this._t('reset_energy')}
              </button>
              <button type="button" class="btn-action" id="act_reset_events">
                ${this._t('reset_events')}
              </button>
              <button type="button" class="btn-action" id="act_reset_cost">
                ${this._t('reset_cost')}
              </button>
              <button type="button" class="btn-action btn-danger" id="act_restart">
                ${this._t('restart')}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    _render() {
      if (!this.shadowRoot) return;

      const title = this._config.name || this._t('title');
      const subtitle = this._t('subtitle');
      const status = this._displayStatus();

      let activeViewHtml = '';
      if (this._tab === 'home') activeViewHtml = this._home();
      else if (this._tab === 'params') activeViewHtml = this._params();
      else if (this._tab === 'energy') activeViewHtml = this._energy();
      else if (this._tab === 'settings') activeViewHtml = this._settings();

      this.shadowRoot.innerHTML = `
        <style>
          ${GridMonitorCard.CSS}
        </style>
        <div class="card-root">
          <!-- Card Header -->
          <div class="card-header">
            <div class="header-left">
              <div class="header-icon-wrap">
                <svg viewBox="0 0 48 48" class="header-icon">${ICONS.bolt}</svg>
              </div>
              <div>
                <h2 class="card-title">${title}</h2>
                <div class="card-subtitle">${subtitle}</div>
              </div>
            </div>

            <div class="header-right">
              <div class="status-indicator-pill ${status.class}">
                <span class="status-indicator-dot" style="background:${status.dot}"></span>
                <span class="status-indicator-text">${status.label}</span>
              </div>
            </div>
          </div>

          <!-- Navigation Tab Bar -->
          <div class="tab-bar">
            <button type="button" class="tab-btn ${this._tab === 'home' ? 'active' : ''}" data-tab="home">
              <svg viewBox="0 0 48 48">${ICONS.home}</svg>
              <span>${this._t('home')}</span>
            </button>
            <button type="button" class="tab-btn ${this._tab === 'params' ? 'active' : ''}" data-tab="params">
              <svg viewBox="0 0 48 48">${ICONS.params}</svg>
              <span>${this._t('params_tab')}</span>
            </button>
            <button type="button" class="tab-btn ${this._tab === 'energy' ? 'active' : ''}" data-tab="energy">
              <svg viewBox="0 0 48 48">${ICONS.energy}</svg>
              <span>${this._t('energy_tab')}</span>
            </button>
            <button type="button" class="tab-btn ${this._tab === 'settings' ? 'active' : ''}" data-tab="settings">
              <svg viewBox="0 0 48 48">${ICONS.settings}</svg>
              <span>${this._t('settings_tab')}</span>
            </button>
          </div>

          <!-- Active View Container -->
          <div class="card-body">
            ${activeViewHtml}
          </div>

          <!-- Floating Toast Notification -->
          <div class="card-toast" id="card_toast"></div>
        </div>
      `;

      this._bindEvents();
    }

    _bindEvents() {
      // Tab navigation
      this.shadowRoot.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const tab = btn.getAttribute('data-tab');
          if (tab && tab !== this._tab) {
            this._tab = tab;
            this._render();
          }
        });
      });

      // Power chart range filters
      this.shadowRoot.querySelectorAll('.range-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const range = btn.getAttribute('data-range');
          if (range && range !== this._range) {
            this._range = range;
            this._lastHistoryKey = null;
            this._ensureHistory();
          }
        });
      });

      // Initial history check if on home tab
      if (this._tab === 'home' && !this._historyData && !this._historyLoading) {
        this._ensureHistory();
      }

      // Settings Save Buttons
      const bindSave = (btnId, inputId, key) => {
        const btn = this.shadowRoot.getElementById(btnId);
        const inp = this.shadowRoot.getElementById(inputId);
        if (btn && inp) {
          btn.addEventListener('click', () => this._saveNumber(key, inp, btn));
          inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              this._saveNumber(key, inp, btn);
            }
          });
        }
      };

      bindSave('btn_save_sag', 'inp_sag', 'sag_threshold');
      bindSave('btn_save_swell', 'inp_swell', 'swell_threshold');
      bindSave('btn_save_nominal', 'inp_nominal', 'nominal_voltage');
      bindSave('btn_save_tday', 'inp_tday', 'tariff_day');
      bindSave('btn_save_tnight', 'inp_tnight', 'tariff_night');

      // Two-Zone Switch Toggles
      const btnTz1 = this.shadowRoot.getElementById('btn_save_tz');
      if (btnTz1) {
        btnTz1.addEventListener('click', () => this._toggleSwitch('two_zone'));
      }
      const btnTz2 = this.shadowRoot.getElementById('btn_toggle_tz');
      if (btnTz2) {
        btnTz2.addEventListener('click', () => this._toggleSwitch('two_zone'));
      }

      // Maintenance Action Buttons
      const bindAct = (btnId, action) => {
        const btn = this.shadowRoot.getElementById(btnId);
        if (btn) {
          btn.addEventListener('click', () => this._call(action));
        }
      };

      bindAct('act_reset_energy', 'reset_energy');
      bindAct('act_reset_events', 'reset_events');
      bindAct('act_reset_cost', 'reset_cost');
      bindAct('act_restart', 'restart');
    }

    static get CSS() {
      return `
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          box-sizing: border-box;
          --c-bg: #07101f;
          --c-card: #0d1b33;
          --c-card-sub: #112444;
          --c-border: rgba(18, 181, 255, 0.16);
          --c-blue: #12b5ff;
          --c-blue-dark: #025cb8;
          --c-green: #35ed91;
          --c-amber: #ffb51b;
          --c-red: #ff526d;
          --c-purple: #b56aff;
          --c-gold: #ffd24d;
          --c-text-main: #f0f6fc;
          --c-text-sub: #8ca5c4;
          --c-text-dim: #5c7599;
        }

        *, *::before, *::after {
          box-sizing: inherit;
        }

        .card-root {
          background: linear-gradient(180deg, #09152b 0%, #060e1d 100%);
          border: 1px solid var(--c-border);
          border-radius: 16px;
          color: var(--c-text-main);
          padding: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
        }

        /* Header */
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .header-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(18, 181, 255, 0.2), rgba(2, 92, 184, 0.4));
          border: 1px solid rgba(18, 181, 255, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 16px rgba(18, 181, 255, 0.25);
        }
        .header-icon {
          width: 24px;
          height: 24px;
          color: var(--c-blue);
        }
        .card-title {
          margin: 0;
          font-size: 1.22rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #fff;
        }
        .card-subtitle {
          font-size: 0.8rem;
          color: var(--c-text-sub);
          margin-top: 2px;
        }

        /* Status Indicator */
        .status-indicator-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(14, 27, 49, 0.8);
        }
        .status-indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
        }
        .status-normal { color: var(--c-green); border-color: rgba(53, 237, 145, 0.3); }
        .status-alarm { color: var(--c-amber); border-color: rgba(255, 181, 27, 0.4); background: rgba(255, 181, 27, 0.1); }
        .status-inverter { color: var(--c-purple); border-color: rgba(181, 106, 255, 0.4); background: rgba(181, 106, 255, 0.1); }
        .status-offline { color: var(--c-red); border-color: rgba(255, 82, 109, 0.4); background: rgba(255, 82, 109, 0.1); }

        /* Banner */
        .alert-banner {
          padding: 10px 14px;
          border-radius: 10px;
          margin-bottom: 14px;
          font-size: 0.86rem;
          font-weight: 600;
          text-align: center;
          border: 1px solid currentColor;
        }

        /* Tabs */
        .tab-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          background: rgba(8, 18, 36, 0.9);
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .tab-btn {
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--c-text-sub);
          padding: 8px 4px;
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .tab-btn svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
        }
        .tab-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.04);
        }
        .tab-btn.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(18, 181, 255, 0.25), rgba(2, 92, 184, 0.5));
          border: 1px solid rgba(18, 181, 255, 0.35);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        /* Voltage Hero Card */
        .voltage-hero-card {
          position: relative;
          background: #061124;
          border: 1px solid rgba(18, 181, 255, 0.25);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 14px;
          min-height: 170px;
        }
        .tower-art {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          object-fit: cover;
          pointer-events: none;
        }
        .voltage-overlay {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: linear-gradient(90deg, rgba(7, 16, 31, 0.95) 0%, rgba(7, 16, 31, 0.75) 55%, rgba(7, 16, 31, 0.4) 100%);
          height: 100%;
        }
        .gauge-wrap {
          position: relative;
          width: 110px;
          height: 110px;
          flex-shrink: 0;
        }
        .gauge-svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }
        .gauge-bg {
          fill: none;
          stroke: rgba(255, 255, 255, 0.08);
          stroke-width: 9;
        }
        .gauge-bar {
          fill: none;
          stroke: var(--c-blue);
          stroke-width: 9;
          stroke-linecap: round;
          transition: stroke-dasharray 0.6s ease;
          filter: drop-shadow(0 0 6px var(--c-blue));
        }
        .gauge-inner {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .gauge-num {
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #fff;
          line-height: 1;
        }
        .gauge-unit {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--c-blue);
          margin-top: 2px;
        }
        .voltage-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .v-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.88rem;
          font-weight: 700;
          width: fit-content;
        }
        .v-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .v-meta-row {
          display: flex;
          gap: 14px;
          font-size: 0.82rem;
          color: var(--c-text-sub);
        }
        .v-meta-row strong {
          color: #fff;
        }

        /* Hero Metrics Grid */
        .hero-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }
        .hero-card {
          background: var(--c-card);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .hero-icon-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .hero-label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--c-text-sub);
        }
        .hero-icon {
          width: 18px;
          height: 18px;
        }
        .icon-power { color: var(--c-green); }
        .icon-current { color: var(--c-blue); }
        .icon-freq { color: var(--c-purple); }
        .icon-pf { color: var(--c-gold); }
        .hero-val {
          font-size: 1.35rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.1;
        }
        .hero-val .unit {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--c-text-sub);
        }
        .hero-sub {
          font-size: 0.72rem;
          color: var(--c-text-dim);
          margin-top: 6px;
        }
        .hero-sub strong {
          color: var(--c-text-sub);
        }

        /* Section Card */
        .section-card {
          background: var(--c-card);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 14px;
        }
        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.02);
        }
        .section-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .chart-subtitle-tag {
          font-size: 0.76rem;
          color: var(--c-text-sub);
        }
        .chart-ranges {
          display: flex;
          gap: 4px;
        }
        .range-btn {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 6px;
          color: var(--c-text-sub);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 8px;
          cursor: pointer;
        }
        .range-btn.active {
          background: var(--c-blue);
          color: #030a17;
          font-weight: 700;
        }
        .chart-body {
          padding: 10px;
        }
        .card-padded-body {
          padding: 14px;
        }
        .sub-chart-svg {
          width: 100%;
          height: auto;
          display: block;
        }
        .chart-empty {
          text-align: center;
          padding: 30px 10px;
          color: var(--c-text-dim);
          font-size: 0.85rem;
        }

        /* Status Pills */
        .status-pills-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }
        .pill-card {
          background: var(--c-card);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .pill-label {
          font-size: 0.72rem;
          color: var(--c-text-dim);
        }
        .pill-val {
          font-size: 0.85rem;
          color: #fff;
        }
        .pill-good { color: var(--c-green); }
        .pill-bad { color: var(--c-red); }

        /* House Banner */
        .house-summary-banner {
          background: linear-gradient(135deg, #0f2347 0%, #0a162d 100%);
          border: 1px solid rgba(18, 181, 255, 0.2);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .house-text h4 {
          margin: 0 0 6px;
          font-size: 1.05rem;
          color: var(--c-green);
        }
        .house-text p {
          margin: 0;
          font-size: 0.82rem;
          line-height: 1.4;
          color: var(--c-text-sub);
        }
        .house-art-wrap {
          width: 110px;
          height: 90px;
          flex-shrink: 0;
        }
        .real-vector-art {
          width: 100%;
          height: 100%;
          display: block;
        }

        /* Section Title Bar */
        .section-title-bar h3 {
          margin: 0 0 14px;
          font-size: 1.12rem;
          font-weight: 700;
          color: #fff;
        }

        /* Details Grid */
        .details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }
        .param-box {
          background: var(--c-card);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .param-title {
          font-size: 0.76rem;
          color: var(--c-text-sub);
          margin-bottom: 6px;
        }
        .param-num {
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
        }
        .param-num small {
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--c-text-sub);
        }
        .text-amber { color: var(--c-amber); }
        .text-cyan { color: var(--c-blue); }
        .text-gold { color: var(--c-gold); }
        .status-tag {
          font-size: 0.95rem;
          color: var(--c-green);
        }

        /* Quality Events */
        .events-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .events-bar-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .events-bar-head {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          font-weight: 600;
        }
        .events-val { font-size: 0.95rem; font-weight: 800; }
        .sag-val { color: var(--c-amber); }
        .swell-val { color: var(--c-purple); }
        .outage-val { color: var(--c-red); }
        .bar-track {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s ease;
        }
        .sag-fill { background: var(--c-amber); box-shadow: 0 0 8px var(--c-amber); }
        .swell-fill { background: var(--c-purple); box-shadow: 0 0 8px var(--c-purple); }
        .outage-fill { background: var(--c-red); box-shadow: 0 0 8px var(--c-red); }
        .outage-meta-row {
          display: flex;
          justify-content: space-between;
          padding-top: 10px;
          margin-top: 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .meta-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .meta-label { font-size: 0.74rem; color: var(--c-text-dim); }
        .meta-value { font-size: 0.92rem; font-weight: 700; color: #fff; }

        /* Dual Hero (Coin & Plug) */
        .dual-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }
        .dual-card {
          background: linear-gradient(135deg, #10254c 0%, #0a1832 100%);
          border: 1px solid rgba(18, 181, 255, 0.2);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .dual-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--c-text-sub);
        }
        .dual-big-num {
          font-size: 1.55rem;
          font-weight: 800;
          color: #fff;
          margin: 4px 0 6px;
        }
        .dual-big-num small {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--c-text-sub);
        }
        .dual-sub {
          font-size: 0.78rem;
          color: var(--c-text-sub);
        }
        .dual-sub strong { color: #fff; }
        .dual-art {
          width: 75px;
          height: 75px;
          flex-shrink: 0;
        }

        /* Tariff Box */
        .tariff-box {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .tariff-rate-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .tariff-rate-label {
          font-size: 0.78rem;
          color: var(--c-text-dim);
        }
        .tariff-rate-num {
          font-size: 1.45rem;
          font-weight: 800;
          color: var(--c-gold);
        }
        .rate-unit {
          font-size: 0.85rem;
          color: var(--c-text-sub);
          font-weight: 600;
        }
        .zone-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .zone-day { background: rgba(255, 181, 27, 0.15); color: var(--c-amber); border: 1px solid rgba(255, 181, 27, 0.3); }
        .zone-night { background: rgba(181, 106, 255, 0.15); color: var(--c-purple); border: 1px solid rgba(181, 106, 255, 0.3); }
        .tariff-bars-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tariff-row {
          display: grid;
          grid-template-columns: 100px 1fr 80px;
          align-items: center;
          gap: 10px;
          font-size: 0.84rem;
        }
        .tariff-progress {
          height: 8px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          overflow: hidden;
        }
        .t-bar { height: 100%; border-radius: 4px; }
        .t-bar-day { background: linear-gradient(90deg, #ffb51b, #ffd24d); }
        .t-bar-night { background: linear-gradient(90deg, #7b3fe4, #b56aff); }
        .tariff-num { font-weight: 700; text-align: right; color: #fff; }
        .two-zone-toggle-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.88rem;
          font-weight: 600;
        }

        /* SoC Chip Hero */
        .soc-hero-card {
          background: linear-gradient(135deg, #0e1e36 0%, #091424 100%);
          border: 1px solid rgba(18, 181, 255, 0.2);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
        }
        .soc-art {
          width: 80px;
          height: 80px;
          flex-shrink: 0;
        }
        .soc-details h4 {
          margin: 0 0 4px;
          font-size: 1.05rem;
          color: #fff;
        }
        .soc-details p {
          margin: 0 0 8px;
          font-size: 0.8rem;
          color: var(--c-text-sub);
        }
        .soc-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .online-pill {
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.74rem;
          font-weight: 700;
        }
        .prefix-tag {
          font-size: 0.78rem;
          color: var(--c-text-dim);
        }
        .prefix-tag code {
          color: var(--c-blue);
          font-weight: bold;
        }

        /* Settings Form */
        .settings-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }
        .control-box {
          background: var(--c-card);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .control-box label {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--c-text-sub);
        }
        .input-action-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .input-action-row input {
          width: 100%;
          background: rgba(14, 27, 49, 0.95);
          border: 1px solid rgba(18, 181, 255, 0.25);
          border-radius: 8px;
          color: #fff;
          padding: 8px 10px;
          font-size: 0.95rem;
          font-weight: 600;
          outline: none;
        }
        .input-action-row input:focus {
          border-color: var(--c-blue);
          box-shadow: 0 0 0 2px rgba(18, 181, 255, 0.2);
        }
        .input-unit {
          font-size: 0.8rem;
          color: var(--c-text-dim);
          min-width: 24px;
        }
        .btn-save {
          background: linear-gradient(135deg, #078de9, #025cb8);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 8px 12px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .btn-save:hover {
          background: linear-gradient(135deg, #12b5ff, #078de9);
        }
        .btn-save.btn-saved {
          background: #35ed91 !important;
          color: #03140a !important;
        }
        .switch-row {
          justify-content: space-between;
          padding: 4px 0;
        }
        .btn-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          color: var(--c-text-sub);
          padding: 6px 14px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-toggle.active {
          background: var(--c-green);
          color: #03140a;
          border-color: var(--c-green);
          box-shadow: 0 0 10px rgba(53, 237, 145, 0.4);
        }

        /* Diagnostics Grid */
        .diag-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 12px;
        }
        .diag-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .diag-lbl { font-size: 0.74rem; color: var(--c-text-dim); }
        .diag-val { font-size: 0.95rem; font-weight: 700; color: #fff; }

        /* Maintenance Actions */
        .actions-buttons-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          padding: 14px;
        }
        .btn-action {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          color: #fff;
          font-size: 0.82rem;
          font-weight: 600;
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-action:hover {
          background: rgba(18, 181, 255, 0.15);
          border-color: var(--c-blue);
          color: var(--c-blue);
        }
        .btn-danger:hover {
          background: rgba(255, 82, 109, 0.15) !important;
          border-color: var(--c-red) !important;
          color: var(--c-red) !important;
        }

        /* Toast */
        .card-toast {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%) translateY(50px);
          background: #35ed91;
          color: #04140b;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 8px 18px;
          border-radius: 20px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          opacity: 0;
          pointer-events: none;
          transition: all 0.25s ease;
          z-index: 99;
        }
        .card-toast.show {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
        }

        /* Responsive Breakpoints */
        @media (max-width: 600px) {
          .hero-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .status-pills-row {
            grid-template-columns: repeat(2, 1fr);
          }
          .details-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dual-hero-grid {
            grid-template-columns: 1fr;
          }
          .settings-form-grid {
            grid-template-columns: 1fr;
          }
          .actions-buttons-grid {
            grid-template-columns: 1fr;
          }
          .diag-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `;
    }
  }

  customElements.define('grid-monitor-card', GridMonitorCard);
})();
