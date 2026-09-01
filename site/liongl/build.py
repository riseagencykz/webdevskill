#!/usr/bin/env python3
"""Собирает site/liongl/index.html из трёх кусков рядом с собой.

    python3 site/liongl/build.py

Куски:
    parts/head.html   — <head> целиком
    parts/style.css   — стили
    parts/body.html   — разметка
    parts/app.js      — скрипт

Разложено по файлам, чтобы страницу было чем править: одним файлом
на 60 КБ пользоваться неудобно.
"""
import pathlib

HERE = pathlib.Path(__file__).parent
P = HERE / 'parts'


def main():
    head = (P / 'head.html').read_text(encoding='utf-8').rstrip()
    css = (P / 'style.css').read_text(encoding='utf-8').strip()
    body = (P / 'body.html').read_text(encoding='utf-8').strip()
    js = (P / 'app.js').read_text(encoding='utf-8').strip()

    page = (
        '<!DOCTYPE html>\n<html lang="ru">\n<head>\n'
        + head + '\n<style>\n' + css + '\n</style>\n</head>\n<body>\n'
        + body + '\n<script>\n' + js + '\n</script>\n</body>\n</html>\n'
    )
    out = HERE / 'index.html'
    out.write_text(page, encoding='utf-8')
    print('index.html собран:', round(len(page.encode()) / 1024, 1), 'КБ')


if __name__ == '__main__':
    main()
