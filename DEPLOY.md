# Деплой на VPS (Selectel)

> **OUTDATED для тестового контура.** Публичный тест сейчас — WordPress
> на хостинге Рег.ру (`https://smoke52.ru`), см. [`HOSTING.md`](./HOSTING.md),
> [`DOMAIN.md`](./DOMAIN.md), [`MAIL.md`](./MAIL.md).
> Этот файл сохранён как инструкция по деплою **сборки Next.js + Payload**
> на VPS (Selectel / аналог) и не описывает актуальный показ заказчику.

Пошаговая инструкция деплоя сборки Next.js + Payload
на облачный сервер Selectel. Стек на сервере:

```
Интернет → Caddy → app (:3000, Next.js + Payload)
                      ↓
                   Postgres
```

Письма о заявках уходят через SMTP (Nodemailer внутри Payload).
Подробно про Caddy и почту — в разделах ниже; можно читать их до
практических шагов.

Минимальные требования к серверу: **2 ГБ ОЗУ**, 1 vCPU, 20 ГБ диска,
Ubuntu 22.04/24.04. Публичный IPv4.

Краткий обзор инфраструктуры: [`HOSTING.md`](./HOSTING.md).
Домен `smoke52.ru` (актуально — хостинг Рег.ру; VPS — OUTDATED):
[`DOMAIN.md`](./DOMAIN.md).
Почта (актуально — Рег.ру; Selectel SES — OUTDATED): [`MAIL.md`](./MAIL.md).

## Домен обязателен? Нет — для первого теста хватит IP

Let's Encrypt **не выдаёт** нормальный HTTPS-сертификат на голый IP.
Поэтому без домена сайт будет по **HTTP** (без «замочка»). Для показа
прототипа заказчику этого обычно достаточно.

| Режим | Compose | Caddy | URL | Когда |
|---|---|---|---|---|
| Только IP | `docker-compose.vps-ip.yml` | `Caddyfile.ip` (порт 80) | `http://ВАШ_IP/` | быстрый показ без HTTPS |
| sslip.io + HTTPS | `docker-compose.vps.yml` | `Caddyfile` (80+443) | `https://IP-с-дефисами.sslip.io/` | демо с админкой без своего домена |
| Свой домен + HTTPS | `docker-compose.vps.yml` | `Caddyfile` (80+443) | `https://домен/` | демо «как в бою», прод |

### Почему plain `http://IP` ломает сессию админки

Payload `extractJWT` принимает cookie сессии только если есть
`Origin` из CSRF-списка, пустой CSRF (у нас никогда — в список всегда
попадает `serverURL`) или заголовок `Sec-Fetch-Site` со значением
`same-origin` / `same-site` / `none`. Браузеры шлют `Sec-Fetch-Site`
только на HTTPS и localhost, **не** на `http://IP`. На навигации и
same-origin GET нет и `Origin`. Итог: логин ставит `payload-token`,
но следующий запрос к `/admin` или `/api/users/me` выглядит анонимным.

Обход для демо по IP: в `Caddyfile.ip` при отсутствии `Sec-Fetch-Site`
подставляется `same-origin` (только демо, не для прода). Надёжный путь —
HTTPS (свой домен или sslip.io, см. ниже).

Ограничения режима по IP (HTTP):

- нет HTTPS — браузер может помечать страницу как «не защищено»;
  для формы с телефоном/email на тесте приемлемо, для прода — нет;
- без workaround в `Caddyfile.ip` админка не держит сессию (см. выше);
- в письмах ссылки будут вида `http://IP/...` — задайте
  `SERVER_URL=http://ВАШ_IP`.

Когда появится домен: пропишите DNS A → IP, переключитесь на
`docker-compose.vps.yml`, в `.env` добавьте `DOMAIN` и
`SERVER_URL=https://...`, перезапустите стек. Том Postgres
и `uploads` те же имена — данные сохранятся, если не трогать volumes
(`down` без `-v`).

Дальше в инструкции пути: **[IP]**, **[sslip.io]** и **[домен]**.

---

## 0. Что понадобится заранее

| Что | Зачем |
|---|---|
| Аккаунт Selectel | создать VPS |
| Публичный IPv4 | открыть сайт |
| Домен или поддомен | **только для режима HTTPS**; для IP не нужен |
| Почтовый ящик с SMTP | отправка писем о заявках (Яндекс 360, Mail.ru и т.п.) |
| SSH-ключ | вход на сервер без пароля |
| Репозиторий на машине с Docker **или** на самом VPS | сборка образа |

