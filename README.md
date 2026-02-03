# ChattyPlay-Agent

## 📄 免责声明

### 本项目提供音乐、影视解析、动漫漫画和ChatGPT相关服务，仅供学习使用，请勿用于任何商业用途。如你有更好的想法、建议、或不解的问题，欢迎提PR或Issues！如有侵权，请联系我！

> License：ChattyPlay-Agent is licensed under the Apache-2.0 License. See the [LICENSE](https://github.com/P1kaj1uu/ChattyPlay-Agent/blob/master/LICENSE) file for more information.

> 项目描述参考信息可跳转WiKi：https://github.com/P1kaj1uu/ChattyPlay-Agent/wiki/%E4%BD%BF%E7%94%A8%E6%96%87%E6%A1%A3

> PC端、移动端均已适配

## 🚀 在线体验

- 体验地址：<a href="http://igdragon.tttttttttt.top" target="_blank">在线体验</a>（服务器带宽低，访问可能略有卡顿，敬请谅解）
- 视频预览：<a href="https://www.bilibili.com/video/BV1bK68BwEJL/?spm_id_from=333.1387.homepage.video_card.click&vd_source=fb04ac71255b4cf04fe2e461b7cee116" target="_blank">录频视频</a>
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
- v4.0重构项目完成，修改相关的bug，页面结构样式重新设计，增加动漫漫画功能，优化用户体验，并完成移动端和PC端的适配，添加版本检测弹窗更新功能，接入SDK、MCP、Agent等服务，同时系统整体架构将Vue2替换为React + TypeScript + Vite + Tailwind CSS + i18n国际化 + live2d看板娘 + nginx + Docker容器化管理（2025.12.16-2026.2.8）

## 最新版本V4.0（推荐）

> 本地调试时，可注释掉限制调用控制台的代码。参照说明修改index.html、.env.development和.env.production文件。部署生产环境修改nginx.conf和docker-compose.yml文件。

## 🔰 项目概述

✅ 技术栈

前端：

- React + TypeScript + Vite + Tailwind CSS + i18n国际化 + live2d看板娘
- 适配移动端和PC端
- Three.js 3D 模型加载动画效果
- MD5加密，验证码，网站访问次数统计
- Markdown语法解析，highlight代码高亮显示
- 处理EventStream流
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

<img width="1470" height="748" alt="Image" src="https://github.com/user-attachments/assets/75f8538a-432a-4dae-a4b3-37443b9df8f2" />

- ### 版本检测

<img width="734" height="674" alt="Image" src="https://github.com/user-attachments/assets/e2bc2706-b137-47bd-b24a-46585f6a9349" />
<img width="1017" height="677" alt="Image" src="https://github.com/user-attachments/assets/464e4219-57ea-46bc-8267-8abbc90bc752" />

- ### 登录页面

  ![image](https://github.com/user-attachments/assets/c7644661-252d-4caf-8316-88b8f8c5bcc0)

- ### 爱心跳动

  ![image](https://github.com/P1kaj1uu/VIP-Video-Parsing/assets/94435057/02b9367e-0b6e-4cde-8157-36b5731aa518)

- ### 主页

  ![image](https://github.com/user-attachments/assets/d1a260fb-960d-4a16-b8b0-52f82b6d7415)
  ![image](https://github.com/user-attachments/assets/1391a3a7-1996-4856-838e-7bb7405812e7)
  ![image](https://github.com/user-attachments/assets/3608805b-34e8-4081-aaca-8fb03c5cffcb)

- ### 观看页面

<img width="1470" height="794" alt="Image" src="https://github.com/user-attachments/assets/843d45e4-c48e-403e-9aa1-52d52b3ef9b1" />
<img width="1470" height="792" alt="Image" src="https://github.com/user-attachments/assets/7b9fc41c-833c-4a06-9652-5bdf2926edb4" />
<img width="1470" height="794" alt="Image" src="https://github.com/user-attachments/assets/7473cc8f-8bf6-467a-b0dc-103fbb68b5be" />
<img width="1470" height="788" alt="Image" src="https://github.com/user-attachments/assets/66da8c88-f50d-43b0-ad60-0c54dcdb4268" />
<img width="1470" height="790" alt="Image" src="https://github.com/user-attachments/assets/bc5c62f2-2b13-4e59-83c3-e92760bd0966" />
<img width="1467" height="792" alt="Image" src="https://github.com/user-attachments/assets/3bee002b-c4ad-411a-8171-0f092d792890" />
<img width="734" height="793" alt="Image" src="https://github.com/user-attachments/assets/9b6a5b0b-ec5f-4dcb-815c-e292a67ffc4f" />

- ### 动漫漫画

<img width="1470" height="788" alt="Image" src="https://github.com/user-attachments/assets/40191626-8494-40b9-9600-15b2f6a3e452" />
<img width="1466" height="794" alt="Image" src="https://github.com/user-attachments/assets/d2285a31-43cf-49be-adac-a35b2b0daa0d" />
<img width="1468" height="789" alt="Image" src="https://github.com/user-attachments/assets/d9e630f0-37ab-4b5f-9bb7-c35931b44bf1" />
<img width="744" height="794" alt="Image" src="https://github.com/user-attachments/assets/b58af50f-6604-46b6-b70b-1cdc8b288228" />

- ### ChatGPT页面

<img width="1470" height="793" alt="Image" src="https://github.com/user-attachments/assets/a97e4ade-bc35-49f9-bfde-757c736c6299" />
<img width="1468" height="791" alt="Image" src="https://github.com/user-attachments/assets/9d07017e-ade1-48fc-a891-e48ced227624" />
<img width="716" height="793" alt="Image" src="https://github.com/user-attachments/assets/726fb70b-cb00-4b08-a8cc-039ca44304c8" />

- ### 音乐页面

<img width="1466" height="790" alt="Image" src="https://github.com/user-attachments/assets/65c85e7d-b5c1-4d9c-965d-ccf53e5f8c2b" />
<img width="1470" height="793" alt="Image" src="https://github.com/user-attachments/assets/fa85b256-9473-498e-9193-0158858c56ec" />
<img width="1470" height="788" alt="Image" src="https://github.com/user-attachments/assets/b01c7bf2-3a38-4f43-be76-c72e940f6d09" />

- ### 文生图页面

<img width="1470" height="789" alt="Image" src="https://github.com/user-attachments/assets/801d1757-edfe-4883-9519-7d892125f237" />
<img width="1463" height="790" alt="Image" src="https://github.com/user-attachments/assets/b06e1748-5c59-41bf-be2b-e4e3a1918c74" />
<img width="730" height="791" alt="Image" src="https://github.com/user-attachments/assets/673ef196-644c-4bf0-9d24-cd3db7a94ec9" />

- ### 降重页面

<img width="1470" height="790" alt="Image" src="https://github.com/user-attachments/assets/73b69a22-46de-4516-9401-e387ddc2719b" />
<img width="1470" height="789" alt="Image" src="https://github.com/user-attachments/assets/06483e84-11fb-4e4f-9087-25f06344275b" />

- ### 404页面
  ![image](https://github.com/user-attachments/assets/22e6aed8-27b2-4317-a6a6-a7767950c189)

## ⚡ 网站性能

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
