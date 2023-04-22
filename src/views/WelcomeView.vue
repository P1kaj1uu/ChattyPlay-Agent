<!-- 
    * @Description: 欢迎页面
    * @Author: 不见水星记（P1kaj1uu）  
-->
<template>
  <div>
    <!-- 面包屑导航区域 -->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item>首页</el-breadcrumb-item>
      <el-breadcrumb-item>欢迎</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="wrap">
      <!-- 播放器主体区域 -->
      <div class="play_wrap" id="player" v-cloak>
        <div class="search_bar">
          <img src="@/assets/images/welcome/player_title.png" alt="" />
          <div style="font-size: 20px; font-weight: 600;">水星听月-乐携月</div>
          <!-- 搜索歌曲 -->
          <input
            type="text"
            autocomplete="off"
            v-model="query"
            placeholder="请输入歌曲名或歌手名（回车Enter键搜索）"
            @keyup.enter="searchMusic"
          />
        </div>
        <div class="center_con">
          <!-- 搜索歌曲列表 -->
          <div class="song_wrapper">
            <ul class="song_list">
              <li v-for="item in musicList">
                <a href="javascript:;" @click="playMusic(item.id)"></a>
                <b v-cloak :class="[item.id === ids ? 'activeName' : '']">{{ item.name }}</b>
                <span v-if="item.mvid != 0" @click="playMV(item.mvid)"
                  ><i></i
                ></span>
              </li>
            </ul>
            <img
              src="@/assets/images/welcome/line.png"
              class="switch_btn"
              alt=""
            />
          </div>
          <!-- 歌曲信息容器 -->
          <div class="player_con" :class="{ playing: isPlaying }">
            <img
              src="@/assets/images/welcome/player_bar.png"
              class="play_bar"
            />
            <!-- 黑胶碟片 -->
            <img
              src="@/assets/images/welcome/disc.png"
              class="disc autoRotate"
            />
            <img :src="musicCover" class="cover autoRotate" />
          </div>
          <!-- 评论容器 -->
          <div class="comment_wrapper">
            <h5 class="title">热门留言</h5>
            <div class="comment_list">
                <dl v-for="item in hotComments">
                <dt><img :src="item.user.avatarUrl" alt="" /></dt>
                <dd class="name" v-cloak>{{ item.user.nickname }}</dd>
                <dd class="detail" v-cloak>
                  {{ item.content }}
                </dd>
              </dl>
            </div>
            <img src="@/assets/images/welcome/line.png" class="right_line" />
          </div>
        </div>
        <div class="audio_con">
          <audio
            ref="audio"
            @play="play"
            @pause="pause"
            :src="musicUrl"
            controls
            autoplay
            loop
            class="myaudio"
          ></audio>
        </div>
        <div class="video_con" v-show="isShow" style="display: none">
          <video :src="mvUrl" controls="controls"></video>
          <div class="mask" @click="hide"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'WelcomeView',
  data() {
    return {
      // 查询关键字
      query: '',
      // 歌曲数组
      musicList: [],
      // 歌曲地址
      musicUrl: '',
      // 歌曲封面
      musicCover: '',
      // 歌曲评论
      hotComments: [],
      // 动画播放状态
      isPlaying: false,
      // 遮罩层的显示状态
      isShow: false,
      // mv地址
      mvUrl: '',
      ids: '',
    }
  },
  methods: {
    // 歌曲搜索
    searchMusic: function () {
      var that = this
      axios.get('https://autumnfish.cn/search?keywords=' + this.query).then(
        function (response) {
          console.log(response)
          if (JSON.stringify(response.data.result).length === 2) {
            that.$message('当前搜索结果为空，请换一个想听的歌曲或歌手，谢谢！')
          } else {
            that.musicList = response.data.result.songs
          }
        },
        function (err) {}
      ).catch(error => {
        that.$message('接口出错啦，请刷新页面重试！')
      })
    },
    // 歌曲播放
    playMusic: function (musicId) {
      var that = this
      that.ids = musicId
      // 获取歌曲地址
      axios.get('https://autumnfish.cn/song/url?id=' + musicId).then(
        function (response) {
          console.log(response.data.data[0].url)
          that.musicUrl = response.data.data[0].url
        },
        function (err) {}
      ).catch(error => {
        that.$message('接口出错啦，请刷新页面重试！')
      })

      // 歌曲详情获取
      axios.get('https://autumnfish.cn/song/detail?ids=' + musicId).then(
        function (response) {
          console.log(response.data.songs[0].al.picUrl)
          that.musicCover = response.data.songs[0].al.picUrl
        },
        function (err) {}
      ).catch(error => {
        that.$message('接口出错啦，请刷新页面重试！')
      })

      // 歌曲评论获取
      axios.get('https://autumnfish.cn/comment/hot?type=0&id=' + musicId).then(
        function (response) {
          console.log(response)
          that.hotComments = response.data.hotComments
        },
        function (err) {}
      ).catch(error => {
        that.$message('接口出错啦，请刷新页面重试！')
      })
    },
    // 歌曲播放
    play: function () {
      this.isPlaying = true
    },
    // 歌曲暂停
    pause: function () {
      this.isPlaying = false
    },
    // 播放mv
    playMV: function (mvid) {
      var that = this
      axios.get('https://autumnfish.cn/mv/url?id=' + mvid).then(
        function (response) {
          console.log(response.data.data.url)
          that.isShow = true
          that.mvUrl = response.data.data.url
        },
        function (err) {}
      ).catch(error => {
        that.$message('接口出错啦，请刷新页面重试！')
      })
    },
    // 隐藏遮盖层
    hide: function () {
      this.mvUrl = ''
      this.isShow = false
    }
  },
  created() {
    if (document.querySelector('.el-notification')) {
      document.querySelector('.el-notification').style.display = 'none'
    }
  }
}
</script>

