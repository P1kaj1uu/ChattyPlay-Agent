// 封装视频解析接口
export const getData = () => {
  layui.use(['element', 'form', 'layer'], function () {
    var element = layui.element,
      $ = layui.jquery,
      form = layui.form,
      upload = layui.upload,
      layer = layui.layer

    var data = [
      {
        name: '视频解析接口不对外开放',
        url: '******'
      }
    ]

    for (let i in data) {
      var $option = $(
        '<option value=' + data[i].url + '>' + data[i].name + '</option>'
      )
      $('#api').append($option)
    }
    form.render()
    $('.play').click(function () {
      var url = $('.url').val()
      var api = $('#api').val()
      if (url == '' || url == null) {
        layer.open({
          type: 0,
          icon: 0,
          time: 2000,
          title: '错误信息',
          offset: '150px',
          content: '请输入解析地址！'
        })
      } else if (url.indexOf('http')) {
        layer.open({
          type: 0,
          icon: 0,
          time: 2000,
          title: '错误信息',
          offset: '150px',
          content: '请输入正确的网址！'
        })
      } else if (api == '' || api == null) {
        layer.open({
          type: 0,
          icon: 0,
          time: 2000,
          title: '错误信息',
          offset: '150px',
          content: '请选择解析接口！'
        })
      } else {
        layer.open({
          type: 2,
          title: '播放界面',
          content: [api + url, 'no'],
          area: ['1060px', '640px'],
          maxmin: true,
          closeBtn: 1,
          success: function (layero, index) {
            $('iframe').attr('allowfullscreen', 'true')
          }
        })
      }
    })
    $('.url').on('click', function () {
      layer.tips('如果视频无法正常播放，请切换解析地址！', 'input', {
        tips: [3, '#393D49'],
        time: 4000
      })
    })
  })
}
