# Wick Bot 日本語化

`wickbot.com` と `dashboard.wickbot.com` を自然な日本語に翻訳する、Chrome / Firefox 用の非公式ブラウザ拡張機能です。

- Manifest V3 / V2 両対応（Chrome MV3、Firefox MV2）
- 機能別 JSON 辞書 + テンプレートで翻訳を保守
- MutationObserver で動的な DOM 変化にも追従
- ダッシュボードのサーバー名・ID・数値などの可変要素は触りません

## 開発

```sh
node scripts/build.mjs
```

`build/chrome/` と `build/firefox/` に拡張ファイルが出力されます。

### 拡張を読み込む

- **Chrome**: 拡張機能ページ → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」で `build/chrome/` を指定
- **Firefox**: `about:debugging` → 「このFirefox」→ 「一時的なアドオンを読み込む」で `build/firefox/manifest.json` を指定

### アイコン再生成

```sh
python3 scripts/make-icons.py
```

## 辞書構造

```
src/translations/
  glossary.json              用語集（全ドメインに適用）
  templates.json             正規表現テンプレート（数値や動的部分の置換）
  title-patterns.json        document.title 用
  landing.json               wickbot.com 用
  dashboard-common.json      ダッシュボード共通
  dashboard-automod.json     /automod/general
  dashboard-automod-filters.json
  dashboard-automod-discord.json
  dashboard-automod-whitelist.json
  dashboard-antinuke.json    /antinuke/general
  dashboard-antinuke-filters.json
  dashboard-joingate.json    /joingate/general
  dashboard-verification.json
  dashboard-misc.json
  dashboard-permits.json
  dashboard-logging.json
  dashboard-lockdown.json
  dashboard-appeals.json
  dashboard-appeals-settings.json
  dashboard-wizard.json
  dashboard-strings.json     JS バンドルから抽出した広範な UI 文字列
```

各 JSON の構造:

```json
{
  "scope": ["wickbot.com"],
  "entries": { "English": "日本語" },
  "multiline": [
    { "lines": ["line 1", "line 2"], "ja": "改行を吸収した訳文" }
  ],
  "titles": { "Wick Bot - X": "Wick Bot - X 日本語" }
}
```

ビルド時に空白を正規化し、ドメインごとの辞書バンドル `dictionary.js` を生成します。

## 翻訳を追加する

1. 該当する `src/translations/*.json` を編集（無ければ新規追加し、scope を指定）
2. `node scripts/build.mjs` でビルド
3. 拡張をリロード

## ライセンス

MIT。Wick Bot 本体および wickbot.com とは無関係の非公式拡張です。
