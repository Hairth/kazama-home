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
            <button class="login-gear-btn" @click="showSakuraPanel = true">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
                    <path d="M21.294 13.9l-.444-.256a9.1 9.1 0 0 0 0-3.29l.444-.256a3 3 0 1 0-3-5.196l-.445.257A8.977 8.977 0 0 0 15 4.513V4a3 3 0 0 0-6 0v.513a8.977 8.977 0 0 0-2.849 1.646L5.706 5.9a3 3 0 0 0-3 5.196l.444.256a9.1 9.1 0 0 0 0 3.29l-.444.256a3 3 0 1 0 3 5.197l.445-.257A8.977 8.977 0 0 0 9 21.487V22a3 3 0 0 0 6 0v-.513a8.978 8.978 0 0 0 2.849-1.646l.445.257a3 3 0 0 0 3-5.197zm-2.548 3.464a1 1 0 0 1-1.732 1l-.803-.464A7.016 7.016 0 0 1 13 19.366V20a1 1 0 0 1-2 0v-.634a7.016 7.016 0 0 1-3.211-1.466l-.803.464a1 1 0 0 1-1-1.732l.803-.464a7.132 7.132 0 0 1 0-3.7l-.803-.464a1 1 0 0 1 1-1.732l.803.464A7.016 7.016 0 0 1 11 4.634V4a1 1 0 0 1 2 0v.634a7.016 7.016 0 0 1 3.211 1.466l.803-.464a1 1 0 0 1 1 1.732l-.803.464a7.132 7.132 0 0 1 0 3.7l.803.464z"/>
                </svg>
            </button>
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

        <!-- 花瓣特效设置面板 -->
        <transition name="sakura-fade">
            <div v-if="showSakuraPanel" class="sakura-panel-backdrop" @click.self="showSakuraPanel = false">
                <div ref="sakuraPanelEl" class="sakura-panel">
                    <div class="sakura-panel-header">
                        <span class="sakura-panel-title">🌸 花びらエフェクト設定</span>
                        <button class="sakura-panel-close" @click="showSakuraPanel = false">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="sakura-panel-body">
                        <div class="sakura-toggle-row">
                            <span class="sakura-toggle-label">桜の花びらエフェクトを有効にする</span>
                            <div class="sakura-toggle-switch" :class="{ on: sakuraCfg.enabled }" @click="setSakura('setting.sakura.enabled', !sakuraCfg.enabled)">
                                <div class="sakura-toggle-thumb"></div>
                            </div>
                        </div>
                        <template v-if="sakuraCfg.enabled">
                            <div class="sakura-panel-divider"></div>
                            <div class="sakura-panel-subtitle">花びらの色</div>
                            <div class="sakura-color-row">
                                <div
                                    v-for="(preset, i) in sakuraColorPresets"
                                    :key="i"
                                    class="sakura-swatch"
                                    :class="{ active: sakuraCfg.colorPreset === i }"
                                    :title="preset.label"
                                    :style="{ background: preset.preview }"
                                    @click="setSakura('setting.sakura.colorPreset', i)"
                                >
                                    <span v-if="sakuraCfg.colorPreset === i" class="swatch-check">✓</span>
                                </div>
                            </div>
                            <div class="sakura-panel-divider"></div>
                            <div class="sakura-slider-item">
                                <div class="sakura-panel-subtitle">落下速度 <span class="sakura-hint">（大きいほど遅い）</span></div>
                                <client-only>
                                    <vue-slider :value="sakuraCfg.fallSpeed" :min="0.3" :max="5" :interval="0.1" lazy @change="setSakura('setting.sakura.fallSpeed', $event)" />
                                </client-only>
                            </div>
                            <div class="sakura-slider-item">
                                <div class="sakura-panel-subtitle">花びらの最大サイズ（px）</div>
                                <client-only>
                                    <vue-slider :value="sakuraCfg.maxSize" :min="8" :max="40" :interval="1" lazy @change="setSakura('setting.sakura.maxSize', $event)" />
                                </client-only>
                            </div>
                            <div class="sakura-slider-item">
                                <div class="sakura-panel-subtitle">花びらの最小サイズ（px）</div>
                                <client-only>
                                    <vue-slider :value="sakuraCfg.minSize" :min="4" :max="30" :interval="1" lazy @change="setSakura('setting.sakura.minSize', $event)" />
                                </client-only>
                            </div>
                            <div class="sakura-slider-item">
                                <div class="sakura-panel-subtitle">生成間隔（ms）<span class="sakura-hint">（小さいほど密度が高い）</span></div>
                                <client-only>
                                    <vue-slider :value="sakuraCfg.delay" :min="50" :max="1500" :interval="50" lazy @change="setSakura('setting.sakura.delay', $event)" />
                                </client-only>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import { COLOR_PRESETS } from '~/components/SetSakura';
