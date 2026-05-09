<script setup lang="ts">
/**
 * LoadingOverlay
 * 加载动画：模仿 activetheory.net 的半球形虚线网格 + 进度数字
 *
 * 实现方式：
 * - 半球形用 CSS clip-path 截取一个旋转的线框球（border-radius + transform）
 * - 实际上用纯 CSS 绘制虚线网格更简洁，不需要额外的 Three.js 实例
 * - 进度从 0 伪造到 100（模拟资源加载），完成后 emit 'done'
 */

import { ref, onMounted } from 'vue'

const emit = defineEmits<{ done: [] }>()

const progress = ref(0)
const visible = ref(true)

onMounted(() => {
  // 模拟加载进度（1.5 秒内从 0 → 100）
  const startTime = Date.now()
  const duration = 1500

  function tick() {
    const elapsed = Date.now() - startTime
    progress.value = Math.min(100, Math.round((elapsed / duration) * 100))

    if (progress.value < 100) {
      requestAnimationFrame(tick)
    } else {
      // 100 后短暂停留，再淡出
      setTimeout(() => {
        visible.value = false
        // 等待淡出动画（600ms）再通知父组件
        setTimeout(() => emit('done'), 600)
      }, 300)
    }
  }

  requestAnimationFrame(tick)
})
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="loading-overlay">
      <!-- 半球形线框 -->
      <div class="dome-wrap">
        <div class="dome">
          <!-- 7 条横向虚线构成半球轮廓 -->
          <div v-for="i in 7" :key="i" class="dome-line" :style="{ '--i': i }" />
        </div>
      </div>

      <!-- 进度数字 -->
      <div class="progress-text">/{{ progress }}</div>
    </div>
  </Transition>
</template>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  background: #020408;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* ── 半球形线框 ─────────────────────── */
.dome-wrap {
  width: 140px;
  height: 80px;
  overflow: hidden;  /* clip-path 截取上半部分 */
  margin-bottom: 0;
}

.dome {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 1px dashed rgba(0, 200, 200, 0.25);
  position: relative;
  animation: spin 6s linear infinite;
  /* 让整个球旋转，上半球就是我们看到的"半球" */
}

/* 横向虚线（模拟纬线） */
.dome-line {
  position: absolute;
  left: 50%;
  top: 50%;
  height: 1px;
  background: transparent;
  border-top: 1px dashed rgba(0, 200, 200, 0.35);
  transform-origin: left center;
  /* 根据序号 i 计算每条线的宽度和垂直偏移，形成透视感 */
  width: calc(var(--i) * 14px);
  margin-left: calc(var(--i) * -7px);
  margin-top: calc((var(--i) - 4) * 9px);
}

@keyframes spin {
  from { transform: rotateY(0deg) rotateX(15deg); }
  to   { transform: rotateY(360deg) rotateX(15deg); }
}

/* ── 进度数字 ──────────────────────── */
.progress-text {
  color: rgba(0, 220, 220, 0.85);
  font-family: 'Courier New', monospace;
  font-size: 13px;
  letter-spacing: 0.12em;
  margin-top: 16px;
}

/* ── 淡出过渡 ──────────────────────── */
.fade-leave-active {
  transition: opacity 0.6s ease;
}
.fade-leave-to {
  opacity: 0;
}
</style>
