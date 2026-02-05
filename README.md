# ChattyPlay-Agent

## 📄 免责声明

### 本项目提供音乐、影视解析、实时黄金及K线图、动漫漫画和ChatGPT相关服务，仅供学习使用，请勿用于任何商业用途。如你有更好的想法、建议、或不解的问题，欢迎提PR或Issues！如有侵权，请联系我！

> License：ChattyPlay-Agent is licensed under the Apache-2.0 License. See the [LICENSE](https://github.com/P1kaj1uu/ChattyPlay-Agent/blob/master/LICENSE) file for more information.

> 项目描述参考信息可跳转WiKi：https://github.com/P1kaj1uu/ChattyPlay-Agent/wiki/%E4%BD%BF%E7%94%A8%E6%96%87%E6%A1%A3

> PC端、移动端均已适配

## 🚀 在线体验

- 体验地址：<a href="http://123.60.91.107:9501/" target="_blank">在线体验</a>（服务器带宽低，访问可能略有卡顿，敬请谅解）
- 视频预览：<a href="https://www.bilibili.com/video/BV1DmFYzbEQp/?share_source=copy_web&vd_source=1c9f57ed1dd7f17c0142ea7c34926f1e" target="_blank">录频视频</a>
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
- v2.9版本整体优化代码，修复bug，并抽离封装部分函数和组件，降低复杂度，实现高内聚低耦合（2023.6.10-2023.6.20）
- v3.0全新版本上线，优化markdown代码块格式，并接入文生图、亚马逊爬虫服务，发布浏览器插件（2023.7.24-2023.8.13）
- v4.0重构项目完成，修改相关的bug，页面结构样式重新设计，增加实时黄金及k线图、动漫漫画功能，优化用户体验，并完成移动端和PC端的适配，添加版本检测弹窗更新功能，接入SDK、MCP、Agent等服务，同时系统整体架构将Vue2替换为React + TypeScript + Hono + Vite + Tailwind CSS + i18n国际化 + live2d看板娘 + nginx + Docker容器化管理（2025.12.16-2026.2.8）

## 最新版本V4.0（推荐）

> 本地调试时，可注释掉限制调用控制台的代码。参照说明修改package.json、email.config.js、index.html、.env.development、.env.production和docker-compose.yml文件。

## 🔰 项目概述

✅ 技术栈

前端：

- React + TypeScript + Vite + Tailwind CSS + i18n国际化 + live2d看板娘
- 适配移动端和PC端
- Three.js 3D 模型加载动画效果
- MD5加密，验证码，网站访问次数统计
- Markdown语法解析，highlight代码高亮显示
- 处理EventStream流
- 金融基金K线图
- 实时版本检测更新
- 限制终端控制台调用
- 组件库使用Antd
- 接入fundebug SDK和OPen AI SDK
- 接入MCP、Agent相关服务

后端：

- Python 3.10+，开发框架FastAPI，数据库MySQL + SQLAlchemy ORM + Alembic迁移，中间件Redis
- 第三方API接入Openai-ChatGPT（langchain框架流式对话），接入文生图模型（Stable Diffusion diffusers / MidJourney API replicate）
- Middleware中间件拦截器、装饰器过滤器、本地缓存cachetools（TTLCache/LRUCache）
- 算法使用collections.deque双端队列 + 滑动窗口限流算法 + Round-robin轮询负载均衡
- asyncio异步流 + aiohttp + yield生成器流式输出
- @app.exception_handler全局异常处理器，APScheduler定时任务调度，asyncio.Lock/Redis分布式锁，Pydantic数据验证
- Swagger UI交互式文档
- Nginx反向代理，Docker容器化

✅ 音乐播放

- 无需登录，可快速上手使用
- 支持歌曲/歌手的模糊搜索，播放歌曲和查看热评
- 支持歌曲倍速播放

✅ 视频解析

- 无需会员，可在线解析视频，解析速度快
- 包含海量视频资源，提供多个可用的解析接口
- 支持全屏、倍速播放，画质超清及以上

✅ 实时黄金

- 页面水印，版权认证
- 实时获取黄内金价和国外金价数据
- TradingView实时k线图数据波动
- 支持切换日期范围选择、复制图片、下载图片

✅ ChatGPT

- 集成OpenAi API (DeepSeek V3.2模型)，无需再代理，可快速使用
- 支持markdown格式，代码高亮，代码复制，公式和图表展示
- 无限轮聊天 + 带上下文逻辑
- 流式输出，可中断输出，实时会话存储管理，导出聊天记录
- 语音聊天 + 语音播放

✅ 文生图

- 接入文生图模型（MidJourney / Stable Diffusion Model）
- 支持大量多语言的AI绘图
- 提供20+种生成的图片风格

✅ 动漫漫画

- 有13个热门榜单，上万本图漫，包括人气榜、新作榜、畅销榜、日漫榜、恋爱榜、剧情榜、投稿榜、完结榜、免费榜、等免榜、月票榜
- 支持漫画名/漫画作者/漫画内容的模糊搜索，可快速切换漫画上一章、下一章

## ➰ 效果展示

- ### 关于我

<img width="1470" height="789" alt="Image" src="https://github.com/user-attachments/assets/c3b7152e-a498-4203-8039-06a40706068c" />

- ### 版本检测

<img width="734" height="674" alt="Image" src="https://github.com/user-attachments/assets/e2bc2706-b137-47bd-b24a-46585f6a9349" />
<img width="1017" height="677" alt="Image" src="https://github.com/user-attachments/assets/464e4219-57ea-46bc-8267-8abbc90bc752" />

- ### 登录页面

  ![image](https://github.com/user-attachments/assets/c7644661-252d-4caf-8316-88b8f8c5bcc0)

- ### 爱心跳动

  ![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/02b9367e-0b6e-4cde-8157-36b5731aa518)

- ### 主页

<img width="1470" height="791" alt="Image" src="https://github.com/user-attachments/assets/7fa74a56-fe03-48fd-ae4f-1424a1680aab" />
<img width="1470" height="793" alt="Image" src="https://github.com/user-attachments/assets/3f32f751-c0dc-4ec2-bb84-0413cce4d9f9" />
<img width="631" height="710" alt="Image" src="https://github.com/user-attachments/assets/cb304370-f93f-49c6-8e21-a2736055daef" />
<img width="677" height="719" alt="Image" src="https://github.com/user-attachments/assets/9c824d7e-669d-469c-99ca-3ba186cdc95c" />

- ### 观看页面

<img width="1470" height="794" alt="Image" src="https://github.com/user-attachments/assets/d085b162-3bd2-4444-9dd7-ada732efd689" />
<img width="1467" height="787" alt="Image" src="https://github.com/user-attachments/assets/65b9e758-818d-4e49-9936-808070ab45c0" />
<img width="1470" height="792" alt="Image" src="https://github.com/user-attachments/assets/2153eb1a-3ae5-4ff9-9583-11329bde77e2" />
<img width="1470" height="789" alt="Image" src="https://github.com/user-attachments/assets/a7bf05d8-f5d3-419c-b0ee-0013e925b00e" />
<img width="1470" height="789" alt="Image" src="https://github.com/user-attachments/assets/54fdfd8b-35c7-4e8e-839e-0df12beb02ef" />
<img width="695" height="776" alt="Image" src="https://github.com/user-attachments/assets/956e3d33-c4b4-471f-b004-6beac7bc32a2" />

- ### 动漫漫画

<img width="1470" height="790" alt="Image" src="https://github.com/user-attachments/assets/b7f974aa-84ab-48a1-ab42-4fd7ebb5b0e0" />
<img width="1470" height="790" alt="Image" src="https://github.com/user-attachments/assets/1124277a-eb5b-4f6c-8b07-24ce7b672581" />
<img width="1470" height="796" alt="Image" src="https://github.com/user-attachments/assets/21caccf3-be96-4133-a992-81aabe5dfb32" />
<img width="696" height="771" alt="Image" src="https://github.com/user-attachments/assets/3cb4b72b-9806-40cd-a1d1-b7d24a4d7744" />
<img width="727" height="773" alt="Image" src="https://github.com/user-attachments/assets/a324e6d7-e8e5-48a6-a8c9-9585787d26eb" />
<img width="687" height="780" alt="Image" src="https://github.com/user-attachments/assets/a5cc1133-e29e-4d2f-bbda-af9c533378e8" />

- ### 实时黄金

<img width="1470" height="794" alt="Image" src="https://github.com/user-attachments/assets/d3a8e9c0-adc1-40f1-9de9-f79c14f483a4" />
<img width="1470" height="795" alt="Image" src="https://github.com/user-attachments/assets/b17a1d6d-d8e8-48f6-96f6-a49968d4be71" />
<img width="660" height="700" alt="Image" src="https://github.com/user-attachments/assets/41da09a3-8c84-434c-a001-fc81b5624217" />

- ### ChatGPT页面

<img width="1470" height="794" alt="Image" src="https://github.com/user-attachments/assets/d47c6638-b2e5-4b86-b973-61717c6c207a" />
<img width="1470" height="795" alt="Image" src="https://github.com/user-attachments/assets/56c03b75-1a42-4002-bc20-48c5661feec8" />
<img width="701" height="770" alt="Image" src="https://github.com/user-attachments/assets/fa617f4c-cd29-4902-ada4-10cdff51637f" />

- ### 音乐页面

<img width="1470" height="789" alt="Image" src="https://github.com/user-attachments/assets/72f44648-1e81-435a-b4ea-98ce4f21f6c2" />
<img width="1470" height="794" alt="Image" src="https://github.com/user-attachments/assets/086ee166-1702-43bc-92b8-3a5baead925f" />
<img width="1470" height="791" alt="Image" src="https://github.com/user-attachments/assets/a243878b-838d-464a-8953-98342ed1c8b4" />
<img width="671" height="791" alt="Image" src="https://github.com/user-attachments/assets/004c7a1a-4f48-4e5d-a918-ad3168ef2170" />

- ### 文生图页面

<img width="1470" height="794" alt="Image" src="https://github.com/user-attachments/assets/95ca9824-d33a-4d51-ab72-9c9df4f80df5" />
<img width="1470" height="795" alt="Image" src="https://github.com/user-attachments/assets/cae32b98-c081-4d46-a7e0-2c676727a668" />

- ### 降重页面

<img width="1470" height="716" alt="Image" src="https://github.com/user-attachments/assets/7db6a99a-b7f6-4771-93a5-0a4bf6ebd68d" />
<img width="487" height="724" alt="Image" src="https://github.com/user-attachments/assets/a4cf7de6-5962-4e03-b77b-28944c584989" />

- ### 404页面

<img width="1470" height="792" alt="Image" src="https://github.com/user-attachments/assets/efd0425b-1879-42a1-9c1e-eb71baea8bfe" />

## ⚡ 网站性能

<img width="1373" height="788" alt="Image" src="https://github.com/user-attachments/assets/b159956b-599a-439a-a05c-33cd25def60a" />
<img width="1470" height="841" alt="Image" src="https://github.com/user-attachments/assets/18ce8a21-ce36-4ffe-9b9f-9dbff9ee54ea" />
<img width="1470" height="802" alt="Image" src="https://github.com/user-attachments/assets/7745822c-c876-4df2-b41f-275b210e77b8" />
<img width="1470" height="752" alt="Image" src="https://github.com/user-attachments/assets/ea6d74f8-74e0-4500-947f-99ec171c7c93" />
<img width="1470" height="755" alt="Image" src="https://github.com/user-attachments/assets/746890e5-d67b-491f-af1f-957b0f832040" />

<details>

<summary>历史版本V3.0</summary>

> 切换commit版本：bbcb9d9146edcb1230adb874d67c2bb38aac1e69

## 🔰 项目概述

✅ 技术栈

- 前端：Vue2，Vuex，JQuery，Three.js，axios，fetch，路由前置全局守卫，MD5加密，验证码，网站访问次数统计，Markdown语法解析，highlight代码高亮显示，处理EventStream流，PC端屏幕适配，组件库使用ElementUI和Layui
- 后端：Java，开发框架SpringBoot，数据库MySQL，中间件Redis，第三方API接入Openai-ChatGPT，接入文生图模型（MidJourney / Stable Diffusion Model），核心技术包含拦截器、过滤器、本地缓存Caffeine LoadingCache、算法（双端队列 + 滑动窗口 + 轮询负载均衡等）、Stream流、全局异常处理器、定时任务、锁机制、Swagger
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

✅ 文生图

- 接入文生图模型（MidJourney / Stable Diffusion Model）
- 支持大量多语言的AI绘图
- 提供20+种生成的图片风格

## ➰ 效果展示

- ### 检测页面

  ![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/47f44a74-6901-4c0a-bd28-a69ff2423dae)

- ### 登录页面

  ![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/9a994b55-b7af-4ee2-98b1-7ec3844be75b)

- ### 404页面

  ![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/8b1bc61b-a5ff-4dcb-80e8-4459680f8da7)

- ### 爱心跳动

  ![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/02b9367e-0b6e-4cde-8157-36b5731aa518)

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
  ![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/fe6d07d7-4564-458b-aa11-d05b1d7119ec)

- ### 文生图页面
  ![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/26a6ac68-a3c9-49f1-b53d-47582480b107)
  ![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/fcf5de85-6a43-42a0-88e7-ca1bc2d8e6bb)
  ![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/05f02f4a-836a-4d68-879d-5b2d7264bf02)
  ![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/61f8d79d-13b6-4700-98e5-e316023c2e16)

## ⚡ 网站性能

![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/8bf28d51-e295-4eb7-bf81-d89ba65d2527)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/f0300dc2-945c-4f49-8b62-083dd3d5911b)
![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/f8ff05cf-c2f8-4967-a5f5-2975b2d729c0)

</details>

## 🖋 参与贡献

<a href="https://github.com/P1Kaj1uu/VIP-Video-Parsing/graphs/contributors"> <img src="https://contrib.rocks/image?repo=P1Kaj1uu/VIP-Video-Parsing" /></a>

## 🍺 赞助

如果你认为我的项目对你很有帮助，而且情况允许的话，那么请考虑支持我的项目。我将非常感激任何的支持，哪怕只是一点点的资助，也能激励我持续开发和改进这个项目。

您可以通过以下几种方式支持我的项目：

- 赞助我：您可以通过贡献资金来支持我的项目，这将帮助我支付服务器、工具和其他开发成本。您可以在下方找到资助方式。

- 分享项目：如果您不能贡献资金，但是您认为我的项目非常有价值，那么请考虑分享项目链接给您的朋友和同事。这将有助于我的项目得到更多的关注和支持。如果可以请给一个小小的star！

- 提供反馈：您可以通过提交Issues或者Pull Requests来帮助改进我的项目。如果您发现了任何错误或者您认为我的项目可以改进的地方，欢迎随时向我提供反馈。

总之，非常感谢您对我的项目的支持，我将努力不懈地改进和提高这个项目的质量，让它更好地为您和其他用户服务。

<br />

联系我（WeChat：Dveiklokk）：

<img width="274" height="381" alt="Image" src="https://github.com/user-attachments/assets/16f145fa-af7f-4ef2-9e36-7051c619eaa9" />

WeChat Pay：

<img width="263" height="375" alt="Image" src="https://github.com/user-attachments/assets/b3174698-024c-4be4-bd9b-7cc219503344" />

## ⏰ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=P1kaj1uu/ChattyPlay-Agent&type=Timeline)](https://star-history.com/#P1kaj1uu/ChattyPlay-Agent&Timeline)
