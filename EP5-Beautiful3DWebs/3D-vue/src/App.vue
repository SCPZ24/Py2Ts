<script setup lang="ts">
/**
 * App.vue — 根组件
 *
 * 层级结构（从底到顶）：
 *   ThreeScene    — position: fixed，全屏 WebGL canvas（z-index: 0）
 *   ThreeScene 内的 ScrollHint — position: fixed（z-index: 10）
 *   NavigationBar — position: fixed，右上角（z-index: 100）
 *   LoadingOverlay — position: fixed，最顶层（z-index: 1000）
 *
 * 流程：
 *   1. 显示 LoadingOverlay（加载动画）
 *   2. 加载完成后 LoadingOverlay 淡出，emit 'done'
 *   3. App.vue 收到 'done'：标记 loaded=true
 *      → ThreeScene 开始渲染（v-if="loaded" 避免 canvas 在加载前初始化）
 *      → NavigationBar 淡入
 */

import { ref } from 'vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import NavigationBar from '@/components/NavigationBar.vue'
import ThreeScene from '@/components/ThreeScene.vue'

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

  <!-- 导航栏（加载完成后淡入） -->
  <NavigationBar :visible="loaded" />
</template>
