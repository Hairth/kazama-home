<template>
    <nya-container class="weather-widget">
        <div class="weather-inner">
            <img src="/weather-center.gif" class="weather-center-gif" alt="" />
            <span class="weather-icon">{{ weatherData.icon }}</span>
            <div class="weather-info">
                <div class="weather-title">当地天气</div>
                <div v-if="isLoading" class="weather-loading">
                    加载中<span class="dot">.</span><span class="dot dot-2">.</span><span class="dot dot-3">.</span>
                </div>
                <div v-if="!isLoading" class="weather-body">
                    <div class="weather-main">
                        {{ weatherData.location }}：{{ weatherData.condition }} {{ weatherData.temperature }}
                    </div>
                    <div class="weather-detail">
                        {{ weatherData.tempRange }} | 空气质量: {{ weatherData.airQuality }} | 湿度: {{ weatherData.humidity }}
                    </div>
                </div>
            </div>
            <div class="weather-clock">
                <div class="weather-clock-time">{{ clock.time }}</div>
                <div class="weather-clock-date">{{ clock.date }}</div>
            </div>
        </div>
    </nya-container>
</template>

<script>
const CACHE_DURATION = 3600000;
const MIN_API_INTERVAL = 5000;

const weatherIcons = {
    '晴': '☀️',
    '多云': '⛅',
    '阴': '☁️',
    '小雨': '🌦️',
    '中雨': '🌧️',
    '大雨': '🌧️',
    '暴雨': '⛈️',
    '雷': '⚡',
    '雪': '❄️',
    '雾': '🌫️',
    '霾': '🌫️',
    '未知': '🌤️'
};

