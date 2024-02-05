<!-- 
    * @Description: 首页页面
    * @Author: 不见水星记（P1kaj1uu）  
-->
<template>
  <el-container class="home-container">
    <!-- 头部区域 -->
    <el-header>
      <div>
        <img src="@/assets/images/home/logo.png" class="webLogo" alt="logo" />
        <h3 style="user-select: none; cursor: pointer">ChattyPlay</h3>
      </div>
    </el-header>
    <!-- 页面主体区域 -->
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px">
        <el-menu
          @select="selectMenu"
          :default-active="currentMenu"
          class="el-menu-vertical-demo"
          background-color="#333744"
          text-color="#fff"
          active-text-color="#409eff"
          router
        >
          <el-menu-item :index="'/home/music'">
            <i class="el-icon-headset"></i>
            <span slot="title">音乐</span>
          </el-menu-item>
          <el-menu-item :index="'/home/video'">
            <i class="el-icon-video-camera-solid"></i>
            <span slot="title">观看</span>
          </el-menu-item>
          <el-menu-item :index="'/home/trans'">
            <i class="el-icon-reading"></i>
            <span slot="title">降重</span>
          </el-menu-item>
          <el-menu-item :index="'/home/chatgpt'">
            <i class="el-icon-s-promotion"></i>
            <span slot="title">GPT</span>
          </el-menu-item>
          <el-menu-item :index="'/home/textToImg'">
            <i class="el-icon-picture"></i>
            <span slot="title">文图</span>
          </el-menu-item>
          <el-menu-item :index="'/home/help'">
            <i class="el-icon-question"></i>
            <span slot="title">帮助</span>
          </el-menu-item>
          <el-menu-item :index="'/home/about'">
            <i class="el-icon-user-solid"></i>
            <span slot="title">关于</span>
          </el-menu-item>
        </el-menu>
        <el-tooltip effect="dark" :content="tooltipContent" placement="right">
          <div class="aside-fold" @click="asideFoldHandle">{{ foldText }}</div>
        </el-tooltip>
        <a href="#" class="button button--bird" @click="ContactMeFn">
          <div class="button__wrapper">
            <span class="button__text">联系我</span>
          </div>
          <div class="birdBox">
            <div class="bird wakeup">
              <div class="bird__face"></div>
            </div>
            <div class="bird wakeup">
              <div class="bird__face"></div>
            </div>
            <div class="bird">
              <div class="bird__face"></div>
            </div>
          </div>
        </a>
      </el-aside>
      <el-container>
        <!-- 右侧内容主体 -->
        <el-main>
          <!-- 路由占位符 -->
          <router-view></router-view>
        </el-main>
        <el-footer
          style="font-family: 'Long Cang', cursive"
          v-show="$route.path === '/' || $route.path === '/home/music'"
        >
          <div style="display: flex; justify-content: center">
            <div>[ 来日方长</div>
            <div class="animated-icon">💗</div>
            <div>未来可期 ]</div>
          </div>
          <div>
            <span id="busuanzi_container_site_pv" style="color: #f2ffff">
              您是第&nbsp;<span id="busuanzi_value_site_pv">***</span
              >&nbsp;位访问本网站的友友~
            </span>
          </div>
          <div>© Copyright 2023 P1Kaj1uu. All Rights Reserved.</div>
        </el-footer>
      </el-container>
    </el-container>
    <el-dialog
      title="联系我"
      :visible.sync="dialogVisible"
      width="30%"
      :before-close="handleClose"
    >
      <div class="dialogTxt">
        <div style="text-align: center">
          联系方式：<span style="font-weight: 600">Dveiklokk</span>（微信号）
          <br />
          <br />
          备注：添加我好友时验证消息请注明来意，谢谢理解配合！
        </div>
        <div style="text-align: center">
          <img
            style="width: 65%; height: 55%; text-align: center; margin: 10px 0"
            src="@/assets/images/home/wx.jpg"
          />
        </div>
        <div style="text-align: center">
          <a
            href="https://githubfast.com/P1kaj1uu/VIP-Video-Parsing"
            style="font-size: 12px"
            target="_blank"
          >
            点击此处前往该项目的Github仓库（希望您可以给一个小小的star！）
          </a>
        </div>
      </div>
    </el-dialog>
  </el-container>
