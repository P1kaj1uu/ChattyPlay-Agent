import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import '@/utils/flexible'
import './plugins/element.js'
// 导入全局样式表
import './assets/css/global.css'
import './assets/css/markdown.css'
// 导入樱花飘落特效
import '@/plugins/sakura'

if (process.env.NODE_ENV !== 'development') {
  // process是Node环境全部变量, 运行时根据敲击的命令不同, 脚手架会取环境变量给env添加属性和值
  console.log = function () {}
  console.error = function () {}
  console.dir = function () {}
}

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
