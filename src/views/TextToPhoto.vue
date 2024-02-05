<!-- 
    * @Description: 文生图页面
    * @Author: 不见水星记（P1kaj1uu）  
-->
<template>
  <div class="TextToPhoto-Container">
    <!-- 面包屑导航区域 -->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item>首页</el-breadcrumb-item>
      <el-breadcrumb-item>文生图</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="card-list">
      <el-card class="box-card">
        <div slot="header" class="card-title clearfix">
          <span>注意事项🎓</span>
        </div>
        <div v-for="(item, index) in noticeList" :key="index" class="text item">
          {{ item }}
        </div>
      </el-card>
      <el-card class="box-card">
        <div slot="header" class="card-title clearfix">
          <span>调教指南👩‍💻</span>
        </div>
        <div v-for="(item, index) in guideList" :key="index" class="text item">
          {{ item }}
        </div>
      </el-card>
    </div>

    <div class="card-list-generate">
      <el-card class="box-card-preview">
        <div slot="header" class="card-title clearfix">
          <span>图片预览</span>
        </div>
        <div class="text item">
          <el-image
            style="width: 150px; height: 150px; border: 1px solid black"
            :src="url"
            :preview-src-list="srcList"
          >
          </el-image>
        </div>
      </el-card>
      <el-card class="box-card-text">
        <div slot="header" class="card-title clearfix">
          <span>AI绘画 - 文生图</span>
        </div>
        <div class="text item ai-box">
          <div class="ai-option">
            <div class="ai-option-item ai-option-style">
              <div>图片风格：</div>
              <el-select
                v-model="photoStyleValue"
                size="small"
                clearable
                placeholder="请选择图片风格"
              >
                <el-option
                  v-for="item in photoStyleList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </div>
            <div class="ai-option-item">
              <div>图片宽度(范围为256-512之间)：</div>
              <el-slider
                v-model="photoWidth"
                :min="256"
                :max="512"
                show-input
              >
              </el-slider>
            </div>
            <div class="ai-option-item">
              <div>图片高度(范围为256-512之间)：</div>
              <el-slider
                v-model="photoHeight"
                :min="256"
                :max="512"
                show-input
              >
              </el-slider>
            </div>
          </div>
          <el-input
            type="textarea"
            placeholder="在此输入您想生成图片的提示词，同时希望您在生成图片前花1分钟查阅上面的注意事项和调教指南~"
            v-model="textToImgVal"
          >
          </el-input>
        </div>
      </el-card>
    </div>

    <el-card class="btn-list">
      <el-button @click="photoGenerate" type="primary" round
        >开始生成图片</el-button
      >
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
import { mapState } from 'vuex'

