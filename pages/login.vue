<template>
    <div class="login-page" :class="{ dark: $store.state.dark, 'has-loginbg': $store.state.setting.loginBg.type !== 'none' }">
        <div
            v-if="$store.state.setting.loginBg.type !== 'none'"
            class="login-bgimg"
            :style="{
                'background-image': `url(${loginBgImage})`,
                'filter': `blur(${$store.state.setting.loginBg.blur}px)`,
                'opacity': $store.state.setting.loginBg.opacity / 100
            }"
        ></div>
        <div class="login-card">
            <div class="login-header">
                <div class="login-title-wrap">
                    <img src="/title-bg.png" class="login-title-bg" alt="" />
                    <div class="login-title-content">
                        <img src="/login-avatar.gif" class="login-avatar" alt="" />
                        <h1 class="login-title">風間の部屋</h1>
                    </div>
                </div>
            </div>

            <div class="login-body">
                <div class="login-lock-icon">
                    <i data-eva="lock-outline" data-eva-fill="#249ffd" data-eva-width="48" data-eva-height="48"></i>
                </div>

                <form @submit.prevent="handleLogin">
                    <div class="login-input-wrap">
                        <input
                            v-model="password"
                            type="password"
                            class="login-input"
                            placeholder="パスワードを入力してください"
                            autofocus
                            autocomplete="current-password"
                            :disabled="isLocked || loading"
                            @keyup.enter="handleLogin"
                        />
                    </div>

                    <label class="login-remember">
                        <input v-model="remember" type="checkbox" :disabled="isLocked" />
                        <span>7日間ログイン状態を保持する</span>
                    </label>

                    <div ref="turnstileEl" class="turnstile-wrap"></div>

                    <p v-if="isLocked" class="login-error login-locked">
                        <i data-eva="lock-outline" data-eva-width="14" data-eva-height="14"></i>
                        {{ lockText }}
                    </p>
                    <p v-else-if="error" class="login-error">
                        <i data-eva="alert-circle-outline" data-eva-width="14" data-eva-height="14"></i>
                        {{ error }}
                    </p>

                    <button type="submit" class="login-btn" :class="{ loading: loading || isLocked }" :disabled="isLocked || loading">
                        {{ loading ? '認証中...' : '入る' }}
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
import { COLOR_PRESETS } from '~/components/SetSakura';
import { animate } from '~/assets/js/anime.esm.min.js';

const REMEMBER_KEY = 'miku_remember_until';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const ATTEMPTS_KEY = 'miku_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 30 * 60 * 1000;

async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isHash(str) {
    return /^[0-9a-f]{64}$/.test(str);
}

function getAttempts() {
    try {
        const raw = localStorage.getItem(ATTEMPTS_KEY);
        if (!raw) return { count: 0, lockUntil: 0 };
        const d = JSON.parse(raw);
        if (d.lockUntil && Date.now() >= d.lockUntil) {
            localStorage.removeItem(ATTEMPTS_KEY);
            return { count: 0, lockUntil: 0 };
        }
        return d;
    } catch (e) { return { count: 0, lockUntil: 0 }; }
}

function recordFail() {
    const d = getAttempts();
    const count = d.count + 1;
    const lockUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCK_DURATION : 0;
    try { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify({ count, lockUntil })); } catch (e) {}
    return { count, lockUntil };
}

function clearAttempts() {
    try { localStorage.removeItem(ATTEMPTS_KEY); } catch (e) {}
}

