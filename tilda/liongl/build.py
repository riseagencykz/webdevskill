#!/usr/bin/env python3
"""Собирает preview.html из block.html.

    python3 tilda/liongl/build.py

block.html — единственный источник. preview.html только оборачивает его
в страницу с подключёнными шрифтами и двумя соседними «блоками Тильды»,
чтобы было видно, не протекают ли стили наружу.
"""
import pathlib

HERE = pathlib.Path(__file__).parent
HEAD = """<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lion Global Logistics — предпросмотр блока</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap&subset=cyrillic,latin" rel="stylesheet">
<style>
  /* Обёртка только для просмотра. На Тильде её нет. */
  body{margin:0;background:#fff;font-family:Georgia,serif;color:#333}
  .t-fake{padding:20px;background:#20242b;color:#9aa3ad;font:12px/1.5 monospace}
  .t-fake h3{font:600 17px/1.3 Georgia,serif;color:#fff;margin:0 0 6px}
  html{scroll-behavior:smooth}
</style>
</head>
<body>
<div class="t-fake"><h3>Соседний блок Тильды сверху</h3>
Свой шрифт и свои цвета. Если ниже что-то поехало — стили блока протекли наружу.</div>
"""
TAIL = """
<div class="t-fake"><h3>Соседний блок Тильды снизу</h3>
Тот же тест с другой стороны.</div>
</body>
</html>
"""


def main():
    block = (HERE / 'block.html').read_text(encoding='utf-8')
    (HERE / 'preview.html').write_text(HEAD + block + TAIL, encoding='utf-8')
    print('preview.html пересобран,', len(block), 'символов в блоке')


if __name__ == '__main__':
    main()