export default {
  name: 'TextToPhoto',
  data() {
    return {
      textToImgVal: '',
      // 注意事项
      noticeList: [
        '1.禁止生成色情、暴力、血腥等不良图片，以及其他可能会引起社会不良影响的内容。',
        '2.使用者对使用模型的任何行为和生成的图片负全部责任。',
        '3.【点击图片】可以放大和下载。',
        '4.本功能仍然在测试，若生成【全黑图】，请重新生成或者修改图片描述。另外，本网站暂时不保存图片，在点击`生成图片`前用户需要手动保存图片。',
        '5.生成人物的效果较差（特别是画手和脚，有点恐怖！）~勿喷。'
      ],
      // 调教指南
      guideList: [
        '🎈目前【普通描述模式】已经支持任何语言描述。当然，如果你想生成的效果更好，建议用英文。',
        '🎈尽可能让你的描述内容更加详细。',
        '🎈一些有意思的实例：【阳光洒在长发女生的身上，双眼深邃望着前方，画面整体暖色调】【黑色跑车行驶在街道上，天空闪过一道黄色闪电】【暗黑风格的未来街道】'
      ],
      url: 'https://pic.baike.soso.com/p/20140611/20140611145529-1600143101.jpg',
      srcList: [
        'https://pic.baike.soso.com/p/20140611/20140611145529-1600143101.jpg'
      ],
      photoStyleValue: 'realism',
      photoStyleList: [
        {
          value: 'realism',
          label: '写实'
        },
        {
          value: 'Ultra clear photograph',
          label: '照片'
        },
        {
          value: 'ancient customs',
          label: '古风'
        },
        {
          value: 'oil painting',
          label: '油画'
        },
        {
          value: 'watercolor painting',
          label: '水彩画'
        },
        {
          value: 'ink painting',
          label: '油墨画'
        },
        {
          value: 'black and white painting',
          label: '黑白画'
        },
        {
          value: '3D',
          label: '3D'
        },
        {
          value: 'free-hand sketch',
          label: '手绘草图'
        },
        {
          value: 'charcoal painting',
          label: '炭笔画'
        },
        {
          value: 'minimalist line drawing',
          label: '极简线条画'
        },
        {
          value: 'ukiyoe',
          label: '浮世绘'
        },
        {
          value: 'medieval style painting',
          label: '中世纪风'
        },
        {
          value: 'paper-cut art',
          label: '剪纸艺术'
        },
        {
          value: 'film texture style',
          label: '电影质感'
        },
        {
          value: 'mechanical style',
          label: '机械风'
        },
        {
          value: 'hi-tech style',
          label: '科技风'
        },
        {
          value: 'anime CG',
          label: '二次元CG'
        },
        {
          value: 'thick coated CG',
          label: '厚涂CG'
        },
        {
          value: 'aestheticism CG',
          label: '唯美CG'
        },
        {
          value: 'Chinese style',
          label: '中国风'
        },
        {
          value: 'Korean style',
          label: '韩式风'
        },
        {
          value: 'Japanese style',
          label: '日本风'
        },
        {
          value: ',American style',
          label: '美国风'
        },
      ],
      photoWidth: 512,
      photoHeight: 512,
      sampler: ['DPM++ 2M Karras', 'Euler a'][Math.floor(Math.random() * 2)], // 图片生成器
      lora: ['<lora:koreanDollLikeness_v15:1>', '<lora:GuoFeng3.2_Lora_light:1>', '<lora:taiwanDollLikeness_v10:1>'][Math.floor(Math.random() * 3)] // 插件选择
    }
  },
  computed: {
    ...mapState('funAi', ['token', 'userId'])
  },
  methods: {
    photoGenerateRequest() {
      const loading = this.$loading({
        lock: true,
        text: '正在拼命生成图片中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      axios({
        url: '/api/img/text2Img/SD/base64',
        method: 'POST',
        headers: {
          token: this.token
        },
        data: {
          cfg_scale: Math.floor(Math.random() * 15) + 1,
          height: this.photoHeight,
          width: this.photoWidth,
          img_style: this.photoStyleValue,
          lora_style: this.lora,
          prompt: this.textToImgVal.trim(),
          sampler_index: this.sampler,
          sampler_name: this.sampler,
          seed: Math.floor(Math.random() * 100000) + 1,
          steps: Math.floor(Math.random() * 11) + 20,
          user_id: this.userId
        }
      })
        .then((res) => {
          if (res.data.code === 30002) {
            this.$message.warning('当日AI绘画次数已达到上限，请明日再试~')
            return
          }
          if (res.data.code === 20001) {
            this.$message.warning(res.data.message)
            return
          }
          if (res.data.code === 20000) {
            console.log(res.data.data.base64Img)
            this.url = res.data.data.base64Img
            this.srcList = [this.url]
            this.$message.success('文生图生成成功')
          }
        })
        .catch((error) => {
          console.log(error)
        })
        .finally(() => {
          loading.close()
        })
    },
    photoGenerate() {
      if (!this.textToImgVal.trim().length) {
        this.$message.warning('文生图提示词不能为空哦~')
        this.textToImgVal = ''
        return
      }
      this.photoGenerateRequest()
    }
  }
}
</script>

<style lang="less" scoped>
/deep/ .el-textarea {
  flex: 7;
  padding: 0 20px;
}
/deep/ .el-textarea__inner {
  height: 150px;
  resize: none;
}
.card-list {
  display: flex;
  justify-content: center;
  .card-title {
    font-size: 16px;
  }
  .text {
    font-size: 13px;
  }
}

.card-list-generate {
  display: flex;
  justify-content: center;
  .card-title {
    font-size: 16px;
  }
  .text {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 13px;
  }
  .box-card-preview {
    flex: 2;
  }
  .box-card-text {
    flex: 8;

    .ai-box {
      display: flex;
      justify-content: center;
      align-items: center;
      .ai-option {
        flex: 5;
        padding: 0 20px;
        border-right: 1px solid #eee;
        .ai-option-style {
          display: flex;
          align-items: center;
        }
        .ai-option-item {
          padding: 5px;
        }
      }
    }
  }
}
.btn-list {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0;
}
</style>
