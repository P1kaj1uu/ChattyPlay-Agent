<template>
  <div id="app">
    <!-- 路由占位符 -->
    <router-view></router-view>
  </div>
</template>

<script>
import axios from 'axios'
import { mapMutations } from 'vuex'
import { sleep } from '@/utils/sleep'

export default {
  name: 'App',
  methods: {
    ...mapMutations('funAi', ['setToken', 'setUserId']),
  },
  created() {
    axios({
      url: '/api/user/login',
      method: 'POST',
      data: {
        'loginAcct': 'FunAi',
        'loginType': 2,
        'password': '*****',
      }
    }).then(res => {
      const { token, userId } = res.data.data
      this.setToken(token)
      this.setUserId(userId)
    }).catch(error => {
      console.log(error)
    })

    document.addEventListener('contextmenu', function (e) {
      e.preventDefault()
    })

    console.info(
      "%c欢迎您访问不见水星记的网站，预祝使用愉快！\n\n%c       _oo0oo_\n      o8888888o\n      88\" . \"88\n      (| -_- |)\n      0\\  =  /0\n    ___/‘---’\\___\n  .' \\\\|     |// '.\n / \\\\|||  :  |||// \\\n/ _||||| -:- |||||- \\\n|   | \\\\\\  -  /// |   |\n| \\_|  ''\\---/''  |_/ |\n \\  .-\\__  '-'  ___/-. /\n'-.____'-.____\\<><>/.____.-'\n       '=---='\n\n   佛祖保佑，永无bug！",
      "font-family: 'Microsoft YaHei'; font-size: 24px; color: #00BFFF; text-shadow: 1px 1px #D3D3D3;",
      'font-size: 18px;color: green;'
    )

    ;(function () {
      sleep(210).then(() => {
        if (localStorage.getItem('WEBS_VERSION') !== 'V3.0.0') {
          const res = confirm(
            '系统消息：hi~您好，欢迎访问不见水星记的网站！我的网站有新版本发布哦，是否更新？'
          )
          if (res) {
            localStorage.setItem('WEBS_VERSION', 'V3.0.0')
            location.reload()
          }
        }
      })
    })()

    // 核心价值！
    ;(function () {
      var a_idx = 0
      window.onclick = function (event) {
        var a = new Array(
          '富强',
          '民主',
          '文明',
          '和谐',
          '自由',
          '平等',
          '公正',
          '法治',
          '爱国',
          '敬业',
          '诚信',
          '友善'
        )

        // 创建b元素
        var heart = document.createElement('b')
        // 防止拖动
        heart.onselectstart = new Function('event.returnValue = false')
        // 将b元素添加到页面上
        document.body.appendChild(heart).innerHTML = a[a_idx]
        a_idx = (a_idx + 1) % a.length
        // 给p元素设置样式
        heart.style.cssText = 'position: fixed; left: -100%;'

        var f = 16, // 字体大小
          x = event.clientX - f / 2, // 横坐标
          y = event.clientY - f, // 纵坐标
          c = randomColor(), // 随机颜色
          a = 1, // 透明度
          s = 1.2 // 放大缩小

        var timer = setInterval(function () {
          //添加定时器
          if (a <= 0) {
            document.body.removeChild(heart)
            clearInterval(timer)
          } else {
            heart.style.cssText =
              'font-size: 16px; cursor: default; position: fixed; color:' +
              c +
              '; left:' +
              x +
              'px; top:' +
              y +
              'px; opacity:' +
              a +
              '; transform:scale(' +
              s +
              ');'

            y--
            a -= 0.016
            s += 0.002
          }
        }, 15)
      }
      // 随机颜色
      function randomColor() {
        return (
          'rgb(' +
          ~~(Math.random() * 255) +
          ',' +
          ~~(Math.random() * 255) +
          ',' +
          ~~(Math.random() * 255) +
          ')'
        )
      }
    })()
  }
}
</script>

<style lang="less" scoped></style>
