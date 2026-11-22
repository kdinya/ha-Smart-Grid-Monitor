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
    inverter_events: ['pzem_offline_events', 'inverter_events', 'outage_count'],
    inverter_current_duration: ['current_pzem_offline_duration', 'inverter_current_duration'],
    last_inverter_duration: ['last_pzem_offline_duration', 'last_inverter_duration', 'last_outage_s'],
    total_inverter_time: ['total_pzem_offline_time', 'total_inverter_time', 'outage_total_s'],
    wifi_signal: ['wifi_signal', 'wifi_rssi', 'rssi'],
    uptime: ['uptime', 'esp_uptime'],
    esp_temperature: ['esp_temperature', 'internal_temperature', 'temperature'],
    ip_address: ['ip_address', 'wifi_ip_address'],
    ssid: ['connected_ssid', 'wifi_ssid', 'ssid'],
    voltage_status: ['voltage_status'],
    source_status: ['power_source_status'],
    mains: ['pzem_online', 'mains_present', 'bin_mains_present', 'grid_present'],
    inverter: ['pzem_offline', 'on_inverter', 'bin_on_inverter', 'inverter_active'],
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
    power_min: ['power_min_today', 'power_min'],
    current_min: ['current_min_today', 'current_min'],
    frequency_min: ['frequency_min_today', 'frequency_min'],
    frequency_max: ['frequency_max_today', 'frequency_max'],
    pf_min: ['power_factor_min_today', 'pf_min'],
    pf_max: ['power_factor_max_today', 'pf_max'],
    reset_stats: ['reset_daily_min_max_stats', 'reset_stats'],
    restart: ['restart'],
    stats_start: ['statistics_start'],
  };

  const DEFAULTS = {
    voltage: 'sensor.grid_monitor_voltage', current: 'sensor.grid_monitor_current',
    power: 'sensor.grid_monitor_power', frequency: 'sensor.grid_monitor_frequency',
    power_factor: 'sensor.grid_monitor_power_factor', voltage_status: 'sensor.grid_monitor_voltage_status',
    source_status: 'sensor.grid_monitor_power_source_status',
    mains: 'binary_sensor.grid_monitor_pzem_online', inverter: 'binary_sensor.grid_monitor_pzem_offline',
    esp_status: 'binary_sensor.grid_monitor_esp_status', voltage_alarm: 'binary_sensor.grid_monitor_voltage_out_of_range',
    energy_total: 'sensor.grid_monitor_energy_total', energy_today: 'sensor.grid_monitor_energy_today', energy_month: 'sensor.grid_monitor_energy_month',
    cost_today: 'sensor.grid_monitor_cost_today', cost_month: 'sensor.grid_monitor_cost_month', cost_total: 'sensor.grid_monitor_cost_total',
    tariff: 'sensor.grid_monitor_current_tariff', cost_rate: 'sensor.grid_monitor_cost_rate',
    apparent_power: 'sensor.grid_monitor_apparent_power', reactive_power: 'sensor.grid_monitor_reactive_power',
    phase_angle: 'sensor.grid_monitor_phase_angle', voltage_deviation: 'sensor.grid_monitor_voltage_deviation', voltage_average: 'sensor.grid_monitor_voltage_5min_average',
    voltage_min: 'sensor.grid_monitor_voltage_min_today', voltage_max: 'sensor.grid_monitor_voltage_max_today', current_max: 'sensor.grid_monitor_current_max_today', power_peak: 'sensor.grid_monitor_power_peak_today',
    sag_count: 'sensor.grid_monitor_sag_count', swell_count: 'sensor.grid_monitor_swell_count', inverter_events: 'sensor.grid_monitor_pzem_offline_events',
    inverter_current_duration: 'sensor.grid_monitor_current_pzem_offline_duration', last_inverter_duration: 'sensor.grid_monitor_last_pzem_offline_duration', total_inverter_time: 'sensor.grid_monitor_total_pzem_offline_time',
    wifi_signal: 'sensor.grid_monitor_wifi_signal', uptime: 'sensor.grid_monitor_uptime', esp_temperature: 'sensor.grid_monitor_esp_temperature', ip_address: 'sensor.grid_monitor_ip_address', ssid: 'sensor.grid_monitor_connected_ssid',
    sag_threshold: 'number.grid_monitor_sag_threshold', swell_threshold: 'number.grid_monitor_swell_threshold', nominal_voltage: 'number.grid_monitor_nominal_voltage', tariff_day: 'number.grid_monitor_tariff_day', tariff_night: 'number.grid_monitor_tariff_night', two_zone: 'switch.grid_monitor_two_zone_tariff',
    power_min: 'sensor.grid_monitor_power_min_today', current_min: 'sensor.grid_monitor_current_min_today',
    frequency_min: 'sensor.grid_monitor_frequency_min_today', frequency_max: 'sensor.grid_monitor_frequency_max_today',
    pf_min: 'sensor.grid_monitor_power_factor_min_today', pf_max: 'sensor.grid_monitor_power_factor_max_today',
    reset_stats: 'button.grid_monitor_reset_daily_min_max_stats',
    reset_energy: 'button.grid_monitor_reset_pzem_energy', reset_events: 'button.grid_monitor_reset_event_counters', reset_cost: 'button.grid_monitor_reset_cost_counters', restart: 'button.grid_monitor_restart',
    stats_start: 'input_text.grid_monitor_statistics_start',
  };

  const SETTING_ENTITY_KEYS = new Set(['sag_threshold', 'swell_threshold', 'nominal_voltage', 'tariff_day', 'tariff_night']);
  const TIMESTAMP_ENTITY_KEYS = new Set(['voltage', 'power', 'current', 'uptime']);
  const HEARTBEAT_TIMEOUT_MS = 15000;
  const MAX_PLAUSIBLE_POWER_W = 30000;
  const LIVE_MEASUREMENT_KEYS = new Set([
    'voltage', 'current', 'power', 'frequency', 'power_factor', 'apparent_power',
    'reactive_power', 'phase_angle', 'voltage_deviation', 'voltage_average', 'cost_rate',
  ]);
  const LIVE_DISPLAY_KEYS = new Set([...LIVE_MEASUREMENT_KEYS, 'voltage_status']);
  // Мін/макс за добу, які показуються дрібним шрифтом під значенням кожної плитки.
  const METRIC_RANGE = {
    power: { min: 'power_min', max: 'power_peak', minDigits: 1, maxDigits: 0 },
    current: { min: 'current_min', max: 'current_max', digits: 2 },
    frequency: { min: 'frequency_min', max: 'frequency_max', digits: 2 },
    power_factor: { min: 'pf_min', max: 'pf_max', digits: 2 },
  };
  const METRIC_INFO = {
    power: { label: 'power', description: 'info_power' },
    current: { label: 'current', description: 'info_current' },
    frequency: { label: 'frequency', description: 'info_frequency' },
    power_factor: { label: 'pf', description: 'info_power_factor' },
    apparent_power: { label: 'apparent', description: 'info_apparent_power' },
    reactive_power: { label: 'reactive', description: 'info_reactive_power' },
    phase_angle: { label: 'phase', description: 'info_phase_angle' },
  };

  // «Мін/макс за добу» з прошивки, які від вибраного моменту рахуються з історії Home Assistant.
  const STATS_OVERRIDES = {
    voltage_min: ['voltage', 'min'], voltage_max: ['voltage', 'max'],
    current_min: ['current', 'min'], current_max: ['current', 'max'],
    power_min: ['power', 'min'], power_peak: ['power', 'max'],
    frequency_min: ['frequency', 'min'], frequency_max: ['frequency', 'max'],
    pf_min: ['power_factor', 'min'], pf_max: ['power_factor', 'max'],
  };
  const STATS_METRICS = {
    voltage: { plausible: [50, 400] },
    current: { plausible: [0, 100], positiveMin: true },
    power: { plausible: [0, MAX_PLAUSIBLE_POWER_W], positiveMin: true },
    frequency: { plausible: [40, 70] },
    power_factor: { plausible: [0, 1], positiveMin: true },
  };
  const STATS_METRIC_KEYS = Object.keys(STATS_METRICS);

  const TEXT = {
    uk: {
      title: 'Мережева напруга', subtitle: 'PZEM-004T v3.0 · Grid Monitor', online: 'Онлайн', offline: 'Офлайн', updated: 'Оновлено',
      home: 'Головна', params_tab: 'Параметри', energy_tab: 'Енергія', settings_tab: 'Налаштування',
      network: 'PZEM онлайн', inverter: 'Джерело невідоме', no_power: 'PZEM не відповідає', detecting: 'Очікування PZEM', unknown: 'Невідомо', unavailable: 'Недоступно',
      healthy: 'PZEM онлайн; якість напруги в межах порогів', quality_unknown: 'Якість напруги невідома', alarm_banner: 'Напруга поза заданим діапазоном', offline_banner: 'ESP недоступна',
      pzem_online: 'Дані PZEM доступні', pzem_offline: 'PZEM офлайн', source_unconfirmed: 'Джерело живлення не підтверджене', source_unknown: 'Джерело живлення невідоме', pzem_source_offline: 'PZEM офлайн; джерело живлення невідоме', pzem_offline_banner: 'PZEM не відповідає; джерело живлення невідоме',
      voltage: 'Напруга мережі', sag_state: 'Просідання', swell_state: 'Перенапруга', current: 'Струм', power: 'Потужність', frequency: 'Частота', pf: 'Коеф. потужності', normal: 'Норма', alarm: 'Поза нормою',
      chart_title: 'Детальний графік', energy_chart_title: 'Споживання електроенергії', cost_chart_title: 'Вартість електроенергії', energy_metric_group: 'Показати', energy_metric_energy: 'Енергія', energy_metric_cost: 'Вартість', energy_selected_interval: 'Вибраний інтервал', chart_period: 'Період графіків', since: 'Період', stats_title: 'Статистика', stats_start_label: 'Початок статистики',
      stats_hint: 'Оберіть дату й час: графіки та мінімум/максимум рахуватимуться від цього моменту. Без значення діють добові дані.', stats_shared_hint: 'Для синхронізації між пристроями потрібен helper input_text.grid_monitor_statistics_start.', stats_sync_saved: 'Збережено в Home Assistant; налаштування синхронізується між пристроями.', stats_sync_missing: 'Helper не знайдено: значення діє лише до перезавантаження. Створіть його кнопкою нижче або ввімкніть пакет.',
      stats_create_helper: 'Створити helper', stats_create_helper_confirm: 'Створити input_text.grid_monitor_statistics_start у Home Assistant? Потрібні права адміністратора. Після створення виберіть дату початку й натисніть «Застосувати».', stats_helper_created: 'Helper створено. Тепер виберіть дату початку статистики й натисніть «Застосувати», щоб зберегти її в Home Assistant.', stats_helper_error: 'Не вдалося створити helper. Переконайтеся, що ви ввійшли як адміністратор. Або створіть Text helper вручну в Settings → Devices & services → Helpers.',
      stats_active: 'Графіки та мін/макс рахуються від', stats_apply: 'Застосувати', stats_clear: 'Скинути', chart_date_error_earlier: 'Дата не може бути раніше виставленого початку статистики',
      history_cleanup_title: 'Історія та статистика Home Assistant', history_cleanup_hint: 'Перед видаленням створіть резервну копію. Кнопки нижче очищують лише сутності, пов’язані з цією карткою, а не всю базу Recorder.',
      history_purge_button: 'Видалити історію Recorder', history_stats_button: 'Видалити статистику HA', actions_show: 'Показати дії', actions_hide: 'Сховати дії', actions_open: 'Відкрити', actions_warning_title: 'Увага: небезпечні дії', actions_warning: 'У розділі «Дії» є скидання лічильників і подій, перезавантаження пристрою та видалення історії й статистики Home Assistant для сенсорів цієї картки. Видалені дані без резервної копії відновити неможливо, а скинуті лічильники починаються з нуля. Відкрити розділ?',
      history_purge_confirm: 'Буде видалено всю збережену історію станів Recorder для {count} сутностей цієї картки. Цю дію не можна скасувати без резервної копії. Продовжити?',
      history_stats_confirm: 'Буде видалено короткострокову й довготривалу статистику Home Assistant для {count} сенсорів цієї картки. Цю дію не можна скасувати без резервної копії. Продовжити?',
      history_purge_done: 'Запит на очищення історії Recorder для {count} сутностей виконано.', history_stats_done: 'Статистику Home Assistant для {count} сенсорів видалено.',
      history_delete_error: 'Не вдалося видалити дані. Переконайтеся, що ви ввійшли як адміністратор, Recorder доступний і резервну копію створено.', history_delete_empty: 'Не знайдено сутностей цієї картки, для яких можна видалити дані.',
      stats_error: 'Вкажіть коректні дату й час у минулому.', stats_note: 'Мін/макс від', power_range_period: 'Діапазон потужності за період', max_current_period: 'Максимальний струм за період', peak_power_period: 'Пікова потужність за період', stat_min: 'Мін.', stat_avg: 'Сер.', stat_max: 'Макс.', hour: 'Год', day: 'День', week: 'Тиждень', month: 'Місяць', loading: 'Завантаження історії…', no_history: 'Історія поки недоступна',
      chart_select_time: 'Перетягуйте графік; двома пальцями масштабуйте, повзунком вибирайте час', chart_date_range: 'Вибрати період', chart_from: 'Від', chart_to: 'До', chart_apply: 'Показати', chart_calendar_previous: 'Попередній місяць', chart_calendar_next: 'Наступний місяць', chart_date_error: 'Перевірте дати: кінець має бути пізніше початку й не в майбутньому', chart_zoom_in: 'Збільшити масштаб', chart_zoom_out: 'Зменшити масштаб', chart_readings: 'Дані на вибраний час', chart_readings_loading: 'Завантаження вимірювань…', chart_readings_unavailable: 'Історія вимірювань недоступна', chart_live: 'Зараз', active_power: 'Активна потужність',
      mains: 'Зв’язок з PZEM', has_voltage: 'Дані доступні', no_voltage: 'Дані недоступні', source: 'Живлення ESP', from_mains: 'Мережа (не підтверджено)', from_inverter: 'Джерело невідоме', pzem_link: 'Зв’язок з PZEM', active: 'Онлайн', inactive: 'Офлайн', today_consumption: 'Споживання сьогодні',
      esp_power_connection: 'Схема живлення ESP', esp_power_shared: 'Від мережі разом із модулем', esp_power_after_avr: 'Після АВР', esp_power_independent: 'Незалежне живлення', esp_power_avr_note: 'ESP може живитися від інвертора', pzem_grid_note: 'PZEM вимірює мережу в усіх режимах',
      params_title: 'Електричні параметри', range_title: 'Діапазон напруги на графіку', range_now: 'Зараз', energy_title: 'Енергія та вартість', settings_title: 'Налаштування та діагностика',
      apparent: 'Повна потужність', reactive: 'Реактивна потужність', phase: 'Кут фази', deviation: 'Відхилення напруги', average: 'Середня напруга за 5 хв', min_voltage: 'Мін. на графіку', max_voltage: 'Макс. на графіку', max_current: 'Максимальний струм сьогодні', peak_power: 'Пікова потужність сьогодні', voltage_state: 'Статус напруги',
      today: 'Сьогодні', energy_month: 'Споживання за місяць', energy_total: 'Загальна енергія PZEM', cost_today: 'Вартість сьогодні', cost_month: 'Вартість за місяць', cost_total: 'Загальна розрахована вартість', tariff: 'Поточний тариф', cost_rate: 'Вартість за годину', two_zone: 'Двозонний облік',
      estimated_cost: 'Орієнтовна вартість', current_load: 'Поточне навантаження', night: 'Ніч', device_name: 'Grid Monitor · ESP32-C3', device_description: 'Контролер ESPHome · PZEM-004T', diagnostics: 'Діагностика',
      sag: 'Поріг просідання', swell: 'Поріг перенапруги', nominal: 'Номінальна напруга', tariff_day: 'Денний тариф', tariff_night: 'Нічний тариф', wifi: 'Сигнал Wi‑Fi', temperature: 'Температура ESP32', uptime: 'Час роботи ESP32', ip: 'IP-адреса', ssid: 'Wi‑Fi мережа',
      events: 'Переривання зв’язку з PZEM', inverter_events: 'Кількість переривань PZEM', current_duration: 'Поточний час без PZEM', last_duration: 'Остання тривалість без PZEM', total_duration: 'Загальний час без PZEM', sag_events: 'Просідання напруги', swell_events: 'Перенапруги', save: 'Зберегти', on: 'Увімкнено', off: 'Вимкнено',
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
      editor_currency: 'Валюта відображення (без перерахунку)',
      editor_currency_hint: 'Змінюється лише позначення. Числа не перераховуються; тарифні сутності в Home Assistant залишаються в UAH.',
      editor_currency_uah: 'UAH · грн',
      editor_currency_eur: 'EUR',
      editor_currency_usd: 'USD',
      editor_power_mode: 'Схема живлення ESP',
      editor_power_mode_hint: 'PZEM підключений до мережі в усіх режимах.',
      editor_power_grid_shared: 'Від мережі разом із модулем',
      editor_power_after_avr: 'Після АВР',
      editor_power_independent: 'Незалежне живлення',
      editor_performance: 'Режим економії',
      editor_performance_hint: 'Для слабких планшетів: вимикає постійні анімації, розмиття фону та ефекти світіння. Менше навантаження на процесор і батарею.',
      editor_entities_detected: 'сенсорів знайдено',
      editor_custom_entities: 'Точне налаштування окремих сенсорів',
      editor_custom_prefix: 'Вказати інший префікс вручну...',
      actions: 'Дії', reset_energy: 'Скинути енергію PZEM', reset_events: 'Скинути події', reset_cost: 'Скинути облік', reset_stats: 'Скинути мін/макс за день', power_range_title: 'Діапазон потужності сьогодні', restart: 'Перезапустити ESP', confirm: 'Виконати цю дію?', invalid_number: 'Введіть коректне число в допустимому діапазоні.',
      dialog_confirm_title: 'Підтвердьте дію', dialog_error_title: 'Перевірте значення', dialog_confirm: 'Виконати', dialog_cancel: 'Скасувати', dialog_close: 'Зрозуміло',
      energy_unit_unsupported: 'Одиниця енергії не підтримується. Графік підтримує Wh, kWh і MWh.',
      energy_max_hour: 'Макс. за годину', energy_max_day: 'Макс. за день',
      metric_info_button: 'Пояснення показника',
      info_power: 'Активна потужність, яку вимірює прилад. Вказує на потужність, що передається навантаженню; одиниця — ват (Вт).',
      info_current: 'Сила електричного струму у вимірюваній лінії. Одиниця — ампер (А).',
      info_frequency: 'Частота змінної напруги мережі. Вимірюється в герцах (Гц); номінальне значення для мережі України — 50 Гц.',
      info_power_factor: 'Коефіцієнт потужності — відношення активної потужності до повної. Це безрозмірний показник: значення, ближче до 1, означає ефективніше використання потужності мережі.',
      info_apparent_power: 'Повна потужність показує загальне електричне навантаження, обчислене за діючими значеннями напруги й струму. Одиниця — вольт-ампер (ВА).',
      info_reactive_power: 'Реактивна потужність описує обмін енергією між мережею та індуктивними або ємнісними навантаженнями. Вимірюється у варах (вар) і створює додаткове навантаження на мережу.',
      info_phase_angle: 'Кут зсуву фаз між напругою та струмом, у градусах (°). Він пов’язаний із коефіцієнтом потужності; сам по собі не є значенням потужності чи енергії.',
      scroll_to_top: 'На початок сторінки',
    },
    en: {
      title: 'Grid voltage', subtitle: 'PZEM-004T v3.0 · Grid Monitor', online: 'Online', offline: 'Offline', updated: 'Updated',
      home: 'Home', params_tab: 'Parameters', energy_tab: 'Energy', settings_tab: 'Settings',
      network: 'PZEM online', inverter: 'Source unknown', no_power: 'PZEM is not responding', detecting: 'Waiting for PZEM', unknown: 'Unknown', unavailable: 'Unavailable',
      healthy: 'PZEM online; voltage is within configured thresholds', quality_unknown: 'Voltage quality is unknown', alarm_banner: 'Voltage is outside the configured range', offline_banner: 'ESP is offline',
      pzem_online: 'PZEM data available', pzem_offline: 'PZEM offline', source_unconfirmed: 'Power source is not confirmed', source_unknown: 'Power source unknown', pzem_source_offline: 'PZEM offline; power source unknown', pzem_offline_banner: 'PZEM is not responding; power source is unknown',
      voltage: 'Grid voltage', sag_state: 'Sag', swell_state: 'Swell', current: 'Current', power: 'Power', frequency: 'Frequency', pf: 'Power factor', normal: 'Normal', alarm: 'Out of range',
      chart_title: 'Detailed chart', energy_chart_title: 'Electricity consumption', cost_chart_title: 'Electricity cost', energy_metric_group: 'Show', energy_metric_energy: 'Energy', energy_metric_cost: 'Cost', energy_selected_interval: 'Selected interval', chart_period: 'Chart period', since: 'Period', stats_title: 'Statistics', stats_start_label: 'Statistics start',
      stats_hint: 'Pick a date and time: charts and min/max will be calculated from that moment. Empty means daily values.', stats_shared_hint: 'To sync this setting across devices, the input_text.grid_monitor_statistics_start helper is required.', stats_sync_saved: 'Saved in Home Assistant; this setting syncs across devices.', stats_sync_missing: 'Helper not found: this setting lasts only until reload. Create it with the button below or enable the package.',
      stats_create_helper: 'Create helper', stats_create_helper_confirm: 'Create input_text.grid_monitor_statistics_start in Home Assistant? Administrator permissions are required. After creation, select the statistics start date and press Apply.', stats_helper_created: 'The helper was created. Select a statistics start date and press Apply to save it in Home Assistant.', stats_helper_error: 'Could not create the helper. Make sure you are signed in as a Home Assistant administrator, or create a Text helper manually under Settings → Devices & services → Helpers.',
      stats_active: 'Charts and min/max are calculated from', stats_apply: 'Apply', stats_clear: 'Reset', chart_date_error_earlier: 'Date cannot be earlier than the statistics start time',
      history_cleanup_title: 'Home Assistant history and statistics', history_cleanup_hint: 'Create a backup before deleting data. These buttons target only entities referenced by this card, not the entire Recorder database.',
      history_purge_button: 'Delete Recorder history', history_stats_button: 'Delete HA statistics', actions_show: 'Show actions', actions_hide: 'Hide actions', actions_open: 'Open', actions_warning_title: 'Warning: risky actions', actions_warning: 'The Actions section can reset counters and events, restart the device, and delete Home Assistant history and statistics for this card\'s sensors. Deleted data cannot be restored without a backup, and reset counters start from zero. Open the section?',
      history_purge_confirm: 'All saved Recorder state history for {count} entities used by this card will be deleted. This cannot be undone without a backup. Continue?',
      history_stats_confirm: 'Home Assistant short-term and long-term statistics for {count} sensors used by this card will be deleted. This cannot be undone without a backup. Continue?',
      history_purge_done: 'Recorder history cleanup was requested for {count} entities.', history_stats_done: 'Home Assistant statistics were deleted for {count} sensors.',
      history_delete_error: 'Could not delete the data. Make sure you are signed in as an administrator, Recorder is available, and a backup exists.', history_delete_empty: 'No entities used by this card were found to clean up.',
      stats_error: 'Enter a valid date and time in the past.', stats_note: 'Min/max since', power_range_period: 'Power range for the period', max_current_period: 'Peak current for the period', peak_power_period: 'Peak power for the period', stat_min: 'Min', stat_avg: 'Avg', stat_max: 'Max', hour: 'Hour', day: 'Day', week: 'Week', month: 'Month', loading: 'Loading history…', no_history: 'History is not available yet',
      chart_select_time: 'Drag the chart to pan; pinch to zoom, or use the slider to select a time', chart_date_range: 'Select period', chart_from: 'From', chart_to: 'To', chart_apply: 'Show', chart_calendar_previous: 'Previous month', chart_calendar_next: 'Next month', chart_date_error: 'Check dates: the end must be after the start and not in the future', chart_zoom_in: 'Zoom in', chart_zoom_out: 'Zoom out', chart_readings: 'Readings at selected time', chart_readings_loading: 'Loading readings…', chart_readings_unavailable: 'Measurement history is unavailable', chart_live: 'Now', active_power: 'Active power',
      mains: 'PZEM connection', has_voltage: 'Data available', no_voltage: 'Data unavailable', source: 'ESP power source', from_mains: 'Mains (not confirmed)', from_inverter: 'Source unknown', pzem_link: 'PZEM connection', active: 'Online', inactive: 'Offline', today_consumption: 'Consumption today',
      esp_power_connection: 'ESP power arrangement', esp_power_shared: 'Mains shared with the module', esp_power_after_avr: 'After AVR', esp_power_independent: 'Independent power', esp_power_avr_note: 'ESP may be powered by the inverter', pzem_grid_note: 'PZEM measures mains in every mode',
      params_title: 'Electrical parameters', range_title: 'Voltage range on chart', range_now: 'Now', energy_title: 'Energy and cost', settings_title: 'Settings and diagnostics',
      apparent: 'Apparent power', reactive: 'Reactive power', phase: 'Phase angle', deviation: 'Voltage deviation', average: '5-minute average voltage', min_voltage: 'Chart minimum', max_voltage: 'Chart maximum', max_current: 'Maximum current today', peak_power: 'Peak power today', voltage_state: 'Voltage status',
      today: 'Today', energy_month: 'Consumption this month', energy_total: 'Total PZEM energy', cost_today: 'Cost today', cost_month: 'Cost this month', cost_total: 'Total calculated cost', tariff: 'Current tariff', cost_rate: 'Cost per hour', two_zone: 'Two-zone tariff',
      estimated_cost: 'Estimated cost', current_load: 'Current load', night: 'Night', device_name: 'Grid Monitor · ESP32-C3', device_description: 'ESPHome controller · PZEM-004T', diagnostics: 'Diagnostics',
      sag: 'Sag threshold', swell: 'Swell threshold', nominal: 'Nominal voltage', tariff_day: 'Day tariff', tariff_night: 'Night tariff', wifi: 'Wi-Fi signal', temperature: 'ESP32 temperature', uptime: 'ESP32 uptime', ip: 'IP address', ssid: 'Wi-Fi network',
      events: 'PZEM communication outages', inverter_events: 'PZEM outage count', current_duration: 'Current time without PZEM', last_duration: 'Last PZEM outage duration', total_duration: 'Total time without PZEM', sag_events: 'Voltage sags', swell_events: 'Voltage swells', save: 'Save', on: 'On', off: 'Off',
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
      editor_currency: 'Display currency (no conversion)',
      editor_currency_hint: 'Only the label changes; numbers are not converted. Home Assistant tariff entities remain in UAH.',
      editor_currency_uah: 'UAH · грн',
      editor_currency_eur: 'EUR',
      editor_currency_usd: 'USD',
      editor_power_mode: 'ESP power arrangement',
      editor_power_mode_hint: 'PZEM remains connected to the mains in every mode.',
      editor_power_grid_shared: 'Mains shared with the module',
      editor_power_after_avr: 'After AVR',
      editor_power_independent: 'Independent power',
      editor_performance: 'Power-saving mode',
      editor_performance_hint: 'For low-end tablets: turns off continuous animations, background blur and glow effects to reduce CPU and battery use.',
      editor_entities_detected: 'sensors detected',
      editor_custom_entities: 'Fine-tune Individual Entities',
      editor_custom_prefix: 'Enter custom prefix manually...',
      actions: 'Actions', reset_energy: 'Reset PZEM energy', reset_events: 'Reset events', reset_cost: 'Reset accounting', reset_stats: 'Reset daily min/max', power_range_title: 'Power range today', restart: 'Restart ESP', confirm: 'Run this action?', invalid_number: 'Enter a valid number within the allowed range.',
      dialog_confirm_title: 'Confirm action', dialog_error_title: 'Check the value', dialog_confirm: 'Continue', dialog_cancel: 'Cancel', dialog_close: 'Got it',
      energy_unit_unsupported: 'Energy unit is unsupported. The chart supports Wh, kWh, and MWh.',
      energy_max_hour: 'Max per hour', energy_max_day: 'Max per day',
      metric_info_button: 'Explain this metric',
      info_power: 'Active power measured by the meter. It indicates the power transferred to the load; measured in watts (W).',
      info_current: 'Electric current flowing through the measured line; measured in amperes (A).',
      info_frequency: 'Frequency of the AC mains voltage, measured in hertz (Hz). The nominal mains frequency in Ukraine is 50 Hz.',
      info_power_factor: 'Power factor is the ratio of active power to apparent power. It is dimensionless; a value closer to 1 means the mains capacity is being used more effectively.',
      info_apparent_power: 'Apparent power represents the total electrical load, calculated from the RMS voltage and current. Measured in volt-amperes (VA).',
      info_reactive_power: 'Reactive power describes energy exchanged between the mains and inductive or capacitive loads. Measured in vars (var), it still adds load to the electrical system.',
      info_phase_angle: 'The phase shift between voltage and current, measured in degrees (°). It is related to power factor; by itself it is not a power or energy value.',
      scroll_to_top: 'Back to top',
    },
  };

  const RANGES = { hour: 1 };
  const CHART_METRICS = {
    power: { digits: 0, plausible: [0, MAX_PLAUSIBLE_POWER_W], unit: (lang) => (lang === 'uk' ? 'Вт' : 'W') },
    voltage: { digits: 1, plausible: [50, 400], unit: (lang) => (lang === 'uk' ? 'В' : 'V') },
    energy_total: { digits: 3, plausible: [0, 1e7], unit: () => 'kWh' },
    cost_total: { digits: 2, plausible: [0, 1e9], unit: (lang, currency = 'UAH') => (currency === 'UAH' && lang === 'uk' ? 'грн' : currency) },
  };
  const CHART_READINGS = [
    { key: 'current', label: 'current', digits: 2, plausible: [0, 100] },
    { key: 'power', label: 'active_power', digits: 1, plausible: [0, MAX_PLAUSIBLE_POWER_W] },
    { key: 'apparent_power', label: 'apparent', digits: 1, plausible: [0, MAX_PLAUSIBLE_POWER_W] },
    { key: 'phase_angle', label: 'phase', digits: 1, plausible: [0, 180] },
    { key: 'reactive_power', label: 'reactive', digits: 1, plausible: [0, MAX_PLAUSIBLE_POWER_W] },
    { key: 'power_factor', label: 'pf', digits: 2, plausible: [0, 1] },
  ];
  // One shared geometry keeps the arc, ticks, tower and marker concentric.
  const GAUGE = { cx: 250, cy: 205, r: 185, start: 150, span: 240, min: 150, max: 280 };
  const gaugePoint = (degrees, radius = GAUGE.r) => {
    const angle = degrees * Math.PI / 180;
    return [GAUGE.cx + radius * Math.cos(angle), GAUGE.cy + radius * Math.sin(angle)];
  };
  const gaugeArcPath = (radius = GAUGE.r) => {
    const [x1, y1] = gaugePoint(GAUGE.start, radius);
    const [x2, y2] = gaugePoint(GAUGE.start + GAUGE.span, radius);
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}A${radius} ${radius} 0 1 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const gaugeProgress = (voltage) => (voltage === null ? 0 : Math.max(0, Math.min(100, ((voltage - GAUGE.min) / (GAUGE.max - GAUGE.min)) * 100)));
  const gaugeMarker = (progress) => gaugePoint(GAUGE.start + (progress / 100) * GAUGE.span);
  const HOUSE_IMAGE = 'data:image/webp;base64,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';
  const HOUSE_FX = '<svg class="house-fx" viewBox="0 0 1498 1014" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><filter id="hsBlur"><feGaussianBlur stdDeviation="5"/></filter><clipPath id="hsGlass"><path d="M574 411 L653 344 L653 467 L574 467 Z M663 344 L764 411 L764 467 L663 467 Z M578 552 L628 552 L628 718 L578 718 Z M640 552 L723 552 L723 718 L640 718 Z M735 552 L777 552 L777 718 L735 718 Z M789 552 L818 552 L818 718 L789 718 Z M1019 551 L1126 551 L1126 677 L1019 677 Z"/></clipPath><linearGradient id="hsGlassNight" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#1a2c40"/><stop offset=".55" stop-color="#0a1626"/><stop offset="1" stop-color="#040910"/></linearGradient><linearGradient id="hsGlint" x1="0" y1="0" x2="1" y2="1"><stop offset=".15" stop-color="#9ccfff" stop-opacity=".0"/><stop offset=".32" stop-color="#9ccfff" stop-opacity=".2"/><stop offset=".5" stop-color="#9ccfff" stop-opacity=".0"/><stop offset=".72" stop-color="#9ccfff" stop-opacity=".1"/><stop offset=".9" stop-color="#9ccfff" stop-opacity=".0"/></linearGradient><radialGradient id="hsFade"><stop stop-color="#06111f" stop-opacity=".97"/><stop offset=".5" stop-color="#08172a" stop-opacity=".7"/><stop offset="1" stop-color="#08172a" stop-opacity="0"/></radialGradient><radialGradient id="hsSpill"><stop stop-color="#06111f" stop-opacity=".62"/><stop offset=".6" stop-color="#08172a" stop-opacity=".3"/><stop offset="1" stop-color="#08172a" stop-opacity="0"/></radialGradient></defs><g class="house-street-off"><ellipse cx="433" cy="354" rx="46" ry="50" fill="url(#hsFade)"/><ellipse cx="433" cy="354" rx="13" ry="13" fill="#263344"/><ellipse cx="529" cy="578" rx="38" ry="45" fill="url(#hsFade)"/><ellipse cx="850" cy="578" rx="38" ry="45" fill="url(#hsFade)"/><ellipse cx="1168" cy="585" rx="38" ry="45" fill="url(#hsFade)"/><ellipse cx="340" cy="755" rx="46" ry="58" fill="url(#hsFade)"/><ellipse cx="438" cy="782" rx="54" ry="64" fill="url(#hsFade)"/><ellipse cx="692" cy="780" rx="54" ry="64" fill="url(#hsFade)"/><ellipse cx="978" cy="796" rx="56" ry="67" fill="url(#hsFade)"/></g><g class="house-room-off"><ellipse cx="700" cy="640" rx="190" ry="140" fill="url(#hsSpill)"/><ellipse cx="1072" cy="614" rx="100" ry="85" fill="url(#hsSpill)"/><ellipse cx="710" cy="415" rx="120" ry="80" fill="url(#hsSpill)"/><ellipse cx="760" cy="760" rx="170" ry="40" fill="url(#hsSpill)"/></g><g clip-path="url(#hsGlass)" class="house-glass-off"><rect x="550" y="320" width="600" height="420" fill="url(#hsGlassNight)"/><rect x="550" y="320" width="600" height="420" fill="url(#hsGlint)"/></g><path class="house-smoke" d="M866 211 C830 176 900 153 868 119 C847 96 875 73 888 43"/><path class="house-smoke two" d="M891 210 C925 176 878 153 908 120 C927 98 909 79 902 62"/><g class="house-canopy" fill="#a5f58b" opacity=".42"><ellipse cx="260" cy="485" rx="28" ry="10"/><ellipse cx="344" cy="510" rx="23" ry="8"/><ellipse cx="210" cy="570" rx="20" ry="8"/></g><g class="house-canopy right" fill="#a5f58b" opacity=".42"><ellipse cx="1254" cy="530" rx="25" ry="9"/><ellipse cx="1290" cy="600" rx="19" ry="7"/></g></svg>';
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
    settings: '<path d="M21.2 8.2 L20.4 3.3 L27.6 3.3 L26.8 8.2 L33.2 10.9 L36 6.8 L41.2 12 L37.1 14.8 L39.8 21.2 L44.7 20.4 L44.7 27.6 L39.8 26.8 L37.1 33.2 L41.2 36 L36 41.2 L33.2 37.1 L26.8 39.8 L27.6 44.7 L20.4 44.7 L21.2 39.8 L14.8 37.1 L12 41.2 L6.8 36 L10.9 33.2 L8.2 26.8 L3.3 27.6 L3.3 20.4 L8.2 21.2 L10.9 14.8 L6.8 12 L12 6.8 L14.8 10.9Z M24 17a7 7 0 1 0 0 14 7 7 0 1 0 0-14Z" fill="currentColor" fill-rule="evenodd"/>',
    wifi: '<path d="M5 17a29 29 0 0 1 38 0M11 24a20 20 0 0 1 26 0m-20 7a10 10 0 0 1 14 0m-7 8h.1" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    coin: '<path d="M24 5c-10 0-17 3-17 7s7 7 17 7 17-3 17-7-7-7-17-7Zm-17 7v8c0 4 7 7 17 7s17-3 17-7v-8m-34 8v8c0 4 7 7 17 7s17-3 17-7v-8m-34 8v8c0 4 7 7 17 7s17-3 17-7v-8" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>',
    check: '<path d="m11 25 9 9 18-20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
    gear: '<path d="M24 7v5m0 24v5M7 24h5m24 0h5M12 12l4 4m16 16 4 4m0-24-4 4m-16 16-4 4" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="24" r="12" fill="none" stroke="currentColor" stroke-width="4"/>',
    plug: '<path d="M17 7v12m14-12v12M12 19h24v3a12 12 0 0 1-12 12v8m0-8a12 12 0 0 1-12-12z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    arrow_up: '<path d="M24 7 9 22l3.2 3.2L21.7 16v25h4.6V16l9.5 9.2L39 22z" fill="currentColor"/>',
    arrow_down: '<path d="M24 41 9 26l3.2-3.2L21.7 32V7h4.6v25l9.5-9.2L39 26z" fill="currentColor"/>',
    angle: '<path d="M8 38h32M8 38 30 12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M21 38a13 13 0 0 1-3-9" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>',
    deviation: '<path d="M24 6v18M15 15h18M14 36h20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    average: '<path d="M5 24h38" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 5"/><path d="M5 30c5-18 9-18 14 0s9 18 14 0l5-8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    peak: '<path d="M4 40 15 21l8 9 10-22 11 32" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    clock: '<circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="4"/><path d="M24 14v10l7 5" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    alert: '<path d="M24 6 4 40h40z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M24 19v10M24 35h.1" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    sag: '<path d="M5 12l14 14 8-8 14 14" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M31 34h10V24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    swell: '<path d="M5 36l14-14 8 8 14-14" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M31 14h10v10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    calendar: '<rect x="6" y="9" width="36" height="32" rx="5" fill="none" stroke="currentColor" stroke-width="4"/><path d="M6 20h36M15 5v8M33 5v8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
    sum: '<path d="M37 9H12l13 15-13 15h25" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    tag: '<path d="M6 8h18l18 18-16 16L8 26z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><circle cx="16" cy="17" r="2.6" fill="currentColor"/>',
    gauge: '<path d="M6 36a18 18 0 1 1 36 0" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M24 36l9-12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  };

  const DETAIL_ICON_SHIFT = { frequency: [0, -3], deviation: [0, 3], average: [0, -6], gauge: [0, -3], sag: [1, 1], swell: [1, -1], alert: [0, 1], calendar: [0, 1], angle: [0, -1], tag: [0, -1] };

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
      setValue('#sel_currency', ['UAH', 'EUR', 'USD'].includes(this._config.currency) ? this._config.currency : 'UAH');
      setValue('#sel_power_mode', this._config.esp_power_mode || 'after_avr');
      const performance = this.shadowRoot.querySelector('#chk_performance');
      if (performance && performance !== active) performance.checked = this._config.performance === true;
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
        '_energy_total', '_pzem_online', '_pzem_offline', '_power_source_status', '_mains_present', '_on_inverter', '_esp_status',
        '_voltage_out_of_range', '_pzem_offline_events', '_sag_threshold', '_tariff_day'
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
      const currency = ['UAH', 'EUR', 'USD'].includes(this._config.currency) ? this._config.currency : 'UAH';
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
          .field label.check {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0;
            color: #e6f1ff;
            cursor: pointer;
          }
          .field .check input {
            width: 18px;
            height: 18px;
            padding: 0;
            margin: 0;
            flex: none;
            accent-color: #12b5ff;
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
          <label>${this._t('editor_currency')}</label>
          <select id="sel_currency">
            <option value="UAH" ${currency === 'UAH' ? 'selected' : ''}>${this._t('editor_currency_uah')}</option>
            <option value="EUR" ${currency === 'EUR' ? 'selected' : ''}>${this._t('editor_currency_eur')}</option>
            <option value="USD" ${currency === 'USD' ? 'selected' : ''}>${this._t('editor_currency_usd')}</option>
          </select>
          <div class="hint">${this._t('editor_currency_hint')}</div>
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

        <div class="field">
          <label class="check"><input type="checkbox" id="chk_performance" ${this._config.performance === true ? 'checked' : ''}><span>${this._t('editor_performance')}</span></label>
          <div class="hint">${this._t('editor_performance_hint')}</div>
        </div>

        <details>
          <summary>${this._t('editor_custom_entities')}</summary>
          <div class="custom-grid">
            ${['voltage', 'current', 'power', 'frequency', 'power_factor', 'energy_today', 'cost_today', 'mains', 'inverter'].map((k) => `
              <div class="field" style="margin-bottom:8px">
                <label style="font-size:0.75rem">${this._escape(k === 'mains' ? this._t('pzem_link') : k === 'inverter' ? this._t('pzem_offline') : k)}</label>
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

      root.getElementById('sel_currency').addEventListener('change', (e) => {
        this._config.currency = e.target.value;
        this._fireChanged();
      });

      root.getElementById('sel_power_mode').addEventListener('change', (e) => {
        this._config.esp_power_mode = e.target.value;
        this._fireChanged();
      });

      root.getElementById('chk_performance').addEventListener('change', (e) => {
        if (e.target.checked) this._config.performance = true;
        else delete this._config.performance;
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


  const DEFAULT_KEYS = Object.keys(DEFAULTS);
  const STATS_REFRESH_OVERLAP_MS = 120e3;

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
      this._energyHistoryRange = 'day';
      this._energyChartMetric = 'energy_total';
      this._energySelectedBar = null;
      this._energyCustomRange = null;
      this._energyReturnRange = 'day';
      this._chartCalendarState = null;
      this._energyHistory = { energy_total: [], cost_total: [] };
      this._energyHistoryKeys = { energy_total: '', cost_total: '' };
      this._energyHistoryAt = { energy_total: 0, cost_total: 0 };
      this._energyHistoryLoading = { energy_total: false, cost_total: false };
      this._energyHistoryRequests = { energy_total: 0, cost_total: 0 };
      this._statsStart = null;
      this._statsStartApplied = false;
      this._statsNeedsPersist = false;
      this._actionsOpen = false;
      this._statsExtremes = null;
      this._statsExtremesKey = '';
      this._statsExtremesAt = 0;
      this._statsExtremesLoading = false;
      this._statsExtremesToken = '';
      this._statsExtremesRequest = 0;
      this._statsExtremesCursor = NaN;
      this._inView = true;
      this._intersectionObserver = null;
      this._visibilityHandler = null;
      this._hassDirty = false;
      this._appliedHass = null;
      this._entityPlanCache = null;
      this._historyCustomRange = null;
      this._historyReturnRange = 'hour';
      this._chartPointers = new Map();
      this._chartPan = null;
      this._chartTouchScrubbing = null;
      this._chartMetric = 'power';
      this._history = [];
      this._historyKey = '';
      this._historyAt = 0;
      this._historyLoading = false;
      this._historyError = false;
      this._historyRequest = 0;
      this._voltageHistory = [];
      this._voltageHistoryKey = '';
      this._voltageHistoryAt = 0;
      this._voltageHistoryLoading = false;
      this._voltageHistoryRequest = 0;
      this._stateSnapshot = null;
      this._renderedLanguage = null;
      this._pendingChangedKeys = new Set();
      this._updateScheduled = false;
      this._dialogResolver = null;
      this._renderPending = false;
      this._scrollListenersAttached = false;
      this._chartDateDocumentListenersAttached = false;
      this._chartDateDocumentPointerDownHandler = (event) => this._handleChartDateDocumentPointerDown(event);
      this._scrollVisibilityHandler = () => {
        this._updateScrollTopVisibility();
        this._handleChartDateDocumentScroll();
      };
      this._chartW = 0;
      this._chartPts = [];
      this._scrubTime = null;
      this._chartReadings = {};
      this._chartReadingsAt = null;
      this._chartReadingsLoading = false;
      this._chartReadingsError = false;
      this._chartReadingsRequest = 0;
      this._chartReadingsRequestTime = null;
      this._chartReadingsQueuedTime = null;
      this._chartReadingsPendingTime = null;
      this._chartReadingsTimer = null;
      this._measureQueued = false;
      this._heartbeatTimer = null;
      this.shadowRoot.addEventListener('click', (event) => this._handleCardClick(event));
      this.shadowRoot.addEventListener('keydown', (event) => this._handleCardKeydown(event));
      this.shadowRoot.addEventListener('toggle', (event) => {
        const panel = event.target;
        if (!panel?.matches?.('.chart-date-range-panel')) return;
        let isOpen = false;
        try { isOpen = panel.matches(':popover-open'); } catch (_error) { isOpen = !panel.hidden; }
        const trigger = this.shadowRoot.querySelector(`[aria-controls="${panel.id}"]`);
        if (trigger) trigger.setAttribute('aria-expanded', String(isOpen));
        if (!isOpen) {
          panel.hidden = true;
          this._closeChartCalendar(panel.dataset.rangeScope);
        }
      }, true);
      this.shadowRoot.addEventListener('pointerdown', (event) => this._handleChartDatePointerDown(event), true);
      this.shadowRoot.addEventListener('pointerdown', (event) => this._chartPointerDown(event));
      this.shadowRoot.addEventListener('pointermove', (event) => {
        if (this._chartPan) { this._chartPointerMove(event); return; }
        if (this._chartTouchScrubbing === event.pointerId) {
          if (this._chartPointers.has(event.pointerId)) this._chartPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
          this._chartScrubAtClientX(event.clientX);
          event.preventDefault?.();
          return;
        }
        if (event.pointerType === 'mouse' && event.target?.closest?.('[data-role="chart-plot"]')) this._chartHover(event);
      });
      this.shadowRoot.addEventListener('pointerup', (event) => this._chartPointerEnd(event));
      this.shadowRoot.addEventListener('pointercancel', (event) => this._chartPointerEnd(event));
      this.shadowRoot.addEventListener('input', (event) => {
        const slider = event.target?.closest?.('[data-role="chart-scrubber"]');
        if (slider) this._chartScrubberInput(slider.value);
      });
      this.shadowRoot.addEventListener('focusout', (event) => {
        const input = event.target?.closest?.('[data-chart-date-start], [data-chart-date-end], [data-energy-chart-date-start], [data-energy-chart-date-end]');
        if (input) this._clampChartDateInput(input);
      });
      this.shadowRoot.addEventListener('change', (event) => {
        const slider = event.target?.closest?.('[data-role="chart-scrubber"]');
        if (slider && this._scrubTime !== null) this._queueChartReadings(this._scrubTime, true);
      });
      this.shadowRoot.addEventListener('pointerout', (event) => {
        const plot = event.target?.closest?.('[data-role="chart-plot"]');
        if (plot && !(event.relatedTarget && plot.contains(event.relatedTarget))) this._updateChartCurrent();
      });
    }

    connectedCallback() {
      if (typeof ResizeObserver === 'function' && !this._resizeObserver) {
        this._resizeObserver = new ResizeObserver(() => this._queueChartMeasure());
        this._resizeObserver.observe(this);
      }
      this._inView = true;
      if (typeof IntersectionObserver === 'function' && !this._intersectionObserver) {
        this._intersectionObserver = new IntersectionObserver((entries) => {
          const entry = entries[entries.length - 1];
          if (!entry || entry.isIntersecting === this._inView) return;
          this._inView = entry.isIntersecting;
          if (this._inView) this._resumeUpdates();
        });
        this._intersectionObserver.observe(this);
      }
      if (typeof document !== 'undefined' && !this._chartDateDocumentListenersAttached) {
        document.addEventListener('pointerdown', this._chartDateDocumentPointerDownHandler, true);
        this._chartDateDocumentListenersAttached = true;
      }
      if (typeof document !== 'undefined' && !this._visibilityHandler) {
        this._visibilityHandler = () => { if (this._isActive()) this._resumeUpdates(); };
        document.addEventListener('visibilitychange', this._visibilityHandler);
      }
      if (typeof document !== 'undefined' && typeof window !== 'undefined' && !this._scrollListenersAttached) {
        document.addEventListener('scroll', this._scrollVisibilityHandler, { capture: true, passive: true });
        window.addEventListener('scroll', this._scrollVisibilityHandler, { passive: true });
        this._scrollListenersAttached = true;
      }
      this._updateScrollTopVisibility();
      this._scheduleHeartbeatExpiry();
    }

    disconnectedCallback() {
      this._resizeObserver?.disconnect();
      this._resizeObserver = null;
      this._intersectionObserver?.disconnect();
      this._intersectionObserver = null;
      if (this._visibilityHandler && typeof document !== 'undefined') document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
      if (this._chartDateDocumentListenersAttached && typeof document !== 'undefined') {
        document.removeEventListener('pointerdown', this._chartDateDocumentPointerDownHandler, true);
        this._chartDateDocumentListenersAttached = false;
      }
      this._closeChartDateRangePopover();
      if (this._scrollListenersAttached && typeof document !== 'undefined' && typeof window !== 'undefined') {
        document.removeEventListener('scroll', this._scrollVisibilityHandler, true);
        window.removeEventListener('scroll', this._scrollVisibilityHandler);
        this._scrollListenersAttached = false;
      }
      if (this._heartbeatTimer !== null) window.clearTimeout(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }

    // False while the page is in the background or the card is scrolled/collapsed out of view.
    _isActive() {
      if (typeof document !== 'undefined' && document.hidden) return false;
      return this._inView !== false;
    }

    _pageScroller() {
      let node = this;
      while (node) {
        const parent = node.parentElement || node.getRootNode?.().host || null;
        if (!parent) break;
        let overflowY = '';
        try { overflowY = window.getComputedStyle(parent).overflowY; } catch (_error) { /* styles may not be readable yet */ }
        if (parent.scrollHeight > parent.clientHeight + 1 && /auto|scroll/.test(overflowY)) return parent;
        node = parent;
      }
      return typeof document !== 'undefined' ? (document.scrollingElement || document.documentElement || document.body) : null;
    }

    _scrollTop() {
      const scroller = this._pageScroller();
      if (!scroller) return 0;
      if (typeof document !== 'undefined' && (scroller === document.body || scroller === document.documentElement || scroller === document.scrollingElement)) {
        return Math.max(window.scrollY || 0, scroller.scrollTop || 0);
      }
      return scroller.scrollTop || 0;
    }

    _visibleTabRects() {
      const tabs = this.shadowRoot?.querySelectorAll?.('[data-tab]') || [];
      return [...tabs].map((tab) => {
        let rect;
        try { rect = tab.getBoundingClientRect?.(); } catch (_error) { return null; }
        if (!rect || rect.width <= 0 || rect.height <= 0) return null;
        try {
          const style = window.getComputedStyle?.(tab);
          if (style?.display === 'none' || style?.visibility === 'hidden') return null;
        } catch (_error) {}
        return rect;
      }).filter(Boolean);
    }

    _rectanglesOverlap(first, second) {
      const firstRight = Number.isFinite(first.right) ? first.right : first.left + first.width;
      const firstBottom = Number.isFinite(first.bottom) ? first.bottom : first.top + first.height;
      const secondRight = Number.isFinite(second.right) ? second.right : second.left + second.width;
      const secondBottom = Number.isFinite(second.bottom) ? second.bottom : second.top + second.height;
      return first.left < secondRight && firstRight > second.left && first.top < secondBottom && firstBottom > second.top;
    }

    _overlapsVisibleTab(element) {
      let rect;
      try { rect = element?.getBoundingClientRect?.(); } catch (_error) { return false; }
      if (!rect || rect.width <= 0 || rect.height <= 0) return false;
      return this._visibleTabRects().some((tabRect) => this._rectanglesOverlap(rect, tabRect));
    }

    _updateScrollTopVisibility() {
      const button = this.shadowRoot?.querySelector('[data-scroll-top]');
      if (!button) return;
      const shouldShow = this._scrollTop() >= 180;
      if (typeof button.showPopover === 'function' && typeof button.hidePopover === 'function') {
        let isOpen = false;
        try { isOpen = button.matches(':popover-open'); } catch (_error) { isOpen = false; }
        try {
          if (shouldShow && !isOpen) {
            button.showPopover();
            isOpen = true;
          }
          const mayShow = shouldShow && !this._overlapsVisibleTab(button);
          if (mayShow && !isOpen) button.showPopover();
          else if (!mayShow && isOpen) button.hidePopover();
        } catch (_error) {
          const mayShow = shouldShow && !this._overlapsVisibleTab(button);
          button.hidden = !mayShow;
        }
      } else {
        button.hidden = !shouldShow;
        if (shouldShow && this._overlapsVisibleTab(button)) button.hidden = true;
      }
    }

    _scrollPageToTop() {
      const scroller = this._pageScroller();
      if (!scroller) return;
      const isDocument = typeof document !== 'undefined' && (scroller === document.body || scroller === document.documentElement || scroller === document.scrollingElement);
      if (isDocument && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (typeof scroller.scrollTo === 'function') {
        scroller.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        scroller.scrollTop = 0;
      }
      this._updateScrollTopVisibility();
    }

    _resumeUpdates() {
      if (this._config && this._hass) this._applyHass();
    }

    _queueChartMeasure() {
      if (this._measureQueued) return;
      this._measureQueued = true;
      const run = () => {
        this._measureQueued = false;
        const plot = this.shadowRoot.querySelector(this._activeTab === 'energy' ? '[data-energy-plot]' : '[data-role="chart-plot"]');
        const width = plot ? Math.round(plot.clientWidth) : 0;
        if (width > 120 && Math.abs(width - this._chartW) > 6) {
          this._chartW = width;
          if (this._activeTab === 'energy') this._refreshEnergyCharts();
          else this._refreshChart();
        }
      };
      if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(run);
      else window.setTimeout(run, 0);
    }

    setConfig(config) {
      const prefix = config.prefix || 'grid_monitor';
      const entities = { ...DEFAULTS };
      if (prefix !== 'grid_monitor') {
        Object.keys(entities).forEach((key) => {
          if (key !== 'stats_start') entities[key] = entities[key].replace('grid_monitor', prefix);
        });
      }
      Object.assign(entities, config.entities || {});
      const powerMode = ['grid_shared', 'after_avr', 'independent'].includes(config.esp_power_mode) ? config.esp_power_mode : 'after_avr';
      this._entityOverrides = { ...(config.entities || {}) };
      this._config = { ...config, entities, name: config.name || null, esp_power_mode: powerMode };
      this._statsStart = this._hass ? this._readStatsStart() : null;
      this._statsStartApplied = Boolean(this._hass);
      if (this._hass && !Number.isFinite(this._statsStart)) this._migrateStatsStart(true);
      if (this._historyRange === 'since') {
        this._historyRange = 'day';
        this._historyReturnRange = 'day';
      }
      this._stateSnapshot = this._captureStateSnapshot();
      this._render();
      this._scheduleHeartbeatExpiry();
    }

    set hass(value) {
      this._hass = value;
      if (this._config && this._hasRendered && !this._isActive()) {
        this._hassDirty = true;
        return;
      }
      this._applyHass();
    }

    _applyHass() {
      this._hassDirty = false;
      const nextHass = this._hass;
      this._hass = this._appliedHass;
      const wasEspOnline = Boolean(this._config) && this._effectiveEspStatus() === 'on';
      this._hass = nextHass;
      this._appliedHass = nextHass;
      let statsStartLoaded = false;
      if (!this._statsStartApplied) {
        this._statsStart = this._readStatsStart();
        this._statsStartApplied = true;
        statsStartLoaded = true;
        if (!Number.isFinite(this._statsStart)) {
          this._migrateStatsStart(true);
          if (Number.isFinite(this._statsStart) && this._historyRange === 'since') this._historyRange = 'day';
        }
      }
      const nextSnapshot = this._captureStateSnapshot(this._stateSnapshot);
      if (!this._config || !this._hasRendered || this._renderedLanguage !== this._lang() || statsStartLoaded) {
        this._stateSnapshot = nextSnapshot;
        this._render();
      } else {
        const changed = this._diffStateSnapshots(this._stateSnapshot, nextSnapshot);
        const isEspOnline = this._effectiveEspStatus() === 'on';
        if (wasEspOnline !== isEspOnline) changed.add('esp_connectivity');
        this._stateSnapshot = nextSnapshot;
        if (changed.size) this._scheduleStateUpdate(changed);
      }
      this._scheduleHeartbeatExpiry();
      this._ensureHistory();
      this._ensureEnergyHistory();
      this._ensureStatsExtremes();
    }

    // Home Assistant replaces a state object whenever the entity changes, so an unchanged
    // reference means the entry is still valid and nothing needs to be re-read or compared.
    _captureStateSnapshot(previous = null) {
      const states = this._hass?.states;
      const snapshot = {};
      for (const key of DEFAULT_KEYS) {
        const entityId = this._entity(key);
        const state = states?.[entityId] || null;
        const known = previous?.[key];
        if (known && known.id === entityId && known.ref === state) {
          snapshot[key] = known;
          continue;
        }
        const attributes = state?.attributes || {};
        snapshot[key] = {
          id: entityId,
          ref: state,
          exists: Boolean(state),
          state: state?.state ?? null,
          unit: attributes.unit_of_measurement ?? null,
          limits: SETTING_ENTITY_KEYS.has(key) ? `${attributes.min ?? ''}|${attributes.max ?? ''}|${attributes.step ?? ''}` : null,
          updated: TIMESTAMP_ENTITY_KEYS.has(key) ? state?.last_updated ?? null : null,
        };
      }
      return snapshot;
    }

    _snapshotEntryChanged(previous, next) {
      if (previous === next) return false;
      if (!previous || !next) return true;
      return previous.id !== next.id || previous.exists !== next.exists || previous.state !== next.state
        || previous.unit !== next.unit || previous.limits !== next.limits || previous.updated !== next.updated;
    }

    _diffStateSnapshots(previous, next) {
      const changed = new Set();
      for (const key of Object.keys(next)) {
        if (!previous || this._snapshotEntryChanged(previous[key], next[key])) changed.add(key);
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

    _ecoClass() { return this._config?.performance === true ? ' eco' : ''; }

    _t(key) { return TEXT[this._lang()][key] || key; }
    _locale() { return this._lang() === 'uk' ? 'uk-UA' : 'en-US'; }
    _entityPlan(key) {
      const config = this._config;
      const overrides = this._entityOverrides;
      let cache = this._entityPlanCache;
      if (!cache || cache.config !== config || cache.overrides !== overrides) {
        cache = { config, overrides, plans: new Map() };
        this._entityPlanCache = cache;
      }
      if (cache.plans.has(key)) return cache.plans.get(key);
      let plan = null;
      const defId = DEFAULTS[key];
      if (defId) {
        const prefix = key === 'stats_start' ? 'grid_monitor' : config?.prefix || 'grid_monitor';
        const domain = defId.split('.')[0];
        const suffix = defId.split('.').slice(1).join('.').replace(/^grid_monitor_/, '');
        const aliases = ALIAS_SUFFIXES[key] || [];
        const requested = overrides?.[key];
        const requestedParts = requested?.split('.') || [];
        const requestedSuffix = requestedParts[1]?.startsWith(`${prefix}_`) ? requestedParts[1].slice(prefix.length + 1) : '';
        const isKnownDefault = requestedParts[0] === domain && [suffix, ...aliases].includes(requestedSuffix);
        plan = {
          requested,
          forced: Boolean(requested) && !isKnownDefault,
          candidate: `${domain}.${prefix}_${suffix}`,
          aliasIds: aliases.map((alias) => `${domain}.${prefix}_${alias}`),
        };
      }
      cache.plans.set(key, plan);
      return plan;
    }

    _entity(key) {
      const plan = this._entityPlan(key);
      if (!plan) return '';
      if (plan.forced) return plan.requested;
      const states = this._hass?.states;
      const usable = (entityId) => {
        const state = states?.[entityId]?.state;
        return state !== undefined && state !== 'unknown' && state !== 'unavailable';
      };
      if (usable(plan.candidate)) return plan.candidate;
      for (const aliasId of plan.aliasIds) {
        if (usable(aliasId)) return aliasId;
      }
      if (plan.requested && states?.[plan.requested]) return plan.requested;
      return plan.requested || plan.candidate;
    }
    _state(key) { return this._hass?.states?.[this._entity(key)] || null; }
    _raw(key) { return this._state(key)?.state ?? null; }
    _heartbeatFresh() {
      const updatedAt = Date.parse(this._state('uptime')?.last_updated || '');
      if (!Number.isFinite(updatedAt)) return null;
      return Date.now() - updatedAt <= HEARTBEAT_TIMEOUT_MS;
    }
    _effectiveEspStatus() {
      const state = this._raw('esp_status');
      if (state === 'off' || state === 'unavailable') return 'off';
      if (state !== 'on') return state;
      return this._heartbeatFresh() === false ? 'off' : 'on';
    }
    _scheduleHeartbeatExpiry() {
      if (this._heartbeatTimer !== null) window.clearTimeout(this._heartbeatTimer);
      this._heartbeatTimer = null;
      if (this._raw('esp_status') !== 'on' || this._effectiveEspStatus() !== 'on') return;
      const updatedAt = Date.parse(this._state('uptime')?.last_updated || '');
      if (!Number.isFinite(updatedAt)) return;
      const remaining = updatedAt + HEARTBEAT_TIMEOUT_MS - Date.now() + 25;
      if (remaining <= 0) {
        this._refreshConnectivityUI();
        return;
      }
      this._heartbeatTimer = window.setTimeout(() => {
        this._heartbeatTimer = null;
        if (this._effectiveEspStatus() !== 'on') this._refreshConnectivityUI();
      }, remaining);
    }
    _refreshConnectivityUI() {
      this._updateConnectionStatus();
      this._updateStatusClasses();
      this._updateValueBindings(LIVE_DISPLAY_KEYS);
      this._updateHome(LIVE_MEASUREMENT_KEYS);
      if (this._activeTab === 'params') this._updateRange();
      if (this._activeTab === 'settings') this._updateDeviceStatus();
    }
    _num(key) {
      if (LIVE_MEASUREMENT_KEYS.has(key) && this._effectiveEspStatus() === 'off') return null;
      if (Number.isFinite(this._statsStart) && STATS_OVERRIDES[key]) {
        const [metric, bound] = STATS_OVERRIDES[key];
        const value = this._statsExtremes?.[metric]?.[bound];
        return Number.isFinite(value) ? value : null;
      }
      const raw = this._raw(key);
      if (raw === null || raw === 'unknown' || raw === 'unavailable') return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    }
    _escape(value) {
      return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }
    _currencyCode() {
      const currency = this._config?.currency;
      return ['UAH', 'EUR', 'USD'].includes(currency) ? currency : 'UAH';
    }
    _currencyUnit(key, currency = this._currencyCode()) {
      const label = currency === 'UAH' && this._lang() === 'uk' ? 'грн' : currency;
      if (key === 'cost_rate') return `${label}/${this._lang() === 'uk' ? 'год' : 'h'}`;
      if (key === 'tariff' || key === 'tariff_day' || key === 'tariff_night') return `${label}/${this._lang() === 'uk' ? 'кВт·год' : 'kWh'}`;
      return label;
    }
    _unit(key) {
      if (['cost_today', 'cost_month', 'cost_total', 'cost_rate', 'tariff', 'tariff_day', 'tariff_night'].includes(key)) {
        return this._currencyUnit(key);
      }
      const unit = this._state(key)?.attributes?.unit_of_measurement || '';
      if (this._lang() !== 'uk') return unit;
      return ({ V: 'В', A: 'А', W: 'Вт', Hz: 'Гц', kWh: 'кВт·год', VA: 'ВА', var: 'вар', UAH: 'грн', 'UAH/kWh': 'грн/кВт·год', 'UAH/h': 'грн/год', min: 'хв', h: 'год', dBm: 'дБм' })[unit] || unit;
    }
    _formatted(key, digits = 1) {
      if (LIVE_DISPLAY_KEYS.has(key) && this._effectiveEspStatus() === 'off') return this._t('unavailable');
      const n = this._num(key);
      if (n === null && Number.isFinite(this._statsStart) && STATS_OVERRIDES[key]) return '—';
      if (n === null) {
        const raw = this._raw(key);
        if (raw === 'unavailable') return this._t('unavailable');
        if (raw === 'unknown' || raw === null) return this._t('unknown');
        if (key === 'voltage_status') {
          if (raw === 'PZEM Offline') return this._t('pzem_offline');
          if (raw === 'Waiting for PZEM') return this._t('detecting');
          if (raw === 'Normal') return this._t('normal');
          if (raw === 'Sag') return this._t('sag_state');
          if (raw === 'Swell') return this._t('swell_state');
        }
        return raw;
      }
      if (key === 'uptime' && this._state(key)?.attributes?.unit_of_measurement === 's') {
        const u = this._lang() === 'uk' ? { d: 'д', h: 'год', m: 'хв' } : { d: 'd', h: 'h', m: 'min' };
        const days = Math.floor(n / 86400); const hours = Math.floor((n % 86400) / 3600); const minutes = Math.floor((n % 3600) / 60);
        return days ? `${days} ${u.d} ${hours} ${u.h}` : hours ? `${hours} ${u.h} ${minutes} ${u.m}` : `${minutes} ${u.m}`;
      }
      const value = n.toLocaleString(this._locale(), { maximumFractionDigits: digits });
      const unit = this._unit(key) || (Number.isFinite(this._statsStart) && STATS_OVERRIDES[key] ? this._unit(STATS_OVERRIDES[key][0]) : '');
      return `${value}${unit ? ` ${unit}` : ''}`;
    }
    _svg(name, extra = '') { return `<svg class="icon ${extra}" viewBox="0 0 48 48" aria-hidden="true">${ICONS[name] || ''}</svg>`; }
    _metricInfoButton(key) {
      const info = METRIC_INFO[key];
      if (!info) return '';
      const label = this._t(info.label);
      const ariaLabel = `${this._t('metric_info_button')}: ${label}`;
      return `<button type="button" class="metric-info-button" data-metric-info="${key}" aria-label="${this._escape(ariaLabel)}" title="${this._escape(ariaLabel)}"><span aria-hidden="true">i</span></button>`;
    }
    _detailIcon(icon) {
      if (!icon) return '';
      // Optical centring: some glyphs are drawn off-centre inside the 48x48 viewBox.
      const [dx, dy] = DETAIL_ICON_SHIFT[icon] || [0, 0];
      const body = dx || dy ? `<g transform="translate(${dx} ${dy})">${ICONS[icon] || ''}</g>` : ICONS[icon] || '';
      return `<span class="detail-icon" aria-hidden="true"><svg class="icon" viewBox="0 0 48 48" aria-hidden="true">${body}</svg></span>`;
    }

    _detail(key, label, digits = 1, icon = '') {
      const infoButton = this._metricInfoButton(key);
      return `<div class="detail${infoButton ? ' metric-info-card' : ''}${icon ? ' has-icon' : ''}">${this._detailIcon(icon)}${infoButton}<span>${this._escape(label)}</span><b data-value-key="${key}" data-value-digits="${digits}">${this._escape(this._formatted(key, digits))}</b></div>`;
    }
    _row(key, label, icon, digits = 1) { return `<div class="row"><span class="row-label"><span class="row-symbol">${icon}</span>${this._escape(label)}</span><strong data-value-key="${key}" data-value-digits="${digits}">${this._escape(this._formatted(key, digits))}</strong></div>`; }
    _setting(key, label) {
      const entity = this._entity(key);
      const state = this._state(key);
      const value = this._num(key);
      const attrs = state?.attributes || {};
      const min = Number.isFinite(Number(attrs.min)) ? Number(attrs.min) : '';
      const max = Number.isFinite(Number(attrs.max)) ? Number(attrs.max) : '';
      const step = Number.isFinite(Number(attrs.step)) && Number(attrs.step) > 0 ? Number(attrs.step) : 'any';
      const unit = key === 'tariff_day' || key === 'tariff_night' ? this._currencyUnit(key, 'UAH') : this._unit(key);
      const unitBinding = key === 'tariff_day' || key === 'tariff_night' ? '' : `data-unit-key="${key}"`;
      return `<div class="setting detail"><label><span>${this._escape(label)}</span><div class="setting-input"><input type="text" inputmode="decimal" data-number-input="${key}" value="${value === null ? '' : value}" data-min="${min}" data-max="${max}" data-step="${step}" ${!state ? 'disabled' : ''}><small ${unitBinding}>${this._escape(unit)}</small></div></label><button class="save-button" data-number-save="${key}" ${!state ? 'disabled' : ''}>${this._escape(this._t('save'))}</button></div>`;
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
      const esp = this._effectiveEspStatus();
      const sourceStatus = this._raw('source_status');
      const legacyFirmware = sourceStatus === null;
      const canTrustTelemetry = esp !== 'off';
      const pzemOnline = canTrustTelemetry && (sourceStatus === 'pzem_online_source_unconfirmed' || (legacyFirmware && mains === 'on'));
      // PZEM silence never confirms inverter operation; it only describes telemetry availability.
      const pzemOffline = canTrustTelemetry && (sourceStatus === 'pzem_offline_source_unknown' || (legacyFirmware && this._raw('inverter') === 'on'));
      const waitingForPzem = canTrustTelemetry && sourceStatus === 'waiting_for_pzem';
      const voltageAlarm = this._raw('voltage_alarm');
      const alarm = pzemOnline && voltageAlarm === 'on';
      const qualityUnknown = pzemOnline && voltageAlarm !== 'on' && voltageAlarm !== 'off';
      const healthy = esp === 'on' && pzemOnline && voltageAlarm === 'off';
      const stateClass = esp === 'off' ? 'offline' : alarm ? 'alarm' : pzemOffline ? 'pzem-offline' : healthy ? 'healthy' : 'unknown';
      const source = esp === 'off' ? this._t('source_unknown') : pzemOffline ? this._t('pzem_source_offline') : pzemOnline ? this._t('source_unconfirmed') : waitingForPzem ? this._t('detecting') : this._t('source_unknown');
      const banner = esp === 'off' ? this._t('offline_banner') : pzemOffline ? this._t('pzem_offline_banner') : alarm ? this._t('alarm_banner') : qualityUnknown ? this._t('quality_unknown') : healthy ? this._t('healthy') : waitingForPzem ? this._t('detecting') : this._t('source_unknown');
      const status = esp === 'off' ? this._t('offline') : pzemOffline ? this._t('pzem_offline') : alarm ? this._t('alarm') : healthy ? this._t('normal') : waitingForPzem ? this._t('detecting') : this._t('unknown');
      return { mains, pzemOnline, pzemOffline, esp, alarm, qualityUnknown, stateClass, source, banner, status };
    }

    _headRightHtml(status) {
      const online = status.esp === 'on';
      return `<div class="headright home-status"><div class="connection ${online ? 'online' : status.esp === 'off' ? 'offline' : 'unknown'}"><span class="dot"></span><strong>${this._escape(online ? this._t('online') : status.esp === 'off' ? this._t('offline') : this._t('unknown'))}</strong><small data-role="updated-time">${this._escape(this._t('updated'))}: ${this._escape(this._updatedTime())}</small></div></div>`;
    }

    _headerHtml() {
      return `<header class="header"><div class="logo">${this._svg('bolt')}</div><div class="brand"><h1>${this._escape(this._config.name || this._t('title'))}</h1><p>${this._escape(this._t('subtitle'))}</p></div><span class="house-art header-house" aria-hidden="true">${this._houseArt(this._displayStatus())}</span>${this._tabs('top')}</header>`;
    }

    _home() {
      const status = this._displayStatus();
      const voltage = this._num('voltage');
      const progress = gaugeProgress(voltage);
      const voltageNumber = voltage === null ? this._formatted('voltage') : voltage.toLocaleString(this._locale(), { maximumFractionDigits: 1 });
      const voltageUnit = voltage === null ? '' : this._unit('voltage') || (this._lang() === 'uk' ? 'В' : 'V');
      const [markerX, markerY] = gaugeMarker(progress);
      const gaugeDot = `<circle class="gauge-dot" data-role="gauge-dot" fill="url(#${this._id('knob')})" cx="${markerX.toFixed(1)}" cy="${markerY.toFixed(1)}" r="9" visibility="${voltage === null ? 'hidden' : 'visible'}"/>`;
      const espPower = this._espPowerStatus();
      const energy = this._formatted('energy_today', 2);
      const cost = this._formatted('cost_today', 2);
      return `<section class="home-view">
        <div class="main-grid">
          <div class="card voltage ${status.stateClass}" data-role="voltage-card">
            <div class="voltage-brand"><div class="logo">${this._svg('bolt')}</div><div class="brand"><h1>${this._escape(this._config.name || this._t('title'))}</h1><p>${this._escape(this._t('subtitle'))}</p></div>${this._headRightHtml(status)}</div>
            <svg class="voltage-gauge" viewBox="0 0 500 342" role="img" aria-label="${this._escape(this._t('voltage'))}">
              <defs>
                <linearGradient id="${this._id('arc')}" gradientUnits="userSpaceOnUse" x1="62" y1="0" x2="438" y2="0"><stop class="arc-a" stop-color="#0a84ff"/><stop class="arc-b" offset=".5" stop-color="#12d3e8"/><stop class="arc-c" offset="1" stop-color="#3cf08a"/></linearGradient>
                <radialGradient id="${this._id('glow')}"><stop stop-color="#0a8cff" stop-opacity=".34"/><stop offset="1" stop-color="#0a8cff" stop-opacity="0"/></radialGradient>
                <filter id="${this._id('blur')}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
                <radialGradient id="${this._id('knob')}" cx=".36" cy=".3" r=".8"><stop stop-color="#ffffff"/><stop offset=".35" stop-color="#bfeaff"/><stop offset="1" stop-color="#0b6fb8"/></radialGradient>
                <linearGradient id="${this._id('groove')}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#020812"/><stop offset="1" stop-color="#10273f"/></linearGradient>
              </defs>
              <ellipse cx="250" cy="165" rx="175" ry="140" fill="url(#${this._id('glow')})"/>
              <path d="${gaugeArcPath()}" fill="none" stroke="#7fc4f0" stroke-opacity=".12" stroke-width="34" stroke-linecap="round"/>
              <path d="${gaugeArcPath()}" fill="none" stroke="url(#${this._id('groove')})" stroke-width="31" stroke-linecap="round"/>
              <path d="${gaugeArcPath(GAUGE.r - 14)}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="2"/>
              <path d="${gaugeArcPath()}" fill="none" stroke="url(#${this._id('arc')})" stroke-opacity=".24" stroke-width="26" stroke-linecap="round"/>
              ${this._gaugeTicks(progress)}
              <path class="gauge-fill-glow" data-role="gauge-progress-glow" visibility="${voltage === null ? 'hidden' : 'visible'}" d="${gaugeArcPath()}" fill="none" stroke="url(#${this._id('arc')})" stroke-width="30" stroke-linecap="round" stroke-dasharray="${progress} 100" pathLength="100" filter="url(#${this._id('blur')})" opacity=".55"/>
              <path data-role="gauge-progress" visibility="${voltage === null ? 'hidden' : 'visible'}" d="${gaugeArcPath()}" fill="none" stroke="url(#${this._id('arc')})" stroke-width="26" stroke-linecap="round" stroke-dasharray="${progress} 100" pathLength="100"/>
              ${this._towerArtwork()}
              ${gaugeDot}
              <text x="250" y="266" text-anchor="middle" class="voltage-value${voltage === null ? ' empty' : ''}" data-role="voltage-text"><tspan data-role="voltage-number">${this._escape(voltageNumber)}</tspan> <tspan class="voltage-unit" data-role="voltage-unit">${this._escape(voltageUnit)}</tspan></text>
              <text x="250" y="298" text-anchor="middle" class="voltage-label">${this._escape(this._t('voltage'))}</text>
              <text x="250" y="327" text-anchor="middle" class="gauge-usage" data-role="gauge-usage"><title>${this._escape(this._t('today_consumption'))}</title><tspan class="gauge-usage-energy" data-value-key="energy_today" data-value-digits="2">${this._escape(energy)}</tspan><tspan class="gauge-usage-cost" dx="12">≈ </tspan><tspan class="gauge-usage-cost" data-value-key="cost_today" data-value-digits="2">${this._escape(cost)}</tspan></text>
              <text x="${gaugePoint(GAUGE.start)[0].toFixed(0)}" y="334" text-anchor="middle" class="gauge-end">${GAUGE.min}</text>
              <text x="${gaugePoint(GAUGE.start + GAUGE.span)[0].toFixed(0)}" y="334" text-anchor="middle" class="gauge-end">${GAUGE.max}</text>
            </svg>
            <div class="state-indicator ${status.stateClass}" data-role="state-indicator"><span class="check-mark">${this._svg('check')}</span><span data-role="state-label">${this._escape(status.status)}</span></div>
          </div>
          <div class="main-right">
            ${this._tabs('side')}
            <div class="metrics">
              ${this._heroMetric('power', 'bolt', 0)}
              ${this._heroMetric('current', 'current', 2)}
              ${this._heroMetric('frequency', 'frequency', 1)}
              ${this._heroMetric('power_factor', 'pf', 2)}
            </div>${this._statsNote()}
          </div>
        </div>
        <div class="card banner ${status.stateClass}" data-role="home-banner"><span class="banner-check">${this._svg('check')}</span><div class="banner-main"><strong data-role="home-banner-label">${this._escape(status.banner)}</strong></div><div class="banner-system"><span class="banner-system-label">${this._escape(this._t('esp_power_connection'))}</span><strong data-role="esp-power-label">${this._escape(espPower.label)}</strong><span class="banner-system-note" data-role="esp-power-note">${this._escape(espPower.note)}</span></div><span class="house-art" aria-hidden="true">${this._houseArt(status)}</span></div>
      </section>`;
    }

    _id(name) { return `gm-${this._instanceId}-${name}`; }
    _gaugeTicks(progress) {
      return Array.from({ length: 25 }, (_, index) => {
        const angle = GAUGE.start + (index / 24) * GAUGE.span;
        const major = index % 4 === 0;
        const [x1, y1] = gaugePoint(angle, major ? 154 : 158);
        const [x2, y2] = gaugePoint(angle, 166);
        const active = index / 24 * 100 <= progress ? ' active' : '';
        return `<path class="dial-tick${major ? ' major' : ''}${active}" data-gauge-tick="${index}" d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
      }).join('');
    }
    _towerArtwork() {
      const id = (name) => this._id(name);
      let seed = 11;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      const R = 152;
      const dome = `M${250 - R} 205A${R} ${R} 0 0 1 ${250 + R} 205Z`;
      const f = (n) => n.toFixed(1);
      const stars = Array.from({ length: 22 }, () => `<circle cx="${f(130 + rnd() * 240)}" cy="${f(58 + rnd() * 62)}" r="${(0.35 + rnd() * 0.55).toFixed(2)}" opacity="${(0.25 + rnd() * 0.55).toFixed(2)}"/>`).join('');
      const pines = (baseY, from, to, step, hMin, hMax) => {
        let d = '';
        for (let x = from; x <= to; x += step * (0.7 + rnd() * 0.6)) {
          const h = hMin + rnd() * (hMax - hMin); const w = h * 0.2;
          d += `M${f(x - w)} ${baseY}L${f(x - w * 0.55)} ${f(baseY - h * 0.42)}L${f(x - w * 0.8)} ${f(baseY - h * 0.42)}L${f(x - w * 0.3)} ${f(baseY - h * 0.75)}L${f(x - w * 0.5)} ${f(baseY - h * 0.75)}L${f(x)} ${f(baseY - h)}L${f(x + w * 0.5)} ${f(baseY - h * 0.75)}L${f(x + w * 0.3)} ${f(baseY - h * 0.75)}L${f(x + w * 0.8)} ${f(baseY - h * 0.42)}L${f(x + w * 0.55)} ${f(baseY - h * 0.42)}L${f(x + w)} ${baseY}Z`;
        }
        return d;
      };
      const forestFar = pines(188, 96, 404, 5, 6, 11);
      const forestMid = pines(197, 96, 404, 6, 9, 17);
      // Lattice tower in local coordinates: ground at y=0, peak at y=-150, centred on x=0.
      const profile = [[0, 40], [-76, 15], [-112, 9], [-142, 3]];
      const hw = (y) => {
        for (let i = 1; i < profile.length; i += 1) {
          if (y >= profile[i][0]) { const [y0, w0] = profile[i - 1]; const [y1, w1] = profile[i]; return w0 + (w1 - w0) * (y - y0) / (y1 - y0); }
        }
        return 3;
      };
      const levels = [0, -30, -54, -76, -96, -114, -130, -142];
      const arms = [{ y: -120, w: 46 }, { y: -96, w: 60 }, { y: -72, w: 72 }];
      const INS = 17;
      const legs = [-1, 1].map((s) => levels.map((y, i) => `${i ? 'L' : 'M'}${f(s * hw(y))} ${y}`).join('')).join('') + 'M-3 -142L0 -150L3 -142';
      const chords = levels.map((y) => `M${f(-hw(y))} ${y}H${f(hw(y))}`).join('');
      const diagonals = levels.slice(0, -1).map((a, i) => { const b = levels[i + 1]; return `M${f(-hw(a))} ${a}L${f(hw(b))} ${b}M${f(hw(a))} ${a}L${f(-hw(b))} ${b}`; }).join('');
      const armTruss = arms.map(({ y, w }) => [-1, 1].map((s) => {
        const top = (t) => [s * (hw(y) + (w - hw(y)) * t), y + 3 * t];
        const bot = (t) => [s * (hw(y + 16) + (w - hw(y + 16)) * t), y + 16 - 13 * t];
        const pt = ([x, yy]) => `${f(x)} ${f(yy)}`;
        let d = `M${pt(top(0))}L${pt(top(1))}M${pt(bot(0))}L${pt(bot(1))}`;
        for (let k = 0; k < 4; k += 1) d += `M${pt(top(k / 4))}L${pt(bot((k + 1) / 4))}M${pt(bot(k / 4))}L${pt(top(k / 4))}`;
        return d;
      }).join('')).join('');
      const insulators = arms.map(({ y, w }) => [-1, 1].map((s) => {
        let d = `M${s * w} ${y + 3}V${y + 3 + INS - 2}`;
        for (let k = 0; k < 7; k += 1) d += `M${s * w - 2.6} ${f(y + 6 + k * 1.8)}H${s * w + 2.6}`;
        return d;
      }).join('')).join('');
      const feet = [-1, 1].map((s) => `<rect x="${s * 40 - 3.5}" y="-2" width="7" height="4" rx="1" fill="#7f95a8"/>`).join('');
      const tower = `<g class="tower-halo" filter="url(#${id('blur')})" fill="none" stroke="#38bdff" stroke-width="3.5" opacity=".28"><path d="${legs}${armTruss}"/></g>
          <g fill="none" stroke-linecap="round" stroke-linejoin="round">
            <g transform="translate(1.1 .8)" stroke="#040b15" stroke-opacity=".7"><path stroke-width="3.2" d="${legs}"/><path stroke-width="1.5" d="${chords}${diagonals}${armTruss}"/></g>
            <path stroke="url(#${id('steel')})" stroke-width="2.8" d="${legs}"/>
            <path stroke="#b9cbdb" stroke-width="1.15" d="${chords}${diagonals}"/>
            <path stroke="#c8d8e6" stroke-width="1.05" d="${armTruss}"/>
            <path stroke="#eef9ff" stroke-opacity=".55" stroke-width=".7" transform="translate(-.7 -.3)" d="${legs}"/>
            <path stroke="#cfe9f4" stroke-width="1" d="${insulators}"/>
          </g>${feet}`;
      const towerFar = `<g fill="none" stroke="#2a5578" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="3" d="${legs}"/><path stroke-width="1.6" d="${chords}${diagonals}${armTruss}${insulators}"/></g>`;
      const tip = (cx, gy, sc, s, arm) => [cx + s * arm.w * sc, gy + (arm.y + INS + 1) * sc];
      const wire = (a, b, sag) => `M${f(a[0])} ${f(a[1])}Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 + sag * 2)} ${f(b[0])} ${f(b[1])}`;
      const farX = [140, 360]; const farBase = 200; const farScale = 0.3;
      let nearWires = ''; let farWires = '';
      arms.forEach((arm) => {
        [-1, 1].forEach((s) => {
          const farCx = s < 0 ? farX[0] : farX[1];
          const a = tip(250, 204, 1, s, arm);
          const b = tip(farCx, farBase, farScale, -s, arm);
          const c = tip(farCx, farBase, farScale, s, arm);
          const edge = [250 + s * (R + 8), c[1] + 8];
          nearWires += wire(a, b, 6);
          farWires += wire(c, edge, 2);
        });
      });
      return `<g class="tower-illustration">
        <defs>
          <linearGradient id="${id('sky')}" gradientUnits="userSpaceOnUse" x1="0" y1="55" x2="0" y2="205"><stop stop-color="#050f22"/><stop offset=".42" stop-color="#0b2a4b"/><stop offset=".8" stop-color="#1b6a92"/><stop offset="1" stop-color="#6fc0cf"/></linearGradient>
          <radialGradient id="${id('horizon')}" gradientUnits="userSpaceOnUse" cx="250" cy="200" r="120"><stop stop-color="#bfe9ee" stop-opacity=".55"/><stop offset="1" stop-color="#bfe9ee" stop-opacity="0"/></radialGradient>
          <linearGradient id="${id('steel')}" gradientUnits="userSpaceOnUse" x1="-42" y1="0" x2="42" y2="0"><stop stop-color="#e3f0fa"/><stop offset=".5" stop-color="#9db3c6"/><stop offset="1" stop-color="#53697d"/></linearGradient>
          <linearGradient id="${id('ground')}" gradientUnits="userSpaceOnUse" x1="0" y1="186" x2="0" y2="205"><stop stop-color="#0a2338"/><stop offset="1" stop-color="#030a13"/></linearGradient>
          <radialGradient id="${id('vignette')}" gradientUnits="userSpaceOnUse" cx="250" cy="205" r="${R}"><stop offset=".68" stop-color="#050f1d" stop-opacity="0"/><stop offset="1" stop-color="#050f1d" stop-opacity=".85"/></radialGradient>
          <filter id="${id('haze')}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
          <clipPath id="${id('dome')}"><path d="${dome}"/></clipPath>
        </defs>
        <g clip-path="url(#${id('dome')})">
          <rect x="90" y="50" width="320" height="156" fill="url(#${id('sky')})"/>
          <g fill="#dff6ff">${stars}</g>
          <ellipse cx="250" cy="200" rx="150" ry="70" fill="url(#${id('horizon')})"/>
          <g class="tower-haze" fill="#9fd3e6" opacity=".16" filter="url(#${id('haze')})"><ellipse cx="170" cy="132" rx="52" ry="5"/><ellipse cx="338" cy="112" rx="46" ry="4"/><ellipse cx="300" cy="150" rx="64" ry="5"/></g>
          <path d="M98 205V186C122 178 148 183 172 178S214 172 240 177S290 186 316 179S372 174 402 184V205Z" fill="#164a6c" opacity=".9"/>
          <path d="${forestFar}" fill="#123d5c"/>
          <g transform="translate(${farX[0]} ${farBase}) scale(${farScale})">${towerFar}</g>
          <g transform="translate(${farX[1]} ${farBase}) scale(${farScale})">${towerFar}</g>
          <path d="${farWires}" fill="none" stroke="#1f4a6c" stroke-width=".6"/>
          <path d="M98 205V194C128 189 150 192 178 190S230 185 258 190S318 196 346 191S384 190 402 194V205Z" fill="#0c2e49"/>
          <path d="${forestMid}" fill="#081f34"/>
          <ellipse cx="250" cy="203" rx="96" ry="6" fill="#02070d" opacity=".55"/>
          <g transform="translate(250 204)">${tower}</g>
          <path d="${nearWires}" fill="none" stroke="#030a13" stroke-width="1.5" stroke-linecap="round" transform="translate(0 .7)" opacity=".7"/>
          <path d="${nearWires}" fill="none" stroke="#4a6578" stroke-width="1.1" stroke-linecap="round"/>
          <path d="${nearWires}" fill="none" stroke="#b6dcf2" stroke-opacity=".5" stroke-width=".4" stroke-linecap="round" transform="translate(0 -.5)"/>
          <path d="M98 205V200C140 197 190 201 250 199S360 197 402 201V205Z" fill="url(#${id('ground')})"/>
          <circle class="tower-beacon" cx="250" cy="57" r="2.6" fill="#ff3b5c"/>
          <rect x="90" y="50" width="320" height="156" fill="url(#${id('vignette')})"/>
        </g>
        <path d="M${250 - R} 205A${R} ${R} 0 0 1 ${250 + R} 205" fill="none" stroke="#9adcff" stroke-opacity=".32" stroke-width="1.4"/>
        <path d="M${250 - R + 2} 205A${R - 2} ${R - 2} 0 0 1 ${250 + R - 2} 205" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2"/>
      </g>`;
    }
    _houseLighting(status = this._displayStatus()) {
      // ESP silent -> nothing can be confirmed: dark inside and out. PZEM silent -> dark street only.
      const interiorOff = status.esp === 'off';
      const exteriorOff = status.esp === 'off' || (status.esp === 'on' && !status.pzemOnline);
      return { interiorOff, exteriorOff };
    }
    _houseArt(status = this._displayStatus()) {
      const light = this._houseLighting(status);
      return `<div class="house-scene${light.interiorOff ? ' interior-off' : ''}${light.exteriorOff ? ' exterior-off' : ''}" data-role="house-scene"><img class="house-base" src="${HOUSE_IMAGE}" alt="" draggable="false"/>${HOUSE_FX}</div>`;
    }
    _heroMetric(key, icon, digits) {
      const value = this._num(key);
      const display = value === null ? this._escape(this._formatted(key, digits)) : value.toLocaleString(this._locale(), { maximumFractionDigits: digits });
      const unit = this._unit(key);
      const extraClass = key === 'power_factor' ? 'pf' : key;
      const range = METRIC_RANGE[key];
      const minDigits = range ? (range.minDigits ?? range.digits) : 0;
      const maxDigits = range ? (range.maxDigits ?? range.digits) : 0;
      const rangeHtml = range ? `<div class="metric-range" data-role="metric-range"><span>${this._escape(this._t('stat_min'))} <b data-value-key="${range.min}" data-value-digits="${minDigits}">${this._escape(this._formatted(range.min, minDigits))}</b></span><span>${this._escape(this._t('stat_max'))} <b data-value-key="${range.max}" data-value-digits="${maxDigits}">${this._escape(this._formatted(range.max, maxDigits))}</b></span></div>` : '';
      return `<div class="card metric ${extraClass}">${this._metricInfoButton(key)}<div class="metric-icon">${this._svg(icon)}</div><div class="metric-value${value === null ? ' empty' : ''}" data-metric-key="${key}" data-metric-digits="${digits}"><span data-role="metric-number">${display}</span><span class="unit" data-role="metric-unit" style="${unit ? '' : 'display:none'}">${this._escape(unit)}</span></div><div class="metric-label">${this._escape(this._t(key === 'power_factor' ? 'pf' : key))}</div>${rangeHtml}</div>`;
    }

    _chart() {
      const labels = ['hour', 'day', 'week', 'month'];
      const buttons = labels.map((period) => `<button class="period-button ${this._historyRange === period ? 'active' : ''}" data-period="${period}" aria-pressed="${this._historyRange === period}">${this._escape(this._t(period))}</button>`).join('');
      const metricButtons = ['power', 'voltage'].map((metric) => `<button class="period-button ${this._chartMetric === metric ? 'active' : ''}" data-metric="${metric}" aria-pressed="${this._chartMetric === metric}">${this._escape(this._t(metric))}</button>`).join('');
      return `<section class="card chart-card detailed-chart"><div class="chart-head"><h2><span class="chart-icon">${this._svg('chart')}</span>${this._escape(this._t('chart_title'))}</h2><div class="periods chart-metric-periods" role="group" aria-label="${this._escape(this._t('chart_title'))}">${metricButtons}</div><div class="periods chart-range-periods" role="group" aria-label="${this._escape(this._t('hour'))}">${buttons}${this._chartDateRangeHtml()}</div></div><div class="chart-stats" data-role="chart-stats">${this._chartStatsHtml()}</div><div class="chart-plot" data-role="chart-plot">${this._chartSvg()}</div>${this._chartScrubberHtml()}${this._chartReadingsHtml()}</section>`;
    }

    _readStatsStart() {
      const raw = this._state('stats_start')?.state;
      if (!raw || raw === 'unknown' || raw === 'unavailable') return null;
      const value = Number.isFinite(Number(raw)) ? Number(raw) : Date.parse(raw);
      return Number.isFinite(value) && value > 0 && value < Date.now() ? value : null;
    }

    async _writeStatsStart(value) {
      const helper = this._state('stats_start');
      if (!helper || helper.state === 'unavailable' || typeof this._hass?.callService !== 'function') return false;
      try {
        await this._hass.callService('input_text', 'set_value', {
          entity_id: this._entity('stats_start'),
          value: value === null ? '' : new Date(value).toISOString(),
        });
        return true;
      } catch (_error) {
        return false;
      }
    }

    _hasStatsStartHelper() {
      const helper = this._state('stats_start');
      return Boolean(helper);
    }

    // Older card versions kept the date in the browser; move it into the helper so it survives updates.
    _legacyStatsStart() {
      try {
        const raw = window.localStorage?.getItem(`grid-monitor-card:stats-start:${this._config?.prefix || 'grid_monitor'}`);
        const value = Number(raw);
        return raw && Number.isFinite(value) && value > 0 && value < Date.now() ? value : null;
      } catch (_error) {
        return null;
      }
    }

    _dropLegacyStatsStart() {
      try { window.localStorage?.removeItem(`grid-monitor-card:stats-start:${this._config?.prefix || 'grid_monitor'}`); } catch (_error) { /* ignore */ }
    }

    _migrateStatsStart(allowLegacy) {
      if (this._readStatsStart() !== null) return;
      const helper = this._state('stats_start');
      const helperReady = Boolean(helper) && helper.state !== 'unavailable';
      let candidate = Number.isFinite(this._statsStart) && this._statsNeedsPersist ? this._statsStart : null;
      if (candidate === null && allowLegacy) {
        candidate = this._legacyStatsStart();
        // Keep using the old browser value even while the helper is missing; it moves into the helper once that exists.
        if (candidate !== null) { this._statsStart = candidate; this._statsNeedsPersist = true; }
      }
      if (!Number.isFinite(candidate) || !helperReady) return;
      this._writeStatsStart(candidate).then((saved) => {
        if (!saved) return;
        this._statsNeedsPersist = false;
        this._dropLegacyStatsStart();
        if (this.shadowRoot?.querySelector) this._updateStatsControls();
      });
    }

    _canCreateStatsStartHelper() {
      return !this._hasStatsStartHelper()
        && !this._statsHelperCreated
        && this._entity('stats_start') === DEFAULTS.stats_start;
    }

    async _createStatsStartHelper() {
      if (!this._canCreateStatsStartHelper() || this._statsHelperCreating) return false;
      this._statsHelperCreating = true;
      if (this.shadowRoot?.querySelector) this._updateStatsControls();
      try {
        const confirmed = await this._showDialog({
          title: this._t('dialog_confirm_title'),
          message: this._t('stats_create_helper_confirm'),
          confirm: true,
        });
        if (!confirmed) return false;
        if (typeof this._hass?.callWS !== 'function') throw new Error('Home Assistant WebSocket API is unavailable');
        await this._hass.callWS({
          type: 'input_text/create',
          name: 'Grid Monitor Statistics Start',
          min: 0,
          max: 32,
          icon: 'mdi:calendar-clock',
        });
        this._statsHelperCreated = true;
        await this._showDialog({ title: this._t('stats_title'), message: this._t('stats_helper_created') });
        return true;
      } catch (_error) {
        await this._showDialog({ title: this._t('dialog_error_title'), message: this._t('stats_helper_error') });
        return false;
      } finally {
        this._statsHelperCreating = false;
        if (this.shadowRoot?.querySelector) this._updateStatsControls();
      }
    }

    _statsStartLabel() {
      if (!Number.isFinite(this._statsStart)) return '';
      const when = new Date(this._statsStart);
      const time = when.toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
      if (when.toDateString() === new Date().toDateString()) return time;
      return `${when.toLocaleDateString(this._locale(), { day: '2-digit', month: '2-digit' })} ${time}`;
    }

    _statsStartFullLabel() {
      if (!Number.isFinite(this._statsStart)) return '';
      return new Date(this._statsStart).toLocaleString(this._locale(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    }

    _statsNote() {
      return '';
    }

    _panelHistoryEntityIds() {
      const states = this._hass?.states;
      if (!states) return [];
      const ids = new Set();
      for (const key of Object.keys(ALIAS_SUFFIXES)) {
        const entityId = this._entity(key);
        const domain = entityId.split('.')[0];
        if ((domain === 'sensor' || domain === 'binary_sensor') && states[entityId]) ids.add(entityId);
      }
      return [...ids].sort();
    }

    _historyCleanupActions() {
      const entityIds = this._panelHistoryEntityIds();
      const sensorIds = entityIds.filter((entityId) => entityId.startsWith('sensor.'));
      const disabled = this._historyDeleteInProgress ? 'disabled' : '';
      const button = (kind, labelKey, icon, count) => `<button class="action-button danger" type="button" data-history-delete="${kind}" ${!count || disabled}><span>${this._svg(icon)}</span>${this._escape(this._t(labelKey))}</button>`;
      return `${button('recorder', 'history_purge_button', 'chart', entityIds.length)}${button('statistics', 'history_stats_button', 'params', sensorIds.length)}`;
    }

    _setActionsOpen(open) {
      this._actionsOpen = Boolean(open);
      const root = this.shadowRoot;
      const body = root?.querySelector?.('[data-role="actions-body"]');
      if (body) body.hidden = !this._actionsOpen;
      const toggle = root?.querySelector?.('[data-actions-toggle]');
      if (toggle) toggle.setAttribute('aria-expanded', String(this._actionsOpen));
      const label = root?.querySelector?.('[data-role="actions-toggle-label"]');
      if (label) label.textContent = this._t(this._actionsOpen ? 'actions_hide' : 'actions_show');
    }

    async _toggleActions() {
      if (this._actionsOpen) { this._setActionsOpen(false); return false; }
      const confirmed = await this._showDialog({
        title: this._t('actions_warning_title'),
        message: this._t('actions_warning'),
        confirm: true,
        confirmLabel: this._t('actions_open'),
      });
      if (confirmed) this._setActionsOpen(true);
      return Boolean(confirmed);
    }

    // Drops cached history after a deletion so charts and min/max reload instead of showing removed data.
    _resetHistoryCaches() {
      this._statsExtremes = null;
      this._statsExtremesKey = '';
      this._statsExtremesAt = 0;
      this._statsExtremesToken = '';
      this._statsExtremesCursor = NaN;
      this._statsExtremesRequest += 1;
      this._statsExtremesLoading = false;
      this._historyRequest += 1;
      this._historyLoading = false;
      this._voltageHistoryRequest += 1;
      this._voltageHistoryLoading = false;
      this._historyKey = '';
      this._history = [];
      this._voltageHistoryKey = '';
      this._voltageHistory = [];
      this._clearEnergyHistory();
      this._applyStatsExtremes();
      this._ensureStatsExtremes();
      this._ensureHistory();
      if (this._activeTab === 'energy') {
        this._refreshEnergyCharts();
        this._ensureEnergyHistory();
      }
    }

    _updateHistoryCleanupControls() {
      const entityIds = this._panelHistoryEntityIds();
      const sensorIds = entityIds.filter((entityId) => entityId.startsWith('sensor.'));
      for (const [kind, count] of [['recorder', entityIds.length], ['statistics', sensorIds.length]]) {
        const button = this.shadowRoot?.querySelector(`[data-history-delete="${kind}"]`);
        if (button) button.disabled = Boolean(this._historyDeleteInProgress) || count === 0;
      }
    }

    async _deletePanelHistory(kind) {
      if (!['recorder', 'statistics'].includes(kind) || this._historyDeleteInProgress) return false;
      const entityIds = this._panelHistoryEntityIds();
      const targets = kind === 'statistics' ? entityIds.filter((entityId) => entityId.startsWith('sensor.')) : entityIds;
      if (!targets.length) {
        await this._showDialog({ title: this._t('dialog_error_title'), message: this._t('history_delete_empty') });
        return false;
      }

      this._historyDeleteInProgress = kind;
      this._updateHistoryCleanupControls();
      try {
        const isStatistics = kind === 'statistics';
        const prompt = this._t(isStatistics ? 'history_stats_confirm' : 'history_purge_confirm').replace('{count}', String(targets.length));
        const confirmed = await this._showDialog({
          title: this._t('dialog_confirm_title'),
          message: prompt,
          confirm: true,
        });
        if (!confirmed) return false;
        if (isStatistics) {
          if (typeof this._hass?.callWS !== 'function') throw new Error('Home Assistant WebSocket API is unavailable');
          await this._hass.callWS({ type: 'recorder/clear_statistics', statistic_ids: targets });
        } else {
          if (typeof this._hass?.callService !== 'function') throw new Error('Home Assistant service API is unavailable');
          await this._hass.callService('recorder', 'purge_entities', { entity_id: targets, keep_days: 0 });
        }
        const complete = this._t(isStatistics ? 'history_stats_done' : 'history_purge_done').replace('{count}', String(targets.length));
        try { this._resetHistoryCaches(); } catch (_error) { /* the deletion itself succeeded */ }
        if (typeof setTimeout === 'function') setTimeout(() => { try { if (this.isConnected) this._resetHistoryCaches(); } catch (_error) { /* ignore */ } }, 4000);
        await this._showDialog({ title: this._t('history_cleanup_title'), message: complete });
        return true;
      } catch (_error) {
        await this._showDialog({ title: this._t('dialog_error_title'), message: this._t('history_delete_error') });
        return false;
      } finally {
        this._historyDeleteInProgress = false;
        this._updateHistoryCleanupControls();
      }
    }

    _statsStartSetting() {
      const active = Number.isFinite(this._statsStart);
      const hint = active ? `${this._t('stats_active')} ${this._statsStartFullLabel()}` : this._t('stats_hint');
      const createButton = this._canCreateStatsStartHelper() ? `<button class="save-button stats-start-create" type="button" data-stats-helper-create ${this._statsHelperCreating ? 'disabled' : ''}>${this._escape(this._t('stats_create_helper'))}</button>` : '';
      return `<h2 class="subheading">${this._escape(this._t('stats_title'))}</h2><div class="detail stats-start" data-role="stats-start"><label><span>${this._escape(this._t('stats_start_label'))}</span><div class="stats-start-controls"><input type="datetime-local" data-stats-start-input max="${this._formatDateTimeInput(Date.now())}" value="${active ? this._formatDateTimeInput(this._statsStart) : ''}"><button class="save-button" type="button" data-stats-start-apply>${this._escape(this._t('stats_apply'))}</button><button class="save-button ghost" type="button" data-stats-start-clear data-role="stats-start-clear" ${active ? '' : 'disabled'}>${this._escape(this._t('stats_clear'))}</button></div></label><p class="stats-start-hint" data-role="stats-start-hint">${this._escape(hint)}</p><p class="stats-start-sync" data-role="stats-start-sync">${this._escape(this._statsSyncText())}</p>${createButton}<p class="stats-start-error" role="alert" data-role="stats-start-error"></p></div>`;
    }

    _statsSyncText() {
      const ready = this._state('stats_start') && !['unknown', 'unavailable'].includes(this._raw('stats_start'));
      return this._t(ready ? 'stats_sync_saved' : 'stats_sync_missing');
    }

    _updateStatsControls() {
      const active = Number.isFinite(this._statsStart);
      const input = this.shadowRoot.querySelector('[data-stats-start-input]');
      if (input) input.value = active ? this._formatDateTimeInput(this._statsStart) : '';
      const clear = this.shadowRoot.querySelector('[data-role="stats-start-clear"]');
      if (clear) clear.disabled = !active;
      const hint = this.shadowRoot.querySelector('[data-role="stats-start-hint"]');
      if (hint) hint.textContent = active ? `${this._t('stats_active')} ${this._statsStartFullLabel()}` : this._t('stats_hint');
      const error = this.shadowRoot.querySelector('[data-role="stats-start-error"]');
      if (error) error.textContent = '';
      const sync = this.shadowRoot.querySelector('[data-role="stats-start-sync"]');
      if (sync) sync.textContent = this._statsSyncText();
      const createHelper = this.shadowRoot.querySelector('[data-stats-helper-create]');
      if (createHelper) {
        createHelper.hidden = !this._canCreateStatsStartHelper();
        createHelper.disabled = Boolean(this._statsHelperCreating);
      }
    }

    _applyStatsStartInput() {
      const input = this.shadowRoot.querySelector('[data-stats-start-input]');
      const value = input?.value ? new Date(input.value).getTime() : NaN;
      const error = this.shadowRoot.querySelector('[data-role="stats-start-error"]');
      if (!Number.isFinite(value) || value >= Date.now()) {
        if (error) error.textContent = this._t('stats_error');
        return;
      }
      this._setStatsStart(value);
    }

    _setStatsStart(value, persist = true) {
      this._statsStart = value;
      if (persist) this._dropLegacyStatsStart();
      if (persist) this._writeStatsStart(value).then((saved) => {
        this._statsNeedsPersist = !saved && value !== null;
        const sync = this.shadowRoot.querySelector('[data-role="stats-start-sync"]');
        if (sync) sync.textContent = this._t(saved ? 'stats_sync_saved' : 'stats_sync_missing');
      });
      this._statsExtremes = null;
      this._statsExtremesKey = '';
      this._statsExtremesAt = 0;
      this._statsExtremesToken = '';
      this._statsExtremesCursor = NaN;
      this._statsExtremesRequest += 1;
      this._statsExtremesLoading = false;
      this._clearChartScrub();
      this._historyRequest += 1;
      this._historyLoading = false;
      this._voltageHistoryRequest += 1;
      this._voltageHistoryLoading = false;
      this._historyKey = '';
      this._history = [];
      this._voltageHistoryKey = '';
      this._voltageHistory = [];
      this._clearEnergyHistory();
      if (value !== null) {
        this._historyCustomRange = null;
        if (this._historyRange === 'since') {
          this._historyRange = 'day';
          this._historyReturnRange = 'day';
        }
      } else {
        if (this._historyRange === 'since') this._historyRange = 'hour';
        if (this._historyReturnRange === 'since') this._historyReturnRange = 'hour';
      }
      this._updateStatsControls();
      this._applyStatsExtremes();
      this._ensureStatsExtremes();
      this._ensureHistory();
      this._energySelectedBar = null;
      if (this._activeTab === 'energy') {
        this._refreshEnergyCharts();
        this._ensureEnergyHistory();
      }
    }

    _statsExtremesCacheToken() {
      return !Number.isFinite(this._statsStart) ? '' : `${Math.round(this._statsStart)}:${STATS_METRIC_KEYS.map((key) => this._entity(key)).join(',')}`;
    }

    _ensureStatsExtremes() {
      if (!this._hass || !this._config || !Number.isFinite(this._statsStart) || !this._isActive()) return;
      const token = this._statsExtremesCacheToken();
      if (this._statsExtremesLoading && this._statsExtremesToken === token) return;
      if (token === this._statsExtremesKey && Date.now() - this._statsExtremesAt < 60000) return;
      this._loadStatsExtremes(token);
    }

    _computeStatsExtremes(response) {
      const result = {};
      const series = Array.isArray(response) ? response : [];
      const byEntity = new Map(STATS_METRIC_KEYS.map((key) => [this._entity(key), key]));
      const ordered = series.length === STATS_METRIC_KEYS.length;
      const statsStart = Number.isFinite(this._statsStart) ? this._statsStart : null;
      series.forEach((items, index) => {
        if (!Array.isArray(items) || !items.length) return;
        const key = byEntity.get(items[0]?.entity_id) ?? (ordered ? STATS_METRIC_KEYS[index] : undefined);
        if (!key) return;
        const { plausible: [lowest, highest], positiveMin } = STATS_METRICS[key];
        let min = null;
        let max = null;
        items.forEach((item, itemIdx) => {
          const value = item?.state === '' || item?.state === null || item?.state === undefined ? NaN : Number(item.state);
          if (!Number.isFinite(value) || value < lowest || value > highest) return;
          if (statsStart !== null) {
            const itemTime = new Date(item.last_changed || item.last_updated).getTime();
            if (Number.isFinite(itemTime) && itemTime < statsStart) {
              const nextItem = items[itemIdx + 1];
              const nextTime = nextItem ? new Date(nextItem.last_changed || nextItem.last_updated).getTime() : NaN;
              if (Number.isFinite(nextTime) && nextTime <= statsStart) return;
            }
          }
          if (max === null || value > max) max = value;
          if ((!positiveMin || value > 0) && (min === null || value < min)) min = value;
        });
        result[key] = { min, max };
      });
      return result;
    }

    _mergeStatsExtremes(previous, fresh) {
      const merged = { ...(previous || {}) };
      Object.entries(fresh || {}).forEach(([key, next]) => {
        const known = merged[key];
        if (!known) { merged[key] = next; return; }
        const lower = (a, b) => (a === null ? b : b === null ? a : Math.min(a, b));
        const upper = (a, b) => (a === null ? b : b === null ? a : Math.max(a, b));
        merged[key] = { min: lower(known.min, next.min), max: upper(known.max, next.max) };
      });
      return merged;
    }

    // The first load reads everything since the statistics start. Later refreshes read only what
    // is new (with a small overlap for late recorder writes) and merge it into the known extremes.
    async _loadStatsExtremes(token) {
      if (!this._hass || !Number.isFinite(this._statsStart)) return;
      const hass = this._hass;
      const request = ++this._statsExtremesRequest;
      this._statsExtremesLoading = true;
      this._statsExtremesToken = token;
      const end = new Date();
      const incremental = token === this._statsExtremesKey && Boolean(this._statsExtremes) && Number.isFinite(this._statsExtremesCursor);
      const start = new Date(incremental ? Math.max(this._statsStart, this._statsExtremesCursor - STATS_REFRESH_OVERLAP_MS) : this._statsStart);
      try {
        if (typeof hass.callApi !== 'function') throw new Error('History API unavailable');
        const ids = STATS_METRIC_KEYS.map((key) => encodeURIComponent(this._entity(key))).join(',');
        const path = `history/period/${encodeURIComponent(start.toISOString())}?filter_entity_id=${ids}&end_time=${encodeURIComponent(end.toISOString())}&minimal_response&no_attributes`;
        const response = await hass.callApi('GET', path);
        if (request !== this._statsExtremesRequest) return;
        const fresh = this._computeStatsExtremes(response);
        this._statsExtremes = incremental ? this._mergeStatsExtremes(this._statsExtremes, fresh) : fresh;
        this._statsExtremesCursor = end.getTime();
      } catch (_error) {
        if (request !== this._statsExtremesRequest) return;
        if (!incremental) {
          this._statsExtremes = {};
          this._statsExtremesCursor = NaN;
        }
      } finally {
        if (request === this._statsExtremesRequest) {
          this._statsExtremesKey = token;
          this._statsExtremesAt = Date.now();
          this._statsExtremesLoading = false;
          this._applyStatsExtremes();
        }
      }
    }

    _applyStatsExtremes() {
      this._updateValueBindings(new Set(Object.keys(STATS_OVERRIDES)));
      if (this._activeTab === 'params') this._updateRange();
    }

    _formatDateTimeInput(timestamp) {
      if (!Number.isFinite(timestamp)) return '';
      const when = new Date(timestamp);
      return new Date(timestamp - when.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    _formatDateInput(timestamp) {
      if (!Number.isFinite(timestamp)) return '';
      const when = new Date(timestamp);
      return new Date(timestamp - when.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    }

    // The statistics start from the settings is the earliest moment either period picker accepts.
    _chartDateRangeMin() {
      return Number.isFinite(this._statsStart) ? this._formatDateInput(this._statsStart) : '';
    }

    _chartDateRangeMax() {
      return this._formatDateInput(Date.now());
    }

    _clampChartDateInput(input) {
      const min = this._chartDateRangeMin();
      const max = this._chartDateRangeMax();
      if (input?.value && min && input.value < min) input.value = min;
      if (input?.value && max && input.value > max) input.value = max;
    }

    _chartDateInput(scope, field) {
      const isEnergy = scope === 'energy';
      const selector = field === 'start'
        ? (isEnergy ? '[data-energy-chart-date-start]' : '[data-chart-date-start]')
        : (isEnergy ? '[data-energy-chart-date-end]' : '[data-chart-date-end]');
      return this.shadowRoot?.querySelector(selector) || null;
    }

    _formatChartDateLabel(value) {
      if (!value) return '';
      const date = new Date(`${value}T12:00:00`);
      if (!Number.isFinite(date.getTime())) return value;
      return date.toLocaleDateString(this._locale(), { day: 'numeric', month: 'short', year: 'numeric' });
    }

    _chartCalendarLimits(scope, field) {
      let min = this._chartDateRangeMin();
      let max = this._chartDateRangeMax();
      const start = this._chartDateInput(scope, 'start')?.value || '';
      const end = this._chartDateInput(scope, 'end')?.value || '';
      if (field === 'start' && end && (!max || end < max)) max = end;
      if (field === 'end' && start && (!min || start > min)) min = start;
      return { min, max };
    }

    _chartCalendarContentHtml(scope, field, monthKey) {
      const [year, month] = monthKey.split('-').map(Number);
      if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return '';
      const limits = this._chartCalendarLimits(scope, field);
      const minMonth = limits.min.slice(0, 7);
      const maxMonth = limits.max.slice(0, 7);
      const previous = new Date(year, month - 2, 1);
      const next = new Date(year, month, 1);
      const monthKeyFor = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const previousDisabled = Boolean(minMonth && monthKeyFor(previous) < minMonth);
      const nextDisabled = Boolean(maxMonth && monthKeyFor(next) > maxMonth);
      const title = new Date(year, month - 1, 1).toLocaleDateString(this._locale(), { month: 'long', year: 'numeric' });
      const weekdays = Array.from({ length: 7 }, (_, index) => new Date(Date.UTC(2024, 0, 1 + index))
        .toLocaleDateString(this._locale(), { weekday: 'short' }));
      const selected = this._chartDateInput(scope, field)?.value || '';
      const today = this._formatDateInput(Date.now());
      const first = new Date(year, month - 1, 1);
      const mondayOffset = (first.getDay() + 6) % 7;
      const gridStart = new Date(year, month - 1, 1 - mondayOffset);
      const days = Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
        const key = this._formatDateInput(date.getTime());
        const disabled = (limits.min && key < limits.min) || (limits.max && key > limits.max);
        const classes = ['chart-calendar-day', date.getMonth() !== month - 1 ? 'outside-month' : '', key === selected ? 'selected' : '', key === today ? 'today' : '', disabled ? 'is-disabled' : ''].filter(Boolean).join(' ');
        const label = date.toLocaleDateString(this._locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        return `<button type="button" class="${classes}" data-chart-calendar-day="${key}" data-chart-scope="${scope}" aria-label="${this._escape(label)}" aria-pressed="${key === selected}"${key === today ? ' aria-current="date"' : ''}${disabled ? ' disabled aria-disabled="true"' : ''}>${date.getDate()}</button>`;
      }).join('');
      return `<div class="chart-calendar-heading"><button type="button" class="chart-calendar-nav" data-chart-calendar-nav="-1" data-chart-scope="${scope}" aria-label="${this._escape(this._t('chart_calendar_previous'))}"${previousDisabled ? ' disabled' : ''}>‹</button><strong>${this._escape(title)}</strong><button type="button" class="chart-calendar-nav" data-chart-calendar-nav="1" data-chart-scope="${scope}" aria-label="${this._escape(this._t('chart_calendar_next'))}"${nextDisabled ? ' disabled' : ''}>›</button></div><div class="chart-calendar-weekdays" aria-hidden="true">${weekdays.map((day) => `<span>${this._escape(day)}</span>`).join('')}</div><div class="chart-calendar-days">${days}</div>`;
    }

    _renderChartDateCalendar() {
      const state = this._chartCalendarState;
      if (!state) return;
      const panel = this.shadowRoot.querySelector(`.chart-date-range-panel[data-range-scope="${state.scope}"]`);
      const calendar = panel?.querySelector('[data-chart-calendar]');
      if (!calendar) return;
      calendar.innerHTML = this._chartCalendarContentHtml(state.scope, state.field, state.month);
      calendar.hidden = false;
      const fieldButton = panel.querySelector(`[data-chart-calendar-open][data-chart-field="${state.field}"]`);
      if (fieldButton) fieldButton.setAttribute('aria-expanded', 'true');
      const trigger = this.shadowRoot.querySelector(`[data-chart-date-toggle][data-chart-scope="${state.scope}"]`);
      this._positionChartDateRangePopover(trigger, panel);
    }

    _openChartDateCalendar(scope, field) {
      if (!['params', 'energy'].includes(scope) || !['start', 'end'].includes(field)) return;
      const panel = this.shadowRoot.querySelector(`.chart-date-range-panel[data-range-scope="${scope}"]`);
      const input = this._chartDateInput(scope, field);
      if (!panel || !input) return;
      const value = input.value || this._formatDateInput(Date.now());
      this._chartCalendarState = { scope, field, month: value.slice(0, 7) };
      this._renderChartDateCalendar();
    }

    _closeChartCalendar(scope = null) {
      const state = this._chartCalendarState;
      if (!state || (scope && state.scope !== scope)) return;
      const panel = this.shadowRoot.querySelector(`.chart-date-range-panel[data-range-scope="${state.scope}"]`);
      const calendar = panel?.querySelector('[data-chart-calendar]');
      if (calendar) { calendar.hidden = true; calendar.innerHTML = ''; }
      const fieldButton = panel?.querySelector(`[data-chart-calendar-open][data-chart-field="${state.field}"]`);
      if (fieldButton) fieldButton.setAttribute('aria-expanded', 'false');
      this._chartCalendarState = null;
    }

    _handleChartDateDocumentPointerDown(event) {
      if (!this._chartCalendarState) return;
      const path = typeof event?.composedPath === 'function' ? event.composedPath() : [event?.target];
      const calendarControl = path.some((node) => node?.matches?.('[data-chart-calendar-day], [data-chart-calendar-nav], [data-chart-calendar-open]'));
      if (calendarControl) return;
      const insideRange = path.some((node) => node?.matches?.('.chart-date-range'));
      if (insideRange) this._closeChartCalendar();
      else this._closeChartDateRangePopover();
    }

    _handleChartDateDocumentScroll() {
      if (this._chartCalendarState) this._closeChartDateRangePopover();
    }

    _handleChartDatePointerDown(event) {
      if (!this.shadowRoot) return;
      const target = event.target;
      const calendar = this.shadowRoot.querySelector('[data-chart-calendar]:not([hidden])');
      if (calendar && !calendar.contains(target)) this._closeChartCalendar();
      if (!target?.closest?.('.chart-date-range')) this._closeChartDateRangePopover();
    }

    _navigateChartDateCalendar(delta, scope) {
      const state = this._chartCalendarState;
      if (!state || state.scope !== scope) return;
      const [year, month] = state.month.split('-').map(Number);
      const next = new Date(year, month - 1 + delta, 1);
      state.month = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
      this._renderChartDateCalendar();
    }

    _selectChartCalendarDate(value, scope) {
      const state = this._chartCalendarState;
      if (!state || state.scope !== scope) return;
      const limits = this._chartCalendarLimits(scope, state.field);
      if ((limits.min && value < limits.min) || (limits.max && value > limits.max)) return;
      const input = this._chartDateInput(scope, state.field);
      if (!input) return;
      input.value = value;
      const panel = this.shadowRoot.querySelector(`.chart-date-range-panel[data-range-scope="${scope}"]`);
      const button = panel?.querySelector(`[data-chart-calendar-open][data-chart-field="${state.field}"]`);
      const display = panel?.querySelector(`[data-chart-date-value="${state.field}"]`);
      const label = this._formatChartDateLabel(value);
      if (display) display.textContent = label;
      if (button) button.setAttribute('aria-label', `${this._t(state.field === 'start' ? 'chart_from' : 'chart_to')}: ${label}`);
      this._closeChartCalendar(scope);
    }

    _chartDateRangeHtml(scope = 'params') {
      const isEnergy = scope === 'energy';
      const bounds = isEnergy ? this._energyHistoryBounds() : this._historyBounds();
      const startKey = isEnergy ? 'data-energy-chart-date-start' : 'data-chart-date-start';
      const endKey = isEnergy ? 'data-energy-chart-date-end' : 'data-chart-date-end';
      const isCustom = isEnergy ? this._energyHistoryRange === 'custom' : this._historyRange === 'custom';
      const popoverId = `${this._instanceId}-${scope}-chart-date-range`;
      const calendarId = `${this._instanceId}-${scope}-chart-date-calendar`;
      const startVal = this._formatDateInput(bounds.start);
      const endVal = this._formatDateInput(bounds.end > bounds.start ? bounds.end - 1 : bounds.end);
      const field = (key, name, value) => `<div class="chart-date-field"><span>${this._escape(this._t(name === 'start' ? 'chart_from' : 'chart_to'))}</span><button type="button" class="chart-date-value" data-chart-calendar-open data-chart-scope="${scope}" data-chart-field="${name}" aria-controls="${calendarId}" aria-expanded="false" aria-label="${this._escape(this._t(name === 'start' ? 'chart_from' : 'chart_to'))}: ${this._escape(this._formatChartDateLabel(value))}"><span data-chart-date-value="${name}">${this._escape(this._formatChartDateLabel(value))}</span><span class="chart-date-caret" aria-hidden="true">▾</span></button><input type="hidden" ${key} value="${this._escape(value)}"></div>`;
      return `<div class="chart-date-range ${isCustom ? 'active' : ''}"><button type="button" class="period-button ${isCustom ? 'active' : ''}" data-chart-date-toggle data-chart-scope="${scope}" aria-controls="${popoverId}" aria-haspopup="dialog" aria-expanded="false" aria-pressed="${isCustom}">${this._escape(this._t('chart_date_range'))}</button><div class="chart-date-range-panel" id="${popoverId}" data-range-scope="${scope}" popover="auto" hidden role="dialog" aria-label="${this._escape(this._t('chart_date_range'))}"><div class="chart-date-fields">${field(startKey, 'start', startVal)}${field(endKey, 'end', endVal)}</div><div class="chart-date-calendar" id="${calendarId}" data-chart-calendar hidden role="group" aria-label="${this._escape(this._t('chart_date_range'))}"></div><button type="button" class="chart-date-apply" data-chart-date-apply data-chart-scope="${scope}">${this._escape(this._t('chart_apply'))}</button><small data-role="chart-date-error" aria-live="polite"></small></div></div>`;
    }

    _closeChartDateRangePopover(panel = null) {
      const panels = panel ? [panel] : [...this.shadowRoot.querySelectorAll('.chart-date-range-panel')];
      panels.forEach((item) => {
        this._closeChartCalendar(item.dataset.rangeScope);
        try { if (item.matches(':popover-open')) item.hidePopover(); } catch (_error) {}
        item.hidden = true;
        const trigger = this.shadowRoot.querySelector(`[aria-controls="${item.id}"]`);
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    }

    _positionChartDateRangePopover(trigger, panel) {
      if (!trigger || !panel) return;
      const anchor = trigger.getBoundingClientRect();
      panel.hidden = false;
      panel.style.maxHeight = '';
      if (typeof panel.showPopover === 'function') {
        let isOpen = false;
        try { isOpen = panel.matches(':popover-open'); } catch (_error) {}
        if (!isOpen) panel.showPopover();
      } else panel.removeAttribute('popover');
      const size = panel.getBoundingClientRect();
      const margin = 8;
      const left = Math.max(margin, Math.min(anchor.right - size.width, window.innerWidth - size.width - margin));
      const below = anchor.bottom + margin;
      let top = below + size.height <= window.innerHeight - margin
        ? below : Math.max(margin, anchor.top - size.height - margin);
      const tabRects = this._visibleTabRects();
      const overlapsTab = (candidate) => {
        const rect = { left, right: left + size.width, top: candidate, bottom: candidate + size.height, width: size.width, height: size.height };
        return tabRects.some((tabRect) => this._rectanglesOverlap(rect, tabRect));
      };
      if (overlapsTab(top) && tabRects.length) {
        const tabTop = Math.min(...tabRects.map((rect) => rect.top));
        const tabBottom = Math.max(...tabRects.map((rect) => rect.bottom));
        const candidates = [
          Math.max(top, tabBottom + margin),
          tabTop - size.height - margin,
        ].filter((candidate) => candidate >= margin && candidate + size.height <= window.innerHeight - margin && !overlapsTab(candidate));
        if (candidates.length) top = candidates.sort((a, b) => Math.abs(a - top) - Math.abs(b - top))[0];
        else if (tabBottom + margin < window.innerHeight - margin) {
          top = tabBottom + margin;
          panel.style.maxHeight = `${window.innerHeight - top - margin}px`;
        }
      }
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      trigger.setAttribute('aria-expanded', 'true');
    }

    _updateChartDateRangeControls(scope = 'params') {
      const isEnergy = scope === 'energy';
      const bounds = isEnergy ? this._energyHistoryBounds() : this._historyBounds();
      const start = this.shadowRoot.querySelector(isEnergy ? '[data-energy-chart-date-start]' : '[data-chart-date-start]');
      const end = this.shadowRoot.querySelector(isEnergy ? '[data-energy-chart-date-end]' : '[data-chart-date-end]');
      const minVal = this._chartDateRangeMin();
      const maxVal = this._chartDateRangeMax();
      if (start) {
        start.value = this._formatDateInput(bounds.start);
        if (minVal) start.setAttribute('min', minVal); else start.removeAttribute('min');
        if (maxVal) start.setAttribute('max', maxVal); else start.removeAttribute('max');
      }
      if (end) end.value = this._formatDateInput(bounds.end > bounds.start ? bounds.end - 1 : bounds.end);
      const scopePanel = this.shadowRoot.querySelector(`.chart-date-range-panel[data-range-scope="${scope}"]`);
      ['start', 'end'].forEach((field) => {
        const button = scopePanel?.querySelector(`[data-chart-calendar-open][data-chart-field="${field}"]`);
        const value = scopePanel?.querySelector(`[data-chart-date-value="${field}"]`);
        const label = this._formatChartDateLabel(this._chartDateInput(scope, field)?.value || '');
        if (value) value.textContent = label;
        if (button) button.setAttribute('aria-label', `${this._t(field === 'start' ? 'chart_from' : 'chart_to')}: ${label}`);
      });
      const error = scopePanel?.querySelector('[data-role="chart-date-error"]');
      if (error) error.textContent = '';
      this._syncChartPeriodHighlight(scope);
    }

    // Highlights exactly one control above the chart: the period picker button for a custom period, otherwise the matching preset.
    _syncChartPeriodHighlight(scope = 'params') {
      const isEnergy = scope === 'energy';
      const current = isEnergy ? this._energyHistoryRange : this._historyRange;
      const isCustom = current === 'custom';
      const toggle = this.shadowRoot.querySelector(`[data-chart-date-toggle][data-chart-scope="${scope}"]`);
      if (toggle) {
        toggle.classList.toggle('active', isCustom);
        toggle.setAttribute('aria-pressed', String(isCustom));
        toggle.parentElement?.classList.toggle('active', isCustom);
      }
      const presetAttr = isEnergy ? 'data-energy-period' : 'data-period';
      this.shadowRoot.querySelectorAll(`[${presetAttr}]`).forEach((button) => {
        const active = button.getAttribute(presetAttr) === current;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }

    _applyChartDateRange(scope = 'params') {
      const isEnergy = scope === 'energy';
      const startInput = this.shadowRoot.querySelector(isEnergy ? '[data-energy-chart-date-start]' : '[data-chart-date-start]');
      const endInput = this.shadowRoot.querySelector(isEnergy ? '[data-energy-chart-date-end]' : '[data-chart-date-end]');
      this._clampChartDateInput(startInput);
      this._clampChartDateInput(endInput);
      let start = startInput?.value ? new Date(`${startInput.value}T00:00:00`).getTime() : NaN;
      let end = NaN;
      if (endInput?.value) {
        const endDay = new Date(`${endInput.value}T00:00:00`);
        endDay.setDate(endDay.getDate() + 1);
        end = Math.min(endDay.getTime(), Date.now());
      }
      // A moment earlier than the statistics start is never accepted; it is moved to the start instead of warning.
      if (Number.isFinite(this._statsStart)) {
        start = Math.max(start, this._statsStart);
        end = Math.max(end, this._statsStart);
      }
      const scopePanel = this.shadowRoot.querySelector(`.chart-date-range-panel[data-range-scope="${scope}"]`);
      const error = scopePanel?.querySelector('[data-role="chart-date-error"]');
      if (!Number.isFinite(start) || !Number.isFinite(end) || (startInput?.value && endInput?.value && startInput.value > endInput.value) || end <= start) {
        if (error) error.textContent = this._t('chart_date_error');
        return;
      }
      if (error) error.textContent = '';
      this._setCustomChartRange(start, end, scope);
    }

    _setCustomChartRange(start, end, scope = 'params') {
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;
      if (scope === 'energy') {
        if (this._energyHistoryRange !== 'custom') this._energyReturnRange = this._energyHistoryRange;
        this._energyCustomRange = { start, end };
        this._energyHistoryRange = 'custom';
        this._updateChartDateRangeControls('energy');
        this._closeChartDateRangePopover();
        this._clearEnergyHistory();
        this._refreshEnergyCharts();
        this._ensureEnergyHistory();
        return;
      }
      if (Number.isFinite(this._statsStart)) {
        start = Math.max(start, this._statsStart);
        if (end <= start) end = Math.min(Date.now(), start + 60e3);
      }
      if (this._historyRange !== 'custom') this._historyReturnRange = this._historyRange;
      this._historyCustomRange = { start, end };
      this._historyRange = 'custom';
      this._clearChartScrub();
      this._updateChartDateRangeControls();
      this._closeChartDateRangePopover();
      this._reloadChartHistory();
    }

    _zoomChart(direction) {
      const bounds = this._chartTimeBounds();
      if (!bounds || !Number.isFinite(bounds.tStart) || !Number.isFinite(bounds.tEnd) || bounds.rangeMs <= 0) return;
      const minRange = 60e3;
      const maxRange = 366 * 24 * 3600e3;
      const nextRange = Math.max(minRange, Math.min(maxRange, bounds.rangeMs * (direction === 'in' ? 0.5 : 2)));
      const center = (bounds.tStart + bounds.tEnd) / 2;
      let start = center - nextRange / 2;
      let end = center + nextRange / 2;
      if (end > Date.now()) { start -= end - Date.now(); end = Date.now(); }
      if (Number.isFinite(this._statsStart) && start < this._statsStart) {
        start = this._statsStart;
      }
      if (end <= start) end = Math.min(Date.now(), start + minRange);
      this._setCustomChartRange(start, end);
    }

    _chartScrubberHtml() {
      const selected = this._scrubTime !== null;
      const label = selected ? this._formatChartTimestamp(this._scrubTime) : this._t('chart_select_time');
      const canReturnToLive = selected || this._historyRange === 'custom';
      return `<div class="chart-scrubber"><span class="chart-scrubber-label" data-role="chart-selected-time">${this._escape(label)}</span><input type="range" min="0" max="1000" step="1" value="${this._chartScrubPosition()}" data-role="chart-scrubber" aria-label="${this._escape(this._t('chart_select_time'))}" ${this._chartPts.length ? '' : 'disabled'}><button class="chart-live-button" type="button" data-chart-live ${canReturnToLive ? '' : 'disabled'}>${this._escape(this._t('chart_live'))}</button></div>`;
    }

    _chartReadingsHtml() {
      const selected = this._scrubTime !== null;
      const readings = CHART_READINGS.map(({ key, label, digits }) => `<div class="chart-reading"><span>${this._escape(this._t(label))}</span><strong data-chart-reading="${key}">${this._escape(this._formatChartReading(key, digits))}</strong></div>`).join('');
      return `<section class="chart-readings" data-role="chart-readings" aria-live="polite" ${selected ? '' : 'hidden'}><div class="chart-readings-head"><h3>${this._escape(this._t('chart_readings'))}</h3><span data-role="chart-readings-time">${selected ? this._escape(this._formatChartTimestamp(this._scrubTime)) : ''}</span><span class="chart-readings-status" data-role="chart-readings-status"></span></div><div class="chart-reading-grid">${readings}</div></section>`;
    }

    _formatChartTimestamp(timestamp) {
      const when = new Date(timestamp);
      const date = when.toLocaleDateString(this._locale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
      const time = when.toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      return `${date} · ${time}`;
    }

    _chartTimeBounds() {
      const chart = this.shadowRoot?.querySelector('svg.chart');
      const chartStart = Number(chart?.dataset.chartStart);
      const chartEnd = Number(chart?.dataset.chartEnd);
      if (Number.isFinite(chartStart) && Number.isFinite(chartEnd) && chartEnd > chartStart) {
        return { tStart: chartStart, tEnd: chartEnd, rangeMs: chartEnd - chartStart };
      }
      return this._chartData();
    }

    _chartScrubPosition() {
      if (this._scrubTime === null) return 1000;
      const data = this._chartTimeBounds();
      if (!data || data.rangeMs <= 0) return 1000;
      return Math.max(0, Math.min(1000, Math.round(((this._scrubTime - data.tStart) / data.rangeMs) * 1000)));
    }

    _formatChartReading(key, digits) {
      const value = this._chartReadings?.[key];
      if (!Number.isFinite(value)) return '—';
      const number = value.toLocaleString(this._locale(), { maximumFractionDigits: digits });
      const unit = this._unit(key);
      return unit ? `${number} ${unit}` : number;
    }

    _updateChartReadings() {
      const panel = this.shadowRoot.querySelector('[data-role="chart-readings"]');
      if (!panel) return;
      const selected = this._scrubTime !== null;
      panel.hidden = !selected;
      if (!selected) return;
      const time = panel.querySelector('[data-role="chart-readings-time"]');
      if (time) time.textContent = this._formatChartTimestamp(this._scrubTime);
      CHART_READINGS.forEach(({ key, digits }) => {
        const node = panel.querySelector(`[data-chart-reading="${key}"]`);
        if (node) node.textContent = this._formatChartReading(key, digits);
      });
      const status = panel.querySelector('[data-role="chart-readings-status"]');
      if (!status) return;
      const hasValue = CHART_READINGS.some(({ key }) => Number.isFinite(this._chartReadings?.[key]));
      const loading = this._chartReadingsLoading && this._chartReadingsRequestTime === this._scrubTime;
      status.textContent = loading || this._chartReadingsAt !== this._scrubTime && !this._chartReadingsError
        ? this._t('chart_readings_loading')
        : this._chartReadingsError || !hasValue ? this._t('chart_readings_unavailable') : '';
    }

    _formatChartStatTimestamp(timestamp, range = this._historyRange, customRange = this._historyCustomRange) {
      if (!Number.isFinite(timestamp)) return '';
      const when = new Date(timestamp);
      if (range === 'week' || range === 'month') {
        return when.toLocaleDateString(this._locale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
      if ((range === 'custom' && customRange?.end - customRange?.start > 24 * 3600e3) || (range === 'since' && Number.isFinite(this._statsStart) && Date.now() - this._statsStart > 24 * 3600e3)) {
        return when.toLocaleString(this._locale(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
      }
      return when.toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    _chartStatsHtml(metricKey = this._chartMetric || 'power', history = this._history, scope = 'params') {
      const isEnergy = scope === 'energy';
      const metric = CHART_METRICS[metricKey];
      if (isEnergy && metricKey === 'energy_total' && this._energyHistoryUnitFactor(metricKey) === null) {
        return `<div class="chart-empty">${this._escape(this._t('energy_unit_unsupported'))}</div>`;
      }
      const range = isEnergy ? this._energyHistoryRange : this._historyRange;
      const customRange = isEnergy ? this._energyCustomRange : this._historyCustomRange;
      const bounds = isEnergy ? this._energyHistoryBounds() : this._historyBounds();
      const energyBars = isEnergy ? this._energyHistoryBars(history, bounds, range) : null;
      const dailyEnergyBars = isEnergy && (range === 'week' || range === 'month' || range === 'custom' && bounds.end - bounds.start > 24 * 3600e3);
      const maxLabel = isEnergy ? this._t(dailyEnergyBars ? 'energy_max_day' : 'energy_max_hour') : this._t('stat_max');
      const data = isEnergy ? null : this._chartData(history, metricKey, { range, customRange, bounds, includeCurrent: true });
      const plottedPoints = isEnergy
        ? energyBars.map((bar) => ({ t: bar.start, v: bar.value }))
        : (data?.series || []).filter((point) => Number.isFinite(point.v) && (!Number.isFinite(this._statsStart) || point.t >= this._statsStart));
      const minimumPoints = metricKey === 'power' ? plottedPoints.filter((point) => point.v > 0) : plottedPoints;
      const historyPoints = isEnergy ? [] : (Array.isArray(history) ? history : [])
        .filter((item) => !Number.isFinite(this._statsStart) || (item.time && item.time.getTime() >= this._statsStart))
        .filter((item) => Number.isFinite(item.value));
      const fmt = (value) => value.toLocaleString(this._locale(), { maximumFractionDigits: metric.digits });
      const formatMinimum = (value) => {
        if (value === null) return '—';
        if (metricKey !== 'power') return fmt(value);
        if (Number(value.toFixed(1)) === 0) {
          const precisionFloor = (0.1).toLocaleString(this._locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
          return `<${precisionFloor}`;
        }
        return value.toLocaleString(this._locale(), { maximumFractionDigits: 1 });
      };
      const minPoint = minimumPoints.reduce((best, point) => !best || point.v < best.v ? point : best, null);
      const maxPoint = plottedPoints.reduce((best, point) => !best || point.v > best.v ? point : best, null);
      const min = minPoint?.v ?? null;
      const max = maxPoint?.v ?? null;
      let avg = null;
      if (isEnergy && energyBars.length) {
        avg = energyBars.reduce((sum, bar) => sum + bar.value, 0) / energyBars.length;
      } else if (!isEnergy && historyPoints.length) {
        avg = historyPoints.reduce((sum, point) => sum + point.value, 0) / historyPoints.length;
      }
      const unit = metric.unit(this._lang(), this._currencyCode());
      const cell = (label, value, formatter = fmt, point = null) => {
        const timestamp = Number.isFinite(point?.t) ? `<small>${this._escape(this._formatChartStatTimestamp(point.t, range, customRange))}</small>` : '';
        return `<div><span>${this._escape(label)}</span><b>${this._escape(value === null ? '—' : `${formatter(value)} ${unit}`)}</b>${timestamp}</div>`;
      };
      return cell(this._t('stat_min'), min, formatMinimum, minPoint) + cell(this._t('stat_avg'), avg) + cell(maxLabel, max, fmt, maxPoint);
    }

    _historyBounds(range = this._historyRange, now = Date.now(), customRange = this._historyCustomRange) {
      if (range === 'since' && Number.isFinite(this._statsStart)) return { start: this._statsStart, end: now };
      if (range === 'custom' && customRange) {
        let start = customRange.start;
        let end = customRange.end;
        if (Number.isFinite(this._statsStart)) {
          start = Math.max(start, this._statsStart);
          end = Math.max(end, start);
        }
        return { start, end };
      }
      const end = new Date(now);
      let start;
      if (range === 'hour') {
        start = new Date(end.getTime() - RANGES.hour * 3600e3);
      } else {
        start = new Date(end);
        start.setHours(0, 0, 0, 0);
        if (range === 'week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        else if (range === 'month') start.setDate(1);
      }
      let startTime = start.getTime();
      if (Number.isFinite(this._statsStart)) {
        startTime = Math.max(startTime, this._statsStart);
      }
      return { start: startTime, end: Math.max(end.getTime(), startTime) };
    }

    _historyWindowToken() {
      if (this._historyRange === 'since' && Number.isFinite(this._statsStart)) return `:since:${Math.round(this._statsStart)}`;
      if (this._historyRange !== 'custom' || !this._historyCustomRange) return '';
      return `:custom:${Math.round(this._historyCustomRange.start)}:${Math.round(this._historyCustomRange.end)}`;
    }

    _chartPanShiftForDelta(deltaX, rangeMs, plotWidth) {
      if (![deltaX, rangeMs, plotWidth].every(Number.isFinite) || rangeMs <= 0 || plotWidth <= 0) return 0;
      return Math.round((deltaX * rangeMs) / plotWidth);
    }

    _chartPointerDistance(points) {
      if (!points || points.length < 2) return 1;
      const dx = points[1].x - points[0].x;
      const dy = points[1].y - points[0].y;
      return Math.max(1, Math.hypot(dx, dy));
    }

    _chartPointerDown(event) {
      const plot = event.target?.closest?.('[data-role="chart-plot"]');
      if (!plot || !this._chartPts.length) return;
      const pointerId = event.pointerId;
      const point = { x: event.clientX, y: event.clientY };
      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        if (this._chartPointers.size >= 2) return;
        this._chartPointers.set(pointerId, point);
        try { plot.setPointerCapture(pointerId); } catch (_error) {}
        if (this._chartPointers.size === 2) {
          this._chartTouchScrubbing = null;
          this._beginChartPan(plot, 'touch', [...this._chartPointers.keys()]);
        } else if (this._chartPointers.size === 1) {
          this._chartTouchScrubbing = pointerId;
          this._chartScrubAtClientX(event.clientX);
        }
        event.preventDefault?.();
        return;
      }
      if (event.button !== 0) return;
      this._chartPointers.clear();
      this._chartPointers.set(pointerId, point);
      this._beginChartPan(plot, event.pointerType || 'mouse', [pointerId]);
      try { plot.setPointerCapture(pointerId); } catch (_error) {}
      event.preventDefault?.();
    }

    _beginChartPan(plot, pointerType, pointerIds) {
      const chart = plot.querySelector('svg.chart');
      const bounds = this._chartTimeBounds();
      if (!chart || !bounds?.rangeMs || !pointerIds.length) return;
      const rect = chart.getBoundingClientRect();
      const chartWidth = Number(chart.dataset.chartW) || rect.width;
      const x0 = Number(chart.dataset.chartX0) || 0;
      const x1 = Number(chart.dataset.chartX1) || chartWidth;
      const plotWidth = rect.width * (x1 - x0) / chartWidth;
      const points = pointerIds.map((id) => this._chartPointers.get(id)).filter(Boolean);
      if (!rect.width || !plotWidth || points.length !== pointerIds.length) return;
      const startX = points.reduce((sum, current) => sum + current.x, 0) / points.length;
      this._chartPan = {
        plot, pointerType, pointerIds, startX, deltaX: 0,
        rangeMs: bounds.rangeMs, plotWidth, startDistance: pointerType === 'touch' ? this._chartPointerDistance(points) : 1,
        currentDistance: pointerType === 'touch' ? this._chartPointerDistance(points) : 1,
        tStart: bounds.tStart, tEnd: bounds.tEnd,
        live: false, committed: false, fetching: false, blockedUntil: 0,
        buf: { start: bounds.tStart, end: this._historyAt || Date.now(), items: Array.isArray(this._history) ? this._history.slice() : [] },
      };
      plot.classList.add('is-panning');
      this._panEnsureBuffer(this._chartPan, bounds.tStart - bounds.rangeMs, Date.now());
    }

    _chartPointerMove(event) {
      const pan = this._chartPan;
      if (!pan || !pan.pointerIds.includes(event.pointerId)) return;
      this._chartPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const points = pan.pointerIds.map((id) => this._chartPointers.get(id)).filter(Boolean);
      if (points.length !== pan.pointerIds.length) return;
      const currentX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
      pan.deltaX = currentX - pan.startX;
      pan.currentDistance = pan.pointerType === 'touch' ? this._chartPointerDistance(points) : 1;
      this._panLive(pan);
      event.preventDefault?.();
    }

    _chartPanTarget(pan) {
      const minRange = 60e3;
      const maxRange = 366 * 24 * 3600e3;
      const scale = pan.pointerType === 'touch' && pan.currentDistance > 0 ? pan.startDistance / pan.currentDistance : 1;
      const nextRange = Math.max(minRange, Math.min(maxRange, pan.rangeMs * scale));
      const shift = this._chartPanShiftForDelta(pan.deltaX, pan.rangeMs, pan.plotWidth);
      const center = (pan.tStart + pan.tEnd) / 2 - shift;
      let start = center - nextRange / 2;
      let end = center + nextRange / 2;
      if (end > Date.now()) { start -= end - Date.now(); end = Date.now(); }
      if (Number.isFinite(this._statsStart) && start < this._statsStart) {
        start = this._statsStart;
      }
      if (end <= start) end = Math.min(Date.now(), start + minRange);
      return { start, end };
    }

    // Moves the already drawn curve together with the fingers; the real range is committed on release.
    _chartPanPreview(pan = this._chartPan) {
      if (!pan?.plot?.isConnected) return;
      const chart = pan.plot.querySelector('svg.chart');
      const group = chart?.querySelector('[data-role="chart-data"]');
      if (!chart || !group) return;
      const x0 = Number(chart.dataset.chartX0) || 0;
      const x1 = Number(chart.dataset.chartX1) || 0;
      const { start, end } = this._chartPanTarget(pan);
      const range = end - start;
      if (!(range > 0) || !(x1 > x0)) return;
      const k = pan.rangeMs / range;
      const tx = x0 * (1 - k) + ((pan.tStart - start) / range) * (x1 - x0);
      group.setAttribute('transform', `matrix(${k.toFixed(5)} 0 0 1 ${tx.toFixed(2)} 0)`);
      const longRange = this._historyRange === 'week' || this._historyRange === 'month' || range > 24 * 3600e3;
      chart.querySelectorAll('[data-time-tick]').forEach((label) => {
        const time = new Date(start + range * Number(label.dataset.timeTick) / 4);
        label.textContent = longRange
          ? time.toLocaleDateString(this._locale(), { day: '2-digit', month: '2-digit' })
          : time.toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
      });
    }

    _chartPointerEnd(event) {
      const pan = this._chartPan;
      if (this._chartTouchScrubbing === event.pointerId) {
        this._chartTouchScrubbing = null;
        if (this._scrubTime !== null) this._queueChartReadings(this._scrubTime, true);
      }
      if (!this._chartPointers.has(event.pointerId)) return;
      if (pan?.pointerIds.includes(event.pointerId)) {
        this._chartPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const points = pan.pointerIds.map((id) => this._chartPointers.get(id)).filter(Boolean);
        if (points.length === pan.pointerIds.length) {
          const currentX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
          pan.deltaX = currentX - pan.startX;
          pan.currentDistance = pan.pointerType === 'touch' ? this._chartPointerDistance(points) : 1;
        }
        this._finishChartPan();
      }
      this._chartPointers.delete(event.pointerId);
      const plot = this.shadowRoot?.querySelector?.('[data-role="chart-plot"]');
      if (plot) {
        try { plot.releasePointerCapture(event.pointerId); } catch (_error) {}
      }
    }

    _finishChartPan() {
      const pan = this._chartPan;
      if (!pan) return;
      this._chartPan = null;
      this._chartTouchScrubbing = null;
      pan.plot.classList.remove('is-panning');
      if (!pan.live && Math.abs(pan.deltaX) < 8 && Math.abs((pan.currentDistance || 1) - (pan.startDistance || 1)) < 8) { this._refreshChart(); return; }
      const { start, end } = this._chartPanTarget(pan);
      if (this._panCovers(pan, start, end)) {
        this._panCommit(pan, start, end);
        this._refreshChart();
        this._ensureHistory();
        return;
      }
      this._setCustomChartRange(start, end);
    }

    _chartHistoryKey() {
      const metricKey = this._chartMetric || 'power';
      return `${this._historyRange}${this._historyWindowToken()}:${metricKey}:${this._entity(metricKey)}`;
    }

    _panCovers(pan, start, end) {
      return !!pan.buf && pan.buf.start <= start + 1000 && pan.buf.end >= end - 120e3;
    }

    // Applies the range under the fingers using data that is already buffered, without reloading history.
    _panCommit(pan, start, end) {
      if (this._historyRange !== 'custom') this._historyReturnRange = this._historyRange;
      this._historyRequest += 1;
      this._historyLoading = false;
      this._voltageHistoryRequest += 1;
      this._voltageHistoryLoading = false;
      this._historyCustomRange = { start, end };
      this._historyRange = 'custom';
      this._history = pan.buf.items;
      this._historyError = false;
      this._historyKey = this._chartHistoryKey();
      this._historyAt = pan.buf.end;
      this._syncVoltageHistoryFromChart();
      if (!pan.committed) {
        pan.committed = true;
        this._clearChartScrub();
        this._updateChartDateRangeControls();
        const picker = this.shadowRoot.querySelector('.chart-date-range');
        if (picker) picker.open = false;
      }
    }

    // Redraws the chart with real data for the range under the fingers on every move.
    _panLive(pan) {
      if (!pan.live) {
        if (Math.abs(pan.deltaX) < 8 && Math.abs((pan.currentDistance || 1) - (pan.startDistance || 1)) < 8) return;
        pan.live = true;
      }
      const { start, end } = this._chartPanTarget(pan);
      const range = end - start;
      if (!(range > 0)) return;
      this._panEnsureBuffer(pan, start - range * 0.5, end);
      if (pan.buf.end <= start || pan.buf.start >= end) { this._chartPanPreview(pan); return; }
      this._panCommit(pan, start, end);
      pan.startX += pan.deltaX;
      pan.deltaX = 0;
      pan.startDistance = pan.currentDistance;
      pan.tStart = start;
      pan.tEnd = end;
      pan.rangeMs = range;
      this._refreshChart();
    }

    // Loads the missing edge of the buffer (older history, or newest samples) while the gesture continues.
    _panEnsureBuffer(pan, wantStart, wantEnd) {
      const hass = this._hass;
      if (!pan?.buf || pan.fetching || Date.now() < pan.blockedUntil || typeof hass?.callApi !== 'function') return;
      const now = Date.now();
      const buf = pan.buf;
      const floor = Number.isFinite(this._statsStart) ? this._statsStart : now - 366 * 24 * 3600e3;
      let from; let to; let side;
      if (Math.max(wantStart, floor) < buf.start - 1000) { from = Math.max(wantStart, floor); to = buf.start; side = 'left'; }
      else if (wantEnd > buf.end + 60e3 && now - buf.end > 60e3) { from = buf.end; to = now; side = 'right'; }
      else return;
      const metricKey = this._chartMetric || 'power';
      const path = `history/period/${encodeURIComponent(new Date(from).toISOString())}?filter_entity_id=${encodeURIComponent(this._entity(metricKey))}&end_time=${encodeURIComponent(new Date(to).toISOString())}&minimal_response&no_attributes`;
      pan.fetching = true;
      Promise.resolve().then(() => hass.callApi('GET', path)).then((response) => {
        if (this._chartPan !== pan) return;
        const merged = [...this._parseHistoryResponse(response, metricKey), ...buf.items].sort((a, b) => a.time - b.time);
        buf.items = merged.filter((item, index) => index === 0 || item.time.getTime() !== merged[index - 1].time.getTime());
        if (side === 'left') buf.start = from; else buf.end = to;
      }).catch(() => { pan.blockedUntil = Date.now() + 2500; }).finally(() => {
        pan.fetching = false;
        if (this._chartPan === pan) this._panLive(pan);
      });
    }

    _reloadChartHistory() {
      this._historyRequest += 1;
      this._historyLoading = false;
      this._historyKey = '';
      this._history = [];
      this._voltageHistoryRequest += 1;
      this._voltageHistoryLoading = false;
      this._voltageHistoryKey = '';
      this._voltageHistory = [];
      this._refreshChart();
      this._ensureHistory();
    }

    _chartData(history = this._history, metricKey = this._chartMetric || 'power', options = {}) {
      const width = Math.max(280, Math.round(this._chartW || 985));
      const range = options.range ?? this._historyRange;
      const customRange = options.customRange ?? this._historyCustomRange;
      const bounds = options.bounds || this._historyBounds(range, Date.now(), customRange);
      const { start: tStart, end: tEnd } = bounds;
      const rangeMs = tEnd - tStart;
      const series = this._bucketHistory(tStart, tEnd, width < 520 ? 48 : 96, history);
      if (!series.length) return null;
      if (options.includeCurrent === false) {
        const terminal = history.at(-1);
        const terminalTime = terminal?.time?.getTime?.();
        const last = series.at(-1);
        if (terminalTime === tEnd && Number.isFinite(terminal.value) && (last?.t !== tEnd || last?.v !== terminal.value)) {
          series.push({ t: tEnd, v: terminal.value });
        }
      }
      const current = Object.hasOwn(options, 'currentValue') ? options.currentValue : options.includeCurrent === false ? null : this._num(metricKey);
      const [minValid, maxValid] = CHART_METRICS[metricKey].plausible;
      if (current !== null && Number.isFinite(current) && current >= minValid && current <= maxValid && (options.includeCurrent === false || tEnd >= Date.now() - 60e3)) series.push({ t: tEnd, v: current });
      return { series, tStart, tEnd, rangeMs };
    }

    _chartScale(series, metricKey = this._chartMetric || 'power') {
      if (metricKey === 'voltage') {
        const values = series.map((point) => point.v);
        const low = Math.min(...values); const high = Math.max(...values);
        for (const step of [5, 10, 20, 25, 50]) {
          const lo = Math.floor((low - 2) / step) * step;
          const hi = Math.max(Math.ceil((high + 2) / step) * step, lo + step);
          if ((hi - lo) / step <= 4) return { lo, max: hi, step, count: (hi - lo) / step };
        }
        const step = 50; const lo = Math.floor((low - 2) / step) * step;
        return { lo, max: lo + 4 * step, step, count: 4 };
      }
      return { lo: 0, ...this._niceScale(Math.max(...series.map((point) => point.v), 0)) };
    }

    _niceScale(maximum) {
      const target = Math.max(maximum * 1.06, 50);
      for (const step of [20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000]) {
        const count = Math.ceil(target / step);
        if (count <= 4) return { step, count: Math.max(2, count), max: Math.max(2, count) * step };
      }
      const step = Math.ceil(target / 4 / 10000) * 10000;
      return { step, count: 4, max: step * 4 };
    }

    _smoothPath(points, lowest, highest) {
      if (!points.length) return '';
      const fix = (n) => n.toFixed(1);
      const clampY = (y) => Math.min(highest, Math.max(lowest, y));
      let d = `M${fix(points[0].x)} ${fix(points[0].y)}`;
      for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[i - 1] || points[i]; const p1 = points[i]; const p2 = points[i + 1]; const p3 = points[i + 2] || p2;
        d += ` C${fix(p1.x + (p2.x - p0.x) / 6)} ${fix(clampY(p1.y + (p2.y - p0.y) / 6))} ${fix(p2.x - (p3.x - p1.x) / 6)} ${fix(clampY(p2.y - (p3.y - p1.y) / 6))} ${fix(p2.x)} ${fix(p2.y)}`;
      }
      return d;
    }

    _bucketHistory(start, end, count, sourceHistory = this._history) {
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || count < 1) return [];
      const bucketMs = (end - start) / count;
      const buckets = Array.from({ length: count }, () => ({ weighted: 0, duration: 0, first: null, last: null, min: null, minPositive: null, max: null }));
      const history = Array.isArray(sourceHistory) ? sourceHistory : [];

      for (let index = 0; index < history.length; index += 1) {
        const point = history[index];
        const pointTime = point.time?.getTime?.();
        const nextTime = index + 1 < history.length ? history[index + 1].time?.getTime?.() : end;
        if (!Number.isFinite(pointTime) || !Number.isFinite(nextTime) || !Number.isFinite(point.value)) continue;

        const intervalStart = Math.max(start, pointTime);
        const intervalEnd = Math.min(end, nextTime);
        if (intervalEnd <= intervalStart) continue;

        let bucketIndex = Math.max(0, Math.floor((intervalStart - start) / bucketMs));
        while (bucketIndex < count && start + bucketIndex * bucketMs < intervalEnd) {
          const bucketStart = start + bucketIndex * bucketMs;
          const overlap = Math.max(0, Math.min(intervalEnd, bucketStart + bucketMs) - Math.max(intervalStart, bucketStart));
          if (overlap > 0) {
            const bucket = buckets[bucketIndex];
            const sample = { t: Math.max(intervalStart, bucketStart), v: point.value, order: index };
            bucket.weighted += point.value * overlap;
            bucket.duration += overlap;
            if (!bucket.first) bucket.first = sample;
            bucket.last = sample;
            if (!bucket.min || sample.v < bucket.min.v) bucket.min = sample;
            if (sample.v > 0 && (!bucket.minPositive || sample.v < bucket.minPositive.v)) bucket.minPositive = sample;
            if (!bucket.max || sample.v > bucket.max.v) bucket.max = sample;
          }
          bucketIndex += 1;
        }
      }

      // Keep measured bucket extrema so brief PZEM power spikes survive chart reduction.
      return buckets.flatMap((bucket, index) => {
        if (!bucket.duration) return [];
        if (bucket.min.v === bucket.max.v) return [{ t: start + (index + 0.5) * bucketMs, v: bucket.weighted / bucket.duration }];
        const seen = new Set();
        return [bucket.first, bucket.min, bucket.minPositive, bucket.max, bucket.last]
          .filter(Boolean)
          .sort((a, b) => a.t - b.t || a.order - b.order)
          .filter((point) => {
            const key = `${point.t}:${point.v}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map(({ t, v }) => ({ t, v }));
      });
    }

    _chartSvg(metricKey = this._chartMetric || 'power', history = this._history, scope = 'params', loading = this._historyLoading) {
      if (loading && !history.length) return `<div class="chart-empty">${this._escape(this._t('loading'))}</div>`;
      const isEnergy = scope === 'energy';
      const range = isEnergy ? this._energyHistoryRange : this._historyRange;
      const customRange = isEnergy ? this._energyCustomRange : this._historyCustomRange;
      const bounds = isEnergy ? this._energyHistoryBounds() : this._historyBounds();
      const width = Math.max(280, Math.round(this._chartW || 985));
      const narrow = width < 520;
      const height = narrow ? 200 : 228;
      const x0 = narrow ? 56 : 70; const x1 = width - (narrow ? 14 : 20); const y0 = 26; const y1 = height - 30;
      const data = this._chartData(history, metricKey, { range, customRange, bounds, includeCurrent: !isEnergy });
      if (!data) {
        if (!isEnergy) this._chartPts = [];
        return `<div class="chart-empty">${this._escape(this._t('no_history'))}</div>`;
      }
      const { series, tStart, tEnd, rangeMs } = data;
      const scale = this._chartScale(series, metricKey);
      const metric = CHART_METRICS[metricKey];
      const unit = metric.unit(this._lang(), this._currencyCode());
      const X = (t) => x0 + Math.min(1, Math.max(0, (t - tStart) / rangeMs)) * (x1 - x0);
      const Y = (v) => y1 - ((Math.max(scale.lo, Math.min(scale.max, v)) - scale.lo) / (scale.max - scale.lo)) * (y1 - y0);
      const pts = series.map((point) => ({ x: X(point.t), y: Y(point.v), v: point.v, t: point.t }));
      if (!isEnergy) this._chartPts = pts;
      const line = this._smoothPath(pts, y0, y1);
      const area = `${line} L${pts[pts.length - 1].x.toFixed(1)} ${y1} L${pts[0].x.toFixed(1)} ${y1} Z`;
      const horizontal = Array.from({ length: scale.count + 1 }, (_, index) => {
        const tickValue = scale.lo + index * scale.step;
        const y = Y(tickValue);
        return `<path d="M${x0} ${y.toFixed(1)}H${x1}"/><text x="${x0 - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end">${this._escape(tickValue.toLocaleString(this._locale(), { maximumFractionDigits: metric.digits }))}${index === scale.count ? ` ${unit}` : ''}</text>`;
      }).join('');
      const longRange = range === 'week' || range === 'month' || (range === 'custom' || range === 'since') && rangeMs > 24 * 3600e3;
      const vertical = [0, 1, 2, 3, 4].map((index) => {
        const x = x0 + index * ((x1 - x0) / 4);
        const time = new Date(tStart + rangeMs * index / 4);
        const label = longRange ? time.toLocaleDateString(this._locale(), { day: '2-digit', month: '2-digit' }) : time.toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
        const show = !narrow || index % 2 === 0;
        return `<path d="M${x.toFixed(1)} ${y0}V${y1}"/>${show ? `<text data-time-tick="${index}" x="${x.toFixed(1)}" y="${height - 8}" text-anchor="${index === 0 ? 'start' : index === 4 ? 'end' : 'middle'}">${this._escape(label)}</text>` : ''}`;
      }).join('');
      const last = pts[pts.length - 1];
      const current = isEnergy ? (series[series.length - 1]?.v ?? null) : this._num(metricKey);
      const [minValid, maxValid] = metric.plausible;
      const hasCurrent = current !== null && current >= minValid && current <= maxValid && (isEnergy || tEnd >= Date.now() - 60e3);
      const latest = hasCurrent ? `${current.toLocaleString(this._locale(), { maximumFractionDigits: metric.digits })} ${unit}` : '';
      const tagX = Math.min(Math.max(last.x - 42, x0 - 8), width - 86);
      const tagY = Math.max(2, last.y - 44);
      const svgId = (name) => this._id(isEnergy ? `energy-${metricKey}-${name}` : name);
      const chartTitle = isEnergy ? (metricKey === 'energy_total' ? this._t('energy_chart_title') : this._t('cost_chart_title')) : this._t('chart_title');
      return `<svg class="chart" data-chart-scope="${scope}" data-chart-min="${scale.lo}" data-chart-max="${scale.max}" data-chart-start="${tStart}" data-chart-end="${tEnd}" data-chart-w="${width}" data-chart-x0="${x0}" data-chart-x1="${x1}" data-chart-y0="${y0}" data-chart-y1="${y1}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${this._escape(chartTitle)}"><defs><linearGradient id="${svgId('area')}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#0a96ff" stop-opacity=".5"/><stop offset="1" stop-color="#0a96ff" stop-opacity=".02"/></linearGradient><filter id="${svgId('line-glow')}" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="3"/></filter><clipPath id="${svgId('plot-clip')}"><rect x="${x0}" y="0" width="${x1 - x0}" height="${height}"/></clipPath></defs><g class="chart-grid">${horizontal}${vertical}</g><g class="chart-data" data-role="chart-data" clip-path="url(#${svgId('plot-clip')})"><path d="${area}" fill="url(#${svgId('area')})"/><path d="${line}" class="chart-glow" filter="url(#${svgId('line-glow')})"/><path d="${line}" class="chart-line"/></g><path class="chart-cross" data-role="chart-cross" d="M${last.x.toFixed(1)} ${y0}V${y1}" visibility="hidden"/><circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="6" class="chart-dot" data-role="chart-dot" visibility="${hasCurrent ? 'visible' : 'hidden'}"/><rect x="${tagX.toFixed(1)}" y="${tagY.toFixed(1)}" width="84" height="30" rx="10" class="chart-tag" data-role="chart-tag" visibility="${hasCurrent ? 'visible' : 'hidden'}"/><text x="${(tagX + 42).toFixed(1)}" y="${(tagY + 20).toFixed(1)}" text-anchor="middle" class="chart-tag-text" data-role="chart-tag-text" visibility="${hasCurrent ? 'visible' : 'hidden'}">${this._escape(latest)}</text><text x="${(tagX + 42).toFixed(1)}" y="${(tagY + 37).toFixed(1)}" text-anchor="middle" class="chart-tag-sub" data-role="chart-tag-sub" visibility="hidden"></text></svg>`;
    }

    _energyHistoryBars(history, bounds = this._energyHistoryBounds(), range = this._energyHistoryRange) {
      if (!Number.isFinite(bounds?.start) || !Number.isFinite(bounds?.end) || bounds.end <= bounds.start || !Array.isArray(history) || history.length < 2) return [];
      const daily = range === 'week' || range === 'month' || range === 'custom' && bounds.end - bounds.start > 24 * 3600e3;
      const bins = [];
      if (range === 'hour') {
        const startDate = new Date(bounds.start);
        const endDate = new Date(bounds.end);
        const timeFormat = { hour: '2-digit', minute: '2-digit', hour12: false };
        bins.push({
          start: bounds.start,
          end: bounds.end,
          value: 0,
          label: startDate.toLocaleTimeString(this._locale(), { hour: '2-digit', hour12: false }),
          fullLabel: `${startDate.toLocaleString(this._locale(), { month: 'short', day: '2-digit', ...timeFormat })}–${endDate.toLocaleString(this._locale(), { month: 'short', day: '2-digit', ...timeFormat })}`,
        });
      } else {
        let cursor = bounds.start;
        while (cursor < bounds.end && bins.length < 10000) {
          let next;
          if (daily) {
            const boundary = new Date(cursor);
            boundary.setHours(0, 0, 0, 0);
            boundary.setDate(boundary.getDate() + 1);
            next = boundary.getTime();
          } else {
            const boundary = new Date(cursor);
            boundary.setMinutes(0, 0, 0);
            next = boundary.getTime() + 3600e3;
          }
          if (next <= cursor) next = cursor + (daily ? 24 * 3600e3 : 3600e3);
          const stop = Math.min(next, bounds.end);
          const date = new Date(cursor);
          const shortLabel = daily
            ? date.toLocaleDateString(this._locale(), range === 'week' ? { weekday: 'short', day: '2-digit' } : range === 'month' ? { day: '2-digit' } : { day: '2-digit', month: '2-digit' })
            : date.toLocaleTimeString(this._locale(), { hour: '2-digit', hour12: false });
          const fullLabel = daily
            ? date.toLocaleDateString(this._locale(), { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
            : `${date.toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit', hour12: false })}–${new Date(stop).toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit', hour12: false })}`;
          bins.push({ start: cursor, end: stop, value: 0, label: shortLabel, fullLabel });
          cursor = stop;
        }
      }
      if (!daily) {
        const counts = new Map();
        bins.forEach((bin) => counts.set(bin.label, (counts.get(bin.label) || 0) + 1));
        const offset = (timestamp) => {
          const minutes = -new Date(timestamp).getTimezoneOffset();
          const sign = minutes >= 0 ? '+' : '-';
          const absolute = Math.abs(minutes);
          const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
          const remainder = absolute % 60;
          return `UTC${sign}${hours}${remainder ? `:${String(remainder).padStart(2, '0')}` : ''}`;
        };
        const timeWithOffset = (timestamp) => {
          const date = new Date(timestamp);
          return `${date.toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit', hour12: false })} ${offset(timestamp)}`;
        };
        bins.forEach((bin) => {
          if (counts.get(bin.label) > 1) {
            bin.label = `${bin.label} ${offset(bin.start)}`;
            bin.fullLabel = `${timeWithOffset(bin.start)}–${timeWithOffset(bin.end)}`;
          }
        });
      }
      const points = history
        .filter((point) => point?.time && Number.isFinite(point.time.getTime()) && Number.isFinite(point.value))
        .slice()
        .sort((a, b) => a.time.getTime() - b.time.getTime());
      const binAt = (timestamp) => {
        const sampleTime = Math.max(bounds.start, Math.min(timestamp, bounds.end - 1));
        return bins.find((bin) => sampleTime >= bin.start && sampleTime < bin.end);
      };
      for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];
        const delta = current.value - previous.value;
        if (!(delta > 0)) continue;
        const from = Math.max(bounds.start, previous.time.getTime());
        const to = Math.min(bounds.end, current.time.getTime());
        if (to <= from) {
          const bin = binAt(current.time.getTime());
          if (bin) bin.value += delta;
          continue;
        }
        const duration = to - from;
        for (const bin of bins) {
          const overlap = Math.max(0, Math.min(to, bin.end) - Math.max(from, bin.start));
          if (overlap > 0) bin.value += delta * (overlap / duration);
        }
      }
      return bins;
    }

    _energyBarScale(maximum, metricKey) {
      if (!(maximum > 0) || !Number.isFinite(maximum)) {
        const step = metricKey === 'energy_total' ? 0.1 : 1;
        return { step, count: 4, max: step * 4 };
      }
      const target = maximum * 1.08;
      const rawStep = target / 4;
      const magnitude = 10 ** Math.floor(Math.log10(rawStep));
      const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((value) => value >= rawStep) || magnitude * 10;
      const count = Math.max(1, Math.ceil(target / step));
      return { step, count, max: count * step };
    }

    _energyBarSelectionHtml(metricKey = this._energyChartMetric || 'energy_total') {
      const selected = this._energySelectedBar;
      if (!selected || selected.metricKey !== metricKey) return '';
      const bars = this._energyHistoryBars(this._energyHistory?.[metricKey] || [], this._energyHistoryBounds(), this._energyHistoryRange);
      const bar = bars.find((candidate) => candidate.start === selected.start);
      if (!bar) { this._energySelectedBar = null; return ''; }
      const metric = CHART_METRICS[metricKey];
      const unit = metric.unit(this._lang(), this._currencyCode());
      const value = `${bar.value.toLocaleString(this._locale(), { maximumFractionDigits: metric.digits })} ${unit}`;
      return `<div class="energy-selection-detail"><span>${this._escape(this._t('energy_selected_interval'))}</span><time>${this._escape(bar.fullLabel)}</time><b>${this._escape(value)}</b></div>`;
    }

    _energyBarSvg(metricKey = this._energyChartMetric || 'energy_total', history = this._energyHistory[metricKey], loading = this._energyHistoryLoading[metricKey]) {
      if (loading && !history?.length) return `<div class="chart-empty">${this._escape(this._t('loading'))}</div>`;
      if (metricKey === 'energy_total' && this._energyHistoryUnitFactor(metricKey) === null) {
        return `<div class="chart-empty">${this._escape(this._t('energy_unit_unsupported'))}</div>`;
      }
      const range = this._energyHistoryRange;
      const bounds = this._energyHistoryBounds();
      const bars = this._energyHistoryBars(history, bounds, range);
      if (!bars.length) return `<div class="chart-empty">${this._escape(this._t('no_history'))}</div>`;
      const metric = CHART_METRICS[metricKey];
      const unit = metric.unit(this._lang(), this._currencyCode());
      const maximum = Math.max(0, ...bars.map((bar) => bar.value));
      const scale = this._energyBarScale(maximum, metricKey);
      const width = Math.max(280, Math.round(this._chartW || 985));
      const narrow = width < 520;
      const height = narrow ? 200 : 228;
      const x0 = narrow ? 56 : 70;
      const x1 = width - (narrow ? 14 : 20);
      const y0 = 26;
      const y1 = height - 30;
      const plotWidth = x1 - x0;
      const slot = plotWidth / bars.length;
      const barWidth = Math.max(2, Math.min(24, slot * 0.68));
      const Y = (value) => y1 - (Math.max(0, Math.min(scale.max, value)) / scale.max) * (y1 - y0);
      const horizontal = Array.from({ length: scale.count + 1 }, (_, index) => {
        const tick = index * scale.step;
        const y = Y(tick);
        const text = tick.toLocaleString(this._locale(), { maximumFractionDigits: metric.digits });
        return `<path d="M${x0} ${y.toFixed(1)}H${x1}"/><text x="${x0 - 10}" y="${(y + 4).toFixed(1)}" text-anchor="end">${this._escape(text)}${index === scale.count ? ` ${this._escape(unit)}` : ''}</text>`;
      }).join('');
      const labelStep = Math.max(1, Math.ceil(bars.length / (narrow ? 6 : 12)));
      const vertical = bars.map((bar, index) => {
        const center = x0 + (index + 0.5) * slot;
        const show = index === 0 || index === bars.length - 1 || index % labelStep === 0;
        return show ? `<text x="${center.toFixed(1)}" y="${height - 8}" text-anchor="middle">${this._escape(bar.label)}</text>` : '';
      }).join('');
      const fill = metricKey === 'cost_total' ? '#f5b94c' : '#16b5ff';
      const rects = bars.map((bar, index) => {
        const x = x0 + index * slot + (slot - barWidth) / 2;
        const y = Y(bar.value);
        const rectHeight = Math.max(1, y1 - y);
        const value = bar.value.toLocaleString(this._locale(), { maximumFractionDigits: metric.digits });
        const aria = `${bar.fullLabel}: ${value} ${unit}`;
        const selected = this._energySelectedBar?.metricKey === metricKey && this._energySelectedBar.start === bar.start;
        return `<rect class="energy-bar${selected ? ' selected' : ''}" x="${x.toFixed(1)}" y="${(y1 - rectHeight).toFixed(1)}" width="${barWidth.toFixed(1)}" height="${rectHeight.toFixed(1)}" rx="3" fill="${fill}" role="button" tabindex="0" aria-pressed="${selected}" data-energy-bar="${index}" data-energy-start="${bar.start}" data-energy-value="${bar.value}" aria-label="${this._escape(aria)}"><title>${this._escape(aria)}</title></rect>`;
      }).join('');
      const title = metricKey === 'energy_total' ? this._t('energy_chart_title') : this._t('cost_chart_title');
      return `<svg class="energy-bars" data-energy-bar-count="${bars.length}" data-energy-start="${bounds.start}" data-energy-end="${bounds.end}" viewBox="0 0 ${width} ${height}" role="group" aria-label="${this._escape(title)}" style="width:100%;height:auto;display:block;overflow:visible"><g class="chart-grid">${horizontal}${vertical}</g><g class="energy-bars-data">${rects}</g></svg>`;
    }

    _setChartMarker(chart, x, y, text, sub = '') {
      const width = Number(chart.dataset.chartW) || 1000;
      const left = Number(chart.dataset.chartX0) || 0;
      const boxW = sub ? 92 : 84; const boxH = sub ? 46 : 30;
      const boxX = Math.min(Math.max(x - boxW / 2, left - 8), width - boxW - 2);
      const boxY = Math.max(2, y - boxH - 14);
      const dot = chart.querySelector('[data-role="chart-dot"]');
      const tag = chart.querySelector('[data-role="chart-tag"]');
      const label = chart.querySelector('[data-role="chart-tag-text"]');
      const subLabel = chart.querySelector('[data-role="chart-tag-sub"]');
      const visible = text ? 'visible' : 'hidden';
      if (dot) { dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', y.toFixed(1)); dot.setAttribute('visibility', visible); }
      if (tag) { tag.setAttribute('x', boxX.toFixed(1)); tag.setAttribute('y', boxY.toFixed(1)); tag.setAttribute('width', boxW); tag.setAttribute('height', boxH); tag.setAttribute('visibility', visible); }
      if (label) { label.setAttribute('x', (boxX + boxW / 2).toFixed(1)); label.setAttribute('y', (boxY + 20).toFixed(1)); label.textContent = text; label.setAttribute('visibility', visible); }
      if (subLabel) { subLabel.setAttribute('x', (boxX + boxW / 2).toFixed(1)); subLabel.setAttribute('y', (boxY + 37).toFixed(1)); subLabel.textContent = sub; subLabel.setAttribute('visibility', sub ? 'visible' : 'hidden'); }
    }

    _nearestChartPoint(value) {
      if (!this._chartPts.length || !Number.isFinite(value)) return null;
      return this._chartPts.reduce((best, point) => Math.abs(point.t - value) < Math.abs(best.t - value) ? point : best, this._chartPts[0]);
    }

    _renderChartPoint(point) {
      const chart = this.shadowRoot.querySelector('svg.chart');
      if (!chart || !point) return;
      const metric = CHART_METRICS[this._chartMetric || 'power'];
      const unit = metric.unit(this._lang(), this._currencyCode());
      const when = new Date(point.t);
      const sub = when.toLocaleDateString(this._locale(), { day: '2-digit', month: '2-digit' }) + ' ' + when.toLocaleTimeString(this._locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
      this._setChartMarker(chart, point.x, point.y, `${point.v.toLocaleString(this._locale(), { maximumFractionDigits: metric.digits })} ${unit}`, sub);
      const cross = chart.querySelector('[data-role="chart-cross"]');
      if (cross) {
        cross.setAttribute('d', `M${point.x.toFixed(1)} ${chart.dataset.chartY0}V${chart.dataset.chartY1}`);
        cross.setAttribute('visibility', 'visible');
      }
    }

    _updateChartScrubber() {
      const slider = this.shadowRoot.querySelector('[data-role="chart-scrubber"]');
      if (slider) {
        slider.value = String(this._chartScrubPosition());
        slider.disabled = !this._chartPts.length;
      }
      const label = this.shadowRoot.querySelector('[data-role="chart-selected-time"]');
      if (label) label.textContent = this._scrubTime === null ? this._t('chart_select_time') : this._formatChartTimestamp(this._scrubTime);
      const live = this.shadowRoot.querySelector('[data-chart-live]');
      if (live) live.disabled = this._scrubTime === null && this._historyRange !== 'custom';
    }

    _selectChartPoint(point) {
      if (!point) return;
      const changed = this._scrubTime !== point.t;
      this._scrubTime = point.t;
      if (changed) {
        this._chartReadings = {};
        this._chartReadingsAt = null;
        this._chartReadingsError = false;
      }
      this._renderChartPoint(point);
      this._updateChartScrubber();
      this._updateChartReadings();
      if (changed && this._chartReadingsAt !== point.t) this._queueChartReadings(point.t);
    }

    _chartScrubberInput(value) {
      const data = this._chartTimeBounds();
      const position = Number(value);
      if (!data || !Number.isFinite(position) || !this._chartPts.length) return;
      const timestamp = data.tStart + (data.rangeMs * Math.max(0, Math.min(1000, position)) / 1000);
      this._selectChartPoint(this._nearestChartPoint(timestamp));
    }

    _restoreChartScrub() {
      if (this._scrubTime === null) return false;
      const point = this._nearestChartPoint(this._scrubTime);
      if (!point) return false;
      this._renderChartPoint(point);
      this._updateChartScrubber();
      this._updateChartReadings();
      return true;
    }

    _chartScrubAtClientX(clientX) {
      const chart = this.shadowRoot?.querySelector?.('svg.chart');
      if (!chart || !this._chartPts.length) return;
      const rect = chart.getBoundingClientRect();
      if (!rect.width) return;
      const chartW = Number(chart.dataset.chartW) || rect.width;
      const x0 = Number(chart.dataset.chartX0) || 0;
      const x1 = Number(chart.dataset.chartX1) || chartW;
      const x = (clientX - rect.left) * (chartW / rect.width);
      const clampedX = Math.max(x0, Math.min(x1, x));
      let best = this._chartPts[0];
      this._chartPts.forEach((point) => {
        if (Math.abs(point.x - clampedX) < Math.abs(best.x - clampedX)) best = point;
      });
      this._selectChartPoint(best);
    }

    _chartHover(event) {
      this._chartScrubAtClientX(event.clientX);
    }

    _queueChartReadings(timestamp, immediate = false) {
      if (this._chartReadingsTimer !== null) window.clearTimeout(this._chartReadingsTimer);
      this._chartReadingsPendingTime = timestamp;
      this._chartReadingsTimer = window.setTimeout(() => {
        this._chartReadingsTimer = null;
        const pending = this._chartReadingsPendingTime;
        this._chartReadingsPendingTime = null;
        if (pending !== null) this._loadChartReadings(pending);
      }, immediate ? 0 : 300);
    }

    async _loadChartReadings(timestamp) {
      if (!this._hass || !Number.isFinite(timestamp) || this._scrubTime !== timestamp) return;
      if (this._chartReadingsLoading) {
        this._chartReadingsQueuedTime = timestamp;
        return;
      }
      const request = ++this._chartReadingsRequest;
      const requestTime = timestamp;
      const hass = this._hass;
      const keys = CHART_READINGS.map(({ key }) => key);
      const entityIds = keys.map((key) => this._entity(key)).filter((entityId) => hass.states?.[entityId]);
      this._chartReadingsLoading = true;
      this._chartReadingsRequestTime = requestTime;
      this._chartReadingsError = false;
      this._updateChartReadings();
      try {
        if (typeof hass.callApi !== 'function' || !entityIds.length) throw new Error('Measurement history unavailable');
        const start = new Date(timestamp - 60000);
        const end = new Date(timestamp + 1);
        const path = `history/period/${encodeURIComponent(start.toISOString())}?filter_entity_id=${encodeURIComponent(entityIds.join(','))}&end_time=${encodeURIComponent(end.toISOString())}&minimal_response&no_attributes`;
        const response = await hass.callApi('GET', path);
        if (request !== this._chartReadingsRequest) return;
        const groups = Array.isArray(response) ? response : [];
        const byEntity = new Map();
        groups.forEach((group, index) => {
          if (!Array.isArray(group)) return;
          const first = group.find((item) => item?.entity_id);
          const entityId = first?.entity_id || entityIds[index];
          if (entityId) byEntity.set(entityId, group);
        });
        const values = {};
        CHART_READINGS.forEach(({ key, plausible }) => {
          const entityId = this._entity(key);
          let latest = null;
          (byEntity.get(entityId) || []).forEach((item) => {
            const time = Date.parse(item.last_updated || item.last_changed || '');
            const value = Number(item.state);
            if (!Number.isFinite(time) || time > timestamp || !Number.isFinite(value) || value < plausible[0] || value > plausible[1]) return;
            if (!latest || time > latest.time) latest = { time, value };
          });
          values[key] = latest?.value ?? null;
        });
        if (this._scrubTime === requestTime) {
          this._chartReadings = values;
          this._chartReadingsAt = requestTime;
        } else {
          this._chartReadingsQueuedTime = this._scrubTime;
        }
      } catch (_error) {
        if (request === this._chartReadingsRequest && this._scrubTime === requestTime) this._chartReadingsError = true;
      } finally {
        if (request === this._chartReadingsRequest) {
          this._chartReadingsLoading = false;
          this._chartReadingsRequestTime = null;
          this._updateChartReadings();
          const queued = this._chartReadingsQueuedTime;
          this._chartReadingsQueuedTime = null;
          if (queued !== null && queued === this._scrubTime && queued !== this._chartReadingsAt) this._queueChartReadings(queued, true);
        }
      }
    }

    _clearChartScrub() {
      this._chartTouchScrubbing = null;
      if (this._chartReadingsTimer !== null) window.clearTimeout(this._chartReadingsTimer);
      this._chartReadingsTimer = null;
      this._chartReadingsPendingTime = null;
      this._chartReadingsRequest += 1;
      this._chartReadingsQueuedTime = null;
      this._chartReadingsRequestTime = null;
      this._chartReadingsLoading = false;
      this._chartReadingsError = false;
      this._chartReadings = {};
      this._chartReadingsAt = null;
      this._scrubTime = null;
      this._updateChartScrubber();
      this._updateChartReadings();
    }

    _downsample(points, limit) {
      if (points.length <= limit) return points;
      const result = [];
      const step = (points.length - 1) / (limit - 1);
      for (let index = 0; index < limit; index += 1) result.push(points[Math.round(index * step)]);
      return result;
    }

    _ensureHistory() {
      if (!this._hass || !this._config || this._activeTab !== 'params' || this._chartPan || !this._isActive()) return;
      const metricKey = this._chartMetric || 'power';
      const key = `${this._historyRange}${this._historyWindowToken()}:${metricKey}:${this._entity(metricKey)}`;
      if (key !== this._historyKey || Date.now() - this._historyAt >= 60000) this._loadHistory(key);
      if (metricKey === 'voltage') this._syncVoltageHistoryFromChart();
      else this._ensureVoltageHistory();
    }

    _energyHistoryBounds(range = this._energyHistoryRange, now = Date.now()) {
      const applyStatisticsStart = (bounds) => {
        const start = Number.isFinite(this._statsStart) ? Math.max(bounds.start, this._statsStart) : bounds.start;
        return { start, end: Math.max(start, bounds.end) };
      };
      if (range === 'custom' && this._energyCustomRange) return applyStatisticsStart({ ...this._energyCustomRange });
      const end = new Date(now);
      let start;
      if (range === 'hour') start = new Date(end.getTime() - 3600e3);
      else {
        start = new Date(end);
        start.setHours(0, 0, 0, 0);
        if (range === 'week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        else if (range === 'month') start.setDate(1);
      }
      return applyStatisticsStart({ start: start.getTime(), end: end.getTime() });
    }

    _energyHistoryWindowToken() {
      return this._energyHistoryRange === 'custom' && this._energyCustomRange
        ? `:custom:${Math.round(this._energyCustomRange.start)}:${Math.round(this._energyCustomRange.end)}` : '';
    }

    _energyHistoryCacheKey(metricKey) {
      const statsStart = Number.isFinite(this._statsStart) ? Math.round(this._statsStart) : '';
      return `${this._energyHistoryRange}${this._energyHistoryWindowToken()}:stats:${statsStart}:${metricKey}:${this._entity(metricKey)}`;
    }

    _clearEnergyHistory() {
      this._energySelectedBar = null;
      for (const metricKey of ['energy_total', 'cost_total']) {
        this._energyHistoryRequests[metricKey] += 1;
        this._energyHistoryLoading[metricKey] = false;
        this._energyHistory[metricKey] = [];
        this._energyHistoryKeys[metricKey] = '';
        this._energyHistoryAt[metricKey] = 0;
      }
    }

    _ensureEnergyHistory() {
      if (!this._hass || !this._config || this._activeTab !== 'energy' || !this._isActive()) return;
      for (const metricKey of ['energy_total', 'cost_total']) {
        const key = this._energyHistoryCacheKey(metricKey);
        if (key !== this._energyHistoryKeys[metricKey]) {
          this._energyHistoryRequests[metricKey] += 1;
          this._energyHistoryLoading[metricKey] = false;
          this._energyHistory[metricKey] = [];
          this._energyHistoryKeys[metricKey] = key;
          this._energyHistoryAt[metricKey] = 0;
        }
        if (!this._energyHistoryLoading[metricKey] && Date.now() - this._energyHistoryAt[metricKey] >= 60000) this._loadEnergyHistory(metricKey, key);
      }
    }

    _energyHistoryUnitFactor(metricKey) {
      if (metricKey !== 'energy_total') return 1;
      const unit = String(this._state?.(metricKey)?.attributes?.unit_of_measurement || '').trim().toLowerCase();
      if (unit === 'wh') return 0.001;
      if (unit === 'kwh') return 1;
      if (unit === 'mwh') return 1000;
      return null;
    }

    _parseCumulativeHistory(response, metricKey, bounds, currentValue) {
      const [minimum, maximum] = CHART_METRICS[metricKey].plausible;
      const unitFactor = this._energyHistoryUnitFactor(metricKey);
      if (unitFactor === null) return [];
      const raw = (Array.isArray(response?.[0]) ? response[0] : [])
        .map((item) => ({ time: new Date(item.last_changed || item.last_updated), value: Number(item.state) * unitFactor }))
        .filter((item) => Number.isFinite(item.time.getTime()) && Number.isFinite(item.value) && item.value >= minimum && item.value <= maximum)
        .sort((a, b) => a.time - b.time);
      const start = bounds.start;
      const end = bounds.end;
      const before = raw.filter((item) => item.time.getTime() <= start).at(-1);
      const within = raw.filter((item) => item.time.getTime() > start && item.time.getTime() <= end);
      let previous = before?.value ?? raw.find((item) => item.time.getTime() > start)?.value;
      let cumulative = 0;
      const result = [{ time: new Date(start), value: 0 }];
      let lastTime = start;
      for (const item of within) {
        if (previous === undefined) { previous = item.value; lastTime = item.time.getTime(); result.push({ time: new Date(lastTime), value: cumulative }); continue; }
        cumulative += item.value >= previous ? item.value - previous : item.value;
        previous = item.value;
        lastTime = item.time.getTime();
        result.push({ time: new Date(lastTime), value: cumulative });
      }
      const currentStateTime = Date.parse(this._state(metricKey)?.last_changed || '');
      const normalizedCurrentValue = currentValue * unitFactor;
      if (Number.isFinite(normalizedCurrentValue) && normalizedCurrentValue >= minimum * unitFactor && normalizedCurrentValue <= maximum * unitFactor && Number.isFinite(currentStateTime) && currentStateTime <= end) {
        if (previous === undefined) previous = normalizedCurrentValue;
        else cumulative += normalizedCurrentValue >= previous ? normalizedCurrentValue - previous : normalizedCurrentValue;
      }
      if (lastTime < end) result.push({ time: new Date(end), value: cumulative });
      else if (lastTime === end) result[result.length - 1] = { time: new Date(end), value: cumulative };
      return result;
    }

    async _loadEnergyHistory(metricKey, key = this._energyHistoryCacheKey(metricKey)) {
      if (!this._hass || this._energyHistoryLoading[metricKey]) return;
      const request = ++this._energyHistoryRequests[metricKey];
      const hass = this._hass;
      const bounds = this._energyHistoryBounds();
      const start = new Date(Math.max(0, bounds.start - 24 * 3600e3));
      const end = new Date(bounds.end);
      this._energyHistoryLoading[metricKey] = true;
      this._refreshEnergyCharts();
      try {
        if (typeof hass.callApi !== 'function') throw new Error('History API unavailable');
        const path = `history/period/${encodeURIComponent(start.toISOString())}?filter_entity_id=${encodeURIComponent(this._entity(metricKey))}&end_time=${encodeURIComponent(end.toISOString())}&minimal_response&no_attributes`;
        const response = await hass.callApi('GET', path);
        if (request !== this._energyHistoryRequests[metricKey]) return;
        this._energyHistory[metricKey] = this._parseCumulativeHistory(response, metricKey, bounds, this._num(metricKey));
      } catch (_error) {
        if (request === this._energyHistoryRequests[metricKey]) this._energyHistory[metricKey] = [];
      } finally {
        if (request === this._energyHistoryRequests[metricKey]) {
          this._energyHistoryKeys[metricKey] = key;
          this._energyHistoryAt[metricKey] = Date.now();
          this._energyHistoryLoading[metricKey] = false;
          this._refreshEnergyCharts();
        }
      }
    }

    _refreshEnergyCharts() {
      const metricKey = this._energyChartMetric || 'energy_total';
      const plot = this.shadowRoot.querySelector('[data-energy-plot]');
      if (plot) {
        plot.dataset.energyPlot = metricKey;
        plot.innerHTML = this._energyBarSvg(metricKey, this._energyHistory[metricKey], this._energyHistoryLoading[metricKey]);
      }
      const selection = this.shadowRoot.querySelector('[data-energy-selection]');
      if (selection) selection.innerHTML = this._energyBarSelectionHtml(metricKey);
      const stats = this.shadowRoot.querySelector('[data-energy-stats]');
      if (stats) {
        stats.dataset.energyStats = metricKey;
        stats.innerHTML = this._chartStatsHtml(metricKey, this._energyHistory[metricKey], 'energy');
      }
      const title = this.shadowRoot.querySelector('[data-energy-chart-title]');
      if (title) title.textContent = this._t(metricKey === 'energy_total' ? 'energy_chart_title' : 'cost_chart_title');
      this.shadowRoot.querySelectorAll('[data-energy-metric]').forEach((button) => {
        const active = button.dataset.energyMetric === metricKey;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }

    _voltageHistoryCacheKey() { return `${this._historyRange}${this._historyWindowToken()}:${this._entity('voltage')}`; }

    _syncVoltageHistoryFromChart() {
      const chartKey = `${this._historyRange}${this._historyWindowToken()}:voltage:${this._entity('voltage')}`;
      if (this._historyKey !== chartKey) return false;
      this._voltageHistory = this._history;
      this._voltageHistoryKey = this._voltageHistoryCacheKey();
      this._voltageHistoryAt = this._historyAt;
      return true;
    }

    _ensureVoltageHistory() {
      if (!this._hass || !this._config || this._activeTab !== 'params' || !this._isActive()) return;
      if ((this._chartMetric || 'power') === 'voltage') { this._syncVoltageHistoryFromChart(); return; }
      const key = this._voltageHistoryCacheKey();
      if (key === this._voltageHistoryKey && Date.now() - this._voltageHistoryAt < 60000) return;
      this._loadVoltageHistory(key);
    }

    _parseHistoryResponse(response, metricKey) {
      const series = Array.isArray(response?.[0]) ? response[0] : [];
      const [minValid, maxValid] = CHART_METRICS[metricKey].plausible;
      const statsStart = Number.isFinite(this._statsStart) ? this._statsStart : null;
      const parsed = series.map((item) => {
        const value = Number(item.state);
        const plausible = Number.isFinite(value) && value >= minValid && value <= maxValid;
        const time = new Date(item.last_changed || item.last_updated);
        return { time, value: plausible ? value : null };
      })
        .filter((item) => Number.isFinite(item.time.getTime()))
        .sort((a, b) => a.time - b.time);

      if (statsStart === null) return parsed;

      const clamped = [];
      for (let i = 0; i < parsed.length; i += 1) {
        const item = parsed[i];
        const next = parsed[i + 1];
        const t = item.time.getTime();
        const nextT = next ? next.time.getTime() : Infinity;
        if (nextT <= statsStart) continue;
        if (t < statsStart) {
          clamped.push({ ...item, time: new Date(statsStart) });
        } else {
          clamped.push(item);
        }
      }
      return clamped;
    }

    async _loadHistory(key = `${this._historyRange}${this._historyWindowToken()}:${this._chartMetric || 'power'}:${this._entity(this._chartMetric || 'power')}`) {
      if (!this._hass || this._historyLoading) return;
      this._historyLoading = true;
      this._historyError = false;
      const request = ++this._historyRequest;
      const hass = this._hass;
      const range = this._historyRange;
      const metricKey = this._chartMetric || 'power';
      const bounds = this._historyBounds(range);
      const start = new Date(bounds.start);
      const end = new Date(bounds.end);
      this._refreshChart();
      try {
        if (typeof hass.callApi !== 'function') throw new Error('History API unavailable');
        const entity = encodeURIComponent(this._entity(metricKey));
        const path = `history/period/${encodeURIComponent(start.toISOString())}?filter_entity_id=${entity}&end_time=${encodeURIComponent(end.toISOString())}&minimal_response`;
        const response = await hass.callApi('GET', path);
        if (request !== this._historyRequest) return;
        this._history = this._parseHistoryResponse(response, metricKey);
        this._historyKey = key;
        this._historyAt = Date.now();
        if (metricKey === 'voltage') this._syncVoltageHistoryFromChart();
      } catch (_error) {
        if (request === this._historyRequest) {
          this._history = [];
          this._historyError = true;
          this._historyKey = key;
          this._historyAt = Date.now();
          if (metricKey === 'voltage') this._syncVoltageHistoryFromChart();
        }
      } finally {
        if (request === this._historyRequest) {
          this._historyLoading = false;
          this._refreshChart();
        }
      }
    }

    async _loadVoltageHistory(key = this._voltageHistoryCacheKey()) {
      if (!this._hass || this._voltageHistoryLoading) return;
      this._voltageHistoryLoading = true;
      const request = ++this._voltageHistoryRequest;
      const hass = this._hass;
      const range = this._historyRange;
      const bounds = this._historyBounds(range);
      const start = new Date(bounds.start);
      const end = new Date(bounds.end);
      try {
        if (typeof hass.callApi !== 'function') throw new Error('History API unavailable');
        const entity = encodeURIComponent(this._entity('voltage'));
        const path = `history/period/${encodeURIComponent(start.toISOString())}?filter_entity_id=${entity}&end_time=${encodeURIComponent(end.toISOString())}&minimal_response`;
        const response = await hass.callApi('GET', path);
        if (request !== this._voltageHistoryRequest) return;
        this._voltageHistory = this._parseHistoryResponse(response, 'voltage');
        this._voltageHistoryKey = key;
        this._voltageHistoryAt = Date.now();
      } catch (_error) {
        if (request === this._voltageHistoryRequest) {
          this._voltageHistory = [];
          this._voltageHistoryKey = key;
          this._voltageHistoryAt = Date.now();
        }
      } finally {
        if (request === this._voltageHistoryRequest) {
          this._voltageHistoryLoading = false;
          this._refreshChart();
        }
      }
    }

    _refreshChart() {
      const plot = this.shadowRoot.querySelector('[data-role="chart-plot"]');
      if (plot) plot.innerHTML = this._chartSvg();
      if (plot && this._chartPan) { this._chartPan.plot = plot; plot.classList.add('is-panning'); this._chartPanPreview(this._chartPan); }
      const stats = this.shadowRoot.querySelector('[data-role="chart-stats"]');
      if (stats) stats.innerHTML = this._chartStatsHtml();
      if (!this._restoreChartScrub()) this._updateChartCurrent();
      this._updateChartScrubber();
      this._updateChartReadings();
      if (this._activeTab === 'params') this._updateRange();
    }

    _voltageRangeStats() {
      if (Number.isFinite(this._statsStart) && this._statsExtremes?.voltage && (Number.isFinite(this._statsExtremes.voltage.min) || Number.isFinite(this._statsExtremes.voltage.max))) {
        return {
          min: this._statsExtremes.voltage.min ?? null,
          max: this._statsExtremes.voltage.max ?? null,
        };
      }
      const data = this._chartData(this._voltageHistory, 'voltage');
      const values = data?.series.filter((point) => !Number.isFinite(this._statsStart) || point.t >= this._statsStart).map((point) => point.v).filter(Number.isFinite) || [];
      return {
        min: values.length ? Math.min(...values) : null,
        max: values.length ? Math.max(...values) : null,
      };
    }

    _formatVoltage(value) {
      if (value === null || !Number.isFinite(value)) return '—';
      const metric = CHART_METRICS.voltage;
      return `${value.toLocaleString(this._locale(), { maximumFractionDigits: metric.digits })} ${metric.unit(this._lang())}`;
    }

    _voltageRangeDetail(bound, label, icon = '') {
      const value = this._voltageRangeStats()[bound];
      return `<div class="detail${icon ? ' has-icon' : ''}">${this._detailIcon(icon)}<span>${this._escape(label)}</span><b data-role="voltage-${bound}-period">${this._escape(this._formatVoltage(value))}</b></div>`;
    }

    _rangeLayout() {
      const pct = (value) => (value === null ? null : Math.max(0, Math.min(100, ((value - GAUGE.min) / (GAUGE.max - GAUGE.min)) * 100)));
      const voltageRange = this._voltageRangeStats();
      const low = pct(voltageRange.min); const high = pct(voltageRange.max);
      const sag = pct(this._num('sag_threshold')); const swell = pct(this._num('swell_threshold'));
      const now = pct(this._num('voltage'));
      const box = (left, width) => (left === null || width === null ? 'display:none' : `left:${left.toFixed(1)}%;width:${Math.max(0, width).toFixed(1)}%`);
      return {
        zoneLow: sag === null ? 'display:none' : box(0, sag),
        zoneHigh: swell === null ? 'display:none' : box(swell, 100 - swell),
        span: low === null || high === null ? 'display:none' : box(low, Math.max(high - low, 1.2)),
        now: now === null ? 'display:none' : `left:${now.toFixed(1)}%`,
      };
    }

    _rangeCard() {
      const layout = this._rangeLayout();
      const voltageRange = this._voltageRangeStats();
      return `<div class="range-card" data-role="range-card">
        <div class="range-head"><h3>${this._escape(this._t('range_title'))}</h3><div class="range-values"><span>${this._escape(this._t('min_voltage'))} <b data-role="voltage-min-period">${this._escape(this._formatVoltage(voltageRange.min))}</b></span><span>${this._escape(this._t('max_voltage'))} <b data-role="voltage-max-period">${this._escape(this._formatVoltage(voltageRange.max))}</b></span></div></div>
        <div class="range-track"><i class="range-zone low" data-role="range-zone-low" style="${layout.zoneLow}"></i><i class="range-zone high" data-role="range-zone-high" style="${layout.zoneHigh}"></i><i class="range-span" data-role="range-span" style="${layout.span}"></i><b class="range-now" data-role="range-now" style="${layout.now}"></b></div>
        <div class="range-scale"><span>${GAUGE.min}</span><span>${Math.round((GAUGE.min + GAUGE.max) / 2)}</span><span>${GAUGE.max}</span></div>
      </div>`;
    }

    _updateRange() {
      const layout = this._rangeLayout();
      const apply = (role, style) => { const node = this.shadowRoot.querySelector(`[data-role="${role}"]`); if (node) node.setAttribute('style', style); };
      apply('range-zone-low', layout.zoneLow); apply('range-zone-high', layout.zoneHigh); apply('range-span', layout.span); apply('range-now', layout.now);
      const voltageRange = this._voltageRangeStats();
      this.shadowRoot.querySelectorAll('[data-role="voltage-min-period"]').forEach((node) => { node.textContent = this._formatVoltage(voltageRange.min); });
      this.shadowRoot.querySelectorAll('[data-role="voltage-max-period"]').forEach((node) => { node.textContent = this._formatVoltage(voltageRange.max); });
      const power = this._powerRangeLayout();
      apply('power-range-span', power.span); apply('power-range-now', power.now);
      const unit = this._lang() === 'uk' ? 'Вт' : 'W';
      const mid = this.shadowRoot.querySelector('[data-role="power-range-mid"]');
      if (mid) mid.textContent = (power.top / 2).toLocaleString(this._locale(), { maximumFractionDigits: 0 });
      const top = this.shadowRoot.querySelector('[data-role="power-range-top"]');
      if (top) top.textContent = `${power.top.toLocaleString(this._locale(), { maximumFractionDigits: 0 })} ${unit}`;
    }

    _powerScaleMax() {
      const peak = this._num('power_peak');
      const base = Math.max(peak ?? 0, 500) * 1.15;
      const magnitude = 10 ** Math.floor(Math.log10(base));
      return [1, 2, 2.5, 5, 10].map((multiplier) => multiplier * magnitude).find((value) => value >= base) ?? 10 * magnitude;
    }

    _powerRangeLayout() {
      const top = this._powerScaleMax();
      const pct = (value) => (value === null ? null : Math.max(0, Math.min(100, (value / top) * 100)));
      const low = pct(this._num('power_min')); const high = pct(this._num('power_peak')); const now = pct(this._num('power'));
      return {
        top,
        span: low === null || high === null ? 'display:none' : `left:${low.toFixed(1)}%;width:${Math.max(high - low, 1.2).toFixed(1)}%`,
        now: now === null ? 'display:none' : `left:${now.toFixed(1)}%`,
      };
    }

    _powerRangeCard() {
      const layout = this._powerRangeLayout();
      const unit = this._lang() === 'uk' ? 'Вт' : 'W';
      const fmt = (value) => value.toLocaleString(this._locale(), { maximumFractionDigits: 0 });
      return `<div class="range-card power-range" data-role="power-range-card">
        <div class="range-head"><h3>${this._escape(this._t(!Number.isFinite(this._statsStart) ? 'power_range_title' : 'power_range_period'))}</h3><div class="range-values"><span>${this._escape(this._t('stat_min'))} <b data-value-key="power_min" data-value-digits="1">${this._escape(this._formatted('power_min', 1))}</b></span><span>${this._escape(this._t('stat_max'))} <b data-value-key="power_peak" data-value-digits="0">${this._escape(this._formatted('power_peak', 0))}</b></span></div></div>
        <div class="range-track"><i class="range-span" data-role="power-range-span" style="${layout.span}"></i><b class="range-now" data-role="power-range-now" style="${layout.now}"></b></div>
        <div class="range-scale"><span>0</span><span data-role="power-range-mid">${fmt(layout.top / 2)}</span><span data-role="power-range-top">${fmt(layout.top)} ${this._escape(unit)}</span></div>
      </div>`;
    }

    _params() {
      return `<section class="detail-panel"><h2>${this._escape(this._t('params_title'))}</h2>${this._chart()}${this._rangeCard()}${this._powerRangeCard()}<div class="detail-grid">
        ${this._detail('apparent_power', this._t('apparent'), 0, 'bolt')}${this._detail('reactive_power', this._t('reactive'), 0, 'frequency')}${this._detail('phase_angle', this._t('phase'), 1, 'angle')}
        ${this._detail('voltage_deviation', this._t('deviation'), 1, 'deviation')}${this._detail('voltage_average', this._t('average'), 1, 'average')}${this._detail('voltage_status', this._t('voltage_state'), 0, 'shield')}
        ${this._voltageRangeDetail('min', this._t('min_voltage'), 'arrow_down')}${this._voltageRangeDetail('max', this._t('max_voltage'), 'arrow_up')}${this._detail('current_max', this._t(!Number.isFinite(this._statsStart) ? 'max_current' : 'max_current_period'), 2, 'current')}${this._detail('power_peak', this._t(!Number.isFinite(this._statsStart) ? 'peak_power' : 'peak_power_period'), 0, 'peak')}
      </div><h2 class="subheading">${this._escape(this._t('events'))}</h2><div class="detail-grid">
        ${this._detail('inverter_events', this._t('inverter_events'), 0, 'alert')}${this._detail('inverter_current_duration', this._t('current_duration'), 1, 'clock')}${this._detail('last_inverter_duration', this._t('last_duration'), 1, 'clock')}${this._detail('total_inverter_time', this._t('total_duration'), 2, 'sum')}${this._detail('sag_count', this._t('sag_events'), 0, 'sag')}${this._detail('swell_count', this._t('swell_events'), 0, 'swell')}
      </div></section>`;
    }

    _energy() {
      const twoZone = this._raw('two_zone') === 'on';
      return `<section class="detail-panel energy-panel"><h2>${this._escape(this._t('energy_title'))}</h2>
        <div class="energy-hero">
          <article class="energy-visual energy-coin"><span class="eyebrow">${this._escape(this._t('today'))}</span><strong class="hero-number" data-value-key="energy_today" data-value-digits="2">${this._escape(this._formatted('energy_today', 2))}</strong><small>${this._escape(this._t('estimated_cost'))} · <span data-value-key="cost_today" data-value-digits="2">${this._escape(this._formatted('cost_today', 2))}</span></small>${this._energyCoinArt()}</article>
          <article class="energy-visual energy-load"><span class="eyebrow">${this._escape(this._t('current_load'))}</span><strong class="hero-number" data-value-key="power" data-value-digits="0">${this._escape(this._formatted('power', 0))}</strong><small>${this._escape(this._t('cost_rate'))} · <span data-value-key="cost_rate" data-value-digits="2">${this._escape(this._formatted('cost_rate', 2))}</span></small>${this._plugArt()}</article>
        </div>
        ${this._energyChart()}
        <div class="detail-grid energy-grid">
          ${this._detail('energy_today', this._t('today'), 3, 'energy')}${this._detail('energy_month', this._t('energy_month'), 2, 'calendar')}${this._detail('energy_total', this._t('energy_total'), 3, 'sum')}
          ${this._detail('cost_today', this._t('cost_today'), 2, 'coin')}${this._detail('cost_month', this._t('cost_month'), 2, 'calendar')}${this._detail('cost_total', this._t('cost_total'), 2, 'sum')}
          ${this._detail('tariff', this._t('tariff'), 2, 'tag')}${this._detail('cost_rate', this._t('cost_rate'), 2, 'gauge')}
          ${twoZone ? `<div class="detail tariff-state has-icon">${this._detailIcon('clock')}<span>${this._escape(this._t('two_zone'))}</span><b data-role="energy-two-zone-value" class="good">${this._escape(this._t('on'))}</b><i class="tariff-led active" data-role="energy-two-zone-led"></i></div>` : ''}
        </div>
      </section>`;
    }

    _energyChartControlsHtml() {
      const metric = this._energyChartMetric || 'energy_total';
      const metrics = [['energy_total', 'energy_metric_energy'], ['cost_total', 'energy_metric_cost']]
        .map(([key, label]) => `<button type="button" class="period-button ${metric === key ? 'active' : ''}" data-energy-metric="${key}" aria-pressed="${metric === key}">${this._escape(this._t(label))}</button>`).join('');
      const periods = ['hour', 'day', 'week', 'month'].map((period) => `<button type="button" class="period-button ${this._energyHistoryRange === period ? 'active' : ''}" data-energy-period="${period}" aria-pressed="${this._energyHistoryRange === period}">${this._escape(this._t(period))}</button>`).join('');
      return `<div class="periods chart-metric-periods" role="group" aria-label="${this._escape(this._t('energy_metric_group'))}">${metrics}</div><div class="periods chart-range-periods" role="group" aria-label="${this._escape(this._t('chart_period'))}">${periods}${this._chartDateRangeHtml('energy')}</div>`;
    }

    _energyChart(metricKey = this._energyChartMetric || 'energy_total') {
      const title = metricKey === 'energy_total' ? 'energy_chart_title' : 'cost_chart_title';
      return `<section class="card chart-card energy-history-card"><div class="chart-head"><h2><span class="chart-icon">${this._svg('chart')}</span><span data-energy-chart-title>${this._escape(this._t(title))}</span></h2>${this._energyChartControlsHtml()}</div><div class="chart-stats" data-energy-stats="${metricKey}">${this._chartStatsHtml(metricKey, this._energyHistory[metricKey], 'energy')}</div><div class="chart-plot energy-chart-plot" data-energy-plot="${metricKey}">${this._energyBarSvg(metricKey, this._energyHistory[metricKey], this._energyHistoryLoading[metricKey])}</div><div class="energy-selection" data-energy-selection role="status" aria-live="polite">${this._energyBarSelectionHtml(metricKey)}</div></section>`;
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
            <linearGradient id="hrnGold" x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0%" stop-color="#fff8cc"/>
              <stop offset="35%" stop-color="#ffd54f"/>
              <stop offset="70%" stop-color="#d9981a"/>
              <stop offset="100%" stop-color="#a86f06"/>
            </linearGradient>
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

          <!-- 3D Embossed Hryvnia Symbol ₴ (outline of the real glyph) -->
          <g filter="url(#goldGlow)" transform="translate(65, 63)">
            <path d="M19.7 8.5V1.7H-19.7V8.5H-15.1C-16.3 10 -17 11.9 -17 13.8C-17 21.4 -11.1 26 0.1 26C11.8 26 17.3 21.8 17.8 12.3H7.2C7 16.2 4.3 17.6 0.1 17.6C-4.1 17.6 -6.6 15.9 -6.6 13.1C-6.6 11.5 -5.9 9.8 -4.6 8.5ZM0.3 -17.5C4.2 -17.5 6.1 -16 6.1 -13.6C6.1 -11.8 5.4 -10.4 4.1 -9.1H-19.7V-2.1H19.7V-9.1H14.6C15.7 -10.6 16.4 -12.4 16.4 -14.4C16.4 -21.4 10.6 -26 0.2 -26C-10.5 -26 -15.8 -21.2 -16.3 -12.8H-5.8C-5.7 -14.9 -4.5 -17.5 0.3 -17.5Z" fill="#3d2800" transform="translate(1.7 2.3)"/>
            <path d="M19.7 8.5V1.7H-19.7V8.5H-15.1C-16.3 10 -17 11.9 -17 13.8C-17 21.4 -11.1 26 0.1 26C11.8 26 17.3 21.8 17.8 12.3H7.2C7 16.2 4.3 17.6 0.1 17.6C-4.1 17.6 -6.6 15.9 -6.6 13.1C-6.6 11.5 -5.9 9.8 -4.6 8.5ZM0.3 -17.5C4.2 -17.5 6.1 -16 6.1 -13.6C6.1 -11.8 5.4 -10.4 4.1 -9.1H-19.7V-2.1H19.7V-9.1H14.6C15.7 -10.6 16.4 -12.4 16.4 -14.4C16.4 -21.4 10.6 -26 0.2 -26C-10.5 -26 -15.8 -21.2 -16.3 -12.8H-5.8C-5.7 -14.9 -4.5 -17.5 0.3 -17.5Z" fill="#7a5000" stroke="#7a5000" stroke-width="1.4" stroke-linejoin="round" transform="translate(.8 1.1)"/>
            <path d="M19.7 8.5V1.7H-19.7V8.5H-15.1C-16.3 10 -17 11.9 -17 13.8C-17 21.4 -11.1 26 0.1 26C11.8 26 17.3 21.8 17.8 12.3H7.2C7 16.2 4.3 17.6 0.1 17.6C-4.1 17.6 -6.6 15.9 -6.6 13.1C-6.6 11.5 -5.9 9.8 -4.6 8.5ZM0.3 -17.5C4.2 -17.5 6.1 -16 6.1 -13.6C6.1 -11.8 5.4 -10.4 4.1 -9.1H-19.7V-2.1H19.7V-9.1H14.6C15.7 -10.6 16.4 -12.4 16.4 -14.4C16.4 -21.4 10.6 -26 0.2 -26C-10.5 -26 -15.8 -21.2 -16.3 -12.8H-5.8C-5.7 -14.9 -4.5 -17.5 0.3 -17.5Z" fill="url(#hrnGold)" stroke="#fff3b0" stroke-width=".7" stroke-linejoin="round"/>
            <path d="M19.7 8.5V1.7H-19.7V8.5H-15.1C-16.3 10 -17 11.9 -17 13.8C-17 21.4 -11.1 26 0.1 26C11.8 26 17.3 21.8 17.8 12.3H7.2C7 16.2 4.3 17.6 0.1 17.6C-4.1 17.6 -6.6 15.9 -6.6 13.1C-6.6 11.5 -5.9 9.8 -4.6 8.5ZM0.3 -17.5C4.2 -17.5 6.1 -16 6.1 -13.6C6.1 -11.8 5.4 -10.4 4.1 -9.1H-19.7V-2.1H19.7V-9.1H14.6C15.7 -10.6 16.4 -12.4 16.4 -14.4C16.4 -21.4 10.6 -26 0.2 -26C-10.5 -26 -15.8 -21.2 -16.3 -12.8H-5.8C-5.7 -14.9 -4.5 -17.5 0.3 -17.5Z" fill="none" stroke="#fffbe0" stroke-width=".35" opacity=".85" transform="translate(-.5 -.6)"/>
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
            <linearGradient id="brassPin" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#fff0aa"/>
              <stop offset="28%" stop-color="#e0a828"/>
              <stop offset="55%" stop-color="#fff1b0"/>
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
          <path d="M61,111 C61,103 59,97 62,89" fill="none" stroke="#527099" stroke-opacity=".45" stroke-width="1.5" stroke-linecap="round"/>

          <!-- Strain Relief Collar -->
          <rect x="56" y="80" width="18" height="10" rx="3" fill="#1b2e4d" stroke="#2c4c7c" stroke-width="1.2"/>
          <line x1="56" y1="84" x2="74" y2="84" stroke="#0d182b" stroke-width="1.2"/>
          <line x1="58" y1="82" x2="58" y2="88" stroke="#527099" stroke-opacity=".6" stroke-width=".8"/>
          <line x1="62" y1="82" x2="62" y2="88" stroke="#091424" stroke-width=".8"/>
          <line x1="66" y1="82" x2="66" y2="88" stroke="#527099" stroke-opacity=".6" stroke-width=".8"/>
          <line x1="70" y1="82" x2="70" y2="88" stroke="#091424" stroke-width=".8"/>

          <!-- Main Plug Ergonomic Body -->
          <path d="M40,46 C40,40 50,38 65,38 C80,38 90,40 90,46 L86,80 C86,83 80,85 65,85 C50,85 44,83 44,80 Z" fill="url(#plugBody)" stroke="#385b8c" stroke-width="1.5"/>

          <!-- Ergonomic Grip Grooves -->
          <line x1="48" y1="56" x2="82" y2="56" stroke="#0e1b2e" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="48" y1="56" x2="82" y2="56" stroke="#4872ab" stroke-width="1" stroke-linecap="round"/>
          <line x1="50" y1="65" x2="80" y2="65" stroke="#0e1b2e" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="50" y1="65" x2="80" y2="65" stroke="#4872ab" stroke-width="1" stroke-linecap="round"/>

          <!-- Rounded European plug pins with metallic highlights and recessed tips -->
          <g stroke="#624508" stroke-width=".7">
            <rect x="49" y="15" width="7" height="26" rx="3.5" fill="url(#brassPin)"/>
            <rect x="74" y="15" width="7" height="26" rx="3.5" fill="url(#brassPin)"/>
          </g>
          <path d="M51 19v17M76 19v17" fill="none" stroke="#fff6cf" stroke-opacity=".72" stroke-width="1" stroke-linecap="round"/>
          <ellipse cx="52.5" cy="17" rx="2.4" ry="1.2" fill="#76510a"/>
          <ellipse cx="77.5" cy="17" rx="2.4" ry="1.2" fill="#76510a"/>

          <!-- Side grounding contacts typical of a Schuko-style plug -->
          <path d="M42 57Q37 62 42 68M88 57Q93 62 88 68" fill="none" stroke="#d2dee8" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M42 59Q39 62 42 66M88 59Q91 62 88 66" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".8" stroke-linecap="round"/>
        </svg>
      `;
    }


    _settings() {
      const twoZone = this._raw('two_zone') === 'on';
      const esp = this._effectiveEspStatus();
      const deviceState = esp === 'on' ? this._t('online') : esp === 'off' ? this._t('offline') : esp === 'unavailable' ? this._t('unavailable') : this._t('unknown');
      const deviceClass = esp === 'on' ? 'online' : esp === 'off' ? 'offline' : 'unknown';
      return `<section class="detail-panel settings-panel"><h2>${this._escape(this._t('settings_title'))}</h2>
        <div class="settings-hero">${this._chipArt()}<div class="device-copy"><strong>${this._escape(this._t('device_name'))}</strong><span>${this._escape(this._t('device_description'))}</span></div><div class="device-status ${deviceClass}" data-role="device-status"><i></i><b data-role="device-state">${this._escape(deviceState)}</b></div></div>
        <div class="detail-grid settings-grid">
        ${this._setting('sag_threshold', this._t('sag'))}${this._setting('swell_threshold', this._t('swell'))}${this._setting('nominal_voltage', this._t('nominal'))}${this._setting('tariff_day', this._t('tariff_day'))}${twoZone ? this._setting('tariff_night', this._t('tariff_night')) : ''}
        <div class="detail switch-setting"><span>${this._escape(this._t('two_zone'))}</span><strong data-role="switch-value">${this._escape(twoZone ? this._t('on') : this._t('off'))}</strong><button class="switch-button ${twoZone ? 'on' : ''}" data-switch="two_zone" aria-pressed="${twoZone}">${this._svg('gear')}<span data-role="switch-label">${this._escape(twoZone ? this._t('on') : this._t('off'))}</span></button></div>
      </div>${this._statsStartSetting()}<h2 class="subheading">${this._escape(this._t('diagnostics'))}</h2><div class="detail-grid">
        ${this._detail('wifi_signal', this._t('wifi'), 0)}${this._detail('esp_temperature', this._t('temperature'), 1)}${this._detail('uptime', this._t('uptime'), 0)}${this._detail('ip_address', this._t('ip'), 0)}${this._detail('ssid', this._t('ssid'), 0)}${this._detail('inverter_events', this._t('inverter_events'), 0)}
      </div><h2 class="subheading">${this._escape(this._t('actions'))}</h2><div class="actions-section" data-role="actions-section"><button type="button" class="actions-toggle" data-actions-toggle aria-expanded="${this._actionsOpen ? 'true' : 'false'}" aria-controls="grid-monitor-actions"><span data-role="actions-toggle-label">${this._escape(this._t(this._actionsOpen ? 'actions_hide' : 'actions_show'))}</span><span class="actions-chevron" aria-hidden="true"></span></button><div class="actions-body" id="grid-monitor-actions" data-role="actions-body" ${this._actionsOpen ? '' : 'hidden'}><p class="history-cleanup-hint">${this._escape(this._t('history_cleanup_hint'))}</p><div class="action-grid">
        ${this._action('reset_energy', this._t('reset_energy'))}${this._action('reset_events', this._t('reset_events'))}${this._action('reset_cost', this._t('reset_cost'))}${this._action('reset_stats', this._t('reset_stats'))}${this._action('restart', this._t('restart'))}${this._historyCleanupActions()}
      </div></div></div></section>`;
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

    _tabs(position) {
      const tab = (id, key, icon) => `<button class="tab ${this._activeTab === id ? 'active' : ''}" data-tab="${id}" aria-selected="${this._activeTab === id}"><span class="tab-icon">${this._svg(icon)}</span>${this._escape(this._t(key))}</button>`;
      return `<nav class="tabs card tabs-${position}" aria-label="${this._escape(this._t('home'))}">${tab('home', 'home', 'home')}${tab('params', 'params_tab', 'params')}${tab('energy', 'energy_tab', 'energy')}${tab('settings', 'settings_tab', 'settings')}</nav>`;
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
      const homeClass = this._activeTab === 'home' ? ' home-active' : '';
      const activeContent = this._activeTab === 'home' ? this._home() : this._activeTab === 'params' ? this._params() : this._activeTab === 'energy' ? this._energy() : this._settings();
      this.shadowRoot.innerHTML = `<style>${GridMonitorCard.CSS}</style><main class="shell ${status.stateClass}${readyClass}${homeClass}${this._ecoClass()}">
        ${this._activeTab === 'home' ? '' : this._headerHtml()}
        ${this._activeTab === 'home' ? this._tabs('top') : ''}
        <div class="page-layout">
          <div class="view">${activeContent}</div>
        </div>
        <footer class="footer"><span>ESPHome · Grid Monitor</span><span data-value-key="ssid" data-value-digits="0">${this._escape(this._formatted('ssid', 0))}</span></footer>
      </main><button class="back-to-top" type="button" popover="manual" data-scroll-top aria-label="${this._escape(this._t('scroll_to_top'))}" title="${this._escape(this._t('scroll_to_top'))}">${this._svg('arrow_up')}</button>`;
      this._hasRendered = true;
      this._renderedLanguage = this._lang();
      this._updateScrollTopVisibility();
      this._queueChartMeasure();
    }

    _activeContent() {
      return this._activeTab === 'home' ? this._home() : this._activeTab === 'params' ? this._params() : this._activeTab === 'energy' ? this._energy() : this._settings();
    }

    _selectEnergyBar(index, restoreFocus = false) {
      const metricKey = this._energyChartMetric || 'energy_total';
      const bars = this._energyHistoryBars(this._energyHistory[metricKey] || [], this._energyHistoryBounds(), this._energyHistoryRange);
      const bar = bars[index];
      if (!bar) return;
      this._energySelectedBar = { metricKey, start: bar.start };
      this._refreshEnergyCharts();
      if (restoreFocus) this.shadowRoot.querySelector(`[data-energy-bar="${index}"]`)?.focus?.();
    }

    _handleCardKeydown(event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target?.closest?.('[data-energy-bar]');
      if (!target) return;
      event.preventDefault?.();
      this._selectEnergyBar(Number(target.dataset.energyBar), true);
    }

    _handleCardClick(event) {
      this._handleChartDatePointerDown(event);
      if (this.shadowRoot?.querySelector?.('[data-chart-calendar]')) {
        const calendarNav = event.target?.closest?.('[data-chart-calendar-nav]');
        if (calendarNav) { this._navigateChartDateCalendar(Number(calendarNav.dataset.chartCalendarNav), calendarNav.dataset.chartScope || 'params'); return; }
        const calendarDay = event.target?.closest?.('[data-chart-calendar-day]');
        if (calendarDay && !calendarDay.disabled) { this._selectChartCalendarDate(calendarDay.dataset.chartCalendarDay, calendarDay.dataset.chartScope || 'params'); return; }
        const calendarOpen = event.target?.closest?.('[data-chart-calendar-open]');
        if (calendarOpen) { this._openChartDateCalendar(calendarOpen.dataset.chartScope || 'params', calendarOpen.dataset.chartField || 'start'); return; }
      }
      const dialogAction = event.target?.closest?.('[data-dialog-action]');
      if (dialogAction) {
        this._finishDialog(dialogAction.dataset.dialogAction === 'confirm' || dialogAction.dataset.dialogAction === 'close');
        return;
      }
      const infoButton = event.target?.closest?.('[data-metric-info]');
      if (infoButton) {
        const info = METRIC_INFO[infoButton.dataset.metricInfo];
        if (info) this._showDialog({ title: this._t(info.label), message: this._t(info.description), info: true });
        return;
      }
      const target = event.target?.closest?.('[data-scroll-top], [data-actions-toggle], [data-tab], [data-period], [data-energy-period], [data-energy-metric], [data-energy-bar], [data-metric], [data-action], [data-number-save], [data-switch], [data-chart-live], [data-chart-zoom], [data-chart-date-toggle], [data-chart-date-apply], [data-stats-start-apply], [data-stats-start-clear], [data-stats-helper-create], [data-history-delete]');
      if (!target) return;
      if (target.dataset.scrollTop !== undefined) { this._scrollPageToTop(); return; }
      if (target.dataset.energyBar !== undefined) { this._selectEnergyBar(Number(target.dataset.energyBar)); return; }
      if (target.dataset.chartDateToggle !== undefined) {
        const panel = this.shadowRoot.getElementById(target.getAttribute('aria-controls'));
        let isOpen = false;
        try { isOpen = panel?.matches(':popover-open'); } catch (_error) { isOpen = !panel?.hidden; }
        if (isOpen) this._closeChartDateRangePopover(panel);
        else {
          this._updateChartDateRangeControls(target.dataset.chartScope || 'params');
          this._positionChartDateRangePopover(target, panel);
        }
        return;
      }
      if (target.dataset.actionsToggle !== undefined) { this._toggleActions(); return; }
      if (target.dataset.tab) {
        if (target.dataset.tab === this._activeTab) return;
        if (this._activeTab === 'settings') this._setActionsOpen(false);
        const wasHome = this._activeTab === 'home';
        if (this._activeTab === 'params' && target.dataset.tab !== 'params') this._clearChartScrub();
        this._activeTab = target.dataset.tab;
        if (wasHome !== (this._activeTab === 'home')) {
          this._render();
          this._ensureHistory();
          this._ensureEnergyHistory();
          return;
        }
        this.shadowRoot.querySelector('.shell')?.classList.toggle('home-active', this._activeTab === 'home');
        this.shadowRoot.querySelectorAll('[data-tab]').forEach((button) => {
          const active = button.dataset.tab === this._activeTab;
          button.classList.toggle('active', active);
          button.setAttribute('aria-selected', String(active));
        });
        const view = this.shadowRoot.querySelector('.view');
        if (view) view.innerHTML = this._activeContent();
        this._queueChartMeasure();
        this._ensureHistory();
        this._ensureEnergyHistory();
        return;
      }
      if (target.dataset.chartLive !== undefined) {
        const wasCustom = this._historyRange === 'custom';
        if (wasCustom) {
          this._historyRange = this._historyReturnRange || 'hour';
          this._historyCustomRange = null;
          this._historyKey = '';
          this._history = [];
          this._voltageHistoryKey = '';
          this._voltageHistory = [];
          this.shadowRoot.querySelectorAll('[data-period]').forEach((button) => {
            const active = button.dataset.period === this._historyRange;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
          });
          this._updateChartDateRangeControls();
        }
        this._clearChartScrub();
        if (wasCustom) this._reloadChartHistory();
        else this._updateChartCurrent();
        return;
      }
      if (target.dataset.chartZoom) { this._zoomChart(target.dataset.chartZoom); return; }
      if (target.dataset.chartDateApply !== undefined) { this._applyChartDateRange(target.dataset.chartScope || 'params'); return; }
      if (target.dataset.statsStartApply !== undefined) { this._applyStatsStartInput(); return; }
      if (target.dataset.statsStartClear !== undefined) { this._setStatsStart(null); return; }
      if (target.dataset.statsHelperCreate !== undefined) { this._createStatsStartHelper(); return; }
      if (target.dataset.historyDelete !== undefined) { this._deletePanelHistory(target.dataset.historyDelete); return; }
      if (target.dataset.metric) {
        if (this._chartMetric === target.dataset.metric) return;
        this._clearChartScrub();
        this._historyRequest += 1;
        this._historyLoading = false;
        this._chartMetric = target.dataset.metric;
        this._historyKey = '';
        this._history = [];
        this.shadowRoot.querySelectorAll('[data-metric]').forEach((button) => {
          const active = button.dataset.metric === this._chartMetric;
          button.classList.toggle('active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        this._refreshChart();
        this._ensureHistory();
        return;
      }
      if (target.dataset.energyMetric) {
        if (this._energyChartMetric === target.dataset.energyMetric) return;
        this._energyChartMetric = target.dataset.energyMetric;
        this._energySelectedBar = null;
        this._refreshEnergyCharts();
        return;
      }
      if (target.dataset.energyPeriod) {
        if (this._energyHistoryRange === target.dataset.energyPeriod) return;
        this._energyHistoryRange = target.dataset.energyPeriod;
        this._energyCustomRange = null;
        this._clearEnergyHistory();
        this.shadowRoot.querySelectorAll('[data-energy-period]').forEach((button) => {
          const active = button.dataset.energyPeriod === this._energyHistoryRange;
          button.classList.toggle('active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        this._updateChartDateRangeControls('energy');
        this._closeChartDateRangePopover();
        this._refreshEnergyCharts();
        this._ensureEnergyHistory();
        return;
      }
      if (target.dataset.period) {
        if (this._historyRange === target.dataset.period) return;
        this._clearChartScrub();
        this._historyRequest += 1;
        this._historyLoading = false;
        this._voltageHistoryRequest += 1;
        this._voltageHistoryLoading = false;
        this._historyRange = target.dataset.period;
        this._historyCustomRange = null;
        this._historyKey = '';
        this._history = [];
        this._voltageHistoryKey = '';
        this._voltageHistory = [];
        this.shadowRoot.querySelectorAll('[data-period]').forEach((button) => {
          const active = button.dataset.period === this._historyRange;
          button.classList.toggle('active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        this._updateChartDateRangeControls();
        this._refreshChart();
        this._ensureHistory();
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
      if (changed.has('stats_start')) {
        if (this._hasStatsStartHelper()) this._statsHelperCreated = false;
        let start = this._readStatsStart();
        if (start === null && this._statsNeedsPersist && Number.isFinite(this._statsStart)) {
          this._migrateStatsStart(false);
          start = this._statsStart;
        }
        if (start !== this._statsStart) this._setStatsStart(start, false);
        this._updateStatsControls();
      }
      this._updateValueBindings(changed);
      if (changed.has('esp_status') || changed.has('esp_connectivity')) this._refreshConnectivityUI();
      if (changed.has('voltage') || changed.has('power') || changed.has('current')) this._updateHeaderTime();
      if (changed.has('mains') || changed.has('inverter') || changed.has('source_status') || changed.has('voltage_status') || changed.has('esp_status') || changed.has('voltage_alarm')) {
        this._updateStatusClasses();
        }
      if (Number.isFinite(this._statsStart) && this._statsExtremes && Date.now() >= this._statsStart) {
        let extremesChanged = false;
        for (const metric of STATS_METRIC_KEYS) {
          if (changed.has(metric)) {
            const raw = this._raw(metric);
            const val = raw !== null && raw !== 'unknown' && raw !== 'unavailable' ? Number(raw) : NaN;
            if (Number.isFinite(val)) {
              const { plausible: [lowest, highest], positiveMin } = STATS_METRICS[metric];
              if (val >= lowest && val <= highest) {
                const ext = this._statsExtremes[metric] = this._statsExtremes[metric] || { min: null, max: null };
                if (ext.max === null || val > ext.max) { ext.max = val; extremesChanged = true; }
                if ((!positiveMin || val > 0) && (ext.min === null || val < ext.min)) { ext.min = val; extremesChanged = true; }
              }
            }
          }
        }
        if (extremesChanged) {
          this._applyStatsExtremes();
        }
      }
      if (this._activeTab === 'home') this._updateHome(changed);
      if (this._activeTab === 'params') {
        this._updateRange();
        if (changed.has(this._chartMetric || 'power')) this._refreshChart();
      }
      if (changed.has('two_zone') && (this._activeTab === 'energy' || this._activeTab === 'settings')) {
        const view = this.shadowRoot.querySelector('.view');
        if (view) view.innerHTML = this._activeContent();
        this._queueChartMeasure();
        if (this._activeTab === 'energy') this._ensureEnergyHistory();
        return;
      }
      if (this._activeTab === 'energy') this._updateEnergy(changed);
      if (this._activeTab === 'settings') this._updateSettings(changed);
    }

    _updateConnectionStatus() {
      const esp = this._effectiveEspStatus();
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

    _updateStatusClasses() {
      const status = this._displayStatus();
      const shell = this.shadowRoot.querySelector('.shell');
      const voltage = this.shadowRoot.querySelector('[data-role="voltage-card"]');
      const indicator = this.shadowRoot.querySelector('[data-role="state-indicator"]');
      const banner = this.shadowRoot.querySelector('[data-role="home-banner"]');
      if (shell) shell.className = `shell ${status.stateClass}${this._hasRendered ? ' render-ready' : ''}${this._activeTab === 'home' ? ' home-active' : ''}${this._ecoClass()}`;
      if (voltage) voltage.className = `card voltage ${status.stateClass}`;
      if (indicator) indicator.className = `state-indicator ${status.stateClass}`;
      const indicatorLabel = indicator?.querySelector('[data-role="state-label"]');
      if (indicatorLabel) indicatorLabel.textContent = status.status;
      if (banner) banner.className = `card banner ${status.stateClass}`;
      const light = this._houseLighting(status);
      this.shadowRoot.querySelectorAll('[data-role="house-scene"]').forEach((scene) => {
        scene.classList.toggle('interior-off', light.interiorOff);
        scene.classList.toggle('exterior-off', light.exteriorOff);
      });
      const bannerLabel = banner?.querySelector('[data-role="home-banner-label"]');
      if (bannerLabel) bannerLabel.textContent = status.banner;
    }

    _updateGauge() {
      const voltage = this._num('voltage');
      const progress = gaugeProgress(voltage);
      const number = voltage === null ? this._formatted('voltage') : voltage.toLocaleString(this._locale(), { maximumFractionDigits: 1 });
      const unit = voltage === null ? '' : this._unit('voltage') || (this._lang() === 'uk' ? 'В' : 'V');
      const numberNode = this.shadowRoot.querySelector('[data-role="voltage-number"]');
      const unitNode = this.shadowRoot.querySelector('[data-role="voltage-unit"]');
      if (numberNode) numberNode.textContent = number;
      if (unitNode) unitNode.textContent = unit;
      this.shadowRoot.querySelectorAll('[data-role="gauge-progress"], [data-role="gauge-progress-glow"]').forEach((arc) => {
        arc.setAttribute('stroke-dasharray', `${progress} 100`);
        arc.setAttribute('visibility', voltage === null ? 'hidden' : 'visible');
      });
      this.shadowRoot.querySelector('[data-role="voltage-text"]')?.classList.toggle('empty', voltage === null);
      this.shadowRoot.querySelectorAll('[data-gauge-tick]').forEach((tick) => {
        tick.classList.toggle('active', voltage !== null && Number(tick.dataset.gaugeTick) / 24 * 100 <= progress);
      });
      const dot = this.shadowRoot.querySelector('[data-role="gauge-dot"]');
      if (dot) {
        if (voltage === null) dot.setAttribute('visibility', 'hidden');
        else {
          const [markerX, markerY] = gaugeMarker(progress);
          dot.setAttribute('cx', markerX.toFixed(1));
          dot.setAttribute('cy', markerY.toFixed(1));
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
      metric.classList.toggle('empty', value === null);
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
      if (this._scrubTime !== null && this._restoreChartScrub()) return;
      const metricKey = this._chartMetric || 'power';
      const metric = CHART_METRICS[metricKey];
      const current = this._num(metricKey);
      const minimum = Number(chart.dataset.chartMin) || 0;
      const maximum = Math.max(minimum + 1, Number(chart.dataset.chartMax) || 250);
      const y0 = Number(chart.dataset.chartY0) || 26; const y1 = Number(chart.dataset.chartY1) || 170;
      const x1 = Number(chart.dataset.chartX1) || 980;
      const cross = chart.querySelector('[data-role="chart-cross"]');
      if (cross) cross.setAttribute('visibility', 'hidden');
      if (current === null || current < metric.plausible[0] || current > metric.plausible[1]) {
        this._setChartMarker(chart, x1, y1, '');
        return;
      }
      const value = Math.max(minimum, Math.min(maximum, current));
      const y = y1 - ((value - minimum) / (maximum - minimum)) * (y1 - y0);
      this._setChartMarker(chart, x1, y, `${current.toLocaleString(this._locale(), { maximumFractionDigits: metric.digits })} ${metric.unit(this._lang(), this._currencyCode())}`);
    }

    _updateEnergyTwoZone() {
      const active = this._raw('two_zone') === 'on';
      const label = this._t(active ? 'on' : 'off');
      const value = this.shadowRoot.querySelector('[data-role="energy-two-zone-value"]');
      const led = this.shadowRoot.querySelector('[data-role="energy-two-zone-led"]');
      if (value) { value.textContent = label; value.classList.toggle('good', active); }
      if (led) led.classList.toggle('active', active);
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
      if (changed.has('esp_status') || changed.has('esp_connectivity')) this._updateDeviceStatus();
      if (changed.has('two_zone')) this._updateSwitch();
      for (const key of ['reset_energy', 'reset_events', 'reset_cost', 'reset_stats', 'restart']) {
        if (!changed.has(key)) continue;
        const button = this.shadowRoot.querySelector(`[data-action="${key}"]`);
        if (button) button.disabled = !this._state(key);
      }
    }

    _updateDeviceStatus() {
      const esp = this._effectiveEspStatus();
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
      if (changed.has('two_zone')) this._updateEnergyTwoZone();
    }

    _showDialog({ title, message, confirm = false, info = false, confirmLabel = '' }) {
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
        const primaryLabel = confirm ? (confirmLabel || this._t('dialog_confirm')) : this._t('dialog_close');
        dialog.innerHTML = `<section class="app-dialog" role="dialog" aria-modal="true" aria-labelledby="grid-monitor-dialog-title" aria-describedby="grid-monitor-dialog-message">
          <div class="dialog-mark" aria-hidden="true">${confirm ? this._svg('gear') : info ? 'i' : '!'}</div>
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
        .brand{min-width:0}.brand h1{font-size:clamp(23px,3.2cqw,39px);margin:0 0 3px;letter-spacing:-1px;line-height:1.1}.brand p{margin:0;color:#a9bedc;font-size:clamp(14px,1.8cqw,20px)}.headright{margin-left:auto;display:flex;align-items:center;gap:20px;color:#9eb5d5}.connection{text-align:right;white-space:nowrap}.connection strong{color:var(--green);font-size:18px}.connection.offline strong{color:var(--red)}.connection.unknown strong{color:var(--muted)}.connection small{display:block;color:#9eb5d5;margin-top:4px}.dot{display:inline-block;width:12px;height:12px;background:var(--green);border-radius:50%;margin-right:9px;box-shadow:0 0 15px var(--green)}.connection.offline .dot{background:var(--red);box-shadow:0 0 15px var(--red)}.connection.unknown .dot{background:#8194a9;box-shadow:none}
        .tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));padding:6px;gap:5px;margin-bottom:18px;background:linear-gradient(100deg,#15263b,#1b2c44)}.tabs-side{display:none}.tab{border:0;background:transparent;color:#a9bedc;padding:13px 8px;border-radius:17px;font:inherit;font-size:clamp(13px,1.5cqw,18px);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:11px;transition:background .18s,color .18s}.tab .tab-icon{font-size:24px;color:inherit}.tab .icon{width:25px;height:25px}.tab.active{background:linear-gradient(110deg,#078be9,#0875d5);color:white;box-shadow:0 5px 20px #008dff40}.tab:focus-visible,.period-button:focus-visible,.action-button:focus-visible,.save-button:focus-visible,.switch-button:focus-visible{outline:2px solid #8ce1ff;outline-offset:2px}
        .main-grid{display:grid;grid-template-columns:1.03fr 1fr;gap:14px}.voltage{min-height:385px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;position:relative;overflow:hidden}.voltage.alarm{border-color:#ff526d99}.voltage.inverter{border-color:#ffb51b99}.voltage.pzem-offline{border-color:#ffb51b99}.voltage-gauge{width:min(100%,490px);height:auto;overflow:visible}.voltage-value{font-size:70px;font-weight:800;letter-spacing:-2px;fill:#f7fbff}.voltage-unit{font-size:43px;letter-spacing:0}.voltage-label{font-size:25px;fill:#b3c8e4}.state-indicator{display:flex;align-items:center;gap:11px;color:var(--green);font-size:24px;font-weight:800;margin-top:-3px}.state-indicator.inverter{color:var(--amber)}.state-indicator.pzem-offline{color:var(--amber)}.state-indicator.alarm,.state-indicator.offline{color:var(--red)}.state-indicator.unknown{color:var(--muted)}.check-mark{width:32px;height:32px;border-radius:50%;background:var(--green);color:#052116;display:grid;place-items:center;box-shadow:0 0 18px #35ed9166}.check-mark .icon{width:23px;height:23px}.state-indicator.inverter .check-mark{background:var(--amber);color:#392400}.state-indicator.pzem-offline .check-mark{background:var(--amber);color:#392400}.state-indicator.alarm .check-mark,.state-indicator.offline .check-mark{background:var(--red);color:#390711}.state-indicator.unknown .check-mark{background:#53677e;color:#d6e5f6}
        .metrics{display:grid;grid-template-columns:1fr 1fr;gap:14px}.metric{min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;text-align:center}.metric-icon{font-size:48px;line-height:1.15;color:var(--blue);text-shadow:0 0 15px #009dff66}.metric-icon .icon{width:52px;height:52px}.metric.current .metric-icon{color:var(--cyan)}.metric.frequency .metric-icon{color:#08d6e7}.metric.pf .metric-icon{color:var(--purple)}.metric-value{font-size:clamp(30px,4cqw,53px);font-weight:800;letter-spacing:-1.5px;margin:4px 0;overflow-wrap:anywhere}.metric-value .unit{font-size:.62em;letter-spacing:0;white-space:nowrap}.metric-label{color:#b2c6e1;font-size:19px}
        .chart-card{margin-top:14px;padding:17px 20px 12px}.chart-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px}.chart-head h2{font-size:24px;margin:0;display:flex;align-items:center;gap:12px}.chart-icon{color:var(--blue);font-size:28px}.chart-icon .icon{width:30px;height:30px}.periods{margin-left:auto;display:flex;background:#1a2b42;border-radius:15px;padding:4px;gap:3px}.period-button{border:0;background:transparent;color:#b4c7e0;padding:8px 15px;border-radius:12px;font:inherit;font-size:15px;cursor:pointer}.period-button.active{background:#078de9;color:white;box-shadow:0 3px 12px #008fff55}.chart{width:100%;height:auto;display:block;overflow:visible}.chart-grid{fill:none;stroke:#29415c;stroke-width:1}.chart-grid text{fill:#b7c9df;stroke:none;font-size:14px}.chart-glow{fill:none;stroke:#0aaaff;stroke-width:8;opacity:.55}.chart-line{fill:none;stroke:#16b5ff;stroke-width:3.5;stroke-linejoin:round;stroke-linecap:round}.chart-dot{fill:#18baff;filter:drop-shadow(0 0 7px #18baff)}.chart-tag{fill:#0d2035;stroke:#08aaff}.chart-tag-text{fill:#fff!important;font-size:15px!important;font-weight:bold}.chart-empty{height:205px;display:grid;place-items:center;color:#91a8c3;font-size:14px;text-align:center;padding:20px}
        .info{padding:17px 12px;min-height:128px;display:flex;align-items:center;justify-content:center;gap:12px;min-width:0}.info .symbol{font-size:38px;flex:none;color:var(--green);filter:drop-shadow(0 0 10px #35ed9166)}.info .symbol .icon{width:42px;height:42px}.info .symbol.blue{color:#91b8e9}.info .symbol.amber{color:var(--amber)}.info .small{color:#b6c9e2;font-size:16px}.info strong{display:block;font-size:20px;margin-top:5px;overflow-wrap:anywhere}.info .good{color:var(--green)}.info .cost-line{margin-top:3px}
        .banner{margin-top:14px;padding:18px 24px;min-height:88px;display:flex;align-items:center;gap:18px;border:1px solid #39d77e;background:linear-gradient(90deg,#0c302a,#0c2631 68%,#102b42);box-shadow:0 0 24px #28d87920}.banner.inverter{border-color:#ffb51b;background:linear-gradient(90deg,#382711,#18283a 80%);box-shadow:0 0 24px #ffb51b20}.banner.pzem-offline{border-color:#ffb51b;background:linear-gradient(90deg,#382711,#18283a 80%);box-shadow:0 0 24px #ffb51b20}.banner.alarm,.banner.offline{border-color:#ff526d;background:linear-gradient(90deg,#3a1420,#18283a 80%);box-shadow:0 0 24px #ff526d20}.banner.unknown{border-color:#53677e;background:linear-gradient(90deg,#1a2939,#101e30)}.banner-check{width:48px;height:48px;border-radius:50%;background:var(--green);color:#052116;display:grid;place-items:center;flex:none;box-shadow:0 0 18px #35ed9166}.banner-check .icon{width:36px;height:36px}.banner.inverter .banner-check{background:var(--amber);color:#392400}.banner.pzem-offline .banner-check{background:var(--amber);color:#392400}.banner.alarm .banner-check,.banner.offline .banner-check{background:var(--red);color:#390711}.banner.unknown .banner-check{background:#53677e;color:#d6e5f6}.banner strong{color:#4df29a;font-size:clamp(17px,2cqw,24px)}.banner.inverter strong{color:#ffd078}.banner.pzem-offline strong{color:#ffd078}.banner.alarm strong,.banner.offline strong{color:#ff8a9a}.banner.unknown strong{color:#b4c7df}.house-art{margin-left:auto;width:130px;max-width:22%;flex:none;filter:drop-shadow(0 0 11px #1b8fff)}.house-art svg{display:block;width:100%;height:auto}
        .detail-panel{padding:22px;margin-top:2px}.detail-panel h2{margin:0 0 18px;font-size:25px}.detail-panel h2.subheading{margin:24px 0 14px;font-size:19px}.detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.detail{padding:16px;border-radius:16px;background:#13243a;border:1px solid #2b4562;min-width:0}.detail>span,.detail label>span{display:block;color:#9fb5d1;font-size:14px;margin-bottom:7px}.detail b{font-size:22px;overflow-wrap:anywhere}.setting{display:flex;align-items:end;gap:10px}.setting label{flex:1;min-width:0}.setting-input{display:flex;align-items:center;gap:8px}.setting-input input{width:100%;min-width:0;background:#091727;border:1px solid #37526f;border-radius:9px;color:var(--text);padding:10px;font:inherit;font-size:18px}.setting-input small{color:#9fb5d1;white-space:nowrap}.save-button,.switch-button,.action-button{border:1px solid #278ed0;background:#092645;color:#d7efff;border-radius:10px;padding:9px 12px;font:inherit;cursor:pointer}.save-button:hover,.switch-button:hover,.action-button:hover{background:#0c3962}.save-button:disabled,.switch-button:disabled,.action-button:disabled{opacity:.45;cursor:not-allowed}.switch-setting{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.switch-setting>span{color:#9fb5d1;font-size:14px}.switch-setting>strong{font-size:16px}.switch-button{grid-column:1/-1;display:flex;align-items:center;gap:8px;justify-content:center}.switch-button .icon{width:20px;height:20px}.switch-button.on{border-color:#35ed91;color:#35ed91}.action-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.action-button{min-height:68px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;font-size:13px;border-color:#2b8ed0}.action-button span{font-size:22px;color:#45bdff}.action-button .icon{width:25px;height:25px}.footer{display:flex;justify-content:space-between;gap:10px;margin:14px 2px 0;color:#6885a2;font-size:11px}.footer span:last-child{max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .chart-head .periods+.periods{margin-left:0}.chart-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:4px 0 10px}.chart-stats>div{background:#13243a;border:1px solid #2b4562;border-radius:14px;padding:9px 12px;min-width:0}.chart-stats span{display:block;color:#9fb5d1;font-size:13px}.chart-stats b{display:block;font-size:19px;margin-top:3px;overflow-wrap:anywhere}.chart-stats small{display:block;margin-top:3px;color:#86a1c1;font-size:12px;line-height:1.25}
        .voltage-brand{display:flex;align-items:flex-start;gap:10px;align-self:flex-start;width:100%;min-width:0;max-width:100%;margin-bottom:0;flex-wrap:wrap}.voltage-brand .logo{flex:none}.voltage-brand .brand{flex:1 1 auto}.voltage-brand .brand h1{margin:0 0 2px;line-height:1.15;font-size:clamp(20px,2.6cqw,32px)}.voltage-brand .brand p{font-size:clamp(13px,1.5cqw,16px);line-height:1.2}.voltage-brand .home-status{flex:none;align-self:flex-start;gap:8px;margin-left:auto;max-width:100%}.voltage-brand .home-status .connection small{margin-top:2px}.voltage .voltage-gauge{margin:0}.main-right{display:flex;flex-direction:column;gap:10px;min-width:0}.main-right>.metrics{flex:1}
        @container (min-width:960px){.shell.home-active>.tabs-top{display:none}.shell:not(.home-active)>.tabs-top{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:45%;min-width:360px;max-width:560px;margin:0 0 14px auto;padding:8px;gap:6px}.shell:not(.home-active)>.tabs-top .tab{padding:15px 8px}.shell:not(.home-active)>.page-layout{display:block;margin-top:-40px}.shell:not(.home-active)>.page-layout>.tabs-side{display:none}.home-view .main-grid{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);grid-template-rows:auto;align-items:stretch}.home-view .main-grid>.voltage{grid-column:1;grid-row:1}.home-view .main-grid>.main-right{grid-column:2;grid-row:1}.home-view .main-right>.tabs-side{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin:0;align-self:stretch;width:100%}}
        @container (max-width:959px){.home-view .main-grid{grid-template-columns:minmax(0,1fr);align-items:start}.home-view .main-right{display:contents}.home-view .main-right>.tabs-side{display:none}.home-view .main-grid>.voltage{grid-column:1;grid-row:1}.home-view .main-right>.metrics{grid-column:1;grid-row:2}.shell:not(.home-active)>.tabs-top{display:grid}.shell:not(.home-active)>.page-layout{display:block;margin-top:-40px}.shell:not(.home-active)>.page-layout>.tabs-side{display:none}}
        @container (max-width:760px){.shell{padding:12px}.header{gap:11px;padding:5px 2px 14px}.logo{width:58px;height:58px;border-radius:17px}.logo .icon{width:38px;height:38px}.headright{gap:8px}.connection strong{font-size:14px}.connection small{font-size:10px}.tabs{margin-bottom:12px}.tab{gap:5px;padding:12px 3px;font-size:12px}.tab .tab-icon{font-size:19px}.tab .icon{width:20px;height:20px}.main-grid{grid-template-columns:1fr;gap:10px}.voltage{min-height:300px}.voltage-gauge{width:min(100%,420px)}.metrics{gap:10px}.metric{min-height:135px}.metric-icon .icon{width:38px;height:38px}.metric-label{font-size:15px}.chart-card{padding:13px 11px}.chart-head h2{font-size:19px}.periods{width:100%;margin:0}.period-button{flex:1;padding:8px 4px;font-size:13px}.info{min-height:100px;padding:12px 8px}.info .symbol .icon{width:30px;height:30px}.info .small{font-size:13px}.info strong{font-size:16px}.banner{padding:14px;min-height:70px}.banner-check{width:38px;height:38px}.banner-check .icon{width:28px;height:28px}.house-art{width:80px}.detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.detail-panel{padding:16px}.detail-panel h2{font-size:22px}.action-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @container (max-width:420px){.connection small{max-width:105px}.tab{font-size:11px}.tab .tab-icon{display:none}.metric{min-height:122px;padding:12px 8px}.metric-value{font-size:clamp(25px,8cqw,34px)}.info{gap:8px}.info .symbol .icon{width:26px;height:26px}.info .small{font-size:12px}.info strong{font-size:14px}.detail-grid{grid-template-columns:1fr}.setting{align-items:stretch}}
        /* Premium instrument finish: layered glass, metal highlights and soft depth. */
        :host{color-scheme:dark}.shell{position:relative;isolation:isolate;background:radial-gradient(ellipse at 12% 8%,#008bff25,transparent 32%),radial-gradient(ellipse at 88% 24%,#20e1b31a,transparent 30%),radial-gradient(ellipse at 50% 100%,#4351be20,transparent 42%),linear-gradient(145deg,#050b16,#091629 48%,#050b16);border-color:#70aee233;box-shadow:0 24px 60px #0009,inset 0 1px 0 #ffffff18,inset 0 -1px 0 #0008}
        .shell:before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;background:linear-gradient(122deg,#ffffff08,transparent 24%,transparent 77%,#16a6ff0b)}.shell>*{position:relative;z-index:1}
        .card{position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(145deg,#192d48f5,#091526fa 68%,#0a1c30f7);border:1px solid #70aee23d;box-shadow:0 16px 34px #0007,inset 0 1px 0 #ffffff20,inset 0 -1px 0 #0006;backdrop-filter:blur(14px);transition:border-color .24s,box-shadow .24s,transform .24s}
        .card:before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;border-radius:inherit;background:linear-gradient(128deg,#ffffff12,transparent 23%,transparent 72%,#1da9ff0c)}.card:after{content:"";position:absolute;left:9%;right:9%;top:0;height:1px;z-index:0;pointer-events:none;background:linear-gradient(90deg,transparent,#c5ecff55,transparent)}.card>*{position:relative;z-index:1}
        .logo{position:relative;overflow:hidden;background:radial-gradient(circle at 34% 20%,#2580d0,#0a2c59 50%,#061428 82%);border-color:#3aaef2a8;box-shadow:0 0 0 4px #009bff12,0 14px 32px #007fff4a,inset 0 2px 13px #ffffff35,inset 0 -8px 18px #0007}.logo:after{content:"";position:absolute;inset:-65% 28% 28% -30%;transform:rotate(35deg);background:linear-gradient(90deg,transparent,#ffffff22,transparent);pointer-events:none}.logo .icon{filter:drop-shadow(0 0 10px #23baff) drop-shadow(0 4px 3px #0008)}
        .tabs{border:1px solid #79b7e34d;border-radius:23px;background:linear-gradient(180deg,#1a304beF,#091627f5);box-shadow:inset 0 1px 0 #ffffff20,0 12px 28px #0006}.tab.active{background:linear-gradient(120deg,#12b9ff,#087be9 52%,#1559c9);box-shadow:0 7px 22px #0090ff60,inset 0 1px 0 #ffffff65,inset 0 -2px 5px #003e9c80}
        .voltage{isolation:isolate;background:radial-gradient(ellipse at 50% 42%,#0093ff30,transparent 48%),linear-gradient(145deg,#173553,#071323 72%);border-color:#72b8ea4f;box-shadow:0 18px 38px #0007,inset 0 2px 0 #ffffff22,inset 0 -12px 28px #0007}.voltage:before{background:linear-gradient(125deg,#ffffff14,transparent 30%,transparent 72%,#26aeff12)}.voltage:after{content:"";position:absolute;inset:9px;z-index:0;pointer-events:none;border:1px solid #9fdfff13;border-radius:17px;box-shadow:inset 0 0 34px #0091ff18}.voltage-gauge{position:relative;z-index:1;filter:drop-shadow(0 14px 18px #0006);overflow:visible}.dial-tick{fill:none;stroke:#a9c4d8;stroke-opacity:.62;stroke-width:1.7;filter:drop-shadow(0 1px 0 #000a)}.dial-tick.active{stroke:#b5f7ff;stroke-opacity:.96;filter:drop-shadow(0 0 4px #19bdff)}.gauge-dot{stroke:#d6f4ff;stroke-width:2.5;filter:drop-shadow(0 3px 5px #000a) drop-shadow(0 0 8px #08c5ff)}.voltage-value{filter:drop-shadow(0 3px 8px #0009)}.state-indicator{position:relative;z-index:1;text-shadow:0 0 16px currentColor}.state-indicator .check-mark{box-shadow:0 0 0 5px #3fffa411,0 0 24px #3fffa070,inset 0 2px 4px #ffffff66}
        .metric{background:linear-gradient(145deg,#1c3452,#091628);border-color:#70aee247;box-shadow:inset 0 1px 0 #ffffff20,0 14px 28px #0006,inset 0 -8px 17px #0005}.metric:before{content:"";position:absolute;right:-62px;top:-76px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,#00aeff40,transparent 70%);pointer-events:none}.metric-icon{filter:drop-shadow(0 5px 9px #00a6ff65)}.metric-value{text-shadow:0 3px 14px #0007}.info{background:linear-gradient(145deg,#1a314d,#081425);border-color:#69a4d944;box-shadow:inset 0 1px 0 #ffffff1d,0 12px 27px #0006,inset 0 -7px 16px #0005}.info .symbol{filter:drop-shadow(0 5px 8px #0006) drop-shadow(0 0 10px currentColor)}
        .chart-card{background:linear-gradient(145deg,#142b45f7,#071221fa);box-shadow:0 18px 36px #0007,inset 0 1px 0 #ffffff20,inset 0 -9px 20px #0005}.chart-line{filter:drop-shadow(0 0 3px #05baff)}.chart-tag{filter:drop-shadow(0 5px 8px #0008)}
        .banner{position:relative;overflow:visible;background:linear-gradient(105deg,#07362bf7,#082830f7 55%,#082038f7);border-color:#43f5a0b3;box-shadow:0 0 0 1px #43f5a01a,0 0 30px #29dc8621,inset 0 1px 0 #ffffff2e,inset 0 -8px 20px #0005}.banner strong{text-shadow:0 2px 12px #24ff9d45}.banner .banner-check{box-shadow:0 0 0 6px #3fffa414,0 0 24px #3fffa078,inset 0 2px 4px #ffffff5c}.banner.inverter{background:linear-gradient(105deg,#403014f7,#222a32f7 58%,#10233af7)}.banner.pzem-offline{background:linear-gradient(105deg,#403014f7,#222a32f7 58%,#10233af7)}.banner.alarm,.banner.offline{background:linear-gradient(105deg,#401b27f7,#202336f7 62%,#171c2af7)}
        .house-art{position:relative;z-index:2;width:min(34%,250px);max-width:250px;opacity:1}.house-scene{position:relative;width:100%;aspect-ratio:1498/1014;isolation:isolate;pointer-events:none}.house-base{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:contain;transition:filter 1.2s ease;filter:drop-shadow(0 8px 12px #0008)}.house-fx{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:visible}.house-street-off,.house-room-off,.house-glass-off{opacity:0;transition:opacity 1s ease}.house-scene.exterior-off .house-base{filter:brightness(.8) saturate(.82) drop-shadow(0 8px 12px #0008)}.house-scene.exterior-off .house-street-off,.house-scene.interior-off .house-room-off,.house-scene.interior-off .house-glass-off{opacity:1}.house-smoke{fill:none;stroke:#d9efff;stroke-width:8;stroke-linecap:round;opacity:0;filter:url(#hsBlur);stroke-dasharray:16 19;transform-box:fill-box;transform-origin:50% 100%;animation:houseSmoke 5.5s linear infinite}.house-smoke.two{stroke-width:6;animation-duration:7s;animation-delay:-2.4s}.house-scene.interior-off .house-smoke{display:none}@keyframes houseSmoke{0%{stroke-dashoffset:0;opacity:0;transform:translate(0,12px) scale(.8)}15%{opacity:.34}70%{opacity:.2}100%{stroke-dashoffset:-100;opacity:0;transform:translate(14px,-60px) scale(1.3)}}.house-canopy{transform-box:fill-box;transform-origin:center;animation:houseSway 4.2s ease-in-out infinite}.house-canopy.right{animation-duration:5.1s;animation-delay:-1.7s}@keyframes houseSway{0%,100%{transform:rotate(-1.5deg) translateX(-1px)}50%{transform:rotate(2.2deg) translateX(4px)}}@media(prefers-reduced-motion:reduce){.house-smoke,.house-canopy{animation:none!important}.house-base,.house-street-off,.house-room-off,.house-glass-off{transition:none}}
        .energy-hero{display:grid;grid-template-columns:1.08fr .92fr;gap:15px;margin:0 0 15px}.energy-visual{position:relative;isolation:isolate;min-height:170px;overflow:hidden;padding:20px;border-radius:19px;border:1px solid #70aee24f;box-shadow:inset 0 1px 0 #ffffff2c,0 16px 32px #0006,inset 0 -10px 20px #0004;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}.energy-visual:before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(circle at 82% 24%,#ffbd4a42,transparent 34%),linear-gradient(125deg,#193e68,#10213d 58%,#201d45)}.energy-load:before{background:radial-gradient(circle at 82% 24%,#19cdff40,transparent 35%),linear-gradient(125deg,#123f61,#10213d 60%,#122d50)}.energy-visual .eyebrow{color:#b4cbe6;font-size:12px;letter-spacing:.1em;text-transform:uppercase}.energy-visual .hero-number{position:relative;z-index:1;max-width:75%;margin:7px 0 3px;font-size:clamp(25px,4cqw,43px);line-height:1.12;font-weight:850;letter-spacing:-1px;text-shadow:0 4px 18px #0008;overflow-wrap:anywhere}.energy-visual small{position:relative;z-index:1;max-width:76%;color:#c1d4ea;font-size:13px}.energy-object{position:absolute;right:16px;bottom:10px;width:95px;height:95px;max-width:32%;max-height:80%;pointer-events:none;filter:drop-shadow(0 8px 14px #0008);opacity:.92;transition:transform .2s ease}.coin-object{transform:rotate(-3deg)}.plug-object{transform:rotate(4deg)}
        .settings-hero{display:flex;align-items:center;gap:15px;padding:14px 18px;margin:0 0 15px;border-radius:18px;background:linear-gradient(110deg,#163c5ff2,#17224bf2);border:1px solid #70aee24a;box-shadow:inset 0 1px 0 #ffffff27,0 14px 28px #0005}.chip-art{width:68px;height:68px;flex:none;filter:drop-shadow(0 6px 12px #0008) drop-shadow(0 0 10px #078fff35)}.device-copy{min-width:0}.device-copy strong{display:block;font-size:17px}.device-copy span{display:block;margin-top:4px;color:#a9bfdc;font-size:12px}.device-status{margin-left:auto;display:flex;align-items:center;gap:8px;white-space:nowrap;color:var(--muted);font-size:13px}.device-status i{width:10px;height:10px;border-radius:50%;background:#8597aa;box-shadow:0 0 8px #8597aa66}.device-status.online{color:var(--green)}.device-status.online i{background:var(--green);box-shadow:0 0 12px #35ed91a8}.device-status.offline{color:var(--red)}.device-status.offline i{background:var(--red);box-shadow:0 0 12px #ff526d88}.detail:hover,.visual-card:hover,.control:hover{border-color:#59bbef70;box-shadow:0 16px 32px #0007,0 0 24px #0099ff13}.tariff-state{position:relative}.tariff-led{position:absolute;right:14px;bottom:14px;width:8px;height:8px;border-radius:50%;background:#7e8ea2}.tariff-led.active{background:var(--green);box-shadow:0 0 12px #35ed91b0}
        .metric:hover,.info:hover,.action-button:hover,.save-button:hover,.switch-button:hover{transform:translateY(-3px);border-color:#54bdff80;box-shadow:0 18px 34px #0008,0 0 24px #0099ff1b}.tab,.period-button,.action-button,.save-button,.switch-button{transition:background .22s,color .22s,border-color .22s,box-shadow .22s,transform .22s}
        @media(prefers-reduced-motion:no-preference){.shell:not(.render-ready){animation:deviceBoot .7s cubic-bezier(.2,.8,.2,1) both}.logo .icon{animation:logoFloat 4.2s ease-in-out infinite}.gauge-dot{animation:gaugePulse 2.8s ease-in-out infinite}.chart-dot{animation:chartPulse 2.4s ease-in-out infinite}.voltage:after{animation:screenGlow 7s ease-in-out infinite alternate}@keyframes deviceBoot{from{opacity:0;transform:translateY(8px) scale(.995)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes logoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}@keyframes gaugePulse{0%,100%{filter:drop-shadow(0 0 5px #08c5ff)}50%{filter:drop-shadow(0 0 12px #08c5ff)}}@keyframes chartPulse{0%,100%{opacity:.8}50%{opacity:1}}@keyframes screenGlow{from{box-shadow:inset 0 0 24px #0091ff10}to{box-shadow:inset 0 0 40px #0091ff24}}}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
        @container (max-width:760px){.energy-hero{grid-template-columns:1fr}.energy-visual{min-height:145px}.energy-object{width:76px;height:76px;right:10px;bottom:8px}.settings-hero{gap:11px;padding:12px}.chip-art{width:56px;height:56px}.device-copy strong{font-size:15px}.device-status{font-size:12px}}
        @container (max-width:420px){.energy-visual{min-height:130px;padding:15px}.energy-visual .hero-number{font-size:clamp(24px,7cqw,31px);max-width:80%}.energy-visual small{font-size:11px;max-width:80%}.energy-object{width:58px;height:58px;right:8px;bottom:6px;opacity:.8}.settings-hero{flex-wrap:wrap}.chip-art{width:46px;height:46px}.device-status{margin-left:6px}.banner strong{max-width:68%}}
        .app-dialog-backdrop{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:18px;background:rgba(2,8,18,.78);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}
        .app-dialog{width:min(100%,430px);padding:24px;border:1px solid #55bfff75;border-radius:22px;background:radial-gradient(ellipse at 50% 0%,#17436a,#0b1728 68%);color:#f3f7ff;box-shadow:0 24px 70px #000c,inset 0 1px 0 #ffffff20;text-align:center}
        .dialog-mark{width:48px;height:48px;margin:0 auto 14px;display:grid;place-items:center;border-radius:15px;border:1px solid #32b7ff6e;background:linear-gradient(145deg,#0d5893,#0b2949);color:#77d6ff;font-size:28px;font-weight:800;box-shadow:0 0 24px #078fff33}.dialog-mark .icon{width:25px;height:25px}
        .back-to-top{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:10000;width:54px;height:54px;display:grid;place-items:center;border:1px solid #75d5ff9c;border-radius:50%;background:linear-gradient(145deg,#0da8f4,#0759b7);color:#fff;box-shadow:0 8px 24px #0009,0 0 20px #079fff55;cursor:pointer;transition:transform .18s,box-shadow .18s}.back-to-top:hover{transform:translateY(-3px);box-shadow:0 11px 28px #000a,0 0 24px #079fff88}.back-to-top .icon{width:27px;height:27px}.back-to-top[hidden]{display:none}
        .back-to-top{inset:auto max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) auto;margin:0}.back-to-top:not(:popover-open){display:none}
        .back-to-top:popover-open{display:grid}
        .app-dialog h2{margin:0;color:#bdeaff;font-size:20px;line-height:1.3}.app-dialog p{margin:12px 0 22px;color:#c6d7ea;font-size:15px;line-height:1.55;white-space:pre-line;overflow-wrap:anywhere}
        .dialog-actions{display:flex;justify-content:center;gap:10px}.dialog-button{min-width:118px;min-height:44px;padding:10px 16px;border:1px solid transparent;border-radius:12px;font:inherit;font-weight:700;cursor:pointer;transition:transform .16s,box-shadow .16s,background .16s}.dialog-button:hover{transform:translateY(-1px)}.dialog-button:focus-visible{outline:2px solid #bcecff;outline-offset:3px}.dialog-button.primary{border-color:#36afff;background:linear-gradient(120deg,#0da8f4,#0867cb);color:#fff;box-shadow:0 6px 18px #008eff45}.dialog-button.secondary{border-color:#58718c;background:#182a3f;color:#d7e6f6}.dialog-button.secondary:hover{background:#213b58}
        @media(max-width:480px){.app-dialog{padding:20px 16px;border-radius:18px}.dialog-actions{flex-direction:column-reverse}.dialog-button{width:100%}}
        /* ===== Design refinement: gauge, tiles, status row, banner, chart, mobile ===== */
        .header{padding:4px 2px 18px}
        .brand{flex:1 1 auto}
        .brand h1{font-weight:800;text-shadow:0 2px 18px #0a8cff40}
        .brand p{color:#8fb2dc;letter-spacing:.2px}
        .connection strong{font-weight:800;letter-spacing:.2px}
        .connection small{font-size:12px;opacity:.85}

        .tab{font-weight:650}
        .tab:not(.active):hover{background:#ffffff0d;color:#e6f4ff}

        .main-grid{gap:16px}
        .voltage{min-height:0;padding:10px 12px 8px;justify-content:center;align-items:center;gap:0}
        .voltage-gauge{width:min(110%,594px);margin:-4px 0 0}
        .voltage-value{font-size:72px;font-weight:800;letter-spacing:-2px}
        .voltage-unit{font-size:40px;font-weight:700;fill:#dcecff}
        .voltage-label{font-size:22px;fill:#a9c2e2;letter-spacing:.3px}
        .gauge-end{font-size:14px;fill:#6f8db1;letter-spacing:.3px}
        .gauge-usage{font-size:17px;font-weight:700;fill:#dcecff;letter-spacing:.2px}
        .gauge-usage-cost{font-size:14px;font-weight:600;fill:#9fb7d6}
        .gauge-fill-glow{mix-blend-mode:screen}
        .dial-tick{stroke:#9db8cd;stroke-opacity:.6;stroke-width:1.6;stroke-linecap:round}
        .dial-tick.major{stroke-width:2.2;stroke-opacity:.72}
        .dial-tick.active{stroke:#d9fbff;stroke-opacity:1}
        .voltage.alarm .arc-a{stop-color:#ffb51b}
        .voltage.alarm .arc-b{stop-color:#ff8a3d}
        .voltage.alarm .arc-c{stop-color:#ff526d}
        .voltage.pzem-offline .arc-a,.voltage.inverter .arc-a{stop-color:#ffd25a}
        .voltage.pzem-offline .arc-b,.voltage.inverter .arc-b{stop-color:#ffb51b}
        .voltage.pzem-offline .arc-c,.voltage.inverter .arc-c{stop-color:#ff8a3d}
        .voltage.offline .arc-a,.voltage.offline .arc-b,.voltage.offline .arc-c,.voltage.unknown .arc-a,.voltage.unknown .arc-b,.voltage.unknown .arc-c{stop-color:#6a7f99}
        .state-indicator{margin-top:-8px;padding:6px 18px 6px 10px;border-radius:999px;background:#ffffff0a;border:1px solid #ffffff14;font-size:20px}

        .metrics{gap:16px}
        .metric{min-height:0;padding:20px 12px 18px;gap:0}
        .metric:before{right:-50px;top:-60px;width:180px;height:180px;background:radial-gradient(circle,var(--mc,#12aaff)44,transparent 68%)}
        .metric.power{--mc:#12aaff}
        .metric.current{--mc:#13d5f4}
        .metric.frequency{--mc:#1ee3c4}
        .metric.pf{--mc:#b56aff}
        .metric-icon .icon{width:46px;height:46px}
        .metric-value{display:flex;align-items:baseline;justify-content:center;gap:.22em;flex-wrap:wrap;font-size:clamp(30px,4.2cqw,54px);margin:6px 0 4px;letter-spacing:-1px}
        .metric-value .unit{margin:0;font-size:.52em;font-weight:700;color:#cfe4ff;opacity:.92}
        .metric-label{font-size:17px;color:#a9c2e2}

        .chart-card{margin-top:16px;padding:18px 22px 14px}
        .chart-head h2{font-size:22px;font-weight:750}
        .periods{background:#0c1a2b;border:1px solid #ffffff12;box-shadow:inset 0 2px 5px #0006}
        .period-button{font-weight:600}
        .chart-plot{touch-action:none;position:relative;cursor:grab;user-select:none}.chart-plot.is-panning{cursor:grabbing}
        .chart{overflow:visible}
        .chart-grid{stroke:#7fb2e133}
        .chart-grid text{fill:#8fa9c9;font-size:12.5px;letter-spacing:.2px}
        .chart-line{stroke:#25c2ff;stroke-width:3}
        .chart-dot{fill:#fff;stroke:#18baff;stroke-width:3.5}
        .chart-cross{fill:none;stroke:#8fd6ff;stroke-opacity:.6;stroke-dasharray:3 4}
        .chart-tag{fill:#0b1d33;stroke:#1aa6ff;stroke-width:1.2}
        .chart-tag-text{font-size:14px!important}
        .chart-tag-sub{fill:#9fb7d6;font-size:11.5px;stroke:none}

        .info{min-height:0;padding:16px 16px;justify-content:flex-start;align-items:center;gap:14px;text-align:left}
        .info>div{min-width:0}
        .info .symbol{width:54px;height:54px;flex:none;display:grid;place-items:center;border-radius:17px;font-size:0;background:radial-gradient(circle at 30% 18%,#ffffff1f,#ffffff06);border:1px solid #ffffff1c;filter:none;box-shadow:0 8px 18px #0005,inset 0 1px 0 #ffffff1c}
        .info .symbol .icon{width:28px;height:28px}
        .info .symbol.green{background:radial-gradient(circle at 30% 18%,#35ed9130,#35ed9108);border-color:#35ed9144}
        .info .symbol.blue{color:#7fc4ff;background:radial-gradient(circle at 30% 18%,#2f9bff30,#2f9bff08);border-color:#2f9bff44}
        .info .symbol.amber{background:radial-gradient(circle at 30% 18%,#ffb51b30,#ffb51b08);border-color:#ffb51b44}
        .info .small{font-size:13px;line-height:1.3;color:#9fb7d6}
        .info strong{font-size:17px;line-height:1.25;margin-top:4px;overflow-wrap:break-word;word-break:normal;hyphens:auto}
        .info .cost-line{font-size:13px;color:#9fb7d6;margin-top:4px}

        .banner{margin-top:16px;padding:12px 22px;min-height:84px;gap:16px}
        .banner strong{font-size:clamp(16px,1.9cqw,22px);font-weight:750}
        .house-art{width:min(39%,285px);max-width:285px;margin:-46px -34px -46px auto}

        .footer{margin-top:16px;font-size:12px;color:#5f7f9f}

        @container (min-width:960px){
          .home-view .main-right>.tabs-side{padding:8px;gap:6px}
          .home-view .main-right>.tabs-side .tab{padding:15px 8px}
          .home-view .main-right>.metrics{align-content:stretch}
        }

        @container (max-width:900px){
        }

        @container (max-width:760px){
          .main-grid{gap:12px}
          .voltage{padding:10px 10px 8px;gap:0}
          .metrics{gap:12px}
          .metric{padding:16px 8px 14px}
          .metric-icon .icon{width:38px;height:38px}
          .info{padding:14px 12px}
          .chart-card{padding:14px 12px 10px}
        }

        @container (max-width:520px){
          .shell{padding:12px 10px;border-radius:24px}
          .header{gap:10px;padding:2px 2px 12px}
          .brand h1{font-size:clamp(19px,5.6cqw,24px);letter-spacing:-.4px}
          .brand p{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .connection strong{font-size:14px}
          .connection small{font-size:11px}
          .dot{width:10px;height:10px;margin-right:7px}
          .tabs{padding:5px;gap:3px}
          .tab{flex-direction:column;gap:4px;padding:9px 2px;font-size:clamp(10px,2.9cqw,12.5px);letter-spacing:-.1px;min-width:0}
          .tab .tab-icon{display:block;font-size:20px}
          .tab .icon{width:21px;height:21px}
          .voltage-value{font-size:70px}
          .state-indicator{font-size:19px}
          .metric-value{font-size:clamp(26px,8.4cqw,36px)}
          .metric-label{font-size:14px}
          .info{flex-direction:column;align-items:flex-start;gap:10px;padding:14px 13px}
          .info .symbol{width:44px;height:44px;border-radius:14px}
          .info .symbol .icon{width:24px;height:24px}
          .info strong{font-size:16px}
          .banner{padding:12px 14px;min-height:76px;gap:12px}
          .banner strong{max-width:none}
          .house-art{width:156px;margin:-28px -22px -28px auto}
          .logo{width:50px;height:50px;border-radius:15px}
          .logo .icon{width:32px;height:32px}
          .chart-head h2{font-size:19px}
          .footer{font-size:11px}
        }

        /* ===== Placeholders, parameters, settings ===== */
        .voltage-value.empty{font-size:34px;letter-spacing:0;fill:#9fb7d6}
        .metric-value.empty{font-size:clamp(17px,2.2cqw,21px);font-weight:700;letter-spacing:0;color:#9fb7d6;margin:14px 0 12px;text-shadow:none}
        .metric-value.empty .unit{display:none!important}

        .detail-panel{padding:24px}
        .detail-panel h2{font-size:24px;font-weight:800;letter-spacing:-.3px}
        .detail-panel h2.subheading{margin:26px 0 14px;font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8fb2dc;display:flex;align-items:center;gap:12px}
        .detail-panel h2.subheading:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,#5d96ca55,transparent)}
        .detail{position:relative;padding:15px 16px 15px 20px;background:linear-gradient(145deg,#182d46,#0d1c30);border-color:#5d96ca33;box-shadow:inset 0 1px 0 #ffffff14,0 8px 18px #0004;overflow:hidden}
        .detail:before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:0 3px 3px 0;background:linear-gradient(#12aaff,#13d5f4);box-shadow:0 0 10px #12aaff80}
        .detail>span,.detail label>span{font-size:13px;color:#9fb7d6;margin-bottom:6px}
        .detail b{font-size:21px;font-weight:750;letter-spacing:-.2px}
        .detail.has-icon{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto 1fr;column-gap:13px;align-items:start;align-content:start}
        .detail.has-icon>.detail-icon{grid-row:1/3;grid-column:1;align-self:start;justify-self:start;margin:0;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:#7fd4ff;background:radial-gradient(circle at 30% 18%,#2a6aa355,#0f2a4655);border:1px solid #5d96ca44;box-shadow:inset 0 1px 0 #ffffff1c}
        .detail.has-icon>.detail-icon .icon{width:22px;height:22px}
        .detail.has-icon>span:not(.detail-icon),.detail.has-icon>b{grid-column:2;min-width:0}
        .detail.has-icon>span:not(.detail-icon){margin-bottom:3px}
        .energy-panel .energy-grid{margin-top:14px}
        .metric{position:relative}
        .metric .metric-info-button,.detail .metric-info-button{position:absolute;top:8px;right:8px;z-index:3;width:28px;height:28px;display:grid;place-items:center;padding:0;border:1px solid #64caff88;border-radius:50%;background:linear-gradient(145deg,#0d5791,#082340);color:#c5efff;font-family:inherit;font-size:15px;font-weight:800;line-height:1;cursor:pointer;box-shadow:0 0 12px #009dff26}
        .metric .metric-info-button:hover,.detail .metric-info-button:hover{background:linear-gradient(145deg,#0e78bf,#0a3961);color:#fff;border-color:#8edcff}
        .metric .metric-info-button:focus-visible,.detail .metric-info-button:focus-visible{outline:2px solid #bcecff;outline-offset:2px}
        .detail.metric-info-card>span{padding-right:34px}.detail.metric-info-card>.detail-icon{padding:0}

        @container (min-width:761px){.metric{min-height:0;padding:12px 10px}.metric-icon{font-size:40px}.metric-icon .icon{width:40px;height:40px}.metric-value{font-size:clamp(30px,3.4cqw,46px);margin:0}.metric-range{margin-top:6px}}
        .metric-range{display:flex;justify-content:center;flex-wrap:wrap;gap:2px 16px;margin-top:8px;color:#9fb7d6;font-size:14px}.metric-range b{color:#e6f0ff;font-size:15px;font-weight:700;margin-left:4px}
        .voltage:after{display:none}
        .range-card{position:relative;padding:18px 20px 14px;margin:0 0 16px;border-radius:18px;background:linear-gradient(145deg,#1a3350,#0b1a2d);border:1px solid #5d96ca3a;box-shadow:inset 0 1px 0 #ffffff1a,0 12px 26px #0005}
        .range-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px 18px;margin-bottom:22px}
        .range-head h3{margin:0;font-size:16px;font-weight:750}
        .range-values{display:flex;flex-wrap:wrap;gap:4px 18px;color:#9fb7d6;font-size:13px}
        .range-values b{color:#f3f7ff;font-size:15px;margin-left:4px}
        .range-track{position:relative;height:14px;border-radius:99px;background:#0a1626;box-shadow:inset 0 2px 5px #000a;border:1px solid #ffffff10}
        .range-track i,.range-track b{position:absolute;top:0;bottom:0}
        .range-zone{background:repeating-linear-gradient(135deg,#ff526d55 0 4px,#ff526d22 4px 8px)}
        .range-zone.low{border-radius:99px 0 0 99px}
        .range-zone.high{border-radius:0 99px 99px 0}
        .range-span{border-radius:99px;background:linear-gradient(90deg,#0a84ff,#12d3e8 55%,#3cf08a);box-shadow:0 0 14px #12d3e880;min-width:6px}
        .range-now{width:20px;height:20px;top:50%!important;bottom:auto!important;margin:-10px 0 0 -10px;border-radius:50%;background:#fff;border:4px solid #1aa6ff;box-shadow:0 0 14px #1aa6ff;box-sizing:border-box}
        .range-scale{display:flex;justify-content:space-between;margin-top:9px;color:#6f8db1;font-size:12px}

        .setting-input input{background:#07121f;border-color:#3f6288;border-radius:11px;font-weight:650;transition:border-color .2s,box-shadow .2s}
        .setting-input input:focus{outline:none;border-color:#1aa6ff;box-shadow:0 0 0 3px #1aa6ff30}
        .save-button{background:linear-gradient(145deg,#0f4a84,#0a2f57);border-color:#2b9cf0;font-weight:650}
        .switch-setting>strong{display:none}
        .switch-setting{grid-template-columns:1fr;align-content:center}
        .switch-button{position:relative;grid-column:auto;justify-content:flex-start;gap:12px;padding:10px 12px 10px 66px;min-height:44px;background:#07121f;border-color:#3f6288;color:#c5d8ef;font-weight:650}
        .switch-button .icon{display:none}
        .switch-button:before{content:"";position:absolute;left:12px;top:50%;width:42px;height:24px;margin-top:-12px;border-radius:99px;background:#26394f;box-shadow:inset 0 2px 4px #0008;transition:background .2s}
        .switch-button:after{content:"";position:absolute;left:15px;top:50%;width:18px;height:18px;margin-top:-9px;border-radius:50%;background:#dbe8f7;box-shadow:0 2px 5px #0008;transition:transform .2s,background .2s}
        .switch-button.on{color:#7dffbc;border-color:#35ed9199}
        .switch-button.on:before{background:linear-gradient(90deg,#14b86a,#35ed91)}
        .switch-button.on:after{transform:translateX(18px);background:#fff}
        .switch-button:hover{transform:none}

        .action-button{min-height:74px;font-weight:600;line-height:1.25}
        .action-grid .action-button:nth-child(-n+3){border-color:#ffb51b66;background:linear-gradient(145deg,#2b2412,#0d1b2e)}
        .action-grid .action-button:nth-child(-n+3) span{color:#ffc54d}
        .action-grid .action-button:nth-child(4){border-color:#ff526d80;background:linear-gradient(145deg,#2c1520,#0d1b2e)}
        .action-grid .action-button:nth-child(4) span{color:#ff8a9a}
        .history-cleanup-hint{margin:0 0 10px;color:#9fb5d1;font-size:13px;line-height:1.5}

        @container (max-width:520px){
          .detail-panel{padding:16px 12px}
          .range-card{padding:14px 14px 12px}
          .detail b{font-size:19px}
        }

        .shell:not(.home-active)>.header>.brand{flex:1 1 auto}@container (min-width:960px){.shell:not(.home-active)>.header>.tabs-top{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));flex:0 0 calc((100% - 16px) / 2.2);width:calc((100% - 16px) / 2.2);min-width:0;max-width:none;margin:0 0 0 auto;padding:8px;gap:6px}}
        @container (min-width:960px){.shell:not(.home-active)>.header>.tabs-top .tab{padding:15px 8px}}
        .chart-scrubber{display:grid;grid-template-columns:minmax(180px,auto) minmax(0,1fr) auto;align-items:center;gap:12px;margin-top:8px;padding:4px 2px}
        .chart-scrubber-label{color:#b7c9df;font-size:13px;overflow-wrap:anywhere}
        .chart-scrubber input[type=range]{width:100%;min-width:0;accent-color:#12aaff;touch-action:pan-x;cursor:ew-resize}
        .chart-live-button{border:1px solid #278ed0;background:#092645;color:#d7efff;border-radius:10px;padding:7px 13px;font:inherit;cursor:pointer}
        .chart-live-button:disabled{opacity:.5;cursor:not-allowed}
        .chart-readings{margin-top:10px;padding-top:12px;border-top:1px solid #29415c}
        .chart-readings[hidden]{display:none}
        .chart-readings-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:10px}
        .chart-readings-head h3{margin:0;color:#eff7ff;font-size:16px}
        .chart-readings-head>span{color:#b7c9df;font-size:13px}
        .chart-readings-head .chart-readings-status{margin-left:auto;color:#9fb5d1}
        .chart-reading-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
        .chart-reading{min-width:0;padding:11px 12px;border-radius:14px;background:#13243a;border:1px solid #2b4562}
        .chart-reading span{display:block;color:#9fb5d1;font-size:12px;line-height:1.3}
        .chart-reading strong{display:block;margin-top:5px;color:#f3f7ff;font-size:clamp(15px,1.7cqw,20px);overflow-wrap:anywhere}
        @container (max-width:959px){.shell:not(.home-active)>.header{flex-wrap:wrap;gap:11px;padding:0 0 8px}.shell:not(.home-active)>.header>.brand{flex:1 1 auto}.shell:not(.home-active)>.header>.tabs-top{order:-1;flex:1 0 100%;width:100%;min-width:0;max-width:none;margin:0 0 10px;grid-template-columns:repeat(4,minmax(0,1fr))}.shell:not(.home-active)>.page-layout{margin-top:0}}
        @container (max-width:900px){.chart-reading-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @container (max-width:760px){.chart-scrubber{grid-template-columns:minmax(0,1fr) auto;gap:8px}.chart-scrubber-label{grid-column:1/-1}.chart-readings-head .chart-readings-status{margin-left:0}}
        @container (max-width:520px){.chart-reading-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.chart-reading{padding:10px}.chart-reading strong{font-size:16px}}

        .voltage{padding:5px 12px 4px;justify-content:space-between}
        .shell:not(.home-active)>.header{align-items:flex-start;padding:0 0 1px;z-index:2}
        @container (max-width:959px){.shell:not(.home-active)>.header{padding-bottom:8px}.shell:not(.home-active)>.header>.tabs-top{margin-bottom:10px}}
        @container (max-width:760px){.voltage{padding:5px 10px 4px}}
        .voltage-brand,.voltage-gauge,.state-indicator{transform:translateY(-4px)}
        .action-grid{grid-template-columns:repeat(5,minmax(0,1fr))}
        @container (max-width:760px){.action-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;overflow:visible}.action-button{min-height:72px;padding:10px 8px;font-size:12px}.action-grid .action-button:nth-child(5){grid-column:1/-1}}

        /* Mobile polish: readable layouts, touch-sized controls, and no sideways scrolling. */
        @container (max-width:760px){
          .shell{padding:10px;border-radius:22px}
          .header{gap:9px;padding:4px 2px 10px}
          .shell.home-active>.tabs-top{margin:0 0 10px}
          .shell:not(.home-active)>.header>.tabs-top{margin:0 0 10px}
          .tabs{gap:4px;padding:4px;margin-bottom:10px;border-radius:17px}
          .tab{min-height:44px;gap:4px;padding:8px 3px;font-size:12px;border-radius:13px}
          .home-view .main-grid{grid-template-columns:minmax(0,1fr);gap:10px}
          .home-view .main-grid>.voltage{grid-column:1;grid-row:1}
          .home-view .main-right>.metrics{grid-column:1;grid-row:2}
          .voltage{min-height:0;padding:4px 10px 6px}
          .voltage-brand{display:grid;grid-template-columns:50px minmax(0,1fr) auto;align-items:center;gap:8px;flex-wrap:nowrap}
          .voltage-brand .logo{width:50px;height:50px;border-radius:15px}
          .voltage-brand .logo .icon{width:32px;height:32px}
          .voltage-brand .brand{min-width:0}
          .voltage-brand .brand h1{font-size:clamp(17px,4.8cqw,22px);letter-spacing:-.4px}
          .voltage-brand .brand p{font-size:clamp(10px,3cqw,12px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .voltage-brand .home-status{max-width:90px;min-width:0}
          .voltage-brand .home-status .connection{text-align:right;white-space:normal}
          .voltage-brand .home-status .connection strong{font-size:12px}
          .voltage-brand .home-status .connection small{max-width:90px;font-size:9px;line-height:1.2;overflow-wrap:anywhere}
          .voltage-gauge{width:min(100%,410px);margin:-7px 0 -4px;transform:translateY(-4px)}
          .state-indicator{margin-top:-7px;padding:5px 14px 5px 10px;font-size:18px;transform:translateY(-4px)}
          .state-indicator .check-mark{width:27px;height:27px}
          .state-indicator .check-mark .icon{width:19px;height:19px}
          .metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
          .metric{min-height:122px;padding:14px 8px;border-radius:18px}
          .metric-icon .icon{width:34px;height:34px}
          .metric-value{font-size:clamp(24px,7cqw,32px);gap:.16em}
          .metric-label{font-size:13px}
          .info{min-height:106px;flex-direction:row;align-items:flex-start;justify-content:flex-start;gap:9px;padding:12px 10px;border-radius:18px}
          .info .symbol{width:36px;height:36px;border-radius:12px}
          .info .symbol .icon{width:21px;height:21px}
          .info .small{font-size:11px;line-height:1.25}
          .info strong{font-size:14px;line-height:1.25}
          .banner{margin-top:12px;padding:12px 14px;min-height:68px;gap:10px}
          .banner-check{width:34px;height:34px}
          .banner-check .icon{width:25px;height:25px}
          .banner strong{flex:1;min-width:0;max-width:none;font-size:clamp(14px,4cqw,17px);line-height:1.3}
          .house-art{width:114px;max-width:30%;margin:-22px -18px -22px auto}
          .chart-card{margin-top:12px;padding:14px 12px 11px;border-radius:19px}
          .chart-head{gap:8px}
          .chart-head h2{font-size:18px}
          .chart-head h2 .chart-icon .icon{width:23px;height:23px}
          .periods{width:100%;margin:0;justify-content:stretch}
          .period-button{flex:1;min-width:0;min-height:42px;padding:8px 4px;font-size:12px}
          .chart-scrubber{margin-top:6px;gap:6px}
          .chart-scrubber input[type=range]{min-height:30px}
          .chart-readings{margin-top:8px;padding-top:10px}
          .chart-readings-head h3{font-size:14px}
          .chart-reading-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
          .chart-reading{padding:9px;border-radius:12px}
          .chart-reading span{font-size:11px}
          .chart-reading strong{font-size:14px}
          .chart-stats{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
          .chart-stats>div{padding:8px;border-radius:11px}
          .chart-stats span{font-size:11px}
          .chart-stats b{font-size:15px}
          .energy-selection-detail{grid-template-columns:minmax(0,1fr) auto}
          .energy-selection-detail>span{grid-column:1/-1}
          .energy-selection-detail>b{font-size:15px}
          .detail-panel{padding:18px 14px;border-radius:20px}
          .detail-panel h2{font-size:21px;margin-bottom:14px}
          .detail-panel h2.subheading{margin:22px 0 12px;font-size:12px}
          .detail-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
          .detail{padding:12px 11px 12px 15px;border-radius:14px}
          .detail>span,.detail label>span{font-size:12px}
          .detail b{font-size:18px}
          .detail.has-icon{column-gap:10px}.detail.has-icon>.detail-icon{width:34px;height:34px;border-radius:10px}.detail.has-icon>.detail-icon .icon{width:19px;height:19px}.energy-panel .energy-grid{margin-top:12px}
          .settings-grid{grid-template-columns:1fr}
          .setting{flex-direction:column;align-items:stretch;gap:8px}
          .setting label,.setting-input{width:100%}
          .setting-input input{min-height:44px}
          .save-button{min-height:44px;width:100%}
          .switch-button{min-height:46px}
          .settings-hero{display:grid;grid-template-columns:46px minmax(0,1fr);gap:8px 10px;padding:12px;border-radius:17px}
          .chip-art{width:46px;height:46px;grid-row:span 2}
          .device-copy strong{font-size:14px}
          .device-copy span{font-size:11px}
          .device-status{grid-column:2;margin-left:0;font-size:11px}
          .energy-hero{grid-template-columns:1fr;gap:10px}
          .energy-visual{min-height:138px;padding:16px}
          .energy-visual .hero-number{font-size:clamp(25px,7cqw,34px);max-width:76%}
          .energy-object{width:65px;height:65px}
          .action-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;overflow:visible}
          .action-button{min-height:72px;padding:10px 8px;font-size:12px}
          .action-grid .action-button:nth-child(5){grid-column:1/-1}
          .footer{margin-top:12px;font-size:10px;flex-wrap:wrap}
        }
        @container (max-width:420px){
          .header .logo{width:46px;height:46px;border-radius:14px}
          .header .logo .icon{width:30px;height:30px}
          .brand h1{font-size:clamp(17px,5cqw,21px)}
          .brand p{font-size:11px}
          .voltage-brand{grid-template-columns:44px minmax(0,1fr) auto;gap:7px}
          .voltage-brand .logo{width:44px;height:44px}
          .voltage-brand .logo .icon{width:29px;height:29px}
          .voltage-brand .brand h1{font-size:clamp(16px,4.6cqw,19px)}
          .voltage-brand .brand p{font-size:10px}
          .voltage-brand .home-status{max-width:76px}
          .voltage-brand .home-status .connection strong{font-size:11px}
          .voltage-brand .home-status .connection small{font-size:8.5px}
          .tab{font-size:11px}
          .metric{min-height:112px;padding:12px 7px}
          .metric-value{font-size:clamp(22px,7.4cqw,29px)}
          .metric-icon .icon{width:30px;height:30px}
          .info{padding:10px 9px;gap:8px}
          .info .symbol{width:32px;height:32px}
          .info .symbol .icon{width:19px;height:19px}
          .info strong{font-size:13px}
          .detail-panel{padding:16px 11px}
          .detail-grid{gap:8px}
          .detail{padding:11px 9px 11px 13px}
          .detail>span,.detail label>span{font-size:11px}
          .detail b{font-size:16px}
          .range-card{padding:12px 11px}
          .chart-reading-grid{gap:7px}
          .chart-reading strong{font-size:13px}
          .action-button{min-height:68px;font-size:11.5px}
          .banner{padding:11px 10px}
          .banner-check{width:31px;height:31px}
          .house-art{width:52px}
        }
        @container (max-width:360px){
          .detail-grid:not(.settings-grid){grid-template-columns:1fr}
          .tabs{gap:2px;padding:3px}
          .tab{padding:8px 1px;font-size:10px}
        }

        .chart-tools{display:flex;align-items:center;gap:6px;margin-left:auto}
        .chart-zoom-button,.chart-date-apply{min-width:38px;min-height:36px;border:1px solid #278ed0;border-radius:10px;background:#092645;color:#d7efff;font:inherit;font-weight:700;cursor:pointer}
        .chart-zoom-button:hover,.chart-date-apply:hover{background:#0c3962}
        .chart-date-range{position:relative;display:inline-flex;z-index:1000}
        .chart-date-range-panel{position:fixed;inset:auto;margin:0;z-index:2147483647;display:flex;align-items:stretch;flex-direction:column;gap:10px;width:min(360px,calc(100vw - 16px));max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);overflow:auto;padding:14px;border:1px solid #37526f;border-radius:16px;background:linear-gradient(155deg,#11243a,#081522 72%);color:var(--text);box-shadow:0 14px 40px rgba(0,0,0,.82)}
        .chart-date-range-panel[hidden]{display:none!important}
        .chart-date-range-panel:popover-open{display:flex}
        .chart-date-range-panel input[type="hidden"]{display:none}
        .chart-date-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
        .chart-date-field{display:grid;gap:5px;min-width:0;color:#9fb5d1;font-size:12px}
        .chart-date-value{display:flex;align-items:center;justify-content:space-between;gap:6px;min-width:0;min-height:40px;padding:0 9px;border:1px solid #37526f;border-radius:10px;background:#091727;color:#eef6ff;font:inherit;font-size:12px;font-weight:650;text-align:left;cursor:pointer}
        .chart-date-value:hover,.chart-date-value[aria-expanded="true"]{border-color:#23aaff;box-shadow:0 0 0 2px #23aaff20}
        .chart-date-value>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .chart-date-caret{flex:0 0 auto;color:#53caff}
        .chart-date-calendar{width:100%;padding:10px;border:1px solid #2c4a69;border-radius:13px;background:radial-gradient(circle at 50% 0,#142e49 0,#0a1929 68%);box-shadow:inset 0 1px 0 #ffffff0a}
        .chart-date-calendar[hidden]{display:none!important}
        .chart-calendar-heading{display:grid;grid-template-columns:36px minmax(0,1fr) 36px;align-items:center;gap:6px;margin-bottom:7px}
        .chart-calendar-heading strong{text-align:center;color:#f1f7ff;font-size:14px;font-weight:750;text-transform:capitalize}
        .chart-calendar-nav{width:34px;height:34px;border:1px solid #2e5378;border-radius:9px;background:#0c2740;color:#aee3ff;font-size:22px;line-height:1;cursor:pointer}
        .chart-calendar-nav:hover:not(:disabled){border-color:#21b4ff;background:#103655}
        .chart-calendar-nav:disabled{opacity:.3;cursor:not-allowed}
        .chart-calendar-weekdays,.chart-calendar-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}
        .chart-calendar-weekdays{margin-bottom:3px}
        .chart-calendar-weekdays span{padding:4px 0;color:#89a4c1;font-size:10px;font-weight:700;text-align:center;text-transform:uppercase}
        .chart-calendar-day{min-width:0;min-height:34px;padding:0;border:1px solid transparent;border-radius:9px;background:transparent;color:#e2eefb;font:inherit;font-size:12px;font-weight:650;cursor:pointer}
        .chart-calendar-day:hover:not(:disabled){border-color:#1b9ddd;background:#123451;color:#fff}
        .chart-calendar-day.outside-month{color:#7289a4;opacity:.56}
        .chart-calendar-day.today{border-color:#3178a8;color:#65d0ff}
        .chart-calendar-day.selected{border-color:#1bb9ff;background:linear-gradient(135deg,#087bbc,#07528a);color:#fff;box-shadow:0 0 12px #11aaff40}
        .chart-calendar-day.is-disabled{border-color:transparent;background:transparent;color:#65758a;opacity:.28;cursor:not-allowed;box-shadow:none}
        .chart-date-range-panel small{color:#ff9ba8;font-size:12px}
        .chart-date-apply{min-height:40px;padding:0 14px;border-radius:10px}
        .chart-card>.chart-head{position:relative;z-index:20}
        .energy-chart-controls{margin:14px 0 10px}
        .energy-chart-controls .chart-head{margin:0}
        .energy-chart-controls h3{margin:0;font-size:17px}
        .energy-history-card{margin-top:12px}
        .energy-chart-plot{cursor:default;touch-action:auto;user-select:auto;-webkit-user-select:auto}
        .energy-bars [data-energy-bar]{cursor:pointer;transition:filter .14s ease}
        .energy-bars [data-energy-bar]:hover{filter:brightness(1.22)}
        .energy-bars [data-energy-bar]:focus{outline:none;stroke:#e7f6ff;stroke-width:2}
        .energy-bars [data-energy-bar][aria-pressed="true"]{stroke:#e7f6ff;stroke-width:2;filter:drop-shadow(0 0 5px #16b5ff)}
        .energy-selection:empty{display:none}
        .energy-selection{margin-top:10px;padding:10px 12px;border:1px solid #2b4562;border-radius:12px;background:#13243a}
        .energy-selection-detail{display:grid;grid-template-columns:minmax(0,auto) minmax(0,1fr) auto;align-items:center;gap:8px 12px}
        .energy-selection-detail>span{color:#9fb5d1;font-size:12px}
        .energy-selection-detail>time{color:#d9e8fa;font-size:13px;overflow-wrap:anywhere}
        .energy-selection-detail>b{color:#f3f7ff;font-size:17px;text-align:right;white-space:nowrap}
        .banner-main{flex:1 1 38%;min-width:0}
        .banner-main strong{display:block;max-width:none}
        .banner-system{flex:1 1 35%;min-width:0;display:grid;gap:3px;padding-left:16px;border-left:1px solid #ffffff2c}
        .banner-system-label{color:#b7d8d0;font-size:12px;letter-spacing:.15px}
        .banner-system strong{display:block;color:#e7fff3!important;font-size:clamp(14px,1.4cqw,18px)!important;line-height:1.25;text-shadow:none!important}
        .banner-system-note{color:#b6cec9;font-size:12px;line-height:1.3}
        .banner.inverter .banner-system strong,.banner.pzem-offline .banner-system strong{color:#fff1d0!important}
        .banner.alarm .banner-system strong,.banner.offline .banner-system strong{color:#ffe0e5!important}
        .chart-plot{touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}
        .chart-plot.is-panning{cursor:grabbing}
        @container (max-width:760px){
          .chart-tools{width:100%;margin-left:0;justify-content:flex-end}
          .chart-date-range{flex:1 1 auto;min-width:0;position:relative}
          .chart-date-range>[data-chart-date-toggle]{width:100%;padding:8px 4px;font-size:12px}
          .chart-date-range-panel{position:fixed;inset:auto;left:8px;right:8px;width:calc(100vw - 16px);min-width:0}
          .chart-date-fields{grid-template-columns:repeat(2,minmax(0,1fr))}
          .chart-date-apply{width:100%}
          .banner{display:grid;grid-template-columns:38px minmax(0,1fr) 92px;align-items:center;gap:10px}
          .banner-check{grid-column:1;grid-row:1}
          .banner-main{grid-column:2;grid-row:1}
          .banner-system{grid-column:1/-1;grid-row:2;padding:10px 0 0;margin:0;border-left:0;border-top:1px solid #ffffff2c}
          .house-art{grid-column:3;grid-row:1;width:138px;max-width:none;margin:-34px -22px -30px -46px;justify-self:end}
          .banner strong{font-size:clamp(14px,4cqw,17px);line-height:1.3}
          .banner-system strong{font-size:14px!important}
        }
        .voltage .voltage-brand{margin-top:12px}
        .voltage .voltage-gauge{top:-20px}
        .voltage .state-indicator{top:-8px}
        .chart-plot.is-panning .chart-dot,.chart-plot.is-panning .chart-tag,.chart-plot.is-panning .chart-tag-text,.chart-plot.is-panning .chart-tag-sub{visibility:hidden}
        .chart-plot.is-panning .chart-line,.chart-plot.is-panning .chart-glow{vector-effect:non-scaling-stroke}
        /* ===== Початок статистики ===== */
        .stats-start{grid-column:1/-1}
        .stats-start-controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
        .stats-start-controls input{flex:1 1 220px;min-width:0;min-height:44px;box-sizing:border-box;padding:0 12px;border-radius:11px;border:1px solid #3f6288;background:#07121f;color:#f3f7ff;font:inherit;font-weight:650;color-scheme:dark}
        .stats-start-controls input:focus{outline:none;border-color:#1aa6ff;box-shadow:0 0 0 3px #1aa6ff30}
        .stats-start-controls .save-button{min-height:44px;padding:0 18px}
        .stats-start-controls .save-button.ghost{background:#0b1a2b;border-color:#3f6288;color:#c5d8ef}
        .stats-start-controls .save-button:disabled{opacity:.45;cursor:default}
        .stats-start-hint{margin:10px 0 0;color:#9fb7d6;font-size:13px;line-height:1.4}
        .stats-start-sync{margin:5px 0 0;color:#77bceb;font-size:12px;line-height:1.4;overflow-wrap:anywhere}
        .stats-start-create{margin-top:9px;min-height:42px}
        .stats-start-error{margin:6px 0 0;min-height:0;color:#ff8a9a;font-size:13px}
        .stats-start-error:empty{display:none}
        .stats-note{margin:10px 4px 0;padding:6px 12px;border-radius:99px;border:1px solid #2f9bff40;background:#0a2038;color:#9fd2ff;font-size:12.5px;text-align:center}
        .period-button.since{white-space:nowrap}
        .shell.eco *,.shell.eco *::before,.shell.eco *::after{animation:none!important;filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
        .shell.eco .gauge-fill-glow,.shell.eco .tower-halo,.shell.eco .tower-haze,.shell.eco .chart-glow{display:none}.shell.eco .house-smoke,.shell.eco .house-canopy{animation:none!important}
        .header>.header-house{flex:none;position:relative;z-index:3;align-self:flex-start;width:0;height:0;max-width:none;margin:0;overflow:visible}
        .header>.header-house .house-scene{position:absolute;right:-56px;top:50px;width:264px}
        @container (max-width:959px){.header>.header-house{order:3;margin-left:auto}.header>.header-house .house-scene{right:-30px;top:22px;width:174px}}

        @media(prefers-reduced-motion:reduce){.card{backdrop-filter:none;-webkit-backdrop-filter:none}.tower-beacon{animation:none}}

        .action-grid .action-button.danger{border-color:#ff526d80;background:linear-gradient(145deg,#2c1520,#0d1b2e)}
        .action-grid .action-button.danger span{color:#ff8a9a}
        .actions-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:56px;padding:12px 18px;border:1px solid #ffffff24;border-radius:18px;background:linear-gradient(145deg,#15263b,#0d1b2e);color:#eaf3ff;font:inherit;font-weight:600;cursor:pointer}
        .actions-chevron{width:10px;height:10px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);transition:transform .2s;margin-top:-4px}
        .actions-toggle[aria-expanded="true"] .actions-chevron{transform:rotate(-135deg);margin-top:4px}
        .actions-body{margin-top:12px}.actions-body[hidden]{display:none}
        @container (max-width:760px){
          .periods.chart-range-periods{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));align-items:stretch;width:100%;min-width:0;margin:0;padding:4px;gap:4px}
          .periods.chart-range-periods>.period-button{width:100%;min-width:0;padding:8px 2px;font-size:clamp(10px,3.1cqw,12px);line-height:1.2;white-space:nowrap}
          .periods.chart-range-periods>.chart-date-range{grid-column:1/-1;width:100%;min-width:0}
          .periods.chart-range-periods>.chart-date-range>[data-chart-date-toggle]{width:100%;min-width:0;white-space:normal;line-height:1.2}
          .periods.chart-metric-periods{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%;min-width:0;margin:0;gap:4px}
          .periods.chart-metric-periods>.period-button{width:100%;min-width:0;padding:8px 4px;white-space:normal;line-height:1.2}
          .shell:not(.home-active)>.header>.tabs-top .tab[data-tab="home"] .tab-icon{display:none}
        }
      `;
    }
  }

  customElements.define('grid-monitor-card', GridMonitorCard);
})();
