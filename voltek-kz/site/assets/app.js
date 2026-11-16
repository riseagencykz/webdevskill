/* Voltek Казахстан — макет. Без библиотек. */
(function () {
  'use strict';

  // ── настройки: поменять перед запуском ──
  var CFG = {
    whatsapp: '77000000000' // TODO: номер WhatsApp представительства, только цифры
  };

  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MODELS = [];
  try { MODELS = JSON.parse(document.getElementById('models').textContent); } catch (e) {}

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function fmt(n) { return Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' '); }

  // ── меню ──
  var burger = $('.burger'), nav = $('#nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
    });
  }

  // ── осциллограф в первом экране ──
  (function scope() {
    var fig = $('.scope'), pin = $('#waveIn'), pout = $('#waveOut'), rd = $('#readIn');
    if (!fig || !pin || !pout) return;
    var K = Math.PI * 2 / 92;          // длина волны ~92px
    var AMP = 0.25;                    // px на вольт: 220 В → 55 px
    var CY = 140, IN_END = 268, OUT_START = 452, W = 720;
    function volts(s) {                // «напряжение сети» вдоль ленты
      var v = 212 + 34 * Math.sin(s * 0.011) + 20 * Math.sin(s * 0.031 + 1.3) + 9 * Math.sin(s * 0.093 + 0.4);
      var spike = Math.max(0, Math.sin(s * 0.0047 + 2)) ;
      return v + Math.pow(spike, 40) * 70;   // редкий бросок вверх
    }
    var t = 0, last = 0, raf = 0, visible = true, lastRead = 0;
    function frame(ts) {
      var dt = last ? Math.min(ts - last, 50) : 16; last = ts;
      t += dt * 0.09;
      var d = '', x, s, v, a, ph, y;
      for (x = 0; x <= IN_END; x += 3) {
        s = x - t; v = volts(s); a = v * AMP; ph = x * K - t * 0.07;
        y = CY - a * Math.sin(ph) - a * 0.09 * Math.sin(ph * 3 + 0.6) - 2.2 * Math.sin(x * 1.7 + t * 0.4);
        d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
      }
      pin.setAttribute('d', d);
      d = '';
      for (x = OUT_START; x <= W; x += 3) {
        y = CY - 55 * Math.sin(x * K - t * 0.07);
        d += (x === OUT_START ? 'M' : 'L') + x + ' ' + y.toFixed(1);
      }
      pout.setAttribute('d', d);
      if (rd && ts - lastRead > 260) {
        lastRead = ts;
        var vin = Math.round(volts(IN_END - t));
        rd.textContent = vin;
        rd.parentNode.classList.toggle('is-ok', vin >= 198 && vin <= 242);
      }
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    }
    function run(on) {
      visible = on;
      fig.classList.toggle('is-paused', !on);
      cancelAnimationFrame(raf);
      if (on && !reduce) { last = 0; raf = requestAnimationFrame(frame); }
    }
    frame(0);
    if (reduce) return;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { run(es[0].isIntersecting && !document.hidden); }).observe(fig);
    } else run(true);
    document.addEventListener('visibilitychange', function () {
      var r = fig.getBoundingClientRect();
      run(!document.hidden && r.bottom > 0 && r.top < innerHeight);
    });
  })();

  // ── подбор мощности ──
  (function calc() {
    var form = $('#calc'); if (!form) return;
    var out = $('#cOut'), sumEl = $('#cSum'), peakEl = $('#cPeak'), own = $('#own');
    var IS = MODELS.filter(function (m) { return m.series === 'is'; });
    var TCH = MODELS.filter(function (m) { return m.series === 'tch'; });
    // Модель подходит, если её нижняя граница по кВт ≥ нагрузка × 1,2
    // и кратковременная перегрузка (IS 150 %, ТСН 200 %) покрывает пуск мотора.
    function pick(list, over, sum, peak) {
      for (var i = 0; i < list.length; i++) {
        var w = list[i].kw_min * 1000;
        if (w >= sum * 1.2 && w * over >= peak) return list[i];
      }
      return null;
    }
    function row(m, cls, note) {
      return '<div class="pick pick--' + cls + '"><div><small>' + (cls === 'is' ? 'Инверторный' : 'Тиристорный') +
        '</small><b>' + m.name + '</b><span>' + m.kva + ' кВА · ' + m.kw + ' кВт · ' + note + '</span></div>' +
        '<a href="#m-' + m.id + '">В каталоге</a></div>';
    }
    function update() {
      var sum = 0, extra = 0, names = [];
      $$('input[name=ap]:checked', form).forEach(function (c) {
        var w = +c.dataset.w, k = +c.dataset.k;
        sum += w; extra = Math.max(extra, (k - 1) * w);
        names.push(c.parentNode.querySelector('.ap__name').textContent);
      });
      var o = Math.max(0, Math.min(30000, +own.value || 0));
      if (o) { sum += o; names.push('другое ' + o + ' Вт'); }
      var peak = sum + extra;
      sumEl.textContent = fmt(sum); peakEl.textContent = fmt(peak);
      if (!sum) { out.innerHTML = '<p class="calc__hint">Отметьте приборы слева — здесь появятся подходящие модели.</p>'; return; }
      var a = pick(IS, 1.5, sum, peak), b = pick(TCH, 2, sum, peak), html = '';
      if (a) html += row(a, 'is', a.plug ? 'в розетку' : 'на клеммы');
      if (b) html += row(b, 'tch', 'на ввод в дом');
      if (!a && !b) html = '<p class="calc__hint">Больше 20 кВт — это несколько стабилизаторов или трёхфазная схема. Напишите, подберём под объект.</p>';
      else if (!a) html += '<p class="calc__hint">Для такой нагрузки инверторные IS малы — смотрите тиристорный.</p>';
      var ask = 'Подбор: ' + names.join(', ') + '. Нагрузка ~' + fmt(sum) + ' Вт, пуск до ' + fmt(peak) + ' Вт.' +
        ((a || b) ? ' Предложили: ' + [a && ('Voltek ' + a.name), b && ('Voltek ' + b.name)].filter(Boolean).join(' или ') + '.' : '');
      html += '<a class="btn btn--sun btn--block" href="#zayavka" data-ask-text="' + ask.replace(/"/g, '&quot;') + '">Узнать цену на подобранное</a>';
      out.innerHTML = html;
    }
    form.addEventListener('change', update);
    own.addEventListener('input', update);
  })();

  // ── фильтр каталога ──
  (function tabs() {
    var tabs = $$('.tab'), cards = $$('.card');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.dataset.f;
        tabs.forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
        cards.forEach(function (c) { c.hidden = f !== 'all' && c.dataset.series !== f; });
      });
    });
    // переход из подбора к карточке, скрытой фильтром
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#m-"]'); if (!a) return;
      var c = document.getElementById(a.getAttribute('href').slice(1));
      if (c && c.hidden) tabs[0].click();
    });
  })();

  // ── «Узнать цену» подставляет модель в заявку ──
  var msg = $('#msg');
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-ask],[data-ask-text]'); if (!a || !msg) return;
    var text = a.dataset.askText || (a.dataset.ask.indexOf('Voltek ') === 0 ? 'Интересует ' + a.dataset.ask + '. Сколько стоит и есть ли в наличии?' : a.dataset.ask + '.');
    msg.value = text;
    setTimeout(function () { var p = $('#form input[name=phone]'); if (p) p.focus({ preventScroll: true }); }, reduce ? 0 : 500);
  });

  // ── заявка → WhatsApp ──
  (function form() {
    var f = $('#form'); if (!f) return;
    var err = $('#formErr'), phone = f.elements.phone;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var digits = (phone.value || '').replace(/\D/g, '');
      if (digits.length < 10) {
        phone.setAttribute('aria-invalid', 'true'); err.hidden = false; phone.focus(); return;
      }
      phone.removeAttribute('aria-invalid'); err.hidden = true;
      var L = ['Здравствуйте! Заявка с сайта Voltek Казахстан.'];
      if (f.elements.name.value.trim()) L.push('Имя: ' + f.elements.name.value.trim());
      L.push('Телефон: ' + phone.value.trim());
      if (f.elements.city.value) L.push('Город: ' + f.elements.city.value);
      if (f.elements.msg.value.trim()) L.push(f.elements.msg.value.trim());
      window.open('https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(L.join('\n')), '_blank', 'noopener');
    });
    phone.addEventListener('input', function () { if (phone.getAttribute('aria-invalid')) { phone.removeAttribute('aria-invalid'); err.hidden = true; } });
  })();

  // ── мягкое появление блоков ──
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.sign, .duo__col, .cmp, .card, .doc, .dealer__list li, .faq__list details').forEach(function (el) { el.classList.add('rv'); io.observe(el); });
  }
})();
