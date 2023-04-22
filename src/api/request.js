// 封装视频解析接口
export const getData = () => {
	layui.use(['element', 'form', 'layer'], function() {
		var element = layui.element,
			$ = layui.jquery,
			form = layui.form,
			upload = layui.upload,
			layer = layui.layer;
	
    var data = [
      {
				name: "超级万能接口（首推-超推荐可用）",
				url: "https://jx.jsonplayer.com/player/?url="
      },
			{
				name: "万能接口（超推荐可用）",
				url: "http://www.sfsft.com/admin.php?url="
      },
      {
				name: "B站备用接口（推荐可用）",
				url: "https://okjx.cc/?url="
			},
      {
				name: "万能备用接口（推荐可用）",
				url: "https://jx.playerjy.com/?url="
			},
      {
				name: "万能备用接口（推荐可用）",
				url: "https://jx.aidouer.net/?url="
      },
      {
				name: "万能备用接口（推荐可用）",
				url: "https://www.8090g.cn/?url="
			},
      {
				name: "纯净接口（推荐可用）",
				url: "https://z1.m1907.top/?jx="
      },
      {
				name: "优酷超清接口（推荐可用）",
				url: "http://www.82190555.com/index/qqvod.php?url="
      },
      {
				name: "爱奇艺接口（推荐可用）",
				url: "https://api.qianqi.net/vip/?url="
			},
			{
				name: "其它接口（推荐可用）",
				url: "https://jx.dj6u.com/?url="
      },
			{
				name: "其它备用接口（推荐可用）",
				url: "https://www.ckmov.vip/api.php?url="
			},
			{
				name: "其它备用接口（推荐可用）",
				url: "https://www.h8jx.com/jiexi.php?url="
			},
			{
				name: "其它备用接口（推荐可用）",
				url: "https://go.yh0523.cn/y.cy?url="
			},
			{
				name: "其它备用接口（推荐可用）",
				url: "https://www.1717yun.com/jx/ty.php?url="
			},
			{
				name: "爱奇艺超清接口3",
				url: "https://api.flvsp.com/?url="
			},
			{
				name: "芒果TV超清接口",
				url: "http://api.xfsub.com/index.php?url="
			},
			{
				name: "芒果TV手机接口",
				url: "http://65yw.2m.vc/chaojikan.php?url="
			},
			{
				name: "搜狐视频接口",
				url: "http://vip.jlsprh.com/index.php?url="
			},
			{
				name: "乐视视频接口",
				url: "http://2gty.com/apiurl/yun.php?url="
			},
		];
	
		for (let i in data) {
			var $option = $("<option value=" + data[i].url + ">" + data[i].name + "</option>");
			$("#api").append($option);
		}
		form.render()
		$('.play').click(function() {
			var url = $('.url').val();
			var api = $('#api').val();
			if (url == '' || url == null) {
				layer.open({
					type: 0,
					icon: 0,
					time: 2000,
					title: "错误信息",
					offset: '150px',
					content: "请输入解析地址！"
				});
			} else if (url.indexOf('http')) {
				layer.open({
					type: 0,
					icon: 0,
					time: 2000,
					title: "错误信息",
					offset: '150px',
					content: "请输入正确的网址！"
				});
			} else if(api == '' || api == null) {
				layer.open({
					type: 0,
					icon: 0,
					time: 2000,
					title: "错误信息",
					offset: '150px',
					content: "请选择解析接口！"
				});
			} else {
				layer.open({
					type: 2,
					title: "播放界面",
					content: [api + url, 'no'],
					area: ['1060px', '640px'],
					maxmin: true,
					closeBtn: 1,
					success: function(layero, index) {
						  $('iframe').attr('allowfullscreen','true');
					}
				});
			}
	
		});
		$('.url').on('click',function() {
			layer.tips('如果视频无法正常播放，请切换解析地址！', 'input', {
			  tips: [3, '#393D49'],
			  time: 4000
			});
		})
	});
}
