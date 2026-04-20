<template>
    <div class="navbar">
        <header>
            <h1 class="title">
                <nuxt-link to="/">
                    <img src="/title-bg.png" class="title-bg-img" alt="" />
                    <span class="title-text">風間の屋</span>
                </nuxt-link>
            </h1>
        </header>
    </div>
</template>

<script>
import Panel from '~/components/Panel';
export default {
    name: 'Navbar',
    components: {
        Panel
    },
    methods: {
        handleLogout() {
            this.$store.commit('SET_AUTH', false);
            localStorage.removeItem('miku_remember_until');
            this.$router.replace('/login');
        }
    }
};
</script>


<style lang="scss">
@keyframes title-gradient-move {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

.navbar {
    box-sizing: border-box;
    padding-top: 20px;
    padding-bottom: 10px;
    h2 {
        font-size: 20px;
        margin-top: -40px;
    }
    button {
        font-weight: bold;
    }
    header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        position: relative;
        .title {
            margin-bottom: 5px;
            margin-top: -13px;
            display: flex;
            align-items: center;
            color: var(--t1);
            cursor: pointer;
            text-shadow: 1px 1px 1px rgba($color: #000000, $alpha: 0.15);
            a {
                position: relative;
                color: var(--t1);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 270px;
                height: 270px;
                &:hover {
                    text-decoration: none;
                }
            }
            .title-bg-img {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(1.53);
                width: 270px;
                height: 270px;
                object-fit: contain;
                pointer-events: none;
                z-index: 0;
            }
            .title-text {
                position: relative;
                z-index: 1;
                font-size: 3.25rem;
                background: linear-gradient(90deg, #ffb3e6, #c4b0f5, #87ceeb, #c4b0f5, #ffb3e6);
                background-size: 300% 100%;
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: title-gradient-move 4s linear infinite;
            }
        }
        .logout-btn {
            position: absolute;
            right: 0;
            bottom: 8px;
            background: none;
            border: 1px solid #f93a6d;
            border-radius: 6px;
            padding: 5px 12px;
            cursor: pointer;
            color: #f93a6d;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: normal;
            transition: color 0.2s, border-color 0.2s, background-color 0.2s;
            white-space: nowrap;
            &:hover {
                background-color: rgba(249, 58, 109, 0.08);
            }
        }
    }
}
</style>
