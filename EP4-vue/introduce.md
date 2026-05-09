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

## Vue项目是如何启动的

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

## Vue项目是如何路由的

1. 在app实例打到`index.html`的`app`元素之前，其实已经执行了
```typescript
app.use(router);
```

  这个router来自ts脚本`./router/index.ts`中定义的`router`类。
  这个`use`方法其实就把router类挂载到了app实例上。

2. router类中其实就定义了URL到页面的映射。
  每个页面需要两个必须的：
    - path: 网页上的URL。`/`表示index页面
    - component: URL对应的组件页

  此处的router定义了2个URL到页面的映射。

  默认的两个组件页定义的不一样，一个是立刻加载（在上面import），一个是懒惰加载（在运行中import）。

3. `App.vue`中，容易看到导入了`RouterView`,`RouterLink`组件。
  - `RouterView`组件表示当前页面是哪个URL。
  - `RouterLink`组件用于定义跳转按钮。


## 一个Vue网页还需要什么

### API调用
我们经常用Axios来调后端API。

我们可以设置调用拦截器，在调用API之前，进行一些处理。

```typescript
axios.interceptors.request.use(config => {
  return config;
});
```
调用API之后也可以进行一些处理。
```typescript
axios.interceptors.response.use(response => {
  return response;
}, error => {
    return Promise.reject(error);
});
```

### 全局变量
我们用pinia来管理全局变量。
```typescript
import { createPinia } from 'pinia';
const pinia = createPinia();
app.use(pinia);
```