Для теста можно взять свой SMTP-ящик (`noreply@...`). Реальную почту
заказчика и домен подключите позже.

---

## 1. Создать сервер в Selectel

1. В панели Selectel: **Облачная платформа → Серверы → Создать сервер**.
2. Регион в РФ (например, Москва / Санкт-Петербург) — важно для 152-ФЗ.
3. Образ: **Ubuntu 24.04** (или 22.04).
4. Конфигурация: от **2 ГБ RAM**, 1–2 vCPU, диск ≥ 20 ГБ.
5. Сеть: внешний IP (публичный IPv4). Запомните адрес.
6. Доступ: добавьте свой SSH-ключ; логин обычно `root` или `ubuntu`
   (смотрите подсказку в панели).
7. После создания откройте **файрвол / группы безопасности** и разрешите
   входящие:

   | Порт | Протокол | Режим | Зачем |
   |---|---|---|---|
   | 22 | TCP | оба | SSH |
   | 80 | TCP | оба | HTTP (сайт по IP; при домене — ещё и ACME/редирект) |
   | 443 | TCP | только домен | HTTPS |

   Postgres (5432) и приложение (3000) **снаружи открывать не нужно** —
   они доступны только внутри Docker-сети.

Проверка входа:

```bash
ssh root@ВАШ_IP
# или: ssh ubuntu@ВАШ_IP
```

---

## 2. Подготовить сервер

На VPS:

```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
# если заходите не под root:
# usermod -aG docker "$USER"  &&  затем перелогиньтесь

docker --version
docker compose version
```

Создайте каталог проекта:

```bash
mkdir -p /opt/khan-him
cd /opt/khan-him
```

Дальше сюда попадут: `docker-compose.vps.yml`, `Caddyfile`, `.env`
и (если собираете на сервере) исходники или уже готовый образ.

---

## 3. DNS

> **OUTDATED для теста:** домен **smoke52.ru** больше не на этом VPS —
> он на хостинге Рег.ру (WordPress). Ниже — общая схема DNS для деплоя
> Next на VPS с любым именем; исторически для `smoke52.ru` см. OUTDATED
> в [`DOMAIN.md`](./DOMAIN.md).

**[IP]** — этот шаг пропустите. Сайт будет открываться как `http://ВАШ_IP/`.

**[sslip.io]** — свой DNS не нужен. Имя вида
`176-53-226-13.sslip.io` само резолвится в `176.53.226.13`
(точки в IP → дефисы). Проверка:

```bash
dig +short 176-53-226-13.sslip.io
# должен показать 176.53.226.13
```

**[домен]** — в панели регистратора создайте **A-запись**:

```
demo.example.ru.   A   ВАШ_IP_SELECTEL
```

Подождите, пока запись начнёт резолвиться (минуты–часы):

```bash
dig +short demo.example.ru
# должен показать IP сервера
```

Без корректного DNS (или sslip.io) Caddy **не сможет** получить
TLS-сертификат Let's Encrypt для HTTPS-режима.

---

## 4. Файлы на сервере

**[IP]** — скопируйте:

```bash
scp docker-compose.vps-ip.yml Caddyfile.ip root@ВАШ_IP:/opt/khan-him/
```

**[домен]** — скопируйте:

```bash
scp docker-compose.vps.yml Caddyfile root@ВАШ_IP:/opt/khan-him/
```

Если клонируете репозиторий целиком на VPS (`git clone`), оба набора
файлов уже будут на месте.

### Вариант A — собрать образ на VPS (проще для первого раза)

```bash
# на своей машине
git push   # если ещё не запушено

# на VPS
cd /opt/khan-him
git clone <URL_РЕПОЗИТОРИЯ> src
cd src
# нужен Dockerfile и исходники; compose лежит уровнем выше или здесь же
```

Удобнее держать всё в `/opt/khan-him` как корень репо:

```bash
cd /opt
git clone <URL_РЕПОЗИТОРИЯ> khan-him
cd khan-him
```

Тогда `docker-compose.vps.yml` и `Caddyfile` уже на месте.

### Вариант B — собрать образ локально и загрузить

Для **тестового** стека по IP есть скрипт (сборка → `docker save` →
`scp` → `load` → `up` без `--build` на сервере):

