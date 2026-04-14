<template>
    <div class="index_page" :class="{ 'hasbg': $store.state.setting.bg.type !== 'none', 'in-frames': ($store.state.inFrames && $route.path !== '/'), hide: !$store.state.loaded }">
        <!-- in frames -->
        <style v-if="$store.state.inFrames && $route.path !== '/'">
            body {
            background-color: transparent;
            }
        </style>

        <!-- outdatedbrowser -->
        <link rel="stylesheet" href="/css/outdatedbrowser.min.css" />
        <div id="outdated"></div>
        <script src="/js/outdatedbrowser.js"></script>
        
        <!-- 路由过渡 -->
        <style v-if="$store.state.setting.animations">
            .page-enter-active,
            .page-leave-active {
            transition: all .25s;
            }

            .page-leave-to,
            .page-enter{
            transform: translateY(20px);
            opacity: 0;
            }

            .page-enter-to,
            .page-leave{
            transform: translateY(0);
            opacity: 1;
            }
        </style>

        <!-- 自定义背景 -->
        <div class="bgimg" :style="{ 'background-image': `url(${backgroundImage})`, 'filter': `blur(${$store.state.setting.bg.blur}px)`, 'opacity': $store.state.setting.bg.opacity / 100 }"></div>
        <!-- 夜间模式样式 -->
        <style v-if="$store.state.dark">
            :root {
            --t1: #989898;
            --t2: #1f1f1f;
            color: #989898;
            }
        </style>
        <style v-else>
            :root {
            --t1: #2f3e4c;
            --t2: #ffffff;
            color: #2f3e4c;
            }
        </style>
        <!-- 夜间模式蒙层 -->
        <div v-if="$store.state.dark" class="dark-layer"></div>
        <main>
            <!-- 背景蒙层 -->
            <div v-if="$store.state.setting.bg.layer" class="bg-layer"></div>
            <Navbar />
            <nuxt class="view" />
            <Vfooter v-show="$route.path === '/' || $route.path === '/setting'" />
        </main>
        <!-- 自定义CSS -->
        <style v-if="$store.state.setting.css">
            {{ $store.state.setting.css }}
        </style>
        <!-- 自定义JS -->
        <script v-if="$store.state.setting.js" type="text/javascript" charset="utf-8" v-text="$store.state.setting.js"></script>
        <client-only>
            <Dialog scrollable :click-to-close="false" />
        </client-only>
        <div v-show="$store.state.globalLoading" class="view-loading">
            <nya-loading />
        </div>
        <FloatBtn />
        <ThemeBtn />
    </div>
</template>

<script>
import { animate, createTimer, utils, stagger } from '~/assets/js/anime.esm.min.js';
import Navbar from '../components/Navbar';
import Dialog from '../components/Dialog';
import FloatBtn from '../components/FloatBtn';
import isMobile from 'ismobilejs';
import Vfooter from '~/components/Footer';
import ThemeBtn from '~/components/ThemeBtn';
export default {
    name: 'Index',
    components: {
        Navbar,
        Dialog,
        FloatBtn,
        Vfooter,
        ThemeBtn
    },
    data() {
        return {
            loading: true
        };
    },
    computed: {
        backgroundImage() {
            const setting = this.$store.state.setting.bg;
            let url;
            if (setting.type === 'bing') {
                url = '//api.dujin.org/bing/1920.php';
            } else if (setting.type === 'anime') {
                url =
                    '//api.btstu.cn/sjbz/?lx=dongman&k=' +
                    Math.random()
                        .toString(10)
                        .substring(2);
            } else if (setting.type === 'custom') {
                url = setting.customUrl;
            } else if (setting.type === 'upload') {
                url = setting.upload.url;
            } else url = '';
            return url;
        }
    },
    beforeDestroy() {
        if (this._sectionObserver) {
            this._sectionObserver.disconnect();
        }
        if (this._particleTimers) {
            this._particleTimers.forEach(t => t.pause());
        }
        if (this._mouseParticleMove) {
            document.removeEventListener('mousemove', this._mouseParticleMove);
        }
        if (this._particleVisibility) {
            document.removeEventListener('visibilitychange', this._particleVisibility);
        }
        if (this._particleContainer && this._particleContainer.parentNode) {
            this._particleContainer.parentNode.removeChild(this._particleContainer);
        }
    },
    watch: {
        $route() {
            this.$nextTick(() => {
                if (!this._sectionObserver) return;
                this.$el.querySelectorAll('.nya-container').forEach(el => {
                    this._sectionObserver.observe(el);
                });
            });
        },
        '$store.state.dark'(val) {
            if (val) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        }
    },
    methods: {
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

            this._mouseParticleMove = (e) => {
                pointer.x = e.clientX;
                pointer.y = e.clientY;
            };
            document.addEventListener('mousemove', this._mouseParticleMove, { passive: true });

            this._particleVisibility = () => {
                const hidden = document.visibilityState !== 'visible';
                timers.forEach(t => hidden ? t.pause() : t.play());
            };
            document.addEventListener('visibilitychange', this._particleVisibility);
        }
    },
    mounted() {
        this.loading = false;
        if (!window.matchMedia('(pointer: coarse)').matches) {
            this._initParticles();
        }

        // 设置UA
        this.$store.commit('SET_STORE', {
            key: 'isMobile',
            value: isMobile
        });

        // 判断frames
        if (process.browser) {
            if (window.frames.length != parent.frames.length) {
                // window.open(this.$store.state.env.url);
                this.$store.commit('SET_STORE', {
                    key: 'inFrames',
                    value: true
                });
            }
        }

        // .nya-container 滚动触发入场（全局）
        this._sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                this._sectionObserver.unobserve(entry.target);
                animate(entry.target, {
                    opacity: [0, 1],
                    translateY: [22, 0],
                    duration: 480,
                    ease: 'outCubic'
                });
            });
        }, { threshold: 0.08 });
        this.$nextTick(() => {
            this.$el.querySelectorAll('.nya-container').forEach(el => {
                this._sectionObserver.observe(el);
            });
        });

        setTimeout(() => {
            this.$nextTick(() => {
                this.$store.commit('SET_STORE', {
                    key: 'loaded',
                    value: true
                });
                if (this.$store.state.setting.inNewTab === null) {
                    this.$store.commit('SET_STORE', {
                        key: 'setting.inNewTab',
                        value: !this.$store.state.isMobile.any
                    });
                }
            });
        }, 0);
    }
};
</script>

<style lang="scss">
.in-frames {
    main {
        padding: 0 !important;
        margin: 0 !important;
    }
    .nya-container {
        margin-top: 18px;
        box-shadow: none;
        border: 1px solid #ebebeb;
    }
    .navbar,
    .vfooter,
    .float-btn {
        display: none !important;
    }
}
.index_page {
    min-height: 100%;
    &.hide {
        opacity: 0;
    }
    .view + .nya-container {
        margin-top: 50px;
    }
    .dark-layer {
        position: fixed;
        pointer-events: none;
        background-color: rgba($color: #000000, $alpha: 0.3);
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        z-index: 999;
    }
    .view-loading {
        z-index: 999;
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba($color: #ffffff, $alpha: 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    main {
        position: relative;
        max-width: 1200px;
        margin: 0 auto;
        box-sizing: border-box;
        padding: 0 20px;
        padding-bottom: 20px;
    }
    .bgimg {
        z-index: -1;
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
    }
    .bg-layer {
        z-index: -1;
        opacity: 0.75;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        min-height: 100vh;
    }
}
</style>