</template>

<script>
import axios from 'axios'
import { mapState, mapMutations } from 'vuex'
import { Address6 } from 'ip-address'

export default {
  name: 'Home',
  data() {
    return {
      dialogVisible: false,
      tooltipContent: '收起侧边栏',
      foldText: '<'
    }
  },
  computed: {
    ...mapState('slide', ['currentMenu'])
  },
  methods: {
    ...mapMutations('slide', ['setCurrentMenu']),
    // 联系我
    ContactMeFn() {
      this.dialogVisible = true
    },
    handleClose () {
      this.dialogVisible = false
      this.$router.push(this.currentMenu)
    },
    selectMenu(index) {
      this.setCurrentMenu(index)
    },
    asideFoldHandle() {
      const foldDOM = document.querySelector('.aside-fold')
      const mainDOM = document.querySelector('.el-main')
      const footerDOM = document.querySelector('.el-footer')
      if (this.foldText === '<') {
        foldDOM.style.left = '0'
        mainDOM.style.left = '0'
        footerDOM.style.left = '0'
      } else {
        foldDOM.style.left = '200px'
        mainDOM.style.left = '200px'
        footerDOM.style.left = '200px'
      }
      this.foldText = this.foldText === '<' ? '>' : '<'
      this.tooltipContent = this.foldText === '<' ? '收起侧边栏' : '展开侧边栏'
    },
  },
  created() {
    axios
      .get('https://ipapi.co/json/')
      .then((res) => {
        console.log(res.data)
        let { ip, version } = res.data
        // 创建Address6对象
        const address6 = new Address6(ip)
        ip = version === 'IPv6' ? address6.to4().address : ip
        this.$message({
          message: `欢迎您访问本网站！当前访问IP地址：${ip} `,
          type: 'success'
        })
      })
      .catch((error) => {
        console.log(error)
        this.$message({
          message: `欢迎您访问本网站！`,
          type: 'success'
        })
      })
    if (document.querySelector('.el-notification')) {
      document.querySelector('.el-notification').style.display = 'none'
    }
  }
}
</script>

<style lang="less" scoped>
.home-container {
  height: 100%;
}

.el-header {
  background-color: #373d41;
  display: flex;
  justify-content: space-between;
  padding-left: 0;
  align-items: center;
  color: #fff;
  font-size: 20px;

  > div {
    display: flex;
    align-items: center;

    h3 {
      margin-left: 10px;
    }
  }
}

.el-aside {
  background-color: #333744;

  .el-menu {
    border-right: none;
  }
}

.el-main {
  background-color: #eaedf1;
  position: absolute;
  left: 200px;
  right: 0;
  top: 60px;
  bottom: 0;
}
.aside-fold {
  position: absolute;
  top: 50%;
  left: 200px;
  z-index: 999;
  width: 30px;
  height: 60px;
  text-align: center;
  line-height: 60px;
  cursor: pointer;
  border-radius: 0 50% 50% 0;
  font-weight: 700;
  font-size: 20px;
  color: #fff;
  background: #333744;
  border: 1px solid #333744;
  user-select: none;
}
.aside-fold:hover {
  background: blueviolet;
}

.el-footer {
  background-color: #373d41;
  line-height: 20px;
  position: absolute;
  left: 200px;
  right: 0;
  bottom: 0;

  div {
    color: #fff;
    font-size: 12px;
    text-align: center;
  }
}

.iconfont {
  margin-right: 10px;
}

.toggle-button {
  background-color: #4a5064;
  font-size: 10px;
  line-height: 24px;
  color: #fff;
  text-align: center;
  letter-spacing: 0.2em;
  cursor: pointer;
}

.animated-icon {
  margin: 0px 7px;
  animation: iconAnimate 1.35s ease-in-out infinite;
}

@keyframes iconAnimate {
  0%,
  100% {
    transform: scale(1);
  }
  10%,
  30% {
    transform: scale(0.9);
  }
  20%,
  40%,
  50%,
  60%,
  70%,
  80% {
    transform: scale(1.1);
  }
}

