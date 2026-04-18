<p align="center"><img src="./static/icon.png" alt="Logo" width="128" height="128" style="max-width: 100%;"></p>
<h1 align="center">風間の部屋</h1>
<p align="center">
  <img src="https://img.shields.io/badge/Nuxt.js-2.x-00C58E?logo=nuxt.js" alt="Nuxt.js" />
  <img src="https://img.shields.io/badge/Deployed-Cloudflare%20Pages-F38020?logo=cloudflare" alt="Cloudflare Pages" />
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT" />
</p>
<p align="center">
  <a href="#繁體中文">繁體中文</a> ｜ <a href="#日本語">日本語</a> ｜ <a href="#english">English</a>
</p>

---

## 繁體中文

個人首頁 — 附密碼保護的私人工具集合，部署於 Cloudflare Pages。

### ✨ 功能

- 🔐 **密碼驗證** — 登入保護、7天免登入選項，連續失敗5次鎖定30分鐘
- 🌸 **櫻花特效** — 登入頁與主頁飄落花瓣動畫，可調整顏色、速度與大小
- 🧩 **自訂模組** — 工具卡片新增、編輯、排序、顯示/隱藏
- 🎨 **主題與背景** — 深色模式、自訂背景圖片上傳至 Cloudflare R2
- ✨ **動畫效果** — anime.js 滾動入場、粒子效果、3D 傾斜
- 🤖 **Turnstile 驗證** — Cloudflare Turnstile 防機器人
- ☁️ **雲端同步** — 設定透過 Cloudflare Pages Functions 持久化儲存

### 🛠 技術棧

- [Nuxt.js 2](https://nuxtjs.org/) + Vue 2
- Vuex + vuex-persistedstate
- [anime.js v4](https://animejs.com/)
- Cloudflare Pages + Pages Functions + R2

### 🚀 開發

```bash
npm install
npm run dev
```

### 📦 建置

```bash
npm run generate
```

### ⚙️ 環境變數（Cloudflare Pages）

| 變數名 | 說明 |
|--------|------|
| `ACCESS_PASSWORD` | 登入密碼（SHA-256 雜湊或明文） |
| `TURNSTILE_SECRET` | Cloudflare Turnstile 密鑰 |
| `R2_BUCKET` | 背景圖片上傳用 R2 綁定名稱 |

---

## 日本語

個人ホームページ — パスワード保護付きのプライベートツール集。Cloudflare Pages にデプロイ。

### ✨ 機能

- 🔐 **パスワード認証** — ログイン保護、7日間免ログインオプション、5回連続失敗で30分ロック
- 🌸 **桜エフェクト** — ログイン画面・メイン画面に舞い散る花びらアニメーション（色・速度・サイズ調整可能）
- 🧩 **カスタムモジュール** — ツールカードの追加・編集・並び替え・表示/非表示
- 🎨 **テーマ & 背景** — ダークモード、R2 へのカスタム背景画像アップロード
- ✨ **アニメーション** — anime.js によるスクロール入場エフェクト、パーティクル、3D 傾き
- 🤖 **Turnstile 認証** — Cloudflare Turnstile による Bot 対策
- ☁️ **クラウド同期** — 設定を Cloudflare Pages Functions 経由で永続化

### 🛠 技術スタック

- [Nuxt.js 2](https://nuxtjs.org/) + Vue 2
- Vuex + vuex-persistedstate
- [anime.js v4](https://animejs.com/)
- Cloudflare Pages + Pages Functions + R2

### 🚀 開発

```bash
npm install
npm run dev
```

### 📦 ビルド

```bash
npm run generate
```

### ⚙️ 環境変数（Cloudflare Pages）

| 変数名 | 説明 |
|--------|------|
| `ACCESS_PASSWORD` | ログインパスワード（SHA-256 ハッシュ or 平文） |
| `TURNSTILE_SECRET` | Cloudflare Turnstile シークレットキー |
| `R2_BUCKET` | 背景画像アップロード用 R2 バインディング名 |

---

## English

A personal homepage with password protection and a private toolset, deployed on Cloudflare Pages.

### ✨ Features

- 🔐 **Password Auth** — Login protection with a 7-day remember option; 5 failed attempts trigger a 30-minute lockout
- 🌸 **Sakura Effect** — Falling petal animations on the login and main pages (color, speed & size configurable)
- 🧩 **Custom Modules** — Add, edit, reorder, and show/hide tool cards
- 🎨 **Theme & Background** — Dark mode, custom background image upload to Cloudflare R2
- ✨ **Animations** — anime.js scroll reveal, particles, and 3D tilt effects
- 🤖 **Turnstile CAPTCHA** — Cloudflare Turnstile bot protection
- ☁️ **Cloud Sync** — Settings persisted via Cloudflare Pages Functions

### 🛠 Tech Stack

- [Nuxt.js 2](https://nuxtjs.org/) + Vue 2
- Vuex + vuex-persistedstate
- [anime.js v4](https://animejs.com/)
- Cloudflare Pages + Pages Functions + R2

### 🚀 Development

```bash
npm install
npm run dev
```

### 📦 Build

```bash
npm run generate
```

### ⚙️ Environment Variables (Cloudflare Pages)

| Variable | Description |
|----------|-------------|
| `ACCESS_PASSWORD` | Login password (SHA-256 hash or plaintext) |
| `TURNSTILE_SECRET` | Cloudflare Turnstile secret key |
| `R2_BUCKET` | R2 binding name for background image uploads |

---

<p align="center">MIT License</p>
