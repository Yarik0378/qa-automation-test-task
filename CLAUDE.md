# CLAUDE.md

Інструкції для ШІ-агента, який працює в цьому репозиторії.

## Проєкт
Тестове завдання QA Automation (Middle): UI-тести [saucedemo.com](https://www.saucedemo.com) і API-тести [restful-booker](https://restful-booker.herokuapp.com/apidoc) на Playwright + TypeScript, CI на GitHub Actions.
План і тест-кейси: [docs/TEST_PLAN.md](docs/TEST_PLAN.md). Тест-кейси мають ID (`UI-01`, `UI-N1`, `API-01`, `API-N1`), і вони ж стоять у назвах тестів.

## Команди
```bash
npm ci                          # встановити залежності
npx playwright install chromium # браузер для UI-тестів
npm run typecheck               # tsc, без emit
npm test                        # усі тести
npm run test:ui                 # лише saucedemo
npm run test:api                # лише restful-booker
npx playwright test -g "UI-03"  # один тест за ID
npm run report                  # відкрити HTML-звіт
```
Playwright MCP підключається автоматично з [.mcp.json](.mcp.json) після `npm ci`. Сервер стоїть у devDependencies, тож його версія зафіксована в lock-файлі.

## Структура
```
tests/ui/      специфікації saucedemo (проєкт `ui`)
tests/api/     специфікації restful-booker (проєкт `api`)
pages/         Page Object для saucedemo
api/           BookingClient: обгортка над APIRequestContext
fixtures/      розширений `test` з фікстурами POM і клієнта
test-data/     користувачі, фабрики тестових даних
docs/          тест-план
```
Тести імпортують `test` і `expect` з `fixtures/`, а не напряму з `@playwright/test` (виняток лише smoke-тести каркасу).

## Конвенції

**Дослідження сторінки через Playwright MCP (обовʼязково для UI)**
- Перед тим як писати чи змінювати UI-тест або Page Object, пройди сценарій на живому сайті через Playwright MCP (сервер `playwright` з [.mcp.json](.mcp.json)): `browser_navigate` → дії користувача (`browser_click`, `browser_type`, `browser_fill_form`, `browser_select_option`) → `browser_snapshot`.
- Локатори бери з accessibility snapshot і з коду, який MCP генерує для кожної дії. MCP запущений з `--test-id-attribute data-test`, тому його локатори збігаються з `getByTestId()` у тестах.
- Стани, що зʼявляються лише після дій (помилки валідації, бейдж кошика, кроки чекауту, редиректи), теж перевіряй через MCP, а не припускай.
- **Заборонено:** писати локатори з памʼяті чи загальних знань про сайт, а також витягати сирий HTML (`curl`, WebFetch, `page.content()`) і шукати в ньому `data-test="..."`.
- Якщо MCP недоступний, зупинись і скажи про це людині. Не переходь на вгадування.

**Локатори (UI)**
- Пріоритет: `getByTestId()` (у конфігу `testIdAttribute: 'data-test'`), потім `getByRole()`, потім текст. CSS і XPath лише якщо нічого іншого немає, з коментарем чому.
- Локатори живуть у Page Object, не в спеках.

**Page Object**
- Методи описують дії користувача (`login(user)`, `addToCart(name)`), повертають дані або нічого.
- Assert-и пишемо в спеках. Виняток: метод-очікування стану на кшталт `expectLoaded()`.

**Очікування**
- Жодних `page.waitForTimeout()` і `sleep`. Лише web-first assertions (`await expect(locator).toHaveText(...)`) і авто-очікування Playwright.

**Незалежність тестів**
- Кожен тест сам готує свій стан: логін через фікстуру, власне бронювання через API.
- restful-booker публічний і спільний, тож дані генеруються з унікальними значеннями. Чужі бронювання не чіпаємо й не покладаємось на їхню кількість.
- `test.describe.serial` лише для API-флоу, де кроки свідомо залежать один від одного.

**Знайдені баги**
- Тест **не підганяють** під баг. Assert перевіряє очікувану поведінку, а на початку тесту викликається хелпер з `fixtures/test.ts`, який додає анотацію `bug` і `test.fail()`:
  ```ts
  knownBug('BUG-01', 'order with an empty cart can be completed');
  ```
- Перевір, що тест на баг падає саме на потрібному assert-і, а не через биту локацію чи таймаут.
- Кожен баг описаний у README (розділ «Знайдені баги») з тим самим ID.
- Якщо поведінка неочевидна, спершу перевір вручну (браузер / `curl`) і лише потім вирішуй, баг це чи помилка тесту.

**Стиль коду**
- TypeScript strict; без `any` і без `// @ts-ignore`.
- Назва тесту: `ID: що перевіряємо`, наприклад `UI-03: sorts products by price low to high`.
- Великі сценарії ділимо на `test.step()`, щоб звіт читався.
- Коментарі англійською і лише там, де «чому» не очевидне з коду.

## Git
- Коміти дрібні, у `main`, з префіксами `chore:`, `test(ui):`, `test(api):`, `ci:`, `docs:`.
- Не комітити `node_modules`, звіти, `.env`.

## Definition of Done для зміни
1. `npm run typecheck` без помилок.
2. Зачеплені тести зелені локально; тести на відомі баги дають expected fail.
3. Нові тест-кейси додані в README (розділ «Що покрито»), нові баги в «Знайдені баги».

## Процес
Робота йде поетапно за тест-планом. Після кожного етапу агент зупиняється і чекає review від людини. Кожна правка людини, яка виправляє помилку агента, записується в таблицю помилок в [AI_WORKLOG.md](AI_WORKLOG.md).