```bash
# на своей машине, из корня репо; на VPS уже есть /opt/khan-him/.env
./scripts/deploy-vps-ip.sh --host ВАШ_IP
./scripts/deploy-vps-ip.sh --host ВАШ_IP --prune   # почистить builder/unused images
./scripts/deploy-vps-ip.sh --host ВАШ_IP --seed    # после up: pnpm seed
./scripts/deploy-vps-ip.sh --host ВАШ_IP --prune --seed
```

Скрипт заливает `docker-compose.vps-ip.yml` и `Caddyfile.ip`, **не**
трогает `.env`. По умолчанию `docker build --platform linux/amd64`.
`--prune` не удаляет volumes (`db-data`, `uploads`). Перед сборкой и
после `up` выставляет `a+r` на `pnpm-workspace.yaml` и соседние конфиги
(иначе в образе остаются `0600`, и `pnpm seed` от пользователя `nextjs`
падает с Permission denied).

Вручную то же самое:

```bash
# локально
docker build --platform linux/amd64 -t khan-him:latest .
docker save khan-him:latest | gzip > khan-him.tar.gz
scp khan-him.tar.gz root@ВАШ_IP:/opt/khan-him/

# на VPS
cd /opt/khan-him
gunzip -c khan-him.tar.gz | docker load
rm -f khan-him.tar.gz
docker compose -f docker-compose.vps-ip.yml up -d --force-recreate app caddy
# без --build
```

На сервере всё равно нужны compose, Caddyfile и `.env`. Строка
`build: .` в compose не мешает: без `--build` берётся уже загруженный
`image: khan-him:latest`.

---

## 5. Файл `.env` на VPS

```bash
cd /opt/khan-him
cp .env.example .env
nano .env   # или vim
```

### Пример **[IP]** (без домена)

```bash
DATABASE_URL=postgresql://khan:СИЛЬНЫЙ_ПАРОЛЬ_БД@postgres:5432/khan_him
POSTGRES_PASSWORD=СИЛЬНЫЙ_ПАРОЛЬ_БД
PAYLOAD_SECRET=длинная-случайная-строка-не-меньше-32-символов

# без DOMAIN
SERVER_URL=http://203.0.113.10

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=сильный-пароль-админки

SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_USER=noreply@yandex.ru
SMTP_PASS=пароль-приложения
SMTP_FROM="Хан-Хим <noreply@yandex.ru>"
REQUESTS_FALLBACK_EMAIL=вы@example.com
```

Подставьте реальный IP Selectel вместо `203.0.113.10`. Порт в URL
не указывайте — Caddy слушает стандартный 80.

### Пример **[sslip.io]** (HTTPS без своего домена)

Для сервера `176.53.226.13`:

```bash
DATABASE_URL=postgresql://khan:СИЛЬНЫЙ_ПАРОЛЬ_БД@postgres:5432/khan_him
POSTGRES_PASSWORD=СИЛЬНЫЙ_ПАРОЛЬ_БД
PAYLOAD_SECRET=длинная-случайная-строка-не-меньше-32-символов

DOMAIN=176-53-226-13.sslip.io
SERVER_URL=https://176-53-226-13.sslip.io

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=сильный-пароль-админки

SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_USER=noreply@yandex.ru
SMTP_PASS=пароль-приложения
SMTP_FROM="Хан-Хим <noreply@yandex.ru>"
REQUESTS_FALLBACK_EMAIL=вы@example.com
```

Подставьте свой IP в том же формате: `a.b.c.d` → `a-b-c-d.sslip.io`.

### Пример **[домен]** (HTTPS)

```bash
DATABASE_URL=postgresql://khan:СИЛЬНЫЙ_ПАРОЛЬ_БД@postgres:5432/khan_him
POSTGRES_PASSWORD=СИЛЬНЫЙ_ПАРОЛЬ_БД
PAYLOAD_SECRET=длинная-случайная-строка-не-меньше-32-символов

DOMAIN=smoke52.ru
SERVER_URL=https://smoke52.ru

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=сильный-пароль-админки

# почта теста — почтовый сервис Selectel, подробно в MAIL.md
SMTP_HOST=smtp.mail.selcloud.ru
SMTP_PORT=1126
SMTP_USER=логин-с-вкладки-Информация
SMTP_PASS=пароль-с-вкладки-Информация
SMTP_FROM="Хан-Хим <noreply@smoke52.ru>"
REQUESTS_FALLBACK_EMAIL=вы@example.com
```

