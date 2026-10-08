<template>
    <div class="home">
        <ServerUptime />
        <div class="pre-weather-bar">
            <a href="https://github.com/Ice-Hazymoon/MikuTools" target="_blank" rel="noopener noreferrer" class="pre-weather-link">Powered by MikuTools</a>
            <button v-if="$route.path === '/'" class="logout-btn" @click="handleLogout">
                <i data-eva="log-out-outline" data-eva-width="16" data-eva-height="16"></i>
                <span>退出登录</span>
            </button>
        </div>
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
            title="全部工具"
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

                    <!-- 模块头部操作栏（非排序模式）：收起/展开 + 设置/管理 -->
                    <div v-if="!sortMode" class="section-header-actions">
                        <button
                            class="section-collapse-btn"
                            :title="isSectionCollapsed(section._key) ? '展开此模块' : '收起此模块'"
                            @click="toggleCollapseSection(section._key)"
                        >
                            <i :class="'eva ' + (isSectionCollapsed(section._key) ? 'eva-chevron-down-outline' : 'eva-chevron-up-outline')"></i>
                            <span>{{ isSectionCollapsed(section._key) ? '展开' : '收起' }}</span>
                        </button>
                        <button
                            class="section-manage-btn"
                            :class="{ active: managingSection === section._key }"
                            @click="handleToggleManage(section)"
                        >
                            <i :class="'eva ' + (managingSection === section._key ? 'eva-checkmark-outline' : 'eva-settings-2-outline')"></i>
                            <span>{{ managingSection === section._key ? '完成' : '设置' }}</span>
                        </button>
                    </div>

                    <template v-if="!sortMode">
                        <!-- 模块设置与管理面板（滑下展开在顶部） -->
                        <transition name="manage-panel-slide">
                            <div v-if="managingSection === section._key" class="manage-panel">
                                <div class="manage-panel-box">
                                    <div class="manage-panel-top">
                                        <div class="manage-panel-title">
                                            <i class="eva eva-options-2-outline"></i>
                                            <span>模块设置 · {{ section._type === 'builtin' ? getSectionTitle(section._data.title) : section._data.title }}</span>
                                        </div>
                                        <button class="manage-panel-close-btn" @click="handleToggleManage(section)">
                                            <i class="eva eva-close-outline"></i>
                                            <span>收起设置</span>
                                        </button>
                                    </div>

                                    <div class="manage-settings-row">
                                        <!-- 模块改名 -->
                                        <div class="manage-setting-item">
                                            <label class="manage-setting-label">
                                                <i class="eva eva-edit-2-outline"></i>
                                                <span>模块名称</span>
                                            </label>
                                            <div class="manage-rename-wrap">
                                                <input
                                                    v-model="renameSectionName"
                                                    class="manage-input manage-rename-input"
                                                    :placeholder="section._data.title"
                                                    maxlength="20"
                                                    @keyup.enter="section._type === 'builtin' ? saveRename(section._data.title) : saveRenameCustom(section._data)"
                                                />
                                                <button class="manage-rename-btn" @click="section._type === 'builtin' ? saveRename(section._data.title) : saveRenameCustom(section._data)">
                                                    重命名
                                                </button>
                                                <button
                                                    v-if="section._type === 'builtin' && $store.state.sectionNames[section._data.title]"
                                                    class="manage-rename-reset"
                                                    @click="resetRename(section._data.title)"
                                                >
                                                    还原
                                                </button>
                                            </div>
                                        </div>

                                        <!-- 图标定制 -->
                                        <div class="manage-setting-item">
                                            <label class="manage-setting-label">
                                                <i class="eva eva-image-outline"></i>
                                                <span>模块图标</span>
                                            </label>
                                            <div class="manage-icon-wrap">
                                                <div class="manage-icon-preview">
                                                    <i :class="'eva eva-' + ($store.state.sectionIcons[section._key] || (section._type === 'builtin' ? section._data.icon : 'folder-outline'))"></i>
                                                </div>
                                                <button
                                                    class="manage-icon-pick-btn"
                                                    :class="{ active: iconPickerOpenKey === section._key }"
                                                    @click="toggleIconPicker(section._key)"
                                                >
                                                    <i class="eva eva-grid-outline"></i>
                                                    <span>{{ iconPickerOpenKey === section._key ? '收起图标' : '更换图标' }}</span>
                                                </button>
                                                <button
                                                    v-if="$store.state.sectionIcons[section._key]"
                                                    class="manage-rename-reset"
                                                    @click="setSectionIcon(section._key, '')"
                                                >
                                                    还原
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- 图标选择器网格 -->
                                    <transition name="picker-slide">
                                        <div v-if="iconPickerOpenKey === section._key" class="section-icon-picker">
                                            <div class="section-icon-tip">点击快速更换模块图标：</div>
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
                                    </transition>

                                    <!-- 工具显隐快捷管理 -->
                                    <div class="manage-tools-section">
                                        <div class="manage-tools-header">
                                            <div class="manage-tools-title">
                                                <i class="eva eva-eye-outline"></i>
                                                <span>工具卡片显隐控制 (点击眼睛切换状态)</span>
                                            </div>
                                            <div class="manage-tools-stats">
                                                共 {{ (sectionToolLists[section._key] || []).length }} 项
                                            </div>
                                        </div>
                                        <div class="manage-list">
                                            <div
                                                v-for="card in sectionToolLists[section._key]"
                                                :key="'m-' + card._key"
                                                class="manage-item"
                                                :class="{ 'is-hidden': card._type === 'builtin' ? isHidden(card._data.path) : card._data.hidden }"
                                            >
                                                <button
                                                    v-if="card._type === 'builtin'"
                                                    class="manage-toggle"
                                                    :class="{ 'is-off': isHidden(card._data.path) }"
                                                    :title="isHidden(card._data.path) ? '点击显示' : '点击隐藏'"
                                                    @click="toggleVisibility(card._data.path)"
                                                >
                                                    <i :class="'eva ' + (isHidden(card._data.path) ? 'eva-eye-off-outline' : 'eva-eye-outline')"></i>
                                                </button>
                                                <button
                                                    v-else
                                                    class="manage-toggle"
                                                    :class="{ 'is-off': card._data.hidden }"
                                                    :title="card._data.hidden ? '点击显示' : '点击隐藏'"
                                                    @click="toggleCustomTool(card._data.id)"
                                                >
                                                    <i :class="'eva ' + (card._data.hidden ? 'eva-eye-off-outline' : 'eva-eye-outline')"></i>
                                                </button>
                                                <span class="manage-name">{{ card._data.name }}</span>
                                                <span v-if="card._type === 'builtin'" class="manage-tag">内置</span>
                                                <template v-else>
                                                    <span class="manage-tag manage-tag-custom">自定义</span>
                                                    <button class="manage-delete" title="删除工具" @click="removeCustomTool(card._data.id)">
                                                        <i class="eva eva-trash-2-outline"></i>
                                                    </button>
                                                </template>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 删除整个自定义模块 -->
                                    <div v-if="section._type === 'custom'" class="manage-section-delete-wrap">
                                        <button class="manage-section-delete" @click="deleteCustomSection(section._data)">
                                            <i class="eva eva-trash-2-outline"></i>
                                            <span>删除此模块</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </transition>

                        <!-- 收起状态下的折叠横条 -->
                        <div
                            v-if="isSectionCollapsed(section._key)"
                            class="section-collapsed-banner"
                            @click="toggleCollapseSection(section._key)"
                        >
                            <div class="section-collapsed-left">
                                <i class="eva eva-folder-outline"></i>
                                <span class="section-collapsed-title">模块已收起</span>
                                <span class="section-collapsed-count">含 {{ getVisibleToolsCount(section._key) }} 个可见工具</span>
                            </div>
                            <div class="section-collapsed-right">
                                <span>点击展开内容</span>
                                <i class="eva eva-chevron-down-outline"></i>
                            </div>
                        </div>

                        <!-- 展开状态下的工具卡片网格 -->
                        <div v-show="!isSectionCollapsed(section._key)" class="section-grid-wrapper">
                            <draggable
                                :list="sectionToolLists[section._key]"
                                tag="div"
                                class="tool-card-grid"
                                draggable=".tool-card-sortable"
                                filter=".tool-card-edit-btn"
                                :prevent-on-filter="false"
                                :group="toolDragGroup"
                                :disabled="managingSection === section._key"
                                :animation="180"
                                :delay="420"
                                :delay-on-touch-only="false"
                                :touch-start-threshold="4"
                                :force-fallback="true"
                                :fallback-on-body="true"
                                :fallback-tolerance="5"
                                :empty-insert-threshold="48"
                                ghost-class="tool-card-ghost"
                                chosen-class="tool-card-chosen"
                                drag-class="tool-card-dragging"
                                @start="onToolDragStart"
                                @end="onToolDragEnd"
                            >
                                <template v-for="card in sectionToolLists[section._key]">
                                    <div
                                        v-if="card._type === 'builtin'"
                                        v-show="!isHidden(card._data.path)"
                                        :key="card._key"
                                        class="tool-card tool-card-sortable"
                                        :title="card._data.name"
                                        role="link"
                                        tabindex="0"
                                        @click="openBuiltInCard(card._data, $event)"
                                        @keydown.enter.prevent="openBuiltInCard(card._data, $event)"
                                        @contextmenu.prevent="openCardEdit(card._data, true)"
                                    >
                                        <div class="tool-card-icon" :style="isImageIcon(getToolIcon(card._data)) ? { background: 'var(--card-icon-bg)' } : { background: cardColor(card._data.name) }">
                                            <img v-if="isImageIcon(getToolIcon(card._data))" :src="getToolIcon(card._data)" class="tool-card-img" @error="$event.target.style.display='none'" />
                                            <span v-else>{{ getToolIcon(card._data) }}</span>
                                        </div>
                                        <span class="tool-card-name">{{ card._data.name }}</span>
                                        <button class="tool-card-edit-btn" title="卡片设置 (右键亦可打开)" @click.prevent.stop="openCardEdit(card._data, true)">
                                            <i class="eva eva-settings-2-outline"></i>
                                        </button>
                                    </div>
                                    <div
                                        v-else
                                        v-show="!card._data.hidden"
                                        :key="card._key"
                                        class="tool-card tool-card-sortable tool-card-custom"
                                        :title="card._data.name"
                                        role="link"
                                        tabindex="0"
                                        @click="openCustomCard(card._data, $event)"
                                        @keydown.enter.prevent="openCustomCard(card._data, $event)"
                                        @contextmenu.prevent="openCardEdit(card._data, false)"
                                    >
                                        <div class="tool-card-icon" :style="isImageIcon(getToolIcon(card._data)) ? { background: 'var(--card-icon-bg)' } : { background: cardColor(card._data.name) }">
                                            <img v-if="isImageIcon(getToolIcon(card._data))" :src="getToolIcon(card._data)" class="tool-card-img" @error="$event.target.style.display='none'" />
                                            <span v-else>{{ getToolIcon(card._data) }}</span>
                                        </div>
                                        <span class="tool-card-name">{{ card._data.name }}</span>
                                        <span class="tool-card-external-mark" title="外部链接">
                                            <i class="eva eva-external-link-outline"></i>
                                        </span>
                                        <button class="tool-card-edit-btn" title="卡片设置 (右键亦可打开)" @click.prevent.stop="openCardEdit(card._data, false)">
                                            <i class="eva eva-settings-2-outline"></i>
                                        </button>
                                    </div>
                                </template>
                                <!-- + 添加工具卡片（仅管理模式） -->
                                <div
                                    v-if="managingSection === section._key"
                                    slot="footer"
                                    class="tool-card tool-card-add"
                                    @click="openAddTool(section._data.title)"
                                >
                                    <div class="tool-card-icon tool-card-add-icon">
                                        <i class="eva eva-plus-outline"></i>
                                    </div>
                                    <span class="tool-card-name">添加工具</span>
                                </div>
                            </draggable>
                        </div>
                    </template>
                </nya-container>
            </draggable>
            <!-- 模块显示/隐藏控制面板 -->
            <transition name="section-vis-fade">
                <div v-if="sectionVisibilityOpen && !searchText" class="section-vis-panel">
                    <div class="section-vis-header">
                        <div class="section-vis-header-title">
                            <i class="eva eva-grid-outline"></i>
                            <span>首页模块显示状态管理</span>
                        </div>
                        <div class="section-vis-header-actions">
                            <button class="section-vis-quick-btn" @click="showAllSections">
                                <i class="eva eva-checkmark-circle-2-outline"></i> 全部显示
                            </button>
                            <button class="section-vis-close-btn" @click="sectionVisibilityOpen = false">
                                <i class="eva eva-close-outline"></i>
                            </button>
                        </div>
                    </div>
                    <div class="section-vis-list">
                        <div
                            v-for="section in sectionsList"
                            :key="'vis-' + section._key"
                            class="section-vis-item"
                            :class="{ 'is-hidden': isSectionHidden(section._key) }"
                            @click="toggleSectionVisibility(section._key)"
                        >
                            <button
                                class="manage-toggle"
                                :class="{ 'is-off': isSectionHidden(section._key) }"
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
                <div class="bottom-actions-dock">
                    <button class="bottom-dock-btn" :class="{ active: sortMode }" @click="toggleSortMode">
                        <i class="eva eva-swap-outline"></i>
                        <span>{{ sortMode ? '完成排序' : '排序模块' }}</span>
                    </button>
                    <button class="bottom-dock-btn" :class="{ active: sectionVisibilityOpen }" @click="sectionVisibilityOpen = !sectionVisibilityOpen">
                        <i :class="'eva ' + (sectionVisibilityOpen ? 'eva-eye-off-outline' : 'eva-eye-outline')"></i>
                        <span>{{ sectionVisibilityOpen ? '收起显隐' : '显示模块' }}</span>
                    </button>
                    <button class="bottom-dock-btn bottom-dock-add" @click="openAddSection">
                        <i class="eva eva-plus-circle-outline"></i>
                        <span>新建模块</span>
                    </button>
                </div>
            </div>
        </template>

        <!-- 卡片编辑模态窗 -->
        <transition name="card-modal-fade">
            <div v-if="cardEdit" class="card-modal-overlay" @click.self="closeCardEdit">
                <div class="card-modal-dialog">
                    <div class="card-modal-header">
                        <div class="card-modal-header-info">
                            <div class="card-modal-header-icon">
                                <i class="eva eva-edit-2-outline"></i>
                            </div>
                            <div>
                                <h3 class="card-modal-title">自定义工具卡片</h3>
                                <p class="card-modal-sub">
                                    「{{ cardEdit.name }}」 · {{ cardEdit.isBuiltin ? '内置工具' : '自定义外链' }}
                                </p>
                            </div>
                        </div>
                        <button class="card-modal-close" title="关闭 (Esc)" @click="closeCardEdit">
                            <i class="eva eva-close-outline"></i>
                        </button>
                    </div>

                    <div class="card-modal-body">
                        <!-- 实时卡片 1:1 预览 -->
                        <div class="card-modal-preview-wrapper">
                            <div class="card-modal-preview-header">
                                <span class="card-modal-preview-tag">
                                    <i class="eva eva-eye-outline"></i> 实时效果预览
                                </span>
                                <span class="card-modal-preview-hint">修改即时所见</span>
                            </div>
                            <div class="card-modal-preview-box">
                                <div
                                    class="card-modal-preview-card"
                                    :style="{ '--glow-color': cardColor(cardEditName || cardEdit.name) }"
                                >
                                    <div
                                        class="tool-card-icon"
                                        :style="isImageIcon(cardEditValue) ? { background: 'var(--card-icon-bg)' } : { background: cardColor(cardEditName || cardEdit.name) }"
                                    >
                                        <img
                                            v-if="isImageIcon(cardEditValue)"
                                            :src="cardEditValue"
                                            class="tool-card-img"
                                            @error="$event.target.style.display='none'"
                                        />
                                        <span v-else>{{ cardEditValue || (cardEditName || cardEdit.name)[0] }}</span>
                                    </div>
                                    <span class="tool-card-name">{{ cardEditName || cardEdit.name }}</span>
                                    <span v-if="!cardEdit.isBuiltin" class="tool-card-external-mark">
                                        <i class="eva eva-external-link-outline"></i>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- 自定义工具名称和 URL -->
                        <template v-if="!cardEdit.isBuiltin">
                            <div class="card-modal-field">
                                <label class="card-modal-label">
                                    <i class="eva eva-text-outline"></i>
                                    <span>工具名称</span>
                                </label>
                                <input
                                    v-model="cardEditName"
                                    class="card-modal-input"
                                    placeholder="请输入工具名称"
                                    maxlength="20"
                                />
                            </div>
                            <div class="card-modal-field">
                                <label class="card-modal-label">
                                    <i class="eva eva-link-2-outline"></i>
                                    <span>跳转 URL</span>
                                </label>
                                <input
                                    v-model="cardEditUrl"
                                    class="card-modal-input"
                                    placeholder="https://example.com"
                                />
                            </div>
                        </template>

                        <!-- 图标设定 Tab -->
                        <div class="card-modal-field">
                            <label class="card-modal-label">
                                <i class="eva eva-image-outline"></i>
                                <span>图标设置方式</span>
                            </label>

                            <div class="card-modal-tabs">
                                <button
                                    :class="['card-modal-tab', { active: cardEditIconType === 'emoji' }]"
                                    @click="cardEditIconType = 'emoji'"
                                >
                                    <i class="eva eva-smiling-face-outline"></i>
                                    <span>Emoji / 文字</span>
                                </button>
                                <button
                                    :class="['card-modal-tab', { active: cardEditIconType === 'url' }]"
                                    @click="cardEditIconType = 'url'"
                                >
                                    <i class="eva eva-link-2-outline"></i>
                                    <span>图标 URL</span>
                                </button>
                                <button
                                    :class="['card-modal-tab', { active: cardEditIconType === 'auto' }]"
                                    @click="cardEditIconType = 'auto'"
                                >
                                    <i class="eva eva-download-outline"></i>
                                    <span>自动抓取</span>
                                </button>
                            </div>

                            <!-- Emoji / 文字面板 -->
                            <div v-if="cardEditIconType === 'emoji'" class="card-modal-tab-content">
                                <!-- 快捷 Emoji 推荐预设 -->
                                <div class="card-modal-preset-emojis">
                                    <span class="card-modal-preset-tip">快捷选择：</span>
                                    <div class="card-modal-preset-scroll">
                                        <button
                                            v-for="em in quickEmojiList"
                                            :key="em"
                                            type="button"
                                            class="card-modal-emoji-chip"
                                            :class="{ active: cardEditValue === em }"
                                            @click="cardEditValue = em"
                                        >
                                            {{ em }}
                                        </button>
                                    </div>
                                </div>

                                <div class="card-modal-input-wrap">
                                    <input
                                        v-model="cardEditValue"
                                        class="card-modal-input"
                                        placeholder="输入 Emoji 或单个文字（如 ⚡ 或 玩）"
                                        maxlength="6"
                                    />
                                    <button
                                        v-if="cardEditValue"
                                        class="card-modal-input-clear"
                                        title="清空"
                                        @click="cardEditValue = ''"
                                    >
                                        <i class="eva eva-close-circle"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- URL 面板 -->
                            <div v-if="cardEditIconType === 'url'" class="card-modal-tab-content">
                                <input
                                    v-model="cardEditValue"
                                    class="card-modal-input"
                                    placeholder="https://example.com/icon.png"
                                />
                            </div>

                            <!-- 自动获取 Favicon 面板 -->
                            <div v-if="cardEditIconType === 'auto'" class="card-modal-tab-content">
                                <div class="card-modal-auto-row">
                                    <input
                                        v-model="cardEditAutoUrl"
                                        class="card-modal-input"
                                        placeholder="输入目标网址，如 bilibili.com"
                                        @keyup.enter="autoFetchIcon"
                                    />
                                    <button
                                        class="card-modal-fetch-btn"
                                        :disabled="cardEditFetching"
                                        @click="autoFetchIcon"
                                    >
                                        <i :class="'eva ' + (cardEditFetching ? 'eva-loader-outline' : 'eva-download-outline')"></i>
                                        <span>{{ cardEditFetching ? '抓取中...' : '抓取' }}</span>
                                    </button>
                                </div>
                                <div v-if="cardEditFetchError" class="card-modal-error">
                                    <i class="eva eva-alert-circle-outline"></i>
                                    <span>{{ cardEditFetchError }}</span>
                                </div>
                            </div>
                        </div>
                        <!-- 显示 / 隐藏状态开关 -->
                        <div class="card-modal-switch-card" @click="cardEditHidden = !cardEditHidden">
                            <div class="card-modal-switch-text">
                                <div class="card-modal-switch-title">显示状态</div>
                                <div class="card-modal-switch-sub">
                                    {{ cardEditHidden ? '卡片已隐藏（在首页不可见）' : '卡片正常显示在列表中' }}
                                </div>
                            </div>
                            <div class="card-modal-switch" :class="{ 'is-on': !cardEditHidden }">
                                <div class="card-modal-switch-thumb"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 弹窗底部操作按钮 -->
                    <div class="card-modal-footer">
                        <button class="card-modal-btn-reset" title="恢复默认图标" @click="resetCardIcon">
                            <i class="eva eva-refresh-outline"></i>
                            <span>重置图标</span>
                        </button>
                        <div class="card-modal-footer-right">
                            <button
                                v-if="!cardEdit.isBuiltin"
                                class="card-modal-btn-delete"
                                @click="deleteCard"
                            >
                                <i class="eva eva-trash-2-outline"></i>
                                <span>删除卡片</span>
                            </button>
                            <button class="card-modal-btn-cancel" @click="closeCardEdit">取消</button>
                            <button class="card-modal-btn-save" @click="saveCardEdit">保存修改</button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- 添加工具弹窗 -->
        <transition name="card-modal-fade">
            <div v-if="addTool" class="card-modal-overlay" @click.self="closeAddTool">
                <div class="card-modal-dialog card-modal-dialog-sm">
                    <div class="card-modal-header">
                        <div class="card-modal-header-info">
                            <div class="card-modal-header-icon">
                                <i class="eva eva-plus-outline"></i>
                            </div>
                            <div>
                                <h3 class="card-modal-title">添加自定义工具</h3>
                                <p class="card-modal-sub">添加到模块「{{ addTool.sectionTitle }}」</p>
                            </div>
                        </div>
                        <button class="card-modal-close" title="关闭 (Esc)" @click="closeAddTool">
                            <i class="eva eva-close-outline"></i>
                        </button>
                    </div>
                    <div class="card-modal-body">
                        <div class="card-modal-field">
                            <label class="card-modal-label">工具名称</label>
                            <input v-model="addToolName" class="card-modal-input" placeholder="例：百度翻译" maxlength="20" autofocus @keyup.enter="submitAddTool" />
                        </div>
                        <div class="card-modal-field">
                            <label class="card-modal-label">跳转 URL</label>
                            <input v-model="addToolUrl" class="card-modal-input" placeholder="https://..." @keyup.enter="submitAddTool" />
                        </div>
                    </div>
                    <div class="card-modal-footer">
                        <button class="card-modal-btn-cancel" @click="closeAddTool">取消</button>
                        <div class="card-modal-footer-right">
                            <button class="card-modal-btn-save" @click="submitAddTool">确认添加</button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- 新建模块弹窗 -->
        <transition name="card-modal-fade">
            <div v-if="addSection" class="card-modal-overlay" @click.self="closeAddSection">
                <div class="card-modal-dialog card-modal-dialog-sm">
                    <div class="card-modal-header">
                        <div class="card-modal-header-info">
                            <div class="card-modal-header-icon">
                                <i class="eva eva-folder-add-outline"></i>
                            </div>
                            <div>
                                <h3 class="card-modal-title">新建模块</h3>
                                <p class="card-modal-sub">创建一个全新的工具分类模块</p>
                            </div>
                        </div>
                        <button class="card-modal-close" title="关闭 (Esc)" @click="closeAddSection">
                            <i class="eva eva-close-outline"></i>
                        </button>
                    </div>
                    <div class="card-modal-body">
                        <div class="card-modal-field">
                            <label class="card-modal-label">模块名称</label>
                            <input v-model="addSectionName" class="card-modal-input" placeholder="例：常用收藏" maxlength="20" autofocus @keyup.enter="submitAddSection" />
                        </div>
                    </div>
                    <div class="card-modal-footer">
                        <button class="card-modal-btn-cancel" @click="closeAddSection">取消</button>
                        <div class="card-modal-footer-right">
                            <button class="card-modal-btn-save" @click="submitAddSection">确认创建</button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- 删除模块确认弹窗 -->
        <transition name="card-modal-fade">
            <div v-if="deletingSectionConfirm" class="card-modal-overlay" @click.self="deletingSectionConfirm = null">
                <div class="card-modal-dialog card-modal-dialog-sm">
                    <div class="card-modal-header">
                        <div class="card-modal-header-info">
                            <div class="card-modal-header-icon card-modal-header-icon-danger">
                                <i class="eva eva-alert-triangle-outline"></i>
                            </div>
                            <div>
                                <h3 class="card-modal-title">删除模块确认</h3>
                                <p class="card-modal-sub">此操作无法撤销</p>
                            </div>
                        </div>
                        <button class="card-modal-close" @click="deletingSectionConfirm = null">
                            <i class="eva eva-close-outline"></i>
                        </button>
                    </div>
                    <div class="card-modal-body">
                        <p class="card-modal-confirm-text">
                            确定要删除模块「<strong>{{ deletingSectionConfirm.title }}</strong>」及其所有自定义工具吗？
                        </p>
                    </div>
                    <div class="card-modal-footer">
                        <button class="card-modal-btn-cancel" @click="deletingSectionConfirm = null">取消</button>
                        <div class="card-modal-footer-right">
                            <button class="card-modal-btn-delete" @click="confirmDeleteSection">
                                <i class="eva eva-trash-2-outline"></i>
                                <span>确认删除</span>
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
import ServerUptime from '~/components/ServerUptime';
import draggable from 'vuedraggable';
import { animate, stagger, utils } from '~/assets/js/anime.esm.min.js';