.webLogo {
  margin-left: 10px;
  border-radius: 50%;
  cursor: pointer;
  width: 50px;
  height: 50px;
}

@keyframes logoAnimation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.webLogo:hover {
  animation: logoAnimation 1.5s linear infinite;
}

.button--bird {
  --main_color: #f4cf47;
  --sub_color1: #f4e19c;
  --sub_color2: #ff8108;
  --base_color: #000;
  --border_radius1: 60px 60px 40px 40px / 48px 48px 30px 30px;
  --border_radius2: 70px 70px 40px 40px / 48px 48px 30px 30px;
  --border_radius3: 40px 40px 40px 40px / 48px 48px 30px 30px;
}
.button {
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  width: 200px;
  height: 30px;
  text-decoration: none;
  border: solid 3px #000;
  border-radius: 40px;
  background: var(--main_color);
  position: relative;
  margin-top: 100%;
}

.button__wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 186%;
  border-radius: 40px;
  overflow: hidden;
  position: relative;
}
.button__text {
  position: relative;
  font-size: 18px;
  letter-spacing: 4px;
  color: var(--base_color);
  transition: all 0.3s ease;
}

.button::before {
  content: '';
  position: absolute;
  right: 20px;
  margin: auto 0;
  width: 24px;
  height: 24px;
  background: var(--base_color);
  clip-path: path(
    'M24,12.02c0-1.09-.75-1.71-.81-1.77L11.17,.45c-.91-.74-2.21-.56-2.91,.42-.69,.97-.52,2.37,.39,3.11l7.12,5.81-13.7-.02h0C.93,9.77,0,10.76,0,11.99c0,1.23,.93,2.22,2.07,2.22l13.7,.02-7.13,5.78c-.91,.74-1.09,2.13-.4,3.11,.41,.58,1.03,.88,1.65,.88,.44,0,.88-.15,1.25-.45l12.04-9.76c.07-.06,.82-.67,.82-1.77Z'
  );
  transition: all ease 0.2s;
}
.button--bird .button__wrapper::before,
.button--bird .button__wrapper::after {
  content: '';
  position: absolute;
  bottom: 0;
  width: 130px;
  height: 38px;
  background: var(--sub_color1);
  transition: all 0.5s ease;
  clip-path: path(
    'M13.77,37.35L.25,16.6c-.87-1.33,.69-2.91,2-2.02l12.67,8.59c.81,.55,1.91,.14,2.18-.81l2.62-9.33c.39-1.4,2.34-1.42,2.76-.02l3.6,11.99c.33,1.11,1.74,1.4,2.47,.52L49.38,.52c.87-1.04,2.53-.42,2.53,.95V23.7c0,1.13,1.2,1.83,2.16,1.26l12.75-7.51c.85-.5,1.94,0,2.13,.98l1.5,7.6c.2,1.03,1.37,1.51,2.22,.92l17.74-12.3c1.09-.75,2.52,.25,2.21,1.55l-2.44,10.2c-.26,1.09,.74,2.06,1.8,1.75l30.8-9.04c1.37-.4,2.42,1.26,1.49,2.36l-9.07,10.66c-.83,.98-.1,2.49,1.17,2.42l12.12-.68c1.6-.09,2.12,2.15,.65,2.8l-2.73,1.21c-.18,.08-.38,.12-.58,.12H14.97c-.48,0-.93-.25-1.2-.65Z'
  );
}
.button--bird .button__wrapper::before {
  left: 0;
}
.button--bird .button__wrapper::after {
  right: 0;
  transform: rotateY(180deg);
}

.button:hover .button__wrapper::before {
  transform: translateX(-12px);
}
.button:hover .button__wrapper::after {
  transform: rotateY(180deg) translateX(-12px);
}
.button:hover .button__text {
  letter-spacing: 6px;
}
.button:hover::before {
  right: 14px;
}

.birdBox {
  position: absolute;
  top: -54px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  width: 180px;
  height: 56px;
}