<style lang="less" scoped>

.play_wrap {
  width: 800px;
  height: 544px;
  position: fixed;
  left: 50%;
  top: 50%;
  margin-left: -320px;
  margin-top: -272px;
}

.search_bar {
  height: 60px;
  background-color: #1eacda;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 11;
}

.search_bar img {
  margin-left: 23px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.search_bar input {
  margin-right: 23px;
  width: 296px;
  height: 34px;
  border-radius: 17px;
  border: 0px;
  background: url('@/assets/images/welcome/zoom.png') 265px center no-repeat
    rgba(255, 255, 255, 0.45);
  text-indent: 15px;
  outline: none;
}

.center_con {
  height: 435px;
  background-color: rgba(255, 255, 255, 0.5);
  display: flex;
  position: relative;
}

.song_wrapper {
  width: 200px;
  height: 435px;
  box-sizing: border-box;
  padding: 10px;
  list-style: none;
  position: absolute;
  left: 0px;
  top: 0px;
  z-index: 1;
}

.song_stretch {
  width: 600px;
}

.song_list {
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
}
.song_list::-webkit-scrollbar {
  display: none;
}

.song_list li {
  font-size: 12px;
  color: #333;
  height: 40px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 580px;
  padding-left: 10px;
}

.song_list li:nth-child(odd) {
  background-color: rgba(240, 240, 240, 0.3);
}

.song_list li a {
  display: block;
  width: 17px;
  height: 17px;
  background-image: url('@/assets/images/welcome/play.png');
  background-size: 100%;
  margin-right: 5px;
  box-sizing: border-box;
}

.song_list li b {
  font-weight: normal;
  width: 122px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song_stretch .song_list li b {
  width: 200px;
}

.song_stretch .song_list li em {
  width: 150px;
}

.song_list li span {
  width: 23px;
  height: 17px;
  margin-right: 50px;
}
.song_list li span i {
  display: block;
  width: 100%;
  height: 100%;
  cursor: pointer;
  background: url('@/assets/images/welcome/table.png') left -48px no-repeat;
}

.song_list li em,
.song_list li i {
  font-style: normal;
  width: 100px;
}

.player_con {
  width: 400px;
  height: 435px;
  position: absolute;
  left: 200px;
  top: 0px;
}

.player_con2 {
  width: 400px;
  height: 435px;
  position: absolute;
  left: 200px;
  top: 0px;
}

.player_con2 video {
  position: absolute;
  left: 20px;
  top: 30px;
  width: 355px;
  height: 265px;
}

.disc {
  position: absolute;
  left: 73px;
  top: 60px;
  z-index: 9;
}
.cover {
  position: absolute;
  left: 125px;
  top: 112px;
  width: 150px;
  height: 150px;
  border-radius: 75px;
  z-index: 8;
}
.comment_wrapper {
  width: 180px;
  height: 435px;
  list-style: none;
  position: absolute;
  left: 600px;
  top: 0px;
  padding: 25px 10px;
}
.comment_wrapper .title {
  position: absolute;
  top: 0;
  margin-top: 10px;
}
.comment_wrapper .comment_list {
  overflow: auto;
  height: 410px;
}
.comment_wrapper .comment_list::-webkit-scrollbar {
  display: none;
}
.comment_wrapper dl {
  padding-top: 10px;
  padding-left: 55px;
  position: relative;
  margin-bottom: 20px;
}

.comment_wrapper dt {
  position: absolute;
  left: 4px;
  top: 10px;
}

.comment_wrapper dt img {
  width: 40px;
  height: 40px;
  border-radius: 20px;
}

.comment_wrapper dd {
  font-size: 12px;
}

.comment_wrapper .name {
  font-weight: bold;
  color: #333;
  padding-top: 5px;
}

.comment_wrapper .detail {
  color: #666;
  margin-top: 5px;
  line-height: 18px;
}
.audio_con {
  height: 50px;
  background-color: #f1f3f4;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}
.myaudio {
  width: 800px;
  height: 40px;
  margin-top: 5px;
  outline: none;
  background-color: #f1f3f4;
}
/* 旋转的动画 */
@keyframes Rotate {
  from {
    transform: rotateZ(0);
  }
  to {
    transform: rotateZ(360deg);
  }
}
/* 旋转的类名 */
.autoRotate {
  animation-name: Rotate;
  animation-iteration-count: infinite;
  animation-play-state: paused;
  animation-timing-function: linear;
  animation-duration: 5s;
}
/* 是否正在播放 */
.player_con.playing .disc,
.player_con.playing .cover {
  animation-play-state: running;
}

.play_bar {
  position: absolute;
  left: 200px;
  top: -10px;
  z-index: 10;
  transform: rotate(-25deg);
  transform-origin: 12px 12px;
  transition: 1s;
}
/* 播放杆 转回去 */
.player_con.playing .play_bar {
  transform: rotate(0);
}
/* 搜索历史列表 */
.search_history {
  position: absolute;
  width: 296px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.3);
  list-style: none;
  right: 23px;
  top: 50px;
  box-sizing: border-box;
  padding: 10px 20px;
  border-radius: 17px;
}
.search_history li {
  line-height: 24px;
  font-size: 12px;
  cursor: pointer;
}
.switch_btn {
  position: absolute;
  right: 0;
  top: 0;
  cursor: pointer;
}
.right_line {
  position: absolute;
  left: 0;
  top: 0;
}
.video_con video {
  position: fixed;
  width: 800px;
  height: 546px;
  left: 50%;
  top: 50%;
  margin-top: -273px;
  transform: translateX(-50%);
  z-index: 990;
}
.video_con .mask {
  position: fixed;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  z-index: 980;
  background-color: rgba(0, 0, 0, 0.8);
}
.video_con .shutoff {
  position: fixed;
  width: 40px;
  height: 40px;
  background: url('@/assets/images/welcome/shutoff.png') no-repeat;
  left: 50%;
  margin-left: 400px;
  margin-top: -273px;
  top: 50%;
  z-index: 995;
}

.activeName {
  color: red;
  font-size: 15px;
  font-weight: 600;
}
</style>