import { animate } from '~/assets/js/anime.esm.min.js';
import 'vue-slider-component/theme/default.css';
let VueSlider;
if (process.browser) {
    VueSlider = require('vue-slider-component');
}

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
    components: { VueSlider },
    data() {
        return {
            password: '',
            error: '',
            loading: false,
            remember: false,
            lockRemaining: 0,
            attemptsLeft: MAX_ATTEMPTS,
            turnstileToken: '',
            _sakura: null,
            showSakuraPanel: false
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
        },
        sakuraColorPresets() {
            return COLOR_PRESETS;
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

        // 等待 DOM 渲染完成后初始化 sakura
        this.$nextTick(() => {
            if (this.sakuraCfg.enabled) {
                this._initSakura();
            }
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
        showSakuraPanel(val) {
            if (val) {
                this.$nextTick(() => {
                    if (this.$refs.sakuraPanelEl) {
                        animate(this.$refs.sakuraPanelEl, {
                            opacity: [0, 1],
                            scale: [0.93, 1],
                            translateY: [-14, 0],
                            duration: 320,
                            ease: 'outCubic'
                        });
                    }
                });
            }
        },
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
    },
    methods: {
        setSakura(key, value) {
            this.$store.commit('SET_STORE', { key, value });
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

            this.loading = true;
            try {
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
                    sessionStorage.setItem('miku_session_auth', '1');
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
    80%  { opacity: 0.8; }
    100% { opacity: 0;   top: 120%; }
}
@-webkit-keyframes fall {
    0%   { opacity: 0.9; top: 0; }
    80%  { opacity: 0.8; }
    100% { opacity: 0;   top: 120%; }
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

/* ── 齿轮按钮 ── */
.login-card {
    position: relative;
}
.login-gear-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 30px;
    height: 30px;
    border: none;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #b0bec5;
    transition: color 0.2s, background 0.2s, transform 0.35s cubic-bezier(0,0,0.2,1);
    z-index: 10;
    padding: 0;
    &:hover {
        color: #249ffd;
        background: rgba(36, 159, 253, 0.1);
        transform: rotate(72deg);
    }
}
.dark .login-gear-btn {
    color: #64748b;
    &:hover { color: #249ffd; background: rgba(36,159,253,0.12); }
}

/* ── 面板过渡 ── */
.sakura-fade-enter-active { transition: opacity 0.22s; }
.sakura-fade-leave-active { transition: opacity 0.18s; }
.sakura-fade-enter, .sakura-fade-leave-to { opacity: 0; }

/* ── 背景遮罩 ── */
.sakura-panel-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
}

/* ── 面板主体 ── */
.sakura-panel {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18);
    width: 340px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 80px);
    overflow-y: auto;
    border: 1px solid rgba(0, 0, 0, 0.06);
}
.dark .sakura-panel {
    background: #1e293b;
    border-color: #334155;
}

.sakura-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px 14px;
    border-bottom: 1px solid rgba(0,0,0,0.06);
}
.dark .sakura-panel-header { border-color: #334155; }

.sakura-panel-title {
    font-size: 15px;
    font-weight: 700;
    color: #249ffd;
    letter-spacing: 0.3px;
}
.dark .sakura-panel-title { color: #60aef0; }

.sakura-panel-close {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    padding: 0;
    transition: color 0.2s, background 0.2s;
    &:hover { color: #f93a6d; background: rgba(249,58,109,0.08); }
}

.sakura-panel-body {
    padding: 14px 18px 18px;
}

/* ── 开关行 ── */
.sakura-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 0;
}
.sakura-toggle-label {
    font-size: 14px;
    color: #374151;
    font-weight: 500;
}
.dark .sakura-toggle-label { color: #e2e8f0; }

.sakura-toggle-switch {
    width: 42px;
    height: 24px;
    border-radius: 12px;
    background: #dce1e9;
    cursor: pointer;
    position: relative;
    transition: background 0.25s cubic-bezier(0,0,0.2,1);
    flex-shrink: 0;
    &.on { background: #249ffd; }
    .sakura-toggle-thumb {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        transition: transform 0.25s cubic-bezier(0,0,0.2,1);
    }
    &.on .sakura-toggle-thumb { transform: translateX(18px); }
}
.dark .sakura-toggle-switch { background: #475569; }
.dark .sakura-toggle-switch.on { background: #249ffd; }

/* ── 分割线 ── */
.sakura-panel-divider {
    height: 1px;
    background: rgba(0,0,0,0.06);
    margin: 12px 0;
}
.dark .sakura-panel-divider { background: #334155; }

/* ── 小标题 ── */
.sakura-panel-subtitle {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
}
.dark .sakura-panel-subtitle { color: #94a3b8; }
.sakura-hint { font-weight: 400; text-transform: none; font-size: 11px; color: #9ca3af; }

/* ── 颜色色块 ── */
.sakura-color-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}
.sakura-swatch {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid transparent;
    transition: border-color 0.2s, transform 0.2s;
    font-size: 14px;
    color: #fff;
    &:hover { transform: scale(1.1); }
    &.active { border-color: #249ffd; transform: scale(1.05); }
}
.swatch-check { font-size: 13px; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }

/* ── 滑块行 ── */
.sakura-slider-item {
    margin-bottom: 14px;
    &:last-child { margin-bottom: 0; }
}
</style>
