import "./assets/main.css";

import { createApp } from 'vue'
// 此处可能因为找不到 App.vue 文件或类型声明而报错。
// 请确保已经存在 src/App.vue 文件，且如有 TypeScript 类型提示，请检查 <script lang="ts"> 是否设置。
// 如文件无误但编辑器仍报错，尝试重启编辑器或运行 `vue-tsc` 检查。
// 原导入如下：
import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(router);

app.mount("#app");
