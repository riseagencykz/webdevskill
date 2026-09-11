<?php
/*
 * Приём заявки с сайта Lion Global Logistics и отправка её на почту.
 *
 * Что нужно сделать перед заливкой: заполнить $CFG ниже.
 * Пароль почтового ящика сюда НЕ подходит — нужен «пароль приложения»,
 * он делается в настройках Яндекс-почты и работает только для почтовых
 * программ. Обычный пароль Яндекс для SMTP не принимает.
 *
 * Если на хостинге нет PHP — см. README, раздел «Форма без PHP»:
 * там форма переключается на внешний сервис одной строкой.
 */

declare(strict_types=1);

$CFG = [
    // Куда падают заявки. Можно несколько через запятую.
    'to'         => 'info-liongl@yandex.kz',

    // SMTP. Для Яндекса — ssl://smtp.yandex.ru:465.
    'smtp_host'  => 'ssl://smtp.yandex.ru',
    'smtp_port'  => 465,
    'smtp_user'  => 'info-liongl@yandex.kz',
    'smtp_pass'  => '',                       // ← пароль приложения
    'from'       => 'info-liongl@yandex.kz',  // должен совпадать с smtp_user
    'from_name'  => 'Сайт lion-gl.kz',

    // Не больше стольких заявок с одного адреса в час.
    'per_hour'   => 8,

    // Диагностика. Пусто — выключена, и никакой ссылки не существует.
    // Впишите любое длинное слово, и по адресу
    //     https://ваш-сайт/send.php?diag=ЭТО_СЛОВО
    // откроется отчёт: настройки, открытые порты и весь разговор
    // с почтовым сервером построчно. Пароль в отчёте не показывается.
    // Починили почту — верните сюда пустую строку.
    'diag_key'   => '',
];

/* ------------------------------------------------------------------ */

const MAX_LEN = 200;