export default {
    name: 'Login',
    layout: 'blank',
    data() {
        return {
            password: '',
            error: '',
            loading: false,
            remember: false,
            lockRemaining: 0,
            attemptsLeft: MAX_ATTEMPTS,
            turnstileToken: '',
            _sakura: null
        };
    },
    computed: {
        isLocked() { return this.lockRemaining > 0; },
        lockText() {
            const m = Math.floor(this.lockRemaining / 60);
            const s = this.lockRemaining % 60;
            return `試行回数が上限に達しました。${m}分${String(s).padStart(2, '0')}秒後に再試行してください`;
        },
        loginBgImage() {
            const setting = this.$store.state.setting.loginBg;
            if (setting.type === 'bing') return '//api.dujin.org/bing/1920.php';
            if (setting.type === 'anime') return '//api.btstu.cn/sjbz/?lx=dongman&k=' + Math.random().toString(10).substring(2);
            if (setting.type === 'custom') return setting.customUrl;
            if (setting.type === 'upload') return setting.upload.url;
            return '';
        },
        sakuraCfg() {
            return this.$store.state.setting.sakura || {};
        }
    },
    async mounted() {
        animate(this.$el.querySelector('.login-card'), {
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 650,
            ease: 'outCubic'
        });


        try {
            const res = await fetch('/api/auth-config');
            const data = await res.json();
            if (data.hash) {
                this.$store.commit('SET_PASSWORD', data.hash);
            }
        } catch (e) { /* fallback 到 localStorage 存储的密码 */ }
        this._refreshLock();
        this._timer = setInterval(() => this._refreshLock(), 1000);

        // 等待 onNuxtReady 后（localStorage 数据已加载），再初始化 sakura
        if (process.browser) {
            window.onNuxtReady(() => {
                if (this.sakuraCfg.enabled) {
                    this._initSakura();
                }
            });
        }

        // 初始化 Turnstile
        this._loadTurnstile().then(() => {
            if (!this.$refs.turnstileEl || !window.turnstile) return;
            window.turnstile.render(this.$refs.turnstileEl, {
                sitekey: '0x4AAAAAAC80OiNZR2cIzP1t',
                theme: this.$store.state.dark ? 'dark' : 'light',
                callback: (token) => { this.turnstileToken = token; },
                'expired-callback': () => { this.turnstileToken = ''; },
                'error-callback': () => { this.turnstileToken = ''; }
            });
        });
    },
    watch: {
        'sakuraCfg.enabled'(val) {
            if (val) this._initSakura();
            else this._destroySakura();
        },
        'sakuraCfg.fallSpeed'() { this._restartSakura(); },
        'sakuraCfg.maxSize'() { this._restartSakura(); },
        'sakuraCfg.minSize'() { this._restartSakura(); },
        'sakuraCfg.delay'() { this._restartSakura(); },
        'sakuraCfg.colorPreset'() { this._restartSakura(); },
        loading(val) {
            const btn = this.$el && this.$el.querySelector('.login-btn');
            if (!btn) return;
            if (val) {
                this._btnAnim = animate(btn, {
                    scale: [1, 0.96, 1],
                    duration: 850,
                    loop: true,
                    ease: 'inOutSine'
                });
            } else {
                if (this._btnAnim) { this._btnAnim.pause(); this._btnAnim = null; }
                animate(btn, { scale: 1, duration: 200, ease: 'outBack' });
            }
        }
    },
    beforeDestroy() {
        clearInterval(this._timer);
        this._destroySakura();
        if (this._btnAnim) { this._btnAnim.pause(); this._btnAnim = null; }
        if (window.turnstile && this.$refs.turnstileEl) {
            try { window.turnstile.remove(this.$refs.turnstileEl); } catch (e) {}
        }
    },
    methods: {
        _loadTurnstile() {
            return new Promise(resolve => {
                if (window.turnstile) { resolve(); return; }
                const s = document.createElement('script');
                s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
                s.async = true;
                s.defer = true;
                s.onload = resolve;
                s.onerror = resolve;
                document.head.appendChild(s);
            });
        },
        _loadSakuraAssets() {
            return new Promise(resolve => {
                if (window.Sakura) { resolve(); return; }
                // load CSS
                if (!document.querySelector('link[href="/css/sakura.min.css"]')) {
                    const l = document.createElement('link');
                    l.rel = 'stylesheet';
                    l.href = '/css/sakura.min.css';
                    document.head.appendChild(l);
                }
                // load JS
                const s = document.createElement('script');
                s.src = '/js/sakura.min.js';
                s.onload = resolve;
                s.onerror = resolve;
                document.head.appendChild(s);
            });
        },
        async _initSakura() {
            await this._loadSakuraAssets();
            if (!window.Sakura) return;
            this._destroySakura();
            const cfg = this.sakuraCfg;
            const preset = COLOR_PRESETS[cfg.colorPreset] || COLOR_PRESETS[0];
            this._sakura = new window.Sakura('.login-page', {
                fallSpeed: cfg.fallSpeed || 1,
                maxSize: cfg.maxSize || 14,
                minSize: cfg.minSize || 10,
                delay: cfg.delay || 300,
                colors: preset.colors
            });
        },
        _destroySakura() {
            if (this._sakura) {
                try { this._sakura.stop(false); } catch (e) {}
                this._sakura = null;
            }
        },
        _restartSakura() {
            if (this.sakuraCfg.enabled) this._initSakura();
        },
        _refreshLock() {
            const d = getAttempts();
            if (d.lockUntil && Date.now() < d.lockUntil) {
                this.lockRemaining = Math.ceil((d.lockUntil - Date.now()) / 1000);
            } else {
                this.lockRemaining = 0;
                this.attemptsLeft = MAX_ATTEMPTS - (d.count || 0);
            }
        },
        async handleLogin() {
            this.error = '';
            if (!this.password) {
                this.error = 'パスワードを入力してください';
                return;
            }
            if (this.isLocked) return;
            if (!this.turnstileToken) {
                this.error = '人機確認を完了してください';
                return;
            }

            this.loading = true;
            try {
                // 验证 Turnstile token
                const verifyRes = await fetch('/api/verify-turnstile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: this.turnstileToken })
                });
                const verifyData = await verifyRes.json();
                if (!verifyData.success) {
                    this.error = '人機確認に失敗しました、もう一度お試しください';
                    this.turnstileToken = '';
                    if (window.turnstile && this.$refs.turnstileEl) {
                        window.turnstile.reset(this.$refs.turnstileEl);
                    }
                    this.loading = false;
                    return;
                }
                const inputHash = await sha256(this.password);

                // 迁移：首次使用时将明文密码升级为哈希
                let storedHash = this.$store.state.accessPassword;
                if (!isHash(storedHash)) {
                    storedHash = await sha256(storedHash);
                    this.$store.commit('SET_PASSWORD', storedHash);
                }

                if (inputHash === storedHash) {
                    clearAttempts();
                    this.$store.commit('SET_AUTH', true);
                    if (this.remember) {
                        localStorage.setItem(REMEMBER_KEY, String(Date.now() + SEVEN_DAYS));
                    } else {
                        localStorage.removeItem(REMEMBER_KEY);
                    }
                    this.$router.replace('/');
                } else {
                    const { count, lockUntil } = recordFail();
                    this._refreshLock();
                    if (lockUntil) {
                        this.error = '';
                    } else {
                        this.error = `パスワードが違います（あと${MAX_ATTEMPTS - count}回）`;
                    }
                    this.password = '';
                    this.loading = false;
                }
            } catch (e) {
                this.error = 'エラーが発生しました、再試行してください';
                this.loading = false;
            }
        }
    }
};
</script>

