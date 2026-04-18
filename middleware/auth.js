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

    // 当前会话已认证（SPA 路由跳转时 store 在内存中有效）
    if (store.state.isAuthenticated) return;

    // 页面刷新时 store 尚未水合，直接读 sessionStorage
    try {
        if (sessionStorage.getItem('miku_session_auth') === '1') {
            store.commit('SET_AUTH', true);
            return;
        }
    } catch (e) {}

    return redirect('/login');
}