export default {
    name: 'Home',
    components: {
        Favorites,
        Search,
        Welcome,
        ServerUptime,
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
            sectionToolLists: {},
            toolDragGroup: { name: 'tool-cards', pull: true, put: true },
            sortMode: false,
            isToolDragging: false,
            toolLayoutLocked: false,
            suppressCardClickUntil: 0,
            // 模块折叠状态
            collapsedSections: {},
            // 快捷 Emoji 推荐
            quickEmojiList: [
                '⚡', '🛠️', '🎨', '🚀', '💻', '📱', '🎮', '🎵',
                '🔍', '📝', '📦', '💡', '🔒', '📊', '⏱️', '🌐',
                '📷', '☕', '🌸', '✨', '🔥', '📚', '🧮', '🎬', '🎁'
            ],
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
    created() {
        this.syncSectionsList();
    },
    mounted() {
        this.syncSectionsList();

        // 读取模块折叠状态
        try {
            const saved = localStorage.getItem('miku_collapsed_sections');
            if (saved) {
                this.collapsedSections = JSON.parse(saved);
            }
        } catch (e) {}

        // 全局快捷键 Esc
        this._onEscKey = (e) => {
            if (e.key === 'Escape') {
                if (this.cardEdit) this.closeCardEdit();
                if (this.addTool) this.closeAddTool();
                if (this.addSection) this.closeAddSection();
                if (this.deletingSectionConfirm) this.deletingSectionConfirm = null;
            }
        };
        window.addEventListener('keydown', this._onEscKey);

        this.$nextTick(() => {
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

        // 卡片 hover 动效
        const _glowFallback = ['#249ffd','#f472b6','#a78bfa','#34d399','#fb923c','#60a5fa','#f59f00','#20c997'];
        this._onCardOver = (e) => {
            const card = e.target.closest('.tool-card');
            if (!card || card.classList.contains('tool-card-add')) return;
            if (this.isToolDragging) return;
            if (card.contains(e.relatedTarget)) return;
            const icon = card.querySelector('.tool-card-icon');
            if (icon) {
                const bg = icon.style.background || icon.style.backgroundColor;
                const color = (bg && !bg.includes('var('))
                    ? bg
                    : _glowFallback[Math.floor(Math.random() * _glowFallback.length)];
                card.style.setProperty('--glow-color', color);
                animate(icon, { scale: 1.15, rotate: 6, duration: 280, ease: 'outBack' });
            }
            animate(card, { translateY: -5, duration: 180, ease: 'outQuad' });
        };
        this._onCardOut = (e) => {
            const card = e.target.closest('.tool-card');
            if (!card || card.classList.contains('tool-card-add')) return;
            if (this.isToolDragging) return;
            if (card.contains(e.relatedTarget)) return;
            animate(card, { translateY: 0, rotateX: 0, rotateY: 0, duration: 420, ease: 'outBack' });
            const icon = card.querySelector('.tool-card-icon');
            if (icon) animate(icon, { scale: 1, rotate: 0, duration: 320, ease: 'outBack' });
        };
        this._onCardMove = (e) => {
            const card = e.target.closest('.tool-card');
            if (!card || card.classList.contains('tool-card-add')) return;
            if (this.isToolDragging) return;
            const rect = card.getBoundingClientRect();
            const rx = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
            const ry = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
            utils.set(card, { rotateX: rx, rotateY: ry });
        };
        this.$el.addEventListener('mouseover', this._onCardOver);
        this.$el.addEventListener('mouseout', this._onCardOut);
        this.$el.addEventListener('mousemove', this._onCardMove);

        // 底部 dock 按钮动效
        this._onBtnOver = (e) => {
            const btn = e.target.closest('.bottom-dock-btn');
            if (!btn || btn.contains(e.relatedTarget)) return;
            animate(btn, { scale: 1.05, duration: 160, ease: 'outBack' });
        };
        this._onBtnOut = (e) => {
            const btn = e.target.closest('.bottom-dock-btn');
            if (!btn || btn.contains(e.relatedTarget)) return;
            animate(btn, { scale: 1, duration: 240, ease: 'outCubic' });
        };
        this.$el.addEventListener('mouseover', this._onBtnOver);
        this.$el.addEventListener('mouseout', this._onBtnOut);
    },
    beforeDestroy() {
        if (this._onEscKey) {
            window.removeEventListener('keydown', this._onEscKey);
        }
        if (this._onCardOver) {
            this.$el.removeEventListener('mouseover', this._onCardOver);
            this.$el.removeEventListener('mouseout', this._onCardOut);
            this.$el.removeEventListener('mousemove', this._onCardMove);
        }
        if (this._onBtnOver) {
            this.$el.removeEventListener('mouseover', this._onBtnOver);
            this.$el.removeEventListener('mouseout', this._onBtnOut);
        }
        document.body.classList.remove('tool-card-drag-active');
    },
    watch: {
        '$store.state.customSections'() { this.syncSectionsList(); },
        '$store.state.sectionOrder'() { this.syncSectionsList(); },
        '$store.state.customTools': {
            handler() {
                if (!this.isToolDragging) this.syncToolLists();
            },
            deep: true
        },
        '$store.state.toolOrder': {
            handler() {
                if (!this.isToolDragging) this.syncToolLists();
            },
            deep: true
        },
        '$store.state.toolSections': {
            handler() {
                if (!this.isToolDragging) this.syncToolLists();
            },
            deep: true
        },
        managingSection(val) {
            if (val) {
                this.$nextTick(() => {
                    const panel = this.$el.querySelector('.manage-panel-box');
                    if (!panel) return;
                    animate(panel, {
                        opacity: [0, 1],
                        translateY: [-10, 0],
                        scale: [0.98, 1],
                        duration: 300,
                        ease: 'outCubic'
                    });
                });
            }
        }
    },    methods: {
        handleLogout() {
            this.$store.commit('SET_AUTH', false);
            localStorage.removeItem('miku_remember_until');
            try { sessionStorage.removeItem('miku_session_auth'); } catch (e) {}
            this.$router.replace('/login');
        },
        toggleCollapseSection(sectionKey) {
            const isCollapsed = !this.collapsedSections[sectionKey];
            this.$set(this.collapsedSections, sectionKey, isCollapsed);
            try {
                localStorage.setItem('miku_collapsed_sections', JSON.stringify(this.collapsedSections));
            } catch (e) {}
        },
        isSectionCollapsed(sectionKey) {
            return !!this.collapsedSections[sectionKey];
        },
        getVisibleToolsCount(sectionKey) {
            const list = this.sectionToolLists[sectionKey] || [];
            return list.filter(card => {
                if (card._type === 'builtin') return !this.isHidden(card._data.path);
                return !card._data.hidden;
            }).length;
        },
        showAllSections() {
            this.$store.commit('SET_STORE', {
                key: 'setting.hideSections',
                value: []
            });
            this.$noty.success('所有模块已恢复显示');
        },
        enterFirst(e) {
            if (this.$store.state.setting.inNewTab && e.path !== '/setting') {
                window.open(e.path);
            } else {
                this.$router.push(e.path);
            }
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
                if (this.collapsedSections[key]) {
                    this.$set(this.collapsedSections, key, false);
                }
                this.managingSection = key;
                this.iconPickerOpenKey = null;
                this.renameSectionName = section._type === 'builtin'
                    ? (this.$store.state.sectionNames[section._data.title] || '')
                    : section._data.title;
            }
        },
        toggleIconPicker(key) {
            this.iconPickerOpenKey = this.iconPickerOpenKey === key ? null : key;
        },
        setSectionIcon(key, icon) {
            this.$store.commit('SET_SECTION_ICON', { key, icon });
            this.iconPickerOpenKey = null;
        },
        isSectionHidden(key) {
            return (this.$store.state.setting.hideSections || []).indexOf(key) !== -1;
        },
        toggleSectionVisibility(key) {
            const current = [...(this.$store.state.setting.hideSections || [])];
            const idx = current.indexOf(key);
            if (idx === -1) current.push(key);
            else current.splice(idx, 1);
            this.$store.commit('SET_STORE', { key: 'setting.hideSections', value: current });
        },
        syncSectionsList() {
            const builtin = this.$store.state.tools.map(s => ({
                _key: s.title,
                _type: 'builtin',
                _data: s
            }));
            const custom = this.$store.state.customSections.map(s => ({
                _key: 'cs:' + s.id,
                _type: 'custom',
                _data: s
            }));
            const all = [...builtin, ...custom];
            const order = this.$store.state.sectionOrder || [];
            if (order.length) {
                all.sort((a, b) => {
                    const ia = order.indexOf(a._key);
                    const ib = order.indexOf(b._key);
                    if (ia === -1 && ib === -1) return 0;
                    if (ia === -1) return 1;
                    if (ib === -1) return -1;
                    return ia - ib;
                });
            }
            this.sectionsList = all;
            this.syncToolLists();
        },
        syncToolLists() {
            const sections = this.sectionsList;
            const sectionKeys = new Set(sections.map(section => section._key));
            const buckets = {};
            sections.forEach(section => {
                buckets[section._key] = [];
            });
            const overrides = this.$store.state.toolSections || {};
            this.$store.state.tools.forEach(origin => {
                origin.list.forEach(tool => {
                    const card = {
                        _key: 'builtin:' + tool.path,
                        _type: 'builtin',
                        _data: tool
                    };
                    const override = overrides[card._key];
                    const target =
                        override && sectionKeys.has(override)
                            ? override
                            : origin.title;
                    const bucket = buckets[target] || buckets[origin.title];
                    if (bucket) bucket.push(card);
                });
            });
            this.$store.state.customTools.forEach(tool => {
                const card = {
                    _key: 'custom:' + tool.id,
                    _type: 'custom',
                    _data: tool
                };
                const target = sections.find(
                    section => section._data.title === tool.sectionTitle
                );
                if (target) buckets[target._key].push(card);
            });
            const next = {};
            sections.forEach(section => {
                const cards = buckets[section._key];
                const order = (this.$store.state.toolOrder && this.$store.state.toolOrder[section._key]) || [];
                const ordered = [];
                const seen = new Set();
                order.forEach(key => {
                    const card = cards.find(item => item._key === key);
                    if (!card || seen.has(key)) return;
                    ordered.push(card);
                    seen.add(key);
                });
                cards.forEach(card => {
                    if (!seen.has(card._key)) ordered.push(card);
                });
                next[section._key] = ordered;
            });
            this.sectionToolLists = next;
        },
        persistToolLayout() {
            const toolOrder = {};
            const toolSections = {};
            const origins = {};
            this.$store.state.tools.forEach(section => {
                section.list.forEach(tool => {
                    origins['builtin:' + tool.path] = section.title;
                });
            });
            const customById = {};
            let customChanged = false;
            const customTools = this.$store.state.customTools.map(tool => {
                const copy = { ...tool };
                customById[tool.id] = copy;
                return copy;
            });
            const seen = new Set();
            this.sectionsList.forEach(section => {
                const cards = this.sectionToolLists[section._key] || [];
                const order = [];
                cards.forEach(card => {
                    if (!card || !card._key || seen.has(card._key)) return;
                    seen.add(card._key);
                    order.push(card._key);
                    if (card._type === 'builtin') {
                        const origin = origins[card._key];
                        if (origin && section._key !== origin) {
                            toolSections[card._key] = section._key;
                        }
                    } else if (card._type === 'custom') {
                        const copy = customById[card._data.id];
                        if (copy && copy.sectionTitle !== section._data.title) {
                            copy.sectionTitle = section._data.title;
                            customChanged = true;
                        }
                    }
                });
                toolOrder[section._key] = order;
            });
            this.$store.commit('APPLY_TOOL_LAYOUT', {
                toolOrder,
                toolSections,
                customTools: customChanged ? customTools : null
            });
        },
        onToolDragStart(event) {
            this.isToolDragging = true;
            if (event && event.item) {
                utils.set(event.item, { translateY: 0, rotateX: 0, rotateY: 0 });
                const icon = event.item.querySelector('.tool-card-icon');
                if (icon) {
                    utils.set(icon, { scale: 1, rotate: 0 });
                    icon.style.transform = '';
                }
            }
            document.body.classList.add('tool-card-drag-active');
        },
        onToolDragEnd() {
            if (!this.isToolDragging || this.toolLayoutLocked) return;
            this.toolLayoutLocked = true;
            this.persistToolLayout();
            this.suppressCardClickUntil = Date.now() + 350;
            this.$nextTick(() => {
                this.syncToolLists();
                this.isToolDragging = false;
                this.toolLayoutLocked = false;
                document.body.classList.remove('tool-card-drag-active');
            });
        },
        guardToolCardClick(event) {
            if (this.isToolDragging || Date.now() < this.suppressCardClickUntil) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
            return true;
        },
        openBuiltInCard(tool, event) {
            if (!this.guardToolCardClick(event)) return;
            if (this.$store.state.setting.inNewTab && tool.path !== '/setting') {
                window.open(tool.path, '_blank', 'noopener,noreferrer');
            } else {
                this.$router.push(tool.path);
            }
        },
        openCustomCard(tool, event) {
            if (!this.guardToolCardClick(event)) return;
            const opened = window.open(tool.url, '_blank', 'noopener,noreferrer');
            if (opened) opened.opener = null;
        },
        onSectionDragEnd() {
            this.$store.commit('SET_SECTION_ORDER', this.sectionsList.map(s => s._key));
        },
        toggleSortMode() {
            this.sortMode = !this.sortMode;
            if (!this.sortMode) this.syncSectionsList();
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
            this.$noty.success('卡片设置已更新');
        },
        resetCardIcon() {
            this.cardEditValue = '';
            this.$noty.info('已重置为默认图标');
        },
        deleteCard() {
            if (!this.cardEdit.isBuiltin) {
                this.$store.commit('REMOVE_CUSTOM_TOOL', this.cardEdit.tool.id);
                this.$noty.success('工具已删除');
            }
            this.closeCardEdit();
        },
        async autoFetchIcon() {
            const url = this.cardEditAutoUrl.trim();
            if (!url) { this.cardEditFetchError = '请输入网站地址'; return; }
            const domain = this.extractDomain(url);
            if (!domain) { this.cardEditFetchError = '无法解析有效域名'; return; }
            this.cardEditFetching = true;
            this.cardEditFetchError = '';
            const origin = 'https://' + domain;
            const apis = [
                origin + '/favicon.ico',
                origin + '/favicon.png',
                origin + '/apple-touch-icon.png',
                'https://favicon.im/' + domain + '?larger=true',
                'https://www.faviconextractor.com/favicon/' + domain + '?larger=true',
                'https://www.google.com/s2/favicons?domain=' + domain + '&sz=128',
                'https://api.iowen.cn/favicon/' + domain + '.png',
            ];
            let loaded = false;
            for (const api of apis) {
                loaded = await new Promise(resolve => {
                    const img = new Image();
                    img.onload = () => resolve(img.naturalWidth > 1);
                    img.onerror = () => resolve(false);
                    setTimeout(() => resolve(false), 4500);
                    img.src = api;
                });
                if (loaded) { this.cardEditValue = api; this.cardEditIconType = 'url'; break; }
            }
            if (!loaded) this.cardEditFetchError = '未能自动获取，建议手动填写图片 URL';
            this.cardEditFetching = false;
        },
        getSectionTitle(original) {
            return this.$store.state.sectionNames[original] || original;
        },
        saveRename(original) {
            this.$store.commit('RENAME_SECTION', { original, name: this.renameSectionName });
            this.$noty.success('模块名称已更新');
        },
        resetRename(original) {
            this.$store.commit('RENAME_SECTION', { original, name: '' });
            this.renameSectionName = '';
            this.$noty.success('已恢复默认名称');
        },
        saveRenameCustom(section) {
            const name = this.renameSectionName.trim();
            if (!name) { this.$noty.error('模块名称不能为空'); return; }
            this.$store.commit('RENAME_CUSTOM_SECTION', { id: section.id, name });
            this.$noty.success('模块名称已更新');
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
            this.$noty.success('模块已删除');
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
            if (!name) { this.$noty.error('请输入工具名称'); return; }
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
.pre-weather-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-bottom: 8px;

    .pre-weather-link {
        font-size: 13.5px;
        position: relative;
        left: 10px;
        font-weight: 700;
        color: #1a8fe8;
        text-decoration: none;
        letter-spacing: 0.2px;
        transition: color 0.2s;
        &:hover { color: #249ffd; text-decoration: underline; }
    }

    .logout-btn {
        position: absolute;
        right: 0;
        background: #fff;
        border: 1px solid rgba(244, 63, 94, 0.4);
        border-radius: 8px;
        padding: 5px 14px;
        cursor: pointer;
        color: #f43f5e;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        white-space: nowrap;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        &:hover {
            background-color: #fff1f2;
            border-color: #f43f5e;
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(244, 63, 94, 0.15);
        }
    }
}

body.dark .pre-weather-bar .logout-btn {
    background: #1e293b;
    border-color: rgba(244, 63, 94, 0.4);
    &:hover {
        background-color: rgba(244, 63, 94, 0.12);
    }
}

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
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: all 0.3s ease;
        background-color: transparent;
        font-size: 16px;
        border-radius: 8px;
        padding: 8px 12px;
        border: 1px solid rgba(226, 232, 240, 0.8);
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 18px rgba(10, 14, 29, 0.06);
            border-color: var(--theme);
            color: var(--theme);
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
            top: 6px;
            right: 6px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        &.new::after { background-color: var(--theme-success); }
        &.hot::after { background-color: var(--theme-danger); }
        &.vip::after { background-color: #f59e0b; }
        &.recommend::after { background-color: var(--theme); }
    }

    /* ── 模块头部操作区 ── */
    .section-header-actions {
        position: absolute;
        top: 8px;
        right: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 2;
    }

    .section-collapse-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 7px;
        padding: 4px 10px 4px 8px;
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        i {
            font-size: 15px;
            transition: transform 0.2s ease;
        }
        &:hover {
            background: #f1f5f9;
            color: var(--theme);
            border-color: rgba(36, 159, 253, 0.4);
        }
    }

    .section-manage-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: #f0f7ff;
        border: 1px solid rgba(36, 159, 253, 0.4);
        border-radius: 7px;
        padding: 4px 12px 4px 9px;
        font-size: 12px;
        font-weight: 600;
        color: #249ffd;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        i {
            font-size: 14px;
        }
        &:hover, &.active {
            background-color: #249ffd;
            border-color: #249ffd;
            color: #fff;
            box-shadow: 0 2px 8px rgba(36, 159, 253, 0.35);
        }
    }

    body.dark .section-collapse-btn {
        background: #1e293b;
        border-color: rgba(51, 65, 85, 0.8);
        color: #94a3b8;
        &:hover {
            background: #334155;
            color: #38bdf8;
            border-color: rgba(56, 189, 248, 0.4);
        }
    }

    body.dark .section-manage-btn {
        background: rgba(36, 159, 253, 0.12);
        border-color: rgba(36, 159, 253, 0.4);
        color: #38bdf8;
        &:hover, &.active {
            background: #249ffd;
            color: #fff;
        }
    }

    /* ── 收起状态横条 ── */
    .section-collapsed-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 18px;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px dashed #cbd5e1;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
        &:hover {
            background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%);
            border-color: #38bdf8;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(36, 159, 253, 0.08);
            .section-collapsed-right {
                color: #249ffd;
            }
        }
    }

    .section-collapsed-left {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #475569;
        font-size: 13.5px;
        font-weight: 600;
        i { font-size: 18px; color: #249ffd; }
    }

    .section-collapsed-count {
        font-size: 12px;
        color: #94a3b8;
        background: #fff;
        padding: 2px 8px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
    }

    .section-collapsed-right {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12.5px;
        color: #64748b;
        font-weight: 600;
        transition: color 0.2s;
        i { font-size: 16px; }
    }

    body.dark .section-collapsed-banner {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border-color: #334155;
        &:hover {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-color: #38bdf8;
        }
        .section-collapsed-left { color: #cbd5e1; }
        .section-collapsed-count { background: #1e293b; border-color: #334155; color: #94a3b8; }
        .section-collapsed-right { color: #94a3b8; }
    }

    /* ── 模块管理与设置面板 ── */
    .manage-panel-slide-enter-active,
    .manage-panel-slide-leave-active {
        transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .manage-panel-slide-enter,
    .manage-panel-slide-leave-to {
        opacity: 0;
        transform: translateY(-10px);
    }

    .manage-panel {
        width: 100%;
        margin-bottom: 20px;
    }

    .manage-panel-box {
        background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid rgba(203, 213, 225, 0.8);
        border-radius: 12px;
        padding: 18px 20px;
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
    }

    body.dark .manage-panel-box {
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
        border-color: rgba(51, 65, 85, 0.8);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }

    .manage-panel-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(226, 232, 240, 0.9);
        margin-bottom: 16px;
    }

    body.dark .manage-panel-top {
        border-bottom-color: rgba(51, 65, 85, 0.8);
    }

    .manage-panel-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 700;
        color: #334155;
        i { font-size: 17px; color: var(--theme); }
    }
    body.dark .manage-panel-title { color: #e2e8f0; }

    .manage-panel-close-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 12.5px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 6px;
        transition: all 0.2s;
        &:hover {
            color: #f43f5e;
            background: rgba(244, 63, 94, 0.08);
        }
    }

    .manage-settings-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
        @media (max-width: 768px) {
            grid-template-columns: 1fr;
            gap: 12px;
        }
    }

    .manage-setting-item {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 12px 14px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }

    body.dark .manage-setting-item {
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(51, 65, 85, 0.8);
    }

    .manage-setting-label {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 12.5px;
        font-weight: 700;
        color: #64748b;
        margin-bottom: 8px;
        i { font-size: 15px; color: #249ffd; }
    }
    body.dark .manage-setting-label { color: #94a3b8; }

    .manage-rename-wrap {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .manage-input {
        flex: 1;
        min-width: 80px;
        padding: 7px 11px;
        font-size: 13px;
        border: 1px solid #cbd5e1;
        border-radius: 7px;
        background-color: transparent;
        color: var(--t1);
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s cubic-bezier(0,0,0.2,1);
        &::placeholder { color: #94a3b8; }
        &:focus {
            border-color: var(--theme);
            box-shadow: 0 0 0 3px rgba(36,159,253,0.14);
        }
    }
    body.dark .manage-input { border-color: #475569; }

    .manage-rename-btn {
        padding: 7px 13px;
        font-size: 12.5px;
        font-weight: 700;
        color: #fff;
        background-color: var(--theme);
        border: none;
        border-radius: 7px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: opacity 0.2s, box-shadow 0.2s;
        &:hover {
            opacity: 0.9;
            box-shadow: 0 2px 8px rgba(36,159,253,0.35);
        }
    }

    .manage-rename-reset {
        padding: 7px 10px;
        font-size: 12px;
        color: #94a3b8;
        background: none;
        border: 1px solid #cbd5e1;
        border-radius: 7px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: color 0.2s, border-color 0.2s;
        &:hover {
            color: var(--t1);
            border-color: var(--t1);
        }
    }
    body.dark .manage-rename-reset { border-color: #475569; }

    .manage-icon-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .manage-icon-preview {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(36, 159, 253, 0.12);
        color: var(--theme);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
    }

    .manage-icon-pick-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 6px 12px;
        font-size: 12.5px;
        font-weight: 600;
        color: #249ffd;
        background: #f0f7ff;
        border: 1px solid rgba(36, 159, 253, 0.4);
        border-radius: 7px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
        i { font-size: 15px; }
        &:hover, &.active {
            background-color: #249ffd;
            color: #fff;
            border-color: #249ffd;
            box-shadow: 0 2px 8px rgba(36, 159, 253, 0.3);
        }
    }

    body.dark .manage-icon-pick-btn {
        background: rgba(36, 159, 253, 0.12);
        border-color: rgba(36, 159, 253, 0.4);
        color: #38bdf8;
        &:hover, &.active {
            background-color: #249ffd;
            color: #fff;
        }
    }
    /* ── 图标网格选择器 ── */
    .picker-slide-enter-active,
    .picker-slide-leave-active {
        transition: all 0.2s ease;
    }
    .picker-slide-enter,
    .picker-slide-leave-to {
        opacity: 0;
        transform: translateY(-6px);
    }

    .section-icon-picker {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 14px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    body.dark .section-icon-picker {
        background: #1e293b;
        border-color: rgba(51, 65, 85, 0.8);
    }

    .section-icon-tip {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        margin-bottom: 10px;
    }
    body.dark .section-icon-tip { color: #94a3b8; }

    .section-icon-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        max-height: 180px;
        overflow-y: auto;
        padding-right: 4px;
    }

    .section-icon-item {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        color: #64748b;
        padding: 0;
        i { font-size: 17px; }
        &:hover {
            background-color: rgba(36, 159, 253, 0.12);
            border-color: #249ffd;
            color: #249ffd;
            transform: scale(1.1);
        }
        &.active {
            background-color: #249ffd;
            border-color: #249ffd;
            color: #fff;
            box-shadow: 0 2px 8px rgba(36, 159, 253, 0.4);
            transform: scale(1.05);
        }
    }

    body.dark .section-icon-item {
        background: #0f172a;
        border-color: #334155;
        color: #94a3b8;
        &:hover {
            background-color: rgba(36, 159, 253, 0.2);
            border-color: #38bdf8;
            color: #38bdf8;
        }
    }

    /* ── 工具显隐管理 ── */
    .manage-tools-section {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 14px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }
    body.dark .manage-tools-section {
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(51, 65, 85, 0.8);
    }

    .manage-tools-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
    }

    .manage-tools-title {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 12.5px;
        font-weight: 700;
        color: #475569;
        i { font-size: 15px; color: #249ffd; }
    }
    body.dark .manage-tools-title { color: #cbd5e1; }

    .manage-tools-stats {
        font-size: 12px;
        color: #94a3b8;
        font-weight: 600;
    }

    .manage-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .manage-item {
        display: inline-flex;
        align-items: center;
        padding: 5px 10px 5px 7px;
        border-radius: 20px;
        border: 1px solid #e2e8f0;
        background-color: #f8fafc;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        gap: 6px;
        user-select: none;
        &:hover {
            background-color: #f1f5f9;
            border-color: #cbd5e1;
        }
        &.is-hidden {
            opacity: 0.45;
            background-color: #f1f5f9;
            border-style: dashed;
        }
    }

    body.dark .manage-item {
        background-color: #1e293b;
        border-color: #334155;
        &:hover {
            background-color: #334155;
            border-color: #475569;
        }
        &.is-hidden {
            background-color: #0f172a;
        }
    }

    .manage-toggle {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        color: #249ffd;
        display: flex;
        align-items: center;
        flex-shrink: 0;
        font-size: 16px;
        transition: transform 0.15s;
        &:hover { transform: scale(1.15); }
        &.is-off { color: #94a3b8; }
    }

    .manage-name {
        font-size: 12.5px;
        color: var(--t1);
        font-weight: 600;
        white-space: nowrap;
    }

    .manage-tag {
        font-size: 11px;
        padding: 1px 6px;
        border-radius: 10px;
        background-color: rgba(36, 159, 253, 0.1);
        border: 1px solid rgba(36, 159, 253, 0.2);
        color: var(--theme);
        flex-shrink: 0;
        font-weight: 700;
        &.manage-tag-custom {
            background-color: rgba(16, 185, 129, 0.1);
            border-color: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }
    }

    .manage-delete {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 4px;
        color: #f43f5e;
        display: flex;
        align-items: center;
        font-size: 13px;
        border-radius: 4px;
        transition: all 0.15s;
        &:hover {
            background: rgba(244, 63, 94, 0.12);
            transform: scale(1.1);
        }
    }

    .manage-section-delete-wrap {
        display: flex;
        justify-content: flex-end;
        padding-top: 14px;
        margin-top: 14px;
        border-top: 1px solid rgba(226, 232, 240, 0.9);
    }
    body.dark .manage-section-delete-wrap { border-top-color: rgba(51, 65, 85, 0.8); }

    .manage-section-delete {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 6px 14px;
        font-size: 12.5px;
        font-weight: 600;
        color: #f43f5e;
        background: #fff;
        border: 1px solid rgba(244, 63, 94, 0.35);
        border-radius: 7px;
        cursor: pointer;
        transition: all 0.2s;
        i { font-size: 15px; }
        &:hover {
            background-color: #fff1f2;
            border-color: #f43f5e;
            box-shadow: 0 2px 8px rgba(244, 63, 94, 0.15);
        }
    }
    body.dark .manage-section-delete {
        background: #1e293b;
        &:hover { background: rgba(244, 63, 94, 0.15); }
    }

} // end .home

/* ── 全局卡片网格与拖拽样式 ── */
.tool-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
    gap: 12px;
    width: 100%;
    min-height: 64px;
    --card-icon-bg: #f1f5f9;
    perspective: 800px;
    @media (max-width: 700px) {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 8px;
    }
}

body.dark .tool-card-grid { --card-icon-bg: #334155; }

/* 基础工具卡片 */
.tool-card {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 14px;
    box-sizing: border-box;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02);
    text-decoration: none;
    color: var(--t1);
    cursor: grab;
    overflow: visible;
    will-change: transform;
    transform-style: preserve-3d;
    transition: border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);

    &::before {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: 13px;
        opacity: 0;
        box-shadow:
            0 0 0 1px var(--glow-color, #7C3AED),
            0 0 8px 2px color-mix(in oklab, var(--glow-color, #7C3AED) 65%, transparent),
            0 0 16px 4px color-mix(in oklab, var(--glow-color, #7C3AED) 35%, transparent);
        transition: opacity 0.25s ease;
        pointer-events: none;
    }

    &:hover {
        text-decoration: none;
        border-color: rgba(36, 159, 253, 0.4);
        box-shadow: 0 10px 24px -4px rgba(15, 23, 42, 0.08);
        &::before { opacity: 1; }
        .tool-card-edit-btn {
            opacity: 1;
            transform: scale(1);
        }
    }
}

/* 仅在常规点击按下时反馈微缩，拖拽中不触发避免阻断移动 */
.tool-card:not(.sortable-fallback):not(.tool-card-dragging):active {
    transform: scale(0.97);
    transition: transform 0.1s ease;
}

body.dark .tool-card {
    background: linear-gradient(135deg, #1e293b 0%, #151e2e 100%);
    border-color: rgba(51, 65, 85, 0.7);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    &:hover {
        border-color: rgba(56, 189, 248, 0.4);
        box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.4);
    }
}

.tool-card-sortable {
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
}

/* 拖拽时原网格中的虚线占位槽 (Ghost) */
.tool-card-ghost {
    opacity: 0.32 !important;
    background: rgba(36, 159, 253, 0.06) !important;
    border: 2px dashed rgba(36, 159, 253, 0.6) !important;
    border-radius: 12px !important;
    box-shadow: none !important;
    transform: none !important;
    &::before { display: none !important; }
}

body.dark .tool-card-ghost {
    background: rgba(56, 189, 248, 0.08) !important;
    border-color: rgba(56, 189, 248, 0.5) !important;
}

.tool-card-chosen {
    cursor: grabbing !important;
}

/* ── 重点：整张卡片“拎起来”悬浮拖拽效果 (SortableJS fallback 镜像) ── */
.sortable-fallback.tool-card,
.sortable-fallback {
    position: fixed !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 10px !important;
    padding: 12px 14px !important;
    box-sizing: border-box !important;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
    border: 1.5px solid rgba(36, 159, 253, 0.6) !important;
    border-radius: 12px !important;
    /* 强烈的拎起悬空弥散阴影 + 主题色柔光 */
    box-shadow: 0 20px 42px -4px rgba(15, 23, 42, 0.24),
                0 8px 18px -2px rgba(36, 159, 253, 0.28) !important;
    opacity: 0.98 !important;
    cursor: grabbing !important;
    z-index: 999999 !important;
    pointer-events: none !important;
    transition: none !important;

    &::before { display: none !important; }

    .tool-card-icon {
        width: 38px !important;
        height: 38px !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 17px !important;
        font-weight: 700 !important;
        color: #fff !important;
        flex-shrink: 0 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16) !important;
        overflow: hidden !important;
        transform: none !important;
    }

    .tool-card-img {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        border-radius: 50% !important;
    }

    .tool-card-name {
        font-size: 12.5px !important;
        font-weight: 600 !important;
        text-align: left !important;
        color: #1e293b !important;
        line-height: 1.35 !important;
        word-break: break-all !important;
        flex: 1 !important;
        margin: 0 !important;
    }

    .tool-card-external-mark {
        display: none !important;
    }

    .tool-card-edit-btn {
        display: none !important;
    }
}

body.dark .sortable-fallback.tool-card,
body.dark .sortable-fallback {
    background: linear-gradient(135deg, #1e293b 0%, #151e2e 100%) !important;
    border-color: rgba(56, 189, 248, 0.6) !important;
    box-shadow: 0 24px 50px rgba(0, 0, 0, 0.65),
                0 8px 20px rgba(56, 189, 248, 0.2) !important;

    .tool-card-name {
        color: #f1f5f9 !important;
    }
}

/* 卡片内部元素基础样式 */
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.tool-card-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
}

.tool-card-name {
    font-size: 12.5px;
    font-weight: 600;
    text-align: left;
    color: var(--t1);
    line-height: 1.35;
    word-break: break-all;
    flex: 1;
}

.tool-card-external-mark {
    font-size: 12px;
    color: #94a3b8;
    display: flex;
    align-items: center;
    margin-right: -2px;
}

.tool-card-edit-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                background-color 0.2s;
    cursor: pointer;
    color: #fff;
    padding: 0;
    z-index: 2;
    i { font-size: 13px; }
    &:hover {
        background: var(--theme);
        border-color: var(--theme);
        transform: scale(1.08) rotate(45deg);
    }
}

/* 添加工具卡片 */
.tool-card-add {
    border: 1.5px dashed rgba(36, 159, 253, 0.5) !important;
    background: rgba(36, 159, 253, 0.03) !important;
    box-shadow: none !important;
    cursor: pointer;
    opacity: 0.8;
    justify-content: flex-start;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    &:hover {
        opacity: 1;
        background: rgba(36, 159, 253, 0.08) !important;
        border-color: #249ffd !important;
        transform: translateY(-2px) !important;
        &::before { opacity: 0 !important; }
    }
}

.tool-card-add-icon {
    background: rgba(36, 159, 253, 0.15) !important;
    box-shadow: none !important;
    i { font-size: 18px; color: #249ffd; }
}

    /* ── 拖动排序把手 ── */
    .section-drag-handle {
        position: absolute;
        top: 8px;
        right: 14px;
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 4px 12px 4px 9px;
        font-size: 12px;
        font-weight: 600;
        color: #249ffd;
        background: rgba(36, 159, 253, 0.08);
        border: 1px dashed #249ffd;
        border-radius: 7px;
        cursor: grab;
        user-select: none;
        z-index: 2;
        transition: background-color 0.15s;
        i { font-size: 15px; }
        &:active { cursor: grabbing; background-color: rgba(36, 159, 253, 0.15); }
    }

    /* ── 底部操作栏 (Dock 风格) ── */
    .bottom-actions-bar {
        display: flex;
        justify-content: center;
        padding: 18px 0 32px;
    }

    .bottom-actions-dock {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        padding: 6px 10px;
        border-radius: 14px;
        border: 1px solid rgba(226, 232, 240, 0.95);
        box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
    }

    body.dark .bottom-actions-dock {
        background: rgba(30, 41, 59, 0.9);
        border-color: rgba(51, 65, 85, 0.8);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
    }

    .bottom-dock-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 18px;
        font-size: 13.5px;
        font-weight: 600;
        color: #64748b;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        i { font-size: 16px; }
        &:hover {
            color: #249ffd;
            background: rgba(36, 159, 253, 0.08);
        }
        &.active {
            color: #249ffd;
            background: rgba(36, 159, 253, 0.12);
            border-color: rgba(36, 159, 253, 0.35);
        }
        &.bottom-dock-add {
            color: #249ffd;
            background: rgba(36, 159, 253, 0.08);
            border-color: rgba(36, 159, 253, 0.25);
            &:hover {
                background: #249ffd;
                color: #fff;
                border-color: #249ffd;
                box-shadow: 0 2px 10px rgba(36, 159, 253, 0.35);
            }
        }
    }

    body.dark .bottom-dock-btn {
        color: #94a3b8;
        &:hover {
            color: #38bdf8;
            background: rgba(36, 159, 253, 0.15);
        }
        &.active {
            color: #38bdf8;
            background: rgba(36, 159, 253, 0.2);
            border-color: rgba(56, 189, 248, 0.4);
        }
    }
    /* ── 模块显隐控制浮窗 ── */
    .section-vis-fade-enter-active,
    .section-vis-fade-leave-active {
        transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .section-vis-fade-enter,
    .section-vis-fade-leave-to {
        opacity: 0;
        transform: translateY(-8px);
    }

    .section-vis-panel {
        max-width: 680px;
        margin: 0 auto 20px;
        padding: 16px 20px;
        border: 1px solid rgba(226, 232, 240, 0.95);
        border-radius: 14px;
        background: #fff;
        box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
    }

    body.dark .section-vis-panel {
        background: #1e293b;
        border-color: rgba(51, 65, 85, 0.8);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
    }

    .section-vis-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e2e8f0;
    }
    body.dark .section-vis-header { border-bottom-color: #334155; }

    .section-vis-header-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13.5px;
        font-weight: 700;
        color: #334155;
        i { font-size: 16px; color: var(--theme); }
    }
    body.dark .section-vis-header-title { color: #e2e8f0; }

    .section-vis-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .section-vis-quick-btn {
        background: rgba(36, 159, 253, 0.08);
        border: 1px solid rgba(36, 159, 253, 0.3);
        border-radius: 6px;
        padding: 3px 10px;
        font-size: 12px;
        font-weight: 600;
        color: #249ffd;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
        &:hover {
            background: #249ffd;
            color: #fff;
        }
    }

    .section-vis-close-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 3px;
        color: #94a3b8;
        display: flex;
        border-radius: 6px;
        transition: color 0.2s;
        i { font-size: 18px; }
        &:hover { color: #f43f5e; }
    }

    .section-vis-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .section-vis-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px 6px 8px;
        border-radius: 20px;
        border: 1px solid #e2e8f0;
        background-color: #f8fafc;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        &:hover {
            background-color: #f1f5f9;
            border-color: #cbd5e1;
        }
        &.is-hidden {
            opacity: 0.45;
            background-color: #f1f5f9;
            border-style: dashed;
        }
    }

    body.dark .section-vis-item {
        background-color: #0f172a;
        border-color: #334155;
        &:hover {
            background-color: #1e293b;
        }
    }

    .section-vis-name {
        font-size: 13px;
        color: var(--t1);
        font-weight: 600;
        white-space: nowrap;
    }

    /* ── 卡片编辑与弹窗交互 (现代化 Modal) ── */
    .card-modal-fade-enter-active,
    .card-modal-fade-leave-active {
        transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        .card-modal-dialog {
            transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1),
                        opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
    }
    .card-modal-fade-enter,
    .card-modal-fade-leave-to {
        opacity: 0;
        .card-modal-dialog {
            transform: scale(0.92) translateY(12px);
            opacity: 0;
        }
    }

    .card-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.5);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }

    .card-modal-dialog {
        background: #ffffff;
        border-radius: 18px;
        width: 100%;
        max-width: 460px;
        border: 1px solid rgba(226, 232, 240, 0.95);
        box-shadow: 0 25px 60px -12px rgba(15, 23, 42, 0.25),
                    0 0 0 1px rgba(255, 255, 255, 0.5);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - 40px);
        animation: none;
        &.card-modal-dialog-sm {
            max-width: 400px;
        }
    }

    body.dark .card-modal-dialog {
        background: #1e293b;
        border-color: rgba(51, 65, 85, 0.8);
        box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.6);
    }

    .card-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 22px;
        border-bottom: 1px solid #f1f5f9;
    }
    body.dark .card-modal-header { border-bottom-color: #334155; }

    .card-modal-header-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .card-modal-header-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: rgba(36, 159, 253, 0.1);
        color: #249ffd;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
        &.card-modal-header-icon-danger {
            background: rgba(244, 63, 94, 0.1);
            color: #f43f5e;
        }
    }

    .card-modal-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--t1);
        margin: 0;
        line-height: 1.25;
    }

    .card-modal-sub {
        font-size: 12px;
        color: #94a3b8;
        margin: 2px 0 0;
    }

    .card-modal-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #94a3b8;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        i { font-size: 20px; }
        &:hover {
            color: #f43f5e;
            background: rgba(244, 63, 94, 0.1);
            transform: rotate(90deg);
        }
    }

    .card-modal-body {
        padding: 20px 22px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    /* ── 实时 1:1 卡片预览区 ── */
    .card-modal-preview-wrapper {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 14px 16px;
    }
    body.dark .card-modal-preview-wrapper {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border-color: #334155;
    }

    .card-modal-preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
    }

    .card-modal-preview-tag {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 700;
        color: #249ffd;
        i { font-size: 14px; }
    }

    .card-modal-preview-hint {
        font-size: 11px;
        color: #94a3b8;
    }

    .card-modal-preview-box {
        display: flex;
        justify-content: center;
        padding: 4px 0;
    }

    .card-modal-preview-card {
        width: 200px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: 1px solid rgba(226, 232, 240, 0.95);
        border-radius: 12px;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
        position: relative;
        &::before {
            content: '';
            position: absolute;
            inset: -1px;
            border-radius: 13px;
            box-shadow:
                0 0 0 1px var(--glow-color, #7C3AED),
                0 0 8px 2px color-mix(in oklab, var(--glow-color, #7C3AED) 60%, transparent);
            pointer-events: none;
        }
    }
    body.dark .card-modal-preview-card {
        background: linear-gradient(135deg, #1e293b 0%, #151e2e 100%);
        border-color: rgba(51, 65, 85, 0.8);
    }

    .card-modal-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .card-modal-label {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 12.5px;
        font-weight: 700;
        color: #64748b;
        i { font-size: 15px; color: #249ffd; }
    }
    body.dark .card-modal-label { color: #94a3b8; }

    .card-modal-input {
        width: 100%;
        box-sizing: border-box;
        padding: 9px 13px;
        font-size: 13.5px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #ffffff;
        color: var(--t1);
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s cubic-bezier(0,0,0.2,1);
        &::placeholder { color: #94a3b8; }
        &:focus {
            border-color: var(--theme);
            box-shadow: 0 0 0 3px rgba(36, 159, 253, 0.16);
        }
    }
    body.dark .card-modal-input {
        background: #0f172a;
        border-color: #475569;
    }

    .card-modal-input-wrap {
        position: relative;
        display: flex;
        align-items: center;
        .card-modal-input-clear {
            position: absolute;
            right: 8px;
            background: none;
            border: none;
            cursor: pointer;
            color: #94a3b8;
            padding: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.15s;
            i { font-size: 17px; }
            &:hover { color: #f43f5e; }
        }
    }

    /* ── Tab 分段选择器 ── */
    .card-modal-tabs {
        display: flex;
        gap: 4px;
        background: #f1f5f9;
        border-radius: 10px;
        padding: 3px;
        margin-bottom: 8px;
    }
    body.dark .card-modal-tabs { background: #0f172a; }

    .card-modal-tab {
        flex: 1;
        padding: 7px 8px;
        font-size: 12.5px;
        font-weight: 600;
        color: #64748b;
        background: none;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        white-space: nowrap;
        i { font-size: 14px; }
        &:hover { color: #249ffd; }
        &.active {
            background: #ffffff;
            color: #249ffd;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            font-weight: 700;
        }
    }
    body.dark .card-modal-tab.active {
        background: #1e293b;
        color: #38bdf8;
    }

    .card-modal-tab-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    /* ── 快捷 Emoji 推荐 ── */
    .card-modal-preset-emojis {
        display: flex;
        align-items: center;
        gap: 6px;
        overflow: hidden;
    }

    .card-modal-preset-tip {
        font-size: 11.5px;
        font-weight: 600;
        color: #94a3b8;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .card-modal-preset-scroll {
        display: flex;
        gap: 4px;
        overflow-x: auto;
        padding: 2px 0 6px;
        scrollbar-width: none;
        &::-webkit-scrollbar { display: none; }
    }

    .card-modal-emoji-chip {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 0;
        &:hover {
            transform: scale(1.15);
            background: #e0f2fe;
            border-color: #38bdf8;
        }
        &.active {
            background: #249ffd;
            border-color: #249ffd;
            transform: scale(1.1);
        }
    }
    body.dark .card-modal-emoji-chip {
        background: #0f172a;
        border-color: #334155;
    }

    .card-modal-auto-row {
        display: flex;
        gap: 8px;
    }

    .card-modal-fetch-btn {
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 700;
        color: #fff;
        background: var(--theme);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 5px;
        transition: opacity 0.2s, box-shadow 0.2s;
        i { font-size: 15px; }
        &:hover:not(:disabled) {
            opacity: 0.9;
            box-shadow: 0 2px 10px rgba(36, 159, 253, 0.35);
        }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .card-modal-error {
        font-size: 12px;
        color: #f43f5e;
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 2px;
    }

    /* ── 显示状态开关卡片 ── */
    .card-modal-switch-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        cursor: pointer;
        user-select: none;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        &:hover {
            border-color: rgba(36, 159, 253, 0.4);
            background: #f1f5f9;
        }
    }
    body.dark .card-modal-switch-card {
        background: #0f172a;
        border-color: #334155;
        &:hover { background: #1e293b; }
    }

    .card-modal-switch-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--t1);
    }

    .card-modal-switch-sub {
        font-size: 11.5px;
        color: #94a3b8;
        margin-top: 2px;
    }

    .card-modal-switch {
        width: 42px;
        height: 24px;
        border-radius: 12px;
        background: #cbd5e1;
        position: relative;
        transition: background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        flex-shrink: 0;
        &.is-on {
            background-color: var(--theme);
        }
    }

    .card-modal-switch-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .card-modal-switch.is-on .card-modal-switch-thumb {
        transform: translateX(18px);
    }

    /* ── 弹窗底部操作区 ── */
    .card-modal-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 22px;
        background: #f8fafc;
        border-top: 1px solid #f1f5f9;
        gap: 10px;
    }
    body.dark .card-modal-footer {
        background: #0f172a;
        border-top-color: #334155;
    }

    .card-modal-footer-right {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .card-modal-btn-reset {
        background: none;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 7px 12px;
        font-size: 12.5px;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
        i { font-size: 14px; }
        &:hover {
            color: var(--t1);
            border-color: var(--t1);
        }
    }
    body.dark .card-modal-btn-reset {
        border-color: #475569;
        color: #94a3b8;
    }

    .card-modal-btn-delete {
        background: none;
        border: 1px solid rgba(244, 63, 94, 0.35);
        border-radius: 8px;
        padding: 7px 13px;
        font-size: 12.5px;
        font-weight: 600;
        color: #f43f5e;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
        i { font-size: 15px; }
        &:hover {
            background: rgba(244, 63, 94, 0.1);
            border-color: #f43f5e;
        }
    }

    .card-modal-btn-cancel {
        background: none;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 7px 14px;
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
        &:hover {
            color: var(--t1);
            border-color: var(--t1);
        }
    }
    body.dark .card-modal-btn-cancel {
        border-color: #475569;
        color: #94a3b8;
    }

    .card-modal-btn-save {
        background: linear-gradient(135deg, var(--theme) 0%, #1a82d6 100%);
        border: none;
        border-radius: 8px;
        padding: 8px 18px;
        font-size: 13px;
        font-weight: 700;
        color: #fff;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(36, 159, 253, 0.3);
        transition: opacity 0.2s, box-shadow 0.2s, transform 0.15s;
        &:hover {
            opacity: 0.92;
            box-shadow: 0 4px 14px rgba(36, 159, 253, 0.45);
            transform: translateY(-1px);
        }
    }

    .card-modal-confirm-text {
        font-size: 14px;
        line-height: 1.6;
        color: var(--t1);
        margin: 0;
        strong { color: #f43f5e; }
    }

</style>