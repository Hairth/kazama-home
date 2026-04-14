<template>
    <div class="home">
        <Welcome />
        <Search v-model="searchText" @enter="enterFirst">
            <template slot-scope="data">
                <nuxt-link
                    v-for="(tool, index) in data.data"
                    v-show="showBtn(tool)"
                    :key="index"
                    :target="($store.state.setting.inNewTab && tool.path !== '/setting') ? '_blank' : '_self'"
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
            <draggable
                v-model="sectionsList"
                :disabled="!sortMode"
                handle=".section-drag-handle"
                :animation="200"
                @end="onSectionDragEnd"
            >
                <nya-container
                    v-for="section in sectionsList"
                    v-show="!searchText && !isSectionHidden(section._key)"
                    :key="section._key"
                    :icon="$store.state.sectionIcons[section._key] || (section._type === 'builtin' ? section._data.icon : 'folder-outline')"
                    :title="section._type === 'builtin' ? getSectionTitle(section._data.title) : section._data.title"
                >
                    <!-- 排序把手（排序模式） -->
                    <div v-if="sortMode" class="section-drag-handle">
                        <i class="eva eva-move-outline"></i>
                        <span>拖动排序</span>
                    </div>

                    <!-- 管理按钮（非排序模式） -->
                    <button
                        v-if="!sortMode"
                        class="section-manage-btn"
                        @click="handleToggleManage(section)"
                    >
                        <i :class="'eva ' + (managingSection === section._key ? 'eva-checkmark-outline' : 'eva-settings-2-outline')"></i>
                        {{ managingSection === section._key ? '完成' : '管理' }}
                    </button>

                    <!-- 工具卡片网格 + 管理面板（排序模式下隐藏） -->
                    <template v-if="!sortMode">
                        <!-- 工具卡片网格（始终显示） -->
                        <div class="tool-card-grid">
                            <!-- 内置工具卡片 -->
                            <template v-if="section._type === 'builtin'">
                                <nuxt-link
                                    v-for="(tool, index2) in section._data.list"
                                    v-show="!isHidden(tool.path)"
                                    :key="'card-' + section._key + '-' + index2"
                                    class="tool-card"
                                    :target="($store.state.setting.inNewTab && tool.path !== '/setting') ? '_blank' : '_self'"
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
                            </template>
                            <!-- 自定义工具卡片 -->
                            <a
                                v-for="tool in customToolsForSection(section._data.title)"
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
                            <!-- + 添加工具卡片（仅管理模式） -->
                            <div
                                v-if="managingSection === section._key"
                                class="tool-card tool-card-add"
                                @click="openAddTool(section._data.title)"
                            >
                                <div class="tool-card-icon tool-card-add-icon">
                                    <i class="eva eva-plus-outline"></i>
                                </div>
                                <span class="tool-card-name">添加工具</span>
                            </div>
                        </div>

                        <!-- 管理面板（仅管理模式，显示在网格下方） -->
                        <div v-if="managingSection === section._key" class="manage-panel">
                            <!-- 改名 -->
                            <div class="manage-rename">
                                <i class="eva eva-edit-2-outline"></i>
                                <input
                                    v-model="renameSectionName"
                                    class="manage-input manage-rename-input"
                                    :placeholder="section._data.title"
                                    maxlength="20"
                                    @keyup.enter="section._type === 'builtin' ? saveRename(section._data.title) : saveRenameCustom(section._data)"
                                />
                                <button class="manage-rename-btn" @click="section._type === 'builtin' ? saveRename(section._data.title) : saveRenameCustom(section._data)">重命名</button>
                                <button
                                    v-if="section._type === 'builtin' && $store.state.sectionNames[section._data.title]"
                                    class="manage-rename-reset"
                                    @click="resetRename(section._data.title)"
                                >还原</button>
                            </div>

                            <!-- 图标选择 -->
                            <div class="manage-icon-row">
                                <i class="eva eva-image-outline"></i>
                                <span class="manage-icon-label">模块图标</span>
                                <button class="manage-icon-pick-btn" @click="toggleIconPicker(section._key)">
                                    <i :class="'eva eva-' + ($store.state.sectionIcons[section._key] || (section._type === 'builtin' ? section._data.icon : 'folder-outline'))"></i>
                                    更换图标
                                </button>
                                <button
                                    v-if="$store.state.sectionIcons[section._key]"
                                    class="manage-rename-reset"
                                    @click="setSectionIcon(section._key, '')"
                                >还原</button>
                            </div>
                            <!-- 图标选择器网格 -->
                            <div v-if="iconPickerOpenKey === section._key" class="section-icon-picker">
                                <div class="section-icon-grid">
                                    <button
                                        v-for="ico in sectionIconList"
                                        :key="ico"
                                        :class="['section-icon-item', { active: ($store.state.sectionIcons[section._key] || (section._type === 'builtin' ? section._data.icon : 'folder-outline')) === ico }]"
                                        :title="ico"
                                        @click="setSectionIcon(section._key, ico)"
                                    >
                                        <i :class="'eva eva-' + ico"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- 工具列表 -->
                            <div class="manage-list">
                                <!-- 内置工具（仅内置模块） -->
                                <template v-if="section._type === 'builtin'">
                                    <div
                                        v-for="(tool, idx) in section._data.list"
                                        :key="'m-' + section._key + '-' + idx"
                                        class="manage-item"
                                        :class="{ 'is-hidden': isHidden(tool.path) }"
                                    >
                                        <button class="manage-toggle" :class="{ 'is-off': isHidden(tool.path) }" @click="toggleVisibility(tool.path)">
                                            <i :class="'eva ' + (isHidden(tool.path) ? 'eva-eye-off-outline' : 'eva-eye-outline')"></i>
                                        </button>
                                        <span class="manage-name">{{ tool.name }}</span>
                                        <span class="manage-tag">内置</span>
                                    </div>
                                </template>
                                <!-- 自定义工具 -->
                                <div
                                    v-for="tool in customToolsForSection(section._data.title)"
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

                            <!-- 删除整个模块（仅自定义模块） -->
                            <div v-if="section._type === 'custom'" class="manage-section-delete-wrap">
                                <button class="manage-section-delete" @click="deleteCustomSection(section._data)">
                                    <i class="eva eva-trash-2-outline"></i>
                                    删除整个模块
                                </button>
                            </div>
                        </div>
                    </template>
                </nya-container>
            </draggable>

            <!-- 模块显示/隐藏面板 -->
            <transition name="section-vis-fade">
                <div v-if="sectionVisibilityOpen && !searchText" class="section-vis-panel">
                    <div class="section-vis-list">
                        <div
                            v-for="section in sectionsList"
                            :key="'vis-' + section._key"
                            class="section-vis-item"
                            :class="{ 'is-hidden': isSectionHidden(section._key) }"
                        >
                            <button
                                class="manage-toggle"
                                :class="{ 'is-off': isSectionHidden(section._key) }"
                                @click="toggleSectionVisibility(section._key)"
                            >
                                <i :class="'eva ' + (isSectionHidden(section._key) ? 'eva-eye-off-outline' : 'eva-eye-outline')"></i>
                            </button>
                            <span class="section-vis-name">{{ section._type === 'builtin' ? getSectionTitle(section._data.title) : section._data.title }}</span>
                        </div>
                    </div>
                </div>
            </transition>

            <!-- 底部操作：排序 + 显示模块 + 新建模块 -->
            <div v-show="!searchText" class="bottom-actions-bar">
                <button class="sort-mode-btn" :class="{ active: sortMode }" @click="toggleSortMode">
                    <i class="eva eva-swap-outline"></i>
                    {{ sortMode ? '完成排序' : '排序模块' }}
                </button>
                <button class="sort-mode-btn" :class="{ active: sectionVisibilityOpen }" @click="sectionVisibilityOpen = !sectionVisibilityOpen">
                    <i class="eva eva-eye-outline"></i>
                    显示模块
                </button>
                <button class="add-section-btn" @click="openAddSection">
                    <i class="eva eva-plus-circle-outline"></i>
                    新建模块
                </button>
            </div>
        </template>

        <!-- 卡片编辑模态窗 -->
        <transition name="card-edit-fade">
            <div v-if="cardEdit" class="card-edit-overlay" @click.self="closeCardEdit">
                <div class="card-edit-modal">
                    <div class="card-edit-header">
                        <span class="card-edit-title">编辑「{{ cardEdit.name }}」</span>
                        <button class="card-edit-close" @click="closeCardEdit"><i class="eva eva-close-outline"></i></button>
                    </div>

                    <!-- 自定义工具名称和 URL -->
                    <template v-if="!cardEdit.isBuiltin">
                        <div class="card-edit-section">
                            <label class="card-edit-label">工具名称</label>
                            <input v-model="cardEditName" class="card-edit-input" placeholder="工具名称" maxlength="20" />
                        </div>
                        <div class="card-edit-section">
                            <label class="card-edit-label">跳转 URL</label>
                            <input v-model="cardEditUrl" class="card-edit-input" placeholder="https://..." />
                        </div>
                    </template>

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
                        <span class="tab-indicator" ref="tabIndicator"></span>
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

        <!-- 添加工具弹窗 -->
        <transition name="card-edit-fade">
            <div v-if="addTool" class="card-edit-overlay" @click.self="closeAddTool">
                <div class="card-edit-modal">
                    <div class="card-edit-header">
                        <span class="card-edit-title">添加自定义工具</span>
                        <button class="card-edit-close" @click="closeAddTool"><i class="eva eva-close-outline"></i></button>
                    </div>
                    <div class="card-edit-section">
                        <label class="card-edit-label">工具名称</label>
                        <input v-model="addToolName" class="card-edit-input" placeholder="例：百度翻译" maxlength="20" autofocus @keyup.enter="submitAddTool" />
                    </div>
                    <div class="card-edit-section">
                        <label class="card-edit-label">跳转 URL</label>
                        <input v-model="addToolUrl" class="card-edit-input" placeholder="https://..." @keyup.enter="submitAddTool" />
                    </div>
                    <div class="card-edit-actions">
                        <button class="card-edit-reset" @click="closeAddTool">取消</button>
                        <div class="card-edit-actions-right">
                            <button class="card-edit-save" @click="submitAddTool">添加</button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- 新建模块弹窗 -->
        <transition name="card-edit-fade">
            <div v-if="addSection" class="card-edit-overlay" @click.self="closeAddSection">
                <div class="card-edit-modal">
                    <div class="card-edit-header">
                        <span class="card-edit-title">新建模块</span>
                        <button class="card-edit-close" @click="closeAddSection"><i class="eva eva-close-outline"></i></button>
                    </div>
                    <div class="card-edit-section">
                        <label class="card-edit-label">模块名称</label>
                        <input v-model="addSectionName" class="card-edit-input" placeholder="例：常用工具" maxlength="20" autofocus @keyup.enter="submitAddSection" />
                    </div>
                    <div class="card-edit-actions">
                        <button class="card-edit-reset" @click="closeAddSection">取消</button>
                        <div class="card-edit-actions-right">
                            <button class="card-edit-save" @click="submitAddSection">创建</button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
        <!-- 删除模块确认弹窗 -->
        <transition name="card-edit-fade">
            <div v-if="deletingSectionConfirm" class="card-edit-overlay" @click.self="deletingSectionConfirm = null">
                <div class="card-edit-modal">
                    <div class="card-edit-header">
                        <span class="card-edit-title">删除模块</span>
                        <button class="card-edit-close" @click="deletingSectionConfirm = null"><i class="eva eva-close-outline"></i></button>
                    </div>
                    <div class="card-edit-section">
                        确定要删除模块「<strong>{{ deletingSectionConfirm.title }}</strong>」及其所有工具吗？此操作无法撤销。
                    </div>
                    <div class="card-edit-actions">
                        <button class="card-edit-reset" @click="deletingSectionConfirm = null">取消</button>
                        <div class="card-edit-actions-right">
                            <button class="card-edit-delete" @click="confirmDeleteSection">
                                <i class="eva eva-trash-2-outline"></i>确认删除
                            </button>
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
import draggable from 'vuedraggable';
import { animate, stagger, utils } from '~/assets/js/anime.esm.min.js';
export default {
    name: 'Home',
    components: {
        Favorites,
        Search,
        Welcome,
        draggable
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
            renameSectionName: '',
            sectionsList: [],
            sortMode: false,
            // 卡片编辑模态窗
            cardEdit: null,
            cardEditIconType: 'emoji',
            cardEditValue: '',
            cardEditAutoUrl: '',
            cardEditFetching: false,
            cardEditFetchError: '',
            cardEditHidden: false,
            cardEditName: '',
            cardEditUrl: '',
            // 添加工具弹窗
            addTool: null,
            addToolName: '',
            addToolUrl: '',
            // 新建模块弹窗
            addSection: false,
            addSectionName: '',
            // 删除模块确认弹窗
            deletingSectionConfirm: null,
            // 模块显示/隐藏面板
            sectionVisibilityOpen: false,
            // 图标选择器
            iconPickerOpenKey: null,
            sectionIconList: [
                'folder-outline', 'folder-add-outline', 'archive-outline',
                'grid-outline', 'layers-outline', 'layout-outline',
                'bookmark-outline', 'briefcase-outline', 'cube-outline',
                'code-outline', 'hash-outline', 'monitor-outline',
                'image-outline', 'film-outline', 'music-outline',
                'globe-outline', 'link-2-outline', 'wifi-outline',
                'settings-2-outline', 'options-2-outline', 'options-outline',
                'star-outline', 'heart-outline', 'award-outline',
                'home-outline', 'people-outline', 'person-outline',
                'shopping-cart-outline', 'shopping-bag-outline', 'pricetags-outline',
                'bulb-outline', 'color-palette-outline', 'brush-outline',
                'book-open-outline', 'book-outline', 'file-text-outline',
                'trending-up-outline', 'bar-chart-outline', 'pie-chart-outline',
                'hard-drive-outline', 'download-outline', 'upload-outline',
                'lock-outline', 'shield-outline', 'keypad-outline',
                'camera-outline', 'video-outline', 'headphones-outline',
                'email-outline', 'bell-outline', 'message-circle-outline',
                'calendar-outline', 'clock-outline', 'compass-outline',
                'search-outline', 'map-outline', 'pin-outline',
                'sun-outline', 'moon-outline', 'flash-outline',
                'scissors-outline', 'gift-outline', 'flag-outline'
            ]
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
    mounted() {
        this.syncSectionsList();
        this.$nextTick(() => {
            // 工具卡片入场 stagger 动画
            const cards = this.$el.querySelectorAll('.tool-card:not(.tool-card-add)');
            if (cards.length) {
                animate(cards, {
                    opacity: [0, 1],
                    translateY: [16, 0],
                    scale: [0.95, 1],
                    duration: 420,
                    delay: stagger(15),
                    ease: 'outCubic'
                });
            }
        });

        // 工具卡片 hover 动画（事件委托）
        const _glowFallback = ['#249ffd','#f472b6','#a78bfa','#34d399','#fb923c','#60a5fa','#f59f00','#20c997'];
        this._onCardOver = (e) => {
            const card = e.target.closest('.tool-card');
            if (!card || card.classList.contains('tool-card-add')) return;
            if (card.contains(e.relatedTarget)) return;
            // 读图标颜色，写入 --glow-color
            const icon = card.querySelector('.tool-card-icon');
            if (icon) {
                const bg = icon.style.background || icon.style.backgroundColor;
                const color = (bg && !bg.includes('var('))
                    ? bg
                    : _glowFallback[Math.floor(Math.random() * _glowFallback.length)];
                card.style.setProperty('--glow-color', color);
                animate(icon, { scale: 1.18, rotate: 8, duration: 320, ease: 'outBack' });
            }
            animate(card, { translateY: -6, duration: 180, ease: 'outQuad' });
        };
        this._onCardOut = (e) => {
            const card = e.target.closest('.tool-card');
            if (!card || card.classList.contains('tool-card-add')) return;
            if (card.contains(e.relatedTarget)) return;
            animate(card, { translateY: 0, rotateX: 0, rotateY: 0, duration: 500, ease: 'outBack' });
            const icon = card.querySelector('.tool-card-icon');
            if (icon) animate(icon, { scale: 1, rotate: 0, duration: 380, ease: 'outBack' });
        };
        // 3D 倾斜（mousemove 委托）
        this._onCardMove = (e) => {
            const card = e.target.closest('.tool-card');
            if (!card || card.classList.contains('tool-card-add')) return;
            const rect = card.getBoundingClientRect();
            const rx = ((e.clientY - rect.top) / rect.height - 0.5) * -17;
            const ry = ((e.clientX - rect.left) / rect.width - 0.5) * 17;
            utils.set(card, { rotateX: rx, rotateY: ry });
        };
        this.$el.addEventListener('mouseover', this._onCardOver);
        this.$el.addEventListener('mouseout', this._onCardOut);
        this.$el.addEventListener('mousemove', this._onCardMove);

        // 底部操作按钮 hover 弹跳
        this._onBtnOver = (e) => {
            const btn = e.target.closest('.sort-mode-btn, .add-section-btn');
            if (!btn || btn.contains(e.relatedTarget)) return;
            animate(btn, { scale: 1.06, duration: 180, ease: 'outBack' });
        };
        this._onBtnOut = (e) => {
            const btn = e.target.closest('.sort-mode-btn, .add-section-btn');
            if (!btn || btn.contains(e.relatedTarget)) return;
            animate(btn, { scale: 1, duration: 260, ease: 'outCubic' });
        };
        this.$el.addEventListener('mouseover', this._onBtnOver);
        this.$el.addEventListener('mouseout', this._onBtnOut);
    },
    beforeDestroy() {
        if (this._onCardOver) {
            this.$el.removeEventListener('mouseover', this._onCardOver);
            this.$el.removeEventListener('mouseout', this._onCardOut);
            this.$el.removeEventListener('mousemove', this._onCardMove);
        }
        if (this._onBtnOver) {
            this.$el.removeEventListener('mouseover', this._onBtnOver);
            this.$el.removeEventListener('mouseout', this._onBtnOut);
        }
    },
    watch: {
        '$store.state.customSections'() { this.syncSectionsList(); },
        '$store.state.sectionOrder'() { this.syncSectionsList(); },
        cardEditIconType() {
            this.$nextTick(() => this._positionTabIndicator(true));
        },
        cardEdit(val) {
            if (val) {
                this.$nextTick(() => this._positionTabIndicator(false));
            }
        },
        managingSection(val) {
            if (val) {
                this.$nextTick(() => {
                    const panel = this.$el.querySelector('.manage-panel');
                    if (!panel) return;
                    animate(panel, {
                        opacity: [0, 1],
                        translateY: [-12, 0],
                        scale: [0.97, 1],
                        duration: 340,
                        ease: 'outCubic'
                    });
                });
            }
        }
    },
    methods: {
        _positionTabIndicator(animated) {
            const indicator = this.$refs.tabIndicator;
            if (!indicator) return;
            const activeTab = indicator.parentElement.querySelector('.card-edit-tab.active');
            if (!activeTab) return;
            const containerRect = indicator.parentElement.getBoundingClientRect();
            const tabRect = activeTab.getBoundingClientRect();
            const left = tabRect.left - containerRect.left;
            const width = tabRect.width;
            if (animated) {
                animate(indicator, { left, width, duration: 280, ease: 'outCubic' });
            } else {
                utils.set(indicator, { left, width });
            }
        },
        enterFirst(e) {
            if (this.$store.state.setting.inNewTab && e.path !== '/setting') {
                window.open(e.path);
            } else {
                this.$router.push(e.path);
            }
        },
        showSection() {
            return true;
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
        handleToggleManage(section) {
            const key = section._key;
            if (this.managingSection === key) {
                this.managingSection = null;
                this.iconPickerOpenKey = null;
            } else {
                this.managingSection = key;
                this.iconPickerOpenKey = null;
                this.renameSectionName = section._type === 'builtin'
                    ? (this.$store.state.sectionNames[section._data.title] || '')
                    : section._data.title;
            }
        },
        isSectionHidden(key) {
            return (this.$store.state.setting.hideSections || []).includes(key);
        },
        toggleSectionVisibility(key) {
            const list = [...(this.$store.state.setting.hideSections || [])];
            const idx = list.indexOf(key);
            if (idx === -1) list.push(key);
            else list.splice(idx, 1);
            this.$store.commit('SET_STORE', { key: 'setting.hideSections', value: list });
        },
        toggleIconPicker(key) {
            this.iconPickerOpenKey = this.iconPickerOpenKey === key ? null : key;
        },
        setSectionIcon(key, icon) {
            this.$store.commit('SET_SECTION_ICON', { key, icon });
            this.iconPickerOpenKey = null;
        },
        syncSectionsList() {
            const builtIn = this.$store.state.tools.map(t => ({ _key: t.title, _type: 'builtin', _data: t }));
            const custom = this.$store.state.customSections.map(s => ({ _key: 'cs:' + s.id, _type: 'custom', _data: s }));
            const all = [...builtIn, ...custom];
            const order = this.$store.state.sectionOrder || [];
            if (!order.length) { this.sectionsList = all; return; }
            const ordered = order.map(k => all.find(s => s._key === k)).filter(Boolean);
            const unordered = all.filter(s => !order.includes(s._key));
            this.sectionsList = [...ordered, ...unordered];
        },
        onSectionDragEnd() {
            this.$store.commit('SET_SECTION_ORDER', this.sectionsList.map(s => s._key));
        },
        toggleSortMode() {
            this.sortMode = !this.sortMode;
            if (!this.sortMode) this.syncSectionsList();
        },
        toggleManage(index) {
            const section = this.sectionsList.find((s, i) => s._type === 'builtin' && i === index);
            if (section) this.handleToggleManage(section);
        },
        toggleManageCustom(sectionId) {
            const section = this.sectionsList.find(s => s._type === 'custom' && s._data.id === sectionId);
            if (section) this.handleToggleManage(section);
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
            this.cardEditName = isBuiltin ? '' : tool.name;
            this.cardEditUrl = isBuiltin ? '' : (tool.url || '');
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
                const newName = this.cardEditName.trim();
                const newUrl = this.cardEditUrl.trim();
                if (newName || newUrl) {
                    this.$store.commit('UPDATE_CUSTOM_TOOL', {
                        id: tool.id,
                        name: newName || tool.name,
                        url: newUrl || tool.url
                    });
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
        },
        saveRenameCustom(section) {
            const name = this.renameSectionName.trim();
            if (!name) { this.$noty.error('模块名称不能为空'); return; }
            this.$store.commit('RENAME_CUSTOM_SECTION', { id: section.id, name });
            this.$noty.success('已保存');
        },
        deleteCustomSection(section) {
            this.deletingSectionConfirm = section;
        },
        confirmDeleteSection() {
            const section = this.deletingSectionConfirm;
            this.$store.commit('REMOVE_CUSTOM_SECTION', section.id);
            if (this.managingSection === 'cs:' + section.id) {
                this.managingSection = null;
            }
            this.deletingSectionConfirm = null;
        },
        openAddTool(sectionTitle) {
            this.addTool = { sectionTitle };
            this.addToolName = '';
            this.addToolUrl = '';
        },
        closeAddTool() {
            this.addTool = null;
        },
        submitAddTool() {
            const name = this.addToolName.trim();
            const url = this.addToolUrl.trim();
            if (!name) { this.$noty.error('请输入功能名称'); return; }
            if (!url) { this.$noty.error('请输入跳转 URL'); return; }
            if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
                this.$noty.error('URL 格式不正确，请以 http:// 或 https:// 开头');
                return;
            }
            this.$store.commit('ADD_CUSTOM_TOOL', {
                id: Date.now(),
                sectionTitle: this.addTool.sectionTitle,
                name,
                url,
                hidden: false
            });
            this.closeAddTool();
            this.$noty.success('添加成功');
        },
        openAddSection() {
            this.addSection = true;
            this.addSectionName = '';
        },
        closeAddSection() {
            this.addSection = false;
        },
        submitAddSection() {
            const name = this.addSectionName.trim();
            if (!name) { this.$noty.error('请输入模块名称'); return; }
            this.$store.commit('ADD_CUSTOM_SECTION', {
                id: Date.now(),
                title: name,
                icon: 'folder-outline'
            });
            this.closeAddSection();
            this.$noty.success('模块创建成功');
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
        perspective: 720px;
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
        overflow: visible;
        will-change: transform;
        transform-style: preserve-3d;

        &::before {
            content: '';
            position: absolute;
            inset: -1px;
            border-radius: 13px;
            opacity: 0;
            box-shadow:
                0 0 0 1px var(--glow-color, #7C3AED),
                0 0 8px 2px color-mix(in oklab, var(--glow-color, #7C3AED) 65%, transparent),
                0 0 14px 4px color-mix(in oklab, var(--glow-color, #7C3AED) 40%, transparent),
                0 0 20px 6px color-mix(in oklab, var(--glow-color, #7C3AED) 20%, transparent);
            transition: opacity 0.3s ease;
            pointer-events: none;
        }

        &:hover {
            text-decoration: none;
            &::before { opacity: 1; }
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
                0 0 0 1px var(--glow-color, #7C3AED),
                0 0 10px 3px color-mix(in oklab, var(--glow-color, #7C3AED) 85%, transparent),
                0 0 18px 5px color-mix(in oklab, var(--glow-color, #7C3AED) 60%, transparent),
                0 0 26px 8px color-mix(in oklab, var(--glow-color, #7C3AED) 30%, transparent);
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
        border: 1px solid rgba(36, 159, 253, 0.6);
        border-radius: 6px;
        padding: 3px 10px 3px 7px;
        font-size: 12px;
        color: #249ffd;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: color 0.2s, background-color 0.2s, border-color 0.2s, box-shadow 0.2s cubic-bezier(0,0,0.2,1);
        z-index: 1;
        font-weight: 600;
        i {
            font-size: 14px;
        }
        &:hover {
            background-color: rgba(36, 159, 253, 0.08);
            border-color: #249ffd;
            box-shadow: 0 0 0 3px rgba(36, 159, 253, 0.12);
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
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: opacity 0.2s cubic-bezier(0,0,0.2,1), box-shadow 0.2s cubic-bezier(0,0,0.2,1);
        &:hover {
            opacity: 0.9;
            box-shadow: 0 2px 8px rgba(36,159,253,0.35);
        }
    }

    .manage-rename-reset {
        padding: 7px 12px;
        font-size: 13px;
        color: #9aa5b4;
        background: none;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: color 0.2s, border-color 0.2s cubic-bezier(0,0,0.2,1);
        &:hover {
            color: var(--t1);
            border-color: var(--t1);
        }
    }

    /* 图标行 */
    .manage-icon-row {
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
        .manage-icon-label {
            font-size: 13px;
            color: #9aa5b4;
            white-space: nowrap;
        }
    }

    .manage-icon-pick-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 6px 12px;
        font-size: 13px;
        font-weight: 600;
        color: #249ffd;
        background: none;
        border: 1px solid rgba(36, 159, 253, 0.6);
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s cubic-bezier(0,0,0.2,1);
        i { font-size: 15px; }
        &:hover {
            background-color: rgba(36, 159, 253, 0.08);
            border-color: #249ffd;
            box-shadow: 0 0 0 3px rgba(36, 159, 253, 0.12);
        }
    }

    /* 图标选择器 */
    .section-icon-picker {
        padding-bottom: 14px;
        margin-bottom: 14px;
        border-bottom: 1px solid var(--border-color);
    }

    .section-icon-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .section-icon-item {
        width: 34px;
        height: 34px;
        border-radius: 7px;
        border: 1px solid #e5e7eb;
        background: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color 0.15s, border-color 0.15s, color 0.15s;
        color: #6b7280;
        padding: 0;
        i { font-size: 16px; }
        &:hover {
            background-color: rgba(36, 159, 253, 0.1);
            border-color: #249ffd;
            color: #249ffd;
        }
        &.active {
            background-color: #249ffd;
            border-color: #249ffd;
            color: #fff;
        }
    }

    body.dark .section-icon-item {
        border-color: rgba(66,76,94,0.6);
        color: #9aa5b4;
        &:hover {
            background-color: rgba(36, 159, 253, 0.15);
            border-color: #249ffd;
            color: #249ffd;
        }
    }

    .manage-list {
        margin-bottom: 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .manage-item {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px 4px 6px;
        border-radius: 1rem;
        border: 1px solid rgba(0,0,0,0.08);
        background-color: #f9fafb;
        transition: background-color 0.15s, border-color 0.15s cubic-bezier(0,0,0.2,1);
        gap: 6px;
        &:hover {
            background-color: #f3f4f6;
            border-color: rgba(0,0,0,0.13);
        }
        &.is-hidden {
            opacity: 0.4;
        }
    }

    body.dark .manage-item {
        background-color: rgba(255,255,255,0.05);
        border-color: rgba(255,255,255,0.08);
        &:hover {
            background-color: rgba(255,255,255,0.08);
            border-color: rgba(255,255,255,0.13);
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
        border: 1px solid rgba(0,0,0,0.07);
        box-shadow: 0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
    }

    body.dark .card-edit-modal {
        background: #1e293b;
        border: 1px solid rgba(255,255,255,0.07);
        box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2);
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
        position: relative;
        display: flex;
        gap: 6px;
        margin-bottom: 16px;
        background: rgba(0,0,0,0.04);
        border-radius: 8px;
        padding: 4px;
    }

    body.dark .card-edit-tabs { background: rgba(255,255,255,0.06); }

    .tab-indicator {
        position: absolute;
        top: 4px;
        left: 4px;
        height: calc(100% - 8px);
        width: 0;
        background: #fff;
        border-radius: 6px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        pointer-events: none;
        z-index: 0;
    }

    body.dark .tab-indicator {
        background: #334155;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }

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
        transition: color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        white-space: nowrap;
        position: relative;
        z-index: 1;
        i { font-size: 13px; }
        &.active {
            color: var(--theme);
        }
        &:hover:not(.active) { color: var(--t1); }
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
        transition: border-color 0.2s, box-shadow 0.2s cubic-bezier(0,0,0.2,1);
        &::placeholder { color: #bcc5d0; }
        &:focus { border-color: var(--theme); box-shadow: 0 0 0 3px rgba(36,159,253,0.12); }
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
        transition: color 0.2s, border-color 0.2s cubic-bezier(0,0,0.2,1);
        i { font-size: 14px; }
        &:hover { color: var(--t1); border-color: var(--t1); }
    }

    .card-edit-delete {
        background: none;
        border: 1px solid rgba(249,58,109,0.3);
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 13px;
        color: #f93a6d;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background 0.2s, border-color 0.2s cubic-bezier(0,0,0.2,1);
        i { font-size: 14px; }
        &:hover {
            background: rgba(249,58,109,0.07);
            border-color: rgba(249,58,109,0.6);
        }
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
        transition: opacity 0.2s, box-shadow 0.2s cubic-bezier(0,0,0.2,1);
        &:hover {
            opacity: 0.9;
            box-shadow: 0 2px 10px rgba(36,159,253,0.4);
        }
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
        font-size: 13px;
        color: var(--t1);
        flex: 0 0 auto;
        white-space: nowrap;
    }

    .manage-url {
        display: none;
    }

    .manage-tag {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 1rem;
        background-color: color-mix(in oklab, #249ffd 10%, white);
        border: 1px solid color-mix(in oklab, #249ffd 15%, white);
        color: var(--theme);
        flex-shrink: 0;
        font-weight: 600;
    }

    body.dark .manage-tag {
        background-color: color-mix(in oklab, #249ffd 15%, #1e293b);
        border-color: color-mix(in oklab, #249ffd 22%, #1e293b);
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
        border-radius: 6px;
        background-color: transparent;
        color: var(--t1);
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s cubic-bezier(0,0,0.2,1);
        &::placeholder {
            color: #bcc5d0;
        }
        &:focus {
            border-color: var(--theme);
            box-shadow: 0 0 0 3px rgba(36,159,253,0.12);
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

    /* + 添加工具卡片 */
    .tool-card-add {
        border: 2px dashed rgba(36, 159, 253, 0.4);
        background: none !important;
        box-shadow: none !important;
        cursor: pointer;
        opacity: 0.7;
        justify-content: flex-start;
        transition: opacity 0.2s, border-color 0.2s, transform 0.2s;
        &:hover {
            opacity: 1;
            border-color: rgba(36, 159, 253, 0.8);
            transform: none;
            &::before { opacity: 0 !important; }
        }
    }

    .tool-card-add-icon {
        background: rgba(36, 159, 253, 0.12) !important;
        box-shadow: none !important;
        i { font-size: 18px; color: #249ffd; }
    }

    /* 排序把手 */
    .section-drag-handle {
        position: absolute;
        top: 8px;
        right: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 3px 10px 3px 7px;
        font-size: 12px;
        font-weight: 600;
        color: #249ffd;
        border: 1px solid #249ffd;
        border-radius: 5px;
        cursor: grab;
        user-select: none;
        z-index: 1;
        transition: background-color 0.15s;
        i { font-size: 14px; }
        &:active { cursor: grabbing; }
        &:hover { background-color: rgba(36, 159, 253, 0.08); }
    }

    /* draggable 排序占位符 */
    .sortable-ghost {
        opacity: 0.35;
        background: rgba(36, 159, 253, 0.06) !important;
        border: 1.5px dashed #249ffd !important;
        border-radius: 12px;
        box-shadow: none !important;
        transition: none;
    }
    .sortable-chosen {
        box-shadow: 0 8px 24px rgba(36, 159, 253, 0.22), 0 2px 8px rgba(0,0,0,0.1) !important;
        transform: scale(1.02);
        z-index: 10;
        cursor: grabbing;
    }

    /* 模块显示/隐藏面板 */
    .section-vis-panel {
        margin-bottom: 8px;
        padding: 12px 16px;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        background: var(--t2);
    }

    body.dark .section-vis-panel {
        background: #1a2234;
        border-color: rgba(66,76,94,0.5);
    }

    .section-vis-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .section-vis-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px 4px 6px;
        border-radius: 1rem;
        border: 1px solid rgba(0,0,0,0.08);
        background-color: #f9fafb;
        transition: opacity 0.15s;
        &.is-hidden {
            opacity: 0.45;
        }
    }

    body.dark .section-vis-item {
        background-color: rgba(255,255,255,0.05);
        border-color: rgba(255,255,255,0.08);
    }

    .section-vis-name {
        font-size: 13px;
        color: var(--t1);
        white-space: nowrap;
    }

    .section-vis-fade-enter-active,
    .section-vis-fade-leave-active {
        transition: opacity 0.18s, transform 0.18s;
    }
    .section-vis-fade-enter,
    .section-vis-fade-leave-to {
        opacity: 0;
        transform: translateY(-6px);
    }

    /* 底部操作栏 */
    .bottom-actions-bar {
        display: flex;
        justify-content: center;
        gap: 12px;
        padding: 10px 0 20px;
    }

    .sort-mode-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 20px;
        font-size: 14px;
        font-weight: 600;
        color: #9aa5b4;
        background: none;
        border: 1px dashed var(--border-color);
        border-radius: 8px;
        cursor: pointer;
        transition: color 0.2s, border-color 0.2s, background-color 0.2s, box-shadow 0.2s cubic-bezier(0,0,0.2,1);
        i { font-size: 16px; }
        &:hover {
            color: #249ffd;
            border-color: rgba(36, 159, 253, 0.6);
            box-shadow: 0 0 0 3px rgba(36, 159, 253, 0.08);
        }
        &.active {
            border-style: solid;
            color: #249ffd;
            border-color: #249ffd;
            background-color: rgba(36, 159, 253, 0.06);
            box-shadow: 0 0 0 3px rgba(36, 159, 253, 0.1);
        }
    }

    /* 新建模块按钮 */
    .add-section-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 20px;
        font-size: 14px;
        font-weight: 600;
        color: #249ffd;
        background: none;
        border: 1px dashed rgba(36, 159, 253, 0.5);
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s cubic-bezier(0,0,0.2,1);
        i { font-size: 16px; }
        &:hover {
            background-color: rgba(36, 159, 253, 0.06);
            border-color: rgba(36, 159, 253, 0.8);
            box-shadow: 0 0 0 3px rgba(36, 159, 253, 0.1);
        }
    }

    /* 删除整个模块 */
    .manage-section-delete-wrap {
        display: flex;
        justify-content: flex-end;
        padding-top: 14px;
        margin-top: 8px;
        border-top: 1px solid var(--border-color);
    }

    .manage-section-delete {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 6px 14px;
        font-size: 13px;
        color: #f93a6d;
        background: none;
        border: 1px solid #f0c0cc;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.15s;
        i { font-size: 14px; }
        &:hover { background-color: rgba(249, 58, 109, 0.08); }
    }
}
</style>
