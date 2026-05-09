<script setup lang="ts">
/**
 * GlassHud — canvas 之上的液态玻璃仪表盘（试验用）
 * 天气：Open-Meteo 公开 API（无 key，上海坐标示例）
 * 状态：在线、可见性、时间、滚动进度、网络类型（若可用）
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LiquidGlass, GlassMode } from '@wxperia/liquid-glass-vue'

const DEMO_LAT = 31.2304
const DEMO_LON = 121.4737

const glassMode = GlassMode.standard

/** 与 LiquidGlass 内部公式一致：blur ≈ (overLight ? 12 : 4) + blurAmount * 32 px */
const glassUi = {
  cornerRadius: 26,
  blurAmount: 0.42,
  displacementScale: 40,
  saturation: 100,
  aberrationIntensity: 1.2,
  elasticity: 0.1,
  padding: '0',
  mode: glassMode,
} as const

const weather = ref({
  temp: '—',
  label: '加载中…',
  wind: '—',
  place: '上海（示例坐标）',
})

const online = ref(navigator.onLine)
const visibility = ref(document.visibilityState)
const timeStr = ref('')
const scrollProgress = ref(0)
const netType = ref<string | undefined>(
  (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType,
)

function weatherCodeText(code: number): string {
  const map: Record<number, string> = {
    0: '晴朗',
    1: '大部晴朗',
    2: '多云',
    3: '阴',
    45: '雾',
    48: '雾凇',
    51: '小毛毛雨',
    61: '小雨',
    80: '阵雨',
    95: '雷暴',
  }
  return map[code] ?? `代码 ${code}`
}

async function fetchWeather() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${DEMO_LAT}&longitude=${DEMO_LON}&current_weather=true`
    const res = await fetch(url)
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as {
      current_weather?: { temperature: number; weathercode: number; windspeed: number }
    }
    const cw = data.current_weather
    if (!cw) throw new Error('no current_weather')
    weather.value = {
      temp: `${Math.round(cw.temperature)}°C`,
      label: weatherCodeText(cw.weathercode),
      wind: `${cw.windspeed} km/h`,
      place: '上海（Open-Meteo）',
    }
  } catch {
    weather.value = {
      temp: '—',
      label: '不可用（网络 / CORS）',
      wind: '—',
      place: '离线演示',
    }
  }
}

function tickClock() {
  timeStr.value = new Date().toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function onScroll() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  scrollProgress.value = Math.min(1, Math.max(0, window.scrollY / max))
}

function onVis() {
  visibility.value = document.visibilityState
}

function onOnline() {
  online.value = true
}

function onOffline() {
  online.value = false
}

const scrollPct = computed(() => `${Math.round(scrollProgress.value * 100)}%`)

let clockId = 0

onMounted(() => {
  tickClock()
  clockId = window.setInterval(tickClock, 1000)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  void fetchWeather()
})

onUnmounted(() => {
  clearInterval(clockId)
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('visibilitychange', onVis)
  window.removeEventListener('online', onOnline)
  window.removeEventListener('offline', onOffline)
})
</script>

<template>
  <div class="glass-hud" aria-hidden="true">
    <div class="hud-corner hud-top">
      <LiquidGlass class="hud-glass" v-bind="glassUi">
        <div class="panel panel-weather">
          <div class="panel-title">天气</div>
          <div class="weather-row">
            <span class="weather-temp">{{ weather.temp }}</span>
            <span class="weather-meta">{{ weather.label }}</span>
          </div>
          <div class="panel-sub">{{ weather.wind }} · {{ weather.place }}</div>
        </div>
      </LiquidGlass>
    </div>

    <div class="hud-corner hud-bottom">
      <LiquidGlass class="hud-glass" v-bind="glassUi">
        <div class="panel panel-status">
          <div class="panel-title">页面状态</div>
          <ul class="status-list">
            <li>
              <span class="k">网络</span>
              <span class="v" :class="{ ok: online, bad: !online }">{{
                online ? '在线' : '离线'
              }}</span>
            </li>
            <li>
              <span class="k">可见</span>
              <span class="v">{{ visibility === 'visible' ? '前台' : '后台' }}</span>
            </li>
            <li>
              <span class="k">时间</span>
              <span class="v mono">{{ timeStr }}</span>
            </li>
            <li>
              <span class="k">滚动</span>
              <span class="v mono">{{ scrollPct }}</span>
            </li>
            <li v-if="netType">
              <span class="k">链路</span>
              <span class="v mono">{{ netType }}</span>
            </li>
          </ul>
        </div>
      </LiquidGlass>
    </div>
  </div>
</template>

<style scoped>
.glass-hud {
  position: fixed;
  inset: 0;
  z-index: 15;
  pointer-events: none;
}

.hud-corner {
  position: absolute;
  pointer-events: auto;
  max-width: min(340px, calc(100vw - 32px));
}

.hud-top {
  top: 20px;
  left: 20px;
}

.hud-bottom {
  bottom: 24px;
  right: 20px;
}

.hud-glass {
  display: block;
  width: 100%;
}

.panel {
  padding: 14px 16px 16px;
  border-radius: 20px;
  /* 与 main.css 试卷底 #faf6ed 一致，垫在字下面减轻透视杂讯 */
  background: rgba(250, 246, 237, 0.82);
  color: rgba(32, 28, 24, 0.96);
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.45;
}

.panel-title {
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(0, 140, 140, 0.85);
  margin-bottom: 10px;
}

.panel-sub {
  margin-top: 8px;
  font-size: 10px;
  color: rgba(42, 37, 32, 0.55);
}

.weather-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
}

.weather-temp {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: rgba(18, 16, 14, 0.95);
}

.weather-meta {
  font-size: 13px;
  color: rgba(42, 37, 32, 0.75);
}

.status-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-list li {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.k {
  color: rgba(42, 37, 32, 0.5);
  min-width: 36px;
}

.v {
  text-align: right;
  color: rgba(32, 28, 24, 0.9);
}

.v.ok {
  color: rgba(0, 120, 100, 0.95);
}

.v.bad {
  color: rgba(180, 60, 40, 0.95);
}

.mono {
  font-variant-numeric: tabular-nums;
}
</style>
