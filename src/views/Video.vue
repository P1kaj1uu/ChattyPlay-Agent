<!-- 
    * @Description: 观看页面
    * @Author: 不见水星记（P1kaj1uu）  
-->
<template>
	<div>
		<!-- 面包屑导航区域 -->
		<el-breadcrumb separator-class="el-icon-arrow-right">
			<el-breadcrumb-item>首页</el-breadcrumb-item>
			<el-breadcrumb-item>观看</el-breadcrumb-item>
		</el-breadcrumb>

		<div class="layui-container wrap">
			<div class="layui-row video-top">
				<div class="layui-input-inline layui-form">
					<select id="api" name="api">
						<option value="">请选择解析接口</option>
					</select>
				</div>
				<div class="layui-input-inline layui-show-sm-inline-block video-url">
					<input type="text" lay-verify="required|phone|number" class="layui-input url" name=""
						placeholder="输入视频地址" />
				</div>
				<button class="layui-btn layui-btn-normal play">立即播放</button>
			</div>

			<br />
			<fieldset class="layui-elem-field layui-field-title">
				<legend>视频 - 网站（包括但不限于）</legend>
			</fieldset>

			<div class="layui-row">
				<div class="layui-col-md6">
					<div class="layui-card">
						<div class="layui-card-header">爱奇艺（可用-超推荐）</div>
						<div class="layui-card-body">
							<a href="http://www.iqiyi.com/" target="_blank">
								<img src="@/assets/images/video/video2.png" title="爱奇艺" />
							</a>
						</div>
					</div>
				</div>

				<div class="layui-col-md6">
					<div class="layui-card">
						<div class="layui-card-header">优酷（可用-超推荐）</div>
						<div class="layui-card-body">
							<a href="http://www.youku.com/" target="_blank">
								<img src="@/assets/images/video/video3.png" width="" height="50" title="优酷" />
							</a>
						</div>
					</div>
				</div>

				<div class="layui-col-md6">
					<div class="layui-card">
						<div class="layui-card-header">腾讯视频（可用-超推荐）</div>
						<div class="layui-card-body">
							<a href="http://v.qq.com/" target="_blank">
								<img src="@/assets/images/video/video1.png" width="" height="50" title="腾讯视频" />
							</a>
						</div>
					</div>
				</div>

				<div class="layui-col-md6">
					<div class="layui-card">
						<div class="layui-card-header">芒果TV（可用-超推荐）</div>
						<div class="layui-card-body">
							<a href="http://www.mgtv.com/" target="_blank">
								<img src="@/assets/images/video/video4.png" height="" title="芒果TV" />
							</a>
						</div>
					</div>
				</div>
			</div>


			<div class="layui-row">
				<div class="layui-col-md6">
					<div class="layui-card">
						<div class="layui-card-header">哔哩哔哩（可用-超推荐）</div>
						<div class="layui-card-body">
							<a href="https://www.bilibili.com/" target="_blank">
								<img src="@/assets/images/video/video10.png" class="OtherImg" height="50" title="哔哩哔哩" />
							</a>
						</div>
					</div>
				</div>

				<div class="layui-col-md6">
					<div class="layui-card">
						<div class="layui-card-header">韩剧TV（可能不得行）</div>
						<div class="layui-card-body">
							<a href="https://www.hjtv.me/" target="_blank">
								<img src="@/assets/images/video/video11.png" class="OtherImg" height="50" title="韩剧TV" />
							</a>
						</div>
					</div>
				</div>

				<div class="layui-col-md6">
					<div class="layui-card">
						<div class="layui-card-header">OmoFun（可能不得行）</div>
						<div class="layui-card-body">
							<a href="https://omofun.tv/" target="_blank">
								<img src="@/assets/images/video/video12.png" class="OtherImg" height="50" title="OmoFun" />
							</a>
						</div>
					</div>
				</div>

				<div class="layui-col-md6">
					<div class="layui-card">
						<div class="layui-card-header">乐视TV</div>
						<div class="layui-card-body">
							<a href="http://www.le.com/" target="_blank">
								<img src="@/assets/images/video/video5.png" height="" title="乐视TV" />
							</a>
						</div>
					</div>
				</div>
			</div>

			<div class="layui-row">
				<div class="layui-col-md6">
					<div class="layui-card">
						<div class="layui-card-header">土豆视频</div>
						<div class="layui-card-body">
							<a href="http://www.tudou.com/" target="_blank">
								<img src="@/assets/images/video/video6.png" height="50" title="土豆视频" />
							</a>
						</div>
					</div>
				</div>

				<div class="layui-col-md6">
					<div class="layui-card">
						<div class="layui-card-header">1905</div>
						<div class="layui-card-body">
							<a href="http://www.1905.com/" target="_blank">
								<img src="@/assets/images/video/video9.png" height="50" title="1905" />
							</a>
						</div>
					</div>
				</div>

				<div class="layui-col-md6">
					<div class="layui-card">
						<div class="layui-card-header">搜狐视频</div>
						<div class="layui-card-body">
							<a href="http://tv.sohu.com/" target="_blank">
								<img src="@/assets/images/video/video7.png" width="" height="50" title="搜狐视频" />
							</a>
						</div>
					</div>
				</div>

				<div class="layui-col-md6">
					<div class="layui-card">
						<div class="layui-card-header">PPTV聚力</div>
						<div class="layui-card-body">
							<a href="http://www.pptv.com/" target="_blank">
								<img src="@/assets/images/video/video8.png" height="50" title="PPTV聚力" />
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { sleep } from '@/utils/sleep'
// 导入视频解析的接口获取数据
import { getData } from '@/api/request'

export default {
  name: 'Video',
  created () {
    let isDisPlay = document.querySelector('.model')?.style.display === 'none'
    let notifyMessage = {
                          title: '系统消息',
                          message: '如遇视频解析时间过长，若不想等待，可重新选择解析接口，重新解析视频！',
		                      offset: 0,
			                    duration: 2500
                        }
    if (isDisPlay) {
      this.$notify.info(notifyMessage)
    } else {
      sleep(500).then(() => {
        this.$notify.info(notifyMessage)
      })
    }
		// 将回调延迟到下次DOM更新循环之后执行，避免下拉框没显示出来
		this.$nextTick(() => {
			getData()
		})
	}
}
</script>

<style lang="less" scoped>
body {
	background-color: #f2f2f2;
	overflow-x: hidden;
}
.wrap {
	margin: 50px auto 50px;
}
.video-top {
  display: flex;
}
.video-url {
  flex: 1;
}
.video-website {
	padding: 10px;
	box-sizing: border-box;
}
.layui-card {
	margin: 30px 10px;
	text-align: center;
}
img {
	margin: 10px auto;
}
.OtherImg {
	width: 80px;
  height: 50px;
}
</style>
