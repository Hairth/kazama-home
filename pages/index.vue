<template>
    <div class="home">
        <Welcome />
        <Search v-model="searchText" @enter="enterFirst">
            <template slot-scope="data">
                <nuxt-link
                    v-for="(tool, index) in data.data"
                    v-show="showBtn(tool)"
                    :key="index"
                    :target="$store.state.setting.inNewTab ? '_blank' : '_self'"
                    :to="tool.path"
                    class="nya-btn"
                >
                    {{ tool.name }}
                </nuxt-link>
            </template>
        </Search>

        <Favorites v-show="!searchText" />

        <nya-container
            v-if="$store.state.setting.hideCategory"
            v-show="!searchText"
            icon="shopping-bag-outline"
            title="工具"
        >
            <template v-for="(tool, index2) in toolsList">
                <nuxt-link
                    v-if="showBtn(tool)"
                    :key="index2"
                    :title="tool.name"
                    :to="tool.path"
                    class="nya-btn"
                    :class="[tool.hot, {'badge': tool.hot}]"
                >
                    {{ tool.name }}
                </nuxt-link>
            </template>
        </nya-container>

        <template v-else v-show="!searchText">
            <nya-container
                v-for="(item, sectionIndex) in $store.state.tools"
                v-show="!searchText && showSection(item)"
                :key="sectionIndex"
                :icon="item.icon"
                :title="getSectionTitle(item.title)"
            >
                <!-- 管理按钮 -->
                <button
                    class="section-manage-btn"
                    @click="toggleManage(sectionIndex)"
                >
                    <i :class="'eva ' + (managingSection === sectionIndex ? 'eva-checkmark-outline' : 'eva-settings-2-outline')"></i>
                    {{ managingSection === sectionIndex ? '完成' : '管理' }}
                </button>

                <!-- 正常展示 -->
                <template v-if="managingSection !== sectionIndex">
                    <div class="tool-card-grid">
                        <nuxt-link
                            v-for="(tool, index2) in item.list"
                            v-show="!isHidden(tool.path)"
                            :key="'card-' + index2"
                            class="tool-card"
                            :target="$store.state.setting.inNewTab ? '_blank' : '_self'"
                            :title="tool.name"
                            :to="tool.path"
                        >
                            <div class="tool-card-icon" :style="isImageIcon(getToolIcon(tool)) ? { background: 'var(--card-icon-bg)' } : { background: cardColor(tool.name) }">
                                <img v-if="isImageIcon(getToolIcon(tool))" :src="getToolIcon(tool)" class="tool-card-img" @error="$event.target.style.display='none'" />
                                <span v-else>{{ getToolIcon(tool) }}</span>
                            </div>
                            <span class="tool-card-name">{{ tool.name }}</span>
                            <button class="tool-card-edit-btn" @click.prevent.stop="openCardEdit(tool, true)">
                                <i class="eva eva-settings-2-outline"></i>
                            </button>
                        </nuxt-link>
                        <a
                            v-for="tool in customToolsForSection(item.title)"
                            v-show="!tool.hidden"
                            :key="'card-custom-' + tool.id"
                            class="tool-card"
                            :href="tool.url"
                            :title="tool.name"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <div class="tool-card-icon" :style="isImageIcon(getToolIcon(tool)) ? { background: 'var(--card-icon-bg)' } : { background: cardColor(tool.name) }">
                                <img v-if="isImageIcon(getToolIcon(tool))" :src="getToolIcon(tool)" class="tool-card-img" @error="$event.target.style.display='none'" />
                                <span v-else>{{ getToolIcon(tool) }}</span>
                            </div>
                            <span class="tool-card-name">{{ tool.name }}</span>
                            <button class="tool-card-edit-btn" @click.prevent.stop="openCardEdit(tool, false)">
                                <i class="eva eva-settings-2-outline"></i>
                            </button>
                        </a>
                    </div>
                </template>

                <!-- 管理面板 -->
                <div v-else class="manage-panel">
                    <!-- 改名 -->
                    <div class="manage-rename">
                        <i class="eva eva-edit-2-outline"></i>
                        <input
                            v-model="renameSectionName"
                            class="manage-input manage-rename-input"
                            :placeholder="item.title"
                            maxlength="20"
                            @keyup.enter="saveRename(item.title)"
                        />
                        <button class="manage-rename-btn" @click="saveRename(item.title)">重命名</button>
                        <button
                            v-if="$store.state.sectionNames[item.title]"
                            class="manage-rename-reset"
                            @click="resetRename(item.title)"
                        >还原</button>
                    </div>

                    <!-- 工具列表 -->
                    <div class="manage-list">
                        <div
                            v-for="(tool, idx) in item.list"
                            :key="'m-' + idx"
                            class="manage-item"
                            :class="{ 'is-hidden': isHidden(tool.path) }"
                        >
                            <button class="manage-toggle" :class="{ 'is-off': isHidden(tool.path) }" @click="toggleVisibility(tool.path)">
                                <i :class="'eva ' + (isHidden(tool.path) ? 'eva-eye-off-outline' : 'eva-eye-outline')"></i>
                            </button>
                            <span class="manage-name">{{ tool.name }}</span>
                            <span class="manage-tag">内置</span>
                        </div>
                        <div
                            v-for="tool in customToolsForSection(item.title)"
                            :key="'mc-' + tool.id"
                            class="manage-item"
                            :class="{ 'is-hidden': tool.hidden }"
                        >
                            <button class="manage-toggle" :class="{ 'is-off': tool.hidden }" @click="toggleCustomTool(tool.id)">
                                <i :class="'eva ' + (tool.hidden ? 'eva-eye-off-outline' : 'eva-eye-outline')"></i>
                            </button>
                            <span class="manage-name">{{ tool.name }}</span>
                            <a class="manage-url" :href="tool.url" target="_blank" rel="noopener noreferrer">{{ tool.url }}</a>
                            <button class="manage-delete" @click="removeCustomTool(tool.id)">
                                <i class="eva eva-trash-2-outline"></i>
                                删除
                            </button>
                        </div>
                    </div>

                    <div class="manage-add">
                        <div class="manage-add-title">
                            <i class="eva eva-plus-circle-outline"></i>
                            添加自定义功能
                        </div>
                        <div class="manage-add-row">
                            <input
                                v-model="newToolName"
                                class="manage-input"
                                placeholder="功能名称"
                                maxlength="20"
                            />
                            <input
                                v-model="newToolUrl"
                                class="manage-input"
                                placeholder="跳转 URL（https://...）"
                            />
                            <button class="manage-add-btn" @click="addCustomTool(item.title)">
                                添加
                            </button>
                        </div>
                    </div>
                </div>
            </nya-container>
        </template>

        <!-- 卡片编辑模态窗 -->
        <transition name="card-edit-fade">
            <div v-if="cardEdit" class="card-edit-overlay" @click.self="closeCardEdit">
                <div class="card-edit-modal">
                    <div class="card-edit-header">
                        <span class="card-edit-title">编辑「{{ cardEdit.name }}」</span>
                        <button class="card-edit-close" @click="closeCardEdit"><i class="eva eva-close-outline"></i></button>
                    </div>

                    <!-- 预览 -->
                    <div class="card-edit-preview-row">
                        <div class="card-edit-preview-icon" :style="isImageIcon(cardEditValue) ? { background: 'var(--card-icon-bg)' } : { background: cardColor(cardEdit.name) }">
                            <img v-if="isImageIcon(cardEditValue)" :src="cardEditValue" class="tool-card-img" @error="$event.target.style.display='none'" />
                            <span v-else>{{ cardEditValue || cardEdit.name[0] }}</span>
                        </div>
                        <div class="card-edit-preview-info">
                            <div class="card-edit-preview-name">{{ cardEdit.name }}</div>
                            <div class="card-edit-preview-hint">图标预览</div>
                        </div>
                    </div>

                    <!-- 图标方式 Tab -->
                    <div class="card-edit-tabs">
                        <button :class="['card-edit-tab', { active: cardEditIconType === 'emoji' }]" @click="cardEditIconType = 'emoji'">
                            <i class="eva eva-smiling-face-outline"></i>自定义图标
                        </button>
                        <button :class="['card-edit-tab', { active: cardEditIconType === 'url' }]" @click="cardEditIconType = 'url'">
                            <i class="eva eva-link-2-outline"></i>图标 URL
                        </button>
                        <button :class="['card-edit-tab', { active: cardEditIconType === 'auto' }]" @click="cardEditIconType = 'auto'">
                            <i class="eva eva-download-outline"></i>自动获取
                        </button>
                    </div>

                    <!-- emoji 输入 -->
                    <div v-if="cardEditIconType === 'emoji'" class="card-edit-section">
                        <label class="card-edit-label">输入 emoji 或文字</label>
                        <input v-model="cardEditValue" class="card-edit-input" placeholder="例：🎥 或 录" maxlength="4" />
                    </div>

                    <!-- URL 输入 -->
                    <div v-if="cardEditIconType === 'url'" class="card-edit-section">
                        <label class="card-edit-label">图标图片地址</label>
                        <input v-model="cardEditValue" class="card-edit-input" placeholder="https://example.com/icon.png" />
                    </div>

                    <!-- 自动获取 -->
                    <div v-if="cardEditIconType === 'auto'" class="card-edit-section">
                        <label class="card-edit-label">输入网站地址，自动获取 favicon</label>
                        <div class="card-edit-auto-row">
                            <input v-model="cardEditAutoUrl" class="card-edit-input" placeholder="https://example.com" />
                            <button class="card-edit-fetch-btn" :disabled="cardEditFetching" @click="autoFetchIcon">
                                <i class="eva eva-download-outline"></i>
                                {{ cardEditFetching ? '获取中…' : '获取' }}
                            </button>
                        </div>
                        <div v-if="cardEditFetchError" class="card-edit-error">{{ cardEditFetchError }}</div>
                    </div>

                    <!-- 显示/隐藏 -->
                    <div class="card-edit-section card-edit-visibility-row">
                        <span class="card-edit-label">显示状态</span>
                        <div class="card-edit-switch" @click="cardEditHidden = !cardEditHidden">
                            <span class="card-edit-switch-track" :class="{ 'is-on': !cardEditHidden }">
                                <span class="card-edit-switch-thumb"></span>
                            </span>
                            <span class="card-edit-switch-label">{{ cardEditHidden ? '已隐藏' : '显示中' }}</span>
                        </div>
                    </div>

                    <!-- 操作按钮 -->
                    <div class="card-edit-actions">
                        <button class="card-edit-reset" @click="resetCardIcon">
                            <i class="eva eva-refresh-outline"></i>重置图标
                        </button>
                        <div class="card-edit-actions-right">
                            <button v-if="!cardEdit.isBuiltin" class="card-edit-delete" @click="deleteCard">
                                <i class="eva eva-trash-2-outline"></i>删除
                            </button>
                            <button class="card-edit-save" @click="saveCardEdit">保存</button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
