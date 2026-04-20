<template>
    <div ref="card" class="uptime-card">
        <div class="uptime-header">
            <span class="uptime-dot" :class="{ online: isOnline }"></span>
            <span class="uptime-label">服务器运行时间</span>
        </div>
        <div class="uptime-timer">{{ display }}</div>
        <div class="uptime-since">启动于 {{ sinceText }}</div>
    </div>
</template>

<script>
import { animate } from '~/assets/js/anime.esm.min.js';

export default {
    name: 'ServerUptime',
    data() {
        return {
            startTime: null,
            display: '--:--:--',
            sinceText: '---',
            isOnline: false,
            _ticker: null
        };
    },
    async mounted() {
        animate(this.$refs.card, {
            opacity: [0, 1],
            translateY: [16, 0],
            duration: 600,
            ease: 'outCubic'
        });

        try {
            const res = await fetch('/api/uptime');
            const { startTime } = await res.json();
            this.startTime = startTime;
            this.isOnline = true;
            const d = new Date(startTime);
            this.sinceText = `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            this._tick();
            this._ticker = setInterval(this._tick, 1000);
        } catch (e) {
            this.display = '离线';
        }
    },
    beforeDestroy() {
        clearInterval(this._ticker);
    },
    methods: {
        _tick() {
            const ms = Date.now() - this.startTime;
            const s = Math.floor(ms / 1000);
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const sec = s % 60;
            this.display = `${h > 0 ? h + '时' : ''}${String(m).padStart(2, '0')}分${String(sec).padStart(2, '0')}秒`;
        }
    }
};
</script>

<style lang="scss" scoped>
.uptime-card {
    background: transparent;
    border: none;
    padding: 8px 4px;
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
    opacity: 0;
}

.uptime-header {
    display: flex;
    align-items: center;
    gap: 8px;
}

.uptime-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #333;
    flex-shrink: 0;

    &.online {
        background: #22c55e;
        box-shadow: 0 0 6px #22c55e;
        animation: dot-pulse 2s ease-in-out infinite;
    }
}

@keyframes dot-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
}

.uptime-label {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.5px;
    color: #555;
    text-transform: uppercase;
}

.uptime-timer {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: 2px;
    line-height: 1;
    background: linear-gradient(90deg, #4a5568, #94a3b8);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.uptime-since {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 11px;
    color: #3f3f3f;
    letter-spacing: 0.5px;
}
</style>
