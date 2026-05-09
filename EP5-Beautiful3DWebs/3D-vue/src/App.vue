<script setup lang="ts">
/**
 * App.vue — 根组件
 *
 * 层级结构（从底到顶）：
 *   ThreeScene    — position: fixed，全屏 WebGL canvas（z-index: 0）
 *   ThreeScene 内的 ScrollHint — position: fixed（z-index: 10）
 *   GlassHud       — position: fixed，液态玻璃仪表盘（z-index: 15）
 *   LoadingOverlay — position: fixed，最顶层（z-index: 1000）
 *
 * 流程：
 *   1. 显示 LoadingOverlay（加载动画）
 *   2. 加载完成后 LoadingOverlay 淡出，emit 'done'
 *   3. App.vue 收到 'done'：标记 loaded=true
 *      → ThreeScene 开始渲染（v-if="loaded" 避免 canvas 在加载前初始化）
 */

import { ref } from 'vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import ThreeScene from '@/components/ThreeScene.vue'
import GlassHud from '@/components/GlassHud.vue'

const loaded = ref(false)

function onLoadingDone() {
  loaded.value = true
}
</script>

<template>
  <!-- 加载遮罩（z-index 最高，加载完后自动淡出消失） -->
  <LoadingOverlay @done="onLoadingDone" />

  <!-- Three.js 主场景（加载完成后才挂载，避免资源浪费） -->
  <ThreeScene v-if="loaded" />

  <!-- Canvas 之上的液态玻璃 HUD（与场景同生命周期） -->
  <GlassHud v-if="loaded" />
</template>