Важно:

- **[IP]** — обязателен `SERVER_URL=http://ВАШ_IP`; `DOMAIN` не нужен.
- **[sslip.io]** / **[домен]** — обязательны и `DOMAIN`, и
  `SERVER_URL=https://...`. Без `DOMAIN` compose с HTTPS
  упадёт на старте.
- `SERVER_URL` должен совпадать с тем, что люди вбивают в
  браузере (ссылки в письмах на админку строятся из него).
  **Без** `:3000`: снаружи слушает Caddy на 80/443, не сам Node.
  Неверно: `http://176.x.x.x:3000` — логин в `/admin` «проходит» и сразу
  выкидывает обратно (CSRF/cookie). Верно: `http://176.x.x.x`.
  После правки `.env`: `docker compose -f … up -d --force-recreate app`,
  не `docker restart`.
- `POSTGRES_PASSWORD` задаётся **до первого** `up`: пароль пишется в том
  Postgres при инициализации. Смена пароля в `.env` на уже живом томе
  сама по себе базу не перенастроит.
- Не коммитьте `.env` в git.

Сгенерировать секрет:

```bash
openssl rand -hex 32
```

---

## 6. Запуск

**[IP]:**

```bash
cd /opt/khan-him
docker compose -f docker-compose.vps-ip.yml up -d --build
docker compose -f docker-compose.vps-ip.yml ps
docker compose -f docker-compose.vps-ip.yml logs -f caddy
```

Сайт: `http://ВАШ_IP/`  
Админка: `http://ВАШ_IP/admin`  
(сессия админки держится за счёт workaround в `Caddyfile.ip`; предпочтительнее HTTPS.)

**[sslip.io]** — переключение с IP-стека без потери данных:

1. Откройте порт **443** в файрволе / security group (сейчас часто закрыт).
2. В `.env` задайте `DOMAIN` и `SERVER_URL=https://...`
   (см. пример выше).
3. Остановите IP-стек **без** `-v` (тома Postgres и uploads сохраняются):

```bash
cd /opt/khan-him
docker compose -f docker-compose.vps-ip.yml down
```

4. Поднимите доменный стек (тот же project name и имена томов):

```bash
docker compose -f docker-compose.vps.yml up -d --build
docker compose -f docker-compose.vps.yml ps
docker compose -f docker-compose.vps.yml logs -f caddy
```

Сайт: `https://176-53-226-13.sslip.io/`  
Админка: `https://176-53-226-13.sslip.io/admin`

**[домен]:**

```bash
cd /opt/khan-him
docker compose -f docker-compose.vps.yml up -d --build
docker compose -f docker-compose.vps.yml ps
docker compose -f docker-compose.vps.yml logs -f caddy
```

Сайт: `https://smoke52.ru/`  
Админка: `https://smoke52.ru/admin`

Первая сборка после смены Dockerfile (кеш `node_modules` из `deps`,
cache mounts) — полная и долгая; следующие code-only rebuilds заметно
короче.

Что происходит при старте `app`:

1. Ждёт healthy Postgres.
2. `docker-entrypoint.sh` гоняет `payload migrate`.
3. Запускает `node server.js` (Next.js standalone) на порту 3000
   **внутри** сети compose (снаружи не опубликован).

Сид демо-данных (один раз; подставьте свой `-f`):

```bash
docker compose -f docker-compose.vps-ip.yml exec app pnpm seed
# или: docker compose -f docker-compose.vps.yml exec app pnpm seed
```

Логин/пароль админки — `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## 7. Caddy — что это и как у нас устроено

### Зачем он нужен

Браузер пользователя говорит на **HTTPS** (порт 443) и иногда заходит
по **HTTP** (порт 80). Наше приложение слушает только обычный HTTP на
порту **3000** внутри Docker и **не умеет** само:

- принимать трафик на 80/443;
- выпускать и обновлять TLS-сертификаты;
- отдавать сайт по доменному имени с «замочком».

**Caddy** — веб-сервер / reverse proxy. Он стоит «перед» приложением:

```
Клиент                    Docker-сеть
------                    -----------
https://demo.example.ru
        │
        ▼
   [ Caddy :443 ]
   · проверяет TLS-сертификат
   · расшифровывает HTTPS
   · проксирует HTTP дальше
        │
        ▼
   [ app :3000 ]  ← Next.js + Payload, как будто к нему сходили по HTTP
