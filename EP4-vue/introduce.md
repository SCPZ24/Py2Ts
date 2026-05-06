# 项目学习

直接用vue作为脚手架。

## 项目启动

```bash
# 创建一个新的 Vue 项目（例如项目名为 vue-project）
npm create vue@latest
```

然后按照提示进行操作。

若没有安装依赖，执行
```bash
cd vue-project
npm install
```

然后就可以
```bash
npm run dev
```

## .vue文件的格式
```html
<template>
  <div>
    <h1>Html Content</h1>
  </div>
</template>

<script setup lang="ts">
    typecript code here
</script>

<style scoped>
    css code here
</style>
```

## vue项目是如何启动的

1. 用户访问web url时，服务端返回`index.html`文件。
2. 浏览器解析`index.html`文件
    - head字段表示web网页的头部信息，包括网页的标题、编码方式、样式表等。
    - body字段由vue参与解析
        1. 浏览器解析到`<div id="app"></div>`，于是创建一个`app`的根元素。
        2. 浏览器解析到`<script type="module" src="/src/main.ts"></script>`，执行`main.ts`文件。
3. main.ts文件执行App页的初始化
    1. 文件`App.vue`直接被解析为一个类，在`main.ts`中被导入。
    2. 用`App`创建一个`app`实例，并挂载到`index.html`的`app`元素上。
4. `App.vue`上，容易看到上面表述的.vue文件三层样式。