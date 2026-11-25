# QA Automation: тестове завдання (Middle)

UI-тести [saucedemo.com](https://www.saucedemo.com) і API-тести [restful-booker](https://restful-booker.herokuapp.com/apidoc) на **Playwright + TypeScript**, з CI на GitHub Actions.

> 🚧 Робота триває. Розділи нижче заповнюються поетапно.

## Зміст
- [Стек](#стек)
- [Як запустити](#як-запустити)
- [Що покрито](#що-покрито)
- [Що свідомо не покрито](#що-свідомо-не-покрито)
- [Знайдені баги](#знайдені-баги)
- [CI](#ci)
- [Робота з ШІ-агентом](#робота-з-ші-агентом)

## Стек
- [Playwright Test](https://playwright.dev) 1.65, лише Chromium
- TypeScript 7 (strict), перевірка типів через `tsc` без emit
- Node.js ≥ 20
- GitHub Actions

Тест-план: [docs/TEST_PLAN.md](docs/TEST_PLAN.md).

## Як запустити
_TBD_

## Що покрито

Локатори взяті з живого сайту через Playwright MCP (див. [CLAUDE.md](CLAUDE.md)). Тести на відомі баги позначені `test.fail()`: у звіті вони мають статус «expected to fail», а коли баг полагодять, тест почне падати.

### UI: saucedemo.com (`tests/ui`, 18 тестів)
| ID | Сценарій | Файл |
|---|---|---|
| UI-01 | Логін `standard_user`: URL, заголовок «Products», 6 товарів | [login.spec.ts](tests/ui/login.spec.ts) |
| UI-02 | Картка товару: зображення, назва і ціна збігаються зі списком; «Back to products» | [catalog.spec.ts](tests/ui/catalog.spec.ts) |
| UI-03 | Сортування: A→Z, Z→A, ціна ↑, ціна ↓ (4 тести) | [sorting.spec.ts](tests/ui/sorting.spec.ts) |
| UI-04 | Кошик: додати 2 товари, прибрати 1; бейдж, кнопки Add↔Remove, вміст `/cart.html` | [cart.spec.ts](tests/ui/cart.spec.ts) |
| UI-05 | E2E-чекаут 2 товарів: Item total, податок 8%, Total, «Thank you for your order!», кошик порожній | [checkout.spec.ts](tests/ui/checkout.spec.ts) |
| UI-06 | Logout і захист маршруту `/inventory.html` | [login.spec.ts](tests/ui/login.spec.ts) |
| UI-07 | Сортування зберігається після повернення з картки товару (**BUG-02**, expected fail) | [sorting.spec.ts](tests/ui/sorting.spec.ts) |
| UI-N1 | Відмова в логіні: порожній username, порожній password, невірний пароль, `locked_out_user` (4 тести) | [login.spec.ts](tests/ui/login.spec.ts) |
| UI-N2 | Чекаут без First Name / Last Name / Postal Code (3 тести) | [checkout.spec.ts](tests/ui/checkout.spec.ts) |
| UI-N3 | Чекаут недоступний з порожнім кошиком (**BUG-01**, expected fail) | [checkout.spec.ts](tests/ui/checkout.spec.ts) |

## Що свідомо не покрито
_TBD_

## Знайдені баги

Оточення для всіх UI-багів: https://www.saucedemo.com, Chromium (Playwright 1.65) і Google Chrome, Windows 11, користувач `standard_user`, 25.11.2026.

### BUG-01: замовлення з порожнім кошиком успішно оформлюється
**Severity:** Medium · **Priority:** High · **Автотест:** UI-N3

**Кроки:**
1. Залогінитись як `standard_user`, нічого не додавати в кошик.
2. Відкрити кошик (іконка кошика) і натиснути **Checkout**.
3. Заповнити First Name, Last Name, Zip і натиснути **Continue**.
4. Натиснути **Finish**.

**Очікуваний результат:** з порожнім кошиком чекаут недоступний: кнопка Checkout неактивна або показується повідомлення «Your cart is empty».
**Фактичний результат:** кнопка Checkout активна. Огляд показує «Item total: $0», «Total: $0.00», а після Finish зʼявляється «Thank you for your order!», тобто оформлено порожнє замовлення.

### BUG-02: сортування скидається після повернення з картки товару
**Severity:** Low · **Priority:** Medium · **Автотест:** UI-07

**Кроки:**
1. Залогінитись як `standard_user`.
2. У списку товарів обрати сортування **Price (low to high)**.
3. Відкрити будь-який товар (клік по назві).
4. Натиснути **Back to products**.

**Очікуваний результат:** список лишається відсортованим за ціною, у dropdown обрано «Price (low to high)».
**Фактичний результат:** сортування скидається на «Name (A to Z)», і користувачу доводиться обирати його знову.

### BUG-03: суму «Item total» на огляді порожнього замовлення показано без копійок
**Severity:** Trivial · **Priority:** Low · **Автотест:** немає (знайдено вручну в сценарії BUG-01)

**Кроки:** кроки 1–3 з BUG-01.

**Очікуваний результат:** усі суми в одному форматі: «Item total: $0.00».
**Фактичний результат:** «Item total: $0», а поруч «Tax: $0.00» і «Total: $0.00».

### Спостереження: помилки 401 від телеметрії в консолі
На кожній сторінці браузер надсилає події на `https://events.backtrace.io/api/.../submit?universe=UNIVERSE&token=TOKEN` і отримує **401 Unauthorized**: у конфігурації телеметрії лишилися незамінені плейсхолдери. На функціональність не впливає, але засмічує консоль і означає, що звіти про помилки фронтенду нікуди не доходять.

## CI
_TBD_

## Робота з ШІ-агентом
Див. [AI_WORKLOG.md](AI_WORKLOG.md) та інструкції агенту в [CLAUDE.md](CLAUDE.md).
