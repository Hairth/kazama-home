<template>
    <div class="nya-container" :class="{ 'transparent': $store.state.setting.bg.type !== 'none' && $store.state.setting.bg.transparentEl, 'pt': title }">
        <div v-if="title" class="nya-title">
            <i v-if="icon" :class="'eva eva-' + icon"></i>
            <span v-if="title">{{ title }}</span>
            <slot v-else name="title"></slot>
        </div>
        <div v-if="$store.state.inFrames" class="nya-stitle">
            <span>本工具来自：</span>
            <a :href="`${$store.state.env.url}`" target="_blank" rel="noopener noreferrer">{{ $store.state.env.url }}</a>
        </div>
        <slot></slot>
    </div>
</template>

<script>
export default {
    props: {
        title: {
            type: String,
            default: ''
        },
        icon: {
            type: String,
            default: ''
        }
    }
};
</script>

<style lang="scss">
.nya-container {
    position: relative;
    padding: 26px 30px;
    margin-top: 22px;
    margin-bottom: 36px;
    box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05),
                0 2px 6px -1px rgba(15, 23, 42, 0.02);
    background-color: #fff;
    border: 1px solid rgba(226, 232, 240, 0.85);
    border-radius: 14px;
    transition: box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1);

    &.pt {
        padding-top: 36px;
    }
    &.transparent {
        background-color: rgba(255, 255, 255, 0.72);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
    }
    &:last-child {
        margin-bottom: 0;
    }
    .nya-stitle {
        position: absolute;
        right: 18px;
        top: 10px;
        font-size: 13px;
        color: #94a3b8;
    }
    .nya-title {
        position: absolute;
        left: 24px;
        top: -16px;
        padding: 7px 16px;
        font-weight: 700;
        font-size: 0;
        background: linear-gradient(135deg, var(--theme) 0%, #1a82d6 100%);
        color: #fff;
        box-shadow: 0 4px 14px rgba(36, 159, 253, 0.35);
        border-radius: 9px;
        letter-spacing: 0.3px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        z-index: 1;

        i {
            font-size: 18px;
            vertical-align: middle;
        }
        span {
            font-size: 15px;
            line-height: 1.3;
            vertical-align: middle;
            font-weight: 700;
        }
    }

    @media (max-width: 600px) {
        padding: 16px;
        margin-bottom: 26px;
        &.pt {
            padding-top: 32px;
        }
        .nya-title {
            left: 16px;
            padding: 6px 13px;
            span {
                font-size: 14px;
            }
        }
    }

    .nya-list {
        margin: 0;
    }
}

body.dark .nya-container {
    background-color: #1e293b;
    border-color: rgba(51, 65, 85, 0.7);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.15);
    &.transparent {
        background-color: rgba(30, 41, 59, 0.78);
    }
}
</style>