<style lang="scss">
/* 覆盖 sakura 默认的 fall 动画：延伸到 110% 并完全淡出，
   确保花瓣离开视口后再被移除，避免停在底部继续左右漂移 */
@keyframes fall {
    0%   { opacity: 0.9; top: 0; }
    75%  { opacity: 0.8; }
    100% { opacity: 0;   top: 100%; }
}
@-webkit-keyframes fall {
    0%   { opacity: 0.9; top: 0; }
    75%  { opacity: 0.8; }
    100% { opacity: 0;   top: 100%; }
}

/* sakura 花瓣置于最顶层 */
.sakura {
    animation-fill-mode: forwards !important;
    -webkit-animation-fill-mode: forwards !important;
    z-index: 9999;
}

.login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f4f8fb;
    transition: background-color 0.3s;
    position: relative;
    overflow: hidden;

    &.dark {
        background-color: #1a1d23;

        .login-card {
            background-color: #282c34;
            border-color: #3a3f4b;
        }

        .login-title {
            color: #e8eaf0;
        }

        .login-input {
            background-color: #1a1d23;
            border-color: #3a3f4b;
            color: #e8eaf0;

            &::placeholder {
                color: #5a6070;
            }

            &:focus {
                border-color: #249ffd;
            }
        }

        .login-remember span {
            color: #8b92a5;
        }
    }
}

