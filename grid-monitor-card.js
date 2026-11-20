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

  const TEXT = {
    uk: {
      title: 'Мережева напруга', subtitle: 'PZEM-004T v3.0 · Grid Monitor', online: 'Онлайн', offline: 'Офлайн', updated: 'Оновлено',
      home: 'Головна', params_tab: 'Параметри', energy_tab: 'Енергія', settings_tab: 'Налаштування',
      network: 'Мережа', inverter: 'Інвертор', no_power: 'Немає напруги', detecting: 'Визначається', unknown: 'Невідомо', unavailable: 'Недоступно',
      healthy: 'Усі системи працюють нормально', inverter_banner: 'Будинок працює від інвертора', alarm_banner: 'Напруга поза заданим діапазоном', offline_banner: 'ESP недоступна',
      voltage: 'Напруга мережі', current: 'Струм', power: 'Потужність', frequency: 'Частота', pf: 'Коеф. потужності', normal: 'Норма', alarm: 'Поза нормою',
      chart_title: 'Графік потужності', hour: 'Год', day: 'День', week: 'Тиждень', month: 'Місяць', loading: 'Завантаження історії…', no_history: 'Історія потужності поки недоступна',
      mains: 'Мережа', has_voltage: 'Є напруга', no_voltage: 'Немає напруги', source: 'Джерело', from_mains: 'Від мережі', from_inverter: 'Від інвертора', pzem_link: 'Зв’язок з PZEM', active: 'Активний', inactive: 'Немає зв’язку', today_consumption: 'Споживання сьогодні',
      params_title: 'Електричні параметри', energy_title: 'Енергія та вартість', settings_title: 'Налаштування та діагностика',
      apparent: 'Повна потужність', reactive: 'Реактивна потужність', phase: 'Кут фази', deviation: 'Відхилення напруги', average: 'Середня напруга за 5 хв', min_voltage: 'Мінімальна напруга сьогодні', max_voltage: 'Максимальна напруга сьогодні', max_current: 'Максимальний струм сьогодні', peak_power: 'Пікова потужність сьогодні', voltage_state: 'Статус напруги',
      today: 'Сьогодні', energy_month: 'Споживання за місяць', energy_total: 'Загальна енергія PZEM', cost_today: 'Вартість сьогодні', cost_month: 'Вартість за місяць', cost_total: 'Загальна розрахована вартість', tariff: 'Поточний тариф', cost_rate: 'Вартість за годину', two_zone: 'Двозонний облік',
      sag: 'Поріг просідання', swell: 'Поріг перенапруги', nominal: 'Номінальна напруга', tariff_day: 'Денний тариф', tariff_night: 'Нічний тариф', wifi: 'Сигнал Wi‑Fi', temperature: 'Температура ESP32', uptime: 'Час роботи ESP32', ip: 'IP-адреса', ssid: 'Wi‑Fi мережа',
      events: 'Події інвертора', inverter_events: 'Кількість відключень', current_duration: 'Поточна тривалість', last_duration: 'Остання тривалість', total_duration: 'Загальний час від інвертора', sag_events: 'Просідання напруги', swell_events: 'Перенапруги', save: 'Зберегти', on: 'Увімкнено', off: 'Вимкнено',
      actions: 'Дії', reset_energy: 'Скинути енергію PZEM', reset_events: 'Скинути події', reset_cost: 'Скинути облік', restart: 'Перезапустити ESP', confirm: 'Виконати цю дію?', invalid_number: 'Введіть коректне число в допустимому діапазоні.',
    },
    en: {
      title: 'Grid voltage', subtitle: 'PZEM-004T v3.0 · Grid Monitor', online: 'Online', offline: 'Offline', updated: 'Updated',
      home: 'Home', params_tab: 'Parameters', energy_tab: 'Energy', settings_tab: 'Settings',
      network: 'Mains', inverter: 'Inverter', no_power: 'No voltage', detecting: 'Detecting', unknown: 'Unknown', unavailable: 'Unavailable',
      healthy: 'All systems operating normally', inverter_banner: 'House is running from the inverter', alarm_banner: 'Voltage is outside the configured range', offline_banner: 'ESP is offline',
      voltage: 'Grid voltage', current: 'Current', power: 'Power', frequency: 'Frequency', pf: 'Power factor', normal: 'Normal', alarm: 'Out of range',
      chart_title: 'Power history', hour: 'Hour', day: 'Day', week: 'Week', month: 'Month', loading: 'Loading history…', no_history: 'Power history is not available yet',
      mains: 'Mains', has_voltage: 'Voltage present', no_voltage: 'No voltage', source: 'Source', from_mains: 'From mains', from_inverter: 'From inverter', pzem_link: 'PZEM connection', active: 'Active', inactive: 'No connection', today_consumption: 'Consumption today',
      params_title: 'Electrical parameters', energy_title: 'Energy and cost', settings_title: 'Settings and diagnostics',
      apparent: 'Apparent power', reactive: 'Reactive power', phase: 'Phase angle', deviation: 'Voltage deviation', average: '5-minute average voltage', min_voltage: 'Minimum voltage today', max_voltage: 'Maximum voltage today', max_current: 'Maximum current today', peak_power: 'Peak power today', voltage_state: 'Voltage status',
      today: 'Today', energy_month: 'Consumption this month', energy_total: 'Total PZEM energy', cost_today: 'Cost today', cost_month: 'Cost this month', cost_total: 'Total calculated cost', tariff: 'Current tariff', cost_rate: 'Cost per hour', two_zone: 'Two-zone tariff',
      sag: 'Sag threshold', swell: 'Swell threshold', nominal: 'Nominal voltage', tariff_day: 'Day tariff', tariff_night: 'Night tariff', wifi: 'Wi-Fi signal', temperature: 'ESP32 temperature', uptime: 'ESP32 uptime', ip: 'IP address', ssid: 'Wi-Fi network',
      events: 'Inverter events', inverter_events: 'Outage count', current_duration: 'Current duration', last_duration: 'Last duration', total_duration: 'Total inverter time', sag_events: 'Voltage sags', swell_events: 'Voltage swells', save: 'Save', on: 'On', off: 'Off',
      actions: 'Actions', reset_energy: 'Reset PZEM energy', reset_events: 'Reset events', reset_cost: 'Reset accounting', restart: 'Restart ESP', confirm: 'Run this action?', invalid_number: 'Enter a valid number within the allowed range.',
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

  class GridMonitorCard extends HTMLElement {
    constructor() {
      super();
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
    }

    setConfig(config) {
      const prefix = config.prefix || 'grid_monitor';
      const entities = { ...DEFAULTS };
      if (prefix !== 'grid_monitor') {
        Object.keys(entities).forEach((key) => { entities[key] = entities[key].replace('grid_monitor', prefix); });
      }
      Object.assign(entities, config.entities || {});
      this._config = { ...config, entities, name: config.name || null };
      this._render();
    }

    set hass(value) {
      const active = this.shadowRoot.activeElement;
      const edit = active?.dataset?.numberInput ? { key: active.dataset.numberInput, value: active.value } : null;
      this._hass = value;
      this._render();
      if (edit) {
        const input = this.shadowRoot.querySelector(`[data-number-input="${edit.key}"]`);
        if (input) { input.value = edit.value; input.focus({ preventScroll: true }); }
      }
      this._ensureHistory();
    }

    _lang() {
      const forced = this._config?.language;
      if (forced === 'uk' || forced === 'en') return forced;
      const locale = this._hass?.locale?.language || this._hass?.language || 'uk';
      return String(locale).toLowerCase().startsWith('uk') ? 'uk' : 'en';
    }

    _t(key) { return TEXT[this._lang()][key] || key; }
    _locale() { return this._lang() === 'uk' ? 'uk-UA' : 'en-US'; }
    _entity(key) { return this._config?.entities?.[key] || DEFAULTS[key]; }
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
    _detail(key, label, digits = 1) { return `<div class="detail"><span>${this._escape(label)}</span><b>${this._escape(this._formatted(key, digits))}</b></div>`; }
    _row(key, label, icon, digits = 1) { return `<div class="row"><span class="row-label"><span class="row-symbol">${icon}</span>${this._escape(label)}</span><strong>${this._escape(this._formatted(key, digits))}</strong></div>`; }
    _setting(key, label) {
      const entity = this._entity(key);
      const state = this._state(key);
      const value = this._num(key);
      const attrs = state?.attributes || {};
      const min = Number.isFinite(Number(attrs.min)) ? Number(attrs.min) : '';
      const max = Number.isFinite(Number(attrs.max)) ? Number(attrs.max) : '';
      const step = Number.isFinite(Number(attrs.step)) && Number(attrs.step) > 0 ? Number(attrs.step) : 'any';
      return `<div class="setting detail"><label><span>${this._escape(label)}</span><div class="setting-input"><input type="number" inputmode="decimal" data-number-input="${key}" value="${value === null ? '' : value}" min="${min}" max="${max}" step="${step}" ${!state ? 'disabled' : ''}><small>${this._escape(this._unit(key))}</small></div></label><button class="save-button" data-number-save="${key}" ${!state ? 'disabled' : ''}>${this._escape(this._t('save'))}</button></div>`;
    }
    _updatedTime() {
      const latest = ['voltage', 'power', 'current'].map((key) => this._state(key)?.last_updated).filter(Boolean).map((value) => new Date(value)).filter((value) => Number.isFinite(value.getTime())).sort((a, b) => b - a)[0];
      return latest ? latest.toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : this._t('unknown');
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
      const pzemText = status.mains === 'on' ? this._t('active') : status.inverter ? this._t('inactive') : this._t('detecting');
      const mainsText = status.mains === 'on' ? this._t('has_voltage') : status.inverter ? this._t('no_voltage') : this._t('detecting');
      const sourceText = status.inverter ? this._t('from_inverter') : status.mains === 'on' ? this._t('from_mains') : this._t('detecting');
      const energy = this._formatted('energy_today', 2);
      const cost = this._formatted('cost_today', 2);
      return `<section class="home-view">
        <div class="main-grid">
          <div class="card voltage ${status.stateClass}">
            <svg class="voltage-gauge" viewBox="0 0 500 360" role="img" aria-label="${this._escape(this._t('voltage'))}">
              <defs>
                <linearGradient id="${this._id('arc')}" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#078bff"/><stop offset=".52" stop-color="#08d6e7"/><stop offset="1" stop-color="#39ef83"/></linearGradient>
                <radialGradient id="${this._id('glow')}"><stop stop-color="#087de0" stop-opacity=".32"/><stop offset="1" stop-color="#087de0" stop-opacity="0"/></radialGradient>
                <filter id="${this._id('blur')}"><feGaussianBlur stdDeviation="7"/></filter>
              </defs>
              <ellipse cx="250" cy="170" rx="190" ry="150" fill="url(#${this._id('glow')})"/>
              <path d="M72 270 A190 190 0 1 1 428 270" fill="none" stroke="#19334f" stroke-width="28" stroke-linecap="round" pathLength="100"/>
              <path d="M72 270 A190 190 0 1 1 428 270" fill="none" stroke="url(#${this._id('arc')})" stroke-width="28" stroke-linecap="round" stroke-dasharray="${progress} 100" pathLength="100"/>
              <g opacity=".82" stroke="#55bcff" fill="none" stroke-width="2.2" filter="url(#${this._id('blur')})"><path d="M250 63 205 211h90zM250 63v148M218 125h64M211 165h78M205 211l45-148 45 148"/></g>
              <g stroke="#b6eaff" fill="none" stroke-width="2.1"><path d="M250 63 205 211h90zM250 63v148M218 125h64M211 165h78M205 211l45-148 45 148"/><path d="m205 211 45-28 45 28m-78-46 33-40 33 40"/></g>
              <path d="M85 242Q150 180 205 226T320 220T420 242V270H85Z" fill="#06274a" opacity=".62"/>
              <g fill="#0a477a" opacity=".8"><path d="M90 230l8-28 8 28zm22 0 10-38 10 38zm270 0 9-34 9 34zm20 0 11-43 11 43z"/></g>
              <text x="250" y="286" text-anchor="middle" class="voltage-value">${this._escape(voltageNumber)} <tspan class="voltage-unit">${this._escape(voltageUnit)}</tspan></text>
              <text x="250" y="322" text-anchor="middle" class="voltage-label">${this._escape(this._t('voltage'))}</text>
            </svg>
            <div class="state-indicator ${status.stateClass}"><span class="check-mark">${this._svg('check')}</span>${this._escape(status.status)}</div>
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
          <div class="card info"><span class="symbol green">${this._svg('home')}</span><div><div class="small">${this._escape(this._t('mains'))}</div><strong class="${status.mains === 'on' ? 'good' : ''}">${this._escape(mainsText)}</strong></div></div>
          <div class="card info"><span class="symbol blue">${this._svg('plug')}</span><div><div class="small">${this._escape(this._t('source'))}</div><strong>${this._escape(sourceText)}</strong></div></div>
          <div class="card info"><span class="symbol green">${this._svg('shield')}</span><div><div class="small">${this._escape(this._t('pzem_link'))}</div><strong class="${status.mains === 'on' ? 'good' : ''}">${this._escape(pzemText)}</strong></div></div>
          <div class="card info"><span class="symbol amber">${this._svg('coin')}</span><div><div class="small">${this._escape(this._t('today_consumption'))}</div><strong>${this._escape(energy)}</strong><div class="small cost-line">≈ ${this._escape(cost)}</div></div></div>
        </div>
        <div class="card banner ${status.stateClass}"><span class="banner-check">${this._svg('check')}</span><strong>${this._escape(status.banner)}</strong><span class="house-art" aria-hidden="true"><svg viewBox="0 0 150 80"><path d="m12 42 62-34 62 34v33H12z" fill="#102f4e" stroke="#50b7ff" stroke-width="3"/><path d="M61 75V48h26v27M28 49h18v17H28zm77 0h18v17h-18z" fill="#ffcb69" stroke="#f4aa45" stroke-width="2"/><path d="M7 77h137" stroke="#42c67e" stroke-width="4" stroke-linecap="round"/><circle cx="25" cy="31" r="3" fill="#77d5ff"/><circle cx="128" cy="19" r="3" fill="#77d5ff"/></svg></span></div>
      </section>`;
    }

    _id(name) { return `gm-${name}`; }
    _heroMetric(key, icon, digits) {
      const value = this._num(key);
      const display = value === null ? this._escape(this._formatted(key, digits)) : value.toLocaleString(this._locale(), { maximumFractionDigits: digits });
      const unit = this._unit(key);
      const extraClass = key === 'power_factor' ? 'pf' : key;
      return `<div class="card metric ${extraClass}"><div class="metric-icon">${this._svg(icon)}</div><div class="metric-value">${display}${unit ? ` <span class="unit">${this._escape(unit)}</span>` : ''}</div><div class="metric-label">${this._escape(this._t(key === 'power_factor' ? 'pf' : key))}</div></div>`;
    }

    _chart() {
      const labels = ['hour', 'day', 'week', 'month'];
      const buttons = labels.map((period) => `<button class="period-button ${this._historyRange === period ? 'active' : ''}" data-period="${period}" aria-pressed="${this._historyRange === period}">${this._escape(this._t(period))}</button>`).join('');
      return `<section class="card chart-card"><div class="chart-head"><h2><span class="chart-icon">${this._svg('chart')}</span>${this._escape(this._t('chart_title'))}</h2><div class="periods" role="group" aria-label="${this._escape(this._t('chart_title'))}">${buttons}</div></div>${this._chartSvg()}</section>`;
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
      return `<svg class="chart" viewBox="0 0 1000 210" role="img" aria-label="${this._escape(this._t('chart_title'))}"><defs><linearGradient id="${this._id('area')}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#078ff0" stop-opacity=".55"/><stop offset="1" stop-color="#078ff0" stop-opacity=".04"/></linearGradient><filter id="${this._id('line-glow')}"><feGaussianBlur stdDeviation="3"/></filter></defs><g class="chart-grid">${horizontal}${vertical}</g><path d="${area}" fill="url(#${this._id('area')})"/><path d="${line}" class="chart-glow" filter="url(#${this._id('line-glow')})"/><path d="${line}" class="chart-line"/><circle cx="${x1}" cy="${currentY.toFixed(1)}" r="7" class="chart-dot"/>${latest ? `<rect x="908" y="${Math.max(4, currentY - 44).toFixed(1)}" width="82" height="30" rx="9" class="chart-tag"/><text x="949" y="${Math.max(24, currentY - 24).toFixed(1)}" text-anchor="middle" class="chart-tag-text">${this._escape(latest)} ${this._lang() === 'uk' ? 'Вт' : 'W'}</text>` : ''}</svg>`;
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
      this._render();
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
          this._render();
        }
      }
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
      return `<section class="detail-panel"><h2>${this._escape(this._t('energy_title'))}</h2><div class="detail-grid energy-grid">
        ${this._detail('energy_today', this._t('today'), 3)}${this._detail('energy_month', this._t('energy_month'), 2)}${this._detail('energy_total', this._t('energy_total'), 3)}
        ${this._detail('cost_today', this._t('cost_today'), 2)}${this._detail('cost_month', this._t('cost_month'), 2)}${this._detail('cost_total', this._t('cost_total'), 2)}
        ${this._detail('tariff', this._t('tariff'), 2)}${this._detail('cost_rate', this._t('cost_rate'), 2)}${this._detail('two_zone', this._t('two_zone'), 0)}
      </div></section>`;
    }

    _settings() {
      const twoZone = this._raw('two_zone') === 'on';
      const wifi = this._formatted('wifi_signal', 0);
      return `<section class="detail-panel"><h2>${this._escape(this._t('settings_title'))}</h2><div class="detail-grid settings-grid">
        ${this._setting('sag_threshold', this._t('sag'))}${this._setting('swell_threshold', this._t('swell'))}${this._setting('nominal_voltage', this._t('nominal'))}${this._setting('tariff_day', this._t('tariff_day'))}${this._setting('tariff_night', this._t('tariff_night'))}
        <div class="detail switch-setting"><span>${this._escape(this._t('two_zone'))}</span><strong>${this._escape(twoZone ? this._t('on') : this._t('off'))}</strong><button class="switch-button ${twoZone ? 'on' : ''}" data-switch="two_zone" aria-pressed="${twoZone}">${this._svg('gear')}<span>${this._escape(twoZone ? this._t('on') : this._t('off'))}</span></button></div>
      </div><h2 class="subheading">${this._escape(this._t('settings_title'))}</h2><div class="detail-grid">
        ${this._detail('wifi_signal', this._t('wifi'), 0)}${this._detail('esp_temperature', this._t('temperature'), 1)}${this._detail('uptime', this._t('uptime'), 0)}${this._detail('ip_address', this._t('ip'), 0)}${this._detail('ssid', this._t('ssid'), 0)}${this._detail('inverter_events', this._t('inverter_events'), 0)}
      </div><h2 class="subheading">${this._escape(this._t('actions'))}</h2><div class="action-grid">
        ${this._action('reset_energy', this._t('reset_energy'))}${this._action('reset_events', this._t('reset_events'))}${this._action('reset_cost', this._t('reset_cost'))}${this._action('restart', this._t('restart'))}
      </div></section>`;
    }

    _action(key, label) {
      return `<button class="action-button" data-action="${key}" ${!this._state(key) ? 'disabled' : ''}><span>${this._svg(key === 'restart' ? 'gear' : 'energy')}</span>${this._escape(label)}</button>`;
    }

    _render() {
      if (!this._config || !this._hass) return;
      const status = this._displayStatus();
      const online = status.esp === 'on';
      const tab = (id, key, icon) => `<button class="tab ${this._activeTab === id ? 'active' : ''}" data-tab="${id}" aria-selected="${this._activeTab === id}"><span class="tab-icon">${this._svg(icon)}</span>${this._escape(this._t(key))}</button>`;
      const activeContent = this._activeTab === 'home' ? this._home() : this._activeTab === 'params' ? this._params() : this._activeTab === 'energy' ? this._energy() : this._settings();
      this.shadowRoot.innerHTML = `<style>${GridMonitorCard.CSS}</style><main class="shell ${status.stateClass}">
        <header class="header"><div class="logo">${this._svg('bolt')}</div><div class="brand"><h1>${this._escape(this._config.name || this._t('title'))}</h1><p>${this._escape(this._t('subtitle'))}</p></div>
          <div class="headright"><div class="connection ${online ? 'online' : status.esp === 'off' ? 'offline' : 'unknown'}"><span class="dot"></span><strong>${this._escape(online ? this._t('online') : status.esp === 'off' ? this._t('offline') : this._t('unknown'))}</strong><small>${this._escape(this._t('updated'))}: ${this._escape(this._updatedTime())}</small></div><span class="wifi-icon" title="${this._escape(this._formatted('wifi_signal', 0))}">${this._svg('wifi')}</span></div>
        </header>
        <nav class="tabs card" aria-label="${this._escape(this._t('home'))}">${tab('home', 'home', 'home')}${tab('params', 'params_tab', 'params')}${tab('energy', 'energy_tab', 'energy')}${tab('settings', 'settings_tab', 'settings')}</nav>
        <div class="view">${activeContent}</div>
        <footer class="footer"><span>ESPHome · Grid Monitor</span><span>${this._escape(this._formatted('ssid', 0))}</span></footer>
      </main>`;
      this.shadowRoot.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
        this._activeTab = button.dataset.tab;
        this._render();
        this._ensureHistory();
      }));
      this.shadowRoot.querySelectorAll('[data-period]').forEach((button) => button.addEventListener('click', () => {
        if (this._historyRange === button.dataset.period) return;
        this._historyRequest += 1;
        this._historyLoading = false;
        this._historyRange = button.dataset.period;
        this._historyKey = '';
        this._history = [];
        this._render();
        this._loadHistory();
      }));
      this.shadowRoot.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => this._call(button.dataset.action)));
      this.shadowRoot.querySelectorAll('[data-number-save]').forEach((button) => button.addEventListener('click', () => this._saveNumber(button.dataset.numberSave)));
      this.shadowRoot.querySelectorAll('[data-switch]').forEach((button) => button.addEventListener('click', () => this._toggleSwitch(button.dataset.switch)));
    }

    async _saveNumber(key) {
      const entity = this._entity(key);
      const input = this.shadowRoot.querySelector(`[data-number-input="${key}"]`);
      const value = Number(input?.value);
      const state = this._state(key);
      if (!state || !Number.isFinite(value)) return;
      const min = Number(state.attributes?.min);
      const max = Number(state.attributes?.max);
      if ((Number.isFinite(min) && value < min) || (Number.isFinite(max) && value > max)) {
        window.alert(this._t('invalid_number'));
        return;
      }
      await this._hass.callService('number', 'set_value', { entity_id: entity, value });
    }

    async _toggleSwitch(key) {
      const entity = this._entity(key);
      if (!this._state(key)) return;
      await this._hass.callService('switch', 'toggle', { entity_id: entity });
    }

    async _call(key) {
      const entity = this._entity(key);
      const state = this._state(key);
      if (!state || !this._hass || !window.confirm(`${this._t('confirm')}\n${state.attributes?.friendly_name || entity}`)) return;
      await this._hass.callService('button', 'press', { entity_id: entity });
    }

    static get CSS() {
      return `
        :host{display:block;container-type:inline-size;--bg:#07111f;--panel:#101e30;--panel2:#14243a;--line:#29415d;--muted:#9fb4d1;--text:#f3f7ff;--blue:#12aaff;--cyan:#13d5f4;--green:#35ed91;--purple:#b56aff;--amber:#ffb51b;--red:#ff526d;color:var(--text);font-family:var(--primary-font-family,Inter,Roboto,Arial,sans-serif)}
        *{box-sizing:border-box}.shell{width:100%;padding:clamp(12px,2vw,24px);background:radial-gradient(ellipse at 50% 0%,#142b48 0,#081321 55%,#050b14 100%);border:1px solid #173656;border-radius:28px;box-shadow:0 18px 55px #0008,inset 0 1px 0 #ffffff0b;overflow:hidden}
        .card{background:linear-gradient(145deg,rgba(20,36,57,.97),rgba(8,19,33,.98));border:1px solid #2a4564;border-radius:22px;box-shadow:0 10px 28px #0005,inset 0 1px 0 #ffffff0b}
        .icon{width:1em;height:1em;display:block;fill:currentColor}.header{display:flex;align-items:center;gap:18px;padding:4px 2px 18px}.logo{width:88px;height:88px;flex:none;border:1px solid #087ed0;border-radius:24px;background:linear-gradient(145deg,#073e7b,#07172d);display:grid;place-items:center;box-shadow:0 0 25px #008fff40;color:#39baff}.logo .icon{width:55px;height:55px;filter:drop-shadow(0 0 9px #00aaff)}
        .brand{min-width:0}.brand h1{font-size:clamp(23px,3.2cqw,39px);margin:0 0 3px;letter-spacing:-1px;line-height:1.1}.brand p{margin:0;color:#a9bedc;font-size:clamp(14px,1.8cqw,20px)}.headright{margin-left:auto;display:flex;align-items:center;gap:20px;color:#9eb5d5}.connection{text-align:right;white-space:nowrap}.connection strong{color:var(--green);font-size:18px}.connection.offline strong{color:var(--red)}.connection.unknown strong{color:var(--muted)}.connection small{display:block;color:#9eb5d5;margin-top:4px}.dot{display:inline-block;width:12px;height:12px;background:var(--green);border-radius:50%;margin-right:9px;box-shadow:0 0 15px var(--green)}.connection.offline .dot{background:var(--red);box-shadow:0 0 15px var(--red)}.connection.unknown .dot{background:#8194a9;box-shadow:none}.wifi-icon{font-size:30px;color:#149fff;border-left:1px solid #29415d;padding-left:20px}.wifi-icon .icon{width:32px;height:32px}
        .tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:6px;gap:5px;margin-bottom:18px;background:linear-gradient(100deg,#15263b,#1b2c44)}.tab{border:0;background:transparent;color:#a9bedc;padding:13px 8px;border-radius:17px;font:inherit;font-size:clamp(13px,1.5cqw,18px);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:11px;transition:background .18s,color .18s}.tab .tab-icon{font-size:24px;color:inherit}.tab .icon{width:25px;height:25px}.tab.active{background:linear-gradient(110deg,#078be9,#0875d5);color:white;box-shadow:0 5px 20px #008dff40}.tab:focus-visible,.period-button:focus-visible,.action-button:focus-visible,.save-button:focus-visible,.switch-button:focus-visible{outline:2px solid #8ce1ff;outline-offset:2px}
        .main-grid{display:grid;grid-template-columns:1.03fr 1fr;gap:14px}.voltage{min-height:385px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;position:relative;overflow:hidden}.voltage.alarm{border-color:#ff526d99}.voltage.inverter{border-color:#ffb51b99}.voltage-gauge{width:min(100%,490px);height:auto;overflow:visible}.voltage-value{font-size:70px;font-weight:800;letter-spacing:-2px;fill:#f7fbff}.voltage-unit{font-size:43px;letter-spacing:0}.voltage-label{font-size:25px;fill:#b3c8e4}.state-indicator{display:flex;align-items:center;gap:11px;color:var(--green);font-size:24px;font-weight:800;margin-top:-3px}.state-indicator.inverter{color:var(--amber)}.state-indicator.alarm,.state-indicator.offline{color:var(--red)}.state-indicator.unknown{color:var(--muted)}.check-mark{width:32px;height:32px;border-radius:50%;background:var(--green);color:#052116;display:grid;place-items:center;box-shadow:0 0 18px #35ed9166}.check-mark .icon{width:23px;height:23px}.state-indicator.inverter .check-mark{background:var(--amber);color:#392400}.state-indicator.alarm .check-mark,.state-indicator.offline .check-mark{background:var(--red);color:#390711}.state-indicator.unknown .check-mark{background:#53677e;color:#d6e5f6}
        .metrics{display:grid;grid-template-columns:1fr 1fr;gap:14px}.metric{min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;text-align:center}.metric-icon{font-size:48px;line-height:1.15;color:var(--blue);text-shadow:0 0 15px #009dff66}.metric-icon .icon{width:52px;height:52px}.metric.current .metric-icon{color:var(--cyan)}.metric.frequency .metric-icon{color:#08d6e7}.metric.pf .metric-icon{color:var(--purple)}.metric-value{font-size:clamp(30px,4cqw,53px);font-weight:800;letter-spacing:-1.5px;margin:4px 0;overflow-wrap:anywhere}.metric-value .unit{font-size:.62em;letter-spacing:0;white-space:nowrap}.metric-label{color:#b2c6e1;font-size:19px}
        .chart-card{margin-top:14px;padding:17px 20px 12px}.chart-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px}.chart-head h2{font-size:24px;margin:0;display:flex;align-items:center;gap:12px}.chart-icon{color:var(--blue);font-size:28px}.chart-icon .icon{width:30px;height:30px}.periods{margin-left:auto;display:flex;background:#1a2b42;border-radius:15px;padding:4px;gap:3px}.period-button{border:0;background:transparent;color:#b4c7e0;padding:8px 15px;border-radius:12px;font:inherit;font-size:15px;cursor:pointer}.period-button.active{background:#078de9;color:white;box-shadow:0 3px 12px #008fff55}.chart{width:100%;height:auto;display:block;overflow:visible}.chart-grid{fill:none;stroke:#29415c;stroke-width:1}.chart-grid text{fill:#b7c9df;stroke:none;font-size:14px}.chart-glow{fill:none;stroke:#0aaaff;stroke-width:8;opacity:.55}.chart-line{fill:none;stroke:#16b5ff;stroke-width:3.5;stroke-linejoin:round;stroke-linecap:round}.chart-dot{fill:#18baff;filter:drop-shadow(0 0 7px #18baff)}.chart-tag{fill:#0d2035;stroke:#08aaff}.chart-tag-text{fill:#fff!important;font-size:15px!important;font-weight:bold}.chart-empty{height:205px;display:grid;place-items:center;color:#91a8c3;font-size:14px;text-align:center;padding:20px}
        .bottom-status{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin-top:14px}.info{padding:17px 12px;min-height:128px;display:flex;align-items:center;justify-content:center;gap:12px;min-width:0}.info .symbol{font-size:38px;flex:none;color:var(--green);filter:drop-shadow(0 0 10px #35ed9166)}.info .symbol .icon{width:42px;height:42px}.info .symbol.blue{color:#91b8e9}.info .symbol.amber{color:var(--amber)}.info .small{color:#b6c9e2;font-size:16px}.info strong{display:block;font-size:20px;margin-top:5px;overflow-wrap:anywhere}.info .good{color:var(--green)}.info .cost-line{margin-top:3px}
        .banner{margin-top:14px;padding:18px 24px;min-height:88px;display:flex;align-items:center;gap:18px;border:1px solid #39d77e;background:linear-gradient(90deg,#0c302a,#0c2631 68%,#102b42);box-shadow:0 0 24px #28d87920}.banner.inverter{border-color:#ffb51b;background:linear-gradient(90deg,#382711,#18283a 80%);box-shadow:0 0 24px #ffb51b20}.banner.alarm,.banner.offline{border-color:#ff526d;background:linear-gradient(90deg,#3a1420,#18283a 80%);box-shadow:0 0 24px #ff526d20}.banner.unknown{border-color:#53677e;background:linear-gradient(90deg,#1a2939,#101e30)}.banner-check{width:48px;height:48px;border-radius:50%;background:var(--green);color:#052116;display:grid;place-items:center;flex:none;box-shadow:0 0 18px #35ed9166}.banner-check .icon{width:36px;height:36px}.banner.inverter .banner-check{background:var(--amber);color:#392400}.banner.alarm .banner-check,.banner.offline .banner-check{background:var(--red);color:#390711}.banner.unknown .banner-check{background:#53677e;color:#d6e5f6}.banner strong{color:#4df29a;font-size:clamp(17px,2cqw,24px)}.banner.inverter strong{color:#ffd078}.banner.alarm strong,.banner.offline strong{color:#ff8a9a}.banner.unknown strong{color:#b4c7df}.house-art{margin-left:auto;width:130px;max-width:22%;flex:none;filter:drop-shadow(0 0 11px #1b8fff)}.house-art svg{display:block;width:100%;height:auto}
        .detail-panel{padding:22px;margin-top:2px}.detail-panel h2{margin:0 0 18px;font-size:25px}.detail-panel h2.subheading{margin:24px 0 14px;font-size:19px}.detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.detail{padding:16px;border-radius:16px;background:#13243a;border:1px solid #2b4562;min-width:0}.detail>span,.detail label>span{display:block;color:#9fb5d1;font-size:14px;margin-bottom:7px}.detail b{font-size:22px;overflow-wrap:anywhere}.setting{display:flex;align-items:end;gap:10px}.setting label{flex:1;min-width:0}.setting-input{display:flex;align-items:center;gap:8px}.setting-input input{width:100%;min-width:0;background:#091727;border:1px solid #37526f;border-radius:9px;color:var(--text);padding:10px;font:inherit;font-size:18px}.setting-input small{color:#9fb5d1;white-space:nowrap}.save-button,.switch-button,.action-button{border:1px solid #278ed0;background:#092645;color:#d7efff;border-radius:10px;padding:9px 12px;font:inherit;cursor:pointer}.save-button:hover,.switch-button:hover,.action-button:hover{background:#0c3962}.save-button:disabled,.switch-button:disabled,.action-button:disabled{opacity:.45;cursor:not-allowed}.switch-setting{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.switch-setting>span{color:#9fb5d1;font-size:14px}.switch-setting>strong{font-size:16px}.switch-button{grid-column:1/-1;display:flex;align-items:center;gap:8px;justify-content:center}.switch-button .icon{width:20px;height:20px}.switch-button.on{border-color:#35ed91;color:#35ed91}.action-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.action-button{min-height:68px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;font-size:13px;border-color:#2b8ed0}.action-button span{font-size:22px;color:#45bdff}.action-button .icon{width:25px;height:25px}.footer{display:flex;justify-content:space-between;gap:10px;margin:14px 2px 0;color:#6885a2;font-size:11px}.footer span:last-child{max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        @container (max-width:760px){.shell{padding:12px}.header{gap:11px;padding:5px 2px 14px}.logo{width:58px;height:58px;border-radius:17px}.logo .icon{width:38px;height:38px}.headright{gap:8px}.connection strong{font-size:14px}.connection small{font-size:10px}.wifi-icon{font-size:21px;padding-left:10px}.wifi-icon .icon{width:24px;height:24px}.tabs{margin-bottom:12px}.tab{gap:5px;padding:12px 3px;font-size:12px}.tab .tab-icon{font-size:19px}.tab .icon{width:20px;height:20px}.main-grid{grid-template-columns:1fr;gap:10px}.voltage{min-height:300px}.voltage-gauge{width:min(100%,420px)}.metrics{gap:10px}.metric{min-height:135px}.metric-icon .icon{width:38px;height:38px}.metric-label{font-size:15px}.chart-card{padding:13px 11px}.chart-head h2{font-size:19px}.periods{width:100%;margin:0}.period-button{flex:1;padding:8px 4px;font-size:13px}.bottom-status{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.info{min-height:100px;padding:12px 8px}.info .symbol .icon{width:30px;height:30px}.info .small{font-size:13px}.info strong{font-size:16px}.banner{padding:14px;min-height:70px}.banner-check{width:38px;height:38px}.banner-check .icon{width:28px;height:28px}.house-art{width:80px}.detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.detail-panel{padding:16px}.detail-panel h2{font-size:22px}.action-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @container (max-width:420px){.headright .wifi-icon{display:none}.connection small{max-width:105px}.tab{font-size:11px}.tab .tab-icon{display:none}.metric{min-height:122px;padding:12px 8px}.metric-value{font-size:clamp(25px,8cqw,34px)}.info{gap:8px}.info .symbol .icon{width:26px;height:26px}.info .small{font-size:12px}.info strong{font-size:14px}.detail-grid{grid-template-columns:1fr}.setting{align-items:stretch}}
      `;
    }
  }

  customElements.define('grid-monitor-card', GridMonitorCard);
})();
