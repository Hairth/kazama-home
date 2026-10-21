<template>
    <nya-container
        :title="title"
        :icon="icon"
        class="resizable-section"
        :class="{
            'section-height-enabled': resizable,
            'section-height-dragging': draftHeight !== null,
            'section-height-snapped': !!snapKey
        }"
        :style="{ '--section-height': displayHeight + 'px' }"
        :data-section-key="sectionKey"
        :data-section-resize-enabled="resizable"
    >
        <slot></slot>
        <div v-if="resizable" class="section-resize-controls">
            <button
                type="button"
                class="section-resize-handle"
                title="拖动调整高度，双击恢复自动高度"
                aria-label="调整模块高度"
                @pointerdown="startResize"
                @lostpointercapture="cancelResize"
                @dblclick.prevent="resetHeight"
                @keydown="resizeWithKeyboard"
            >
                <i class="eva eva-more-horizontal-outline" aria-hidden="true"></i>
            </button>
            <span v-if="draftHeight !== null" class="section-resize-feedback" role="status">
                <i v-if="snapKey" class="eva eva-checkmark-circle-2-outline" aria-hidden="true"></i>
                {{ snapKey ? '已对齐 · ' : '' }}{{ Math.round(draftHeight) }} px
            </span>
            <button
                v-else-if="savedHeight"
                type="button"
                class="section-resize-reset"
                title="恢复自动高度"
                aria-label="恢复自动高度"
                @click="resetHeight"
            >
                <i class="eva eva-undo-outline" aria-hidden="true"></i>
            </button>
        </div>
    </nya-container>
</template>

<script>
const SNAP_DISTANCE = 10;
const RELEASE_DISTANCE = 18;
const MAX_HEIGHT = 10000;

export default {
    props: {
        sectionKey: { type: String, required: true },
        title: { type: String, default: '' },
        icon: { type: String, default: '' },
        height: { type: Number, default: 0 },
        resizable: { type: Boolean, default: true }
    },
    data() {
        return {
            draftHeight: null,
            snapKey: ''
        };
    },
    computed: {
        savedHeight() {
            return Number.isFinite(this.height) && this.height > 0
                ? Math.min(this.height, MAX_HEIGHT)
                : 0;
        },
        displayHeight() {
            return this.draftHeight === null
                ? this.savedHeight
                : this.draftHeight;
        }
    },
    watch: {
        resizable() {
            this.cancelResize();
        },
        height() {
            this.cancelResize();
        }
    },
    beforeDestroy() {
        this.cancelResize();
    },
    methods: {
        canResize() {
            return (
                this.resizable &&
                window.matchMedia('(min-width: 1025px)').matches
            );
        },
        measureMinimum() {
            // Measure the intrinsic border-box without the saved minimum height.
            const style = this.$el.style;
            const previous = style.getPropertyValue('--section-height');
            style.setProperty('--section-height', '0px');
            const minimum = this.$el.getBoundingClientRect().height;
            style.setProperty('--section-height', previous);
            return minimum;
        },
        rowTargets(minimum) {
            const rect = this.$el.getBoundingClientRect();
            return Array.from(this.$el.parentElement.children)
                .filter(
                    node =>
                        node !== this.$el &&
                        node.dataset.sectionResizeEnabled === 'true' &&
                        node.getClientRects().length
                )
                .map(node => ({
                    node,
                    key: node.dataset.sectionKey,
                    rect: node.getBoundingClientRect()
                }))
                .filter(
                    target =>
                        Math.abs(target.rect.top - rect.top) < 3 &&
                        target.rect.height >= minimum
                )
                .map(target => ({
                    node: target.node,
                    key: target.key,
                    height: target.rect.height
                }));
        },
        resolveHeight(rawHeight, minimum, targets, lockedKey = '') {
            const height = Math.max(minimum, Math.min(MAX_HEIGHT, rawHeight));
            const locked = targets.find(
                target =>
                    target.key === lockedKey &&
                    Math.abs(target.height - height) <= RELEASE_DISTANCE
            );
            const nearest =
                locked ||
                targets
                    .filter(
                        target =>
                            Math.abs(target.height - height) <= SNAP_DISTANCE
                    )
                    .sort(
                        (a, b) =>
                            Math.abs(a.height - height) -
                            Math.abs(b.height - height)
                    )[0];
            return {
                height: nearest ? nearest.height : height,
                target: nearest
            };
        },
        startResize(event) {
            if (
                !this.canResize() ||
                event.button !== 0 ||
                event.isPrimary === false
            )
                return;
            event.preventDefault();
            event.stopPropagation();
            this.cancelResize();
            const startHeight = this.$el.getBoundingClientRect().height;
            const minimum = this.measureMinimum();
            this._resizeSession = {
                pointerId: event.pointerId,
                handle: event.currentTarget,
                startY: event.clientY + window.scrollY,
                lastClientY: event.clientY,
                startHeight,
                minimum,
                targets: this.rowTargets(minimum),
                moved: false,
                highlighted: null
            };
            this.draftHeight = startHeight;
            document.body.classList.add('section-height-resizing');
            window.addEventListener('pointermove', this.moveResize);
            window.addEventListener('pointerup', this.finishResize);
            window.addEventListener('pointercancel', this.cancelResize);
            window.addEventListener('blur', this.cancelResize);
            window.addEventListener('resize', this.cancelResize);
            window.addEventListener('scroll', this.scrollResize);
            window.addEventListener('keydown', this.escapeResize);
            event.currentTarget.setPointerCapture(event.pointerId);
        },
        moveResize(event) {
            const session = this._resizeSession;
            if (!session || event.pointerId !== session.pointerId) return;
            session.lastClientY = event.clientY;
            this.updateResize();
        },
        scrollResize() {
            if (this._resizeSession) this.updateResize();
        },
        updateResize() {
            const session = this._resizeSession;
            const delta = session.lastClientY + window.scrollY - session.startY;
            if (Math.abs(delta) > 1) session.moved = true;
            if (!session.moved) return;
            const result = this.resolveHeight(
                session.startHeight + delta,
                session.minimum,
                session.targets,
                this.snapKey
            );
            this.draftHeight = result.height;
            this.snapKey = result.target ? result.target.key : '';
            if (session.highlighted)
                session.highlighted.removeAttribute('data-resize-snap-target');
            session.highlighted = result.target ? result.target.node : null;
            if (session.highlighted)
                session.highlighted.setAttribute(
                    'data-resize-snap-target',
                    'true'
                );
        },
        finishResize(event) {
            const session = this._resizeSession;
            if (!session || event.pointerId !== session.pointerId) return;
            this.moveResize(event);
            const height = this.draftHeight;
            const changed =
                session.moved && Math.abs(height - session.startHeight) > 0.1;
            this.cancelResize();
            if (changed)
                this.$emit('height-change', Math.round(height * 100) / 100);
        },
        escapeResize(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.cancelResize();
            }
        },
        cancelResize(event) {
            const session = this._resizeSession;
            if (!session) return;
            if (
                event &&
                event.pointerId !== undefined &&
                event.pointerId !== session.pointerId
            )
                return;
            this._resizeSession = null;
            window.removeEventListener('pointermove', this.moveResize);
            window.removeEventListener('pointerup', this.finishResize);
            window.removeEventListener('pointercancel', this.cancelResize);
            window.removeEventListener('blur', this.cancelResize);
            window.removeEventListener('resize', this.cancelResize);
            window.removeEventListener('scroll', this.scrollResize);
            window.removeEventListener('keydown', this.escapeResize);
            if (session.highlighted)
                session.highlighted.removeAttribute('data-resize-snap-target');
            if (session.handle.hasPointerCapture(session.pointerId)) {
                session.handle.releasePointerCapture(session.pointerId);
            }
            this.draftHeight = null;
            this.snapKey = '';
            document.body.classList.remove('section-height-resizing');
        },
        resetHeight() {
            this.cancelResize();
            this.$emit('height-change', 0);
        },
        resizeWithKeyboard(event) {
            if (!this.canResize()) return;
            if (event.key === 'Home') {
                event.preventDefault();
                this.resetHeight();
            } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
                const height = this.$el.getBoundingClientRect().height;
                const minimum = this.measureMinimum();
                const delta =
                    (event.shiftKey ? 32 : 8) *
                    (event.key === 'ArrowDown' ? 1 : -1);
                const targets = this.rowTargets(minimum).filter(
                    target => Math.abs(target.height - height) > 1
                );
                const result = this.resolveHeight(
                    height + delta,
                    minimum,
                    targets
                );
                this.$emit(
                    'height-change',
                    Math.round(result.height * 100) / 100
                );
            }
        }
    }
};
</script>

