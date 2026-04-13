<template>
    <div class="setting">
        <SetBackground />
        <SetLoginBackground />
        <SetSakura />

        <nya-container title="自定义 CSS">
            <nya-input :value="$store.state.setting.css" fullwidth rows="5" type="textarea" autocomplete="off" placeholder=".navbar{display: none}" @change="handleChange('setting.css', $event.target.value)" />
        </nya-container>

        <nya-container title="自定义 JS">
            <nya-input :value="$store.state.setting.js" fullwidth rows="5" type="textarea" autocomplete="off" placeholder="alert('欢迎使用 MikuTools')" @change="handleChange('setting.js', $event.target.value)" />
        </nya-container>

        <nya-container title="其他设置">
            <nya-checkbox :checked="$store.state.setting.inNewTab" label="新标签打开工具" @change="handleChange('setting.inNewTab', $event)" />
            <nya-checkbox :checked="$store.state.setting.animations" label="启用过渡动画" @change="handleChange('setting.transition', $event)" />
        </nya-container>

        <nya-container title="访问密码">
            <div class="nya-subtitle">
                修改后需重新登录
            </div>
            <nya-input v-model="newPassword" type="password" label="新密码" fullwidth placeholder="请输入新密码" />
            <nya-input v-model="confirmPassword" type="password" label="确认密码" fullwidth placeholder="再次输入新密码" />
            <div class="nya-btn" style="margin-top:15px" @click="changePassword">
                保存密码
            </div>
        </nya-container>
    </div>
</template>

<script>
import SetBackground from '../components/SetBackground';
import SetLoginBackground from '../components/SetLoginBackground';
import SetSakura from '../components/SetSakura';

export default {
    name: 'Setting',
    head() {
        return this.$store.state.currentTool.head;
    },
    components: {
        SetBackground,
        SetLoginBackground,
        SetSakura
    },
    data() {
        return {
            syncIng: false,
            newPassword: '',
            confirmPassword: ''
        };
    },
    computed: {
    },
    methods: {
        handleChange(key, value) {
            this.$store.commit('SET_STORE', {
                key,
                value
            });
        },
        async changePassword() {
            if (!this.newPassword) {
                this.$noty.error('新密码不能为空');
                return;
            }
            if (this.newPassword !== this.confirmPassword) {
                this.$noty.error('两次输入的密码不一致');
                return;
            }
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(this.newPassword));
            const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
            this.$store.commit('SET_PASSWORD', hash);
            this.$store.commit('SET_AUTH', false);
            this.newPassword = '';
            this.confirmPassword = '';
            this.$noty.success('密码已更新，请重新登录');
            setTimeout(() => {
                this.$router.push('/login');
            }, 1000);
        }
    }
};
</script>

<style lang='scss'>
.setting {
    .nya-checkbox {
        margin-right: 15px;
    }
    .nya-btn {
        margin-top: 15px;
    }
}
</style>
