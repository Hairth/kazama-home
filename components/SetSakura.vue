<template>
    <nya-container title="登录页樱花特效" class="set-sakura">
        <nya-checkbox
            :checked="cfg.enabled"
            label="启用樱花飘落特效"
            @change="set('setting.sakura.enabled', $event)"
        />

        <template v-if="cfg.enabled">
            <hr>

            <div class="nya-subtitle">
                花瓣颜色
            </div>
            <div class="sakura-color-presets">
                <div
                    v-for="(preset, i) in colorPresets"
                    :key="i"
                    class="sakura-color-swatch"
                    :class="{ active: cfg.colorPreset === i }"
                    :title="preset.label"
                    :style="{ background: preset.preview }"
                    @click="set('setting.sakura.colorPreset', i)"
                >
                    <span v-if="cfg.colorPreset === i" class="swatch-check">✓</span>
                </div>
            </div>
            <div class="sakura-color-labels">
                <span
                    v-for="(preset, i) in colorPresets"
                    :key="i"
                    class="sakura-color-label"
                    :class="{ active: cfg.colorPreset === i }"
                >{{ preset.label }}</span>
            </div>

            <hr>

            <div class="nya-subtitle">
                飘落速度
                <span class="sakura-hint">（数值越大速度越慢）</span>
            </div>
            <client-only>
                <vue-slider
                    :value="cfg.fallSpeed"
                    :min="0.3"
                    :max="5"
                    :interval="0.1"
                    lazy
                    @change="set('setting.sakura.fallSpeed', $event)"
                />
            </client-only>

            <div class="nya-subtitle">最大花瓣尺寸（像素）</div>
            <client-only>
                <vue-slider
                    :value="cfg.maxSize"
                    :min="8"
                    :max="40"
                    :interval="1"
                    lazy
                    @change="set('setting.sakura.maxSize', $event)"
                />
            </client-only>

            <div class="nya-subtitle">最小花瓣尺寸（像素）</div>
            <client-only>
                <vue-slider
                    :value="cfg.minSize"
                    :min="4"
                    :max="30"
                    :interval="1"
                    lazy
                    @change="set('setting.sakura.minSize', $event)"
                />
            </client-only>

            <div class="nya-subtitle">
                生成间隔（毫秒）
                <span class="sakura-hint">（数值越小花瓣越密）</span>
            </div>
            <client-only>
                <vue-slider
                    :value="cfg.delay"
                    :min="50"
                    :max="1500"
                    :interval="50"
                    lazy
                    @change="set('setting.sakura.delay', $event)"
                />
            </client-only>
        </template>
    </nya-container>
</template>

<script>
import 'vue-slider-component/theme/default.css';
let VueSlider;
if (process.browser) {
    VueSlider = require('vue-slider-component');
}

export const COLOR_PRESETS = [
    {
        label: '粉色（默认）',
        preview: 'linear-gradient(120deg, rgba(255,183,197,0.9), rgba(255,197,208,0.9))',
        colors: [
            { gradientColorStart: 'rgba(255, 183, 197, 0.9)', gradientColorEnd: 'rgba(255, 197, 208, 0.9)', gradientColorDegree: 120 },
            { gradientColorStart: 'rgba(255,189,189)', gradientColorEnd: 'rgba(227,170,181)', gradientColorDegree: 120 },
            { gradientColorStart: 'rgba(212,152,163)', gradientColorEnd: 'rgba(242,185,196)', gradientColorDegree: 120 }
        ]
    },
    {
        label: '白色',
        preview: 'linear-gradient(120deg, rgba(255,255,255,0.95), rgba(230,235,255,0.85))',
        colors: [
            { gradientColorStart: 'rgba(255,255,255,0.95)', gradientColorEnd: 'rgba(230,235,255,0.85)', gradientColorDegree: 120 }
        ]
    },
    {
        label: '红色',
        preview: 'linear-gradient(120deg, rgba(255,90,90,0.9), rgba(210,30,60,0.9))',
        colors: [
            { gradientColorStart: 'rgba(255,90,90,0.9)', gradientColorEnd: 'rgba(210,30,60,0.9)', gradientColorDegree: 120 }
        ]
    },
    {
        label: '蓝色',
        preview: 'linear-gradient(120deg, rgba(120,190,255,0.9), rgba(60,140,220,0.9))',
        colors: [
            { gradientColorStart: 'rgba(120,190,255,0.9)', gradientColorEnd: 'rgba(60,140,220,0.9)', gradientColorDegree: 120 }
        ]
    },
    {
        label: '金色',
        preview: 'linear-gradient(120deg, rgba(255,225,100,0.9), rgba(255,175,40,0.9))',
        colors: [
            { gradientColorStart: 'rgba(255,225,100,0.9)', gradientColorEnd: 'rgba(255,175,40,0.9)', gradientColorDegree: 120 }
        ]
    }
];

export default {
    name: 'SetSakura',
    components: { VueSlider },
    computed: {
        cfg() {
            return this.$store.state.setting.sakura || {};
        },
        colorPresets() {
            return COLOR_PRESETS;
        }
    },
    methods: {
        set(key, value) {
            this.$store.commit('SET_STORE', { key, value });
        }
    }
};
</script>

<style lang="scss">
.set-sakura {
    .nya-subtitle {
        margin-top: 15px;
    }

    .sakura-hint {
        font-size: 12px;
        color: #9aa5b4;
        margin-left: 4px;
        font-weight: normal;
    }

    .sakura-color-presets {
        display: flex;
        gap: 10px;
        margin-top: 10px;
        flex-wrap: wrap;
    }

    .sakura-color-swatch {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid transparent;
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: border-color 0.2s, transform 0.15s;

        &:hover {
            transform: scale(1.1);
        }

        &.active {
            border-color: #249ffd;
        }

        .swatch-check {
            color: #fff;
            font-size: 14px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            line-height: 1;
        }
    }

    .sakura-color-labels {
        display: flex;
        gap: 10px;
        margin-top: 6px;
        flex-wrap: wrap;
    }

    .sakura-color-label {
        width: 36px;
        font-size: 11px;
        color: #9aa5b4;
        text-align: center;
        white-space: nowrap;

        &.active {
            color: #249ffd;
            font-weight: 600;
        }
    }
}
</style>
