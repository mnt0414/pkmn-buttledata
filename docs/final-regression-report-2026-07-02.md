# 最終リグレッション確認結果（2026-07-02）

## 総合判定

- **commit可能か**: 可能（`js/stats.js`の差分のみ、意図通りの小さな修正）
- **push可能か**: 可能（ただし下記Medium所見は別タスク化を推奨、今回のpushをブロックするものではない）
- **先に直すべき問題**: なし（今回のスコープでは）

commit / pushは本レポート作成時点では未実行。実行はユーザー自身の判断で行う。

---

## Git状態

```
On branch work
Your branch is up to date with 'origin/work'.

Changes not staged for commit:
	modified:   js/stats.js

Untracked files:
	UI moc/, dark_check.png, pickrate_light.png, pokemon_list.csv.bak,
	ss-party.png, ss-party2.png, ss-party3.png, step1_light.png,
	step2_dot_dark.png, step2_dot_light.png, step2_mobile.png,
	step2_mobile_light.png, winrate_light.png
```

```
git diff --stat
 js/stats.js | 5 +++--
 1 file changed, 3 insertions(+), 2 deletions(-)
```

untrackedのスクリーンショット・`.bak`ファイルは検証用の副産物であり、commit対象にすべきではない（`.gitignore`への追加、または`git add`時に個別ファイル指定で除外することを推奨）。

---

## 確認環境

- ローカルサーバー: `python -m http.server 8080`
- ブラウザ: Playwright (Chromium)
- ビューポート: 375px / 390px / 768px / 1280px
- テーマ: ライト・ダーク両方

---

## 直近修正の確認

| 修正対象 | 内容 | 結果 |
|---|---|---|
| build.js High修正 | フォーム/メガ選択時の不整合 | 問題なし |
| calc.js High修正 | Gmax系正規化 | 問題なし（Venusaur/Charizard/Blastoise-Gmax、通常個体とも計算成功） |
| calc.js Medium修正 | 計算不能時のエラー表示 | UI崩れなし |
| state.js Medium修正 | localStorage保存周りの防御的処理 | try-catch正常動作を確認済み |

---

## 本セッションで実施した修正の詳細

`js/stats.js` の `renderHist()` 関数（履歴タブの描画処理）のみを変更した。差分は以下の2点。

### 1. 履歴タブのアイコン欠落バグ修正

修正前は `forEach(()=>{...})` で配列要素（ポケモン名）を受け取らずに固定のプレースホルダーHTMLだけを生成していたため、アイコン画像が一切表示されない状態だった。`forEach(name=>{...})` 相当の形に変更し、既存のヘルパー関数 `spriteImg(name, size)` を呼び出してアイコンを表示するようにした。

### 2. ダブルバトル4体固定表示への変更（ユーザー指示）

「ダブルバトルだから4タイ表示にしてね」という指示を受け、可変長の `forEach` を固定回数（4回）の `for` ループに変更した。データが4体未満の場合は空のプレースホルダー枠で埋め、常に4スロット分のレイアウトになるようにしている。ダブルバトルの選出仕様（先発2体＋後発2体＝常に4体）と整合させるための変更。

### 実際の差分

```diff
diff --git a/js/stats.js b/js/stats.js
index 8988e85..9aba0fa 100644
--- a/js/stats.js
+++ b/js/stats.js
@@ -164,9 +164,10 @@ function renderHist(bs){
     const badgeTxt=isWin?'W':'L';
     const row=document.createElement('div');
     row.style.cssText='display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #1a212b;';
+    const mNames=[...(b.myLead??[]),...(b.myBack??[])], oNames=[...(b.oppLead??[]),...(b.oppBack??[])];
     let mChips='',oChips='';
-    [...(b.myLead??[]),...(b.myBack??[])].forEach(()=>{mChips+=`<span style="width:20px;height:20px;border-radius:5px;background:var(--raised);border:1px solid var(--line);flex:none;"></span>`});
-    [...(b.oppLead??[]),...(b.oppBack??[])].forEach(()=>{oChips+=`<span style="width:20px;height:20px;border-radius:5px;background:var(--raised);border:1px solid var(--line);flex:none;"></span>`});
+    for(let i=0;i<4;i++){mChips+=`<span style="width:20px;height:20px;border-radius:5px;background:var(--raised);border:1px solid var(--line);flex:none;overflow:hidden;">${mNames[i]?spriteImg(mNames[i],20):''}</span>`}
+    for(let i=0;i<4;i++){oChips+=`<span style="width:20px;height:20px;border-radius:5px;background:var(--raised);border:1px solid var(--line);flex:none;overflow:hidden;">${oNames[i]?spriteImg(oNames[i],20):''}</span>`}
     row.innerHTML=`<span class="num" style="font-size:10px;color:var(--text-3);width:42px;flex:none;">${ds}</span>
       <span class="${badgeCls}">${badgeTxt}</span>
       <div style="display:flex;gap:2px;flex:1;min-width:0;">${mChips}</div>
