<template>
    <nuxt />
</template>

<script>
import { animate, createTimer, utils } from '~/assets/js/anime.esm.min.js';

export default {
    beforeDestroy() {
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
        if (!window.matchMedia('(pointer: coarse)').matches) {
            this._initParticles();
        }
    }
};
</script>
