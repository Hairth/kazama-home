import createPersistedState from 'vuex-persistedstate';

// 需要同步到云端的 key（不含 isAuthenticated、accessPassword 等敏感/临时 key）
const CLOUD_KEYS = ['dark', 'setting', 'customTools', 'sectionNames', 'toolIcons', 'sectionIcons', 'customSections', 'sectionOrder', 'toolOrder'];

async function loadFromCloud(store) {
    try {
        const res = await fetch('/api/settings');
        if (!res.ok) return;
        const data = await res.json();
        if (!data) return;
        CLOUD_KEYS.forEach(key => {
            if (data[key] !== undefined) {
                store.commit('SET_STORE', { key, value: data[key] });
            }
        });
    } catch (e) {
        // 本地开发或网络失败时静默降级，继续使用 localStorage
    }
}

let saveTimer = null;
let cloudLoading = false;

function saveToCloud(store) {
    if (cloudLoading) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
        const payload = {};
        CLOUD_KEYS.forEach(key => {
            payload[key] = store.state[key];
        });
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            // 静默失败，不影响本地使用
        }
    }, 1500);
}

export default ({ store }) => {
    window.onNuxtReady(async () => {
        // 初次访问使用系统设置，否则使用 localStorage
        store.commit('SET_STORE', {
            key: 'dark',
            value: window.matchMedia('(prefers-color-scheme: dark)').matches
        });

        window
            .matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', ({ matches }) => {
                store.commit('SET_STORE', {
                    key: 'dark',
                    value: matches
                });
            });

        createPersistedState({
            key: 'miku_vuex',
            paths: ['dark', 'setting', 'syncTime', 'noticeId', 'welcome', 'accessPassword', 'customTools', 'sectionNames', 'toolIcons', 'sectionIcons', 'customSections', 'sectionOrder', 'toolOrder']
        })(store);

        // 页面刷新时，从 sessionStorage 恢复会话认证状态
        try {
            if (sessionStorage.getItem('miku_session_auth') === '1') {
                store.commit('SET_AUTH', true);
            }
        } catch (e) {}

        // 从云端加载（优先级最高，覆盖 localStorage）
        cloudLoading = true;
        await loadFromCloud(store);
        cloudLoading = false;

        // 兜底：旧版配置没有 sakura 字段时，补上默认值（enabled: true）
        // 必须替换整个 setting 对象，否则 Vue 2 检测不到新增属性，watcher 不会触发
        if (!store.state.setting || !store.state.setting.sakura) {
            store.commit('SET_STORE', {
                key: 'setting',
                value: Object.assign({}, store.state.setting, {
                    sakura: { enabled: true, fallSpeed: 1, maxSize: 14, minSize: 10, delay: 300, colorPreset: 0 }
                })
            });
        }

        // 清除残留测试背景（bg-preview.png）
        const bgState = store.state.setting && store.state.setting.bg;
        if (bgState && bgState.upload && bgState.upload.url === '/bg-preview.png') {
            store.commit('SET_STORE', { key: 'setting.bg.type', value: 'none' });
            store.commit('SET_STORE', { key: 'setting.bg.upload', value: { url: '', deleteUrl: '' } });
        }


        // 监听 store 变化，自动同步到云端
        store.subscribe(() => {
            saveToCloud(store);
        });
    });
};
