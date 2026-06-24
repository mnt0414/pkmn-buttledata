#!/usr/bin/env python3
import re
import json
import html as html_module
import subprocess
from pathlib import Path

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

def fetch_url(url):
    result = subprocess.run(
        ['curl', '-sL', '-A', UA, url],
        capture_output=True, timeout=15
    )
    return result.stdout.decode('euc-jp', errors='replace')

# ============ (1) 技の変更 ============
print("[moves] 取得・抽出中...")
moves_html = fetch_url("https://yakkun.com/ch/move_changes.htm")

moves = {}
tr_pattern = r'<tr><td[^>]*><a[^>]*class="move"[^>]*>([^<]+)</a></td><td>([^<]+)</td></tr>'
for match in re.finditer(tr_pattern, moves_html):
    move_name = match.group(1)
    change_text = match.group(2)

    entry = {}

    power_match = re.search(r'威力(\d+)→(\d+)', change_text)
    if power_match:
        entry['basePower'] = int(power_match.group(2))

    acc_match = re.search(r'命中(\d+)→(\d+)', change_text)
    if acc_match:
        entry['accuracy'] = int(acc_match.group(2))

    entry['note'] = change_text

    if entry:
        moves[move_name] = entry

print(f"[moves] {len(moves)}件抽出")

# ============ (2) 新しい特性 ============
print("[abilities] 取得・抽出中...")
abilities_html = fetch_url("https://yakkun.com/ch/ability_list.htm?new=1")

abilities = {}
# テーブルのTRを探す（最初のTRはヘッダー）
tr_pattern = r'<tr[^>]*>.*?<td[^>]*><a[^>]*>([^<]+)</a></td><td>(.*?)</td></tr>'
for match in re.finditer(tr_pattern, abilities_html, re.DOTALL):
    ability_name = match.group(1).strip()
    effect_html = match.group(2)

    # HTMLタグを除去して効果テキストを抽出
    effect_text = re.sub(r'<[^>]+>', ' ', effect_html)
    effect_text = html_module.unescape(effect_text)
    effect_text = re.sub(r'\s+', ' ', effect_text).strip()

    if ability_name and effect_text:
        entry = {'effect': effect_text}

        # 威力倍率系: 「◯◯タイプの技が△倍」
        type_mult = re.search(r'タイプの技が([\d.]+)倍', effect_text)
        if type_mult:
            mult_val = float(type_mult.group(1))
            # タイプ名を前から抽出
            type_match = re.search(r'(\w+)タイプの技が' + re.escape(str(mult_val)) + r'倍', effect_text)
            if type_match:
                entry['type'] = type_match.group(1)
                entry['mult'] = mult_val

        # 技タイプ変更: 「◯◯技が△△技になり威力△倍」
        type_change = re.search(r'(\w+)技が(\w+)技になり威力([\d.]+)倍', effect_text)
        if type_change:
            entry['fromType'] = type_change.group(1)
            entry['toType'] = type_change.group(2)
            entry['mult'] = float(type_change.group(3))

        abilities[ability_name] = entry

print(f"[abilities] {len(abilities)}件抽出")

# ============ (3) 新メガシンカポケモン ============
print("[megas] 取得・抽出中...")
megas_html = fetch_url("https://yakkun.com/ch/zukan/new_mega/")

megas = {}
# <li data-mega ...>...</li> 形式のLIを探す
# LIタグの構造: <li data-id="..." data-mega ...><div class="name">...メガ◯◯◯...</div>...
li_pattern = r'<li[^>]*data-mega[^>]*>(.*?)</li>'
for li_match in re.finditer(li_pattern, megas_html, re.DOTALL):
    li_content = li_match.group(1)

    # ポケモン名を抽出（<div class="name">内）
    name_match = re.search(r'<div class="name">.*?<a[^>]*>.*?>([^<]+(?:メガ[^<]*)?)</a>', li_content)
    if not name_match:
        continue

    pokemon_name = name_match.group(1).strip()

    # 種族値を抽出（<div class="stats">内の<span>数値</span>）
    stats_pattern = r'<div class="stats"><span>(\d+)</span>-<span>(\d+)</span>-<span>(\d+)</span>-<span>(\d+)</span>-<span>(\d+)</span>-<span>(\d+)</span></div>'
    stats_match = re.search(stats_pattern, li_content)
    if not stats_match:
        continue

    stats_values = [int(stats_match.group(i)) for i in range(1, 7)]
    entry = {
        'baseStats': {
            'H': stats_values[0],
            'A': stats_values[1],
            'B': stats_values[2],
            'C': stats_values[3],
            'D': stats_values[4],
            'S': stats_values[5]
        }
    }

    # タイプを抽出（<div class="type">内の画像altテキスト）
    type_pattern = r'<div class="type">(.*?)</div>'
    type_match = re.search(type_pattern, li_content, re.DOTALL)
    if type_match:
        type_html = type_match.group(1)
        types = []
        type_names = ['ノーマル', 'ほのお', 'みず', 'でんき', 'くさ', 'こおり', 'かくとう', 'どく', 'じめん',
                      'ひこう', 'エスパー', 'むし', 'いわ', 'ゴースト', 'ドラゴン', 'あく', 'はがね', 'フェアリー']
        for ttype in type_names:
            if f'alt="{ttype}"' in type_html or f"alt='{ttype}'" in type_html:
                types.append(ttype)

        if types:
            entry['types'] = types

    # 特性を抽出（<div class="ability">内のリンク）
    ability_pattern = r'<div class="ability">(.*?)</div>'
    ability_match = re.search(ability_pattern, li_content, re.DOTALL)
    if ability_match:
        ability_html = ability_match.group(1)
        abilities_list = re.findall(r'>([^<]+)</a>', ability_html)
        if abilities_list:
            entry['abilities'] = abilities_list

    # new_mega URLなので全て新規フラグを付ける
    entry['new'] = True

    megas[pokemon_name] = entry

print(f"[megas] {len(megas)}件抽出")

# ============ JSON出力 ============
output = {
    "moves": moves,
    "abilities": abilities,
    "megas": megas
}

output_path = Path("data/champions_overlay.json")
output_path.parent.mkdir(parents=True, exist_ok=True)

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n[完了] {output_path}")
print(f"  moves: {len(moves)}件")
print(f"  abilities: {len(abilities)}件")
print(f"  megas: {len(megas)}件")

# サンプル表示
if moves:
    print("\n[moves] サンプル:")
    for k, v in list(moves.items())[:2]:
        print(f"  {k}: {v}")

if abilities:
    print("\n[abilities] サンプル:")
    for k, v in list(abilities.items())[:2]:
        print(f"  {k}: {v}")

if megas:
    print("\n[megas] サンプル:")
    for k, v in list(megas.items())[:2]:
        print(f"  {k}: {v}")
