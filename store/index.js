import _ from 'lodash';
import env from '../env';

function readHeightMap(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const next = {};
    Object.keys(raw).forEach(key => {
        const value = Number(raw[key]);
        if (!Number.isFinite(value) || value <= 0) return;
        next[key] = Math.min(value, 10000);
    });
    return next;
}

function readTimeMap(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const next = {};
    Object.keys(raw).forEach(key => {
        const value = Number(raw[key]);
        if (!Number.isFinite(value) || value <= 0) return;
        next[key] = value;
    });
    return next;
}

function readStoredSectionLayout() {
    const empty = { sectionHeights: {}, sectionHeightTimes: {} };
    try {
        if (typeof localStorage === 'undefined') return empty;
        const raw = localStorage.getItem('miku_vuex');
        if (!raw) return empty;
        const data = JSON.parse(raw);
        return {
            sectionHeights: readHeightMap(data && data.sectionHeights),
            sectionHeightTimes: readTimeMap(data && data.sectionHeightTimes)
        };
    } catch (e) {
        return empty;
    }
}

function mergeSectionHeights(
    localHeights,
    localTimes,
    remoteHeights,
    remoteTimes
) {
    const localsH = readHeightMap(localHeights);
    const localsT = readTimeMap(localTimes);
    const remotesH = readHeightMap(remoteHeights);
    const remotesT = readTimeMap(remoteTimes);
    const keys = new Set([
        ...Object.keys(localsH),
        ...Object.keys(localsT),
        ...Object.keys(remotesH),
        ...Object.keys(remotesT)
    ]);
    const heights = {};
    const times = {};
    keys.forEach(key => {
        const localTime = localsT[key] || 0;
        const remoteTime = remotesT[key] || 0;
        const localHeight = localsH[key] || 0;
        const remoteHeight = remotesH[key] || 0;
        if (remoteTime > localTime) {
            if (remoteHeight > 0) heights[key] = remoteHeight;
            times[key] = remoteTime;
        } else if (
            remoteTime === localTime &&
            !localHeight &&
            remoteHeight > 0
        ) {
            heights[key] = remoteHeight;
            if (remoteTime > 0) times[key] = remoteTime;
        } else {
            if (localHeight > 0) heights[key] = localHeight;
            if (localTime > 0) times[key] = localTime;
        }
    });
    return { heights, times };
}

export const state = () => {
    const storedSections = readStoredSectionLayout();
    return {
        dark: false,
        noticeId: false,
        inFrames: false,
        currentTool: null,
        disabledMouseWheel: false,
        ads: true,
        loaded: false,
        setting: {
            animations: true,
            hide: [],
            favorites: [],
            hideCategory: false,
            hidePay: false,
            hideNotice: false,
            css: '',
            js: '',
            inNewTab: null,
            hideSections: [],
            bg: {
                type: 'none',
                upload: {
                    url: '',
                    deleteUrl: ''
                },
                customUrl: '',
                blur: 4,
                opacity: 50,
                transparentEl: true
            },
            loginBg: {
                type: 'none',
                upload: {
                    url: '',
                    deleteUrl: ''
                },
                customUrl: '',
                blur: 4,
                opacity: 50
            },
            sakura: {
                enabled: true,
                fallSpeed: 1,
                maxSize: 14,
                minSize: 10,
                delay: 300,
                colorPreset: 0
            }
        },
        globalLoading: false,
        welcome: true,
        isMobile: {},
        env: env,
        syncTime: 0,
        isAuthenticated: false,
        accessPassword: '123456',
        customTools: [],
        sectionNames: {},
        toolIcons: {},
        sectionIcons: {},
        customSections: [],
        sectionOrder: [],
        sectionHeights: storedSections.sectionHeights,
        sectionHeightTimes: storedSections.sectionHeightTimes,
        toolOrder: {},
        toolSections: {}
    };
};

