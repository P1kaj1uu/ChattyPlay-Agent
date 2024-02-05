<!-- 
    * @Description: 查重页面
    * @Author: 不见水星记（P1kaj1uu）  
-->
<template>
  <div class="aboutContainer">
    <!-- 面包屑导航区域 -->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item>首页</el-breadcrumb-item>
      <el-breadcrumb-item>降重</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 卡片视图区域 -->
    <el-card>
      <el-row>
        <el-col class="typeBox">
          <div class="typeBoxLabel">请先选择降重方式：</div>
          <el-select
            v-model="transType"
            @change="changeType"
            placeholder="选择降重方式"
          >
            <el-option
              v-for="item in transTypeList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
          <div class="typeBoxText">
            <div v-if="this.transType === 'I 级'">
              {{ this.transTypeList[0].title }}
            </div>
            <div v-else-if="this.transType === 'II 级'">
              {{ this.transTypeList[1].title }}
            </div>
            <div v-else>{{ this.transTypeList[2].title }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <el-row>
        <el-col>
          <div class="transTitle">原文：</div>
          <el-input
            type="textarea"
            :autosize="{ minRows: 5, maxRows: 5 }"
            placeholder="请输入要降重的文本内容"
            v-model="transText"
          >
          </el-input>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <el-row>
        <el-col>
          <div class="transTitle">降重后：</div>
          <el-input
            id="transResInput"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 4 }"
            placeholder="此处将展示降重后的结果"
            v-model="transResText"
            readonly
          >
          </el-input>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <el-row>
        <el-col class="transBtn">
          <el-button type="primary" :disabled="flag" @click="handleSubmit" plain
            >提交原文降重</el-button
          >
          <el-button type="primary" @click="handleCopy" plain
            >一键复制结果</el-button
          >
        </el-col>
      </el-row>
    </el-card>

    <div class="loadEffect">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</template>

<script>
import md5 from 'js-md5'
import axios from 'axios'

export default {
  name: 'Trans',
  data() {
    return {
      flag: false,
      num: 0,
      // 降重方式
      transType: 'I 级',
      transTypeList: [
        {
          value: 0,
          label: 'I 级',
          title: '中文-英文-德文-中文',
          method: ['zh en', 'en de', 'de zh']
        },
        {
          value: 1,
          label: 'II 级',
          title: '中文-英文-日文-葡萄牙语-中文',
          method: ['zh en', 'en jp', 'jp pt', 'pt zh']
        },
        {
          value: 2,
          label: 'III 级',
          title:
            '中文-英文-日文-葡萄牙语-意大利语-波兰语-保加利亚语-爱沙尼亚-中文',
          method: [
            'zh en',
            'en jp',
            'jp pt',
            'pt it',
            'it pl',
            'pl bul',
            'bul est',
            'est zh'
          ]
        }
      ],
      // 降重前
      transText: '',
      // 降重后
      transResText: '',
      // 此处填入百度翻译的appid和密钥
      appid: '',
      password: ''
    }
  },
  methods: {
    changeType (value) {
      this.num = value
      this.transType = this.transTypeList[value].label
    },
    // 封装查询降重的方法
    async queryTrans () {
      let methodTypes = this.transTypeList[this.num].method
      for (let i = 0; i < methodTypes.length; i++) {
        let mode = methodTypes[i].split(' ')
        await axios.get('/trans/vip/translate', {
          params: {
            q: this.transText,
            from: mode[0],
            to: mode[1],
            appid: this.appid,
            salt: Date.now(),
            sign: md5(`${this.appid}${this.transText}${Date.now()}${this.password}`)
          }
        }).then(res => {
          this.transResText = res.data.trans_result[0].dst
          console.log(res)
        }).catch(error => {
          this.$message.error('降重失败，请稍后重试')
          console.error(error)
        }).finally(() => {
          this.flag = false
          document.querySelector('.loadEffect').style.display = 'none'
        })
      }
    },
    handleSubmit () {
      if (this.transText.trim().length === 0) {
        this.$message.warning('请先输入要降重的原文再提交')
        this.transText = ''
        return
      }
      if (this.transResText.length > 0) {
        this.transResText = ''
      }
      this.flag = true
      document.querySelector('.loadEffect').style.display = 'block'
      this.queryTrans()
    },
    handleCopy () {
      const input = document.getElementById('transResInput')
      input?.select()
      document.execCommand('copy')
      this.$message.success('复制成功')
    }
  }
}
</script>

<style lang="less" scoped>
.typeBox {
  display: flex;
  align-items: center;
  justify-content: center;

  .typeBoxLabel {
    font-size: 15px;
    font-weight: 600;
  }

  .typeBoxText {
    margin-left: 15px;
    font-size: 14px;
  }
}

.transTitle {
  margin-bottom: 5px;
  font-size: 15px;
  font-weight: 600;
}

.el-textarea :deep(textarea) {
  resize: none;
}

.transBtn {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
}

.loadEffect {
  display: none;
  width: 100px;
  height: 100px;
  left: 40%;
  top: 40%;
  position: absolute;
}
.loadEffect span {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: lightgreen;
  position: absolute;
  animation: load 1.04s ease infinite;
}
@keyframes load {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.2;
  }
}
.loadEffect span:nth-child(1) {
  left: 0;
  top: 50%;
  margin-top: -8px;
  animation-delay: 0.13s;
}
.loadEffect span:nth-child(2) {
  left: 14px;
  top: 14px;
  animation-delay: 0.26s;
}
.loadEffect span:nth-child(3) {
  left: 50%;
  top: 0;
  margin-left: -8px;
  animation-delay: 0.39s;
}
.loadEffect span:nth-child(4) {
  top: 14px;
  right: 14px;
  animation-delay: 0.52s;
}
.loadEffect span:nth-child(5) {
  right: 0;
  top: 50%;
  margin-top: -8px;
  animation-delay: 0.65s;
}
.loadEffect span:nth-child(6) {
  right: 14px;
  bottom: 14px;
  animation-delay: 0.78s;
}
.loadEffect span:nth-child(7) {
  bottom: 0;
  left: 50%;
  margin-left: -8px;
  animation-delay: 0.91s;
}
.loadEffect span:nth-child(8) {
  bottom: 14px;
  left: 14px;
  animation-delay: 1.04s;
}
</style>