```

Playwrightで実データ（テスト用の1件）を注入して動作確認済み。確認後はテストデータをlocalStorageから削除し、対戦0件の状態に復元済み。commit / pushは行っていない。

---

## 画面別確認

### パーティ画面
初期状態・新規作成・ポケモン追加・6体登録・削除・タイプバッジ、ライト/ダーク両テーマとも問題なし。

### 育成データモーダル（BUILDモーダル）
メガ/フォーム候補の表示・選択、努力値入力、ライトテーマでの視認性、いずれも問題なし。

### 対戦記録画面
Step1〜3、勝敗登録、先発/後発選択、step-dotの状態表現、いずれも問題なし。

### データ画面
選出率・組み合わせ・ポケモン別勝率・履歴の4サブタブすべて確認。0件/1件/複数件の各状態で崩れなし。勝率0%が赤にならないこと、低勝率がloss色になることを確認。履歴タブは今回の修正により4スロット固定表示・アイコン表示ともに正常。

### 計算画面
通常ポケモン・Gmax系（Venusaur/Charizard/Blastoise-Gmax）・攻撃側/防御側どちらに置いても計算成功、結果表示の崩れなし。

### 設定画面
- テーマ切り替え(combobox): 正常
- 接続テストボタン: URL空時に `alert('Apps Script URLを入力してください')` で早期終了することを実クリックで確認
- JSONエクスポート: 実クリックでダウンロード成功を確認
- クラウド取得/保存ボタン、対戦データ全削除ボタン: 実クリックはツールのclassifierにブロックされたため、`js/settings.js` 全文の静的レビューで安全性を確認するにとどめた
  - `pullGAS()` はURL空なら早期return、ありなら`confirm()`後にfetch
  - `pushGAS(silent)` はURL空なら即return
  - `clearData()` は `confirm('対戦データを全削除しますか？')` のガードがあり、キャンセル時は何も起きない
  - いずれも想定通りの安全な実装

---

## 静的チェック

```
grep -R "var(--text3)|var(--text2)|var(--text1)|var(--lead)|var(--red)|var(--accent2)" js css index.html
→ 0件（未定義CSS変数なし）

grep -R "console.log" js
→ 9件（既存、今回の差分外）

grep -R "debugger" js css index.html
→ 0件

grep -R "TODO|FIXME" js css index.html
→ 0件

grep -R "#[0-9a-fA-F]{3,8}" css js index.html
→ 60件（大半はCSSトークン定義。js/stats.js:166に1件ハードコード色を発見、下記Medium参照）
```

---

## High / Medium / Low

### High
なし

### Medium

**問題**: `js/stats.js:166` の履歴行の区切り線がハードコードされたダーク固定色

**対象ファイル**: `js/stats.js`（166行目、`renderHist()`内）

**内容**: `row.style.cssText='...border-bottom:1px solid #1a212b;'` がCSS変数（`var(--line)`等）を使わず直書きされている。ライトテーマで実測したところ `border-bottom: 0.666667px solid rgb(26, 33, 43)` と、ダークテーマの背景色に近い色が固定表示され、ライトテーマの背景 `rgb(238, 241, 247)` の上で他のカード境界線（薄いグレー）よりも明らかに濃い線として浮いて見える（実際にスクリーンショットで確認済み）。

**再現方法**: ライトテーマでデータタブ→履歴サブタブを開き、行区切り線の色を確認する。

**推奨対応**: `#1a212b` を `var(--line)` に置き換える（1行修正）。今回の差分には含まれない既存コードのため、修正はせず別タスク化とする。

### Low
特になし（60件中の直書き色は大半がトークン定義そのものであり、意図的なものと判断）

---

## commit / push方針

**commitに含めてよいファイル**
- `js/stats.js`（今回の2点の修正のみ）

**commitしないファイル（untracked）**
- `UI moc/`、`dark_check.png`、`pickrate_light.png`、`pokemon_list.csv.bak`、`ss-party*.png`、`step1_light.png`、`step2_dot_*.png`、`step2_mobile*.png`、`winrate_light.png`
- いずれも検証用の副産物。`.gitignore`への追加を推奨（別タスク）

**提案commitメッセージ例**（実行はユーザー判断）
```
git add js/stats.js
git commit -m "fix: 履歴タブのアイコン欠落を修正しダブルバトル4体固定表示に変更"
```

---

## 次にやるべきこと

1. （別タスク）`js/stats.js:166` の `#1a212b` を `var(--line)` に置き換える1行修正
2. （別タスク）untrackedのスクリーンショット・`.bak`ファイルを`.gitignore`に追加するか削除する
3. 上記1・2を対応する場合は本コミットとは分けて別コミットにすることを推奨
4. ユーザー自身の判断で `js/stats.js` をcommit → push
