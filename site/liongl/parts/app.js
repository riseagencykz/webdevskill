(function () {
  'use strict';
  var root = document.getElementById('lgl-root');
  if (!root || root.getAttribute('data-lgl-init')) return;
  root.setAttribute('data-lgl-init', '1');

  function init() {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var io2 = 'IntersectionObserver' in window;
    if (!reduced && io2) root.classList.add('lgl-js');

    /* ---------- вход первого экрана ----------
       Один раз при загрузке, лесенкой. Дальше эти элементы не трогаем. */
    var lift = root.querySelectorAll('.lgl-lift');
    if (root.classList.contains('lgl-js')) {
      requestAnimationFrame(function () {
        for (var i = 0; i < lift.length; i++) {
          lift[i].style.setProperty('--dl', (i * 70) + 'ms');
          lift[i].classList.add('lgl-up');
        }
      });
    }

    /* ---------- появление секций ----------
       Наблюдаем контейнеры, а не элементы: быстрый флик-скролл проскакивает
       отдельные элементы, и они остались бы скрытыми навсегда. */
    if (root.classList.contains('lgl-js')) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var items = en.target.querySelectorAll('.lgl-rv');
          for (var i = 0; i < items.length; i++) {
            items[i].style.transitionDelay = (Math.min(i, 7) * 70) + 'ms';
            items[i].classList.add('lgl-in');
          }
          io.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
      var groups = root.querySelectorAll('section, footer, .lgl-hero');
      for (var g = 0; g < groups.length; g++) io.observe(groups[g]);

      var sweep;
      window.addEventListener('scroll', function () {
        clearTimeout(sweep);
        sweep = setTimeout(function () {
          var left = root.querySelectorAll('.lgl-rv:not(.lgl-in)');
          for (var k = 0; k < left.length; k++) {
            var host = left[k].closest('section, footer, .lgl-hero');
            if (host && host.getBoundingClientRect().top < window.innerHeight) left[k].classList.add('lgl-in');
          }
        }, 200);
      }, { passive: true });
    }

    /* ---------- постановка схемы коридоров ----------
       Зона, потом линии, потом узлы, потом подписи, и только затем точки.
       Класс ставится один раз, поэтому при возврате на вкладку
       постановка не проигрывается заново. */
    var mapcard = root.querySelector('#lgl-mapcard');
    var svg = mapcard && mapcard.querySelector('.lgl-map');
    if (mapcard) {
      var drawn = false;
      var draw = function () {
        if (drawn) return;
        drawn = true;
        mapcard.classList.add('lgl-is-drawn');
        var nodes = mapcard.querySelectorAll('.lgl-map .lgl-node, .lgl-map .lgl-hub');
        for (var i = 0; i < nodes.length; i++) nodes[i].style.setProperty('--nd', (820 + i * 70) + 'ms');
        setTimeout(function () { mapcard.classList.add('lgl-is-live'); }, reduced ? 0 : 1500);
      };
      if (reduced || !io2) draw();
      else {
        var mio = new IntersectionObserver(function (en) {
          if (en[0].isIntersecting) { draw(); mio.disconnect(); }
        }, { threshold: 0.25 });
        mio.observe(mapcard);
      }

      /* Точки крутятся только когда схема на экране и вкладка активна.
         Иначе браузер жжёт батарею на анимации, которой никто не видит. */
      if (svg && svg.pauseAnimations && !reduced) {
        var visible = false;
        var sync = function () {
          if (visible && !document.hidden) svg.unpauseAnimations();
          else svg.pauseAnimations();
        };
        if (io2) {
          new IntersectionObserver(function (en) {
            visible = en[0].isIntersecting; sync();
          }, { threshold: 0.05 }).observe(mapcard);
        } else visible = true;
        document.addEventListener('visibilitychange', sync);
        sync();
      }
    }

    /* ---------- ночная трасса: движется только пока видна ----------
       Дорога, горизонт и колёса — это три бесконечные CSS-анимации.
       Браузер не останавливает их сам, когда полоса уходит за экран,
       поэтому включаем и выключаем вручную. */
    var rig = root.querySelector('#lgl-rig');
    if (rig && !reduced) {
      if (io2) {
        var rigVis = false;
        var rigSync = function () {
          rig.classList.toggle('lgl-run', rigVis && !document.hidden);
        };
        new IntersectionObserver(function (en) {
          rigVis = en[0].isIntersecting; rigSync();
        }, { threshold: 0.05 }).observe(rig);
        document.addEventListener('visibilitychange', rigSync);
      } else {
        rig.classList.add('lgl-run');
      }
    }

    /* ---------- линия прогресса в пяти шагах ---------- */
    var steps = root.querySelector('.lgl-steps');
    if (steps && !reduced) {
      var stepTick = false;
      var onStep = function () {
        if (stepTick) return;
        stepTick = true;
        requestAnimationFrame(function () {
          stepTick = false;
          var b = steps.getBoundingClientRect(), vh = window.innerHeight;
          // 0 когда верх списка на середине экрана, 1 когда низ дошёл до середины
          var p = (vh * 0.55 - b.top) / Math.max(b.height, 1);
          steps.style.setProperty('--lgl-p', Math.max(0, Math.min(1, p)).toFixed(3));
        });
      };
      window.addEventListener('scroll', onStep, { passive: true });
      window.addEventListener('resize', onStep, { passive: true });
      onStep();
    } else if (steps) {
      steps.style.setProperty('--lgl-p', '1');
    }

    /* ---------- шапка: уплотняется и подсвечивает текущий раздел ---------- */
    var top = root.querySelector('.lgl-top');
    var navLinks = root.querySelectorAll('.lgl-nav a');
    var targets = [];
    for (var n = 0; n < navLinks.length; n++) {
      var t = document.querySelector(navLinks[n].getAttribute('href'));
      if (t) targets.push({ link: navLinks[n], el: t });
    }
    var headTick = false;
    var onHead = function () {
      if (headTick) return;
      headTick = true;
      requestAnimationFrame(function () {
        headTick = false;
        var y = window.pageYOffset || document.documentElement.scrollTop;
        if (top) top.classList.toggle('lgl-stuck', y > 40);
        var cur = null;
        for (var i = 0; i < targets.length; i++) {
          if (targets[i].el.getBoundingClientRect().top <= window.innerHeight * 0.35) cur = targets[i];
        }
        for (var j = 0; j < targets.length; j++) targets[j].link.classList.toggle('lgl-cur', targets[j] === cur);
      });
    };
    window.addEventListener('scroll', onHead, { passive: true });
    onHead();

    /* ---------- форма заявки ----------
       Отправляем через fetch, чтобы человек остался на странице.
       Без JS форма работает обычным POST — обработчик отдаёт страницу
       с ответом, поэтому здесь ничего критичного не завязано. */
    var frm = root.querySelector('#lgl-form');
    if (frm) {
      var msg = root.querySelector('#lgl-form-msg');
      var btn = frm.querySelector('button[type=submit]');
      var pageField = frm.querySelector('input[name=page]');
      if (pageField) pageField.value = location.href;
      /* Штатную проверку браузера выключаем только здесь, при живом JS:
         её всплывашка пропадает от любого клика и не стилизуется, а свой
         текст остаётся под полем. Без JS required продолжает работать. */
      frm.noValidate = true;

      var say = function (ok, text) {
        if (!msg) return;
        msg.hidden = false;
        msg.setAttribute('data-ok', ok ? '1' : '0');
        msg.textContent = text;
      };
      var digits = function (s) { return (s.match(/\d/g) || []).length; };

      // Свои проверки вместо браузерных: нужен разбор по полям и текст рядом
      var check = function () {
        var bad = null;
        var fields = [
          { el: frm.name, test: function (v) { return v.trim().length >= 2; },
            err: 'Напишите, как к вам обращаться' },
          { el: frm.phone, test: function (v) { return digits(v) >= 10; },
            err: 'Телефон нужен целиком, с кодом города или оператора' }
        ];
        for (var i = 0; i < fields.length; i++) {
          var f = fields[i], wrap = f.el.parentNode;
          var old = wrap.querySelector('.lgl-f-err');
          if (old) wrap.removeChild(old);
          if (f.test(f.el.value)) { f.el.removeAttribute('aria-invalid'); continue; }
          f.el.setAttribute('aria-invalid', 'true');
          var p = document.createElement('span');
          p.className = 'lgl-f-err';
          p.textContent = f.err;
          wrap.appendChild(p);
          if (!bad) bad = f.el;
        }
        return bad;
      };

      frm.addEventListener('submit', function (e) {
        var bad = check();
        if (bad) { e.preventDefault(); bad.focus(); return; }
        if (!window.fetch || !window.FormData) return;   // старый браузер — обычный POST
        e.preventDefault();
        btn.disabled = true;
        var label = btn.textContent;
        btn.textContent = 'Отправляем…';
        fetch(frm.action, {
          method: 'POST', body: new FormData(frm),
          headers: { 'Accept': 'application/json' }
        }).then(function (r) {
          return r.json().catch(function () { return { ok: r.ok }; });
        }).then(function (d) {
          if (!d || !d.ok) throw new Error((d && d.error) || 'fail');
          frm.reset();
          say(true, 'Заявка ушла. Перезвоним или напишем в рабочее время.');
        }).catch(function () {
          say(false, 'Не отправилось. Напишите в WhatsApp или позвоните +7 771 501 77 75 — так быстрее.');
        }).then(function () {
          btn.disabled = false;
          btn.textContent = label;
        });
      });
    }

    /* ---------- липкая панель: после 30 % прокрутки, прячется у заявки ---------- */
    var sticky = root.querySelector('#lgl-sticky');
    var form = root.querySelector('#lgl-zayavka');
    if (sticky) {
      var links = sticky.querySelectorAll('a'), on = false, ticking = false;
      var set = function (v) {
        if (v === on) return;
        on = v;
        sticky.classList.toggle('lgl-on', v);
        sticky.setAttribute('aria-hidden', v ? 'false' : 'true');
        for (var i = 0; i < links.length; i++) links[i].tabIndex = v ? 0 : -1;
      };
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          var d = document.documentElement, max = d.scrollHeight - window.innerHeight;
          if (max <= 0) return set(false);
          var atForm = form && form.getBoundingClientRect().top < window.innerHeight * 0.9;
          set((window.pageYOffset || d.scrollTop) / max >= 0.3 && !atForm);
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      onScroll();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