const disabledMouseWheel = e => e.stopPropagation();
export const mutations = {
    SET_STORE(state, n) {
        if (_.isArray(n.value)) {
            n.value = Array.from(n.value);
        }
        if (_.isObject(n.value)) {
            n.value = _.chain(n.value)
                .assign()
                .value();
        }
        state = _.chain(state)
            .set(n.key, n.value)
            .value();
    },
    loadingComponent(state, n) {
        state.globalLoading = n;
    },
    switchTheme(state, n) {
        if (n !== undefined) {
            state.dark = n;
        } else {
            state.dark = !state.dark;
        }
    },
    disabledMouseWheel(state, type) {
        if (type) {
            document.addEventListener('wheel', disabledMouseWheel, {
                passive: true
            });
        } else {
            document.removeEventListener('wheel', disabledMouseWheel, {
                passive: true
            });
        }
        state.disabledMouseWheel = type;
    },
    SET_AUTH(state, val) {
        state.isAuthenticated = val;
    },
    SET_PASSWORD(state, val) {
        state.accessPassword = val;
    },
    ADD_CUSTOM_TOOL(state, tool) {
        state.customTools.push(tool);
    },
    REMOVE_CUSTOM_TOOL(state, id) {
        state.customTools = state.customTools.filter(t => t.id !== id);
        const key = 'custom:' + id;
        state.toolOrder = Object.keys(state.toolOrder).reduce((next, sectionKey) => {
            next[sectionKey] = state.toolOrder[sectionKey].filter(itemKey => itemKey !== key);
            return next;
        }, {});
    },
    TOGGLE_CUSTOM_TOOL(state, id) {
        const idx = state.customTools.findIndex(t => t.id === id);
        if (idx !== -1) {
            state.customTools.splice(idx, 1, {
                ...state.customTools[idx],
                hidden: !state.customTools[idx].hidden
            });
        }
    },
    RENAME_SECTION(state, { original, name }) {
        const trimmed = name.trim();
        const next = { ...state.sectionNames };
        if (!trimmed || trimmed === original) {
            delete next[original];
        } else {
            next[original] = trimmed;
        }
        state.sectionNames = next;
    },
    SET_TOOL_ICON(state, { key, icon }) {
        const next = { ...state.toolIcons };
        if (!icon) delete next[key];
        else next[key] = icon;
        state.toolIcons = next;
    },
    SET_SECTION_ICON(state, { key, icon }) {
        const next = { ...state.sectionIcons };
        if (!icon) delete next[key];
        else next[key] = icon;
        state.sectionIcons = next;
    },
    SET_SECTION_HEIGHT(state, { key, height }) {
        if (!key) return;
        const numeric = Number(height);
        if (!Number.isFinite(numeric)) return;
        const clamped = Math.min(10000, Math.max(0, numeric));
        const next = { ...state.sectionHeights };
        if (clamped === 0) delete next[key];
        else next[key] = clamped;
        state.sectionHeights = next;
        state.sectionHeightTimes = {
            ...(state.sectionHeightTimes || {}),
            [key]: Date.now()
        };
    },
    MERGE_SECTION_HEIGHTS(state, payload) {
        const merged = mergeSectionHeights(
            state.sectionHeights,
            state.sectionHeightTimes,
            payload && payload.heights,
            payload && payload.times
        );
        state.sectionHeights = merged.heights;
        state.sectionHeightTimes = merged.times;
    },
    UPDATE_CUSTOM_TOOL(state, { id, name, url }) {
        const idx = state.customTools.findIndex(t => t.id === id);
        if (idx !== -1) {
            state.customTools.splice(idx, 1, { ...state.customTools[idx], name, url });
        }
    },
    ADD_CUSTOM_SECTION(state, section) {
        state.customSections.push(section);
    },
    RENAME_CUSTOM_SECTION(state, { id, name }) {
        const idx = state.customSections.findIndex(s => s.id === id);
        if (idx !== -1) {
            const oldTitle = state.customSections[idx].title;
            state.customSections.splice(idx, 1, { ...state.customSections[idx], title: name });
            state.customTools = state.customTools.map(t =>
                t.sectionTitle === oldTitle ? { ...t, sectionTitle: name } : t
            );
        }
    },
    REMOVE_CUSTOM_SECTION(state, id) {
        const section = state.customSections.find(s => s.id === id);
        if (section) {
            state.customSections = state.customSections.filter(s => s.id !== id);
            state.customTools = state.customTools.filter(t => t.sectionTitle !== section.title);
            state.sectionOrder = state.sectionOrder.filter(k => k !== 'cs:' + id);
            const sectionKey = 'cs:' + id;
            const nextHeights = { ...state.sectionHeights };
            delete nextHeights[sectionKey];
            state.sectionHeights = nextHeights;
            const nextTimes = { ...(state.sectionHeightTimes || {}) };
            delete nextTimes[sectionKey];
            state.sectionHeightTimes = nextTimes;
            const nextToolOrder = { ...state.toolOrder };
            delete nextToolOrder[sectionKey];
            state.toolOrder = nextToolOrder;
            state.toolSections = Object.keys(state.toolSections || {}).reduce(
                (next, cardKey) => {
                    if (state.toolSections[cardKey] !== sectionKey) {
                        next[cardKey] = state.toolSections[cardKey];
                    }
                    return next;
                },
                {}
            );
        }
    },
    SET_SECTION_ORDER(state, order) {
        state.sectionOrder = [...order];
    },
    SET_TOOL_ORDER(state, { sectionKey, order }) {
        state.toolOrder = {
            ...state.toolOrder,
            [sectionKey]: [...order]
        };
    },
    APPLY_TOOL_LAYOUT(state, { toolOrder, toolSections, customTools }) {
        state.toolOrder = toolOrder;
        state.toolSections = toolSections;
        if (customTools) state.customTools = customTools;
    }
};
