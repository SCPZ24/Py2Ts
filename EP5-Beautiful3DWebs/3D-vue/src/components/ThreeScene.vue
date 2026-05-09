<script setup lang="ts">
/**
 * ThreeScene
 * 主 3D 画布组件。负责：
 * 1. 挂载 canvas 元素
 * 2. 初始化 Three.js 场景（useThreeScene）
 * 3. 初始化粒子系统（useParticleSystem）
 * 4. 初始化 scroll 动画（useScrollAnimation）
 * 5. 初始化鼠标交互（useMouseInteraction）
 * 6. 启动 requestAnimationFrame 渲染循环
 * 7. onUnmounted 时清理所有资源
 *
 * 注意：
 * - canvas 是 position: fixed 全屏铺底
 * - 渲染循环里，scroll 控制 camera.position，
 *   鼠标视差在 scroll 基础上微调 camera.rotation
 */

import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { useThreeScene, updateScene } from '@/composables/useThreeScene'
import { useParticleSystem } from '@/composables/useParticleSystem'
import { useScrollAnimation } from '@/composables/useScrollAnimation'
import { useMouseInteraction } from '@/composables/useMouseInteraction'

const canvasRef = ref<HTMLCanvasElement>()

// "SCROLL DOWN" 提示在首次 scroll 后淡出
const showScrollHint = ref(true)

let rafId = 0

onMounted(() => {
  if (!canvasRef.value) return

  // ── 初始化各系统 ────────────────────────────────────────
  const threeCtx   = useThreeScene(canvasRef.value)
  const particles  = useParticleSystem(threeCtx.scene)
  const scrollAnim = useScrollAnimation(threeCtx.camera)
  const mouseInter = useMouseInteraction()

  // scroll 基础旋转（由 scroll 动画更新，鼠标视差在此基础上叠加）
  const baseRotation = new THREE.Euler()

  // 监听 scroll 以隐藏提示
  function onScroll() {
    if (window.scrollY > 50) {
      showScrollHint.value = false
      window.removeEventListener('scroll', onScroll)
    }
  }
  window.addEventListener('scroll', onScroll)

  // ── 渲染循环 ────────────────────────────────────────────
  function animate() {
    rafId = requestAnimationFrame(animate)
    const elapsed = threeCtx.clock.getElapsedTime()

    // 1. 更新场景（呼吸灯 + 圆环自转）
    updateScene(threeCtx, elapsed)

    // 2. 记录 scroll 动画设定的旋转值（在 ScrollTrigger 的 onUpdate 里已更新）
    baseRotation.copy(threeCtx.camera.rotation)

    // 3. 鼠标视差叠加到相机旋转
    mouseInter.update(threeCtx.camera, baseRotation)

    // 4. 更新粒子（传入鼠标 3D 位置 + scroll 进度）
    particles.update(mouseInter.mousePos3D, scrollAnim.progress.value)

    // 5. 渲染（通过 EffectComposer 以支持 Bloom 后处理）
    threeCtx.composer.render()
  }

  animate()

  // ── 清理 ────────────────────────────────────────────────
  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('scroll', onScroll)
    threeCtx.dispose()
    particles.dispose()
    scrollAnim.dispose()
    mouseInter.dispose()
  })
})
</script>

<template>
  <!-- 全屏 Three.js 画布 -->
  <canvas ref="canvasRef" class="three-canvas" />

  <!-- "SCROLL DOWN" 提示文字（首屏，CSS 层） -->
  <Transition name="hint-fade">
    <div v-if="showScrollHint" class="scroll-hint">
      <span class="hint-text">SCROLL DOWN</span>
      <div class="hint-arrow">↓</div>
    </div>
  </Transition>
</template>

<style scoped>
.three-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  display: block;
}

/* ── SCROLL DOWN 提示 ── */
.scroll-hint {
  position: fixed;
  top: 38%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 10;
  pointer-events: none;
}

.hint-text {
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(0, 220, 220, 0.7);
  font-family: 'Courier New', monospace;
}

.hint-arrow {
  color: rgba(0, 220, 220, 0.5);
  font-size: 14px;
  animation: bounce 1.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(5px); }
}

/* ── 淡出动画 ── */
.hint-fade-leave-active {
  transition: opacity 0.6s ease;
}
.hint-fade-leave-to {
  opacity: 0;
}
</style>
