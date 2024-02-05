import Vue from 'vue'
import VueRouter from 'vue-router'
// 加载loding效果
import NProgress from "nprogress"
import "nprogress/nprogress.css"
NProgress.configure({ showSpinner: false })
// 导入封装的判断是否为移动端设备的函数
import { isMobile } from '@/utils/mobileORpc'
import { myBrowser } from '@/utils/browserType'
import { getToken } from '@/utils/token'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import(/* webpackChunkName: "login" */ '../views/Login.vue')
  },
  {
    path: '/home',
    name: 'home',
    redirect: '/home/music',
    component: () => import(/* webpackChunkName: "home" */ '../views/Home.vue'),
    children: [
      {
        path: 'music',
        name: 'music',
        component: () => import(/* webpackChunkName: "music" */ '../views/Music.vue')
      },
      {
        path: 'video',
        name: 'video',
        component: () => import(/* webpackChunkName: "video" */ '../views/Video.vue')
      },
      {
        path: 'trans',
        name: 'trans',
        component: () => import(/* webpackChunkName: "trans" */ '../views/Trans.vue')
      },
      {
        path: 'chatgpt',
        name: 'chatgpt',
        component: () => import(/* webpackChunkName: "chatgpt" */ '../views/GPT.vue')
      },
      {
        path: 'textToImg',
        name: 'textToImg',
        component: () => import(/* webpackChunkName: "textToImg" */ '../views/TextToPhoto.vue')
      },
      {
        path: 'help',
        name: 'help',
        component: () => import(/* webpackChunkName: "help" */ '../views/Help.vue')
      },
      {
        path: 'about',
        name: 'about',
        component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
      }
    ]
  },
  {
    path: '*',
    component: () => import(/* webpackChunkName: "about" */ '../views/NotFound.vue')
  }
]

const router = new VueRouter({
  routes
})

// 路由前置全局守卫（在路由发生真正跳转之前，会执行该函数）
router.beforeEach((to, from, next) => {
  // 如果是移动端访问，阻止继续访问
  if (isMobile()) {
    alert('检测到当前设备为移动端，因暂未做移动端适配，将无法继续访问，请用电脑（推荐谷歌浏览器）访问！谢谢！')
    return
  } else {
    if (myBrowser() === 'Chrome') {
      console.log(myBrowser())
      NProgress.start()
      next()
    } else {
      console.log(myBrowser())
      alert('检测到当前浏览器不是谷歌内核浏览器，将无法继续访问，同时为保证解析视频功能正常使用，强烈推荐使用谷歌浏览器！请使用谷歌浏览器访问，谢谢理解与支持！')
      return
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