```

Аналоги по роли: Nginx, Traefik. В доменном режиме Caddy ещё и **сам**
получает сертификат Let's Encrypt — в конфиге почти ничего не надо
писать про SSL. В режиме по IP сертификат не нужен: только прокси на :80.

### `Caddyfile.ip` — режим без домена

```
:80 {
	@noFetchSite header !Sec-Fetch-Site
	request_header @noFetchSite Sec-Fetch-Site same-origin
	reverse_proxy app:3000
}
```

| Фрагмент | Смысл |
|---|---|
| `:80` | Слушать все запросы на порт 80, без привязки к имени хоста. Подойдёт заход по IP. |
| `@noFetchSite` + `request_header` | Demo-only: если браузер не прислал `Sec-Fetch-Site` (типично для `http://IP`), подставить `same-origin`, иначе Payload отбросит cookie сессии. |
| `reverse_proxy app:3000` | Отдать запрос контейнеру `app`. |

HTTPS и Let's Encrypt здесь **нет** — браузер откроет `http://IP/`.
Для нормальной админки предпочтительнее sslip.io или свой домен.

### `Caddyfile` — режим с доменом и HTTPS

```
{$DOMAIN:localhost} {
	reverse_proxy app:3000
}
```

| Фрагмент | Смысл |
|---|---|
| `{$DOMAIN:localhost}` | Имя сайта = `DOMAIN` из окружения (на VPS обязательно). |
| `{ ... }` | Блок сайта для этого имени. |
| `reverse_proxy app:3000` | Прокси на приложение. |

Чего в доменном файле **нет**, но Caddy делает сам:

- слушает 80 и 443;
- на 80 отвечает challenge Let's Encrypt и редиректит на HTTPS;
- запрашивает сертификат для `DOMAIN`;
- хранит его в томе `caddy-data` и обновляет до истечения.

### Как Caddy связан с compose

В `docker-compose.vps-ip.yml` проброшен только порт **80**, монтируется
`Caddyfile.ip`, переменная `DOMAIN` не нужна.

В `docker-compose.vps.yml` — порты **80 и 443**, `Caddyfile`, и

```yaml
DOMAIN: ${DOMAIN:?Set DOMAIN in .env}
```

— без `DOMAIN` `up` сразу падает.

В обоих случаях `app` только `expose: 3000` (снаружи не виден).

### Типичные проблемы Caddy

| Симптом | Что проверить |
|---|---|
| По IP ничего не открывается | файрвол: порт 80; `logs caddy` / `logs app`; `SERVER_URL=http://IP` |
| `/admin` логин не держит сессию | 1) убрать `:3000` из `SERVER_URL`, `up -d --force-recreate app`; 2) на plain `http://IP` без свежего `Caddyfile.ip` (Sec-Fetch-Site fallback) Payload отбрасывает cookie — перейти на HTTPS (`sslip.io` / домен) или обновить `Caddyfile.ip` и перезапустить caddy; 3) `curl` login → `/api/users/me` без `Origin` должен вернуть user |
| Вход в `/admin` работает, но любое сохранение — «У вас нет права на выполнение этого действия» | На POST/PATCH браузер шлёт `Origin`, и Payload пускает cookie, только если `Origin` есть в CSRF-списке из `SERVER_URL`. Проверьте `exec app printenv SERVER_URL` (должен быть ровно `http://IP` или `https://домен`). Старые образы читали `NEXT_PUBLIC_SERVER_URL`, который Next.js вшивает при сборке (часто `http://localhost:3000`) — нужен `git pull` и `up -d --build` |
| HTTPS / sslip.io не открывается | файрвол: порт **443**; `DOMAIN` и `SERVER_URL=https://...`; стек `docker-compose.vps.yml`, не `vps-ip` |
| В логах TLS / ACME ошибки (доменный режим) | DNS ещё не на IP (для sslip.io — `dig +short …sslip.io`); закрыты 80/443; занят порт |
| `connection refused` от proxy | контейнер `app` не запущен |
| «Чужой» сертификат / предупреждение | `DOMAIN` ≠ то, что в адресной строке |
| Работает по IP, но не по домену | A-запись или кеш DNS; либо вы всё ещё на `vps-ip` compose |

Логи:

