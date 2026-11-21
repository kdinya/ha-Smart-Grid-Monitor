/* Smart Grid Monitor Card — live Home Assistant dashboard, no external dependencies. */
(() => {
  window.customCards = window.customCards || [];
  if (!window.customCards.some((card) => card.type === 'grid-monitor-card')) {
    window.customCards.push({
      type: 'grid-monitor-card',
      name: 'Smart Grid Monitor Card',
      description: 'Live Ukrainian/English ESPHome energy dashboard',
      preview: true,
      documentationURL: 'https://github.com/kdinya/ha-Smart-Grid-Monitor',
    });
  }

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

  const DEFAULTS = {
    voltage: 'sensor.grid_monitor_voltage', current: 'sensor.grid_monitor_current',
    power: 'sensor.grid_monitor_power', frequency: 'sensor.grid_monitor_frequency',
    power_factor: 'sensor.grid_monitor_power_factor', voltage_status: 'sensor.grid_monitor_voltage_status',
    mains: 'binary_sensor.grid_monitor_mains_present', inverter: 'binary_sensor.grid_monitor_on_inverter',
    esp_status: 'binary_sensor.grid_monitor_esp_status', voltage_alarm: 'binary_sensor.grid_monitor_voltage_out_of_range',
    energy_total: 'sensor.grid_monitor_energy_total', energy_today: 'sensor.grid_monitor_energy_today', energy_month: 'sensor.grid_monitor_energy_month',
    cost_today: 'sensor.grid_monitor_cost_today', cost_month: 'sensor.grid_monitor_cost_month', cost_total: 'sensor.grid_monitor_cost_total',
    tariff: 'sensor.grid_monitor_current_tariff', cost_rate: 'sensor.grid_monitor_cost_rate',
    apparent_power: 'sensor.grid_monitor_apparent_power', reactive_power: 'sensor.grid_monitor_reactive_power',
    phase_angle: 'sensor.grid_monitor_phase_angle', voltage_deviation: 'sensor.grid_monitor_voltage_deviation', voltage_average: 'sensor.grid_monitor_voltage_5min_average',
    voltage_min: 'sensor.grid_monitor_voltage_min_today', voltage_max: 'sensor.grid_monitor_voltage_max_today', current_max: 'sensor.grid_monitor_current_max_today', power_peak: 'sensor.grid_monitor_power_peak_today',
    sag_count: 'sensor.grid_monitor_sag_count', swell_count: 'sensor.grid_monitor_swell_count', inverter_events: 'sensor.grid_monitor_inverter_events',
    inverter_current_duration: 'sensor.grid_monitor_inverter_current_duration', last_inverter_duration: 'sensor.grid_monitor_last_inverter_duration', total_inverter_time: 'sensor.grid_monitor_total_inverter_time',
    wifi_signal: 'sensor.grid_monitor_wifi_signal', uptime: 'sensor.grid_monitor_uptime', esp_temperature: 'sensor.grid_monitor_esp_temperature', ip_address: 'sensor.grid_monitor_ip_address', ssid: 'sensor.grid_monitor_connected_ssid',
    sag_threshold: 'number.grid_monitor_sag_threshold', swell_threshold: 'number.grid_monitor_swell_threshold', nominal_voltage: 'number.grid_monitor_nominal_voltage', tariff_day: 'number.grid_monitor_tariff_day', tariff_night: 'number.grid_monitor_tariff_night', two_zone: 'switch.grid_monitor_two_zone_tariff',
    reset_energy: 'button.grid_monitor_reset_pzem_energy', reset_events: 'button.grid_monitor_reset_event_counters', reset_cost: 'button.grid_monitor_reset_cost_counters', restart: 'button.grid_monitor_restart',
  };

  const SETTING_ENTITY_KEYS = new Set(['sag_threshold', 'swell_threshold', 'nominal_voltage', 'tariff_day', 'tariff_night']);
  const TIMESTAMP_ENTITY_KEYS = new Set(['voltage', 'power', 'current']);

  const TEXT = {
    uk: {
      title: 'Мережева напруга', subtitle: 'PZEM-004T v3.0 · Grid Monitor', online: 'Онлайн', offline: 'Офлайн', updated: 'Оновлено',
      home: 'Головна', params_tab: 'Параметри', energy_tab: 'Енергія', settings_tab: 'Налаштування',
      network: 'Мережа', inverter: 'Інвертор', no_power: 'Немає напруги', detecting: 'Визначається', unknown: 'Невідомо', unavailable: 'Недоступно',
      healthy: 'Усі системи працюють нормально', inverter_banner: 'Будинок працює від інвертора', alarm_banner: 'Напруга поза заданим діапазоном', offline_banner: 'ESP недоступна',
      voltage: 'Напруга мережі', current: 'Струм', power: 'Потужність', frequency: 'Частота', pf: 'Коеф. потужності', normal: 'Норма', alarm: 'Поза нормою',
      chart_title: 'Графік потужності', hour: 'Год', day: 'День', week: 'Тиждень', month: 'Місяць', loading: 'Завантаження історії…', no_history: 'Історія потужності поки недоступна',
      mains: 'Мережа', has_voltage: 'Є напруга', no_voltage: 'Немає напруги', source: 'Джерело', from_mains: 'Від мережі', from_inverter: 'Від інвертора', pzem_link: 'Зв’язок з PZEM', active: 'Активний', inactive: 'Немає зв’язку', today_consumption: 'Споживання сьогодні',
      esp_power_connection: 'Схема живлення ESP', esp_power_shared: 'Від мережі разом із модулем', esp_power_after_avr: 'Після АВР', esp_power_independent: 'Незалежне живлення', esp_power_avr_note: 'ESP може живитися від інвертора', pzem_grid_note: 'PZEM вимірює мережу в усіх режимах',
      params_title: 'Електричні параметри', energy_title: 'Енергія та вартість', settings_title: 'Налаштування та діагностика',
      apparent: 'Повна потужність', reactive: 'Реактивна потужність', phase: 'Кут фази', deviation: 'Відхилення напруги', average: 'Середня напруга за 5 хв', min_voltage: 'Мінімальна напруга сьогодні', max_voltage: 'Максимальна напруга сьогодні', max_current: 'Максимальний струм сьогодні', peak_power: 'Пікова потужність сьогодні', voltage_state: 'Статус напруги',
      today: 'Сьогодні', energy_month: 'Споживання за місяць', energy_total: 'Загальна енергія PZEM', cost_today: 'Вартість сьогодні', cost_month: 'Вартість за місяць', cost_total: 'Загальна розрахована вартість', tariff: 'Поточний тариф', cost_rate: 'Вартість за годину', two_zone: 'Двозонний облік',
      estimated_cost: 'Орієнтовна вартість', current_load: 'Поточне навантаження', tariff_compare: 'Порівняння тарифів', current_rate: 'Активний тариф', night: 'Ніч', device_name: 'Grid Monitor · ESP32-C3', device_description: 'Контролер ESPHome · PZEM-004T', diagnostics: 'Діагностика',
      sag: 'Поріг просідання', swell: 'Поріг перенапруги', nominal: 'Номінальна напруга', tariff_day: 'Денний тариф', tariff_night: 'Нічний тариф', wifi: 'Сигнал Wi‑Fi', temperature: 'Температура ESP32', uptime: 'Час роботи ESP32', ip: 'IP-адреса', ssid: 'Wi‑Fi мережа',
      events: 'Події інвертора', inverter_events: 'Кількість відключень', current_duration: 'Поточна тривалість', last_duration: 'Остання тривалість', total_duration: 'Загальний час від інвертора', sag_events: 'Просідання напруги', swell_events: 'Перенапруги', save: 'Зберегти', on: 'Увімкнено', off: 'Вимкнено',
            editor_title: 'Налаштування Smart Grid Monitor',
      editor_device_select: 'Вибір пристрою ESP32 / Префікс',
      editor_device_hint: 'Показано лише пристрої ESPHome. За потреби введіть власний префікс нижче.',
      editor_entity_hint: 'Почніть вводити назву або виберіть сутність зі списку. Порожнє поле використовує стандартну сутність.',
      editor_prefix: 'Префікс сутностей ESP',
      editor_prefix_hint: 'Наприклад: grid_monitor (якщо сутності мають вигляд sensor.grid_monitor_voltage)',
      editor_autodetect: 'Автовиявлення',
      editor_autodetect_success: 'Знайдено найкращий збіг:',
      editor_language: 'Мова інтерфейсу',
      editor_lang_auto: 'Авто (налаштування Home Assistant)',
      editor_lang_uk: 'Українська',
      editor_lang_en: 'English',
      editor_power_mode: 'Схема живлення ESP',
      editor_power_mode_hint: 'PZEM підключений до мережі в усіх режимах.',
      editor_power_grid_shared: 'Від мережі разом із модулем',
      editor_power_after_avr: 'Після АВР',
      editor_power_independent: 'Незалежне живлення',
      editor_entities_detected: 'сенсорів знайдено',
      editor_custom_entities: 'Точне налаштування окремих сенсорів',
      editor_custom_prefix: 'Вказати інший префікс вручну...',
      actions: 'Дії', reset_energy: 'Скинути енергію PZEM', reset_events: 'Скинути події', reset_cost: 'Скинути облік', restart: 'Перезапустити ESP', confirm: 'Виконати цю дію?', invalid_number: 'Введіть коректне число в допустимому діапазоні.',
      dialog_confirm_title: 'Підтвердьте дію', dialog_error_title: 'Перевірте значення', dialog_confirm: 'Виконати', dialog_cancel: 'Скасувати', dialog_close: 'Зрозуміло',
    },
    en: {
      title: 'Grid voltage', subtitle: 'PZEM-004T v3.0 · Grid Monitor', online: 'Online', offline: 'Offline', updated: 'Updated',
      home: 'Home', params_tab: 'Parameters', energy_tab: 'Energy', settings_tab: 'Settings',
      network: 'Mains', inverter: 'Inverter', no_power: 'No voltage', detecting: 'Detecting', unknown: 'Unknown', unavailable: 'Unavailable',
      healthy: 'All systems operating normally', inverter_banner: 'House is running from the inverter', alarm_banner: 'Voltage is outside the configured range', offline_banner: 'ESP is offline',
      voltage: 'Grid voltage', current: 'Current', power: 'Power', frequency: 'Frequency', pf: 'Power factor', normal: 'Normal', alarm: 'Out of range',
      chart_title: 'Power history', hour: 'Hour', day: 'Day', week: 'Week', month: 'Month', loading: 'Loading history…', no_history: 'Power history is not available yet',
      mains: 'Mains', has_voltage: 'Voltage present', no_voltage: 'No voltage', source: 'Source', from_mains: 'From mains', from_inverter: 'From inverter', pzem_link: 'PZEM connection', active: 'Active', inactive: 'No connection', today_consumption: 'Consumption today',
      esp_power_connection: 'ESP power arrangement', esp_power_shared: 'Mains shared with the module', esp_power_after_avr: 'After AVR', esp_power_independent: 'Independent power', esp_power_avr_note: 'ESP may be powered by the inverter', pzem_grid_note: 'PZEM measures mains in every mode',
      params_title: 'Electrical parameters', energy_title: 'Energy and cost', settings_title: 'Settings and diagnostics',
      apparent: 'Apparent power', reactive: 'Reactive power', phase: 'Phase angle', deviation: 'Voltage deviation', average: '5-minute average voltage', min_voltage: 'Minimum voltage today', max_voltage: 'Maximum voltage today', max_current: 'Maximum current today', peak_power: 'Peak power today', voltage_state: 'Voltage status',
      today: 'Today', energy_month: 'Consumption this month', energy_total: 'Total PZEM energy', cost_today: 'Cost today', cost_month: 'Cost this month', cost_total: 'Total calculated cost', tariff: 'Current tariff', cost_rate: 'Cost per hour', two_zone: 'Two-zone tariff',
      estimated_cost: 'Estimated cost', current_load: 'Current load', tariff_compare: 'Tariff comparison', current_rate: 'Active tariff', night: 'Night', device_name: 'Grid Monitor · ESP32-C3', device_description: 'ESPHome controller · PZEM-004T', diagnostics: 'Diagnostics',
      sag: 'Sag threshold', swell: 'Swell threshold', nominal: 'Nominal voltage', tariff_day: 'Day tariff', tariff_night: 'Night tariff', wifi: 'Wi-Fi signal', temperature: 'ESP32 temperature', uptime: 'ESP32 uptime', ip: 'IP address', ssid: 'Wi-Fi network',
      events: 'Inverter events', inverter_events: 'Outage count', current_duration: 'Current duration', last_duration: 'Last duration', total_duration: 'Total inverter time', sag_events: 'Voltage sags', swell_events: 'Voltage swells', save: 'Save', on: 'On', off: 'Off',
            editor_title: 'Smart Grid Monitor Settings',
      editor_device_select: 'ESP32 Device / Prefix Selection',
      editor_device_hint: 'Only ESPHome devices are listed. Enter a custom prefix below if needed.',
      editor_entity_hint: 'Start typing a name or choose an entity from the list. Leave blank to use the default entity.',
      editor_prefix: 'ESPHome Entity Prefix',
      editor_prefix_hint: 'E.g.: grid_monitor (if sensors are named like sensor.grid_monitor_voltage)',
      editor_autodetect: 'Auto-detect',
      editor_autodetect_success: 'Best match detected:',
      editor_language: 'Interface Language',
      editor_lang_auto: 'Auto (from Home Assistant)',
      editor_lang_uk: 'Ukrainian',
      editor_lang_en: 'English',
      editor_power_mode: 'ESP power arrangement',
      editor_power_mode_hint: 'PZEM remains connected to the mains in every mode.',
      editor_power_grid_shared: 'Mains shared with the module',
      editor_power_after_avr: 'After AVR',
      editor_power_independent: 'Independent power',
      editor_entities_detected: 'sensors detected',
      editor_custom_entities: 'Fine-tune Individual Entities',
      editor_custom_prefix: 'Enter custom prefix manually...',
      actions: 'Actions', reset_energy: 'Reset PZEM energy', reset_events: 'Reset events', reset_cost: 'Reset accounting', restart: 'Restart ESP', confirm: 'Run this action?', invalid_number: 'Enter a valid number within the allowed range.',
      dialog_confirm_title: 'Confirm action', dialog_error_title: 'Check the value', dialog_confirm: 'Continue', dialog_cancel: 'Cancel', dialog_close: 'Got it',
    },
  };

  const RANGES = { hour: 1, day: 24, week: 24 * 7, month: 24 * 30 };
  const ICONS = {
    bolt: '<path d="M28 3 10 26h12l-2 19 19-26H26z" fill="currentColor"/>',
    current: '<path d="M4 25h10l6-17 9 33 6-18h9" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    frequency: '<path d="M5 27c5-18 13-18 19 0s14 18 19 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    pf: '<path d="M7 34a17 17 0 1 1 34 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="m24 31 9-10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="31" r="3" fill="currentColor"/>',
    home: '<path d="m5 22 19-16 19 16v20H29V29H19v13H5z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>',
    source: '<path d="M24 4v15m0 0c-7 0-12 5-12 12v3h24v-3c0-7-5-12-12-12ZM16 39h16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    shield: '<path d="M24 4 41 11v12c0 11-7 18-17 22C14 41 7 34 7 23V11z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="m16 24 6 6 12-13" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    energy: '<path d="M24 3 8 25h12l-2 20 22-28H27z" fill="currentColor"/>',
    chart: '<path d="M7 40V25h8v15zm13 0V9h8v31zm13 0V18h8v22z" fill="currentColor"/>',
    params: '<path d="M7 11h34M7 24h34M7 37h34" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="18" cy="11" r="5" fill="#14243a" stroke="currentColor" stroke-width="3"/><circle cx="31" cy="24" r="5" fill="#14243a" stroke="currentColor" stroke-width="3"/><circle cx="15" cy="37" r="5" fill="#14243a" stroke="currentColor" stroke-width="3"/>',
    settings: '<path d="M20 4h8l2 6 5 3 6-1 4 7-4 5v6l4 5-4 7-6-1-5 3-2 6h-8l-2-6-5-3-6 1-4-7 4-5v-6l-4-5 4-7 6 1 5-3z" transform="translate(0 -3) scale(.9)" fill="none" stroke="currentColor" stroke-width="3.5"/><circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="3.5"/>',
    wifi: '<path d="M5 17a29 29 0 0 1 38 0M11 24a20 20 0 0 1 26 0m-20 7a10 10 0 0 1 14 0m-7 8h.1" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    coin: '<path d="M24 5c-10 0-17 3-17 7s7 7 17 7 17-3 17-7-7-7-17-7Zm-17 7v8c0 4 7 7 17 7s17-3 17-7v-8m-34 8v8c0 4 7 7 17 7s17-3 17-7v-8m-34 8v8c0 4 7 7 17 7s17-3 17-7v-8" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>',
    check: '<path d="m11 25 9 9 18-20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
    gear: '<path d="M24 7v5m0 24v5M7 24h5m24 0h5M12 12l4 4m16 16 4 4m0-24-4 4m-16 16-4 4" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="24" r="12" fill="none" stroke="currentColor" stroke-width="4"/>',
    plug: '<path d="M17 7v12m14-12v12M12 19h24v3a12 12 0 0 1-12 12v8m0-8a12 12 0 0 1-12-12z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  class GridMonitorCardEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._config = {};
      this._hass = null;
      this._hasRendered = false;
      this._renderedLanguage = null;
    }

    setConfig(config) {
      const previousLanguage = this._renderedLanguage;
      this._config = { ...config };
      if (!this._hasRendered || previousLanguage !== this._lang()) {
        this._render();
        return;
      }
      this._syncConfigToDom();
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._hasRendered || this._renderedLanguage !== this._lang()) {
        this._render();
        return;
      }
      this._refreshPickers();
      this._updateCandidateStatus();
    }

    _lang() {
      const forced = this._config?.language;
      if (forced === 'uk' || forced === 'en') return forced;
      const locale = this._hass?.locale?.language || this._hass?.language || 'uk';
      return String(locale).toLowerCase().startsWith('uk') ? 'uk' : 'en';
    }

    _t(key) {
      return TEXT[this._lang()]?.[key] || TEXT.en?.[key] || key;
    }

    _hasActivePicker() {
      const active = this.shadowRoot?.activeElement;
      return Boolean(active && (active.tagName === 'SELECT' || active.matches?.('input[list]')));
    }

    _syncConfigToDom() {
      if (!this.shadowRoot) return;
      const active = this.shadowRoot.activeElement;
      const setValue = (selector, value) => {
        const element = this.shadowRoot.querySelector(selector);
        if (element && element !== active) element.value = value;
      };
      setValue('#inp_name', this._config.name || '');
      setValue('#inp_prefix', this._config.prefix || 'grid_monitor');
      setValue('#sel_device', this._config.prefix || 'grid_monitor');
      setValue('#sel_lang', this._config.language || '');
      setValue('#sel_power_mode', this._config.esp_power_mode || 'after_avr');
      this.shadowRoot.querySelectorAll('input[data-entity-key]').forEach((input) => {
        const key = input.getAttribute('data-entity-key');
        if (input !== active) input.value = this._config.entities?.[key] || '';
      });
      if (!this._hasActivePicker()) this._refreshPickers();
      this._updateCandidateStatus();
    }

    _refreshPickers() {
      if (!this.shadowRoot || this._hasActivePicker()) return;
      const currentPrefix = this._config.prefix || 'grid_monitor';
      const candidates = this._getCandidates();
      const device = this.shadowRoot.getElementById('sel_device');
      if (device) {
        const html = candidates.map((candidate) => {
          const star = candidate.count >= 4 ? ' ★' : '';
          return `<option value="${this._escape(candidate.prefix)}">${this._escape(candidate.prefix)} (${candidate.count} ${this._t('editor_entities_detected')})${star}</option>`;
        }).join('');
        const options = `${html}<option value="__custom__">${this._escape(this._t('editor_custom_prefix'))}</option>`;
        if (device.innerHTML !== options) device.innerHTML = options;
        device.value = candidates.some((candidate) => candidate.prefix === currentPrefix) ? currentPrefix : '__custom__';
      }
      for (const key of ['voltage', 'current', 'power', 'frequency', 'power_factor', 'energy_today', 'cost_today', 'mains', 'inverter']) {
        const datalist = this.shadowRoot.getElementById(`entity_options_${key}`);
        if (datalist) {
          const options = this._getEntityDatalistOptions(key);
          if (datalist.innerHTML !== options) datalist.innerHTML = options;
        }
      }
      const prefix = this.shadowRoot.getElementById('inp_prefix');
      if (prefix && prefix !== this.shadowRoot.activeElement) prefix.value = currentPrefix;
    }

    _updateCandidateStatus() {
      const status = this.shadowRoot?.querySelector('[data-role="candidate-status"]');
      if (!status) return;
      const prefix = this._config.prefix || 'grid_monitor';
      const candidate = this._getCandidates().find((item) => item.prefix === prefix);
      const count = candidate?.count || 0;
      const total = Object.keys(DEFAULTS).length;
      const dot = status.querySelector('.status-dot');
      const label = status.querySelector('[data-role="candidate-count"]');
      const color = count > 0 ? '#35ed91' : '#ffb51b';
      if (dot) {
        dot.style.background = color;
        dot.style.boxShadow = `0 0 8px ${color}`;
      }
      if (label) label.textContent = `${count} / ${total} ${this._t('editor_entities_detected')} (${prefix})`;
    }

    _getEspHomeEntityIds() {
      const states = this._hass?.states;
      const entities = this._hass?.entities;
      if (!states || !entities || typeof entities !== 'object') return [];

      return Object.keys(entities).filter((entityId) =>
        Boolean(states[entityId]) && String(entities[entityId]?.platform || '').toLowerCase() === 'esphome'
      );
    }

    _getCandidates() {
      if (!this._hass?.states) return [];
      const espHomeEntityIds = this._getEspHomeEntityIds();
      const espHomeEntitySet = new Set(espHomeEntityIds);
      const prefixSet = new Set();

      const suffixes = [
        '_voltage', '_current', '_power', '_frequency', '_power_factor',
        '_energy_total', '_mains_present', '_on_inverter', '_esp_status',
        '_voltage_out_of_range', '_sag_threshold', '_tariff_day'
      ];

      espHomeEntityIds.forEach((id) => {
        const name = id.split('.')[1] || '';
        suffixes.forEach((suffix) => {
          if (name.endsWith(suffix)) {
            const prefix = name.slice(0, -suffix.length);
            if (prefix) prefixSet.add(prefix);
          }
        });
      });

      // Keep the configured/default prefix visible, but only count entities registered by ESPHome.
      prefixSet.add(this._config.prefix || 'grid_monitor');

      const candidates = [];
      const totalKeys = Object.keys(DEFAULTS).length;

      prefixSet.forEach((prefix) => {
        let matchCount = 0;
        let hasCore = false;

        for (const [key, defId] of Object.entries(DEFAULTS)) {
          const domain = defId.split('.')[0];
          const suffix = defId.split('.').slice(1).join('.').replace(/^grid_monitor_/, '');
          const candidate = `${domain}.${prefix}_${suffix}`;
          const hasCandidate = espHomeEntitySet.has(candidate);
          const hasAlias = !hasCandidate && (ALIAS_SUFFIXES[key] || []).some((alias) =>
            espHomeEntitySet.has(`${domain}.${prefix}_${alias}`)
          );

          if (hasCandidate || hasAlias) {
            matchCount++;
            if (key === 'voltage' || key === 'power' || key === 'current') hasCore = true;
          }
        }

        let weight = matchCount;
        if (prefix === 'grid_monitor') weight += 6;
        if (prefix.toLowerCase().includes('grid')) weight += 5;
        if (prefix.toLowerCase().includes('pzem')) weight += 5;
        if (prefix.toLowerCase().includes('monitor')) weight += 3;
        if (hasCore) weight += 6;

        candidates.push({ prefix, count: matchCount, total: totalKeys, weight });
      });

      candidates.sort((a, b) => b.weight - a.weight || b.count - a.count);
      return candidates;
    }

    _getEntityDatalistOptions(key) {
      const states = this._hass?.states || {};
      const domain = DEFAULTS[key]?.split('.')[0];
      if (!domain) return '';

      const available = Object.keys(states)
        .filter((entityId) => entityId.startsWith(`${domain}.`))
        .map((entityId) => {
          const registryName = this._hass?.entities?.[entityId]?.name;
          const friendlyName = states[entityId]?.attributes?.friendly_name;
          return { entityId, label: friendlyName || registryName || entityId };
        })
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

      const configured = this._config.entities?.[key];
      if (configured && !available.some((item) => item.entityId === configured)) {
        available.unshift({ entityId: configured, label: `${configured} (${this._t('unavailable')})` });
      }

      return available.map(({ entityId, label }) =>
        `<option value="${this._escape(entityId)}" label="${this._escape(label)}"></option>`
      ).join('');
    }

    _autoDetect() {
      const best = this._getCandidates().find((candidate) => candidate.count > 0);
      if (best) {
        this._config.prefix = best.prefix;
        const prefixInput = this.shadowRoot.getElementById('inp_prefix');
        if (prefixInput) prefixInput.value = best.prefix;
        this._fireChanged();
        this._refreshPickers();
        this._updateCandidateStatus();
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
      const candidates = this._getCandidates();
      const currentPrefix = this._config.prefix || 'grid_monitor';
      const activeCandidate = candidates.find((c) => c.prefix === currentPrefix) || { prefix: currentPrefix, count: 0, total: Object.keys(DEFAULTS).length };
      const lang = this._config.language || '';
      const name = this._config.name || '';
      const powerMode = this._config.esp_power_mode || 'after_avr';

      const deviceOptions = candidates.map((c) => {
        const isSel = c.prefix === currentPrefix;
        const star = c.count >= 4 ? ' ★' : '';
        return `<option value="${c.prefix}" ${isSel ? 'selected' : ''}>${c.prefix} (${c.count} ${this._t('editor_entities_detected')})${star}</option>`;
      }).join('');

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            color-scheme: dark;
            font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
            color: #e6f1ff;
            background: #0b172a;
            padding: 16px;
            border-radius: 14px;
            border: 1px solid #1c385c;
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
            color-scheme: dark;
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
          .field select option {
            background: #0e1b31;
            color: #fff;
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
            background: ${activeCandidate.count > 0 ? '#35ed91' : '#ffb51b'};
            box-shadow: 0 0 8px ${activeCandidate.count > 0 ? '#35ed91' : '#ffb51b'};
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

        <div class="field">
          <label>${this._t('title')} (Card Name)</label>
          <input type="text" id="inp_name" value="${this._escape(name)}" placeholder="Smart Grid Monitor">
        </div>

        <!-- Manual ESP32 Device Selection Dropdown -->
        <div class="field">
          <label>${this._t('editor_device_select')}</label>
          <select id="sel_device">
            ${deviceOptions}
            <option value="__custom__">${this._t('editor_custom_prefix') || 'Вказати інший префікс вручну...'}</option>
          </select>
          <div class="hint">${this._t('editor_device_hint')}</div>
        </div>

        <!-- Direct Prefix Input with Auto-detect button -->
        <div class="field">
          <label>${this._t('editor_prefix')}</label>
          <div class="prefix-row">
            <input type="text" id="inp_prefix" value="${this._escape(currentPrefix)}" placeholder="grid_monitor">
            <button type="button" class="btn-detect" id="btn_detect">
              <svg viewBox="0 0 48 48" width="16" height="16" fill="currentColor">${ICONS.wifi}</svg>
              ${this._t('editor_autodetect')}
            </button>
          </div>
          <div class="hint">${this._t('editor_prefix_hint')}</div>
        </div>

        <div class="status-badge" data-role="candidate-status">
          <span class="status-dot"></span>
          <span data-role="candidate-count">${activeCandidate.count} / ${activeCandidate.total} ${this._t('editor_entities_detected')} (${currentPrefix})</span>
        </div>

        <div class="field">
          <label>${this._t('editor_language')}</label>
          <select id="sel_lang">
            <option value="" ${lang === '' ? 'selected' : ''}>${this._t('editor_lang_auto')}</option>
            <option value="uk" ${lang === 'uk' ? 'selected' : ''}>${this._t('editor_lang_uk')}</option>
            <option value="en" ${lang === 'en' ? 'selected' : ''}>${this._t('editor_lang_en')}</option>
          </select>
        </div>

        <div class="field">
          <label>${this._t('editor_power_mode')}</label>
          <select id="sel_power_mode">
            <option value="grid_shared" ${powerMode === 'grid_shared' ? 'selected' : ''}>${this._t('editor_power_grid_shared')}</option>
            <option value="after_avr" ${powerMode === 'after_avr' ? 'selected' : ''}>${this._t('editor_power_after_avr')}</option>
            <option value="independent" ${powerMode === 'independent' ? 'selected' : ''}>${this._t('editor_power_independent')}</option>
          </select>
          <div class="hint">${this._t('editor_power_mode_hint')}</div>
        </div>

        <details>
          <summary>${this._t('editor_custom_entities')}</summary>
          <div class="custom-grid">
            ${['voltage', 'current', 'power', 'frequency', 'power_factor', 'energy_today', 'cost_today', 'mains', 'inverter'].map((k) => `
              <div class="field" style="margin-bottom:8px">
                <label style="font-size:0.75rem">${k}</label>
                <input type="text" data-entity-key="${k}" list="entity_options_${k}" value="${this._escape(this._config.entities?.[k] || '')}" placeholder="${DEFAULTS[k] || ''}">
                <datalist id="entity_options_${k}">${this._getEntityDatalistOptions(k)}</datalist>
              </div>
            `).join('')}
          </div>
          <div class="hint">${this._t('editor_entity_hint')}</div>
        </details>
      `;

      this._bindEvents();
      this._hasRendered = true;
      this._renderedLanguage = this._lang();
    }

    _escape(val) {
      return String(val ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    _bindEvents() {
      const root = this.shadowRoot;
      root.getElementById('inp_name').addEventListener('input', (e) => {
        this._config.name = e.target.value;
        this._fireChanged();
      });

      root.getElementById('sel_device').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val !== '__custom__') {
          this._config.prefix = val;
          root.getElementById('inp_prefix').value = val;
          this._fireChanged();
          this._updateCandidateStatus();
        } else {
          root.getElementById('inp_prefix').focus();
        }
      });

      root.getElementById('inp_prefix').addEventListener('input', (e) => {
        this._config.prefix = e.target.value.trim();
        this._fireChanged();
      });

      root.getElementById('btn_detect').addEventListener('click', () => {
        this._autoDetect();
      });

      root.getElementById('sel_lang').addEventListener('change', (e) => {
        this._config.language = e.target.value || undefined;
        this._fireChanged();
      });

      root.getElementById('sel_power_mode').addEventListener('change', (e) => {
        this._config.esp_power_mode = e.target.value;
        this._fireChanged();
      });

      root.querySelectorAll('input[data-entity-key]').forEach((input) => {
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


  let CARD_SEQUENCE = 0;

  class GridMonitorCard extends HTMLElement {
    static getConfigElement() {
      return document.createElement('grid-monitor-card-editor');
    }

    static getStubConfig(hass) {
      let foundPrefix = 'grid_monitor';
      if (hass?.states && hass?.entities) {
        const prefixCounts = {};
        Object.keys(hass.entities).forEach((id) => {
          if (hass.entities[id]?.platform !== 'esphome' || !hass.states[id]) return;
          if (id.includes('_voltage') || id.includes('_power')) {
            const m = id.match(/^(?:sensor|binary_sensor)\.([a-zA-Z0-9_]+)_(?:voltage|power)/);
            if (m && m[1]) {
              prefixCounts[m[1]] = (prefixCounts[m[1]] || 0) + 1;
            }
          }
        });
        const sorted = Object.entries(prefixCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length && sorted[0][1] >= 1) {
          foundPrefix = sorted[0][0];
        }
      }
      return {
        type: 'custom:grid-monitor-card',
        name: 'Smart Grid Monitor',
        prefix: foundPrefix,
        esp_power_mode: 'after_avr',
      };
    }

    constructor() {
      super();
      this._instanceId = ++CARD_SEQUENCE;
      this._hasRendered = false;
      this.attachShadow({ mode: 'open' });
      this._config = null;
      this._hass = null;
      this._activeTab = 'home';
      this._historyRange = 'hour';
      this._history = [];
      this._historyKey = '';
      this._historyAt = 0;
      this._historyLoading = false;
      this._historyError = false;
      this._historyRequest = 0;
      this._stateSnapshot = null;
      this._renderedLanguage = null;
      this._pendingChangedKeys = new Set();
      this._updateScheduled = false;
      this._dialogResolver = null;
      this._renderPending = false;
      this.shadowRoot.addEventListener('click', (event) => this._handleCardClick(event));
    }

    setConfig(config) {
      const prefix = config.prefix || 'grid_monitor';
      const entities = { ...DEFAULTS };
      if (prefix !== 'grid_monitor') {
        Object.keys(entities).forEach((key) => { entities[key] = entities[key].replace('grid_monitor', prefix); });
      }
      Object.assign(entities, config.entities || {});
      const powerMode = ['grid_shared', 'after_avr', 'independent'].includes(config.esp_power_mode) ? config.esp_power_mode : 'after_avr';
      this._config = { ...config, entities, name: config.name || null, esp_power_mode: powerMode };
      this._stateSnapshot = this._captureStateSnapshot();
      this._render();
    }

    set hass(value) {
      this._hass = value;
      const nextSnapshot = this._captureStateSnapshot();
      if (!this._config || !this._hasRendered || this._renderedLanguage !== this._lang()) {
        this._stateSnapshot = nextSnapshot;
        this._render();
      } else {
        const changed = this._diffStateSnapshots(this._stateSnapshot, nextSnapshot);
        this._stateSnapshot = nextSnapshot;
        if (changed.size) this._scheduleStateUpdate(changed);
      }
      this._ensureHistory();
    }

    _captureStateSnapshot() {
      const snapshot = {};
      for (const key of Object.keys(DEFAULTS)) {
        const entityId = this._entity(key);
        const state = this._hass?.states?.[entityId] || null;
        const attributes = state?.attributes || {};
        snapshot[key] = JSON.stringify([
          entityId,
          Boolean(state),
          state?.state ?? null,
          attributes.unit_of_measurement ?? null,
          SETTING_ENTITY_KEYS.has(key) ? [attributes.min ?? null, attributes.max ?? null, attributes.step ?? null] : null,
          TIMESTAMP_ENTITY_KEYS.has(key) ? state?.last_updated ?? null : null,
        ]);
      }
      return snapshot;
    }

    _diffStateSnapshots(previous, next) {
      const changed = new Set();
      for (const key of Object.keys(next)) {
        if (!previous || previous[key] !== next[key]) changed.add(key);
      }
      return changed;
    }

    _scheduleStateUpdate(changed) {
      changed.forEach((key) => this._pendingChangedKeys.add(key));
      if (this._updateScheduled) return;
      this._updateScheduled = true;
      const flush = () => {
        this._updateScheduled = false;
        const pending = this._pendingChangedKeys;
        this._pendingChangedKeys = new Set();
        if (pending.size && this._hasRendered) this._updateChanged(pending);
      };
      if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(flush);
      else window.setTimeout(flush, 0);
    }

    _lang() {
      const forced = this._config?.language;
      if (forced === 'uk' || forced === 'en') return forced;
      const locale = this._hass?.locale?.language || this._hass?.language || 'uk';
      return String(locale).toLowerCase().startsWith('uk') ? 'uk' : 'en';
    }

    _t(key) { return TEXT[this._lang()][key] || key; }
    _locale() { return this._lang() === 'uk' ? 'uk-UA' : 'en-US'; }
    _entity(key) {
      if (this._config?.entities?.[key]) return this._config.entities[key];
      const prefix = this._config?.prefix || 'grid_monitor';
      const defId = DEFAULTS[key];
      if (!defId) return '';
      const domain = defId.split('.')[0];
      const suffix = defId.split('.').slice(1).join('.').replace(/^grid_monitor_/, '');
      const candidate = `${domain}.${prefix}_${suffix}`;
      if (this._hass?.states?.[candidate]) return candidate;
      if (this._hass?.states?.[defId]) return defId;
      if (typeof ALIAS_SUFFIXES !== 'undefined' && ALIAS_SUFFIXES[key] && this._hass?.states) {
        for (const s of ALIAS_SUFFIXES[key]) {
          const c1 = `${domain}.${prefix}_${s}`;
          if (this._hass.states[c1]) return c1;
          const c2 = `${domain}.${s}`;
          if (this._hass.states[c2]) return c2;
        }
      }
      return candidate;
    }
    _state(key) { return this._hass?.states?.[this._entity(key)] || null; }
    _raw(key) { return this._state(key)?.state ?? null; }
    _num(key) {
      const raw = this._raw(key);
      if (raw === null || raw === 'unknown' || raw === 'unavailable') return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    }
    _escape(value) {
      return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }
    _unit(key) {
      const unit = this._state(key)?.attributes?.unit_of_measurement || '';
      if (this._lang() !== 'uk') return unit;
      return ({ V: 'В', A: 'А', W: 'Вт', Hz: 'Гц', kWh: 'кВт·год', VA: 'ВА', var: 'вар', UAH: 'грн', 'UAH/kWh': 'грн/кВт·год', 'UAH/h': 'грн/год', min: 'хв', h: 'год', dBm: 'дБм' })[unit] || unit;
    }
    _formatted(key, digits = 1) {
      const n = this._num(key);
      if (n === null) {
        const raw = this._raw(key);
        if (raw === 'unavailable') return this._t('unavailable');
        if (raw === 'unknown' || raw === null) return this._t('unknown');
        return raw;
      }
      const value = n.toLocaleString(this._locale(), { maximumFractionDigits: digits });
      return `${value}${this._unit(key) ? ` ${this._unit(key)}` : ''}`;
    }
    _svg(name, extra = '') { return `<svg class="icon ${extra}" viewBox="0 0 48 48" aria-hidden="true">${ICONS[name] || ''}</svg>`; }
    _detail(key, label, digits = 1) { return `<div class="detail"><span>${this._escape(label)}</span><b data-value-key="${key}" data-value-digits="${digits}">${this._escape(this._formatted(key, digits))}</b></div>`; }
    _row(key, label, icon, digits = 1) { return `<div class="row"><span class="row-label"><span class="row-symbol">${icon}</span>${this._escape(label)}</span><strong data-value-key="${key}" data-value-digits="${digits}">${this._escape(this._formatted(key, digits))}</strong></div>`; }
    _setting(key, label) {
      const entity = this._entity(key);
      const state = this._state(key);
      const value = this._num(key);
      const attrs = state?.attributes || {};
      const min = Number.isFinite(Number(attrs.min)) ? Number(attrs.min) : '';
      const max = Number.isFinite(Number(attrs.max)) ? Number(attrs.max) : '';
      const step = Number.isFinite(Number(attrs.step)) && Number(attrs.step) > 0 ? Number(attrs.step) : 'any';
      return `<div class="setting detail"><label><span>${this._escape(label)}</span><div class="setting-input"><input type="text" inputmode="decimal" data-number-input="${key}" value="${value === null ? '' : value}" data-min="${min}" data-max="${max}" data-step="${step}" ${!state ? 'disabled' : ''}><small data-unit-key="${key}">${this._escape(this._unit(key))}</small></div></label><button class="save-button" data-number-save="${key}" ${!state ? 'disabled' : ''}>${this._escape(this._t('save'))}</button></div>`;
    }
    _updatedTime() {
      const latest = ['voltage', 'power', 'current'].map((key) => this._state(key)?.last_updated).filter(Boolean).map((value) => new Date(value)).filter((value) => Number.isFinite(value.getTime())).sort((a, b) => b - a)[0];
      return latest ? latest.toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : this._t('unknown');
    }
    _espPowerStatus() {
      const mode = this._config?.esp_power_mode || 'after_avr';
      const labelKey = mode === 'grid_shared' ? 'esp_power_shared' : mode === 'independent' ? 'esp_power_independent' : 'esp_power_after_avr';
      const note = mode === 'after_avr' ? `${this._t('esp_power_avr_note')} · ${this._t('pzem_grid_note')}` : this._t('pzem_grid_note');
      return { label: this._t(labelKey), note };
    }

    _displayStatus() {
      const mains = this._raw('mains');
      const inverter = this._raw('inverter') === 'on';
      const esp = this._raw('esp_status');
      const alarm = this._raw('voltage_alarm') === 'on';
      const stateClass = inverter ? 'inverter' : alarm ? 'alarm' : esp === 'on' && mains === 'on' ? 'healthy' : esp === 'off' ? 'offline' : 'unknown';
      const source = inverter ? this._t('inverter') : mains === 'on' ? this._t('network') : mains === 'off' && this._raw('inverter') === 'off' ? this._t('no_power') : this._t('detecting');
      const banner = inverter ? this._t('inverter_banner') : alarm ? this._t('alarm_banner') : esp === 'off' ? this._t('offline_banner') : stateClass === 'healthy' ? this._t('healthy') : this._t('detecting');
      const status = inverter ? this._t('inverter') : alarm ? this._t('alarm') : stateClass === 'healthy' ? this._t('normal') : esp === 'off' ? this._t('offline') : this._t('detecting');
      return { mains, inverter, esp, alarm, stateClass, source, banner, status };
    }

    _home() {
      const status = this._displayStatus();
      const voltage = this._num('voltage');
      const progress = voltage === null ? 0 : Math.max(0, Math.min(100, ((voltage - 150) / 130) * 100));
      const voltageNumber = voltage === null ? this._formatted('voltage') : voltage.toLocaleString(this._locale(), { maximumFractionDigits: 1 });
      const voltageUnit = voltage === null ? '' : this._unit('voltage') || (this._lang() === 'uk' ? 'В' : 'V');
      const gaugeAngle = (180 + progress * 1.8) * Math.PI / 180;
      const gaugeDot = `<circle class="gauge-dot" data-role="gauge-dot" cx="${(250 + 190 * Math.cos(gaugeAngle)).toFixed(1)}" cy="${(270 + 190 * Math.sin(gaugeAngle)).toFixed(1)}" r="7" visibility="${voltage === null ? 'hidden' : 'visible'}"/>`;
      const pzemText = status.mains === 'on' ? this._t('active') : status.inverter ? this._t('inactive') : this._t('detecting');
      const mainsText = status.mains === 'on' ? this._t('has_voltage') : status.inverter ? this._t('no_voltage') : this._t('detecting');
      const sourceText = status.inverter ? this._t('from_inverter') : status.mains === 'on' ? this._t('from_mains') : this._t('detecting');
      const espPower = this._espPowerStatus();
      const energy = this._formatted('energy_today', 2);
      const cost = this._formatted('cost_today', 2);
      return `<section class="home-view">
        <div class="main-grid">
          <div class="card voltage ${status.stateClass}" data-role="voltage-card">
            <svg class="voltage-gauge" viewBox="0 0 500 360" role="img" aria-label="${this._escape(this._t('voltage'))}">
              <defs>
                <linearGradient id="${this._id('arc')}" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#078bff"/><stop offset=".52" stop-color="#08d6e7"/><stop offset="1" stop-color="#39ef83"/></linearGradient>
                <radialGradient id="${this._id('glow')}"><stop stop-color="#087de0" stop-opacity=".32"/><stop offset="1" stop-color="#087de0" stop-opacity="0"/></radialGradient>
                <filter id="${this._id('blur')}"><feGaussianBlur stdDeviation="7"/></filter>
                <linearGradient id="${this._id('tower-metal')}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e4f8ff"/><stop offset=".34" stop-color="#58b9e9"/><stop offset=".68" stop-color="#174c79"/><stop offset="1" stop-color="#b7edff"/></linearGradient>
                <linearGradient id="${this._id('tower-face')}" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#0b3458"/><stop offset=".5" stop-color="#71d3ff"/><stop offset="1" stop-color="#123b61"/></linearGradient>
              </defs>
              <ellipse cx="250" cy="170" rx="190" ry="150" fill="url(#${this._id('glow')})"/>
              <path d="M76 246Q148 205 218 229T356 221T424 243V270H76Z" fill="#08223a" opacity=".62"/>
              <g class="distant-trees" fill="#0d4771"><path d="M89 239l10-37 10 37zm22 0 12-48 12 48zm258 0 10-41 10 41zm22 0 12-49 12 49z"/></g>
              <path d="M72 270 A190 190 0 1 1 428 270" fill="none" stroke="#19334f" stroke-width="28" stroke-linecap="round" pathLength="100"/>
              <path d="M72 270 A190 190 0 1 1 428 270" fill="none" stroke="#75cfff" stroke-opacity=".16" stroke-width="34" stroke-linecap="round" pathLength="100"/>
              ${this._gaugeTicks(progress)}
              <path data-role="gauge-progress" d="M72 270 A190 190 0 1 1 428 270" fill="none" stroke="url(#${this._id('arc')})" stroke-width="28" stroke-linecap="round" stroke-dasharray="${progress} 100" pathLength="100"/>
              ${gaugeDot}
              ${this._towerArtwork()}
              <text x="250" y="286" text-anchor="middle" class="voltage-value"><tspan data-role="voltage-number">${this._escape(voltageNumber)}</tspan> <tspan class="voltage-unit" data-role="voltage-unit">${this._escape(voltageUnit)}</tspan></text>
              <text x="250" y="322" text-anchor="middle" class="voltage-label">${this._escape(this._t('voltage'))}</text>
            </svg>
            <div class="state-indicator ${status.stateClass}" data-role="state-indicator"><span class="check-mark">${this._svg('check')}</span><span data-role="state-label">${this._escape(status.status)}</span></div>
          </div>
          <div class="metrics">
            ${this._heroMetric('power', 'bolt', 0)}
            ${this._heroMetric('current', 'current', 2)}
            ${this._heroMetric('frequency', 'frequency', 1)}
            ${this._heroMetric('power_factor', 'pf', 2)}
          </div>
        </div>
        ${this._chart()}
        <div class="bottom-status">
          <div class="card info"><span class="symbol green">${this._svg('home')}</span><div><div class="small">${this._escape(this._t('mains'))}</div><strong data-role="home-mains" class="${status.mains === 'on' ? 'good' : ''}">${this._escape(mainsText)}</strong></div></div>
          <div class="card info"><span class="symbol blue">${this._svg('plug')}</span><div><div class="small">${this._escape(this._t('source'))}</div><strong data-role="home-source">${this._escape(sourceText)}</strong></div></div>
          <div class="card info"><span class="symbol blue">${this._svg('plug')}</span><div><div class="small">${this._escape(this._t('esp_power_connection'))}</div><strong data-role="esp-power-label">${this._escape(espPower.label)}</strong><div class="small" data-role="esp-power-note">${this._escape(espPower.note)}</div></div></div>
          <div class="card info"><span class="symbol green">${this._svg('shield')}</span><div><div class="small">${this._escape(this._t('pzem_link'))}</div><strong data-role="home-pzem" class="${status.mains === 'on' ? 'good' : ''}">${this._escape(pzemText)}</strong></div></div>
          <div class="card info"><span class="symbol amber">${this._svg('coin')}</span><div><div class="small">${this._escape(this._t('today_consumption'))}</div><strong data-value-key="energy_today" data-value-digits="2">${this._escape(energy)}</strong><div class="small cost-line">≈ <span data-value-key="cost_today" data-value-digits="2">${this._escape(cost)}</span></div></div></div>
        </div>
        <div class="card banner ${status.stateClass}" data-role="home-banner"><span class="banner-check">${this._svg('check')}</span><strong data-role="home-banner-label">${this._escape(status.banner)}</strong><span class="house-art" aria-hidden="true">${this._houseArt()}</span></div>
      </section>`;
    }

    _id(name) { return `gm-${this._instanceId}-${name}`; }
    _gaugeTicks(progress) {
      return Array.from({ length: 25 }, (_, index) => {
        const angle = (180 + index * 7.5) * Math.PI / 180;
        const major = index % 4 === 0;
        const inner = major ? 178 : 183;
        const outer = major ? 200 : 197;
        const x1 = 250 + inner * Math.cos(angle); const y1 = 270 + inner * Math.sin(angle);
        const x2 = 250 + outer * Math.cos(angle); const y2 = 270 + outer * Math.sin(angle);
        const active = index / 24 * 100 <= progress ? ' active' : '';
        return `<path class="dial-tick${active}" data-gauge-tick="${index}" d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
      }).join('');
    }
        _towerArtwork() {
      return `<g class="tower-illustration">
        <path class="tower-shadow" d="M250 60 202 212h96z"/>
        <g class="tower-halo" filter="url(#${this._id('blur')})" fill="none" stroke="#38bdff" stroke-width="5" opacity=".58">
          <path d="M250 60 202 212M250 60 298 212M250 60v152M177 116h146M187 151h126M202 183h96M177 116 323 151 187 151 323 116M187 151 298 183 202 183 298 151M202 183 250 212 298 183"/>
        </g>
        <g class="tower-frame" fill="none" stroke="url(#${this._id('tower-metal')})" stroke-linecap="round" stroke-linejoin="round">
          <path class="tower-rail" d="M250 60 202 212M250 60 298 212M250 60v152"/>
          <path d="M177 116h146M187 151h126M202 183h96M202 212h96"/>
          <path d="M177 116 313 151M323 116 187 151M187 151 288 183M313 151 202 183M202 183 278 212M298 183 202 212"/>
          <path class="tower-arm" d="M157 108h186M168 143h164M230 94h40"/>
          <path class="tower-crossarm" d="M157 108 177 116M343 108 323 116M168 143 187 151M332 143 313 151"/>
          <path class="tower-insulator" d="M165 108v12m-4-8h8m-8 5h8M335 108v12m-4-8h8m-8 5h8M176 143v10m-4-7h8m-8 5h8M324 143v10m-4-7h8m-8 5h8"/>
          <path class="tower-wire" d="M124 108h33m186 0h33M142 143h26m164 0h26"/>
          <!-- Drooping 330kV transmission power lines with natural catenary sag -->
          <path d="M72 118 Q115 125 157 112 M343 112 Q385 125 428 118" fill="none" stroke="#68d5ff" stroke-width="1.6" opacity=".75"/>
          <path d="M72 153 Q118 160 168 147 M332 147 Q382 160 428 153" fill="none" stroke="#68d5ff" stroke-width="1.6" opacity=".75"/>
          <path d="M216 212 250 60l34 152" opacity=".65"/>
        </g>
        <circle cx="250" cy="57" r="3.5" fill="#ff3b5c" class="tower-beacon" filter="drop-shadow(0 0 6px #ff1a40)"/>
        <path class="tower-foot" d="M195 215h110"/>
      </g>`;
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
    _heroMetric(key, icon, digits) {
      const value = this._num(key);
      const display = value === null ? this._escape(this._formatted(key, digits)) : value.toLocaleString(this._locale(), { maximumFractionDigits: digits });
      const unit = this._unit(key);
      const extraClass = key === 'power_factor' ? 'pf' : key;
      return `<div class="card metric ${extraClass}"><div class="metric-icon">${this._svg(icon)}</div><div class="metric-value" data-metric-key="${key}" data-metric-digits="${digits}"><span data-role="metric-number">${display}</span><span class="unit" data-role="metric-unit" style="${unit ? '' : 'display:none'}">${this._escape(unit)}</span></div><div class="metric-label">${this._escape(this._t(key === 'power_factor' ? 'pf' : key))}</div></div>`;
    }

    _chart() {
      const labels = ['hour', 'day', 'week', 'month'];
      const buttons = labels.map((period) => `<button class="period-button ${this._historyRange === period ? 'active' : ''}" data-period="${period}" aria-pressed="${this._historyRange === period}">${this._escape(this._t(period))}</button>`).join('');
      return `<section class="card chart-card"><div class="chart-head"><h2><span class="chart-icon">${this._svg('chart')}</span>${this._escape(this._t('chart_title'))}</h2><div class="periods" role="group" aria-label="${this._escape(this._t('chart_title'))}">${buttons}</div></div><div class="chart-plot" data-role="chart-plot">${this._chartSvg()}</div></section>`;
    }

    _chartSvg() {
      if (this._historyLoading && !this._history.length) return `<div class="chart-empty">${this._escape(this._t('loading'))}</div>`;
      const points = this._downsample(this._history, 100);
      if (!points.length) return `<div class="chart-empty">${this._escape(this._t('no_history'))}</div>`;
      const x0 = 78; const x1 = 985; const y0 = 18; const y1 = 174;
      const maximum = Math.max(250, Math.ceil(Math.max(...points.map((point) => point.value)) / 250) * 250);
      const line = points.map((point, index) => {
        const x = x0 + (index / Math.max(1, points.length - 1)) * (x1 - x0);
        const y = y1 - (Math.max(0, point.value) / maximum) * (y1 - y0);
        return `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(' ');
      const area = `${line} L${x1} ${y1} L${x0} ${y1} Z`;
      const horizontal = [0, 1, 2, 3].map((index) => {
        const y = y1 - index * ((y1 - y0) / 3);
        const value = Math.round(index * maximum / 3);
        return `<path d="M${x0} ${y.toFixed(1)}H${x1}"/><text x="9" y="${(y + 5).toFixed(1)}">${this._escape(value.toLocaleString(this._locale()))} ${this._lang() === 'uk' ? 'Вт' : 'W'}</text>`;
      }).join('');
      const start = points[0].time; const end = points[points.length - 1].time;
      const vertical = [0, 1, 2, 3, 4].map((index) => {
        const x = x0 + index * ((x1 - x0) / 4);
        const time = new Date(start.getTime() + (end.getTime() - start.getTime()) * index / 4);
        const label = this._historyRange === 'hour' ? time.toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit' }) : time.toLocaleDateString(this._locale(), { day: '2-digit', month: '2-digit' });
        return `<path d="M${x.toFixed(1)} ${y0}V${y1}"/><text x="${x.toFixed(1)}" y="198" text-anchor="${index === 0 ? 'start' : index === 4 ? 'end' : 'middle'}">${this._escape(label)}</text>`;
      }).join('');
      const current = this._num('power');
      const latest = current === null ? '' : current.toLocaleString(this._locale(), { maximumFractionDigits: 0 });
      const currentY = current === null ? y1 : y1 - (Math.max(0, current) / maximum) * (y1 - y0);
      return `<svg class="chart" data-chart-max="${maximum}" viewBox="0 0 1000 210" role="img" aria-label="${this._escape(this._t('chart_title'))}"><defs><linearGradient id="${this._id('area')}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#078ff0" stop-opacity=".55"/><stop offset="1" stop-color="#078ff0" stop-opacity=".04"/></linearGradient><filter id="${this._id('line-glow')}"><feGaussianBlur stdDeviation="3"/></filter></defs><g class="chart-grid">${horizontal}${vertical}</g><path d="${area}" fill="url(#${this._id('area')})"/><path d="${line}" class="chart-glow" filter="url(#${this._id('line-glow')})"/><path d="${line}" class="chart-line"/><circle cx="${x1}" cy="${currentY.toFixed(1)}" r="7" class="chart-dot" data-role="chart-dot" visibility="${current === null ? 'hidden' : 'visible'}"/><rect x="908" y="${Math.max(4, currentY - 44).toFixed(1)}" width="82" height="30" rx="9" class="chart-tag" data-role="chart-tag" visibility="${latest ? 'visible' : 'hidden'}"/><text x="949" y="${Math.max(24, currentY - 24).toFixed(1)}" text-anchor="middle" class="chart-tag-text" data-role="chart-tag-text" visibility="${latest ? 'visible' : 'hidden'}">${this._escape(latest)} ${this._lang() === 'uk' ? 'Вт' : 'W'}</text></svg>`;
    }

    _downsample(points, limit) {
      if (points.length <= limit) return points;
      const result = [];
      const step = (points.length - 1) / (limit - 1);
      for (let index = 0; index < limit; index += 1) result.push(points[Math.round(index * step)]);
      return result;
    }

    _ensureHistory() {
      if (!this._hass || !this._config || this._activeTab !== 'home' || this._historyLoading) return;
      const key = `${this._historyRange}:${this._entity('power')}`;
      if (key === this._historyKey && Date.now() - this._historyAt < 60000) return;
      this._loadHistory(key);
    }

    async _loadHistory(key = `${this._historyRange}:${this._entity('power')}`) {
      if (!this._hass || this._historyLoading) return;
      this._historyLoading = true;
      this._historyError = false;
      const request = ++this._historyRequest;
      const hass = this._hass;
      const range = this._historyRange;
      const end = new Date();
      const start = new Date(end.getTime() - RANGES[range] * 60 * 60 * 1000);
      this._refreshChart();
      try {
        if (typeof hass.callApi !== 'function') throw new Error('History API unavailable');
        const entity = encodeURIComponent(this._entity('power'));
        const path = `history/period/${encodeURIComponent(start.toISOString())}?filter_entity_id=${entity}&end_time=${encodeURIComponent(end.toISOString())}&minimal_response`;
        const response = await hass.callApi('GET', path);
        if (request !== this._historyRequest) return;
        const series = Array.isArray(response?.[0]) ? response[0] : [];
        this._history = series.map((item) => ({ time: new Date(item.last_changed || item.last_updated), value: Number(item.state) }))
          .filter((item) => Number.isFinite(item.time.getTime()) && Number.isFinite(item.value))
          .sort((a, b) => a.time - b.time);
        this._historyKey = key;
        this._historyAt = Date.now();
      } catch (_error) {
        if (request === this._historyRequest) {
          this._history = [];
          this._historyError = true;
          this._historyKey = key;
          this._historyAt = Date.now();
        }
      } finally {
        if (request === this._historyRequest) {
          this._historyLoading = false;
          this._refreshChart();
        }
      }
    }

    _refreshChart() {
      const plot = this.shadowRoot.querySelector('[data-role="chart-plot"]');
      if (plot) plot.innerHTML = this._chartSvg();
    }

    _params() {
      return `<section class="detail-panel"><h2>${this._escape(this._t('params_title'))}</h2><div class="detail-grid">
        ${this._detail('apparent_power', this._t('apparent'), 0)}${this._detail('reactive_power', this._t('reactive'), 0)}${this._detail('phase_angle', this._t('phase'), 1)}
        ${this._detail('voltage_deviation', this._t('deviation'), 1)}${this._detail('voltage_average', this._t('average'), 1)}${this._detail('voltage_status', this._t('voltage_state'), 0)}
        ${this._detail('voltage_min', this._t('min_voltage'), 1)}${this._detail('voltage_max', this._t('max_voltage'), 1)}${this._detail('current_max', this._t('max_current'), 2)}${this._detail('power_peak', this._t('peak_power'), 0)}
      </div><h2 class="subheading">${this._escape(this._t('events'))}</h2><div class="detail-grid">
        ${this._detail('inverter_events', this._t('inverter_events'), 0)}${this._detail('inverter_current_duration', this._t('current_duration'), 1)}${this._detail('last_inverter_duration', this._t('last_duration'), 1)}${this._detail('total_inverter_time', this._t('total_duration'), 2)}${this._detail('sag_count', this._t('sag_events'), 0)}${this._detail('swell_count', this._t('swell_events'), 0)}
      </div></section>`;
    }

    _energy() {
      const twoZone = this._raw('two_zone') === 'on';
      return `<section class="detail-panel energy-panel"><h2>${this._escape(this._t('energy_title'))}</h2>
        <div class="energy-hero">
          <article class="energy-visual energy-coin"><span class="eyebrow">${this._escape(this._t('today'))}</span><strong class="hero-number" data-value-key="energy_today" data-value-digits="2">${this._escape(this._formatted('energy_today', 2))}</strong><small>${this._escape(this._t('estimated_cost'))} · <span data-value-key="cost_today" data-value-digits="2">${this._escape(this._formatted('cost_today', 2))}</span></small>${this._energyCoinArt()}</article>
          <article class="energy-visual energy-load"><span class="eyebrow">${this._escape(this._t('current_load'))}</span><strong class="hero-number" data-value-key="power" data-value-digits="0">${this._escape(this._formatted('power', 0))}</strong><small>${this._escape(this._t('cost_rate'))} · <span data-value-key="cost_rate" data-value-digits="2">${this._escape(this._formatted('cost_rate', 2))}</span></small>${this._plugArt()}</article>
        </div>
        <div class="detail-grid energy-grid">
          ${this._detail('energy_today', this._t('today'), 3)}${this._detail('energy_month', this._t('energy_month'), 2)}${this._detail('energy_total', this._t('energy_total'), 3)}
          ${this._detail('cost_today', this._t('cost_today'), 2)}${this._detail('cost_month', this._t('cost_month'), 2)}${this._detail('cost_total', this._t('cost_total'), 2)}
          ${this._detail('tariff', this._t('tariff'), 2)}${this._detail('cost_rate', this._t('cost_rate'), 2)}
          <div class="detail tariff-state"><span>${this._escape(this._t('two_zone'))}</span><b data-role="energy-two-zone-value" class="${twoZone ? 'good' : ''}">${this._escape(twoZone ? this._t('on') : this._t('off'))}</b><i class="tariff-led ${twoZone ? 'active' : ''}" data-role="energy-two-zone-led"></i></div>
        </div>
        <div class="visual-grid energy-visual-grid">
          <section class="visual-card tariff-visual"><h3>${this._escape(this._t('tariff_compare'))}</h3>${this._tariffBars()}</section>
          <section class="visual-card current-tariff"><h3>${this._escape(this._t('current_rate'))}</h3><strong class="big-number" data-value-key="tariff" data-value-digits="2">${this._escape(this._formatted('tariff', 2))}</strong><span class="rate-pulse">${this._svg('energy')} ${this._escape(this._t('two_zone'))}: <span data-role="energy-two-zone-label">${this._escape(twoZone ? this._t('on') : this._t('off'))}</span></span></section>
        </div>
      </section>`;
    }

    _energyCoinArt() {
      return `
        <svg viewBox="0 0 130 130" class="energy-object coin-object real-vector-art" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
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
        <svg viewBox="0 0 130 130" class="energy-object plug-object real-vector-art" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
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

    _tariffBars() {
      const day = this._num('tariff_day'); const night = this._num('tariff_night');
      const max = Math.max(day || 0, night || 0, 0.01);
      const row = (key, label, cls, value) => `<div class="bar-row"><span>${this._escape(this._t(label))}</span><div class="bar-track"><i class="${cls}" data-tariff-fill="${key}" style="width:${value === null ? 0 : Math.max(0, Math.min(100, value / max * 100)).toFixed(1)}%"></i></div><b data-value-key="${key}" data-value-digits="2">${this._escape(this._formatted(key, 2))}</b></div>`;
      return `<div class="bar-list">${row('tariff_day', 'day', 'day-rate', day)}${row('tariff_night', 'night', 'night-rate', night)}</div>`;
    }

    _settings() {
      const twoZone = this._raw('two_zone') === 'on';
      const esp = this._raw('esp_status');
      const deviceState = esp === 'on' ? this._t('online') : esp === 'off' ? this._t('offline') : esp === 'unavailable' ? this._t('unavailable') : this._t('unknown');
      const deviceClass = esp === 'on' ? 'online' : esp === 'off' ? 'offline' : 'unknown';
      return `<section class="detail-panel settings-panel"><h2>${this._escape(this._t('settings_title'))}</h2>
        <div class="settings-hero">${this._chipArt()}<div class="device-copy"><strong>${this._escape(this._t('device_name'))}</strong><span>${this._escape(this._t('device_description'))}</span></div><div class="device-status ${deviceClass}" data-role="device-status"><i></i><b data-role="device-state">${this._escape(deviceState)}</b></div></div>
        <div class="detail-grid settings-grid">
        ${this._setting('sag_threshold', this._t('sag'))}${this._setting('swell_threshold', this._t('swell'))}${this._setting('nominal_voltage', this._t('nominal'))}${this._setting('tariff_day', this._t('tariff_day'))}${this._setting('tariff_night', this._t('tariff_night'))}
        <div class="detail switch-setting"><span>${this._escape(this._t('two_zone'))}</span><strong data-role="switch-value">${this._escape(twoZone ? this._t('on') : this._t('off'))}</strong><button class="switch-button ${twoZone ? 'on' : ''}" data-switch="two_zone" aria-pressed="${twoZone}">${this._svg('gear')}<span data-role="switch-label">${this._escape(twoZone ? this._t('on') : this._t('off'))}</span></button></div>
      </div><h2 class="subheading">${this._escape(this._t('diagnostics'))}</h2><div class="detail-grid">
        ${this._detail('wifi_signal', this._t('wifi'), 0)}${this._detail('esp_temperature', this._t('temperature'), 1)}${this._detail('uptime', this._t('uptime'), 0)}${this._detail('ip_address', this._t('ip'), 0)}${this._detail('ssid', this._t('ssid'), 0)}${this._detail('inverter_events', this._t('inverter_events'), 0)}
      </div><h2 class="subheading">${this._escape(this._t('actions'))}</h2><div class="action-grid">
        ${this._action('reset_energy', this._t('reset_energy'))}${this._action('reset_events', this._t('reset_events'))}${this._action('reset_cost', this._t('reset_cost'))}${this._action('restart', this._t('restart'))}
      </div></section>`;
    }

    _chipArt() {
      return `
        <svg viewBox="0 0 140 140" class="chip-art real-vector-art" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
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

    _action(key, label) {
      return `<button class="action-button" data-action="${key}" ${!this._state(key) ? 'disabled' : ''}><span>${this._svg(key === 'restart' ? 'gear' : 'energy')}</span>${this._escape(label)}</button>`;
    }

    _render() {
      if (!this._config || !this._hass) return;
      if (this._dialogResolver) {
        this._renderPending = true;
        return;
      }
      const status = this._displayStatus();
      const online = status.esp === 'on';
      const readyClass = this._hasRendered ? ' render-ready' : '';
      const tab = (id, key, icon) => `<button class="tab ${this._activeTab === id ? 'active' : ''}" data-tab="${id}" aria-selected="${this._activeTab === id}"><span class="tab-icon">${this._svg(icon)}</span>${this._escape(this._t(key))}</button>`;
      const activeContent = this._activeTab === 'home' ? this._home() : this._activeTab === 'params' ? this._params() : this._activeTab === 'energy' ? this._energy() : this._settings();
      this.shadowRoot.innerHTML = `<style>${GridMonitorCard.CSS}</style><main class="shell ${status.stateClass}${readyClass}">
        <header class="header"><div class="logo">${this._svg('bolt')}</div><div class="brand"><h1>${this._escape(this._config.name || this._t('title'))}</h1><p>${this._escape(this._t('subtitle'))}</p></div>
          <div class="headright"><div class="connection ${online ? 'online' : status.esp === 'off' ? 'offline' : 'unknown'}"><span class="dot"></span><strong>${this._escape(online ? this._t('online') : status.esp === 'off' ? this._t('offline') : this._t('unknown'))}</strong><small data-role="updated-time">${this._escape(this._t('updated'))}: ${this._escape(this._updatedTime())}</small></div><span class="wifi-icon" data-role="wifi-icon" title="${this._escape(this._formatted('wifi_signal', 0))}">${this._svg('wifi')}</span></div>
        </header>
        <nav class="tabs card" aria-label="${this._escape(this._t('home'))}">${tab('home', 'home', 'home')}${tab('params', 'params_tab', 'params')}${tab('energy', 'energy_tab', 'energy')}${tab('settings', 'settings_tab', 'settings')}</nav>
        <div class="view">${activeContent}</div>
        <footer class="footer"><span>ESPHome · Grid Monitor</span><span data-value-key="ssid" data-value-digits="0">${this._escape(this._formatted('ssid', 0))}</span></footer>
      </main>`;
      this._hasRendered = true;
      this._renderedLanguage = this._lang();
    }

    _activeContent() {
      return this._activeTab === 'home' ? this._home() : this._activeTab === 'params' ? this._params() : this._activeTab === 'energy' ? this._energy() : this._settings();
    }

    _handleCardClick(event) {
      const dialogAction = event.target?.closest?.('[data-dialog-action]');
      if (dialogAction) {
        this._finishDialog(dialogAction.dataset.dialogAction === 'confirm' || dialogAction.dataset.dialogAction === 'close');
        return;
      }
      const target = event.target?.closest?.('[data-tab], [data-period], [data-action], [data-number-save], [data-switch]');
      if (!target) return;
      if (target.dataset.tab) {
        if (target.dataset.tab === this._activeTab) return;
        this._activeTab = target.dataset.tab;
        this.shadowRoot.querySelectorAll('[data-tab]').forEach((button) => {
          const active = button.dataset.tab === this._activeTab;
          button.classList.toggle('active', active);
          button.setAttribute('aria-selected', String(active));
        });
        const view = this.shadowRoot.querySelector('.view');
        if (view) view.innerHTML = this._activeContent();
        this._ensureHistory();
        return;
      }
      if (target.dataset.period) {
        if (this._historyRange === target.dataset.period) return;
        this._historyRequest += 1;
        this._historyLoading = false;
        this._historyRange = target.dataset.period;
        this._historyKey = '';
        this._history = [];
        this.shadowRoot.querySelectorAll('[data-period]').forEach((button) => {
          const active = button.dataset.period === this._historyRange;
          button.classList.toggle('active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        this._refreshChart();
        this._loadHistory();
        return;
      }
      if (target.dataset.action) this._call(target.dataset.action);
      else if (target.dataset.numberSave) this._saveNumber(target.dataset.numberSave);
      else if (target.dataset.switch) this._toggleSwitch(target.dataset.switch);
    }

    _updateValueBindings(changed) {
      for (const key of changed) {
        this.shadowRoot.querySelectorAll(`[data-value-key="${key}"]`).forEach((element) => {
          const digits = Number(element.dataset.valueDigits ?? 1);
          element.textContent = this._formatted(key, digits);
        });
        this.shadowRoot.querySelectorAll(`[data-unit-key="${key}"]`).forEach((element) => {
          element.textContent = this._unit(key);
        });
      }
    }

    _updateChanged(changed) {
      this._updateValueBindings(changed);
      if (changed.has('esp_status')) this._updateConnectionStatus();
      if (changed.has('voltage') || changed.has('power') || changed.has('current')) this._updateHeaderTime();
      if (changed.has('wifi_signal')) this._updateWifiTitle();
      if (changed.has('mains') || changed.has('inverter') || changed.has('esp_status') || changed.has('voltage_alarm')) {
        this._updateStatusClasses();
        if (this._activeTab === 'home') this._updateHomeStatus();
      }
      if (this._activeTab === 'home') this._updateHome(changed);
      if (this._activeTab === 'energy') this._updateEnergy(changed);
      if (this._activeTab === 'settings') this._updateSettings(changed);
    }

    _updateConnectionStatus() {
      const esp = this._raw('esp_status');
      const connection = this.shadowRoot.querySelector('.connection');
      const label = connection?.querySelector('strong');
      if (!connection || !label) return;
      const online = esp === 'on';
      connection.className = `connection ${online ? 'online' : esp === 'off' ? 'offline' : 'unknown'}`;
      label.textContent = online ? this._t('online') : esp === 'off' ? this._t('offline') : this._t('unknown');
    }

    _updateHeaderTime() {
      const element = this.shadowRoot.querySelector('[data-role="updated-time"]');
      if (element) element.textContent = `${this._t('updated')}: ${this._updatedTime()}`;
    }

    _updateWifiTitle() {
      const element = this.shadowRoot.querySelector('[data-role="wifi-icon"]');
      if (element) element.title = this._formatted('wifi_signal', 0);
    }

    _updateStatusClasses() {
      const status = this._displayStatus();
      const shell = this.shadowRoot.querySelector('.shell');
      const voltage = this.shadowRoot.querySelector('[data-role="voltage-card"]');
      const indicator = this.shadowRoot.querySelector('[data-role="state-indicator"]');
      const banner = this.shadowRoot.querySelector('[data-role="home-banner"]');
      if (shell) shell.className = `shell ${status.stateClass}${this._hasRendered ? ' render-ready' : ''}`;
      if (voltage) voltage.className = `card voltage ${status.stateClass}`;
      if (indicator) indicator.className = `state-indicator ${status.stateClass}`;
      const indicatorLabel = indicator?.querySelector('[data-role="state-label"]');
      if (indicatorLabel) indicatorLabel.textContent = status.status;
      if (banner) banner.className = `card banner ${status.stateClass}`;
      const bannerLabel = banner?.querySelector('[data-role="home-banner-label"]');
      if (bannerLabel) bannerLabel.textContent = status.banner;
    }

    _updateGauge() {
      const voltage = this._num('voltage');
      const progress = voltage === null ? 0 : Math.max(0, Math.min(100, ((voltage - 150) / 130) * 100));
      const number = voltage === null ? this._formatted('voltage') : voltage.toLocaleString(this._locale(), { maximumFractionDigits: 1 });
      const unit = voltage === null ? '' : this._unit('voltage') || (this._lang() === 'uk' ? 'В' : 'V');
      const numberNode = this.shadowRoot.querySelector('[data-role="voltage-number"]');
      const unitNode = this.shadowRoot.querySelector('[data-role="voltage-unit"]');
      if (numberNode) numberNode.textContent = number;
      if (unitNode) unitNode.textContent = unit;
      const arc = this.shadowRoot.querySelector('[data-role="gauge-progress"]');
      if (arc) arc.setAttribute('stroke-dasharray', `${progress} 100`);
      this.shadowRoot.querySelectorAll('[data-gauge-tick]').forEach((tick) => {
        tick.classList.toggle('active', voltage !== null && Number(tick.dataset.gaugeTick) / 24 * 100 <= progress);
      });
      const dot = this.shadowRoot.querySelector('[data-role="gauge-dot"]');
      if (dot) {
        if (voltage === null) dot.setAttribute('visibility', 'hidden');
        else {
          const angle = (180 + progress * 1.8) * Math.PI / 180;
          dot.setAttribute('cx', (250 + 190 * Math.cos(angle)).toFixed(1));
          dot.setAttribute('cy', (270 + 190 * Math.sin(angle)).toFixed(1));
          dot.setAttribute('visibility', 'visible');
        }
      }
    }

    _updateMetric(key) {
      const metric = this.shadowRoot.querySelector(`[data-metric-key="${key}"]`);
      if (!metric) return;
      const digits = Number(metric.dataset.metricDigits ?? 1);
      const value = this._num(key);
      const number = metric.querySelector('[data-role="metric-number"]');
      const unitNode = metric.querySelector('[data-role="metric-unit"]');
      if (number) number.textContent = value === null ? this._formatted(key, digits) : value.toLocaleString(this._locale(), { maximumFractionDigits: digits });
      if (unitNode) {
        const unit = this._unit(key);
        unitNode.textContent = unit;
        unitNode.style.display = unit ? '' : 'none';
      }
    }

    _updateChartCurrent() {
      const chart = this.shadowRoot.querySelector('.chart');
      if (!chart) return;
      const current = this._num('power');
      const maximum = Math.max(250, Number(chart.dataset.chartMax) || 250);
      const y = current === null ? 174 : 174 - (Math.max(0, current) / maximum) * (174 - 18);
      const dot = chart.querySelector('[data-role="chart-dot"]');
      const tag = chart.querySelector('[data-role="chart-tag"]');
      const label = chart.querySelector('[data-role="chart-tag-text"]');
      if (dot) {
        dot.setAttribute('cy', y.toFixed(1));
        dot.setAttribute('visibility', current === null ? 'hidden' : 'visible');
      }
      if (tag) tag.setAttribute('y', Math.max(4, y - 44).toFixed(1));
      if (label) {
        label.setAttribute('y', Math.max(24, y - 24).toFixed(1));
        label.textContent = current === null ? '' : `${current.toLocaleString(this._locale(), { maximumFractionDigits: 0 })} ${this._lang() === 'uk' ? 'Вт' : 'W'}`;
        label.setAttribute('visibility', current === null ? 'hidden' : 'visible');
      }
      if (tag) tag.setAttribute('visibility', current === null ? 'hidden' : 'visible');
    }

    _updateHomeStatus() {
      const status = this._displayStatus();
      const mainsText = status.mains === 'on' ? this._t('has_voltage') : status.inverter ? this._t('no_voltage') : this._t('detecting');
      const pzemText = status.mains === 'on' ? this._t('active') : status.inverter ? this._t('inactive') : this._t('detecting');
      const sourceText = status.inverter ? this._t('from_inverter') : status.mains === 'on' ? this._t('from_mains') : this._t('detecting');
      const mains = this.shadowRoot.querySelector('[data-role="home-mains"]');
      const source = this.shadowRoot.querySelector('[data-role="home-source"]');
      const pzem = this.shadowRoot.querySelector('[data-role="home-pzem"]');
      if (mains) { mains.textContent = mainsText; mains.classList.toggle('good', status.mains === 'on'); }
      if (source) source.textContent = sourceText;
      if (pzem) { pzem.textContent = pzemText; pzem.classList.toggle('good', status.mains === 'on'); }
    }

    _updateTariffBars() {
      const day = this._num('tariff_day');
      const night = this._num('tariff_night');
      const max = Math.max(day || 0, night || 0, 0.01);
      this.shadowRoot.querySelectorAll('[data-tariff-fill]').forEach((fill) => {
        const value = this._num(fill.dataset.tariffFill);
        fill.style.width = `${value === null ? 0 : Math.max(0, Math.min(100, value / max * 100)).toFixed(1)}%`;
      });
    }

    _updateEnergyTwoZone() {
      const active = this._raw('two_zone') === 'on';
      const label = this._t(active ? 'on' : 'off');
      const value = this.shadowRoot.querySelector('[data-role="energy-two-zone-value"]');
      const led = this.shadowRoot.querySelector('[data-role="energy-two-zone-led"]');
      const pulse = this.shadowRoot.querySelector('[data-role="energy-two-zone-label"]');
      if (value) { value.textContent = label; value.classList.toggle('good', active); }
      if (led) led.classList.toggle('active', active);
      if (pulse) pulse.textContent = label;
    }

    _updateSettings(changed) {
      const settingKeys = ['sag_threshold', 'swell_threshold', 'nominal_voltage', 'tariff_day', 'tariff_night'];
      for (const key of settingKeys) {
        if (!changed.has(key)) continue;
        const state = this._state(key);
        const input = this.shadowRoot.querySelector(`[data-number-input="${key}"]`);
        const save = this.shadowRoot.querySelector(`[data-number-save="${key}"]`);
        if (input) {
          if (this.shadowRoot.activeElement !== input) {
            const value = this._num(key);
            input.value = value === null ? '' : value;
          }
          const attributes = state?.attributes || {};
          input.dataset.min = Number.isFinite(Number(attributes.min)) ? Number(attributes.min) : '';
          input.dataset.max = Number.isFinite(Number(attributes.max)) ? Number(attributes.max) : '';
          input.dataset.step = Number.isFinite(Number(attributes.step)) && Number(attributes.step) > 0 ? Number(attributes.step) : 'any';
          input.disabled = !state;
        }
        if (save) save.disabled = !state;
      }
      if (changed.has('esp_status')) this._updateDeviceStatus();
      if (changed.has('two_zone')) this._updateSwitch();
      for (const key of ['reset_energy', 'reset_events', 'reset_cost', 'restart']) {
        if (!changed.has(key)) continue;
        const button = this.shadowRoot.querySelector(`[data-action="${key}"]`);
        if (button) button.disabled = !this._state(key);
      }
    }

    _updateDeviceStatus() {
      const esp = this._raw('esp_status');
      const status = this.shadowRoot.querySelector('[data-role="device-status"]');
      const label = this.shadowRoot.querySelector('[data-role="device-state"]');
      if (!status || !label) return;
      status.className = `device-status ${esp === 'on' ? 'online' : esp === 'off' ? 'offline' : 'unknown'}`;
      label.textContent = esp === 'on' ? this._t('online') : esp === 'off' ? this._t('offline') : esp === 'unavailable' ? this._t('unavailable') : this._t('unknown');
    }

    _updateSwitch() {
      const active = this._raw('two_zone') === 'on';
      const label = this._t(active ? 'on' : 'off');
      const button = this.shadowRoot.querySelector('[data-switch="two_zone"]');
      const value = this.shadowRoot.querySelector('[data-role="switch-value"]');
      const text = button?.querySelector('[data-role="switch-label"]');
      if (value) value.textContent = label;
      if (button) { button.classList.toggle('on', active); button.setAttribute('aria-pressed', String(active)); }
      if (text) text.textContent = label;
    }

    _updateHome(changed) {
      if (changed.has('voltage')) this._updateGauge();
      for (const key of ['power', 'current', 'frequency', 'power_factor']) {
        if (changed.has(key)) this._updateMetric(key);
      }
      if (changed.has('power')) this._updateChartCurrent();
    }

    _updateEnergy(changed) {
      if (changed.has('tariff_day') || changed.has('tariff_night')) this._updateTariffBars();
      if (changed.has('two_zone')) this._updateEnergyTwoZone();
    }

    _showDialog({ title, message, confirm = false }) {
      if (this._dialogResolver) this._finishDialog(false);
      return new Promise((resolve) => {
        this._dialogResolver = resolve;
        this._dialogReturnFocus = this.shadowRoot.activeElement;
        const dialog = document.createElement('div');
        dialog.className = 'app-dialog-backdrop';
        dialog.dataset.dialogRoot = '';
        const cancelButton = confirm
          ? `<button type="button" class="dialog-button secondary" data-dialog-action="cancel">${this._escape(this._t('dialog_cancel'))}</button>`
          : '';
        const primaryAction = confirm ? 'confirm' : 'close';
        const primaryLabel = confirm ? this._t('dialog_confirm') : this._t('dialog_close');
        dialog.innerHTML = `<section class="app-dialog" role="dialog" aria-modal="true" aria-labelledby="grid-monitor-dialog-title" aria-describedby="grid-monitor-dialog-message">
          <div class="dialog-mark" aria-hidden="true">${confirm ? this._svg('gear') : '!'}</div>
          <h2 id="grid-monitor-dialog-title">${this._escape(title)}</h2>
          <p id="grid-monitor-dialog-message">${this._escape(message)}</p>
          <div class="dialog-actions">${cancelButton}<button type="button" class="dialog-button primary" data-dialog-action="${primaryAction}">${this._escape(primaryLabel)}</button></div>
        </section>`;
        dialog.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            this._finishDialog(false);
            return;
          }
          if (event.key === 'Tab') {
            const buttons = [...dialog.querySelectorAll('button:not([disabled])')];
            if (!buttons.length) return;
            const first = buttons[0];
            const last = buttons[buttons.length - 1];
            if (event.shiftKey && this.shadowRoot.activeElement === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && this.shadowRoot.activeElement === last) {
              event.preventDefault();
              first.focus();
            }
          }
        });
        this.shadowRoot.append(dialog);
        const focusTarget = dialog.querySelector('[data-dialog-action="confirm"], [data-dialog-action="close"]');
        if (focusTarget) focusTarget.focus();
      });
    }

    _finishDialog(result) {
      const dialog = this.shadowRoot.querySelector('[data-dialog-root]');
      if (dialog) dialog.remove();
      const resolve = this._dialogResolver;
      const returnFocus = this._dialogReturnFocus;
      this._dialogResolver = null;
      this._dialogReturnFocus = null;
      if (resolve) resolve(Boolean(result));
      if (this._renderPending) {
        this._renderPending = false;
        this._render();
      } else if (returnFocus?.isConnected) {
        returnFocus.focus();
      }
    }

    async _saveNumber(key) {
      const entity = this._entity(key);
      const input = this.shadowRoot.querySelector(`[data-number-input="${key}"]`);
      if (!input) return;
      const rawVal = String(input.value || '').replace(',', '.').trim();
      const value = Number(rawVal);
      const state = this._state(key);
      if (!state || !Number.isFinite(value)) {
        await this._showDialog({ title: this._t('dialog_error_title'), message: this._t('invalid_number') });
        return;
      }
      const min = Number(state.attributes?.min);
      const max = Number(state.attributes?.max);
      if ((Number.isFinite(min) && value < min) || (Number.isFinite(max) && value > max)) {
        await this._showDialog({ title: this._t('dialog_error_title'), message: this._t('invalid_number') });
        return;
      }
      await this._hass.callService('number', 'set_value', { entity_id: entity, value });
      const btn = this.shadowRoot.querySelector(`[data-number-save="${key}"]`);
      if (btn) {
        const origText = btn.textContent;
        btn.textContent = '✓ ' + this._t('save');
        btn.style.borderColor = '#35ed91';
        btn.style.color = '#35ed91';
        setTimeout(() => {
          btn.textContent = origText;
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 1600);
      }
    }

    async _toggleSwitch(key) {
      const entity = this._entity(key);
      if (!this._state(key)) return;
      await this._hass.callService('switch', 'toggle', { entity_id: entity });
    }

    async _call(key) {
      const entity = this._entity(key);
      const state = this._state(key);
      if (!state || !this._hass) return;
      const confirmed = await this._showDialog({
        title: this._t('dialog_confirm_title'),
        message: `${this._t('confirm')}\n${state.attributes?.friendly_name || entity}`,
        confirm: true,
      });
      if (!confirmed) return;
      await this._hass.callService('button', 'press', { entity_id: entity });
    }

    static get CSS() {
      return `
        :host{display:block;container-type:inline-size;
        .real-vector-art { display: block; overflow: visible; }
        .tower-beacon { animation: beaconFlash 1.6s ease-in-out infinite; }
        @keyframes beaconFlash { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; filter: drop-shadow(0 0 7px #ff0033); } }
--bg:#07111f;--panel:#101e30;--panel2:#14243a;--line:#29415d;--muted:#9fb4d1;--text:#f3f7ff;--blue:#12aaff;--cyan:#13d5f4;--green:#35ed91;--purple:#b56aff;--amber:#ffb51b;--red:#ff526d;color:var(--text);font-family:var(--primary-font-family,Inter,Roboto,Arial,sans-serif)}
        *{box-sizing:border-box}.shell{width:100%;padding:clamp(12px,2vw,24px);background:radial-gradient(ellipse at 50% 0%,#142b48 0,#081321 55%,#050b14 100%);border:1px solid #173656;border-radius:28px;box-shadow:0 18px 55px #0008,inset 0 1px 0 #ffffff0b;overflow:hidden}
        .card{background:linear-gradient(145deg,rgba(20,36,57,.97),rgba(8,19,33,.98));border:1px solid #2a4564;border-radius:22px;box-shadow:0 10px 28px #0005,inset 0 1px 0 #ffffff0b}
        .icon{width:1em;height:1em;display:block;fill:currentColor}.header{display:flex;align-items:center;gap:18px;padding:4px 2px 18px}.logo{width:88px;height:88px;flex:none;border:1px solid #087ed0;border-radius:24px;background:linear-gradient(145deg,#073e7b,#07172d);display:grid;place-items:center;box-shadow:0 0 25px #008fff40;color:#39baff}.logo .icon{width:55px;height:55px;filter:drop-shadow(0 0 9px #00aaff)}
        .brand{min-width:0}.brand h1{font-size:clamp(23px,3.2cqw,39px);margin:0 0 3px;letter-spacing:-1px;line-height:1.1}.brand p{margin:0;color:#a9bedc;font-size:clamp(14px,1.8cqw,20px)}.headright{margin-left:auto;display:flex;align-items:center;gap:20px;color:#9eb5d5}.connection{text-align:right;white-space:nowrap}.connection strong{color:var(--green);font-size:18px}.connection.offline strong{color:var(--red)}.connection.unknown strong{color:var(--muted)}.connection small{display:block;color:#9eb5d5;margin-top:4px}.dot{display:inline-block;width:12px;height:12px;background:var(--green);border-radius:50%;margin-right:9px;box-shadow:0 0 15px var(--green)}.connection.offline .dot{background:var(--red);box-shadow:0 0 15px var(--red)}.connection.unknown .dot{background:#8194a9;box-shadow:none}.wifi-icon{font-size:30px;color:#149fff;border-left:1px solid #29415d;padding-left:20px}.wifi-icon .icon{width:32px;height:32px}
        .tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:6px;gap:5px;margin-bottom:18px;background:linear-gradient(100deg,#15263b,#1b2c44)}.tab{border:0;background:transparent;color:#a9bedc;padding:13px 8px;border-radius:17px;font:inherit;font-size:clamp(13px,1.5cqw,18px);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:11px;transition:background .18s,color .18s}.tab .tab-icon{font-size:24px;color:inherit}.tab .icon{width:25px;height:25px}.tab.active{background:linear-gradient(110deg,#078be9,#0875d5);color:white;box-shadow:0 5px 20px #008dff40}.tab:focus-visible,.period-button:focus-visible,.action-button:focus-visible,.save-button:focus-visible,.switch-button:focus-visible{outline:2px solid #8ce1ff;outline-offset:2px}
        .main-grid{display:grid;grid-template-columns:1.03fr 1fr;gap:14px}.voltage{min-height:385px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;position:relative;overflow:hidden}.voltage.alarm{border-color:#ff526d99}.voltage.inverter{border-color:#ffb51b99}.voltage-gauge{width:min(100%,490px);height:auto;overflow:visible}.voltage-value{font-size:70px;font-weight:800;letter-spacing:-2px;fill:#f7fbff}.voltage-unit{font-size:43px;letter-spacing:0}.voltage-label{font-size:25px;fill:#b3c8e4}.state-indicator{display:flex;align-items:center;gap:11px;color:var(--green);font-size:24px;font-weight:800;margin-top:-3px}.state-indicator.inverter{color:var(--amber)}.state-indicator.alarm,.state-indicator.offline{color:var(--red)}.state-indicator.unknown{color:var(--muted)}.check-mark{width:32px;height:32px;border-radius:50%;background:var(--green);color:#052116;display:grid;place-items:center;box-shadow:0 0 18px #35ed9166}.check-mark .icon{width:23px;height:23px}.state-indicator.inverter .check-mark{background:var(--amber);color:#392400}.state-indicator.alarm .check-mark,.state-indicator.offline .check-mark{background:var(--red);color:#390711}.state-indicator.unknown .check-mark{background:#53677e;color:#d6e5f6}
        .metrics{display:grid;grid-template-columns:1fr 1fr;gap:14px}.metric{min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;text-align:center}.metric-icon{font-size:48px;line-height:1.15;color:var(--blue);text-shadow:0 0 15px #009dff66}.metric-icon .icon{width:52px;height:52px}.metric.current .metric-icon{color:var(--cyan)}.metric.frequency .metric-icon{color:#08d6e7}.metric.pf .metric-icon{color:var(--purple)}.metric-value{font-size:clamp(30px,4cqw,53px);font-weight:800;letter-spacing:-1.5px;margin:4px 0;overflow-wrap:anywhere}.metric-value .unit{font-size:.62em;letter-spacing:0;white-space:nowrap}.metric-label{color:#b2c6e1;font-size:19px}
        .chart-card{margin-top:14px;padding:17px 20px 12px}.chart-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px}.chart-head h2{font-size:24px;margin:0;display:flex;align-items:center;gap:12px}.chart-icon{color:var(--blue);font-size:28px}.chart-icon .icon{width:30px;height:30px}.periods{margin-left:auto;display:flex;background:#1a2b42;border-radius:15px;padding:4px;gap:3px}.period-button{border:0;background:transparent;color:#b4c7e0;padding:8px 15px;border-radius:12px;font:inherit;font-size:15px;cursor:pointer}.period-button.active{background:#078de9;color:white;box-shadow:0 3px 12px #008fff55}.chart{width:100%;height:auto;display:block;overflow:visible}.chart-grid{fill:none;stroke:#29415c;stroke-width:1}.chart-grid text{fill:#b7c9df;stroke:none;font-size:14px}.chart-glow{fill:none;stroke:#0aaaff;stroke-width:8;opacity:.55}.chart-line{fill:none;stroke:#16b5ff;stroke-width:3.5;stroke-linejoin:round;stroke-linecap:round}.chart-dot{fill:#18baff;filter:drop-shadow(0 0 7px #18baff)}.chart-tag{fill:#0d2035;stroke:#08aaff}.chart-tag-text{fill:#fff!important;font-size:15px!important;font-weight:bold}.chart-empty{height:205px;display:grid;place-items:center;color:#91a8c3;font-size:14px;text-align:center;padding:20px}
        .bottom-status{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:13px;margin-top:14px}.info{padding:17px 12px;min-height:128px;display:flex;align-items:center;justify-content:center;gap:12px;min-width:0}.info .symbol{font-size:38px;flex:none;color:var(--green);filter:drop-shadow(0 0 10px #35ed9166)}.info .symbol .icon{width:42px;height:42px}.info .symbol.blue{color:#91b8e9}.info .symbol.amber{color:var(--amber)}.info .small{color:#b6c9e2;font-size:16px}.info strong{display:block;font-size:20px;margin-top:5px;overflow-wrap:anywhere}.info .good{color:var(--green)}.info .cost-line{margin-top:3px}
        .banner{margin-top:14px;padding:18px 24px;min-height:88px;display:flex;align-items:center;gap:18px;border:1px solid #39d77e;background:linear-gradient(90deg,#0c302a,#0c2631 68%,#102b42);box-shadow:0 0 24px #28d87920}.banner.inverter{border-color:#ffb51b;background:linear-gradient(90deg,#382711,#18283a 80%);box-shadow:0 0 24px #ffb51b20}.banner.alarm,.banner.offline{border-color:#ff526d;background:linear-gradient(90deg,#3a1420,#18283a 80%);box-shadow:0 0 24px #ff526d20}.banner.unknown{border-color:#53677e;background:linear-gradient(90deg,#1a2939,#101e30)}.banner-check{width:48px;height:48px;border-radius:50%;background:var(--green);color:#052116;display:grid;place-items:center;flex:none;box-shadow:0 0 18px #35ed9166}.banner-check .icon{width:36px;height:36px}.banner.inverter .banner-check{background:var(--amber);color:#392400}.banner.alarm .banner-check,.banner.offline .banner-check{background:var(--red);color:#390711}.banner.unknown .banner-check{background:#53677e;color:#d6e5f6}.banner strong{color:#4df29a;font-size:clamp(17px,2cqw,24px)}.banner.inverter strong{color:#ffd078}.banner.alarm strong,.banner.offline strong{color:#ff8a9a}.banner.unknown strong{color:#b4c7df}.house-art{margin-left:auto;width:130px;max-width:22%;flex:none;filter:drop-shadow(0 0 11px #1b8fff)}.house-art svg{display:block;width:100%;height:auto}
        .detail-panel{padding:22px;margin-top:2px}.detail-panel h2{margin:0 0 18px;font-size:25px}.detail-panel h2.subheading{margin:24px 0 14px;font-size:19px}.detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.detail{padding:16px;border-radius:16px;background:#13243a;border:1px solid #2b4562;min-width:0}.detail>span,.detail label>span{display:block;color:#9fb5d1;font-size:14px;margin-bottom:7px}.detail b{font-size:22px;overflow-wrap:anywhere}.setting{display:flex;align-items:end;gap:10px}.setting label{flex:1;min-width:0}.setting-input{display:flex;align-items:center;gap:8px}.setting-input input{width:100%;min-width:0;background:#091727;border:1px solid #37526f;border-radius:9px;color:var(--text);padding:10px;font:inherit;font-size:18px}.setting-input small{color:#9fb5d1;white-space:nowrap}.save-button,.switch-button,.action-button{border:1px solid #278ed0;background:#092645;color:#d7efff;border-radius:10px;padding:9px 12px;font:inherit;cursor:pointer}.save-button:hover,.switch-button:hover,.action-button:hover{background:#0c3962}.save-button:disabled,.switch-button:disabled,.action-button:disabled{opacity:.45;cursor:not-allowed}.switch-setting{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.switch-setting>span{color:#9fb5d1;font-size:14px}.switch-setting>strong{font-size:16px}.switch-button{grid-column:1/-1;display:flex;align-items:center;gap:8px;justify-content:center}.switch-button .icon{width:20px;height:20px}.switch-button.on{border-color:#35ed91;color:#35ed91}.action-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.action-button{min-height:68px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;font-size:13px;border-color:#2b8ed0}.action-button span{font-size:22px;color:#45bdff}.action-button .icon{width:25px;height:25px}.footer{display:flex;justify-content:space-between;gap:10px;margin:14px 2px 0;color:#6885a2;font-size:11px}.footer span:last-child{max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        @container (max-width:760px){.shell{padding:12px}.header{gap:11px;padding:5px 2px 14px}.logo{width:58px;height:58px;border-radius:17px}.logo .icon{width:38px;height:38px}.headright{gap:8px}.connection strong{font-size:14px}.connection small{font-size:10px}.wifi-icon{font-size:21px;padding-left:10px}.wifi-icon .icon{width:24px;height:24px}.tabs{margin-bottom:12px}.tab{gap:5px;padding:12px 3px;font-size:12px}.tab .tab-icon{font-size:19px}.tab .icon{width:20px;height:20px}.main-grid{grid-template-columns:1fr;gap:10px}.voltage{min-height:300px}.voltage-gauge{width:min(100%,420px)}.metrics{gap:10px}.metric{min-height:135px}.metric-icon .icon{width:38px;height:38px}.metric-label{font-size:15px}.chart-card{padding:13px 11px}.chart-head h2{font-size:19px}.periods{width:100%;margin:0}.period-button{flex:1;padding:8px 4px;font-size:13px}.bottom-status{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.info{min-height:100px;padding:12px 8px}.info .symbol .icon{width:30px;height:30px}.info .small{font-size:13px}.info strong{font-size:16px}.banner{padding:14px;min-height:70px}.banner-check{width:38px;height:38px}.banner-check .icon{width:28px;height:28px}.house-art{width:80px}.detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.detail-panel{padding:16px}.detail-panel h2{font-size:22px}.action-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @container (max-width:420px){.headright .wifi-icon{display:none}.connection small{max-width:105px}.tab{font-size:11px}.tab .tab-icon{display:none}.metric{min-height:122px;padding:12px 8px}.metric-value{font-size:clamp(25px,8cqw,34px)}.info{gap:8px}.info .symbol .icon{width:26px;height:26px}.info .small{font-size:12px}.info strong{font-size:14px}.detail-grid{grid-template-columns:1fr}.setting{align-items:stretch}}
        /* Premium instrument finish: layered glass, metal highlights and soft depth. */
        :host{color-scheme:dark}.shell{position:relative;isolation:isolate;background:radial-gradient(ellipse at 12% 8%,#008bff25,transparent 32%),radial-gradient(ellipse at 88% 24%,#20e1b31a,transparent 30%),radial-gradient(ellipse at 50% 100%,#4351be20,transparent 42%),linear-gradient(145deg,#050b16,#091629 48%,#050b16);border-color:#70aee233;box-shadow:0 24px 60px #0009,inset 0 1px 0 #ffffff18,inset 0 -1px 0 #0008}
        .shell:before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;background:linear-gradient(122deg,#ffffff08,transparent 24%,transparent 77%,#16a6ff0b)}.shell>*{position:relative;z-index:1}
        .card{position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(145deg,#192d48f5,#091526fa 68%,#0a1c30f7);border:1px solid #70aee23d;box-shadow:0 16px 34px #0007,inset 0 1px 0 #ffffff20,inset 0 -1px 0 #0006;backdrop-filter:blur(14px);transition:border-color .24s,box-shadow .24s,transform .24s}
        .card:before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;border-radius:inherit;background:linear-gradient(128deg,#ffffff12,transparent 23%,transparent 72%,#1da9ff0c)}.card:after{content:"";position:absolute;left:9%;right:9%;top:0;height:1px;z-index:0;pointer-events:none;background:linear-gradient(90deg,transparent,#c5ecff55,transparent)}.card>*{position:relative;z-index:1}
        .logo{position:relative;overflow:hidden;background:radial-gradient(circle at 34% 20%,#2580d0,#0a2c59 50%,#061428 82%);border-color:#3aaef2a8;box-shadow:0 0 0 4px #009bff12,0 14px 32px #007fff4a,inset 0 2px 13px #ffffff35,inset 0 -8px 18px #0007}.logo:after{content:"";position:absolute;inset:-65% 28% 28% -30%;transform:rotate(35deg);background:linear-gradient(90deg,transparent,#ffffff22,transparent);pointer-events:none}.logo .icon{filter:drop-shadow(0 0 10px #23baff) drop-shadow(0 4px 3px #0008)}
        .tabs{border:1px solid #79b7e34d;border-radius:23px;background:linear-gradient(180deg,#1a304beF,#091627f5);box-shadow:inset 0 1px 0 #ffffff20,0 12px 28px #0006}.tab.active{background:linear-gradient(120deg,#12b9ff,#087be9 52%,#1559c9);box-shadow:0 7px 22px #0090ff60,inset 0 1px 0 #ffffff65,inset 0 -2px 5px #003e9c80}
        .voltage{isolation:isolate;background:radial-gradient(ellipse at 50% 42%,#0093ff30,transparent 48%),linear-gradient(145deg,#173553,#071323 72%);border-color:#72b8ea4f;box-shadow:0 18px 38px #0007,inset 0 2px 0 #ffffff22,inset 0 -12px 28px #0007}.voltage:before{background:linear-gradient(125deg,#ffffff14,transparent 30%,transparent 72%,#26aeff12)}.voltage:after{content:"";position:absolute;inset:9px;z-index:0;pointer-events:none;border:1px solid #9fdfff13;border-radius:17px;box-shadow:inset 0 0 34px #0091ff18}.voltage-gauge{position:relative;z-index:1;filter:drop-shadow(0 14px 18px #0006);overflow:visible}.dial-tick{fill:none;stroke:#81b5d2;stroke-opacity:.54;stroke-width:1.7}.dial-tick.active{stroke:#b5f7ff;stroke-opacity:.96;filter:drop-shadow(0 0 4px #19bdff)}.gauge-dot{fill:#f3ffff;stroke:#08aaff;stroke-width:5;filter:drop-shadow(0 0 8px #08c5ff)}.tower-shadow{fill:#031322;opacity:.54}.tower-frame{stroke-width:1.55}.tower-frame .tower-rail{stroke-width:3}.tower-frame .tower-arm{stroke-width:2.7}.tower-frame .tower-crossarm{stroke-width:1.4;opacity:.78}.tower-frame .tower-insulator{stroke:#c8f6ff;stroke-width:1.1}.tower-frame .tower-wire{stroke:#5bc8ff;stroke-width:1;opacity:.65}.tower-foot{fill:none;stroke:#c0eeff;stroke-width:2.6;filter:drop-shadow(0 0 5px #09aaff)}.voltage-value{filter:drop-shadow(0 3px 8px #0009)}.state-indicator{position:relative;z-index:1;text-shadow:0 0 16px currentColor}.state-indicator .check-mark{box-shadow:0 0 0 5px #3fffa411,0 0 24px #3fffa070,inset 0 2px 4px #ffffff66}
        .metric{background:linear-gradient(145deg,#1c3452,#091628);border-color:#70aee247;box-shadow:inset 0 1px 0 #ffffff20,0 14px 28px #0006,inset 0 -8px 17px #0005}.metric:before{content:"";position:absolute;right:-62px;top:-76px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,#00aeff40,transparent 70%);pointer-events:none}.metric-icon{filter:drop-shadow(0 5px 9px #00a6ff65)}.metric-value{text-shadow:0 3px 14px #0007}.info{background:linear-gradient(145deg,#1a314d,#081425);border-color:#69a4d944;box-shadow:inset 0 1px 0 #ffffff1d,0 12px 27px #0006,inset 0 -7px 16px #0005}.info .symbol{filter:drop-shadow(0 5px 8px #0006) drop-shadow(0 0 10px currentColor)}
        .chart-card{background:linear-gradient(145deg,#142b45f7,#071221fa);box-shadow:0 18px 36px #0007,inset 0 1px 0 #ffffff20,inset 0 -9px 20px #0005}.chart-line{filter:drop-shadow(0 0 3px #05baff)}.chart-tag{filter:drop-shadow(0 5px 8px #0008)}
        .banner{position:relative;overflow:hidden;background:linear-gradient(105deg,#07362bf7,#082830f7 55%,#082038f7);border-color:#43f5a0b3;box-shadow:0 0 0 1px #43f5a01a,0 0 30px #29dc8621,inset 0 1px 0 #ffffff2e,inset 0 -8px 20px #0005}.banner strong{text-shadow:0 2px 12px #24ff9d45}.banner .banner-check{box-shadow:0 0 0 6px #3fffa414,0 0 24px #3fffa078,inset 0 2px 4px #ffffff5c}.banner.inverter{background:linear-gradient(105deg,#403014f7,#222a32f7 58%,#10233af7)}.banner.alarm,.banner.offline{background:linear-gradient(105deg,#401b27f7,#202336f7 62%,#171c2af7)}
        .house-art{width:min(30%,210px);max-width:210px;filter:drop-shadow(0 8px 15px #000a) drop-shadow(0 0 15px #0082ff54);opacity:.98}.house-art svg{display:block;width:100%;height:auto}
        .energy-hero{display:grid;grid-template-columns:1.08fr .92fr;gap:15px;margin:0 0 15px}.energy-visual{position:relative;isolation:isolate;min-height:170px;overflow:hidden;padding:20px;border-radius:19px;border:1px solid #70aee24f;box-shadow:inset 0 1px 0 #ffffff2c,0 16px 32px #0006,inset 0 -10px 20px #0004;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}.energy-visual:before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(circle at 82% 24%,#ffbd4a42,transparent 34%),linear-gradient(125deg,#193e68,#10213d 58%,#201d45)}.energy-load:before{background:radial-gradient(circle at 82% 24%,#19cdff40,transparent 35%),linear-gradient(125deg,#123f61,#10213d 60%,#122d50)}.energy-visual .eyebrow{color:#b4cbe6;font-size:12px;letter-spacing:.1em;text-transform:uppercase}.energy-visual .hero-number{position:relative;z-index:1;max-width:75%;margin:7px 0 3px;font-size:clamp(25px,4cqw,43px);line-height:1.12;font-weight:850;letter-spacing:-1px;text-shadow:0 4px 18px #0008;overflow-wrap:anywhere}.energy-visual small{position:relative;z-index:1;max-width:76%;color:#c1d4ea;font-size:13px}.energy-object{position:absolute;right:16px;bottom:10px;width:95px;height:95px;max-width:32%;max-height:80%;pointer-events:none;filter:drop-shadow(0 8px 14px #0008);opacity:.92;transition:transform .2s ease}.coin-object{transform:rotate(-3deg)}.plug-object{transform:rotate(4deg)}
        .energy-visual-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:14px;margin-top:14px}.visual-card{padding:18px;border-radius:18px;background:linear-gradient(145deg,#1b334ff5,#0a1728fa);border:1px solid #69a4d944;box-shadow:inset 0 1px 0 #ffffff1e,0 11px 24px #0005}.visual-card h3{margin:0 0 15px;font-size:17px}.bar-list{display:grid;gap:14px}.bar-row{display:grid;grid-template-columns:64px minmax(36px,1fr) minmax(80px,auto);gap:11px;align-items:center;color:var(--muted);font-size:13px}.bar-row b{color:var(--text);font-size:14px;text-align:right}.bar-track{height:9px;border-radius:9px;overflow:hidden;background:#263c56;box-shadow:inset 0 2px 3px #0008}.bar-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#078bff,#16d6e8);box-shadow:0 0 12px #0aaaff62;transition:width .55s ease}.bar-track i.night-rate{background:linear-gradient(90deg,#8057d8,#c07aff);box-shadow:0 0 12px #a875ff62}.rate-pulse{display:inline-flex;align-items:center;gap:7px;margin-top:13px;padding:6px 10px;border-radius:18px;background:#0b3440;border:1px solid #28bdc457;color:#69e6d4;font-size:12px;max-width:100%;flex-wrap:wrap}.rate-pulse .icon{width:17px;height:17px}.current-tariff{display:flex;flex-direction:column;justify-content:center;align-items:flex-start}.current-tariff .big-number{font-size:clamp(27px,3.5cqw,40px);overflow-wrap:anywhere}
        .settings-hero{display:flex;align-items:center;gap:15px;padding:14px 18px;margin:0 0 15px;border-radius:18px;background:linear-gradient(110deg,#163c5ff2,#17224bf2);border:1px solid #70aee24a;box-shadow:inset 0 1px 0 #ffffff27,0 14px 28px #0005}.chip-art{width:68px;height:68px;flex:none;filter:drop-shadow(0 6px 12px #0008) drop-shadow(0 0 10px #078fff35)}.device-copy{min-width:0}.device-copy strong{display:block;font-size:17px}.device-copy span{display:block;margin-top:4px;color:#a9bfdc;font-size:12px}.device-status{margin-left:auto;display:flex;align-items:center;gap:8px;white-space:nowrap;color:var(--muted);font-size:13px}.device-status i{width:10px;height:10px;border-radius:50%;background:#8597aa;box-shadow:0 0 8px #8597aa66}.device-status.online{color:var(--green)}.device-status.online i{background:var(--green);box-shadow:0 0 12px #35ed91a8}.device-status.offline{color:var(--red)}.device-status.offline i{background:var(--red);box-shadow:0 0 12px #ff526d88}.detail:hover,.visual-card:hover,.control:hover{border-color:#59bbef70;box-shadow:0 16px 32px #0007,0 0 24px #0099ff13}.tariff-state{position:relative}.tariff-led{position:absolute;right:14px;bottom:14px;width:8px;height:8px;border-radius:50%;background:#7e8ea2}.tariff-led.active{background:var(--green);box-shadow:0 0 12px #35ed91b0}
        .metric:hover,.info:hover,.action-button:hover,.save-button:hover,.switch-button:hover{transform:translateY(-3px);border-color:#54bdff80;box-shadow:0 18px 34px #0008,0 0 24px #0099ff1b}.tab,.period-button,.action-button,.save-button,.switch-button{transition:background .22s,color .22s,border-color .22s,box-shadow .22s,transform .22s}
        @media(prefers-reduced-motion:no-preference){.shell:not(.render-ready){animation:deviceBoot .7s cubic-bezier(.2,.8,.2,1) both}.logo .icon{animation:logoFloat 4.2s ease-in-out infinite}.connection.online .dot,.device-status.online i{animation:ledPulse 2.2s ease-in-out infinite}.gauge-dot{animation:gaugePulse 2.8s ease-in-out infinite}.chart-dot{animation:chartPulse 2.4s ease-in-out infinite}.voltage:after{animation:screenGlow 7s ease-in-out infinite alternate}@keyframes deviceBoot{from{opacity:0;transform:translateY(8px) scale(.995)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes logoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}@keyframes ledPulse{0%,100%{box-shadow:0 0 7px currentColor}50%{box-shadow:0 0 16px currentColor,0 0 25px currentColor}}@keyframes gaugePulse{0%,100%{filter:drop-shadow(0 0 5px #08c5ff)}50%{filter:drop-shadow(0 0 12px #08c5ff)}}@keyframes chartPulse{0%,100%{opacity:.8}50%{opacity:1}}@keyframes screenGlow{from{box-shadow:inset 0 0 24px #0091ff10}to{box-shadow:inset 0 0 40px #0091ff24}}}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
        @container (max-width:760px){.energy-hero{grid-template-columns:1fr}.energy-visual{min-height:145px}.energy-visual-grid{grid-template-columns:1fr}.energy-object{width:76px;height:76px;right:10px;bottom:8px}.settings-hero{gap:11px;padding:12px}.chip-art{width:56px;height:56px}.device-copy strong{font-size:15px}.device-status{font-size:12px}}
        @container (max-width:420px){.energy-visual{min-height:130px;padding:15px}.energy-visual .hero-number{font-size:clamp(24px,7cqw,31px);max-width:80%}.energy-visual small{font-size:11px;max-width:80%}.energy-object{width:58px;height:58px;right:8px;bottom:6px;opacity:.8}.settings-hero{flex-wrap:wrap}.chip-art{width:46px;height:46px}.device-status{margin-left:6px}.bar-row{grid-template-columns:47px minmax(24px,1fr) minmax(75px,auto);gap:7px}.banner strong{max-width:68%}}
        .app-dialog-backdrop{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:18px;background:rgba(2,8,18,.78);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}
        .app-dialog{width:min(100%,430px);padding:24px;border:1px solid #55bfff75;border-radius:22px;background:radial-gradient(ellipse at 50% 0%,#17436a,#0b1728 68%);color:#f3f7ff;box-shadow:0 24px 70px #000c,inset 0 1px 0 #ffffff20;text-align:center}
        .dialog-mark{width:48px;height:48px;margin:0 auto 14px;display:grid;place-items:center;border-radius:15px;border:1px solid #32b7ff6e;background:linear-gradient(145deg,#0d5893,#0b2949);color:#77d6ff;font-size:28px;font-weight:800;box-shadow:0 0 24px #078fff33}.dialog-mark .icon{width:25px;height:25px}
        .app-dialog h2{margin:0;color:#bdeaff;font-size:20px;line-height:1.3}.app-dialog p{margin:12px 0 22px;color:#c6d7ea;font-size:15px;line-height:1.55;white-space:pre-line;overflow-wrap:anywhere}
        .dialog-actions{display:flex;justify-content:center;gap:10px}.dialog-button{min-width:118px;min-height:44px;padding:10px 16px;border:1px solid transparent;border-radius:12px;font:inherit;font-weight:700;cursor:pointer;transition:transform .16s,box-shadow .16s,background .16s}.dialog-button:hover{transform:translateY(-1px)}.dialog-button:focus-visible{outline:2px solid #bcecff;outline-offset:3px}.dialog-button.primary{border-color:#36afff;background:linear-gradient(120deg,#0da8f4,#0867cb);color:#fff;box-shadow:0 6px 18px #008eff45}.dialog-button.secondary{border-color:#58718c;background:#182a3f;color:#d7e6f6}.dialog-button.secondary:hover{background:#213b58}
        @media(max-width:480px){.app-dialog{padding:20px 16px;border-radius:18px}.dialog-actions{flex-direction:column-reverse}.dialog-button{width:100%}}
      `;
    }
  }

  customElements.define('grid-monitor-card', GridMonitorCard);
})();
