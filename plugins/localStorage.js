import createPersistedState from 'vuex-persistedstate';

// 需要同步到云端的 key（不含 isAuthenticated、accessPassword 等敏感/临时 key）
const CLOUD_KEYS = ['dark', 'setting', 'customTools', 'sectionNames', 'toolIcons', 'sectionIcons', 'customSections', 'sectionOrder'];

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
            paths: ['dark', 'setting', 'syncTime', 'noticeId', 'welcome', 'isAuthenticated', 'accessPassword', 'customTools', 'sectionNames', 'toolIcons', 'sectionIcons', 'customSections', 'sectionOrder']
        })(store);

        // 从云端加载（优先级最高，覆盖 localStorage）
        cloudLoading = true;
        await loadFromCloud(store);
        cloudLoading = false;

        // 监听 store 变化，自动同步到云端
        store.subscribe(() => {
            saveToCloud(store);
        });
    });
};