function buildWeatherData(data, userLocation = '') {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const fullDateTime = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekDays[now.getDay()]} ${timeString}`;

    if (!data || data.error) {
        return {
            location: userLocation || '未知位置',
            condition: data?.reason || '获取失败',
            temperature: 'N/A', tempRange: 'N/A',
            airQuality: 'N/A', humidity: 'N/A',
            time: timeString, fullDateTime,
            icon: weatherIcons['未知']
        };
    }

    const current = data.current || {};
    const code = current.weather_code !== undefined ? current.weather_code : -1;
    const temperature = current.temperature_2m !== undefined ? `${Math.round(current.temperature_2m)}°C` : 'N/A';

    let tempRange = 'N/A';
    if (data.daily) {
        const lo = data.daily.temperature_2m_min?.[0];
        const hi = data.daily.temperature_2m_max?.[0];
        if (lo !== undefined && hi !== undefined) tempRange = `${Math.round(lo)}~${Math.round(hi)}°C`;
    }

    const humidity = current.relative_humidity_2m !== undefined ? `${current.relative_humidity_2m}%` : 'N/A';

    let airQuality = 'N/A';
    if (current.european_aqi !== undefined) {
        const aqi = current.european_aqi;
        const level = aqi <= 20 ? '优' : aqi <= 40 ? '良' : aqi <= 60 ? '中等' : aqi <= 80 ? '一般' : aqi <= 100 ? '差' : '严重';
        airQuality = `${level} (${aqi})`;
    }

    let condition = '未知', icon = weatherIcons['未知'];
    if (code === 0) { condition = '晴'; icon = weatherIcons['晴']; }
    else if (code === 1) { condition = '大部晴朗'; icon = weatherIcons['晴']; }
    else if (code === 2) { condition = '局部多云'; icon = weatherIcons['多云']; }
    else if (code === 3) { condition = '多云'; icon = weatherIcons['多云']; }
    else if ([45, 48].includes(code)) { condition = '雾'; icon = weatherIcons['雾']; }
    else if ([51, 53, 55, 56, 57].includes(code)) { condition = '小雨'; icon = weatherIcons['小雨']; }
    else if ([61, 63, 66, 80, 81].includes(code)) { condition = '中雨'; icon = weatherIcons['中雨']; }
    else if ([65, 67, 82].includes(code)) { condition = '大雨'; icon = weatherIcons['大雨']; }
    else if ([95, 96, 99].includes(code)) { condition = '雷雨'; icon = weatherIcons['雷']; }
    else if ([71, 73, 75, 77, 85, 86].includes(code)) { condition = '雪'; icon = weatherIcons['雪']; }

    return { location: userLocation || '未知位置', condition, temperature, tempRange, airQuality, humidity, time: timeString, fullDateTime, icon };
}

import { animate, stagger } from '~/assets/js/anime.esm.min.js';

export default {
    name: 'Weather',
    data() {
        return {
            isLoading: true,
            weatherData: {
                location: '', condition: '', temperature: '',
                tempRange: '', airQuality: '', humidity: '',
                time: '', fullDateTime: '', icon: '🌤️'
            },
            clock: { time: '', date: '' }
        };
    },
    created() {
        // 非响应式缓存和标志，模拟 useRef
        this._cache = { data: null, lastUpdated: 0, location: '', coordinates: null };
        this._apiInProgress = false;
        this._lastApiCall = 0;
        this._visibilityHandler = null;
        this._clockTimer = null;
    },
    watch: {
        isLoading(val) {
            if (!val) {
                if (this._dotsAnim) { this._dotsAnim.pause(); this._dotsAnim = null; }
                this.$nextTick(() => {
                    animate(this.$el.querySelectorAll('.weather-icon, .weather-title, .weather-main, .weather-detail, .weather-clock-time, .weather-clock-date'), {
                        opacity: [0, 1],
                        translateY: [8, 0],
                        duration: 380,
                        delay: stagger(55),
                        ease: 'outCubic'
                    });
                });
            }
        }
    },
    mounted() {
        this._tickClock();
        this._clockTimer = setInterval(() => this._tickClock(), 1000);

        // 三个点 loading 动画
        this.$nextTick(() => {
            const dots = this.$el.querySelectorAll('.dot');
            if (dots.length) {
                this._dotsAnim = animate(dots, {
                    translateY: [0, -5, 0],
                    duration: 600,
                    delay: stagger(130),
                    loop: true,
                    ease: 'inOutSine'
                });
            }
        });

        const init = () => this._fetchWeather();
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(init);
        } else {
            setTimeout(init, 1000);
        }
        this._visibilityHandler = () => {
            if (document.visibilityState !== 'visible') return;
            const now = Date.now();
            if (!this._cache.data || now - this._cache.lastUpdated > CACHE_DURATION) {
                this._fetchWeather();
            }
        };
        document.addEventListener('visibilitychange', this._visibilityHandler, { passive: true });
    },
    beforeDestroy() {
        if (this._dotsAnim) { this._dotsAnim.pause(); this._dotsAnim = null; }
        if (this._visibilityHandler) {
            document.removeEventListener('visibilitychange', this._visibilityHandler);
        }
        if (this._clockTimer) {
            clearInterval(this._clockTimer);
        }
    },
    methods: {
        _tickClock() {
            const now = new Date();
            const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
            this.clock.time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            this.clock.date = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`;
        },
        async _fetchWeather() {
            if (this._apiInProgress) return;
            const now = Date.now();
            if (now - this._lastApiCall < MIN_API_INTERVAL) return;
            this._apiInProgress = true;
            this._lastApiCall = now;
            this.isLoading = true;

            try {
                if (this._cache.data && now - this._cache.lastUpdated < CACHE_DURATION) {
                    this.weatherData = this._cache.data;
                    this.isLoading = false;
                    return;
                }

                const { location, coordinates } = await this._fetchLocation();
                if (!location || !coordinates) {
                    this.weatherData = buildWeatherData({ error: true, reason: '无法获取位置' }, location || '未知位置');
                    this.isLoading = false;
                    return;
                }

                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&current=temperature_2m,weather_code,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
                const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&current=european_aqi&timezone=auto`;

                const wCtrl = new AbortController();
                const wTimer = setTimeout(() => wCtrl.abort(), 4000);
                const wRes = await fetch(weatherUrl, { signal: wCtrl.signal });
                clearTimeout(wTimer);
                if (!wRes.ok) throw new Error(`天气 API 返回 ${wRes.status}`);
                const wData = await wRes.json();

                let aqData = { current: {} };
                try {
                    const aqCtrl = new AbortController();
                    const aqTimer = setTimeout(() => aqCtrl.abort(), 5000);
                    const aqRes = await fetch(aqUrl, { signal: aqCtrl.signal });
                    clearTimeout(aqTimer);
                    if (aqRes.ok) aqData = await aqRes.json();
                } catch (_) {}

                const combined = { ...wData, current: { ...wData.current, european_aqi: aqData.current?.european_aqi } };
                const parsed = buildWeatherData(combined, location);
                this._cache.data = parsed;
                this._cache.lastUpdated = now;
                this.weatherData = parsed;
                this.isLoading = false;
            } catch (err) {
                this.weatherData = buildWeatherData({ error: true, reason: err.message }, this._cache.location || '');
                this.isLoading = false;
            } finally {
                this._apiInProgress = false;
            }
        },

        async _fetchLocation() {
            if (this._cache.location && this._cache.coordinates) {
                return { location: this._cache.location, coordinates: this._cache.coordinates };
            }
            let location = '', coordinates = null;
            try {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 4000);
                const res = await fetch('https://api.myip.la/cn?json', { signal: ctrl.signal });
                clearTimeout(timer);
                if (res.ok) {
                    const d = await res.json();
                    if (d?.location) {
                        if (d.location.latitude && d.location.longitude) {
                            coordinates = { latitude: parseFloat(d.location.latitude), longitude: parseFloat(d.location.longitude) };
                        }
                        const prov = d.location.province || '', city = d.location.city || '';
                        if (prov && city) {
                            location = city.includes(prov.replace('省', '').replace('市', '').replace('都', '')) ? city : prov + city;
                        } else {
                            location = city || prov || d.location.country_name || '';
                        }
                    }
                }
            } catch (_) {}

            if (!location) {
                try {
                    const res = await fetch('https://myip.ipip.net');
                    if (res.ok) {
                        const text = await res.text();
                        if (text.includes('来自于：')) {
                            const parts = text.split('来自于：')[1].split('  ')[0].trim().split(' ');
                            location = parts.length >= 3 ? parts[1] + parts[2] : parts[parts.length - 1] || '';
                            if (location) coordinates = await this._getCoordinates(location);
                        }
                    }
                } catch (_) {}
            }

            if (location) {
                this._cache.location = location;
                this._cache.coordinates = coordinates;
            }
            return { location, coordinates };
        },

        async _getCoordinates(cityName) {
            if (!cityName) return null;
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&accept-language=zh-Hans&countrycodes=CN`);
                if (!res.ok) return null;
                const data = await res.json();
                if (data?.length > 0) return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
                if (cityName.length > 2) {
                    const res2 = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName.substring(0, 2))}&format=json&limit=1&accept-language=zh-Hans&countrycodes=CN`);
                    if (res2.ok) {
                        const d2 = await res2.json();
                        if (d2?.length > 0) return { latitude: parseFloat(d2[0].lat), longitude: parseFloat(d2[0].lon) };
                    }
                }
            } catch (_) {}
            return null;
        }
    }
};
</script>

<style lang="scss">
.nya-container.weather-widget {
    margin-bottom: 32px;
    margin-top: 18px;
}

.weather-inner {
    display: flex;
    align-items: center;
    gap: 16px;
    position: relative;
}

.weather-center-gif {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 72px;
    width: auto;
    pointer-events: none;
}

.weather-icon {
    font-size: 40px;
    line-height: 1;
    flex-shrink: 0;
}

.weather-info {
    flex: 1;
    min-width: 0;
}

.weather-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--theme);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.weather-loading {
    font-size: 14px;
    color: var(--t1);

    .dot {
        display: inline-block;
        font-weight: bold;
    }
}

.weather-main {
    font-size: 15px;
    font-weight: 600;
    color: var(--t1);
    margin-bottom: 3px;
}

.weather-detail {
    font-size: 13px;
    color: var(--t1);
    opacity: 0.7;
}

.weather-clock {
    flex-shrink: 0;
    text-align: right;
    margin-left: 12px;
}

.weather-clock-time {
    font-size: 32px;
    font-weight: 600;
    color: var(--t1);
    line-height: 1.1;
    letter-spacing: 1px;
    font-variant-numeric: tabular-nums;
}

.weather-clock-date {
    font-size: 12px;
    color: var(--t1);
    opacity: 0.55;
    margin-top: 3px;
    white-space: nowrap;
}

</style>
