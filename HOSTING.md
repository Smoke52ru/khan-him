# Платформа и хостинг

## Требования

- Боевой сайт размещается на хостинге в РФ.
- Персональные данные из заявок (имя, телефон, email) по 152-ФЗ (ст. 18, ч. 5)
  должны первично записываться в базу данных, расположенную в РФ.
- Прототип нужно показать заказчику бесплатно.

## Принцип: переносимая сборка

Сборок две, функционал один (см. `PRODUCT.md`, раздел «Две сборки»). У каждой
свой код, своя база и свой запуск. Одновременно их не поднимают.

Принцип ниже относится к текущей реализации (Next.js + Payload). Один и тот же
её код запускается и на бесплатной площадке для прототипа, и на российском VPS.
Всё, что зависит от площадки, задаётся переменными окружения:

- адрес базы данных Postgres;
- хранилище файлов: локальный диск или S3-совместимое хранилище;
- параметры SMTP для отправки писем.

```
                 один и тот же код (Next.js + Payload)
                               |
          +--------------------+--------------------+
          v                                         v
   ПРОТОТИП (бесплатно)                    ПРОД (РФ, 152-ФЗ)
   данные выдуманные,                      Docker Compose на VPS
   персональных данных нет                 Postgres в контейнере
   файлы: диск / S3                        файлы: диск или
   SMTP: ящик разработчика                   Yandex / Selectel S3
                                           SMTP: почта заказчика
```

## Текущая реализация (Next.js + Payload)

Сборка в корне репозитория. Локально и (при нужде) на VPS. **Публичный
тестовый контур сейчас — WordPress**, см. следующий раздел.

| Слой | Выбор |
|---|---|
| Приложение | Next.js со встроенной Payload CMS (админка, загрузка файлов, авторизация) |
| База данных | PostgreSQL |
| Файлы | локальный диск сервера или S3-совместимое хранилище (Yandex Object Storage, Selectel) |
| Почта | SMTP (Яндекс 360 / Mail.ru), адаптер `@payloadcms/email-nodemailer` |
| Развёртывание | Docker Compose |

Версии: Payload 3.93 (стабильная; v4 на 8 ноября 2026 ещё в бете) и Next.js
16.4. Переход на Payload 4 — отдельной задачей после релиза: например, адаптеры
хранилищ в v4 подключаются через ключ `storage`, а не `plugins`.

## Вторая реализация (WordPress) — боевой сайт

Та же витрина, заявки и админка на PHP и MySQL. Боевой сайт этой сборки
стоит на виртуальном хостинге в РФ. Код в каталоге `wordpress/`: тема
`khan-him`, плагин `khan-him`, Compose (WordPress, MariaDB, Mailpit).

**Публичный боевой сайт — эта сборка:** `https://khan-him.ru` на виртуальном
хостинге Рег.ру (`server290.hosting.reg.ru`, каталог `www/khan-him.ru`).
`https://smoke52.ru` — прежний тест, не рабочий контур. Сборка Next.js
остаётся в репозитории и локально; на VPS Selectel для показа не развёрнута.

```
   сборка Next.js                         WordPress (бой)
   Next.js + Payload                      WordPress
   Postgres, диск или S3                  MySQL, диск аккаунта
   локально / VPS (не публичный сайт)     виртуальный хостинг Рег.ру
          |                                      |
          +---- локально не запускают вместе ----+
          |                                      |
          v                                      v
   свои товары и заявки                 свои товары и заявки
```

Локальный Compose второй сборки запускают только когда текущий стек
остановлен, и наоборот. Порты те же (`3000`, `8025`, `1025`) — второй `up`
при живом первом не стартует. Остановка — `docker compose down` без `-v`,
тома с данными остаются. Обмена каталогом и заявками между Postgres и MySQL
нет.

### Локальный запуск WordPress

Сначала остановите текущий стек в корне репозитория (если он запущен):

```bash
docker compose down    # без -v — тома Postgres и uploads сохраняются
```

Затем из каталога `wordpress/`:

