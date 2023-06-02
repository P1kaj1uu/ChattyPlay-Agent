# VIP视频在线解析及ChatGPT服务

## 📄 免责声明
### 本项目提供音乐、影视解析和ChatGPT服务，仅供学习使用，请勿用于任何商业用途。如你有更好的想法、建议、或不解的问题，欢迎提PR或Issues！如有侵权，请联系我！

> License：VIP-Video-Parsing is licensed under the Apache-2.0 License. See the [LICENSE](https://github.com/P1kaj1uu/VIP-Video-Parsing/blob/master/LICENSE) file for more information.

> 项目描述详情信息可跳转WiKi：https://github.com/P1kaj1uu/VIP-Video-Parsing/wiki/%E4%BD%BF%E7%94%A8%E6%96%87%E6%A1%A3

> 移动端适配进度已经完成45%，但可能要搁置一段时间，这段时间要论文降重和答辩

## 🚀 在线体验
- 体验地址：<a href="http://121.36.82.52:9200/" target="_blank">个人项目</a>
- 备注：如使用ChatGPT服务，我的APIKey配额有限，希望大家能省点用谢谢！

## 📖 版本迭代
- v1.0版本已完成（2023.1.7凌晨）
- v1.1版本优化观看页面的提示内容（2023.1.7上午）
- v1.2版本优化解析接口（2023.1.8下午）
- v1.3版本优化帮助内容页面（2023.1.8下午）
- v1.4版本优化分离加载爱心跳动效果（2023.1.9上午）
- v1.5版本增加多个能用的视频解析接口（2023.1.14晚上）
- v1.6版本禁止F12查看源代码（2023.1.19上午）
- v1.7版本增加并优化解析视频接口（2023.1.19下午）
- v1.8版本浏览器兼容判断浏览器类型（2023.1.20晚上）
- v2.0版本优化页面样式，增加首页听音乐功能（2023.4.22下午）
- v2.1版本增加论文降重功能（2023.4.30全天）
- v2.2版本接入ChatGPT服务，可无需再代理和APIkey（2023.5.1-2023.5.3）
- v2.3版本优化ChatGPT服务，检测自动换行，并支持上下文对话（2023.5.6-2023.5.7）
- v2.4版本代仓本地的部分接口隐藏不对外开放（2023.5.7晚上）
- v2.5版本输出代码高亮显示，流式处理EventStream，并支持会话存储（2023.5.13-2023.5.14）
- v2.6版本接入文心一言基础服务，增加语音聊天、语音朗读功能（2023.5.20-2023.5.21）
- v2.7版本前端也做限流处理，增加验证功能，防止接口被恶意多次请求（2023.5.24晚上）
- v2.8版本优化加载效果，增加网站访问次数统计和版本更新提醒用户功能（2023.5.26-2023.5.27）
- v2.9版本整体优化代码，修复bug，并抽离封装部分函数和组件，降低复杂度，实现高内聚低耦合（进行中）
- v3.0版本性能优化，项目重构，全新版本上线（待定安排中）


## 🔰 项目概述
✅ 技术栈
- 前端：Vue2，Vuex，JQuery，Three.js，axios，fetch，路由前置全局守卫，MD5加密，验证码，网站访问次数统计，Markdown语法解析，highlight代码高亮显示，处理EventStream流，PC端屏幕适配，组件库使用ElementUI和Layui
- 后端：Java，开发框架SpringBoot，数据库MySQL，中间件Redis，第三方API接入Openai-ChatGPT，核心技术包含拦截器、过滤器、本地缓存Caffeine LoadingCache、算法（双端队列 + 滑动窗口 + 轮询负载均衡等）、Stream流、全局异常处理器、定时任务、锁机制、Swagger
- 部署：Nginx，服务器开代理模式

✅ 音乐播放
- 无需登录，可快速上手使用
- 支持歌曲/歌手的模糊搜索，播放歌曲和对应MV
- 支持歌曲倍速播放，MV可下载

✅ 视频解析
- 无需会员，可在线解析视频，解析速度快
- 包含海量视频资源，提供多个可用的解析接口
- 支持全屏、倍速播放，画质超清及以上

✅ ChatGPT
- 集成OpenAi API (ChatGPT3.5)，无需再代理，可快速使用
- 支持markdown格式，代码高亮，代码复制，公式和图表展示
- 无限轮聊天 + 带上下文逻辑
- 流式输出，会话存储管理
- 语音聊天 + 语音播放


## ➰ 效果展示
- ### 爱心跳动
![image](https://user-images.githubusercontent.com/94435057/235587606-f84bdbcc-b67b-4790-93cc-c91d77ec9b6c.png)

- ### 音乐页面
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/a02a52f6-15e8-4503-922b-2af207419c15)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/1bbd4733-f5fa-43ed-bd4d-a2c30a5b8f52)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/1321776c-1942-4ab4-b911-5569759b80d3)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/0b7d8db6-d8ad-4e6e-a103-427e66deba33)


