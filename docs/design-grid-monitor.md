# Grid Monitor — design sketch

## Direction

**Neon utility console**: a calm dark control surface for a household electrical system. It borrows the supplied visual language without copying decorative artwork: deep navy background, luminous cyan/blue measurement accents, green for healthy operation, amber for PZEM communication loss and unknown source, and red only for actionable alarms.

## Sketch

```text
┌─────────────────────────────────────────────────────────────────────┐
│ ⚡ Мережева напруга                         Онлайн · Оновлено        │
│ PZEM-004T v3.0 · Grid Monitor                                      │
├─────────────────────────────────────────────────────────────────────┤
│   ┌──────────────────────┐  ┌──────────────┐ ┌──────────────┐       │
│   │      229.8 V         │  │  500 W       │ │  2.05 A      │       │
│   │     Напруга          │  │ Потужність   │ │ Струм        │       │
│   │      ✓ Норма         │  └──────────────┘ └──────────────┘       │
│   └──────────────────────┘  ┌──────────────┐ ┌──────────────┐       │
│                              │ 50.0 Hz      │ │ PF 0.98      │       │
│                              └──────────────┘ └──────────────┘       │
├─────────────────────────────────────────────────────────────────────┤
│ Графік електричних параметрів · 24 години                           │
├───────────────────────────────┬─────────────────────────────────────┤
│ PZEM · Джерело ESP невідоме · Зв’язок    │ Енергія · Вартість · Тариф          │
├───────────────────────────────┴─────────────────────────────────────┤
│ Піки · Якість напруги · Переривання зв’язку з PZEM                            │
├─────────────────────────────────────────────────────────────────────┤
│ Налаштування · Діагностика · Дії                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Interaction rules

- The dashboard opens on live state, not configuration.
- A PZEM timeout gets an amber warning; it reports the power source as unknown, never as confirmed inverter operation.
- Unavailable entities are not treated as healthy or as confirmed `off`; the source-status sensor distinguishes PZEM online, PZEM offline with unknown source, and waiting for PZEM.
- Destructive actions use Home Assistant confirmation prompts.
- Entity names describe the signal they actually measure; card aliases recognize the previous inferred inverter entities where possible.
- The dashboard uses native cards so it remains maintainable without a custom frontend bundle.

## Responsive behavior

The masonry layout collapses naturally on mobile. Metric cards use two columns on a phone and can expand on desktop. Longer diagnostic and configuration lists stay below the live monitoring content so the first viewport remains operationally useful.
