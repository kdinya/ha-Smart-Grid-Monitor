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
      chart_select_time: 'Перетягуйте графік; двома пальцями масштабуйте, повзунком вибирайте час', chart_date_range: 'Вибрати період', chart_from: 'Від', chart_to: 'До', chart_apply: 'Показати', chart_date_error: 'Перевірте дати: кінець має бути пізніше початку й не в майбутньому', chart_zoom_in: 'Збільшити масштаб', chart_zoom_out: 'Зменшити масштаб', chart_readings: 'Дані на вибраний час', chart_readings_loading: 'Завантаження вимірювань…', chart_readings_unavailable: 'Історія вимірювань недоступна', chart_live: 'Зараз', active_power: 'Активна потужність',
      mains: 'Зв’язок з PZEM', has_voltage: 'Дані доступні', no_voltage: 'Дані недоступні', source: 'Живлення ESP', from_mains: 'Мережа (не підтверджено)', from_inverter: 'Джерело невідоме', pzem_link: 'Зв’язок з PZEM', active: 'Онлайн', inactive: 'Офлайн', today_consumption: 'Споживання сьогодні',
      esp_power_connection: 'Схема живлення ESP', esp_power_shared: 'Від мережі разом із модулем', esp_power_after_avr: 'Після АВР', esp_power_independent: 'Незалежне живлення', esp_power_avr_note: 'ESP може живитися від інвертора', pzem_grid_note: 'PZEM вимірює мережу в усіх режимах',
      params_title: 'Електричні параметри', range_title: 'Діапазон напруги на графіку', range_now: 'Зараз', energy_title: 'Енергія та вартість', settings_title: 'Налаштування та діагностика',
      apparent: 'Повна потужність', reactive: 'Реактивна потужність', phase: 'Кут фази', deviation: 'Відхилення напруги', average: 'Середня напруга за 5 хв', min_voltage: 'Мін. на графіку', max_voltage: 'Макс. на графіку', max_current: 'Максимальний струм сьогодні', peak_power: 'Пікова потужність сьогодні', voltage_state: 'Статус напруги',
      today: 'Сьогодні', energy_month: 'Споживання за місяць', energy_total: 'Загальна енергія PZEM', cost_today: 'Вартість сьогодні', cost_month: 'Вартість за місяць', cost_total: 'Загальна розрахована вартість', tariff: 'Поточний тариф', cost_rate: 'Вартість за годину', two_zone: 'Двозонний облік',
      estimated_cost: 'Орієнтовна вартість', current_load: 'Поточне навантаження', tariff_compare: 'Порівняння тарифів', current_rate: 'Активний тариф', night: 'Ніч', device_name: 'Grid Monitor · ESP32-C3', device_description: 'Контролер ESPHome · PZEM-004T', diagnostics: 'Діагностика',
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
      chart_select_time: 'Drag the chart to pan; pinch to zoom, or use the slider to select a time', chart_date_range: 'Select period', chart_from: 'From', chart_to: 'To', chart_apply: 'Show', chart_date_error: 'Check dates: the end must be after the start and not in the future', chart_zoom_in: 'Zoom in', chart_zoom_out: 'Zoom out', chart_readings: 'Readings at selected time', chart_readings_loading: 'Loading readings…', chart_readings_unavailable: 'Measurement history is unavailable', chart_live: 'Now', active_power: 'Active power',
      mains: 'PZEM connection', has_voltage: 'Data available', no_voltage: 'Data unavailable', source: 'ESP power source', from_mains: 'Mains (not confirmed)', from_inverter: 'Source unknown', pzem_link: 'PZEM connection', active: 'Online', inactive: 'Offline', today_consumption: 'Consumption today',
      esp_power_connection: 'ESP power arrangement', esp_power_shared: 'Mains shared with the module', esp_power_after_avr: 'After AVR', esp_power_independent: 'Independent power', esp_power_avr_note: 'ESP may be powered by the inverter', pzem_grid_note: 'PZEM measures mains in every mode',
      params_title: 'Electrical parameters', range_title: 'Voltage range on chart', range_now: 'Now', energy_title: 'Energy and cost', settings_title: 'Settings and diagnostics',
      apparent: 'Apparent power', reactive: 'Reactive power', phase: 'Phase angle', deviation: 'Voltage deviation', average: '5-minute average voltage', min_voltage: 'Chart minimum', max_voltage: 'Chart maximum', max_current: 'Maximum current today', peak_power: 'Peak power today', voltage_state: 'Voltage status',
      today: 'Today', energy_month: 'Consumption this month', energy_total: 'Total PZEM energy', cost_today: 'Cost today', cost_month: 'Cost this month', cost_total: 'Total calculated cost', tariff: 'Current tariff', cost_rate: 'Cost per hour', two_zone: 'Two-zone tariff',
      estimated_cost: 'Estimated cost', current_load: 'Current load', tariff_compare: 'Tariff comparison', current_rate: 'Active tariff', night: 'Night', device_name: 'Grid Monitor · ESP32-C3', device_description: 'ESPHome controller · PZEM-004T', diagnostics: 'Diagnostics',
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
      this._scrollVisibilityHandler = () => this._updateScrollTopVisibility();
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
        if (!isOpen) panel.hidden = true;
      }, true);
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
      if (this._activeTab === 'home') this._updateHomeStatus();
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
    _detail(key, label, digits = 1) {
      const infoButton = this._metricInfoButton(key);
      return `<div class="detail${infoButton ? ' metric-info-card' : ''}">${infoButton}<span>${this._escape(label)}</span><b data-value-key="${key}" data-value-digits="${digits}">${this._escape(this._formatted(key, digits))}</b></div>`;
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
      return `<header class="header"><div class="logo">${this._svg('bolt')}</div><div class="brand"><h1>${this._escape(this._config.name || this._t('title'))}</h1><p>${this._escape(this._t('subtitle'))}</p></div>${this._tabs('top')}</header>`;
    }

    _home() {
      const status = this._displayStatus();
      const voltage = this._num('voltage');
      const progress = gaugeProgress(voltage);
      const voltageNumber = voltage === null ? this._formatted('voltage') : voltage.toLocaleString(this._locale(), { maximumFractionDigits: 1 });
      const voltageUnit = voltage === null ? '' : this._unit('voltage') || (this._lang() === 'uk' ? 'В' : 'V');
      const [markerX, markerY] = gaugeMarker(progress);
      const gaugeDot = `<circle class="gauge-dot" data-role="gauge-dot" fill="url(#${this._id('knob')})" cx="${markerX.toFixed(1)}" cy="${markerY.toFixed(1)}" r="9" visibility="${voltage === null ? 'hidden' : 'visible'}"/>`;
      const mainsText = status.esp === 'off' ? this._t('no_voltage') : status.pzemOnline ? this._t('pzem_online') : status.pzemOffline ? this._t('pzem_offline') : this._t('detecting');
      const sourceText = status.source;
      const voltageQuality = this._formatted('voltage_status');
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
        <div class="bottom-status">
          <div class="card info info-system"><span class="symbol green">${this._svg('plug')}</span><div><div class="small">${this._escape(this._t('pzem_link'))}</div><strong data-role="home-mains" class="${status.pzemOnline ? 'good' : ''}">${this._escape(mainsText)}</strong></div></div>
          <div class="card info"><span class="symbol blue">${this._svg('plug')}</span><div><div class="small">${this._escape(this._t('source'))}</div><strong data-role="home-source">${this._escape(sourceText)}</strong></div></div>
          <div class="card info"><span class="symbol green">${this._svg('shield')}</span><div><div class="small">${this._escape(this._t('voltage_state'))}</div><strong data-role="home-voltage-quality" class="${status.pzemOnline && !status.alarm && !status.qualityUnknown ? 'good' : status.alarm ? 'alarm' : ''}">${this._escape(voltageQuality)}</strong></div></div>
          <div class="card info"><span class="symbol amber">${this._svg('coin')}</span><div><div class="small">${this._escape(this._t('today_consumption'))}</div><strong data-value-key="energy_today" data-value-digits="2">${this._escape(energy)}</strong><div class="small cost-line">≈ <span data-value-key="cost_today" data-value-digits="2">${this._escape(cost)}</span></div></div></div>
        </div>
        <div class="card banner ${status.stateClass}" data-role="home-banner"><span class="banner-check">${this._svg('check')}</span><div class="banner-main"><strong data-role="home-banner-label">${this._escape(status.banner)}</strong></div><div class="banner-system"><span class="banner-system-label">${this._escape(this._t('esp_power_connection'))}</span><strong data-role="esp-power-label">${this._escape(espPower.label)}</strong><span class="banner-system-note" data-role="esp-power-note">${this._escape(espPower.note)}</span></div><span class="house-art" aria-hidden="true">${this._houseArt()}</span></div>
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
          <linearGradient id="${id('sheen')}" gradientUnits="userSpaceOnUse" x1="140" y1="60" x2="300" y2="170"><stop stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
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
          <path d="M120 195C130 120 190 66 262 62C210 86 160 130 150 205Z" fill="url(#${id('sheen')})"/>
        </g>
        <path d="M${250 - R} 205A${R} ${R} 0 0 1 ${250 + R} 205" fill="none" stroke="#9adcff" stroke-opacity=".32" stroke-width="1.4"/>
        <path d="M${250 - R + 2} 205A${R - 2} ${R - 2} 0 0 1 ${250 + R - 2} 205" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2"/>
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
      return `<section class="card chart-card detailed-chart"><div class="chart-head"><h2><span class="chart-icon">${this._svg('chart')}</span>${this._escape(this._t('chart_title'))}</h2><div class="periods" role="group" aria-label="${this._escape(this._t('chart_title'))}">${metricButtons}</div><div class="periods" role="group" aria-label="${this._escape(this._t('hour'))}">${buttons}${this._chartDateRangeHtml()}</div></div><div class="chart-stats" data-role="chart-stats">${this._chartStatsHtml()}</div><div class="chart-plot" data-role="chart-plot">${this._chartSvg()}</div>${this._chartScrubberHtml()}${this._chartReadingsHtml()}</section>`;
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

    _migrateStatsStart(allowLegacy) {
      const helper = this._state('stats_start');
      if (!helper || helper.state === 'unavailable' || this._readStatsStart() !== null) return;
      let candidate = Number.isFinite(this._statsStart) && this._statsNeedsPersist ? this._statsStart : null;
      let legacy = false;
      if (candidate === null && allowLegacy) { candidate = this._legacyStatsStart(); legacy = candidate !== null; }
      if (!Number.isFinite(candidate)) return;
      if (legacy) this._statsStart = candidate;
      this._writeStatsStart(candidate).then((saved) => {
        if (!saved) return;
        this._statsNeedsPersist = false;
        if (legacy) {
          try { window.localStorage?.removeItem(`grid-monitor-card:stats-start:${this._config?.prefix || 'grid_monitor'}`); } catch (_error) { /* ignore */ }
        }
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
      return `<h2 class="subheading">${this._escape(this._t('stats_title'))}</h2><div class="detail stats-start" data-role="stats-start"><label><span>${this._escape(this._t('stats_start_label'))}</span><div class="stats-start-controls"><input type="datetime-local" data-stats-start-input max="${this._formatDateTimeInput(Date.now())}" value="${active ? this._formatDateTimeInput(this._statsStart) : ''}"><button class="save-button" type="button" data-stats-start-apply>${this._escape(this._t('stats_apply'))}</button><button class="save-button ghost" type="button" data-stats-start-clear data-role="stats-start-clear" ${active ? '' : 'disabled'}>${this._escape(this._t('stats_clear'))}</button></div></label><p class="stats-start-hint" data-role="stats-start-hint">${this._escape(hint)}</p><p class="stats-start-sync" data-role="stats-start-sync">${this._escape(this._t('stats_shared_hint'))}</p>${createButton}<p class="stats-start-error" role="alert" data-role="stats-start-error"></p></div>`;
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
      if (sync) sync.textContent = this._state('stats_start') && !['unknown', 'unavailable'].includes(this._raw('stats_start')) ? this._t('stats_sync_saved') : this._t('stats_sync_missing');
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

    _chartDateRangeHtml(scope = 'params') {
      const isEnergy = scope === 'energy';
      const bounds = isEnergy ? this._energyHistoryBounds() : this._historyBounds();
      const startKey = isEnergy ? 'data-energy-chart-date-start' : 'data-chart-date-start';
      const endKey = isEnergy ? 'data-energy-chart-date-end' : 'data-chart-date-end';
      const minAttr = !isEnergy && Number.isFinite(this._statsStart) ? ` min="${this._formatDateTimeInput(this._statsStart)}"` : '';
      const isCustom = isEnergy ? this._energyHistoryRange === 'custom' : this._historyRange === 'custom';
      const popoverId = `${this._instanceId}-${scope}-chart-date-range`;
      return `<div class="chart-date-range ${isCustom ? 'active' : ''}"><button type="button" class="period-button ${isCustom ? 'active' : ''}" data-chart-date-toggle data-chart-scope="${scope}" aria-controls="${popoverId}" aria-haspopup="dialog" aria-expanded="false">${this._escape(this._t('chart_date_range'))}</button><div class="chart-date-range-panel" id="${popoverId}" data-range-scope="${scope}" popover="auto" hidden role="dialog" aria-label="${this._escape(this._t('chart_date_range'))}"><label>${this._escape(this._t('chart_from'))}<input type="datetime-local" ${startKey}${minAttr} value="${this._formatDateTimeInput(bounds.start)}"></label><label>${this._escape(this._t('chart_to'))}<input type="datetime-local" ${endKey}${minAttr} value="${this._formatDateTimeInput(bounds.end)}"></label><button type="button" class="chart-date-apply" data-chart-date-apply data-chart-scope="${scope}">${this._escape(this._t('chart_apply'))}</button><small data-role="chart-date-error" aria-live="polite"></small></div></div>`;
    }

    _closeChartDateRangePopover(panel = null) {
      const panels = panel ? [panel] : [...this.shadowRoot.querySelectorAll('.chart-date-range-panel')];
      panels.forEach((item) => {
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
      if (typeof panel.showPopover === 'function') panel.showPopover();
      else panel.removeAttribute('popover');
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
      const minVal = !isEnergy && Number.isFinite(this._statsStart) ? this._formatDateTimeInput(this._statsStart) : '';
      if (start) {
        start.value = this._formatDateTimeInput(bounds.start);
        if (minVal) start.setAttribute('min', minVal); else start.removeAttribute('min');
      }
      if (end) {
        end.value = this._formatDateTimeInput(bounds.end);
        if (minVal) end.setAttribute('min', minVal); else end.removeAttribute('min');
      }
      const scopePanel = this.shadowRoot.querySelector(`.chart-date-range-panel[data-range-scope="${scope}"]`);
      const error = scopePanel?.querySelector('[data-role="chart-date-error"]');
      if (error) error.textContent = '';
    }

    _applyChartDateRange(scope = 'params') {
      const isEnergy = scope === 'energy';
      const startValue = this.shadowRoot.querySelector(isEnergy ? '[data-energy-chart-date-start]' : '[data-chart-date-start]')?.value;
      const endValue = this.shadowRoot.querySelector(isEnergy ? '[data-energy-chart-date-end]' : '[data-chart-date-end]')?.value;
      const start = startValue ? new Date(startValue).getTime() : NaN;
      const end = endValue ? new Date(endValue).getTime() : NaN;
      const scopePanel = this.shadowRoot.querySelector(`.chart-date-range-panel[data-range-scope="${scope}"]`);
      const error = scopePanel?.querySelector('[data-role="chart-date-error"]');
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end > Date.now()) {
        if (error) error.textContent = this._t('chart_date_error');
        return;
      }
      if (!isEnergy && Number.isFinite(this._statsStart) && start < this._statsStart) {
        if (error) error.textContent = this._t('chart_date_error_earlier') || this._t('chart_date_error');
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
      if ((range === 'custom' && customRange?.end - customRange?.start >= 24 * 3600e3) || (range === 'since' && Number.isFinite(this._statsStart) && Date.now() - this._statsStart >= 24 * 3600e3)) {
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
      const dailyEnergyBars = isEnergy && (range === 'week' || range === 'month' || range === 'custom' && bounds.end - bounds.start >= 24 * 3600e3);
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
      const longRange = this._historyRange === 'week' || this._historyRange === 'month' || range >= 24 * 3600e3;
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
      const longRange = range === 'week' || range === 'month' || (range === 'custom' || range === 'since') && rangeMs >= 24 * 3600e3;
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
      const daily = range === 'week' || range === 'month' || range === 'custom' && bounds.end - bounds.start >= 24 * 3600e3;
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

    _voltageRangeDetail(bound, label) {
      const value = this._voltageRangeStats()[bound];
      return `<div class="detail"><span>${this._escape(label)}</span><b data-role="voltage-${bound}-period">${this._escape(this._formatVoltage(value))}</b></div>`;
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
        ${this._detail('apparent_power', this._t('apparent'), 0)}${this._detail('reactive_power', this._t('reactive'), 0)}${this._detail('phase_angle', this._t('phase'), 1)}
        ${this._detail('voltage_deviation', this._t('deviation'), 1)}${this._detail('voltage_average', this._t('average'), 1)}${this._detail('voltage_status', this._t('voltage_state'), 0)}
        ${this._voltageRangeDetail('min', this._t('min_voltage'))}${this._voltageRangeDetail('max', this._t('max_voltage'))}${this._detail('current_max', this._t(!Number.isFinite(this._statsStart) ? 'max_current' : 'max_current_period'), 2)}${this._detail('power_peak', this._t(!Number.isFinite(this._statsStart) ? 'peak_power' : 'peak_power_period'), 0)}
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
        ${this._energyChart()}
        <div class="detail-grid energy-grid">
          ${this._detail('energy_today', this._t('today'), 3)}${this._detail('energy_month', this._t('energy_month'), 2)}${this._detail('energy_total', this._t('energy_total'), 3)}
          ${this._detail('cost_today', this._t('cost_today'), 2)}${this._detail('cost_month', this._t('cost_month'), 2)}${this._detail('cost_total', this._t('cost_total'), 2)}
          ${this._detail('tariff', this._t('tariff'), 2)}${this._detail('cost_rate', this._t('cost_rate'), 2)}
          ${twoZone ? `<div class="detail tariff-state"><span>${this._escape(this._t('two_zone'))}</span><b data-role="energy-two-zone-value" class="good">${this._escape(this._t('on'))}</b><i class="tariff-led active" data-role="energy-two-zone-led"></i></div>` : ''}
        </div>
        <div class="visual-grid energy-visual-grid">
          <section class="visual-card tariff-visual"><h3>${this._escape(this._t('tariff_compare'))}</h3>${this._tariffBars()}</section>
          <section class="visual-card current-tariff"><h3>${this._escape(this._t('current_rate'))}</h3><strong class="big-number" data-value-key="tariff" data-value-digits="2">${this._escape(this._formatted('tariff', 2))}</strong>${twoZone ? `<span class="rate-pulse">${this._svg('energy')} ${this._escape(this._t('two_zone'))}: <span data-role="energy-two-zone-label">${this._escape(this._t('on'))}</span></span>` : ''}</section>
        </div>
      </section>`;
    }

    _energyChartControlsHtml() {
      const metric = this._energyChartMetric || 'energy_total';
      const metrics = [['energy_total', 'energy_metric_energy'], ['cost_total', 'energy_metric_cost']]
        .map(([key, label]) => `<button type="button" class="period-button ${metric === key ? 'active' : ''}" data-energy-metric="${key}" aria-pressed="${metric === key}">${this._escape(this._t(label))}</button>`).join('');
      const periods = ['hour', 'day', 'week', 'month'].map((period) => `<button type="button" class="period-button ${this._energyHistoryRange === period ? 'active' : ''}" data-energy-period="${period}" aria-pressed="${this._energyHistoryRange === period}">${this._escape(this._t(period))}</button>`).join('');
      return `<div class="periods" role="group" aria-label="${this._escape(this._t('energy_metric_group'))}">${metrics}</div><div class="periods" role="group" aria-label="${this._escape(this._t('chart_period'))}">${periods}${this._chartDateRangeHtml('energy')}</div>`;
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

    _tariffBars() {
      const day = this._num('tariff_day'); const night = this._num('tariff_night');
      const twoZone = this._raw('two_zone') === 'on';
      const max = Math.max(day || 0, twoZone ? night || 0 : 0, 0.01);
      const row = (key, label, cls, value) => `<div class="bar-row"><span>${this._escape(this._t(label))}</span><div class="bar-track"><i class="${cls}" data-tariff-fill="${key}" style="width:${value === null ? 0 : Math.max(0, Math.min(100, value / max * 100)).toFixed(1)}%"></i></div><b data-value-key="${key}" data-value-digits="2">${this._escape(this._formatted(key, 2))}</b></div>`;
      return `<div class="bar-list">${row('tariff_day', 'day', 'day-rate', day)}${twoZone ? row('tariff_night', 'night', 'night-rate', night) : ''}</div>`;
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
      if (!event.target?.closest?.('.chart-date-range')) this._closeChartDateRangePopover();
      const target = event.target?.closest?.('[data-scroll-top], [data-actions-toggle], [data-tab], [data-period], [data-energy-period], [data-energy-metric], [data-energy-bar], [data-metric], [data-action], [data-number-save], [data-switch], [data-chart-live], [data-chart-zoom], [data-chart-date-toggle], [data-chart-date-apply], [data-stats-start-apply], [data-stats-start-clear], [data-stats-helper-create], [data-history-delete]');
      if (!target) return;
      if (target.dataset.scrollTop !== undefined) { this._scrollPageToTop(); return; }
      if (target.dataset.energyBar !== undefined) { this._selectEnergyBar(Number(target.dataset.energyBar)); return; }
      if (target.dataset.chartDateToggle !== undefined) {
        const panel = this.shadowRoot.getElementById(target.getAttribute('aria-controls'));
        let isOpen = false;
        try { isOpen = panel?.matches(':popover-open'); } catch (_error) { isOpen = !panel?.hidden; }
        if (isOpen) this._closeChartDateRangePopover(panel);
        else this._positionChartDateRangePopover(target, panel);
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
        if (this._activeTab === 'home') this._updateHomeStatus();
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

    _updateHomeStatus() {
      const status = this._displayStatus();
      const mainsText = status.esp === 'off' ? this._t('no_voltage') : status.pzemOnline ? this._t('pzem_online') : status.pzemOffline ? this._t('pzem_offline') : this._t('detecting');
      const sourceText = status.source;
      const voltageQuality = this._formatted('voltage_status');
      const mains = this.shadowRoot.querySelector('[data-role="home-mains"]');
      const source = this.shadowRoot.querySelector('[data-role="home-source"]');
      const quality = this.shadowRoot.querySelector('[data-role="home-voltage-quality"]');
      if (mains) { mains.textContent = mainsText; mains.classList.toggle('good', status.pzemOnline); }
      if (source) source.textContent = sourceText;
      if (quality) {
        quality.textContent = voltageQuality;
        quality.classList.toggle('good', status.pzemOnline && !status.alarm && !status.qualityUnknown);
        quality.classList.toggle('alarm', status.alarm);
      }
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
      if (changed.has('tariff_day') || changed.has('tariff_night')) this._updateTariffBars();
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
        .bottom-status{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:13px;margin-top:14px}.info{padding:17px 12px;min-height:128px;display:flex;align-items:center;justify-content:center;gap:12px;min-width:0}.info .symbol{font-size:38px;flex:none;color:var(--green);filter:drop-shadow(0 0 10px #35ed9166)}.info .symbol .icon{width:42px;height:42px}.info .symbol.blue{color:#91b8e9}.info .symbol.amber{color:var(--amber)}.info .small{color:#b6c9e2;font-size:16px}.info strong{display:block;font-size:20px;margin-top:5px;overflow-wrap:anywhere}.info .good{color:var(--green)}.info .cost-line{margin-top:3px}
        .banner{margin-top:14px;padding:18px 24px;min-height:88px;display:flex;align-items:center;gap:18px;border:1px solid #39d77e;background:linear-gradient(90deg,#0c302a,#0c2631 68%,#102b42);box-shadow:0 0 24px #28d87920}.banner.inverter{border-color:#ffb51b;background:linear-gradient(90deg,#382711,#18283a 80%);box-shadow:0 0 24px #ffb51b20}.banner.pzem-offline{border-color:#ffb51b;background:linear-gradient(90deg,#382711,#18283a 80%);box-shadow:0 0 24px #ffb51b20}.banner.alarm,.banner.offline{border-color:#ff526d;background:linear-gradient(90deg,#3a1420,#18283a 80%);box-shadow:0 0 24px #ff526d20}.banner.unknown{border-color:#53677e;background:linear-gradient(90deg,#1a2939,#101e30)}.banner-check{width:48px;height:48px;border-radius:50%;background:var(--green);color:#052116;display:grid;place-items:center;flex:none;box-shadow:0 0 18px #35ed9166}.banner-check .icon{width:36px;height:36px}.banner.inverter .banner-check{background:var(--amber);color:#392400}.banner.pzem-offline .banner-check{background:var(--amber);color:#392400}.banner.alarm .banner-check,.banner.offline .banner-check{background:var(--red);color:#390711}.banner.unknown .banner-check{background:#53677e;color:#d6e5f6}.banner strong{color:#4df29a;font-size:clamp(17px,2cqw,24px)}.banner.inverter strong{color:#ffd078}.banner.pzem-offline strong{color:#ffd078}.banner.alarm strong,.banner.offline strong{color:#ff8a9a}.banner.unknown strong{color:#b4c7df}.house-art{margin-left:auto;width:130px;max-width:22%;flex:none;filter:drop-shadow(0 0 11px #1b8fff)}.house-art svg{display:block;width:100%;height:auto}
        .detail-panel{padding:22px;margin-top:2px}.detail-panel h2{margin:0 0 18px;font-size:25px}.detail-panel h2.subheading{margin:24px 0 14px;font-size:19px}.detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.detail{padding:16px;border-radius:16px;background:#13243a;border:1px solid #2b4562;min-width:0}.detail>span,.detail label>span{display:block;color:#9fb5d1;font-size:14px;margin-bottom:7px}.detail b{font-size:22px;overflow-wrap:anywhere}.setting{display:flex;align-items:end;gap:10px}.setting label{flex:1;min-width:0}.setting-input{display:flex;align-items:center;gap:8px}.setting-input input{width:100%;min-width:0;background:#091727;border:1px solid #37526f;border-radius:9px;color:var(--text);padding:10px;font:inherit;font-size:18px}.setting-input small{color:#9fb5d1;white-space:nowrap}.save-button,.switch-button,.action-button{border:1px solid #278ed0;background:#092645;color:#d7efff;border-radius:10px;padding:9px 12px;font:inherit;cursor:pointer}.save-button:hover,.switch-button:hover,.action-button:hover{background:#0c3962}.save-button:disabled,.switch-button:disabled,.action-button:disabled{opacity:.45;cursor:not-allowed}.switch-setting{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.switch-setting>span{color:#9fb5d1;font-size:14px}.switch-setting>strong{font-size:16px}.switch-button{grid-column:1/-1;display:flex;align-items:center;gap:8px;justify-content:center}.switch-button .icon{width:20px;height:20px}.switch-button.on{border-color:#35ed91;color:#35ed91}.action-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.action-button{min-height:68px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;font-size:13px;border-color:#2b8ed0}.action-button span{font-size:22px;color:#45bdff}.action-button .icon{width:25px;height:25px}.footer{display:flex;justify-content:space-between;gap:10px;margin:14px 2px 0;color:#6885a2;font-size:11px}.footer span:last-child{max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .chart-head .periods+.periods{margin-left:0}.chart-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:4px 0 10px}.chart-stats>div{background:#13243a;border:1px solid #2b4562;border-radius:14px;padding:9px 12px;min-width:0}.chart-stats span{display:block;color:#9fb5d1;font-size:13px}.chart-stats b{display:block;font-size:19px;margin-top:3px;overflow-wrap:anywhere}.chart-stats small{display:block;margin-top:3px;color:#86a1c1;font-size:12px;line-height:1.25}
        .voltage-brand{display:flex;align-items:flex-start;gap:10px;align-self:flex-start;width:100%;min-width:0;max-width:100%;margin-bottom:0;flex-wrap:wrap}.voltage-brand .logo{flex:none}.voltage-brand .brand{flex:1 1 auto}.voltage-brand .brand h1{margin:0 0 2px;line-height:1.15;font-size:clamp(20px,2.6cqw,32px)}.voltage-brand .brand p{font-size:clamp(13px,1.5cqw,16px);line-height:1.2}.voltage-brand .home-status{flex:none;align-self:flex-start;gap:8px;margin-left:auto;max-width:100%}.voltage-brand .home-status .connection small{margin-top:2px}.voltage .voltage-gauge{margin:0}.main-right{display:flex;flex-direction:column;gap:10px;min-width:0}.main-right>.metrics{flex:1}
        @container (min-width:960px){.shell.home-active>.tabs-top{display:none}.shell:not(.home-active)>.tabs-top{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:45%;min-width:360px;max-width:560px;margin:0 0 14px auto;padding:8px;gap:6px}.shell:not(.home-active)>.tabs-top .tab{padding:15px 8px}.shell:not(.home-active)>.page-layout{display:block;margin-top:-40px}.shell:not(.home-active)>.page-layout>.tabs-side{display:none}.home-view .main-grid{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);grid-template-rows:auto;align-items:stretch}.home-view .main-grid>.voltage{grid-column:1;grid-row:1}.home-view .main-grid>.main-right{grid-column:2;grid-row:1}.home-view .main-right>.tabs-side{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin:0;align-self:stretch;width:100%}}
        @container (max-width:959px){.home-view .main-grid{grid-template-columns:minmax(0,1fr);align-items:start}.home-view .main-right{display:contents}.home-view .main-right>.tabs-side{display:none}.home-view .main-grid>.voltage{grid-column:1;grid-row:1}.home-view .main-right>.metrics{grid-column:1;grid-row:2}.shell:not(.home-active)>.tabs-top{display:grid}.shell:not(.home-active)>.page-layout{display:block;margin-top:-40px}.shell:not(.home-active)>.page-layout>.tabs-side{display:none}}
        @container (max-width:760px){.shell{padding:12px}.header{gap:11px;padding:5px 2px 14px}.logo{width:58px;height:58px;border-radius:17px}.logo .icon{width:38px;height:38px}.headright{gap:8px}.connection strong{font-size:14px}.connection small{font-size:10px}.tabs{margin-bottom:12px}.tab{gap:5px;padding:12px 3px;font-size:12px}.tab .tab-icon{font-size:19px}.tab .icon{width:20px;height:20px}.main-grid{grid-template-columns:1fr;gap:10px}.voltage{min-height:300px}.voltage-gauge{width:min(100%,420px)}.metrics{gap:10px}.metric{min-height:135px}.metric-icon .icon{width:38px;height:38px}.metric-label{font-size:15px}.chart-card{padding:13px 11px}.chart-head h2{font-size:19px}.periods{width:100%;margin:0}.period-button{flex:1;padding:8px 4px;font-size:13px}.bottom-status{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.info{min-height:100px;padding:12px 8px}.info .symbol .icon{width:30px;height:30px}.info .small{font-size:13px}.info strong{font-size:16px}.banner{padding:14px;min-height:70px}.banner-check{width:38px;height:38px}.banner-check .icon{width:28px;height:28px}.house-art{width:80px}.detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.detail-panel{padding:16px}.detail-panel h2{font-size:22px}.action-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
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
        .banner{position:relative;overflow:hidden;background:linear-gradient(105deg,#07362bf7,#082830f7 55%,#082038f7);border-color:#43f5a0b3;box-shadow:0 0 0 1px #43f5a01a,0 0 30px #29dc8621,inset 0 1px 0 #ffffff2e,inset 0 -8px 20px #0005}.banner strong{text-shadow:0 2px 12px #24ff9d45}.banner .banner-check{box-shadow:0 0 0 6px #3fffa414,0 0 24px #3fffa078,inset 0 2px 4px #ffffff5c}.banner.inverter{background:linear-gradient(105deg,#403014f7,#222a32f7 58%,#10233af7)}.banner.pzem-offline{background:linear-gradient(105deg,#403014f7,#222a32f7 58%,#10233af7)}.banner.alarm,.banner.offline{background:linear-gradient(105deg,#401b27f7,#202336f7 62%,#171c2af7)}
        .house-art{width:min(30%,210px);max-width:210px;filter:drop-shadow(0 8px 15px #000a) drop-shadow(0 0 15px #0082ff54);opacity:.98}.house-art svg{display:block;width:100%;height:auto}
        .energy-hero{display:grid;grid-template-columns:1.08fr .92fr;gap:15px;margin:0 0 15px}.energy-visual{position:relative;isolation:isolate;min-height:170px;overflow:hidden;padding:20px;border-radius:19px;border:1px solid #70aee24f;box-shadow:inset 0 1px 0 #ffffff2c,0 16px 32px #0006,inset 0 -10px 20px #0004;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}.energy-visual:before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(circle at 82% 24%,#ffbd4a42,transparent 34%),linear-gradient(125deg,#193e68,#10213d 58%,#201d45)}.energy-load:before{background:radial-gradient(circle at 82% 24%,#19cdff40,transparent 35%),linear-gradient(125deg,#123f61,#10213d 60%,#122d50)}.energy-visual .eyebrow{color:#b4cbe6;font-size:12px;letter-spacing:.1em;text-transform:uppercase}.energy-visual .hero-number{position:relative;z-index:1;max-width:75%;margin:7px 0 3px;font-size:clamp(25px,4cqw,43px);line-height:1.12;font-weight:850;letter-spacing:-1px;text-shadow:0 4px 18px #0008;overflow-wrap:anywhere}.energy-visual small{position:relative;z-index:1;max-width:76%;color:#c1d4ea;font-size:13px}.energy-object{position:absolute;right:16px;bottom:10px;width:95px;height:95px;max-width:32%;max-height:80%;pointer-events:none;filter:drop-shadow(0 8px 14px #0008);opacity:.92;transition:transform .2s ease}.coin-object{transform:rotate(-3deg)}.plug-object{transform:rotate(4deg)}
        .energy-visual-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:14px;margin-top:14px}.visual-card{padding:18px;border-radius:18px;background:linear-gradient(145deg,#1b334ff5,#0a1728fa);border:1px solid #69a4d944;box-shadow:inset 0 1px 0 #ffffff1e,0 11px 24px #0005}.visual-card h3{margin:0 0 15px;font-size:17px}.bar-list{display:grid;gap:14px}.bar-row{display:grid;grid-template-columns:64px minmax(36px,1fr) minmax(80px,auto);gap:11px;align-items:center;color:var(--muted);font-size:13px}.bar-row b{color:var(--text);font-size:14px;text-align:right}.bar-track{height:9px;border-radius:9px;overflow:hidden;background:#263c56;box-shadow:inset 0 2px 3px #0008}.bar-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#078bff,#16d6e8);box-shadow:0 0 12px #0aaaff62;transition:width .55s ease}.bar-track i.night-rate{background:linear-gradient(90deg,#8057d8,#c07aff);box-shadow:0 0 12px #a875ff62}.rate-pulse{display:inline-flex;align-items:center;gap:7px;margin-top:13px;padding:6px 10px;border-radius:18px;background:#0b3440;border:1px solid #28bdc457;color:#69e6d4;font-size:12px;max-width:100%;flex-wrap:wrap}.rate-pulse .icon{width:17px;height:17px}.current-tariff{display:flex;flex-direction:column;justify-content:center;align-items:flex-start}.current-tariff .big-number{font-size:clamp(27px,3.5cqw,40px);overflow-wrap:anywhere}
        .settings-hero{display:flex;align-items:center;gap:15px;padding:14px 18px;margin:0 0 15px;border-radius:18px;background:linear-gradient(110deg,#163c5ff2,#17224bf2);border:1px solid #70aee24a;box-shadow:inset 0 1px 0 #ffffff27,0 14px 28px #0005}.chip-art{width:68px;height:68px;flex:none;filter:drop-shadow(0 6px 12px #0008) drop-shadow(0 0 10px #078fff35)}.device-copy{min-width:0}.device-copy strong{display:block;font-size:17px}.device-copy span{display:block;margin-top:4px;color:#a9bfdc;font-size:12px}.device-status{margin-left:auto;display:flex;align-items:center;gap:8px;white-space:nowrap;color:var(--muted);font-size:13px}.device-status i{width:10px;height:10px;border-radius:50%;background:#8597aa;box-shadow:0 0 8px #8597aa66}.device-status.online{color:var(--green)}.device-status.online i{background:var(--green);box-shadow:0 0 12px #35ed91a8}.device-status.offline{color:var(--red)}.device-status.offline i{background:var(--red);box-shadow:0 0 12px #ff526d88}.detail:hover,.visual-card:hover,.control:hover{border-color:#59bbef70;box-shadow:0 16px 32px #0007,0 0 24px #0099ff13}.tariff-state{position:relative}.tariff-led{position:absolute;right:14px;bottom:14px;width:8px;height:8px;border-radius:50%;background:#7e8ea2}.tariff-led.active{background:var(--green);box-shadow:0 0 12px #35ed91b0}
        .metric:hover,.info:hover,.action-button:hover,.save-button:hover,.switch-button:hover{transform:translateY(-3px);border-color:#54bdff80;box-shadow:0 18px 34px #0008,0 0 24px #0099ff1b}.tab,.period-button,.action-button,.save-button,.switch-button{transition:background .22s,color .22s,border-color .22s,box-shadow .22s,transform .22s}
        @media(prefers-reduced-motion:no-preference){.shell:not(.render-ready){animation:deviceBoot .7s cubic-bezier(.2,.8,.2,1) both}.logo .icon{animation:logoFloat 4.2s ease-in-out infinite}.gauge-dot{animation:gaugePulse 2.8s ease-in-out infinite}.chart-dot{animation:chartPulse 2.4s ease-in-out infinite}.voltage:after{animation:screenGlow 7s ease-in-out infinite alternate}@keyframes deviceBoot{from{opacity:0;transform:translateY(8px) scale(.995)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes logoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}@keyframes gaugePulse{0%,100%{filter:drop-shadow(0 0 5px #08c5ff)}50%{filter:drop-shadow(0 0 12px #08c5ff)}}@keyframes chartPulse{0%,100%{opacity:.8}50%{opacity:1}}@keyframes screenGlow{from{box-shadow:inset 0 0 24px #0091ff10}to{box-shadow:inset 0 0 40px #0091ff24}}}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
        @container (max-width:760px){.energy-hero{grid-template-columns:1fr}.energy-visual{min-height:145px}.energy-visual-grid{grid-template-columns:1fr}.energy-object{width:76px;height:76px;right:10px;bottom:8px}.settings-hero{gap:11px;padding:12px}.chip-art{width:56px;height:56px}.device-copy strong{font-size:15px}.device-status{font-size:12px}}
        @container (max-width:420px){.energy-visual{min-height:130px;padding:15px}.energy-visual .hero-number{font-size:clamp(24px,7cqw,31px);max-width:80%}.energy-visual small{font-size:11px;max-width:80%}.energy-object{width:58px;height:58px;right:8px;bottom:6px;opacity:.8}.settings-hero{flex-wrap:wrap}.chip-art{width:46px;height:46px}.device-status{margin-left:6px}.bar-row{grid-template-columns:47px minmax(24px,1fr) minmax(75px,auto);gap:7px}.banner strong{max-width:68%}}
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

        .bottom-status{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:16px}
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
        .house-art{width:min(22%,140px);margin:-4px -2px -8px auto}

        .footer{margin-top:16px;font-size:12px;color:#5f7f9f}

        @container (min-width:960px){
          .home-view .main-right>.tabs-side{padding:8px;gap:6px}
          .home-view .main-right>.tabs-side .tab{padding:15px 8px}
          .home-view .main-right>.metrics{align-content:stretch}
        }

        @container (max-width:900px){
          .bottom-status{grid-template-columns:repeat(2,minmax(0,1fr))}
        }

        @container (max-width:760px){
          .main-grid{gap:12px}
          .voltage{padding:10px 10px 8px;gap:0}
          .metrics{gap:12px}
          .metric{padding:16px 8px 14px}
          .metric-icon .icon{width:38px;height:38px}
          .bottom-status{gap:10px}
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
          .bottom-status{gap:9px}
          .info{flex-direction:column;align-items:flex-start;gap:10px;padding:14px 13px}
          .info .symbol{width:44px;height:44px;border-radius:14px}
          .info .symbol .icon{width:24px;height:24px}
          .info strong{font-size:16px}
          .banner{padding:12px 14px;min-height:76px;gap:12px}
          .banner strong{max-width:none}
          .house-art{width:88px;margin:-2px -2px -6px auto}
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
        .metric{position:relative}
        .metric .metric-info-button,.detail .metric-info-button{position:absolute;top:8px;right:8px;z-index:3;width:28px;height:28px;display:grid;place-items:center;padding:0;border:1px solid #64caff88;border-radius:50%;background:linear-gradient(145deg,#0d5791,#082340);color:#c5efff;font-family:inherit;font-size:15px;font-weight:800;line-height:1;cursor:pointer;box-shadow:0 0 12px #009dff26}
        .metric .metric-info-button:hover,.detail .metric-info-button:hover{background:linear-gradient(145deg,#0e78bf,#0a3961);color:#fff;border-color:#8edcff}
        .metric .metric-info-button:focus-visible,.detail .metric-info-button:focus-visible{outline:2px solid #bcecff;outline-offset:2px}
        .detail.metric-info-card>span{padding-right:34px}

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

        .shell:not(.home-active)>.header>.brand{flex:1 1 auto}.shell:not(.home-active)>.header>.tabs-top{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));flex:0 0 45%;width:45%;min-width:360px;max-width:560px;margin:0 0 0 auto;padding:8px;gap:6px}
        .shell:not(.home-active)>.header>.tabs-top .tab{padding:15px 8px}
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
        @container (max-width:959px){.shell:not(.home-active)>.header{flex-wrap:wrap;gap:11px;padding-bottom:12px}.shell:not(.home-active)>.header>.brand{flex:1 1 auto}.shell:not(.home-active)>.header>.tabs-top{flex:1 0 100%;width:100%;min-width:0;max-width:none;margin:0 0 4px;grid-template-columns:repeat(4,minmax(0,1fr))}}
        @container (max-width:900px){.chart-reading-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @container (max-width:760px){.chart-scrubber{grid-template-columns:minmax(0,1fr) auto;gap:8px}.chart-scrubber-label{grid-column:1/-1}.chart-readings-head .chart-readings-status{margin-left:0}}
        @container (max-width:520px){.chart-reading-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.chart-reading{padding:10px}.chart-reading strong{font-size:16px}}

        .voltage{padding:5px 12px 4px;justify-content:space-between}
        .shell:not(.home-active)>.header{align-items:flex-start;padding-bottom:1px;z-index:2}
        @container (max-width:959px){.shell:not(.home-active)>.header{padding-bottom:1px}.shell:not(.home-active)>.header>.tabs-top{margin-bottom:0}}
        @container (max-width:760px){.voltage{padding:5px 10px 4px}}
        .voltage-brand,.voltage-gauge,.state-indicator{transform:translateY(-4px)}
        .action-grid{grid-template-columns:repeat(5,minmax(0,1fr))}
        @container (max-width:760px){.action-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;overflow:visible}.action-button{min-height:72px;padding:10px 8px;font-size:12px}.action-grid .action-button:nth-child(5){grid-column:1/-1}}

        /* Mobile polish: readable layouts, touch-sized controls, and no sideways scrolling. */
        @container (max-width:760px){
          .shell{padding:10px;border-radius:22px}
          .header{gap:9px;padding:4px 2px 10px}
          .shell.home-active>.tabs-top{margin:0 0 10px}
          .shell:not(.home-active)>.header>.tabs-top{margin:0 0 4px}
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
          .bottom-status{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}
          .info{min-height:106px;flex-direction:row;align-items:flex-start;justify-content:flex-start;gap:9px;padding:12px 10px;border-radius:18px}
          .info .symbol{width:36px;height:36px;border-radius:12px}
          .info .symbol .icon{width:21px;height:21px}
          .info .small{font-size:11px;line-height:1.25}
          .info strong{font-size:14px;line-height:1.25}
          .banner{margin-top:12px;padding:12px 14px;min-height:68px;gap:10px}
          .banner-check{width:34px;height:34px}
          .banner-check .icon{width:25px;height:25px}
          .banner strong{flex:1;min-width:0;max-width:none;font-size:clamp(14px,4cqw,17px);line-height:1.3}
          .house-art{width:64px;max-width:20%;margin:0 -2px 0 auto}
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
          .energy-visual-grid{grid-template-columns:1fr;gap:10px}
          .visual-card{padding:14px}
          .bar-row{grid-template-columns:48px minmax(30px,1fr) minmax(70px,auto);gap:8px}
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
          .bottom-status{grid-template-columns:1fr}
          .detail-grid:not(.settings-grid){grid-template-columns:1fr}
          .banner .house-art{display:none}
          .tabs{gap:2px;padding:3px}
          .tab{padding:8px 1px;font-size:10px}
        }

        .chart-tools{display:flex;align-items:center;gap:6px;margin-left:auto}
        .chart-zoom-button,.chart-date-apply{min-width:38px;min-height:36px;border:1px solid #278ed0;border-radius:10px;background:#092645;color:#d7efff;font:inherit;font-weight:700;cursor:pointer}
        .chart-zoom-button:hover,.chart-date-apply:hover{background:#0c3962}
        .chart-date-range{position:relative;display:inline-flex;z-index:1000}
        .chart-date-range-panel{position:fixed;inset:auto;margin:0;z-index:2147483647;display:flex;align-items:end;flex-wrap:wrap;gap:9px;width:min(440px,calc(100vw - 16px));max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);overflow:auto;padding:12px;border:1px solid #37526f;border-radius:14px;background:#0b192a;color:var(--text);box-shadow:0 12px 35px rgba(0,0,0,.85)}
        .chart-date-range-panel[hidden]{display:none!important}
        .chart-date-range-panel:popover-open{display:flex}
        .chart-date-range-panel label{display:grid;gap:4px;color:#9fb5d1;font-size:12px}
        .chart-date-range-panel input{min-width:190px;min-height:36px;padding:6px 8px;border:1px solid #37526f;border-radius:9px;background:#091727;color:#eef6ff;font:inherit;color-scheme:dark}
        .chart-date-range-panel small{flex-basis:100%;color:#ff9ba8;font-size:12px}
        .chart-date-apply{padding:0 14px}
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
          .chart-date-range-panel{position:fixed;inset:auto;left:8px;right:8px;width:calc(100vw - 16px);min-width:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
          .chart-date-range-panel input{min-width:0;width:100%;box-sizing:border-box;font-size:12px}
          .chart-date-apply{grid-column:1/-1}
          .banner{display:grid;grid-template-columns:38px minmax(0,1fr) 58px;align-items:center;gap:10px}
          .banner-check{grid-column:1;grid-row:1}
          .banner-main{grid-column:2;grid-row:1}
          .banner-system{grid-column:1/-1;grid-row:2;padding:10px 0 0;margin:0;border-left:0;border-top:1px solid #ffffff2c}
          .house-art{grid-column:3;grid-row:1;width:58px;max-width:100%;margin:0}
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
        .shell.eco .gauge-fill-glow,.shell.eco .tower-halo,.shell.eco .tower-haze,.shell.eco .chart-glow{display:none}
        @media(prefers-reduced-motion:reduce){.card{backdrop-filter:none;-webkit-backdrop-filter:none}.tower-beacon{animation:none}}

        .action-grid .action-button.danger{border-color:#ff526d80;background:linear-gradient(145deg,#2c1520,#0d1b2e)}
        .action-grid .action-button.danger span{color:#ff8a9a}
        .actions-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:56px;padding:12px 18px;border:1px solid #ffffff24;border-radius:18px;background:linear-gradient(145deg,#15263b,#0d1b2e);color:#eaf3ff;font:inherit;font-weight:600;cursor:pointer}
        .actions-chevron{width:10px;height:10px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);transition:transform .2s;margin-top:-4px}
        .actions-toggle[aria-expanded="true"] .actions-chevron{transform:rotate(-135deg);margin-top:4px}
        .actions-body{margin-top:12px}.actions-body[hidden]{display:none}
      `;
    }
  }

  customElements.define('grid-monitor-card', GridMonitorCard);
})();
