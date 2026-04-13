<template>
    <nya-container title="登录界面背景图片" class="set-bg">
        <div class="radio-group">
            <nya-radio-group :value="$store.state.setting.loginBg.type" @change="handleChange('setting.loginBg.type', $event)">
                <nya-radio value="none" label="无" />
                <nya-radio value="anime" label="随机动漫图片" />
                <nya-radio value="bing" label="必应每日壁纸" />
                <nya-radio value="custom" label="自定义来源" />
                <nya-radio value="upload" label="上传壁纸" />
            </nya-radio-group>
        </div>

        <nya-input v-show="$store.state.setting.loginBg.type === 'custom'" :value="$store.state.setting.loginBg.customUrl" label="输入壁纸链接" :placeholder="`${$store.state.env.url}/icon.png`" autocomplete="off" fullwidth @change="handleChange('setting.loginBg.customUrl', $event.target.value)" @keyup.enter="handleChange('setting.loginBg.customUrl', $event.target.value)" />

        <div v-show="$store.state.setting.loginBg.type === 'upload'">
            <div class="inputbtn">
                <nya-input
                    v-model="upload.n"
                    class="upfile"
                    type="file"
                    accept="image/*"
                    label="请选择要设置的背景图片"
                    placeholder="点击这里上传文件"
                    :disabled="upload.uploading"
                    @change="handleUploadChange"
                />
                <span v-if="upload.uploading" style="font-size:13px;color:#999;margin-left:6px;">上传中...</span>
            </div>
            <div v-if="upload.previewUrl">
                <div class="nya-subtitle">
                    预览(当前背景)
                </div>
                <img class="preview" :src="upload.previewUrl" alt="preview">
                <div class="nya-btn" @click="removeBg">
                    移除背景
                </div>
            </div>
        </div>
        <hr>

        <div class="nya-subtitle">
            高斯模糊
        </div>
        <client-only>
            <vue-slider :value="$store.state.setting.loginBg.blur" lazy :min="0" :max="100" @change="handleChange('setting.loginBg.blur', $event)" />
        </client-only>

        <div class="nya-subtitle">
            透明度
        </div>
        <client-only>
            <vue-slider :value="$store.state.setting.loginBg.opacity" lazy :min="1" :max="100" @change="handleChange('setting.loginBg.opacity', $event)" />
        </client-only>
    </nya-container>
</template>

<script>
import 'vue-slider-component/theme/default.css';
let VueSlider;
if (process.browser) {
    VueSlider = require('vue-slider-component');
}
export default {
    name: 'SetLoginBackground',
    components: {
        VueSlider
    },
    data() {
        return {
            upload: {
                n: '',
                previewUrl: '',
                uploading: false
            }
        };
    },
    mounted() {
        this.upload.previewUrl = this.$store.state.setting.loginBg.upload.url || '';
    },
    methods: {
        handleChange(key, value) {
            this.$store.commit('SET_STORE', {
                key,
                value
            });
        },
        async handleUploadChange(e) {
            const files = e.target.files;
            if (!files.length) return;
            const file = files[0];
            if (file.size / 1024 / 1024 > 10) {
                this.upload.n = '';
                this.$modal.show('dialog', {
                    title: '文件过大',
                    text: '请选择大小在 10MB 以内的图片'
                });
                return;
            }
            this.upload.uploading = true;
            try {
                const formData = new FormData();
                formData.append('file', file);
                const oldUrl = this.$store.state.setting.loginBg.upload.url;
                if (oldUrl) formData.append('oldUrl', oldUrl);
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                this.upload.previewUrl = data.url;
                this.$store.commit('SET_STORE', {
                    key: 'setting.loginBg.upload',
                    value: { url: data.url, deleteUrl: '' }
                });
            } catch (err) {
                this.upload.n = '';
                this.$modal.show('dialog', {
                    title: '上传失败',
                    text: '图片上传失败，请重试'
                });
            } finally {
                this.upload.uploading = false;
            }
        },
        removeBg() {
            const oldUrl = this.$store.state.setting.loginBg.upload.url;
            if (oldUrl && oldUrl.startsWith('/images/bg/')) {
                fetch('/api/upload', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: oldUrl })
                }).catch(() => {});
            }
            this.$store.commit('SET_STORE', {
                key: 'setting.loginBg.upload',
                value: { url: '', deleteUrl: '' }
            });
            this.upload.previewUrl = '';
            this.upload.n = '';
        }
    }
};
</script>
