(function () {
'use strict';
var WA_PHONE = '77773231144';
var WA_TEXT = 'Здравствуйте! Хочу узнать про курс тату-мастера';
var WA_TAG_SOURCE = true;
var KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','ttclid'];
var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function waHref() {
var qs, tag = '';
try { qs = new URLSearchParams(window.location.search); } catch (e) { qs = null; }
var vals = {};
KEYS.forEach(function (k) {
var v = qs ? (qs.get(k) || '') : '';
try {
if (v) sessionStorage.setItem('isk_' + k, v);
else v = sessionStorage.getItem('isk_' + k) || '';
} catch (e) {}
vals[k] = v;
});
var text = WA_TEXT;
if (WA_TAG_SOURCE) {
tag = vals.utm_content || vals.utm_campaign || vals.utm_source || '';
if (tag) text += ' #' + tag.replace(/[^\w-]/g, '').slice(0, 24);
}
return 'https://api.whatsapp.com/send/?phone=' + WA_PHONE +
'&text=' + encodeURIComponent(text) + '&type=phone_number&app_absent=0';
}
var links = document.querySelectorAll('[data-wa]');
for (var i = 0; i < links.length; i++) links[i].href = waHref();
document.addEventListener('click', function (e) {
if (!e.target.closest('[data-wa]')) return;
try { if (window.ttq && ttq.track) ttq.track('Contact'); } catch (err) {}
try { if (window.fbq) fbq('track', 'Contact'); } catch (err) {}
});
if (!reduced && 'IntersectionObserver' in window) {
document.documentElement.classList.add('js');
var io = new IntersectionObserver(function (en) {
en.forEach(function (x) {
if (!x.isIntersecting) return;
var it = x.target.querySelectorAll('.rv');
for (var j = 0; j < it.length; j++) {
it[j].style.transitionDelay = (Math.min(j, 6) * 55) + 'ms';
it[j].classList.add('in');
}
io.unobserve(x.target);
});
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
var secs = document.querySelectorAll('section, footer');
for (var s = 0; s < secs.length; s++) io.observe(secs[s]);
var t;
window.addEventListener('scroll', function () {
clearTimeout(t);
t = setTimeout(function () {
var left = document.querySelectorAll('.rv:not(.in)');
for (var k = 0; k < left.length; k++) {
var h = left[k].closest('section, footer');
if (h && h.getBoundingClientRect().top < window.innerHeight) left[k].classList.add('in');
}
}, 200);
}, { passive: true });
}
var cs = document.querySelectorAll('[data-count]');
if (cs.length && !reduced && 'IntersectionObserver' in window) {
var cio = new IntersectionObserver(function (en) {
en.forEach(function (x) {
if (!x.isIntersecting) return;
var el = x.target; cio.unobserve(el);
var target = parseInt(el.getAttribute('data-count'), 10);
if (isNaN(target)) return;
var suf = el.getAttribute('data-suffix') || '', st = null;
(function tick(ts) {
if (st === null) st = ts;
var p = Math.min((ts - st) / 900, 1);
el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suf;
if (p < 1) requestAnimationFrame(tick);
})(performance.now());
});
}, { threshold: 0.6 });
for (var c = 0; c < cs.length; c++) cio.observe(cs[c]);
}
var st = document.getElementById('sticky');
if (st) {
var btn = st.querySelector('a'), on = false, tick = false;
function set(v) {
if (v === on) return;
on = v;
st.classList.toggle('on', v);
st.setAttribute('aria-hidden', v ? 'false' : 'true');
if (btn) btn.tabIndex = v ? 0 : -1;
}
function onScroll() {
if (tick) return;
tick = true;
requestAnimationFrame(function () {
tick = false;
var d = document.documentElement, sc = d.scrollHeight - window.innerHeight;
if (sc <= 0) return set(false);
var fin = document.querySelector('.final');
var atEnd = fin && fin.getBoundingClientRect().top < window.innerHeight * 0.9;
set((window.pageYOffset || d.scrollTop) / sc >= 0.35 && !atEnd);
});
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
onScroll();
}
})();