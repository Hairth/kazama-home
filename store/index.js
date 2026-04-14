import _ from 'lodash';
import env from '../env';

export const state = () => ({
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
    accessPassword: 'mikutools',
    customTools: [],
    sectionNames: {},
    toolIcons: {},
    sectionIcons: {},
    customSections: [],
    sectionOrder: []
});

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
        }
    },
    SET_SECTION_ORDER(state, order) {
        state.sectionOrder = [...order];
    }
};