import Favorites from '~/components/Favorites';
import Search from '~/components/Search';
import isMobile from 'ismobilejs';
import Welcome from '~/components/Welcome';
export default {
    name: 'Home',
    components: {
        Favorites,
        Search,
        Welcome
    },
    head() {
        return {
            title: this.title
        };
    },
    data() {
        return {
            title: process.env.title,
            searchText: '',
            isMobile,
            managingSection: null,
            newToolName: '',
            newToolUrl: '',
            renameSectionName: '',
            // 卡片编辑模态窗
            cardEdit: null,
            cardEditIconType: 'emoji',
            cardEditValue: '',
            cardEditAutoUrl: '',
            cardEditFetching: false,
            cardEditFetchError: '',
            cardEditHidden: false
        };
    },
    computed: {
        toolsList() {
            let arr = [];
            this.$store.state.tools.forEach(tool => {
                arr = arr.concat(tool.list);
            });
            return arr;
        }
    },
    methods: {
        enterFirst(e) {
            if (this.$store.state.setting.inNewTab) {
                window.open(e.path);
            } else {
                this.$router.push(e.path);
            }
        },
        showSection(item) {
            return !(
                item.list.filter(i => {
                    return (
                        this.$store.state.setting.hide.indexOf(i.path) !== -1
                    );
                }).length === item.list.length
            );
        },
        showBtn(tool) {
            return this.$store.state.setting.hide.indexOf(tool.path) === -1;
        },
        isHidden(path) {
            return this.$store.state.setting.hide.indexOf(path) !== -1;
        },
        toggleVisibility(path) {
            const hide = [...this.$store.state.setting.hide];
            const idx = hide.indexOf(path);
            if (idx === -1) hide.push(path);
            else hide.splice(idx, 1);
            this.$store.commit('SET_STORE', { key: 'setting.hide', value: hide });
        },
        customToolsForSection(sectionTitle) {
            return this.$store.state.customTools.filter(t => t.sectionTitle === sectionTitle);
        },
        visibleCustomTools(sectionTitle) {
            return this.customToolsForSection(sectionTitle).filter(t => !t.hidden);
        },
        toggleCustomTool(id) {
            this.$store.commit('TOGGLE_CUSTOM_TOOL', id);
        },
        removeCustomTool(id) {
            this.$store.commit('REMOVE_CUSTOM_TOOL', id);
        },
        addCustomTool(sectionTitle) {
            const name = this.newToolName.trim();
            const url = this.newToolUrl.trim();
            if (!name) {
                this.$noty.error('请输入功能名称');
                return;
            }
            if (!url) {
                this.$noty.error('请输入跳转 URL');
                return;
            }
            if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
                this.$noty.error('URL 格式不正确，请以 http:// 或 https:// 开头');
                return;
            }
            this.$store.commit('ADD_CUSTOM_TOOL', {
                id: Date.now(),
                sectionTitle,
                name,
                url,
                hidden: false
            });
            this.newToolName = '';
            this.newToolUrl = '';
            this.$noty.success('添加成功');
        },
        toggleManage(index) {
            if (this.managingSection === index) {
                this.managingSection = null;
            } else {
                this.managingSection = index;
                const originalTitle = this.$store.state.tools[index].title;
                this.renameSectionName = this.$store.state.sectionNames[originalTitle] || '';
            }
            this.newToolName = '';
            this.newToolUrl = '';
        },
        cardColor(name) {
            const palette = ['#249ffd','#7C3AED','#20c997','#fa5477','#f59f00','#ae3ec9','#1c7ed6','#2f9e44'];
            return palette[name.charCodeAt(0) % palette.length];
        },
        getToolKey(tool) {
            return tool.path || String(tool.id);
        },
        getToolIcon(tool) {
            const icon = this.$store.state.toolIcons[this.getToolKey(tool)];
            return icon || tool.name[0];
        },
        isImageIcon(val) {
            return !!(val && (val.startsWith('http') || val.startsWith('data:') || val.startsWith('/')));
        },
        extractDomain(url) {
            try {
                let full = url;
                if (!/^https?:\/\//i.test(url)) full = 'https://' + url;
                return new URL(full).hostname;
            } catch (e) {
                const m = url.match(/^(?:https?:\/\/)?(?:www\.)?([^:/?\n]+)/i);
                return m ? m[1] : null;
            }
        },
        openCardEdit(tool, isBuiltin) {
            const key = this.getToolKey(tool);
            const current = this.$store.state.toolIcons[key] || '';
            this.cardEdit = { key, name: tool.name, isBuiltin, tool };
            this.cardEditValue = current;
            this.cardEditIconType = this.isImageIcon(current) ? 'url' : 'emoji';
            this.cardEditAutoUrl = (!isBuiltin && tool.url) ? tool.url : '';
            this.cardEditHidden = isBuiltin ? this.isHidden(tool.path) : !!tool.hidden;
            this.cardEditFetchError = '';
        },
        closeCardEdit() {
            this.cardEdit = null;
            this.cardEditFetching = false;
            this.cardEditFetchError = '';
        },
        saveCardEdit() {
            const { key, isBuiltin, tool } = this.cardEdit;
            this.$store.commit('SET_TOOL_ICON', { key, icon: this.cardEditValue.trim() });
            if (isBuiltin) {
                const hide = [...this.$store.state.setting.hide];
                const idx = hide.indexOf(tool.path);
                if (this.cardEditHidden && idx === -1) hide.push(tool.path);
                else if (!this.cardEditHidden && idx !== -1) hide.splice(idx, 1);
                this.$store.commit('SET_STORE', { key: 'setting.hide', value: hide });
            } else {
                if (this.cardEditHidden !== !!tool.hidden) {
                    this.$store.commit('TOGGLE_CUSTOM_TOOL', tool.id);
                }
            }
            this.closeCardEdit();
        },
        resetCardIcon() {
            this.cardEditValue = '';
        },
        deleteCard() {
            if (!this.cardEdit.isBuiltin) {
                this.$store.commit('REMOVE_CUSTOM_TOOL', this.cardEdit.tool.id);
            }
            this.closeCardEdit();
        },
        async autoFetchIcon() {
            const url = this.cardEditAutoUrl.trim();
            if (!url) { this.cardEditFetchError = '请输入网站地址'; return; }
            const domain = this.extractDomain(url);
            if (!domain) { this.cardEditFetchError = '无法解析域名'; return; }
            this.cardEditFetching = true;
            this.cardEditFetchError = '';
            const origin = `https://${domain}`;
            const apis = [
                `${origin}/favicon.ico`,
                `${origin}/favicon.png`,
                `${origin}/apple-touch-icon.png`,
                `https://favicon.im/${domain}?larger=true`,
                `https://www.faviconextractor.com/favicon/${domain}?larger=true`,
                `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
                `https://api.iowen.cn/favicon/${domain}.png`,
            ];
            let loaded = false;
            for (const api of apis) {
                loaded = await new Promise(resolve => {
                    const img = new Image();
                    img.onload = () => resolve(img.naturalWidth > 1);
                    img.onerror = () => resolve(false);
                    setTimeout(() => resolve(false), 5000);
                    img.src = api;
                });
                if (loaded) { this.cardEditValue = api; this.cardEditIconType = 'url'; break; }
            }
            if (!loaded) this.cardEditFetchError = '未能获取到图标，可手动填写图标 URL';
            this.cardEditFetching = false;
        },
        getSectionTitle(original) {            return this.$store.state.sectionNames[original] || original;
        },
        saveRename(original) {
            this.$store.commit('RENAME_SECTION', { original, name: this.renameSectionName });
            this.$noty.success('已保存');
        },
        resetRename(original) {
            this.$store.commit('RENAME_SECTION', { original, name: '' });
            this.renameSectionName = '';
            this.$noty.success('已还原');
        }
    }
};
</script>