```bash
docker compose -f docker-compose.vps.yml logs -f caddy
```

Перечитать конфиг после правки `Caddyfile`:

```bash
docker compose -f docker-compose.vps.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
# или проще:
docker compose -f docker-compose.vps.yml up -d caddy
```

### Чего Caddy у нас не делает

- Не раздаёт статику сам (это делает Next.js).
- Не аутентифицирует пользователей (это Payload `/admin`).
- Не принимает почту и не связан с Nodemailer.

---

## 8. Nodemailer и SMTP — что это и как у нас устроено

### Зачем это нужно

Когда посетитель отправляет заявку, в базу пишется запись в коллекции
`requests`, и менеджер должен получить письмо. Приложение **не является**
почтовым сервером: оно только **подключается** к чужому SMTP
и просит: «отправь это письмо».

На тестовом контуре SMTP — почтовый сервис Selectel, отправитель
`noreply@smoke52.ru`. Пошагово: [`MAIL.md`](./MAIL.md). Примеры Яндекса
и Mail.ru ниже — запасной вариант, не текущая схема теста.

Цепочка:

```
Форма на сайте
    → Payload создаёт Request
    → afterChange вызывает sendRequestEmail()
    → payload.sendEmail(...)
    → адаптер @payloadcms/email-nodemailer
    → библиотека Nodemailer
    → TCP к SMTP_HOST:SMTP_PORT
    → почтовый провайдер доставляет письмо получателям
```

**Nodemailer** — популярная Node.js-библиотека для отправки почты по SMTP.
Мы её почти не вызываем напрямую: Payload подключает готовый адаптер
`@payloadcms/email-nodemailer`, а настройки берутся из переменных
окружения в `src/lib/email.ts`.

### SMTP простыми словами

SMTP — протокол «отправь письмо». Как отправка посылки через службу
доставки:

| Понятие | Аналогия | У нас |
|---|---|---|
| SMTP-сервер | сортировочный центр | `smtp.yandex.ru` |
| Порт | конкретное окно сдачи | `587` (STARTTLS) или `465` (SMTPS) |
| Логин/пароль | договор с службой | `SMTP_USER` / `SMTP_PASS` |
| From | «от кого» на конверте | `SMTP_FROM` |
| To | адрес получателя | список из админки или `REQUESTS_FALLBACK_EMAIL` |

Локально вместо Яндекса стоит **Mailpit** — учебный ящик, который
принимает любые письма и показывает их в браузере (`:8025`), наружу
ничего не шлёт. На VPS Mailpit нет: нужен настоящий SMTP.

### Какие переменные читает код

Из `src/lib/email.ts`:

| Переменная | Назначение |
|---|---|
| `SMTP_HOST` | Хост SMTP (по умолчанию `127.0.0.1` — удобно для Mailpit) |
| `SMTP_PORT` | Порт (по умолчанию `1025` — Mailpit) |
| `SMTP_USER` | Логин; если пусто — без аутентификации (Mailpit) |
| `SMTP_PASS` | Пароль / пароль приложения |
| `SMTP_FROM` | Отправитель, можно `"Имя <addr@domain>"` |

Важно для текущего кода: в адаптере стоит `secure: false`. Шифрование
включается через STARTTLS после соединения. Так работают порт **587**
(Яндекс, Mail.ru) и порт **1126** почтового сервиса Selectel.
Порты **465** и **1127** (TLS сразу, `secure: true`) текущий код не
использует. На тестовом контуре — **1126**, см. [`MAIL.md`](./MAIL.md).

Получатели писем о заявках (`src/lib/requestEmail.ts`):

1. Список **«Email для заявок»** в админке → Global `site-settings`
   (`requestEmails`).
2. Если список пуст — `REQUESTS_FALLBACK_EMAIL` из `.env`.

В письме будет ссылка вида
`https://ваш-домен/admin/collections/requests/<id>` —
для этого критичен правильный `SERVER_URL`.
Если у заявителя указан email, он попадёт в `Reply-To`.

Ошибка отправки **не откатывает** заявку: заявка уже в БД, ошибка
только пишется в лог (`Failed to send request email`).

### Пример: Яндекс (почта или Яндекс 360)

1. Включите возможность входа почтовых клиентов / пароли приложений
   (в настройках безопасности ящика).
2. Создайте **пароль приложения** (не обычный пароль от аккаунта).
3. В `.env`:

