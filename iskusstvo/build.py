#!/usr/bin/env python3
"""Пересобирает всё, что делается из index.html.

    python3 iskusstvo/build.py

Создаёт:
    tilda/tilda-blok.html          один блок для Тильды, всё внутри
    tilda/1-head.html … 4-body-end.html    вариант из четырёх кусков
    tilda/odnim-blokom/            блок + стили и скрипт отдельными файлами
    dist/iskusstvo-odnim-faylom.html       страница с вшитыми картинками

index.html правится руками, остальное — только отсюда.
"""
import base64
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'index.html'
FONTS = ('<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;800'
         '&family=Oswald:wght@500;700&display=swap" rel="stylesheet">')


def min_css(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = re.sub(r'\s*\n\s*', '', css)
    css = re.sub(r'\s*([{}:;,>])\s*', r'\1', css)
    return css.replace(';}', '}').strip()


def min_js(js):
    js = re.sub(r'/\*.*?\*/', '', js, flags=re.S)
    # только строки целиком из комментария: в коде есть 'https://'
    js = '\n'.join(l for l in js.split('\n') if not l.strip().startswith('//'))
    return '\n'.join(re.sub(r'[ \t]+', ' ', l).strip() for l in js.split('\n') if l.strip())


def min_html(html):
    html = re.sub(r'<!--(?!\[if).*?-->', '', html, flags=re.S)
    html = re.sub(r'\n\s*', ' ', html)          # в один пробел, не в ноль:
    return re.sub(r' {2,}', ' ', html).strip()  # между инлайновыми тегами он значим


def main():
    src = SRC.read_text(encoding='utf-8')
    css = min_css(re.search(r'<style>(.*?)</style>', src, re.S).group(1))
    js = min_js(re.search(r'<script>(.*?)</script>', src, re.S).group(1))

    body = re.search(r'<body>(.*?)</body>', src, re.S).group(1)
    body = re.sub(r'<script>.*?</script>', '', body, flags=re.S)
    # <main> убираем: разрезанный на два блока Тильды, он закроется сам
    body = body.replace('<main id="top">', '').replace('</main>', '')
    body = body.replace('<section class="hero">', '<section class="hero" id="top">', 1)

    header = min_html(re.search(r'<header class="top">.*?</header>', body, re.S).group(0))
    footer = min_html(re.search(r'<footer class="foot">.*?</footer>', body, re.S).group(0))
    sticky = min_html(re.search(r'<div class="sticky" id="sticky".*?</div>', body, re.S).group(0))
    secs = [min_html(m.group(0)) for m in re.finditer(r'<section[^>]*>.*?</section>', body, re.S)]
    markup = min_html(body)

    # делим секции пополам по объёму, а не по количеству: секции разного
    # размера, и деление по счёту оставляет один блок вдвое толще другого
    half = (sum(len(x) for x in secs) + len(header) + len(footer) + len(sticky)) / 2
    split, run = len(secs), len(header)
    for i, sec in enumerate(secs):
        if run + len(sec) / 2 > half:
            split = i
            break
        run += len(sec)

    t = ROOT / 'tilda'
    ob = t / 'odnim-blokom'
    ob.mkdir(parents=True, exist_ok=True)

    files = {
        t / 'tilda-blok.html': FONTS + '\n<style>' + css + '</style>\n' + markup + '\n<script>' + js + '</script>',
        t / '1-head.html': '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
                           + FONTS + '\n<style>' + css + '</style>',
        t / '2-block-a.html': header + ''.join(secs[:split]),
        t / '3-block-b.html': ''.join(secs[split:]) + footer + sticky,
        t / '4-body-end.html': '<script>' + js + '</script>',
        ob / 'styles.css': css,
        ob / 'app.js': js,
        ob / 'block.html': '<!-- Замените АДРЕС_CSS и АДРЕС_JS на ссылки файлов, загруженных в Тильду -->\n'
                           '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
                           + FONTS + '\n<link rel="stylesheet" href="АДРЕС_CSS">\n\n'
                           + markup + '\n\n<script src="АДРЕС_JS"></script>',
    }

    # страница с вшитыми картинками — открывается двойным кликом, кладётся на хостинг
    def inline(m):
        path = ROOT / m.group(1)
        mime = 'image/png' if m.group(1).endswith('.png') else 'image/jpeg'
        return 'src="data:%s;base64,%s"' % (mime, base64.b64encode(path.read_bytes()).decode())

    dist = ROOT / 'dist'
    dist.mkdir(exist_ok=True)
    files[dist / 'iskusstvo-odnim-faylom.html'] = re.sub(
        r'src="(assets/(?:img|art)/[^"]+)"', inline, src)

    for path, text in files.items():
        path.write_text(text, encoding='utf-8')
        print(str(path.relative_to(ROOT)).ljust(34), len(text), 'символов')


if __name__ == '__main__':
    main()