<style lang="scss">
.home {
    span.mb {
        display: block;
        margin-bottom: 15px;
    }
    table {
        width: 100%;
        table-layout: auto;
    }
    ._ad {
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .nya-btn {
        position: relative;
        margin: 7px;
        width: calc(20% - 14px);
        text-align: center;
        box-sizing: border-box;
        overflow: hidden;
        text-align: center;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: all 0.3s ease;
        background-color: transparent;
        font-size: 18px;
        border-radius: 4px;
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px 0px rgba(10, 14, 29, 0.04),
                0px 8px 64px 0px rgba(10, 14, 29, 0.08);
        }
        @media (max-width: 1050px) {
            width: calc(25% - 14px);
        }
        @media (max-width: 900px) {
            width: calc(100% / 3 - 14px);
        }
        @media (max-width: 700px) {
            box-shadow: none;
            margin: 5px;
            width: calc(50% - 10px);
        }
    }
    .badge {
        &::after {
            content: '';
            position: absolute;
            top: 5px;
            right: 5px;
            color: #fff;
            font-weight: lighter;
            text-shadow: 1px 1px 1px rgba($color: #000000, $alpha: 0.2);
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        &.new::after {
            background-color: var(--theme-success);
        }
        &.hot::after {
            background-color: var(--theme-danger);
        }
        &.vip::after {
            background-color: #f79817;
        }
        &.recommend::after {
            background-color: var(--theme);
        }
    }
    .badge-info {
        display: inline-flex;
        align-items: center;
        .badge {
            display: inline-flex;
            margin-right: 10px;
            align-items: center;
            &::after {
                position: relative;
                left: auto;
                margin-left: 10px;
                top: auto;
                display: inline-block;
            }
        }
    }

    /* 卡片样式 */
    .tool-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 10px;
        width: 100%;
        --card-icon-bg: #f0f4f8;
        @media (max-width: 700px) {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 8px;
        }
    }

    body.dark .tool-card-grid { --card-icon-bg: #334155; }

    .tool-card {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 12px 14px;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border: 1px solid rgba(230, 230, 230, 0.9);
        border-radius: 12px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04);
        text-decoration: none;
        color: var(--t1);
        cursor: pointer;
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        overflow: visible;

        &::before {
            content: '';
            position: absolute;
            inset: -1px;
            border-radius: 13px;
            opacity: 0;
            box-shadow:
                0 0 0 1px #7C3AED,
                0 0 8px 2px rgba(124, 58, 237, 0.65),
                0 0 14px 4px rgba(79, 70, 229, 0.4),
                0 0 20px 6px rgba(0, 200, 200, 0.2);
            transition: opacity 0.3s ease;
            pointer-events: none;
        }

        &:hover {
            transform: translateY(-5px);
            text-decoration: none;
            &::before { opacity: 1; }
            .tool-card-icon { transform: scale(1.12); }
            .tool-card-edit-btn { opacity: 1; }
        }

        &.tool-card-hidden {
            opacity: 0.28;
            filter: grayscale(0.5);
        }
    }

    body.dark .tool-card {
        background: linear-gradient(135deg, #1e293b 0%, #1a2234 100%);
        border-color: rgba(66, 76, 94, 0.4);
        box-shadow: 0 3px 10px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.12);
        &::before {
            box-shadow:
                0 0 0 1px #7C3AED,
                0 0 10px 3px rgba(124, 58, 237, 0.85),
                0 0 18px 5px rgba(79, 70, 229, 0.6),
                0 0 26px 8px rgba(0, 255, 255, 0.3);
        }
    }

    .tool-card-icon {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 17px;
        font-weight: 700;
        color: #fff;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        transition: transform 0.3s ease;
        overflow: hidden;
    }

    .tool-card-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 50%;
    }

    .tool-card-name {
        font-size: 12px;
        font-weight: 600;
        text-align: left;
        color: var(--t1);
        line-height: 1.35;
        word-break: break-all;
        flex: 1;
    }

    .tool-card-edit-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(0,0,0,0.22);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s, background-color 0.2s;
        cursor: pointer;
        color: #fff;
        padding: 0;
        z-index: 2;
        i { font-size: 12px; }
        &:hover { background: rgba(0,0,0,0.5); }
    }
    .section-manage-btn {
        position: absolute;
        top: 8px;
        right: 12px;
        background: none;
        border: 1px solid #249ffd;
        border-radius: 5px;
        padding: 3px 10px 3px 7px;
        font-size: 12px;
        color: #249ffd;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background-color 0.2s;
        z-index: 1;
        font-weight: 600;
        i {
            font-size: 14px;
        }
        &:hover {
            background-color: rgba(36, 159, 253, 0.1);
        }
    }

    /* 管理面板 */
    .manage-panel {
        width: 100%;
    }

    /* 改名区 */
    .manage-rename {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 14px;
        margin-bottom: 14px;
        border-bottom: 1px solid var(--border-color);
        i {
            font-size: 16px;
            color: #9aa5b4;
            flex-shrink: 0;
        }
    }

    .manage-rename-input {
        flex: 1;
        min-width: 80px;
    }

    .manage-rename-btn {
        padding: 7px 14px;
        font-size: 13px;
        font-weight: 600;
        color: #fff;
        background-color: var(--theme);
        border: none;
        border-radius: 5px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: opacity 0.2s;
        &:hover { opacity: 0.85; }
    }

    .manage-rename-reset {
        padding: 7px 12px;
        font-size: 13px;
        color: #9aa5b4;
        background: none;
        border: 1px solid var(--border-color);
        border-radius: 5px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: color 0.2s, border-color 0.2s;
        &:hover {
            color: var(--t1);
            border-color: var(--t1);
        }
    }

    .manage-list {
        margin-bottom: 16px;
    }

    .manage-item {
        display: flex;
        align-items: center;
        padding: 7px 10px;
        border-radius: 6px;
        transition: background-color 0.15s;
        gap: 10px;
        &:hover {
            background-color: rgba(0, 0, 0, 0.03);
        }
        &.is-hidden {
            opacity: 0.4;
        }
    }

    .manage-icon-cell {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
        color: #fff;
        flex-shrink: 0;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s;
        overflow: hidden;
        &:hover {
            transform: scale(1.12);
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
    }

    .manage-icon-input-active {
        width: 100%;
        height: 100%;
        background: transparent;
        border: none;
        outline: none;
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        text-align: center;
        padding: 0;
        cursor: text;
    }

    .manage-tag-hint {
        background-color: rgba(0,0,0,0.04);
        color: #9aa5b4;
        margin-left: auto;
    }

    /* 卡片编辑模态窗 */
    .card-edit-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        backdrop-filter: blur(3px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }

    .card-edit-modal {
        background: #fff;
        border-radius: 16px;
        padding: 24px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }

    body.dark .card-edit-modal {
        background: #1e293b;
        border: 1px solid rgba(66,76,94,0.5);
    }

    .card-edit-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 18px;
    }

    .card-edit-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--t1);
    }

    .card-edit-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #9aa5b4;
        padding: 4px;
        display: flex;
        border-radius: 6px;
        transition: color 0.2s, background 0.2s;
        i { font-size: 20px; }
        &:hover { color: var(--t1); background: rgba(0,0,0,0.06); }
    }

    .card-edit-preview-row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px;
        background: rgba(0,0,0,0.03);
        border-radius: 10px;
        margin-bottom: 18px;
    }

    body.dark .card-edit-preview-row { background: rgba(255,255,255,0.05); }

    .card-edit-preview-icon {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: 700;
        color: #fff;
        flex-shrink: 0;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        overflow: hidden;
    }

    .card-edit-preview-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--t1);
    }

    .card-edit-preview-hint {
        font-size: 12px;
        color: #9aa5b4;
        margin-top: 2px;
    }

    .card-edit-tabs {
        display: flex;
        gap: 6px;
        margin-bottom: 16px;
        background: rgba(0,0,0,0.04);
        border-radius: 8px;
        padding: 4px;
    }

    body.dark .card-edit-tabs { background: rgba(255,255,255,0.06); }

    .card-edit-tab {
        flex: 1;
        padding: 7px 6px;
        font-size: 12px;
        font-weight: 600;
        color: #9aa5b4;
        background: none;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        white-space: nowrap;
        i { font-size: 13px; }
        &.active {
            background: #fff;
            color: var(--theme);
            box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        &:hover:not(.active) { color: var(--t1); }
    }

    body.dark .card-edit-tab.active {
        background: #334155;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }

    .card-edit-section {
        margin-bottom: 16px;
    }

    .card-edit-label {
        display: block;
        font-size: 12px;
        color: #9aa5b4;
        margin-bottom: 6px;
        font-weight: 600;
    }

    .card-edit-input {
        width: 100%;
        box-sizing: border-box;
        padding: 9px 12px;
        font-size: 14px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: transparent;
        color: var(--t1);
        outline: none;
        transition: border-color 0.2s;
        &::placeholder { color: #bcc5d0; }
        &:focus { border-color: var(--theme); box-shadow: 0 0 0 3px rgba(36,159,253,0.1); }
    }

    .card-edit-auto-row {
        display: flex;
        gap: 8px;
    }

    .card-edit-auto-row .card-edit-input { flex: 1; }

    .card-edit-fetch-btn {
        padding: 9px 14px;
        font-size: 13px;
        font-weight: 600;
        color: #fff;
        background: var(--theme);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: opacity 0.2s;
        i { font-size: 14px; }
        &:hover:not(:disabled) { opacity: 0.85; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .card-edit-error {
        font-size: 12px;
        color: #f93a6d;
        margin-top: 6px;
    }

    .card-edit-visibility-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        .card-edit-label { margin: 0; }
    }

    .card-edit-switch {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
    }

    .card-edit-switch-track {
        width: 36px;
        height: 20px;
        border-radius: 10px;
        background: #ddd;
        position: relative;
        transition: background 0.2s;
        flex-shrink: 0;
        &.is-on { background: var(--theme); }
        &.is-on .card-edit-switch-thumb { transform: translateX(16px); }
    }

    .card-edit-switch-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }

    .card-edit-switch-label {
        font-size: 13px;
        color: var(--t1);
        font-weight: 600;
    }

    .card-edit-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 16px;
        border-top: 1px solid var(--border-color);
        margin-top: 4px;
        gap: 10px;
    }

    .card-edit-actions-right {
        display: flex;
        gap: 8px;
    }

    .card-edit-reset {
        background: none;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 13px;
        color: #9aa5b4;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: color 0.2s, border-color 0.2s;
        i { font-size: 14px; }
        &:hover { color: var(--t1); border-color: var(--t1); }
    }

    .card-edit-delete {
        background: none;
        border: 1px solid #f0c0cc;
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 13px;
        color: #f93a6d;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background 0.2s;
        i { font-size: 14px; }
        &:hover { background: rgba(249,58,109,0.08); }
    }

    .card-edit-save {
        background: var(--theme);
        border: none;
        border-radius: 8px;
        padding: 8px 20px;
        font-size: 13px;
        font-weight: 700;
        color: #fff;
        cursor: pointer;
        transition: opacity 0.2s;
        &:hover { opacity: 0.85; }
    }

    /* 过渡动画 */
    .card-edit-fade-enter-active,
    .card-edit-fade-leave-active {
        transition: opacity 0.2s ease;
        .card-edit-modal { transition: transform 0.2s ease; }
    }
    .card-edit-fade-enter, .card-edit-fade-leave-to {
        opacity: 0;
        .card-edit-modal { transform: scale(0.95) translateY(10px); }
    }

    .manage-toggle {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 4px;
        color: #249ffd;
        display: flex;
        align-items: center;
        flex-shrink: 0;
        transition: opacity 0.15s;
        font-size: 16px;
        &.is-off {
            color: #bcc5d0;
        }
        &:hover {
            opacity: 0.7;
        }
    }

    .manage-name {
        font-size: 14px;
        color: var(--t1);
        flex: 0 0 auto;
        min-width: 80px;
    }

    .manage-tag {
        font-size: 11px;
        padding: 1px 6px;
        border-radius: 3px;
        background-color: rgba(36, 159, 253, 0.1);
        color: var(--theme);
        flex-shrink: 0;
    }

    .manage-url {
        font-size: 12px;
        color: #9aa5b4;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
        &:hover {
            color: var(--theme);
        }
    }

    .manage-delete {
        background: none;
        border: 1px solid #f0c0cc;
        border-radius: 4px;
        cursor: pointer;
        padding: 3px 8px;
        color: #f93a6d;
        display: flex;
        align-items: center;
        gap: 3px;
        flex-shrink: 0;
        font-size: 12px;
        transition: background-color 0.15s;
        margin-left: auto;
        i {
            font-size: 14px;
        }
        &:hover {
            background-color: rgba(249, 58, 109, 0.08);
        }
    }

    /* 添加新工具 */
    .manage-add {
        border-top: 1px solid var(--border-color);
        padding-top: 14px;
        margin-top: 4px;
    }

    .manage-add-title {
        font-size: 12px;
        color: #9aa5b4;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .manage-add-row {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
    }

    .manage-input {
        flex: 1;
        min-width: 120px;
        padding: 7px 11px;
        font-size: 13px;
        border: 1px solid var(--border-color);
        border-radius: 5px;
        background-color: transparent;
        color: var(--t1);
        outline: none;
        transition: border-color 0.2s;
        &::placeholder {
            color: #bcc5d0;
        }
        &:focus {
            border-color: var(--theme);
        }
    }

    .manage-add-btn {
        padding: 7px 18px;
        font-size: 13px;
        font-weight: 700;
        color: #fff;
        background-color: var(--theme);
        border: none;
        border-radius: 5px;
        cursor: pointer;
        white-space: nowrap;
        transition: opacity 0.2s;
        &:hover {
            opacity: 0.85;
        }
    }
}
</style>