function client_ip(): string
{
    return (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

function field(string $name): string
{
    $v = $_POST[$name] ?? '';
    if (!is_string($v)) {
        return '';
    }
    // Переводы строк выкидываем: иначе через поле можно дописать
    // свои заголовки письма и разослать спам от имени сайта.
    $v = str_replace(["\r", "\n", "\0"], ' ', $v);
    return trim(mb_substr($v, 0, MAX_LEN));
}

function digits(string $s): int
{
    return preg_match_all('/\d/u', $s);
}

/** Простой счётчик по IP: файл во временной папке, без базы. */
function rate_ok(int $limit): bool
{
    $file = sys_get_temp_dir() . '/lgl-rate-' . md5(client_ip()) . '.txt';
    $now  = time();
    $hits = [];
    if (is_readable($file)) {
        $hits = array_filter(
            array_map('intval', explode(',', (string)file_get_contents($file))),
            static fn(int $t): bool => $t > $now - 3600
        );
    }
    if (count($hits) >= $limit) {
        return false;
    }
    $hits[] = $now;
    @file_put_contents($file, implode(',', $hits), LOCK_EX);
    return true;
}

function wants_json(): bool
{
    return str_contains((string)($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json');
}

function reply(bool $ok, string $text): never
{
    if (wants_json()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($ok ? 200 : 400);
        echo json_encode(['ok' => $ok, 'error' => $ok ? null : $text], JSON_UNESCAPED_UNICODE);
        exit;
    }
    // Ответ для случая, когда JS выключен.
    header('Content-Type: text/html; charset=utf-8');
    http_response_code($ok ? 200 : 400);
    $t = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
    echo <<<HTML
<!doctype html><html lang="ru"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Заявка — Lion Global Logistics</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#EDF0F3;
color:#0F1822;font:16px/1.5 Inter,system-ui,sans-serif;padding:24px}
div{background:#fff;border:1px solid #D3D9DF;border-radius:16px;padding:32px;max-width:440px}
h1{font-size:23px;margin:0 0 8px}p{margin:0 0 20px;color:#4A5867}
a{display:inline-flex;align-items:center;min-height:44px;padding:0 20px;border-radius:999px;
background:#0F1822;color:#fff;text-decoration:none;font-weight:600}</style>
<div><h1>{$t}</h1><p>Спасибо, что написали.</p><a href="/">Вернуться на сайт</a></div>
HTML;
    exit;
}

/** Заголовок письма в UTF-8: без этого тема приезжает кракозябрами. */
function mime_header(string $s): string
{
    return '=?UTF-8?B?' . base64_encode($s) . '?=';
}

/**
 * Отправка через SMTP. Своя, чтобы не тащить библиотеку:
 * письмо тут одно, и оно простое.
 */
function smtp_send(array $cfg, string $subject, string $body): bool
{
    $errno = 0;
    $errstr = '';
    $fp = @stream_socket_client(
        $cfg['smtp_host'] . ':' . $cfg['smtp_port'],
        $errno,
        $errstr,
        20,
        STREAM_CLIENT_CONNECT
    );
    if (!$fp) {
        error_log("lgl: SMTP не открылся — $errstr");
        return false;
    }
    stream_set_timeout($fp, 20);

    $read = static function () use ($fp): string {
        $out = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $out .= $line;
            // последняя строка ответа: код, пробел, текст
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
        }
        return $out;
    };
    $say = static function (string $cmd, string $expect) use ($fp, $read): bool {
        if ($cmd !== '') {
            fwrite($fp, $cmd . "\r\n");
        }
        $r = $read();
        if (!str_starts_with($r, $expect)) {
            error_log('lgl: SMTP ответил ' . trim($r) . ' на ' . explode(' ', $cmd)[0]);
            return false;
        }
        return true;
    };

    $host = (string)($_SERVER['SERVER_NAME'] ?? 'localhost');
    $ok = $say('', '220')
        && $say('EHLO ' . $host, '250')
        && $say('AUTH LOGIN', '334')
        && $say(base64_encode($cfg['smtp_user']), '334')
        && $say(base64_encode($cfg['smtp_pass']), '235')
        && $say('MAIL FROM:<' . $cfg['from'] . '>', '250');

    if ($ok) {
        foreach (array_map('trim', explode(',', $cfg['to'])) as $rcpt) {
            $ok = $ok && $say('RCPT TO:<' . $rcpt . '>', '250');
        }
    }

    if ($ok && $say('DATA', '354')) {
        $headers = implode("\r\n", [
            'From: ' . mime_header($cfg['from_name']) . ' <' . $cfg['from'] . '>',
            'To: ' . $cfg['to'],
            'Subject: ' . mime_header($subject),
            'Date: ' . date(DATE_RFC2822),
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $host . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
        ]);
        fwrite($fp, $headers . "\r\n\r\n" . chunk_split(base64_encode($body)) . "\r\n.\r\n");
        $ok = $say('', '250');
    } else {
        $ok = false;
    }

    $say('QUIT', '221');
    fclose($fp);
    return $ok;
}

/**
 * Диагностика. Открывается только при непустом diag_key и точном
 * совпадении — иначе этого адреса для внешнего мира не существует.
 * Пароль наружу не выводится, только его длина.
 */
function diagnose(array $cfg): never
{
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Robots-Tag: noindex, nofollow');
    $out = static function (string $s): void {
        echo $s . "\n";
        @flush();
    };

    $out('ДИАГНОСТИКА ПОЧТЫ · ' . date('d.m.Y H:i'));
    $out(str_repeat('=', 58));
    $out('PHP ' . PHP_VERSION . ', сервер ' . ($_SERVER['SERVER_NAME'] ?? '?'));
    $out('');

    $out('1. НАСТРОЙКИ');
    $out('   хост:    ' . $cfg['smtp_host'] . ':' . $cfg['smtp_port']);
    $out('   логин:   ' . $cfg['smtp_user']);
    $out('   пароль:  ' . ($cfg['smtp_pass'] === ''
        ? '— ПУСТО'
        : str_repeat('*', strlen($cfg['smtp_pass'])) . ' (' . strlen($cfg['smtp_pass']) . ' символов)'));
    $out('   от кого: ' . $cfg['from']);
    $out('   кому:    ' . $cfg['to']);
    if ($cfg['smtp_pass'] !== '' && strlen($cfg['smtp_pass']) !== 16) {
        $out('   !! Пароль приложения Яндекса — ровно 16 символов. Похоже, скопирован не целиком.');
    }
    if ($cfg['from'] !== $cfg['smtp_user']) {
        $out('   !! from и smtp_user не совпадают — Яндекс отклонит письмо.');
    }
    $out('');

    $out('2. ИСХОДЯЩИЕ ПОРТЫ');
    foreach ([[465, 'ssl://smtp.yandex.ru'], [587, 'tcp://smtp.yandex.ru'], [25, 'tcp://smtp.yandex.ru']] as [$port, $host]) {
        $t0 = microtime(true);
        $e = 0; $es = '';
        $s = @stream_socket_client($host . ':' . $port, $e, $es, 6);
        $ms = (int)round((microtime(true) - $t0) * 1000);
        if ($s) {
            $greet = trim((string)fgets($s, 1024));
            fclose($s);
            $out(sprintf('   %-4d ОТКРЫТ (%d мс)  %s', $port, $ms, $greet));
        } else {
            $out(sprintf('   %-4d ЗАКРЫТ (%d мс)  %s', $port, $ms, $es ?: 'нет ответа'));
        }
    }
    $out('');

    $out('3. РАЗГОВОР С ПОЧТОВЫМ СЕРВЕРОМ');
    if ($cfg['smtp_pass'] === '') {
        exit("   Пропущено: пароль не вписан.\n");
    }

    $e = 0; $es = '';
    $fp = @stream_socket_client($cfg['smtp_host'] . ':' . $cfg['smtp_port'], $e, $es, 20);
    if (!$fp) {
        $out('   НЕ ПОДКЛЮЧИЛИСЬ: ' . ($es ?: 'нет ответа'));
        exit("\nВЕРДИКТ: хостинг не выпускает наружу на порт " . $cfg['smtp_port'] . ".\n"
           . "В поддержку хостинга: «нужен исходящий SMTP на smtp.yandex.ru:465».\n"
           . "Если выше открытым оказался 587 — напишите мне, переключу на него.\n");
    }
    stream_set_timeout($fp, 20);

    $read = static function () use ($fp): string {
        $r = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $r .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
        }
        return trim($r);
    };
    $say = static function (string $cmd, string $show) use ($fp, $read, $out): string {
        if ($cmd !== '') {
            $out('   > ' . $show);
            fwrite($fp, $cmd . "\r\n");
        }
        $r = $read();
        $out('   < ' . str_replace("\n", "\n     ", $r));
        return $r;
    };

    // Ответ именно того шага, который упал: до QUIT, иначе его затрёт «221 Bye».
    $fail = '';
    $step = '';
    $host = (string)($_SERVER['SERVER_NAME'] ?? 'localhost');
    $chain = [
        ['', '(приветствие)', '220', 'приветствие'],
        ['EHLO ' . $host, 'EHLO ' . $host, '250', 'EHLO'],
        ['AUTH LOGIN', 'AUTH LOGIN', '334', 'AUTH LOGIN'],
        [base64_encode($cfg['smtp_user']), '(логин)', '334', 'логин'],
        [base64_encode($cfg['smtp_pass']), '(пароль)', '235', 'пароль'],
        ['MAIL FROM:<' . $cfg['from'] . '>', 'MAIL FROM', '250', 'MAIL FROM'],
        ['RCPT TO:<' . trim(explode(',', $cfg['to'])[0]) . '>', 'RCPT TO', '250', 'RCPT TO'],
        ['DATA', 'DATA', '354', 'DATA'],
    ];
    foreach ($chain as [$cmd, $show, $expect, $name]) {
        $r = $say($cmd, $show);
        if (!str_starts_with($r, $expect)) {
            $fail = $r;
            $step = $name;
            break;
        }
    }

    if ($step === '') {
        $body = "Проверочное письмо с сайта.\nВидите его — форма заявок работает.\n";
        $head = implode("\r\n", [
            'From: ' . mime_header($cfg['from_name']) . ' <' . $cfg['from'] . '>',
            'To: ' . $cfg['to'],
            'Subject: ' . mime_header('Проверка отправки с сайта'),
            'Date: ' . date(DATE_RFC2822),
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
        ]);
        $out('   > (текст письма)');
        fwrite($fp, $head . "\r\n\r\n" . chunk_split(base64_encode($body)) . "\r\n.\r\n");
        $r = $read();
        $out('   < ' . $r);
        if (!str_starts_with($r, '250')) {
            $fail = $r;
            $step = 'приём письма';
        }
    }
    $say('QUIT', 'QUIT');
    fclose($fp);

    $out('');
    $out(str_repeat('=', 58));
    if ($step === '') {
        exit("ВСЁ РАБОТАЕТ. Письмо отправлено на {$cfg['to']}.\n"
           . "Проверьте «Входящие» и «Спам».\n\n"
           . "Теперь верните 'diag_key' => '' и залейте файл заново.\n");
    }

    $out('СЛОМАЛОСЬ НА ШАГЕ: ' . $step);
    $out('Ответ сервера: ' . $fail);
    $out('');
    if ($step === 'пароль' || str_starts_with($fail, '535')) {
        $out('ЭТО АВТОРИЗАЦИЯ. Причины по частоте:');
        $out(' 1. Не включён доступ почтовым программам. Почта → Все настройки →');
        $out('    Почтовые программы → включить IMAP. Самая частая причина,');
        $out('    а выглядит как «неверный пароль».');
        $out(' 2. Пароль приложения сделан под другим аккаунтом Яндекса.');
        $out('    Он должен быть от ' . $cfg['smtp_user']);
        $out(' 3. Вписан обычный пароль от почты, а нужен пароль приложения:');
        $out('    id.yandex.ru/security/app-passwords');
    } elseif (preg_match('/^5(50|53|71)/', $fail)) {
        $out('ЯЩИК НЕ РАЗРЕШИЛ ОТПРАВКУ.');
        $out(' — from должен совпадать с smtp_user;');
        $out(' — либо не включён доступ почтовым программам.');
    } else {
        $out('Пришлите мне весь текст этой страницы — разберу.');
    }
    exit("\n");
}

/* ------------------------------------------------------------------ */

if ($CFG['diag_key'] !== '' && isset($_GET['diag'])
    && hash_equals((string)$CFG['diag_key'], (string)$_GET['diag'])) {
    diagnose($CFG);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply(false, 'Так эта страница не открывается');
}

// Бот заполнил невидимое поле — молча делаем вид, что всё хорошо.
if (field('company_site') !== '') {
    reply(true, 'Заявка принята');
}

$name  = field('name');
$phone = field('phone');

if (mb_strlen($name) < 2) {
    reply(false, 'Не хватает имени');
}
if (digits($phone) < 10) {
    reply(false, 'Не хватает телефона');
}
if (!rate_ok((int)$CFG['per_hour'])) {
    reply(false, 'Слишком много заявок подряд. Позвоните: +7 771 501 77 75');
}

$rows = [
    'Имя'      => $name,
    'Телефон'  => $phone,
    'Откуда'   => field('from'),
    'Куда'     => field('to'),
    'Тонн'     => field('weight'),
];
$body = "Заявка с сайта\n\n";
foreach ($rows as $k => $v) {
    if ($v !== '') {
        $body .= "$k: $v\n";
    }
}
$body .= "\n—\n";
$body .= 'Страница: ' . field('page') . "\n";
$body .= 'Время: ' . date('d.m.Y H:i') . "\n";
$body .= 'IP: ' . client_ip() . "\n";

$subject = 'Заявка с сайта: ' . $name . ', ' . $phone;

if ($CFG['smtp_pass'] !== '') {
    $sent = smtp_send($CFG, $subject, $body);
} else {
    // Запасной путь: встроенная отправка хостинга. Работает не везде
    // и чаще попадает в спам, поэтому SMTP предпочтительнее.
    $sent = @mail(
        $CFG['to'],
        mime_header($subject),
        $body,
        implode("\r\n", [
            'From: ' . mime_header($CFG['from_name']) . ' <' . $CFG['from'] . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
        ])
    );
}

if (!$sent) {
    error_log('lgl: заявка не ушла — ' . str_replace("\n", ' | ', $body));
    reply(false, 'Письмо не ушло. Напишите в WhatsApp: +7 771 501 77 75');
}

reply(true, 'Заявка отправлена');
