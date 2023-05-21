<!-- 
    * @Description: 关于页面
    * @Author: 不见水星记（P1kaj1uu）  
-->
<template>
  <div class="aboutContainer">
    <!-- 面包屑导航区域 -->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item>首页</el-breadcrumb-item>
      <el-breadcrumb-item>关于</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 卡片视图区域 -->
    <el-card>
      <el-row>
        <el-col>
          <div class="aboutMe">关于-声明</div>
          <h2>一、关于</h2>
          <ol>
            <li>1&nbsp;.&nbsp;计算机科学与技术专业正在美团前端实习的大四学生</li>
            <li>2&nbsp;.&nbsp;个人博客：https://cnblogs.com/P1kaj1uu</li>
            <li>3&nbsp;.&nbsp;项目地址：https://github.com/P1kaj1uu/VIP-Video-Parsing</li>
            <li>
              <div>4&nbsp;.&nbsp;附一张（我）宇宙终极无敌超级爆炸究极飞天帅比暴龙战士的照片</div>
              <img style="margin-top: 10px; width: 180px;" src="@/assets/images/about/me.jpg" alt="">
            </li>
          </ol>
          <h2 style="margin-top: 40px;">二、声明</h2>
          <ol>
            <li>1&nbsp;.&nbsp;该项目准备开源，已部署服务器。</li>
            <li>2&nbsp;.&nbsp;以后可能会尝试网站备案。</li>
            <li style="font-weight: 600;">3&nbsp;.&nbsp;本站只提供提供音乐、影视解析和ChatGPT服务，请勿用于任何商业用途。如有侵权，请联系我！</li>
            <li style="font-weight: 600;">4&nbsp;.&nbsp;请不要黑我服务器！！！</li>
            <li style="font-weight: 600;">5&nbsp;.&nbsp;请不要入侵我服务器！！！</li>
            <li style="font-weight: 600;">6&nbsp;.&nbsp;请不要拿我服务器挖矿！！！</li>
          </ol>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script>
export default {
  name: "AboutView",
  created() {
    if (document.querySelector('.el-notification')) {
      document.querySelector('.el-notification').style.display = 'none'
    }
  }
};
</script>

<style lang="less" scoped>
.aboutMe {
  text-align: center;
  font-weight: 700;
  font-size: 33px;
}
ol li {
  padding: 10px;
  margin-left: 10px;
  font-size: 18px;
}
h2 {
  font-size: 25px;
}
</style>