```bash
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_USER=ваш@yandex.ru
SMTP_PASS=пароль-приложения
SMTP_FROM="Хан-Хим <ваш@yandex.ru>"
REQUESTS_FALLBACK_EMAIL=менеджер@example.com
```

Адрес в `SMTP_FROM` обычно должен совпадать с ящиком (или быть
разрешённым алиасом), иначе провайдер может отклонить отправку.

### Пример: Mail.ru

```bash
SMTP_HOST=smtp.mail.ru
SMTP_PORT=587
SMTP_USER=ваш@mail.ru
SMTP_PASS=пароль-приложения
SMTP_FROM="Хан-Хим <ваш@mail.ru>"
```

### Как проверить почту на VPS

1. Убедитесь, что контейнер `app` видит переменные:

```bash
docker compose -f docker-compose.vps.yml exec app printenv | grep SMTP
```

2. Отправьте тестовое письмо из контейнера:

```bash
docker compose -f docker-compose.vps.yml exec app pnpm email:test
```

Письмо уйдёт на `REQUESTS_FALLBACK_EMAIL`. Текст скрипта упоминает
Mailpit — на VPS смотрите обычный почтовый ящик.

3. Либо оставьте тестовую заявку на сайте и проверьте ящик менеджера
   и раздел «Заявки» в `/admin`.

4. Если письма нет — логи:

```bash
docker compose -f docker-compose.vps.yml logs app | grep -i mail
docker compose -f docker-compose.vps.yml logs app | grep -i smtp
```

Частые причины: неверный пароль приложения, порт 465 вместо 587,
провайдер режет отправку с «чужого» IP VPS, `SMTP_FROM` не совпадает
с ящиком, письма в спаме.

### Локально vs VPS (почта)

| | Локально (`docker-compose.yml`) | VPS (`docker-compose.vps.yml`) |
|---|---|---|
| SMTP | контейнер **Mailpit** (`SMTP_HOST=mailpit`) | ваш провайдер из `.env` |
| Просмотр писем | http://127.0.0.1:8025 | почтовый клиент / веб-почта |
| Auth | не нужна | почти всегда нужна |

Compose для VPS **не** переопределяет `SMTP_*` — берутся из `.env`.
Локальный compose наоборот подставляет Mailpit поверх `.env`.

---

## 9. Обновление версии на сервере

```bash
cd /opt/khan-him
git pull   # если деплой из git

docker compose -f docker-compose.vps.yml build app
docker compose -f docker-compose.vps.yml up -d
# миграции снова выполнит entrypoint при старте app
```

Или загрузить новый образ через `docker save` / `docker load`, затем
`up -d`.

---

## 10. Бэкап и откат

База:

```bash
docker compose -f docker-compose.vps.yml exec -T postgres \
  pg_dump -U khan khan_him > backup-$(date +%F).sql
```

Файлы загрузок (том `uploads`):

```bash
docker run --rm -v khan-him_uploads:/data -v "$(pwd)":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

(имя тома уточните: `docker volume ls | grep uploads`.)

Откат: поднять предыдущий образ `khan-him:<тег>` + восстановить SQL и
архив `uploads`.

---

## 11. Чек-лист после деплоя на Selectel

1. **[IP]** `http://IP/` открывается · **[домен]** `https://DOMAIN` с валидным сертификатом.
2. `/admin` — вход под `ADMIN_*`.
3. Каталог, карточка товара, скачивание файла.
4. Заявка с сайта → запись в админке + письмо на ящик.
5. `pnpm email:test` в контейнере `app` отрабатывает без ошибки.
6. С телефона в обычной сети РФ сайт открывается стабильно.
7. Порты 5432 и 3000 **не** торчат в интернет
   (`ss -tlnp` или проверка снаружи).

---

## 12. Что не входит в этот тестовый деплой

- Object Storage Selectel (S3) — опционально через `S3_*`, по умолчанию
  диск/`uploads`.
- Почта и DNS SPF/DKIM/DMARC тестового домена `smoke52.ru` —
  [`MAIL.md`](./MAIL.md). Почта на домене заказчика — позже, вместе
  с его провайдером.
- Автоматические бэкапы по cron — пока ручные (см. §10).
- CI/CD — деплой вручную по этой инструкции.

Открытые продуктовые вопросы по домену и почте заказчика —
в [`HOSTING.md`](./HOSTING.md).
