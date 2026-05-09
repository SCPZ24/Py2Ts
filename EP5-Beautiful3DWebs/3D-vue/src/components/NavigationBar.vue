<script setup lang="ts">
/**
 * NavigationBar
 * 右上角的胶囊形导航按钮（纯 HTML/CSS，浮在 canvas 上层）
 * 在加载完成后由 App.vue 控制显示
 */
defineProps<{ visible: boolean }>()
</script>

<template>
  <Transition name="nav-fade">
    <nav v-if="visible" class="nav-pill">
      <a href="#" class="nav-link">WORK</a>
      <span class="nav-divider">———</span>
      <a href="#" class="nav-link">CONTACT</a>

      <!-- 右上角高光装饰线（模仿截图中的青色光线） -->
      <div class="nav-glow" />
    </nav>
  </Transition>
</template>

<style scoped>
.nav-pill {
  position: fixed;
  top: 22px;
  right: 22px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 20px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
  z-index: 100;
  overflow: hidden;
}

.nav-link {
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 11px;
  letter-spacing: 0.18em;
  font-family: 'Courier New', monospace;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #fff;
}

.nav-divider {
  color: rgba(255, 255, 255, 0.3);
  font-size: 10px;
  letter-spacing: 0.05em;
}

/* 青色光线装饰（胶囊按钮右上角的彩色光晕） */
.nav-glow {
  position: absolute;
  top: -4px;
  right: 10px;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #00e5ff, transparent);
  border-radius: 50%;
  opacity: 0.7;
}

/* ── 导航淡入 ── */
.nav-fade-enter-active {
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.nav-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