```bash
cp -n .env.example .env   # при первом запуске
docker compose up -d
./scripts/bootstrap.sh          # установка WP, тема, плагин, сид
./scripts/bootstrap.sh --reset  # очистить каталог и засеять заново
```

Сайт: [http://127.0.0.1:3000](http://127.0.0.1:3000)  
Админка: [http://127.0.0.1:3000/wp-admin](http://127.0.0.1:3000/wp-admin)  
Mailpit: [http://127.0.0.1:8025](http://127.0.0.1:8025)

Логин и пароль админки — `ADMIN_EMAIL` / `ADMIN_PASSWORD` из `wordpress/.env`.
Чтобы вернуться к текущей сборке: в `wordpress/` выполните
`docker compose down` (без `-v`), затем в корне — `docker compose up -d`.

Публичный боевой сайт — WordPress на `https://khan-him.ru`. Сборка Next.js
в репозитории остаётся; когда её убираем — в открытых вопросах.

**Боевой контур:** WordPress на виртуальном хостинге Рег.ру, домен
`https://khan-him.ru`. VPS Selectel и почтовый сервис Selectel для этого
сайта **не используются** (инструкции помечены OUTDATED в
[`DEPLOY.md`](./DEPLOY.md), [`DOMAIN.md`](./DOMAIN.md),
[`MAIL.md`](./MAIL.md)).

### Боевой сайт khan-him.ru

WordPress в каталоге `www/khan-him.ru` на `server290.hosting.reg.ru`
(`31.31.197.37`). `siteurl` и `home` — `https://khan-him.ru`. Тема и плагин
`khan-him` активны. Docker на хостинге не нужен.

Демо-каталог (пустые страницы, рубрики, товары и картинки, без смены
админа, реквизитов, главной и без паспортов):

```bash
KHAN_HIM_SEED_PROFILE=prod wp eval-file ~/khan-him-seed/scripts/seed.php
```

Полный сид (`KHAN_HIM_SEED_RESET`, админ, фейковые реквизиты) на этот сайт
не запускать. Почта заявок на `khan-him.ru` ещё не зафиксирована — см.
открытые вопросы. Почта прежнего теста `smoke52.ru` — [`MAIL.md`](./MAIL.md).

### WordPress на хостинге Рег.ру + smoke52.ru + почта

**Прежний тест, не рабочий контур.** Цель той выкладки: сайт WordPress
открывается как `https://smoke52.ru`, заявки уходят письмом. Docker на
хостинге не нужен: PHP, MySQL и почта — услуги Рег.ру.

```
Браузер → smoke52.ru
              │
              ▼
     виртуальный хостинг Рег.ру
     (PHP + MySQL + файлы)
              │
              │  SMTP mail.hosting.reg.ru
              ▼
     ящик noreply@smoke52.ru  →  получатель заявок
```

Домен `smoke52.ru` смотрит на хостинг Рег.ру (не на VPS Selectel).
Актуальное состояние DNS/HTTPS — [`DOMAIN.md`](./DOMAIN.md); почта —
[`MAIL.md`](./MAIL.md).

#### 1. Хостинг

1. В личном кабинете Рег.ру заказать **виртуальный хостинг** с PHP ≥ 8.2
   и MySQL (тариф с установкой WordPress удобнее).
2. В панели хостинга: **Сайты → Создать сайт** / **Добавить сайт**,
   указать `smoke52.ru`.
3. Привязать домен к хостингу
   ([справка Рег.ру](https://help.reg.ru/support/hosting/privyazka-domena-k-hostingu/kak-privyazat-domen-k-hostingu)).

Предпочтительный DNS для сайта и почты вместе: серверы хостинга
`ns1.hosting.reg.ru` и `ns2.hosting.reg.ru` — тогда A/MX/SPF для почты
Рег.ру часто поднимаются сами. Альтернатива: `ns1.reg.ru` / `ns2.reg.ru`
и вручную A на IP хостинга плюс MX/TXT почты (см. [`MAIL.md`](./MAIL.md)).

#### 2. WordPress и код Хан-Хим

**Предпочтительный сценарий демо (A):** чистый WordPress на хостинге +
zip темы и плагина + сид через WP-CLI (или каталог вручную). Дамп БД и
`uploads` с локалки не тащим.

Сборка пакета локально (нужен `zip`):

```bash
cd wordpress
./scripts/pack-release-a.sh          # → dist/release-a-ГГГГММДД-ЧЧММ/
# или по отдельности:
./scripts/pack-code.sh               # theme.zip + plugin.zip
./scripts/pack-seed.sh               # khan-him-seed.tar.gz для WP-CLI
./scripts/print-wp-config-smtp.sh    # фрагмент SMTP в stdout
```

Артефакты в `wordpress/dist/` (в git не коммитятся).

1. Установить WordPress из панели Рег.ру (или залить ядро вручную).
2. Загрузить `khan-him-theme.zip` и `khan-him-plugin.zip` через
   wp-admin (или распаковать в `wp-content/themes` / `plugins`).
3. Активировать плагин `khan-him`, затем тему `khan-him`.
4. Создать БД MySQL в панели, прописать её в `wp-config.php` (если
   установщик сам не прописал).
5. Демо-данные:
   - есть WP-CLI: распаковать `khan-him-seed.tar.gz`, выполнить
     `wp eval-file …/khan-him-seed/scripts/seed.php` (см. README в
     архиве);
   - нет CLI: набить каталог вручную в админке.
6. В настройках WordPress: адрес сайта = `https://smoke52.ru`, ЧПУ
   «название записи», HTTPS (сертификат из панели Рег.ру / Let's Encrypt).
7. Лимит загрузки PHP ≥ 20 МБ (как в локальном `uploads.ini`).

Состав переноса для сценария A: тема, плагин, при наличии CLI — пакет
сида; без Node и без Docker.

#### 3. Почта (обязательно до показа заявок)

На хостинге Рег.ру письма сайта идут через **ящик на том же домене**.
Почтовый сервис Selectel для этого контура не используем (OUTDATED;
другие SPF/DKIM и порт 1126 — см. [`MAIL.md`](./MAIL.md)).

1. Настроить почту домена на хостинге
   ([справка](https://help.reg.ru/support/hosting/nastroyka-pochty-regru/nastroyka-pochty-i-pochtovykh-kliyentovv/nastroyka-pochty-na-hostingee)):
   - при DNS `ns1.hosting.reg.ru` / `ns2.hosting.reg.ru` записи обычно
     создаются автоматически;
   - при DNS `ns1.reg.ru` / `ns2.reg.ru` вручную: MX на
     `mx1.hosting.reg.ru` / `mx2.hosting.reg.ru`, SPF
     `include:_spf.hosting.reg.ru`, A для `mail`.
2. Создать ящик, например `noreply@smoke52.ru` (логин = полный адрес).
3. В `wp-config.php` задать константы плагина (сейчас локально их
   подставляет Compose / Mailpit):

```php
define('KHAN_HIM_SMTP_HOST', 'mail.hosting.reg.ru');
define('KHAN_HIM_SMTP_PORT', 587);
define('KHAN_HIM_SMTP_USER', 'noreply@smoke52.ru');
define('KHAN_HIM_SMTP_PASS', 'пароль-ящика');
define('KHAN_HIM_SMTP_SECURE', 'tls'); // 587 → tls; 465 → ssl; локально пусто
define('KHAN_HIM_SMTP_FROM', 'Хан-Хим <noreply@smoke52.ru>');
define('KHAN_HIM_REQUESTS_FALLBACK_EMAIL', 'ваш-ящик@gmail.com');
```

На хостинге Рег.ру нет Compose-`.env`: те же значения — константами в
`wp-config.php`. Локально они приходят из `wordpress/.env` (`SMTP_*` →
`KHAN_HIM_SMTP_*`). Шифрование читает плагин из `KHAN_HIM_SMTP_SECURE`
(`tls` / `ssl` / пусто).

4. В админке WP: настройки Хан-Хим → адреса для заявок (или опереться
   на `KHAN_HIM_REQUESTS_FALLBACK_EMAIL`).
5. Проверка: тестовая заявка с сайта → письмо на ящик получателя и
   запись в «Заявках». Смотреть также «Спам».

SMTP Рег.ру для клиентов
([справка](https://help.reg.ru/support/hosting/nastroyka-pochty-regru/nastroyka-pochty-i-pochtovykh-kliyentovv/nastroyka-pochtovykh-kliyentovv)):
хост `mail.hosting.reg.ru`, порт **587** (или **465** с SSL), логин —
полный email ящика.

Не смешивать на одном домене SPF Selectel (`spf.mail.selcloud.ru`) и SPF
хостинга Рег.ру: для текущего теста только почта хостинга
([`MAIL.md`](./MAIL.md)).

#### 4. Чек-лист приёмки

1. `https://smoke52.ru` открывается с валидным сертификатом.
2. Каталог, карточка, скачивание документа, список запроса.
3. Заявка сохраняется в админке WP.
4. Письмо о заявке приходит (не только в «Заявках»).

#### 5. Порядок работ

1. ~~Фикс STARTTLS/SSL в `mail.php`~~ — сделано: `KHAN_HIM_SMTP_SECURE`.
2. Локально: `cd wordpress && ./scripts/pack-release-a.sh`.
3. Заказ/оплата хостинга Рег.ру, создание сайта `smoke52.ru`.
4. Смена DNS на хостинговые (или A+MX вручную), ожидание делегирования.
5. Установка чистого WP, HTTPS (Let's Encrypt в панели), zip темы/плагина,
   сид (CLI или руками).
6. Ящик `noreply@…`, константы SMTP в `wp-config.php` (сниппет из
   `pack-release-a` или `print-wp-config-smtp.sh`), тест заявки.
7. Документация домена/почты — актуальные разделы [`DOMAIN.md`](./DOMAIN.md)
   и [`MAIL.md`](./MAIL.md); Selectel VPS/SES помечены OUTDATED.

## Запуск

Требования: Node.js 22+ или 24+, pnpm 9+, Docker с Docker Compose.

Сначала остановите вторую сборку, если она запущена. Оба стека вместе не
поднимают.

Два Compose-файла без профилей:

| Файл | Сервисы | Когда |
|---|---|---|
| `docker-compose.yml` | app + Postgres + Mailpit | локально / демо на своей машине |
| `docker-compose.vps.yml` | app + Postgres + Caddy | VPS с доменом и HTTPS |

### Полный локальный стек (как на демо)

```bash
cp .env.example .env
# задайте PAYLOAD_SECRET (≥ 32 символов) и при желании ADMIN_*

docker compose up -d --build
docker compose exec app pnpm seed
# сайт: http://127.0.0.1:3000  Mailpit: http://127.0.0.1:8025
```

### Разработка с hot reload (`pnpm dev`)

```bash
docker compose up -d postgres mailpit   # только БД и почта
pnpm install
pnpm dev                                # http://localhost:3000  и  /admin
```

Полезные команды:

| Команда | Назначение |
|---|---|
| `pnpm build` / `pnpm start` | продакшен-сборка и запуск |
| `pnpm lint` / `pnpm typecheck` | проверка кода |
| `pnpm test:int` | модульные и интеграционные тесты (нужен Postgres) |
| `pnpm test:e2e` | Playwright (сам поднимает `pnpm dev`) |
| `pnpm email:test` | тестовое письмо → Mailpit |
| `pnpm seed` | демо-данные (админ, 6 категорий, 25 товаров) |
| `pnpm seed -- --reset` | очистить каталог и засеять заново |

После первого `pnpm seed` вход в админку: `ADMIN_EMAIL` / `ADMIN_PASSWORD` из `.env`.

Переменные окружения описаны в `.env.example`. Локально письма ловит Mailpit:
SMTP на `127.0.0.1:1025`, веб-интерфейс на [http://127.0.0.1:8025](http://127.0.0.1:8025).

## Развёртывание на VPS (сборка Next.js)

> **Не публичный сайт.** Боевой сайт — WordPress на Рег.ру
> (`https://khan-him.ru`). Ниже и в [`DEPLOY.md`](./DEPLOY.md) —
> как поднять **сборку Next.js + Payload** на VPS, если снова понадобится.

Минимальные требования: 2 ГБ ОЗУ, Docker и Docker Compose.
Домен нужен только для HTTPS; для первого теста хватает IP
(`docker-compose.vps-ip.yml`).

**Подробная инструкция (Selectel, Caddy, SMTP/Nodemailer):** [`DEPLOY.md`](./DEPLOY.md)
(не боевой сайт).
Домен `khan-him.ru`: раздел «Боевой сайт» выше. Прежний тест `smoke52.ru`:
[`DOMAIN.md`](./DOMAIN.md).
Почта прежнего теста: [`MAIL.md`](./MAIL.md) (ящик `smoke52.ru`; Selectel
SES — OUTDATED). Почта заявок на `khan-him.ru` не зафиксирована.

Кратко:

| Цель | Файл | URL |
|---|---|---|
| Тест по IP, без домена | `docker-compose.vps-ip.yml` + `Caddyfile.ip` | `http://IP/` |
| HTTPS без своего домена | `docker-compose.vps.yml` + `Caddyfile` | `https://a-b-c-d.sslip.io/` |
| Домен + HTTPS | `docker-compose.vps.yml` + `Caddyfile` | `https://домен/` |

1. Соберите образ локально или на сервере (`--build`). Для теста по IP
   удобнее `./scripts/deploy-vps-ip.sh --host ВАШ_IP` (архив образа,
   опции `--prune` / `--seed`) — см. [`DEPLOY.md`](./DEPLOY.md).
2. Скопируйте нужный compose, соответствующий Caddyfile и `.env`.
3. В `.env`: секреты, SMTP; для IP —
   `SERVER_URL=http://ВАШ_IP` (без `:3000`); для домена —
   `DOMAIN` и `SERVER_URL=https://домен`.
   `DATABASE_URL` в контейнере перезаписывается на хост `postgres`.
4. Запуск, например:
   `docker compose -f docker-compose.vps-ip.yml up -d --build`
5. Сид: `docker compose -f … exec app pnpm seed`
6. Бэкап: `pg_dump` из сервиса `postgres` + том `uploads`.

Postgres и приложение снаружи не торчат — только Caddy (порт 80 или
80+443).

Админка на VPS: нужен HTTPS (свой домен или `*.sslip.io`) либо
workaround в `Caddyfile.ip` — иначе на plain `http://IP` Payload не
принимает cookie сессии (`Sec-Fetch-Site`); подробно в [`DEPLOY.md`](./DEPLOY.md).

### Чек-лист показа заказчику

1. Открыть главную и каталог, найти товар по названию/формуле.
2. Открыть карточку, скачать документ.
3. Добавить 2 товара в запрос, указать объём, отправить заявку.
4. Показать письмо в Mailpit (или на почте) и заявку в `/admin`.
5. В админке снять товар с публикации и показать 404 по его ссылке.

## Варианты показа прототипа

| Вариант | Плюсы | Подвохи |
|---|---|---|
| Пробный грант российского облака (например, Yandex Cloud) на VPS | та же схема, что в проде, заодно проверка деплоя; без проблем открывается из РФ | нужна регистрация с картой; условия гранта надо проверить на момент регистрации |
| Vercel Hobby + Neon Free + Vercel Blob | деплой за минуты, без настройки сервера | бесплатный тариф Vercel формально только для некоммерческого использования; из российских сетей открывается нестабильно, проверять заранее с сети заказчика; хранение файлов устроено не так, как в проде |
| Локальный запуск и показ экрана на созвоне | совсем бесплатно, без рисков | заказчик не может сам потыкать админку |

**Решение:** публичный боевой сайт — **WordPress на хостинге Рег.ру**,
домен `khan-him.ru` (`https://khan-him.ru`). Локально WordPress — Compose
в `wordpress/`. Сборка Next.js поднимается локально и (при нужде) на VPS
по [`DEPLOY.md`](./DEPLOY.md) — это не публичный сайт. `smoke52.ru` —
прежний тест. Vercel не используем.

**OUTDATED:** «тестовый деплой планируется на Selectel» и показ на
`smoke52.ru` — заменены боевым WordPress на `khan-him.ru`.

## Варианты прода

| Вариант | Плюсы | Минусы |
|---|---|---|
| Российский VPS (Timeweb, Selectel, Beget) + Docker | соответствие 152-ФЗ; стабильная доступность из РФ; один сервер — понятная стоимость | нужно настроить сервер, обновления и бэкапы |
| Vercel + Supabase / Neon | деплой без настройки | данные за рубежом — нарушение 152-ФЗ; нестабильная доступность из РФ; оплата из-за рубежа |

**Площадка боевого сайта:** виртуальный хостинг Рег.ру, WordPress,
`https://khan-him.ru`. Сборка Next.js на VPS — не публичный сайт.

## Решения по инфраструктуре

- **Боевой сайт:** WordPress на виртуальном хостинге Рег.ру, домен
  **khan-him.ru** (`https://khan-him.ru`), сервер `server290.hosting.reg.ru`,
  каталог `www/khan-him.ru`. Демо-каталог — `KHAN_HIM_SEED_PROFILE=prod`
  (см. раздел «Боевой сайт khan-him.ru» выше).
- **Прежний тест:** `https://smoke52.ru` на том же типе хостинга. Сценарий
  выкладки zip темы/плагина — раздел «WordPress на хостинге Рег.ру +
  smoke52.ru»; [`DOMAIN.md`](./DOMAIN.md), [`MAIL.md`](./MAIL.md).
- **Почта прежнего теста:** ящик на `smoke52.ru` + SMTP
  `mail.hosting.reg.ru:587` (или 465), константы `KHAN_HIM_SMTP_*` в
  `wp-config.php`; `KHAN_HIM_SMTP_SECURE` = `tls` / `ssl`.
  Ящик заявок на `khan-him.ru` не выбран.
- **HTTPS боя:** Let's Encrypt в панели хостинга Рег.ру; в WP оба URL на
  `https://khan-him.ru`.
- Локально WordPress: Compose в `wordpress/` (взаимоисключающе с
  локальным Next-стеком на тех же портах).
- Развёртывание Next (код в корне): `docker-compose.yml` (локально),
  `docker-compose.vps-ip.yml`, `docker-compose.vps.yml`.
- Почта в коде Next: `@payloadcms/email-nodemailer`.
- Файлы Next по умолчанию на диске (том `uploads`); S3 — опционально
  через `S3_*` (см. `.env.example`).
- Минимальный VPS для сборки Next: 2 ГБ ОЗУ.

### OUTDATED (Selectel VPS и SES)

Сохранено для истории; для боевого сайта не применять:

- Тестовый деплой Next на Selectel VPS — [`DEPLOY.md`](./DEPLOY.md).
- Домен `smoke52.ru` A → IP Selectel, Caddy + Let's Encrypt —
  OUTDATED-часть [`DOMAIN.md`](./DOMAIN.md).
- Почтовый сервис Selectel `smtp.mail.selcloud.ru:1126` —
  OUTDATED-часть [`MAIL.md`](./MAIL.md).
- HTTPS Next на VPS: Caddy по `DOMAIN` / `*.sslip.io`; без домена —
  HTTP и workaround в `Caddyfile.ip`.

## Открытые вопросы

- Какой тариф VPS (Selectel или другой) для сборки Next, если её снова
  выложат (не меньше 2 ГБ ОЗУ)?
- Тариф виртуального хостинга Рег.ру для WordPress (PHP ≥ 8.2, MySQL) —
  зафиксировать выбранный.
- С какого ящика на `khan-him.ru` уходят письма о заявках?
- Кто отвечает за бэкапы базы и файлов и как часто их делать?
- Когда заканчиваем параллельную работу и убираем сборку Next.js?