.login-bgimg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    z-index: 0;
    pointer-events: none;
}

.login-page.has-loginbg .login-card {
    position: relative;
    z-index: 1;
}

.login-card {
    width: 360px;
    background-color: #ffffff;
    border-radius: 12px;
    border: 1px solid #DCDEE0;
    box-shadow: 8px 14px 38px rgba(39, 44, 49, 0.08);
    padding: 0 36px 36px;
    transition: background-color 0.3s, border-color 0.3s;
}

.login-header {
    text-align: center;
    margin-top: -10px;
    margin-bottom: -48px;
}

.login-title-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateY(-20px);
}

.login-avatar {
    display: block;
    margin: 0 auto 8px;
    max-height: 60px;
    width: auto;
    position: relative;
    z-index: 2;
}

.login-title-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 326px;
    padding: 0 48px;
}

.login-title-bg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 326px;
    height: 326px;
    object-fit: contain;
    pointer-events: none;
    z-index: 0;
}

.login-page.dark .login-title-bg {
}

.login-title {
    position: relative;
    z-index: 1;
    font-size: 26px;
    font-weight: 700;
    color: #249ffd;
    margin: 0;
    letter-spacing: 1px;
}

.login-body {
    position: relative;
    z-index: 1;
}

.login-lock-icon {
    display: flex;
    justify-content: center;
    margin-bottom: 22px;
}

.login-input-wrap {
    margin-bottom: 12px;
}

.login-input {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 15px;
    font-size: 15px;
    border: 1px solid #DCDEE0;
    border-radius: 6px;
    background-color: #fff;
    color: #333;
    outline: none;
    transition: border-color 0.2s;

    &::placeholder {
        color: #bcc5d0;
    }

    &:focus {
        border-color: #249ffd;
        box-shadow: 0 0 0 3px rgba(36, 159, 253, 0.12);
    }
}

.login-remember {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    cursor: pointer;

    input[type='checkbox'] {
        width: 15px;
        height: 15px;
        cursor: pointer;
        accent-color: #249ffd;
    }

    span {
        font-size: 13px;
        color: #6b7280;
        user-select: none;
    }
}

.turnstile-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
}

.login-error {
    font-size: 13px;
    color: #f93a6d;
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    gap: 4px;

    &.login-locked {
        color: #ff8c00;
        background-color: rgba(255, 140, 0, 0.08);
        border: 1px solid rgba(255, 140, 0, 0.25);
        border-radius: 6px;
        padding: 8px 10px;
        line-height: 1.5;
    }
}

.login-btn {
    width: 100%;
    padding: 11px;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    background-color: #249ffd;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s, opacity 0.2s;
    margin-top: 4px;

    &:hover {
        background-color: #1a8fe8;
    }

    &:active {
        background-color: #1480d4;
    }

    &.loading {
        opacity: 0.7;
        cursor: not-allowed;
    }
}

@media (max-width: 420px) {
    .login-card {
        width: calc(100vw - 40px);
        padding: 32px 24px 28px;
    }
}
</style>
