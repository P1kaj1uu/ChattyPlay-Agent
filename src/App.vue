<template>
  <div id="app">
    <!-- 路由占位符 -->
    <router-view></router-view>
  </div>
</template>

<script>
import { Heart } from '@/utils/model';

export default {
  name: 'App',
  created () {
    (function () {
      // 在不刷新页面的情况下，只执行一次爱心跳动效果
      // 加载爱心跳动效果
      setTimeout(async () => {
        let main = document.querySelector('.el-main')
        console.log(
          main.clientWidth,
          main.clientHeight,
          main.getBoundingClientRect().left,
          main.getBoundingClientRect().top
        )
        await Heart()
        // 伪数组
        let ele = document.querySelectorAll('body canvas')
        Array.from(ele).forEach((item) => {
          console.log(item.id)
          if (item.id !== 'canvas_sakura') {
            item.style.position = 'absolute'
            // 全屏显示
            item.style.top = 0
            item.style.left = 0
            item.style.zIndex = 1
            // 动态添加类名，方便后面移除
            item.classList.add('model')
          }
        })
      }, 2800)
      // 移除爱心跳动效果
      setTimeout(() => {
        let eles = document.querySelectorAll('body .model')
        Array.from(eles).forEach((item) => {
          console.log(item.className)
          if (item.className === 'model') {
            item.style.display = 'none'
          }
        })
      }, 7800)
    })();
    
    // 核心价值！
    (function () {
      var a_idx = 0
      window.onclick = function (event) {
        var a = new Array("富强", "民主", "文明", "和谐", "自由", "平等", "公正", "法治", "爱国",
          "敬业", "诚信", "友善");

        // 创建b元素
        var heart = document.createElement("b")
        // 防止拖动
        heart.onselectstart = new Function('event.returnValue = false')
        // 将b元素添加到页面上
        document.body.appendChild(heart).innerHTML = a[a_idx]
        a_idx = (a_idx + 1) % a.length
        // 给p元素设置样式
        heart.style.cssText = "position: fixed; left: -100%;"

        var f = 16, // 字体大小
          x = event.clientX - f / 2, // 横坐标
          y = event.clientY - f, // 纵坐标
          c = randomColor(), // 随机颜色
          a = 1, // 透明度
          s = 1.2 // 放大缩小

        var timer = setInterval(function () { //添加定时器
          if (a <= 0) {
            document.body.removeChild(heart)
            clearInterval(timer)
          } else {
            heart.style.cssText = "font-size: 16px; cursor: default; position: fixed; color:" +
              c + "; left:" + x + "px; top:" + y + "px; opacity:" + a + "; transform:scale(" +
              s + ");"

            y--
            a -= 0.016
            s += 0.002
          }
        }, 15)

      }
      // 随机颜色
      function randomColor() {
        return "rgb(" + (~~(Math.random() * 255)) + "," + (~~(Math.random() * 255)) + "," + (~~(Math.random() * 255)) + ")"
      }
    }())
  }
}
</script>

<style lang="less" scoped>
.hljs {
  padding: 10px;
}
</style>
