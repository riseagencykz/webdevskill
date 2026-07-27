# Mr B — лендинг барбершопа

Одностраничный сайт, собранный на данных скилла **ui-ux-pro-max** (без ручных догадок по стилю).
Стек — один файл `index.html` + Tailwind CDN, как у соседних примеров в `projects/`.

```bash
# посмотреть локально
python3 -m http.server 8000 --directory projects/mr-b
# -> http://localhost:8000
```

## ⚠️ Контент — заглушки

Бриф по проекту не передавался, поэтому «Mr B» трактован как **барбершоп премиум-класса**.
Заменить перед показом клиенту:

- телефон `+7 700 000-00-00`, почта `hello@mrb.kz`, адрес «ул. Примерная, 1»;
- цифры соцдоказательства (11 лет / 6 400 клиентов / 4.9) и все отзывы;
- имена мастеров, услуги и цены;
- 6 заглушек в галерее + фото в герое (формат 4:5);
- в `submit`-обработчике `index.html` — `setTimeout` на реальный эндпоинт или вебхук CRM.

Если Mr B — не барбершоп, каркас переиспользуется: меняются палитра и секции,
структура (герой → услуги → команда → работы → отзывы → запись) остаётся.

## Что откуда взято

Каждое дизайн-решение — результат конкретного запроса к скиллу, а не вкусовщина:

| Решение | Запрос | Источник |
|---|---|---|
| Палитра `#1C1917` / `#A16207` / `#0C0A09` | `--domain color "luxury premium black gold"` | `colors.csv` → Luxury/Premium Brand |
| Playfair Display + Inter | `--domain typography "luxury elegant premium brand"` | `typography.csv` → Classic Elegant |
| Тип продукта, стиль | `--domain product "barbershop men grooming premium"` | `products.csv` → Luxury/Premium Brand |
| Порядок секций, CTA над сгибом | `--domain landing "storytelling driven local service booking"` | `landing.csv` |
| Stagger-появление, parallax | `--domain gsap "scroll reveal stagger parallax"` | `motion.csv` |
| `<label for>` + статус отправки | `--domain ux "booking form conversion trust"` | `ux-guidelines.csv` (severity: High) |
| Иконки (телефон, календарь) | `--domain icons "scissors calendar phone location"` | `icons.csv` → Phosphor |

Воспроизвести любую строку:

```bash
python3 src/ui-ux-pro-max/scripts/search.py "<запрос>" --domain <домен> -n 3
```

### Отклонения от выдачи скилла

- **Акцент `#A16207`, а не `#FFD700`.** `products.csv` предлагает золото `#FFD700`, но
  `colors.csv` отдаёт `#A16207` с пометкой *«adjusted from #CA8A04 for WCAG 3:1»*.
  Взят второй: `#FFD700` на тёмном фоне не проходит контраст для не-текстовых элементов.
- **Тёмная схема вместо светлой.** `colors.csv` даёт `background: #FAFAF9`; для барбершопа
  взята тёмная инверсия той же палитры — токены те же, местами поменяны фон и текст.
- **Без SplitText.** `motion.csv` → Stagger List использует SplitText, это платный плагин
  GSAP Club. Реализован обычный fade-вариант, как советует та же строка
  (*«provide a plain fade fallback if unavailable»*).

## Magic MCP

`.mcp.json` в этой папке подключает [@21st-dev/magic](https://21st.dev) для генерации
компонентов. Нужен ключ — в текущем окружении его нет, поэтому страница собрана
без Magic, только на данных ui-ux-pro-max.

```bash
export TWENTY_FIRST_API_KEY=<ключ с 21st.dev/magic/console>
claude   # запустить из projects/mr-b, чтобы .mcp.json подхватился
```

Проверка: `claude mcp list` → в списке должен быть `magic`.
Дальше в чате: `/ui hero section for a premium barbershop, black + gold`.

Magic отдаёт React/Tailwind-компоненты — они не вставляются в текущий одностраничник
напрямую. Если нужен Magic в работе, страницу стоит перенести на Next.js
(`--stack nextjs` в скилле), тогда сгенерированные компоненты кладутся как есть.

## Доступность

Проверено расчётом контраста, а не на глаз:

| Пара | Ratio | |
|---|---|---|
| текст `#FAFAF9` на фоне | 18.92 | AA |
| `muted` на фоне | 7.83 | AA |
| `accent-soft` на фоне | 8.37 | AA |
| белый на `accent` (кнопки) | 4.91 | AA |
| `accent` на фоне (рамки, иконки) | 4.01 | AA для не-текста (3:1) |

Текст на кнопках — белый (`On Accent: #FFFFFF` из `colors.csv`): чёрный на `#A16207`
даёт 4.27 и не проходит порог 4.5 для обычного текста.

Остальное:

- у всех полей формы есть `<label for>`, ошибки и успех объявляются через `role="status"`;
- `prefers-reduced-motion` отключает и CSS-переходы, и GSAP;
- видимый focus-ring, skip-link на `#main`, вся навигация доступна с клавиатуры;
- если GSAP не загрузился, `.reveal` принудительно показываются — контент не пропадает.
