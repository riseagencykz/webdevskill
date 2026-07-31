/* ============================================================
   Mr B Academy — общий скрипт сайта
   Меню, модальная форма, метки источника, маска телефона,
   появление при скролле.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- КУДА ОТПРАВЛЯТЬ ЗАЯВКУ ----------
     Пока адрес не задан, форма НЕ делает вид, что отправила: показывает
     прямое предупреждение. Фальшивое «Заявка принята» создало бы
     иллюзию, что лиды идут, когда их нет.

     Варианты подключения:
       1. свой обработчик / вебхук AmoCRM  -> впишите URL ниже;
       2. форма Тильды в попапе            -> см. site/README.md.  */
  var FORM_ENDPOINT = '';   // например 'https://example.kz/api/lead'

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var UTM_KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','ttclid'];

  /* ================= Мобильное меню ================= */
  var burger = document.querySelector('[data-burger]');
  var mobileNav = document.getElementById('mobile-nav');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Закрываем при переходе на широкий экран, иначе меню зависает открытым
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900) {
        mobileNav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    }, { passive: true });
  }

  /* ================= Появление при скролле =================
     Наблюдаем секции, а не отдельные элементы: быстрый флик-скролл
     проскакивает элементы, и они остались бы невидимыми навсегда. */
  if (!reduced && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var items = en.target.querySelectorAll('.reveal');
        for (var i = 0; i < items.length; i++) {
          items[i].style.transitionDelay = (Math.min(i, 7) * 60) + 'ms';
          items[i].classList.add('is-in');
        }
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    var groups = document.querySelectorAll('section, footer');
    for (var g = 0; g < groups.length; g++) io.observe(groups[g]);

    // Страховка: ничего не должно остаться скрытым ни при каком сценарии
    var sweepT;
    window.addEventListener('scroll', function () {
      clearTimeout(sweepT);
      sweepT = setTimeout(function () {
        var left = document.querySelectorAll('.reveal:not(.is-in)');
        for (var k = 0; k < left.length; k++) {
          var host = left[k].closest('section, footer');
          if (host && host.getBoundingClientRect().top < window.innerHeight) left[k].classList.add('is-in');
        }
      }, 200);
    }, { passive: true });
  }

  /* ================= Счётчики ================= */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduced && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; cio.unobserve(el);
        var target = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(target)) return;
        var pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
        var start = null;
        (function tick(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / 900, 1);
          el.textContent = pre + Math.round(target * (1 - Math.pow(1 - p, 3))) + suf;
          if (p < 1) requestAnimationFrame(tick);
        })(performance.now());
      });
    }, { threshold: 0.6 });
    for (var c = 0; c < counters.length; c++) cio.observe(counters[c]);
  }

  /* ================= Картинки с CDN =================
     Если файл не отдался — прячем и показываем запасной элемент,
     иначе в вёрстке повиснет иконка битой картинки. */
  function swapOnError(imgSel, fbSel, display) {
    var img = document.querySelector(imgSel);
    if (!img) return;
    var show = function () {
      img.style.display = 'none';
      var fb = document.querySelector(fbSel);
      if (fb) fb.style.display = display;
    };
    img.addEventListener('error', show);
    if (img.complete && img.naturalWidth === 0) show();   // мог упасть до навешивания обработчика
  }
  swapOnError('[data-logo]', '[data-logo-text]', 'inline');
  swapOnError('[data-portrait]', '[data-portrait-fallback]', 'block');

  /* ================= Модальная форма ================= */
  var modal = document.getElementById('lead-modal');
  if (!modal) return;

  var form    = document.getElementById('lead-form');
  var okBox   = document.getElementById('lead-ok');
  var notice  = document.getElementById('lead-notice');
  var submit  = document.getElementById('lead-submit');
  var title   = modal.querySelector('h2');
  var lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';       // блокируем прокрутку фона
    if (title) { title.setAttribute('tabindex', '-1'); title.focus({ preventScroll: true }); }
  }
  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-open-lead]')) { e.preventDefault(); openModal(); return; }
    if (e.target.closest('[data-close-lead]')) { e.preventDefault(); closeModal(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  /* ---------- Метки источника ----------
     Параметр может потеряться при переходе между страницами,
     поэтому держим копию в sessionStorage. */
  try {
    var qs = new URLSearchParams(window.location.search);
    UTM_KEYS.forEach(function (k) {
      var v = qs.get(k) || '';
      try {
        if (v) sessionStorage.setItem('mrb_' + k, v);
        else v = sessionStorage.getItem('mrb_' + k) || '';
      } catch (e) {}
      var field = form.querySelector('[name="' + k + '"]');
      if (field) field.value = v;
    });
    var pageField = form.querySelector('[name="page_url"]');
    if (pageField) pageField.value = window.location.href.slice(0, 500);
  } catch (e) {}

  /* ---------- Валидация ---------- */
  function fieldValid(input) {
    var good;
    if (input.type === 'checkbox') good = input.checked;
    else if (input.type === 'tel') good = (input.value || '').replace(/\D/g, '').length === 11;
    else good = (input.value || '').trim().length > 0;
    input.setAttribute('aria-invalid', good ? 'false' : 'true');
    var err = form.querySelector('[data-err-for="' + input.id + '"]');
    if (err) err.classList.toggle('is-shown', !good);
    return good;
  }
  function formValid() {
    var ok = true;
    form.querySelectorAll('[data-req]').forEach(function (i) { if (!fieldValid(i)) ok = false; });
    return ok;
  }
  // ux-guidelines.csv → Inline Validation: проверяем на blur, а не только на сабмите
  form.addEventListener('blur', function (e) {
    if (e.target.matches && e.target.matches('[data-req]:not([type=checkbox])')) fieldValid(e.target);
  }, true);
  form.addEventListener('change', function (e) {
    if (e.target.type === 'checkbox') fieldValid(e.target);
  });

  /* ---------- Маска телефона ---------- */
  var phone = document.getElementById('lead-phone');
  if (phone) {
    var TPL = '+7 (___) ___-__-__';
    var mask = function (d) {
      var out = '', i = 0, k = 0;
      for (; i < TPL.length; i++) out += TPL[i] === '_' ? (k < d.length ? d[k++] : '_') : TPL[i];
      return out;
    };
    var caret = function () { var i = phone.value.indexOf('_'); return i === -1 ? phone.value.length : i; };
    /* Порядок важен: сначала снимаем «7» нашего же префикса +7, затем «8» —
       междугородний. Ведущую «7» самого номера трогать нельзя: коды
       операторов РК начинаются с семёрки (701, 707, 747, 775). */
    var digits = function (v) {
      var d = v.replace(/\D/g, '');
      if (d.charAt(0) === '7') d = d.slice(1);
      if (d.charAt(0) === '8') d = d.slice(1);
      return d.slice(0, 10);
    };
    phone.addEventListener('focus', function () {
      if (!phone.value) phone.value = TPL;
      requestAnimationFrame(function () { var p = caret(); phone.setSelectionRange(p, p); });
    });
    phone.addEventListener('input', function () {
      phone.value = mask(digits(phone.value));
      var p = caret(); phone.setSelectionRange(p, p);
    });
    phone.addEventListener('click', function () { var p = caret(); phone.setSelectionRange(p, p); });
    phone.addEventListener('blur', function () { if (phone.value === TPL) phone.value = ''; });
  }

  /* ---------- Отправка ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!formValid()) return;

    if (!FORM_ENDPOINT) {
      // Честно говорим, что адрес не задан, вместо фальшивого успеха
      notice.textContent = 'Форма не подключена: укажите FORM_ENDPOINT в assets/app.js.';
      notice.style.display = 'block';
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Отправляем…';
    notice.style.display = 'none';

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      form.style.display = 'none';
      okBox.style.display = 'block';
    }).catch(function () {
      submit.disabled = false;
      submit.textContent = 'Записаться на диагностику';
      notice.textContent = 'Не удалось отправить. Попробуйте ещё раз или напишите нам в WhatsApp.';
      notice.style.display = 'block';
    });
  });
})();