- ### 观看页面
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/8d26a5d2-9cb9-4671-8612-a65e1dd1adda)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/c02fafa0-2f08-4f09-bb92-bf4480dcf7e2)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/2dc87edc-068e-48f4-8655-d7c05ff91086)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/0464986a-b635-4114-9b41-84e7786fdabb)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/43d7a201-0473-4d29-bc3c-d1fd03898e85)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/3f77676f-fd12-497e-ba5b-857429a60dbb)


- ### 降重页面
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/05dc42f5-15ed-49e7-9141-dead78fd5a5b)


- ### ChatGPT页面
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/112e3eb6-158f-47e5-9bb4-7e104af38088)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/f219dc3a-2540-4c87-8ac3-1d030ca88f7e)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/d44844db-fd03-430c-8bc7-ebbbdf6abed2)


## ⚡ 网站性能
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/8bf28d51-e295-4eb7-bf81-d89ba65d2527)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/f0300dc2-945c-4f49-8b62-083dd3d5911b)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/f8ff05cf-c2f8-4967-a5f5-2975b2d729c0)



## 🖋 参与贡献

<a href="https://github.com/P1Kaj1uu/VIP-Video-Parsing/graphs/contributors">  <img src="https://contrib.rocks/image?repo=P1Kaj1uu/VIP-Video-Parsing" /></a>

## 🍺 赞助

如果你认为我的项目对你很有帮助，而且情况允许的话，那么请考虑支持我的项目。我将非常感激任何的支持，哪怕只是一点点的资助，也能激励我持续开发和改进这个项目。

您可以通过以下几种方式支持我的项目：

- 赞助我：您可以通过贡献资金来支持我的项目，这将帮助我支付服务器、工具和其他开发成本。您可以在下方找到资助方式。

- 分享项目：如果您不能贡献资金，但是您认为我的项目非常有价值，那么请考虑分享项目链接给您的朋友和同事。这将有助于我的项目得到更多的关注和支持。如果可以请给一个小小的star！

- 提供反馈：您可以通过提交Issues或者Pull Requests来帮助改进我的项目。如果您发现了任何错误或者您认为我的项目可以改进的地方，欢迎随时向我提供反馈。

总之，非常感谢您对我的项目的支持，我将努力不懈地改进和提高这个项目的质量，让它更好地为您和其他用户服务。

<br />

联系我：

<img src="http://121.36.82.52:9200/img/wx.e958441d.jpg" width="30%" height="30%">

WeChat Pay：

<img src="https://images.cnblogs.com/cnblogs_com/blogs/769490/galleries/2222291/o_220925123434_%E5%BE%AE%E4%BF%A1.png" width="30%" height="30%">


## ⏰ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=P1kaj1uu/VIP-Video-Parsing&type=Timeline)](https://star-history.com/#P1kaj1uu/VIP-Video-Parsing&Timeline)

