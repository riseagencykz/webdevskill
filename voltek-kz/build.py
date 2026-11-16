#!/usr/bin/env python3
"""Собирает site/index.html из src/index.src.html и data/models.json.

    python3 build.py

Фото моделей: если файл лежит в site/assets/products/<имя>.jpg — берётся
локальный, иначе подставляется фото с сайта voltek-electro.ru, а если и оно
не загрузится — нарисованная заглушка assets/img/unit-*.svg.
"""
import datetime
import html
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
SITE = ROOT / "site"
MODELS = json.loads((ROOT / "data" / "models.json").read_text("utf-8"))

# Типовые мощности приборов: (id, название, Вт, пусковой множитель)
APPLIANCES = [
    ("fridge", "Холодильник", 200, 3),
    ("boiler", "Газовый котёл", 150, 2),
    ("pump", "Скважинный насос", 1000, 3),
    ("ac", "Кондиционер", 1200, 3),
    ("wash", "Стиральная машина", 2000, 1),
    ("heater", "Водонагреватель", 2000, 1),
    ("kettle", "Чайник / микроволновка", 1500, 1),
    ("tv", "Телевизор, роутер", 200, 1),
    ("pc", "Компьютер", 400, 1),
    ("light", "Освещение", 300, 1),
    ("cctv", "Видеонаблюдение, сервер", 300, 1),
    ("tools", "Электроинструмент", 1500, 2),
]

e = html.escape


def num(x):
    s = f"{x:g}"
    return s.replace(".", ",")


def appliances_html():
    out = []
    for aid, name, w, k in APPLIANCES:
        start = f'<small>пуск ×{k}</small>' if k > 1 else ""
        ws = f"{w:,}".replace(",", "&#8239;")
        out.append(
            f'<label class="ap"><input type="checkbox" name="ap" value="{aid}" '
            f'data-w="{w}" data-k="{k}"><span class="ap__name">{e(name)}</span>'
            f'<span class="ap__w">{ws}&nbsp;Вт{start}</span></label>'
        )
    return "\n        ".join(out)


def photo(m):
    local = SITE / "assets" / "products" / m["photo"]
    return f'assets/products/{m["photo"]}' if local.exists() else m["photo_remote"]


def card(m):
    is_is = m["series"] == "is"
    fb = "assets/img/unit-is.svg" if is_is else "assets/img/unit-tch.svg"
    series = "Инверторный" if is_is else "Тиристорный"
    full = f'Voltek {m["name"]}'
    rows = [
        ("Тип", "инверторный, двойное преобразование" if is_is else "тиристорный, электронный"),
        ("Мощность", f'{m["kva"]} кВА ({m["kw"]} кВт)'),
        ("Максимальный ток", f'{num(m["imax"])} А'),
        ("Вход", m["input"]),
        ("Выход", m["output"]),
        ("Частота сети", m["freq"]),
        ("Скорость реакции", m["reaction"]),
        ("Байпас", m["bypass"]),
        ("Подключение", m["connect"]),
        ("Перегрузка", m["overload"]),
        ("Охлаждение", m["cooling"]),
        ("Защита", m["protect"]),
        ("Потребление без нагрузки", f'{m["idle"]} Вт'),
        ("Температура работы", m["temp"]),
        ("Класс защиты", m["ip"]),
        ("Габариты (В×Ш×Г)", f'{m["dims"]} мм'),
        ("Вес нетто", f'{num(m["weight"])} кг'),
        ("Артикул", m["sku"]),
        ("EAN-13", m["ean"]),
        ("Гарантия", m["warranty"]),
    ]
    table = "".join(f"<tr><th scope=\"row\">{e(k)}</th><td>{e(v)}</td></tr>" for k, v in rows)
    plug = "в розетку" if "вилка" in m["connect"] else "на клеммы"
    return f'''<article class="card card--{m["series"]}" id="m-{m["id"]}" data-series="{m["series"]}">
        <div class="card__img"><img src="{e(photo(m))}" alt="Стабилизатор напряжения {e(full)}" width="400" height="300" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='{fb}';this.classList.add('is-fb')"></div>
        <div class="card__body">
          <p class="card__series">{series} · {"IS" if is_is else "ТСН"}</p>
          <h3 class="card__name">{e(m["name"])}</h3>
          <p class="card__power"><b>{m["kva"]}&nbsp;кВА</b><span>{m["kw"]}&nbsp;кВт</span></p>
          <dl class="card__keys">
            <div><dt>Вход</dt><dd>{e(m["input"])}</dd></div>
            <div><dt>Выход</dt><dd>{e(m["output"])}</dd></div>
            <div><dt>Подключение</dt><dd>{plug}</dd></div>
            <div><dt>Вес</dt><dd>{num(m["weight"])}&nbsp;кг</dd></div>
            <div><dt>Гарантия</dt><dd>{e(m["warranty"])}</dd></div>
          </dl>
          <details class="card__more"><summary>Все характеристики</summary><table>{table}</table></details>
          <a class="btn btn--line btn--block" href="#zayavka" data-ask="{e(full)}">Узнать цену</a>
        </div>
      </article>'''


def models_json():
    slim = [dict(id=m["id"], series=m["series"], name=m["name"], kva=m["kva"], kw=m["kw"],
                 kw_min=m["kw_min"], plug="вилка" in m["connect"]) for m in MODELS]
    return json.dumps(slim, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def main():
    src = (ROOT / "src" / "index.src.html").read_text("utf-8")
    ver = datetime.date.today().strftime("%Y%m%d")
    out = (src.replace("{{CARDS}}", "\n      ".join(card(m) for m in MODELS))
              .replace("{{APPLIANCES}}", appliances_html())
              .replace("{{MODELS_JSON}}", models_json())
              .replace("{{YEAR}}", str(datetime.date.today().year))
              .replace("{{VER}}", ver))
    assert "{{" not in out, "незаменённый плейсхолдер"
    (SITE / "index.html").write_text(out, "utf-8")
    print(f"site/index.html — {len(out)//1024} КБ, моделей: {len(MODELS)}")


if __name__ == "__main__":
    main()
