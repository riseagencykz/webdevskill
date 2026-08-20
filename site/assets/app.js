/* ============================================================
   Mr B Academy — общий скрипт сайта
   Меню, ссылки в WhatsApp, метки источника, появление при скролле.
   ============================================================ */
(function () {
  'use strict';

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

  /* ================= WhatsApp =================
     Формы на сайте нет — все кнопки ведут в мессенджер.
     Номер и текст сообщения задаются здесь. */
  var WA_PHONE = '77025648350';
  var WA_TEXT  = 'Добрый день! Хочу записаться на пробный урок';

  /* Метки источника дописываем в текст сообщения: при переходе в WhatsApp
     форма исчезает, а вместе с ней и вся атрибуция. Без этого не видно,
     какой ролик приносит заявки. Поставьте false, чтобы убрать пометку. */
  var WA_TAG_SOURCE = true;

  function sourceData() {
    var data = {}, qs;
    try { qs = new URLSearchParams(window.location.search); } catch (e) { qs = null; }
    UTM_KEYS.forEach(function (k) {
      var v = qs ? (qs.get(k) || '') : '';
      // Параметр теряется при переходе между страницами — держим копию
      try {
        if (v) sessionStorage.setItem('mrb_' + k, v);
        else v = sessionStorage.getItem('mrb_' + k) || '';
      } catch (e) {}
      data[k] = v;
    });
    return data;
  }

  function waHref() {
    var d = sourceData();
    var text = WA_TEXT;
    if (WA_TAG_SOURCE) {
      // Короткая метка, а не список параметров: сообщение пишет человек,
      // длинный технический хвост в нём выглядит странно.
      var tag = d.utm_content || d.utm_campaign || d.utm_source || '';
      if (tag) text += ' #' + tag.replace(/[^\w-]/g, '').slice(0, 24);
    }
    return 'https://api.whatsapp.com/send/?phone=' + WA_PHONE +
           '&text=' + encodeURIComponent(text) + '&type=phone_number&app_absent=0';
  }

  var waLinks = document.querySelectorAll('[data-wa]');
  for (var w2 = 0; w2 < waLinks.length; w2++) waLinks[w2].href = waHref();

  /* Событие конверсии. Страницы «Спасибо» нет, поэтому пиксель должен
     сработать на клике — иначе заявки в статистике не появятся.
     Вызовы обёрнуты: если пиксель не подключён, ошибки не будет. */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-wa]')) return;
    try { if (window.ttq && ttq.track) ttq.track('Contact'); } catch (err) {}
    try { if (window.fbq) fbq('track', 'Contact'); } catch (err) {}
  });
})();
