/**
 * Приём заявок с сайта dolomiti.kz в Google Таблицу.
 *
 * Установка (делается один раз, ~3 минуты):
 *  1. Откройте таблицу «Заявки dolomiti.kz».
 *  2. Расширения → Apps Script. Удалите пример кода, вставьте этот файл целиком.
 *  3. Сохраните (значок дискеты).
 *  4. Развернуть → Новое развёртывание → тип «Веб-приложение».
 *       Описание:              приём заявок с сайта
 *       Запускать от имени:    От моего имени
 *       У кого есть доступ:    У всех
 *     Нажмите «Развернуть», разрешите доступ к аккаунту.
 *  5. Скопируйте «URL веб-приложения» (оканчивается на /exec) и пришлите его —
 *     он подставляется в index.html в константу LEAD_ENDPOINT.
 *
 * После изменения кода нужно сделать Развернуть → Управление развёртываниями →
 * карандаш → Версия: Новая → Развернуть. URL при этом не меняется.
 */

// Куда дублировать заявки письмом. Пустая строка — не отправлять.
var NOTIFY_EMAIL = 'artemzaharov2707@gmail.com';

function doPost(e) {
  try {
    var d = e.parameter || {};
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    sheet.appendRow([
      new Date(),
      d.lead_type || '',
      d.name || '',
      d.phone || '',
      d.email || '',
      d.city || '',
      d.company || '',
      d.model || '',
      d.accessories ? 'да' : '',
      d.utm || '',
      d.page || ''
    ]);

    if (NOTIFY_EMAIL) {
      var lines = [
        'Тип: ' + (d.lead_type || '—'),
        'Имя: ' + (d.name || '—'),
        'Телефон: ' + (d.phone || '—'),
        'E-mail: ' + (d.email || '—'),
        'Город: ' + (d.city || '—'),
        'Компания: ' + (d.company || '—'),
        'Модель / документ: ' + (d.model || '—'),
        'Аксессуары: ' + (d.accessories ? 'да' : 'нет'),
        'UTM: ' + (d.utm || '—')
      ];
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        'Заявка с сайта: ' + (d.lead_type || 'сайт'),
        lines.join('\n')
      );
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('Dolomiti leads endpoint is running');
}
