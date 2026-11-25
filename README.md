# QA Automation: тестове завдання (Middle)

[![tests](https://github.com/Yarik0378/qa-automation-test-task/actions/workflows/tests.yml/badge.svg)](https://github.com/Yarik0378/qa-automation-test-task/actions/workflows/tests.yml)

UI-тести [saucedemo.com](https://www.saucedemo.com) і API-тести [restful-booker](https://restful-booker.herokuapp.com/apidoc) на **Playwright + TypeScript**, CI на GitHub Actions. Тести писались у парі з ШІ-агентом (Claude Code).

## Коротко
- **23 автотести:** 17 UI (логін, каталог, сортування, кошик, чекаут, негативні кейси) і 6 API (повний CRUD-флоу, авторизація, валідація).
- **3 баги з доказами:** замовлення з порожнім кошиком оформлюється ([BUG-001](#bug-001)); `$0` замість `$0.00` ([BUG-002](#bug-002)); API відповідає 500 на запит без обовʼязкових полів ([BUG-003](#bug-003)). Тести на BUG-001 і BUG-003 позначені як очікуване падіння.
- **6 спостережень:** незвична поведінка, яка не є багом без вимоги (наприклад, API повертає 200 на невірний пароль).
- **CI:** тести на кожен push, HTML-звіт як артефакт; нестабільний (flaky) тест валить запуск.
- **Робота з агентом:** інструкції в [CLAUDE.md](CLAUDE.md), промпти, рішення і 5 помилок агента в [AI_WORKLOG.md](AI_WORKLOG.md).

## Зміст
- [Як запустити](#як-запустити)
- [Що покрито](#що-покрито)
- [Що свідомо не покрито](#що-свідомо-не-покрито)
- [Знайдені баги](#знайдені-баги)
- [Спостереження](#спостереження)
- [CI](#ci)
- [Відповідність ТЗ](#відповідність-тз)

## Як запустити

**Потрібно:** Node.js 26 (перевірено на 26.8.1 локально і 26.13.1 у CI; `engines` у `package.json` дозволяє ≥ 20, але старіші версії не перевірялись) і git.

```bash
git clone https://github.com/Yarik0378/qa-automation-test-task.git
cd qa-automation-test-task
npm ci
npx playwright install chromium   # браузер для UI-тестів
```

| Команда | Що робить |
|---|---|
| `npm test` | усі тести (UI + API) |
| `npm run test:ui` | лише saucedemo |
| `npm run test:api` | лише restful-booker |
| `npm run test:headed` | UI-тести з видимим браузером |
| `npx playwright test -g "UI-03"` | тести за ID |
| `npm run typecheck` | перевірка типів TypeScript |
| `npm run report` | відкрити HTML-звіт останнього запуску (`playwright-report/`) |

**Що побачиш:** `23 passed`. Два тести у списку позначені `x` (на Linux `✘`): UI-N3 і API-N2: це тести на відомі баги, позначені `test.fail()`. Вони рахуються як пройдені, доки баг не полагодять.

**Змінні оточення (необовʼязково):** `UI_BASE_URL`, `API_BASE_URL`, `API_USERNAME`, `API_PASSWORD` (за замовчуванням публічні адреси й креди з документації).

Інструкцію перевірено на свіжому клоні з GitHub (`npm ci` → `npx playwright install chromium` → `npm run typecheck` → тести: 23 passed). Звичайний `npm test` у робочій копії дає 23 passed і створює `playwright-report/index.html`.

**Структура:**
```
tests/ui/, tests/api/    тести
pages/                   Page Object для saucedemo
api/BookingClient.ts     клієнт restful-booker
fixtures/test.ts         фікстури: сторінки, логін, токен, автоочищення бронювань
test-data/               користувачі, товари, фабрика бронювань
docs/TEST_PLAN.md        початковий тест-план і що змінилось
docs/bugs/               докази до багів і спостережень
```

## Що покрито

Локатори для UI взяті з живого сайту через Playwright MCP, а не з памʼяті. Тести на відомі баги мають `test.fail()`: коли баг полагодять, тест почне падати, і про це стане відомо.

### UI: saucedemo.com (17 тестів)
| ID | Сценарій | Файл |
|---|---|---|
| UI-01 | Логін `standard_user`: URL, заголовок «Products», 6 товарів | [login.spec.ts](tests/ui/login.spec.ts) |
| UI-02 | Картка товару: назва і ціна збігаються зі списком, зображення з alt-текстом назви; «Back to products» | [catalog.spec.ts](tests/ui/catalog.spec.ts) |
| UI-03 | Сортування A→Z, Z→A, ціна ↑, ціна ↓ (4 тести) | [sorting.spec.ts](tests/ui/sorting.spec.ts) |
| UI-04 | Кошик: додати 2, прибрати 1; лічильник, кнопки Add↔Remove, вміст кошика | [cart.spec.ts](tests/ui/cart.spec.ts) |
| UI-05 | E2E-чекаут 2 товарів: сума, податок 8%\*, Total, «Thank you for your order!», кошик порожній | [checkout.spec.ts](tests/ui/checkout.spec.ts) |
| UI-06 | Logout і захист маршруту `/inventory.html` | [login.spec.ts](tests/ui/login.spec.ts) |
| UI-N1 | Відмова в логіні: порожній username, порожній password, невірний пароль, `locked_out_user` (4 тести) | [login.spec.ts](tests/ui/login.spec.ts) |
| UI-N2 | Чекаут без First Name / Last Name / Postal Code (3 тести) | [checkout.spec.ts](tests/ui/checkout.spec.ts) |
| UI-N3 | Замовлення з порожнім кошиком не має підтверджуватись (**BUG-001**, очікуване падіння) | [checkout.spec.ts](tests/ui/checkout.spec.ts) |

\* Ставки податку немає у вимогах: 8% і округлення до центів виведені зі спостереження ($39.98 → $3.20, $29.99 → $2.40).

### API: restful-booker (6 тестів)
Очікування взяті з офіційної документації ([api_data.json](https://restful-booker.herokuapp.com/apidoc/api_data.json)). Вона описує лише успішні відповіді (200/201) і жодного коду помилки, тому там, де документація мовчить, підставою є семантика HTTP ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)).

| ID | Сценарій | Підстава | Файл |
|---|---|---|---|
| API-01 | `POST /auth` → token → `POST /booking` (тіло = надісланому) → пошук за `firstname` знаходить бронювання → `GET` → `PUT` з токеном → `GET` (зміна збережена) → `DELETE` (201) → `GET` → 404 | Документація; 404 — RFC 9110 | [booking-flow.spec.ts](tests/api/booking-flow.spec.ts) |
| API-N1 | `PUT` і `DELETE` без токена та з невірним токеном: відмова 401/403, дані не змінились (2 тести) | Документація: потрібен токен (код не вказано, тому приймаються обидва) | [booking-negative.spec.ts](tests/api/booking-negative.spec.ts) |
| API-N2 | `POST /booking` лише з `firstname`: бронювання не створено, відповідь 4xx (**BUG-003**, очікуване падіння) | Документація: поля обовʼязкові; RFC 9110: 5xx — збій сервера | [booking-negative.spec.ts](tests/api/booking-negative.spec.ts) |
| API-N3 | `POST /auth` з невірним паролем: токен не видано, є поле `reason` | Документація (токен лише для валідних кредів); `reason` — фактична поведінка, точний текст не перевіряється | [booking-negative.spec.ts](tests/api/booking-negative.spec.ts) |
| — | `GET /ping` → 201 (health-check) | Документація | [health.spec.ts](tests/api/health.spec.ts) |

Стенд публічний і спільний, тому кожне бронювання має унікальне імʼя і видаляється після тесту, навіть якщо тест упав.

## Що свідомо не покрито

ТЗ просить основні сценарії, тому решту відкладено свідомо. Нижче те, що не перевірялось ні автотестами, ні вручну.

| Область | Що не покрито | Чому |
|---|---|---|
| UI | Мобільна та адаптивна версія | Спершу пропущено ненавмисно ([AI_WORKLOG](AI_WORKLOG.md), помилка №4), потім свідомо відкладено на користь обовʼязкових пунктів ТЗ |
| UI | Firefox, WebKit/Safari | Лише Chromium заради часу; додати браузер = додати project у [playwright.config.ts](playwright.config.ts) |
| UI | Меню: **Dynamic Catalog**, **Reset App State**, **All Items** | Поза основними сценаріями; Dynamic Catalog і Reset App State — першочергові кандидати на дослідження |
| UI | **About** | Веде на `https://saucelabs.com/` (сайт автора демо-магазину); чи відкривається в новій вкладці, не перевірялось |
| UI | Continue Shopping, Cancel, Back Home, Generate PDF order, посилання у футері | Другорядна навігація |
| UI | `problem_user`, `error_user`, `performance_glitch_user`, `visual_user` | Навмисно «зламані» користувачі демо-стенду; ТЗ вимагає `standard_user` |
| UI | Граничні дані в чекауті (пробіли, спецсимволи, довгі рядки); опис товару і `src` зображення в UI-02 | Покрито лише порожні поля; опис не має стабільного локатора |
| UI | Візуальна регресія, доступність, продуктивність | Окремі види тестування |
| API | `PATCH`, фільтри пошуку як окрема функція, `Authorization: Basic`, XML і form-urlencoded | Флоу з ТЗ покрито через `PUT`, Cookie-токен і JSON |
| API | Валідація окремих полів (типи, checkout раніше за checkin, відʼємна ціна) | Покрито лише відсутність обовʼязкових полів |
| API | JSON Schema, навантаження, термін дії токена | Поза обсягом ТЗ; обʼєкт бронювання порівнюється повністю (`toEqual`) |
| — | Бонус із ТЗ (генератор тестів через LLM) | Необовʼязковий; не виконувався, пріоритет мали обовʼязкові пункти |

## Знайдені баги

У звітах лише перевірені дані: версії зчитані з системи, роздільну здатність виставлено явно, докази зняті під час відтворення (`docs/bugs/`). **Баг** — коли система ламається або порушує те, що обіцяла (документацію, власні повідомлення, семантику HTTP для явного збою). **Спостереження** — коли поведінка незвична, але нічого обіцяного не порушено.

| ID | Заголовок | Severity | Priority | Автотест |
|---|---|---|---|---|
| [BUG-001](#bug-001) | Чекаут: замовлення з порожнім кошиком підтверджується як відправлене | Major | Medium | UI-N3 |
| [BUG-002](#bug-002) | Checkout: Overview: «Item total» порожнього замовлення показано як `$0`, а не `$0.00` | Trivial | Low | — |
| [BUG-003](#bug-003) | API: `POST /booking` без обовʼязкових полів повертає 500 замість помилки клієнта 4xx | Minor | Medium | API-N2 |

<a id="bug-001"></a>
### BUG-001: Чекаут: замовлення з порожнім кошиком підтверджується як відправлене

**Оточення:** https://www.saucedemo.com, 25.11.2026 · Google Chrome 157.0.8103.79 (вручну через Playwright MCP), Playwright Chromium 159.0.8154.6 (автотест) · Windows 11 Pro 10.0.26200 · десктоп, viewport 1280×720 · UTC+02:00

**Передумови:** залогінений `standard_user` / `secret_sauce`; кошик порожній (на іконці немає лічильника).

**Кроки відтворення**
1. Натиснути іконку кошика. Відкривається `/cart.html` без товарів.
2. Натиснути **Checkout**.
3. Заповнити First Name `John`, Last Name `Doe`, Zip/Postal Code `12345`, натиснути **Continue**.
4. На «Checkout: Overview» натиснути **Finish**.

**Очікуваний результат:** замовлення без товарів не підтверджується, сторінка «Checkout: Complete!» не відкривається.
**Підстава:** формальної вимоги немає; очікування спирається на суперечність у самому застосунку: сайт повідомляє «Your order has been dispatched» про замовлення, у якому немає жодного товару.

**Фактичний результат:** усі кроки проходять. Огляд показує порожній список і «Item total: $0», «Tax: $0.00», «Total: $0.00»; після **Finish** — «Thank you for your order!» і «Your order has been dispatched…».

**Severity:** Major: порушено бізнес-логіку оформлення замовлення. **Priority:** Medium: покупку з товарами не блокує, але дозволяє створювати порожні замовлення.

**Докази:** [кошик порожній](docs/bugs/BUG-001-1-empty-cart.png) · [огляд із $0](docs/bugs/BUG-001-2-overview-zero-total.png) · [«Thank you for your order!»](docs/bugs/BUG-001-3-order-complete.png)

**Автотест:** UI-N3 ([checkout.spec.ts](tests/ui/checkout.spec.ts)). Перевіряє лише те, що підтвердження не зʼявляється, без вимоги до способу блокування. Якщо тест раптом стане «unexpectedly passed», дивись анотацію `blocked-at`: вона показує, на якому кроці й локаторі тест зупинився, щоб відрізнити виправлений баг від битого локатора.

<a id="bug-002"></a>
### BUG-002: Checkout: Overview: «Item total» порожнього замовлення показано як `$0`, а не `$0.00`

**Оточення:** https://www.saucedemo.com, 25.11.2026 · Google Chrome 157.0.8103.79 (вручну через Playwright MCP) · Windows 11 Pro 10.0.26200 · десктоп, viewport 1280×720 · UTC+02:00

**Передумови:** залогінений `standard_user`; кошик порожній.

**Кроки відтворення**
1. Натиснути іконку кошика, потім **Checkout**.
2. Заповнити `John` / `Doe` / `12345`, натиснути **Continue**.
3. Подивитися на блок «Price Total».

**Очікуваний результат:** `Item total: $0.00`.
**Підстава:** узгодженість у межах блоку: «Tax» і «Total» на тому ж екрані показані як `$0.00`.

**Фактичний результат:** `Item total: $0`, під ним `Tax: $0.00` і `Total: $0.00`.

**Severity:** Trivial: косметика, на розрахунки не впливає. **Priority:** Low: проявляється лише на огляді порожнього замовлення, яке саме по собі є наслідком BUG-001.

**Докази:** [огляд із $0](docs/bugs/BUG-001-2-overview-zero-total.png) (той самий екран, що й крок 3 BUG-001).

**Автотест:** немає; знайдено вручну під час відтворення BUG-001.

<a id="bug-003"></a>
### BUG-003: API: `POST /booking` без обовʼязкових полів повертає 500 замість помилки клієнта 4xx

**Оточення:** https://restful-booker.herokuapp.com, 25.11.2026 · curl 8.22.0 (вручну), Playwright 1.65.1 `APIRequestContext` (автотест) · Windows 11 Pro 10.0.26200 · UTC+02:00 · браузер і роздільна здатність не застосовуються

**Передумови:** немає (`POST /booking` не потребує авторизації).

**Кроки відтворення**
1. Надіслати запит:
   ```
   POST https://restful-booker.herokuapp.com/booking
   Content-Type: application/json
   Accept: application/json

   {"firstname":"QaEvidence1795614618"}
   ```
2. Перевірити: `GET https://restful-booker.herokuapp.com/booking?firstname=QaEvidence1795614618`.

**Очікуваний результат:** статус 4xx (найімовірніше 400) з поясненням, яких полів бракує; бронювання не створюється.
**Підстава:** документація ([api_data.json](https://restful-booker.herokuapp.com/apidoc/api_data.json), CreateBooking) позначає всі поля обовʼязковими, тож запит без них — помилка клієнта. Кодів помилок документація не описує, тому статус визначено за [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110#section-15.5): 4xx — помилка в запиті, 5xx — збій сервера.

**Фактичний результат:** `HTTP/1.1 500 Internal Server Error`, тіло `Internal Server Error` без пояснення. Бронювання не створено (крок 2 повертає `[]`).

**Severity:** Minor: дані не псуються, але сервер відповідає збоєм на помилку клієнта. **Priority:** Medium: на запит без обовʼязкових полів клієнт отримує збій без пояснення і не знає, що виправити.

**Докази:** [BUG-003-missing-fields-500.txt](docs/bugs/BUG-003-missing-fields-500.txt): заголовки й тіло запиту та відповіді (`curl -v`).

**Автотест:** API-N2 ([booking-negative.spec.ts](tests/api/booking-negative.spec.ts)). Спершу перевіряє, що бронювання не створено (проходить), потім статус 4xx (падає: 500). `test.fail()` зарахує будь-яке падіння, тож у звіті варто дивитися, що впав саме крок «response is a 4xx client error».

## Спостереження

Помічено і відтворено, але без вимоги це не баг. Оточення: як у BUG-002 для OBS-01–02 і як у BUG-003 для OBS-03–06.

| ID | Що відбувається | Чому не баг | Докази |
|---|---|---|---|
| OBS-01 | Сортування «Price (low to high)» скидається на «Name (A to Z)» після «Back to products» з картки товару | Вимоги зберігати сортування немає; це UX-припущення | [до](docs/bugs/OBS-01-1-sorted-by-price.png), [після](docs/bugs/OBS-01-2-sort-reset-after-back.png) |
| OBS-02 | Запити телеметрії на `events.backtrace.io/...?universe=UNIVERSE&token=TOKEN` отримують 401 (плейсхолдери не замінено) | На функціональність не впливає | [лог консолі](docs/bugs/OBS-02-console-errors.log) |
| OBS-03 | `POST /auth` з невірним паролем: `200 OK` і `{"reason":"Bad credentials"}`, без токена | Відмова працює (API-N3); документація не обіцяє 401 | [запит/відповідь](docs/bugs/OBS-03-auth-bad-credentials-200.txt) |
| OBS-04 | `DELETE` повертає `201 Created` | Так у прикладі документації; за RFC 9110 звичніші 200/204 | [запит 1](docs/bugs/OBS-04-05-delete-201-and-repeat-405.txt) |
| OBS-05 | Повторний `DELETE` видаленого бронювання: `405`, хоча `GET` дає `404` | Не описано в документації; функціонально все гаразд | [запити 2–3](docs/bugs/OBS-04-05-delete-201-and-repeat-405.txt) |
| OBS-06 | Документація API не описує жодної помилки, а для DELETE і ping мітка «Success 200» суперечить прикладу «201 Created» | Стосується документації, не поведінки | [api_data.json](https://restful-booker.herokuapp.com/apidoc/api_data.json) |

## CI

[.github/workflows/tests.yml](.github/workflows/tests.yml) запускається на кожен `push`, на `pull_request` і вручну (`workflow_dispatch`). Два паралельні jobs, `ui tests` і `api tests`: `npm ci` → `npm run typecheck` → тести свого проєкту. Node зафіксовано на 26.

**Артефакти** (зберігаються 14 днів, завантажуються навіть після падіння):
- `playwright-report-ui`, `playwright-report-api`: HTML-звіт;
- `test-results-ui`, `test-results-api`: `junit.xml`; для неочікуваного падіння ще trace (UI — і скриншот). Для тестів на відомі баги trace не зберігається, лише `error-context.md`.

**Як відкрити звіт:** вкладка [Actions](https://github.com/Yarik0378/qa-automation-test-task/actions/workflows/tests.yml) → потрібний запуск → блок **Artifacts** → завантажити й розпакувати `playwright-report-*` → `npx playwright show-report <папка>`.

**Особливості CI** ([playwright.config.ts](playwright.config.ts)):
- `retries: 2` лише для діагностики: з `failOnFlakyTests` тест, що пройшов з повторної спроби, валить запуск. Компроміс: публічний restful-booker інколи повільний, тож CI зрідка може червоніти не через наш код, зате нестабільність не ховається.
- `forbidOnly`: забутий `test.only` валить запуск.
- Push у гілку з відкритим PR запускає workflow двічі (`push` і `pull_request`); лишено свідомо, бо ТЗ вимагає запуск на push.

Перевірені запуски: [#45630053688](https://github.com/Yarik0378/qa-automation-test-task/actions/runs/45630053688) і [#45631209217](https://github.com/Yarik0378/qa-automation-test-task/actions/runs/45631209217), обидва jobs `success`, Node 26.13.1. Вміст артефактів перевірено для першого запуску (`index.html`, `junit.xml` з `tests="17"` / `tests="6"`, `failures="0"`).

## Відповідність ТЗ

| Пункт ТЗ | Де |
|---|---|
| 1. UI: 5–7 тестів на логін, каталог, сортування, кошик, чекаут | UI-01…UI-06 (+4 варіанти сортування) — [Що покрито](#ui-saucedemocom-17-тестів) |
| 1. UI: 2–3 негативні/граничні | UI-N1, UI-N2, UI-N3 |
| 2. API: авторизація → створити → змінити → видалити → перевірити, що немає | API-01 — [Що покрито](#api-restful-booker-6-тестів) |
| 2. API: 2–3 негативні кейси | API-N1, API-N2, API-N3 |
| 3. CI: GitHub Actions, запуск на push, звіт як артефакт | [CI](#ci) |
| 4. AI_WORKLOG: інструкції агенту і ключові промпти | [CLAUDE.md](CLAUDE.md), [AI_WORKLOG.md](AI_WORKLOG.md) |
| 4. AI_WORKLOG: 3–5 помилок агента і як помічено | [AI_WORKLOG.md → Помилки агента](AI_WORKLOG.md#помилки-агента-і-як-я-їх-помітив) |
| 5. README: як запустити, що покрито і що ні | [Як запустити](#як-запустити), [Що покрито](#що-покрито), [Що свідомо не покрито](#що-свідомо-не-покрито) |
| 5. README: баги у форматі баг-репорту | [Знайдені баги](#знайдені-баги) |
| Бонус | Не виконувався (свідоме рішення) |