.bird {
  position: relative;
  width: 56px;
  height: 36px;
  box-sizing: border-box;
  border: solid 3px #000;
  background: var(--main_color);
  border-radius: var(--border_radius1);
  animation: sleep 1s ease infinite alternate;
  display: flex;
  justify-content: center;
}
.bird__face {
  position: absolute;
  top: 15px;
  width: 12px;
  height: 6px;
  background: var(--sub_color2);
  border-radius: 50% 50% 50% 50% / 78% 78% 22% 22%;
  transition: 0.2s;
}
.bird__face::before,
.bird__face::after {
  content: '';
  position: absolute;
  top: -4px;
  width: 8px;
  height: 2px;
  border-radius: 4px;
  background: #000;
}
.bird__face::before {
  left: -5px;
}
.bird__face::after {
  right: -5px;
}
.bird::before {
  content: '';
  position: absolute;
  top: -12px;
  left: 22px;
  width: 12px;
  height: 12px;
  background: #000;
  clip-path: path(
    'M10.23,3.32c-3.54,.63-5.72,2.51-7.02,4.23-.33-1.58-.34-3.54,.93-5.12,.52-.65,.41-1.59-.24-2.11C3.24-.19,2.29-.08,1.77,.57c-3.82,4.77-.31,11.11-.13,11.42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0-.01-.02,2.49,.04,2.52,0,.1-.14,1.54-4.82,6.59-5.71,.82-.14,1.37-.92,1.22-1.74s-.94-1.36-1.75-1.21Z'
  );
}
.button:hover .wakeup {
  animation: wakeup 0.2s ease;
  animation-fill-mode: forwards;
}
.button:hover .wakeup .bird__face {
  top: 20px;
}
.button:hover .wakeup .bird__face::before,
.button:hover .wakeup .bird__face::after {
  animation: eye 5s linear infinite;
}

.button:hover .wakeup:nth-child(2) .bird__face::before,
.button:hover .wakeup:nth-child(2) .bird__face::after {
  animation: eye_2 5s linear infinite;
}

@keyframes wakeup {
  0% {
    height: 26px;
    border-radius: var(--border_radius2);
  }
  100% {
    height: 40px;
    border-radius: var(--border_radius3);
  }
}

@keyframes eye {
  0% {
    top: -6px;
    width: 6px;
    height: 6px;
  }
  30% {
    top: -6px;
    width: 6px;
    height: 6px;
  }
  32% {
    top: -4px;
    width: 8px;
    height: 2px;
  }
  34% {
    top: -6px;
    width: 6px;
    height: 6px;
  }
  70% {
    top: -6px;
    width: 6px;
    height: 6px;
  }
  72% {
    top: -4px;
    width: 8px;
    height: 2px;
  }
  74% {
    top: -6px;
    width: 6px;
    height: 6px;
  }
  76% {
    top: -4px;
    width: 8px;
    height: 2px;
  }
  78% {
    top: -6px;
    width: 6px;
    height: 6px;
  }
  100% {
    top: -6px;
    width: 6px;
    height: 6px;
  }
}

@keyframes eye_2 {
  0% {
    top: -6px;
    width: 6px;
    height: 6px;
  }
  10% {
    transform: translateX(0);
  }
  12% {
    transform: translateX(3px);
  }
  20% {
    top: -6px;
    width: 6px;
    height: 6px;
  }
  22% {
    top: -4px;
    width: 8px;
    height: 2px;
  }
  24% {
    top: -6px;
    width: 6px;
    height: 6px;
  }
  25% {
    transform: translateX(3px);
  }
  27% {
    transform: translateX(0);
  }
  74% {
    top: -6px;
    width: 6px;
    height: 6px;
    transform: translateX(0);
  }
  76% {
    top: -4px;
    width: 8px;
    height: 2px;
    transform: translateX(3px);
  }
  78% {
    top: -6px;
    width: 6px;
    height: 6px;
  }
  80% {
    top: -4px;
    width: 8px;
    height: 2px;
  }
  82% {
    top: -6px;
    width: 6px;
    height: 6px;
  }
  85% {
    transform: translateX(3px);
  }
  87% {
    transform: translateX(0);
  }
  100% {
    top: -6px;
    width: 6px;
    height: 6px;
    transform: translateX(0);
  }
}
@keyframes sleep {
  0% {
    height: 36px;
    border-radius: var(--border_radius1);
  }
  100% {
    height: 32px;
    border-radius: var(--border_radius2);
  }
}
</style>
