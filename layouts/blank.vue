<template>
    <div>
        <transition name="gate-fade" @after-leave="pageVisible = true">
            <div v-if="showGate" class="turnstile-gate">
                <div class="turnstile-gate-box">
                    <div ref="turnstileEl"></div>
                    <p v-if="gateError" class="gate-error">{{ gateError }}</p>
                </div>
            </div>
        </transition>
        <nuxt v-if="pageVisible" />
    </div>
</template>

<script>
import { animate, createTimer, utils } from '~/assets/js/anime.esm.min.js';

const GATE_KEY = 'kazama_gate_ok';
const SITE_KEY = '0x4AAAAAAC80OiNZR2cIzP1t';

export default {
    data() {
        return {
            showGate: true,
            pageVisible: false,
            gateError: ''
        };
    },
    mounted() {
        if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(GATE_KEY) === '1') {
            this.showGate = false;
            this.pageVisible = true;
            return;
        }
        this._loadTurnstile();

        if (!window.matchMedia('(pointer: coarse)').matches) {
            this._initParticles();
        }
    },
    beforeDestroy() {
        if (this._particleTimers) this._particleTimers.forEach(t => t.pause());
        if (this._mouseParticleMove) document.removeEventListener('mousemove', this._mouseParticleMove);
        if (this._particleVisibility) document.removeEventListener('visibilitychange', this._particleVisibility);
        if (this._particleContainer && this._particleContainer.parentNode) {
            this._particleContainer.parentNode.removeChild(this._particleContainer);
        }
    },
    methods: {
        _loadTurnstile() {
            if (window.turnstile) { this._renderTurnstile(); return; }
            const s = document.createElement('script');
            s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            s.async = true;
            s.defer = true;
            s.onload = () => this._renderTurnstile();
            s.onerror = () => this._pass(); // 加载失败放行
            document.head.appendChild(s);
        },
        _renderTurnstile() {
            this.$nextTick(() => {
                if (!this.$refs.turnstileEl || !window.turnstile) return;
                window.turnstile.render(this.$refs.turnstileEl, {
                    sitekey: SITE_KEY,
                    theme: 'light',
                    callback: (token) => this._verify(token),
                    'error-callback': () => { this.gateError = '验证出错，请刷新重试'; },
                    'expired-callback': () => { this.gateError = '验证已过期，请重试'; }
                });
            });
        },
        async _verify(token) {
            try {
                const res = await fetch('/api/verify-turnstile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                const data = await res.json();
                if (data.success) {
                    this._pass();
                } else {
                    this.gateError = '验证未通过，请重试';
                    if (window.turnstile && this.$refs.turnstileEl) {
                        window.turnstile.reset(this.$refs.turnstileEl);
                    }
                }
            } catch (e) {
                // 本地开发或 API 不可用时放行
                this._pass();
            }
        },
        _pass() {
            try { sessionStorage.setItem(GATE_KEY, '1'); } catch (e) {}
            this.showGate = false; // 触发 transition，after-leave 时设 pageVisible = true
        },
        _initParticles() {
            const COLORS = ['#38bdf8', '#7dd3fc', '#f472b6', '#fb7185'];
            const COUNT = 15;
            const RADIUS = 55;
            const container = document.createElement('div');
            Object.assign(container.style, {
                position: 'fixed', top: '0', left: '0',
                width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: '9998', overflow: 'hidden'
            });
            document.body.appendChild(container);
            this._particleContainer = container;
            const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            const timers = [];
            for (let i = 0; i < COUNT; i++) {
                const el = document.createElement('div');
                const size = utils.random(5, 9);
                Object.assign(el.style, {
                    position: 'absolute', left: '0', top: '0',
                    width: size + 'px', height: size + 'px',
                    borderRadius: '50%',
                    backgroundColor: COLORS[i % COLORS.length],
                    opacity: '0', filter: 'blur(1.5px)'
                });
                container.appendChild(el);
                utils.set(el, { x: pointer.x, y: pointer.y });
                const timer = createTimer({
                    frameRate: 4,
                    onUpdate: () => {
                        const angle = Math.random() * Math.PI * 2;
                        animate(el, {
                            x: { to: Math.cos(angle) * RADIUS + pointer.x, duration: () => utils.random(900, 1800) },
                            y: { to: Math.sin(angle) * RADIUS + pointer.y, duration: () => utils.random(900, 1800) },
                            opacity: utils.random(0.3, 0.75, 2),
                            scale: 0.4 + utils.random(0.1, 0.8, 2),
                            duration: () => utils.random(900, 1600),
                            ease: `inOut(${utils.random(1, 4)})`,
                            composition: 'blend'
                        });
                    }
                });
                timers.push(timer);
            }
            this._particleTimers = timers;
            this._mouseParticleMove = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; };
            document.addEventListener('mousemove', this._mouseParticleMove, { passive: true });
            this._particleVisibility = () => {
                const hidden = document.visibilityState !== 'visible';
                timers.forEach(t => hidden ? t.pause() : t.play());
            };
            document.addEventListener('visibilitychange', this._particleVisibility);
        }
    }
};
</script>

<style>
.turnstile-gate {
    position: fixed;
    inset: 0;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.turnstile-gate-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.gate-error {
    font-size: 13px;
    color: #f93a6d;
    margin: 0;
    text-align: center;
}

.gate-fade-leave-active {
    transition: opacity 0.4s ease;
}
.gate-fade-leave-to {
    opacity: 0;
}
</style>