<style lang="scss">
.home .sections-grid-wrapper > .resizable-section {
    align-content: start;

    @media (min-width: 1025px) {
        &.section-height-enabled {
            min-height: var(--section-height, 0px);
        }
    }

    &.section-height-dragging {
        border-color: var(--theme);
    }

    &.section-height-snapped,
    &[data-resize-snap-target='true'] {
        border-color: #10b981;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.18);

        &::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 12px;
            right: 12px;
            border-bottom: 2px dashed #10b981;
            pointer-events: none;
        }
    }

    > .section-resize-controls {
        position: absolute;
        left: 12px;
        right: 12px;
        bottom: -10px;
        height: 22px;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3;
        pointer-events: none;
    }

    .section-resize-handle,
    .section-resize-reset {
        box-sizing: border-box;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #cbd5e1;
        background: var(--t2, #fff);
        color: #64748b;
        border-radius: 6px;
        padding: 0;
        pointer-events: auto;

        &:hover,
        &:focus-visible {
            border-color: var(--theme);
            color: var(--theme);
            outline: 2px solid rgba(36, 159, 253, 0.2);
        }
    }

    .section-resize-handle {
        width: 64px;
        height: 22px;
        font-size: 22px;
        cursor: ns-resize;
        touch-action: none;
    }

    .section-resize-reset {
        position: absolute;
        right: 0;
        width: 24px;
        height: 22px;
        font-size: 15px;
        cursor: pointer;
    }

    .section-resize-feedback {
        position: absolute;
        right: 0;
        bottom: 25px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        color: #fff;
        background: #0369a1;
        white-space: nowrap;
    }

    &.section-height-snapped .section-resize-feedback {
        background: #047857;
    }

    @media (max-width: 1024px) {
        > .section-resize-controls {
            display: none;
        }
    }
}

body.section-height-resizing {
    cursor: ns-resize !important;
    user-select: none;

    * {
        cursor: ns-resize !important;
    }
}

body.dark .resizable-section {
    .section-resize-handle,
    .section-resize-reset {
        background: #1e293b;
        color: #cbd5e1;
        border-color: #475569;
    }
}
</style>
