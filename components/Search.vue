<template>
    <div class="search-component">
        <div class="search" :class="{ transparent: $store.state.setting.bg.type !== 'none' && $store.state.setting.bg.transparentEl, 'focus': focus }">
            <i class="eva eva-search-outline"></i>
            <input
                ref="search"
                :value="value"
                type="search"
                v-bind="$attrs"
                :placeholder="`搜索工具${!$store.state.isMobile.any ? ' (Ctrl+F)' : ''}`"
                @change="$emit('change', $event)"
                @input="$emit('input', $event.target.value)"
                @keyup="$emit('keyup', $event)"
                @keyup.enter="enterFirst"
                @focus="focus = true"
                @blur="focus = false"
            >
            <button v-if="value" class="search-clear-btn" title="清空搜索" @click="$emit('input', '')">
                <i class="eva eva-close-circle"></i>
            </button>
            <span v-else-if="!$store.state.isMobile.any" class="search-kbd-hint">Ctrl + F</span>
        </div>

        <nya-container v-if="value" title="搜索结果" icon="search-outline">
            <slot :data="searchList"></slot>
            <p v-show="!searchList.length" class="search-placeholder">
                暂无相关工具
            </p>
        </nya-container>
    </div>
</template>

<script>
export default {
    name: 'Search',
    inheritAttrs: false,
    props: {
        value: {
            default: null,
            type: [String, Number]
        }
    },
    data() {
        return {
            focus: false
        };
    },
    computed: {
        toolsList() {
            let arr = [];
            this.$store.state.tools.forEach(tool => {
                arr = arr.concat(tool.list);
            });
            return arr;
        },
        searchList() {
            if (!this.value) return [];
            let results = [];
            const value = this.value.toLowerCase();
            this.toolsList.forEach(tool => {
                if (this.$route.path !== '/hide_tool' && !this.showBtn(tool))
                    return false;
                if (
                    tool.pinyin.first.find(i => {
                        return i.indexOf(value) >= 0;
                    })
                ) {
                    return results.push(tool);
                }
                if (
                    tool.pinyin.pinyin.find(i => {
                        return i.indexOf(value) >= 0;
                    })
                ) {
                    return results.push(tool);
                }
                if (tool.name.toLowerCase().indexOf(value) >= 0)
                    results.push(tool);
            });
            return results;
        }
    },
    mounted() {
        if (process.browser) window.addEventListener('keydown', this.ctrlF);
    },
    beforeDestroy() {
        if (process.browser) window.removeEventListener('keydown', this.ctrlF);
    },
    methods: {
        ctrlF(e) {
            if (e.keyCode == 70 && e.ctrlKey) {
                e.preventDefault();
                this.$refs.search.focus();
            }
        },
        enterFirst() {
            if (!this.searchList.length) return false;
            this.$emit('enter', this.searchList[0]);
        },
        showBtn(tool) {
            return this.$store.state.setting.hide.indexOf(tool.path) < 0;
        }
    }
};
</script>

<style lang="scss">
.search-component {
    .nya-container {
        margin-bottom: 35px !important;
    }
    .search {
        margin-bottom: 32px;
        margin-top: 18px;
        width: 100%;
        padding: 14px 20px;
        display: flex;
        align-items: center;
        background-color: #fff;
        border: 1px solid rgba(226, 232, 240, 0.9);
        box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04),
                    0 2px 6px -1px rgba(15, 23, 42, 0.02);
        box-sizing: border-box;
        border-radius: 14px;
        transition: border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                    box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        &.transparent {
            background-color: rgba(255, 255, 255, 0.72);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        &.focus {
            border-color: var(--theme);
            box-shadow: 0 0 0 4px rgba(36, 159, 253, 0.15),
                        0 8px 24px rgba(36, 159, 253, 0.12);
            transform: translateY(-1px);
            i {
                color: var(--theme);
            }
        }
        i {
            font-size: 22px;
            margin-right: 12px;
            color: #94a3b8;
            transition: color 0.2s;
            flex-shrink: 0;
        }
        input {
            width: 100%;
            outline: none;
            border: none;
            box-shadow: none;
            background-color: transparent;
            color: var(--t1);
            font-size: 15px;
            &::placeholder {
                transition: color 0.3s ease;
                color: #94a3b8;
            }
        }
        .search-clear-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 2px 6px;
            color: #94a3b8;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: color 0.2s;
            i {
                font-size: 18px;
                margin: 0;
            }
            &:hover {
                color: #f43f5e;
            }
        }
        .search-kbd-hint {
            font-size: 12px;
            font-weight: 600;
            color: #94a3b8;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            padding: 3px 8px;
            border-radius: 6px;
            white-space: nowrap;
            letter-spacing: 0.5px;
        }
    }
    .search-placeholder {
        position: relative;
        text-align: center;
        font-size: 16px;
        color: #94a3b8;
        font-weight: 600;
        padding: 20px 0;
        width: 100%;
    }
}

body.dark .search-component {
    .search {
        background-color: #1e293b;
        border-color: rgba(51, 65, 85, 0.7);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        &.transparent {
            background-color: rgba(30, 41, 59, 0.78);
        }
        &.focus {
            border-color: var(--theme);
            box-shadow: 0 0 0 4px rgba(36, 159, 253, 0.22),
                        0 8px 24px rgba(0, 0, 0, 0.3);
        }
        .search-kbd-hint {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.12);
            color: #94a3b8;
        }
    }
}
</style>