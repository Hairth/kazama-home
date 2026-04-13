export default function ({ store, redirect, route }) {
    if (route.path === '/login') return;

    // 服务端没有 localStorage，跳过检查，由客户端接管
    if (process.server) return;

    // 优先检查 7 天免登录
    try {
        const rememberUntil = localStorage.getItem('miku_remember_until');
        if (rememberUntil && Date.now() < parseInt(rememberUntil)) {
            if (!store.state.isAuthenticated) {
                store.commit('SET_AUTH', true);
            }
            return;
        }
    } catch (e) {}

    // 检查 Vuex store（vuex-persistedstate 已加载时有效）
    if (store.state.isAuthenticated) return;

    // 兜底：直接读 localStorage（页面初始化时 vuex-persistedstate 可能还未注水）
    try {
        const saved = JSON.parse(localStorage.getItem('miku_vuex') || '{}');
        if (saved.isAuthenticated) {
            store.commit('SET_AUTH', true);
            return;
        }
    } catch (e) {}

    return redirect('/login');
}
