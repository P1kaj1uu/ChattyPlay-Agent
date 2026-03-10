const aimarkmap = {
  promptSettingsBtn: '📝 Prompt设置',
  apiSettingsBtn: '⚙️ API设置',
  modelLabel: '模型:',
  modelLabelMobile: '模型选择:',
  queryBtn: '🔍 查询',
  versionsLabel: '生成数量:',
  generateBtn: 'AI生成',
  showOriginalBtn: '原文',
  showMarkdownBtn: 'Markdown',
  clearBtn: '清空',
  fullscreenBtn: '全屏显示',
  exportPngBtn: '导出 PNG',
  exportSvgBtn: '导出 SVG',
  mindmapPreviewTitle: '🧠 思维导图预览',
  thinkingMessage: 'AI正在思考中...',
  apiSettingsTitle: '⚙️ API 设置',
  apiUrlLabel: 'API地址:',
  apiKeyLabel: 'API秘钥:',
  saveAndCloseBtn: '💾 保存并关闭',
  promptSettingsTitle: '📝 Prompt 设置',
  promptTip: '请确保在Prompt模板中包含 <code>{{CONTENT}}</code>，它将被替换为左侧的输入内容。',
  editNodeTitle: '✏️ 编辑节点',
  deleteNodeBtn: '🗑️ 删除节点',
  helpBtnTitle: '帮助与信息',
  infoModalTitle: '使用说明、服务条款和隐私政策',
  infoModalContentHtml: `
    <h2>使用说明</h2>
    <ul>
      <li><strong>API 设置:</strong> 首次使用，请点击右上角的 <code>⚙️ API设置</code> 按钮，填入您的 AI 服务商提供的 API 地址 (URL) 和密钥 (Key)。配置将自动保存在您的浏览器本地。</li>
      <li><strong>模型选择:</strong> 在左侧面板选择或输入您想使用的 AI 模型。点击 <code>🔍 查询</code> 可自动获取该 API 地址下支持的模型列表。</li>
      <li><strong>内容输入:</strong> 在左侧最大的输入框中，您可以输入一段描述性文本，或者直接粘贴已经格式化好的 Markdown 内容。</li>
      <li><strong>AI 生成:</strong> 输入描述性文本后，通过滑块选择希望 AI 生成的不同版本数量（1-5个），然后点击 <code>🚀 AI生成</code>。</li>
      <li><strong>版本切换:</strong> 生成成功后，思维导图预览区上方会出现版本选项卡 (如"版本1", "版本2")，点击即可切换查看不同版本。</li>
      <li><strong>编辑与查看:</strong>
        <ul style="margin-top: 0.5rem;">
          <li>在思维导图上对任意节点<strong>单击右键</strong>，可选择<strong>"编辑节点"</strong>或<strong>"删除节点"</strong>。</li>
          <li>左侧的 <code>📝 显示Markdown</code> 按钮可以让你查看和编辑 AI 生成的 Markdown 源码。</li>
        </ul>
      </li>
      <li><strong>导出与全屏:</strong> 使用预览区右上角的按钮可将当前思维导图导出为 <code>SVG</code> 或 <code>PNG</code> 图片，或进入全屏模式。</li>
    </ul>
    <h2>服务条款</h2>
    <p>当您使用 Markmap 时，即表示您同意以下条款：</p>
    <ul>
      <li>您对自己输入到本产品中的所有内容（包括文本、API密钥等）负全部责任。您必须保证输入的内容不侵犯任何第三方权利，且不违反任何适用法律法规。</li>
      <li>禁止利用本产品进行任何形式的恶意行为，包括但不限于大量的、不合理的 API 请求、传播非法信息、或攻击第三方服务。</li>
    </ul>
    <h2>隐私政策</h2>
    <p>我们高度重视您的隐私。请仔细阅读以下关于我们如何处理您的数据的信息：</p>
    <h3>数据收集</h3>
    <p>本产品主要处理两类数据：</p>
    <ul>
      <li><strong>配置信息:</strong> 您输入的 API 地址、API 密钥、所选模型等配置。这些信息仅使用浏览器的 <code>localStorage</code> 技术存储在<strong>您自己的电脑上</strong>，用于简化您的后续使用，不会上传到 AiMarkmap 的服务器。</li>
      <li><strong>输入内容:</strong> 您为生成思维导图而输入的文本内容。</li>
    </ul>
    <p>本产品<strong>不使用</strong>任何第三方分析工具（如 Google Analytics）来追踪您的个人行为。</p>
    <h3>数据使用</h3>
    <p>您的所有数据处理均在<strong>浏览器端（客户端）</strong>完成。具体流程如下：</p>
    <ul>
      <li>您的 API 密钥和输入内容仅在您点击"AI生成"按钮时，由您的浏览器直接组合成一个请求，发送给您在设置中指定的第三方 AI 服务（如 OpenAI、Google AI 等）。</li>
      <li><strong>Markmap 的服务器不存储、不中转、也无法看到</strong>您的 API 密钥和输入内容。数据传输路径为：您的浏览器 -> 您指定的 AI 服务提供商。</li>
    </ul>
    <h3>第三方服务</h3>
    <p>本产品作为一个客户端工具，会根据您的配置调用第三方 AI 服务。您发送的数据将受您所使用的 AI 服务提供商的隐私政策和数据使用条款约束。我们强烈建议您在使用前查阅相应服务商的官方隐私政策。</p>
    <h2>免责声明</h2>
    <ul>
      <li><strong>AI 生成内容的准确性：</strong>由 AI 模型生成的所有内容仅供参考。我们不保证其准确性、完整性或适用性。您需要自行判断并对使用这些结果所造成的一切后果负责。</li>
      <li><strong>服务可用性：</strong>由于本产品依赖于网络连接和第三方 API 服务的稳定性，我们不承诺服务 100% 不间断或无错误。因网络问题、API 服务商故障或您自身配置错误导致的服务不可用，我们不承担任何责任。</li>
    </ul>`,
  customModelInputPlaceholder: '输入自定义模型名称',
  topicInputPlaceholder: '可直接输入或粘贴Markdown，或输入普通文本后点击"AI生成"...',
  contentDisplayPlaceholder: '编辑内容...',
  apiUrlPlaceholder: 'AI API地址',
  apiKeyPlaceholder: 'API密钥',
  toggleVisibilityTitle: '显示/隐藏密钥',
  promptInputPlaceholder: '在此编辑AI Prompt模板...',
  editNodePlaceholder: '输入节点的新内容...',
  js_generating: '生成中...',
  js_exporting: '导出中...',
  js_querying: '查询中...',
  js_exit_fullscreen: '退出全屏',
  js_fullscreen: '全屏显示',
  js_status_requesting: '正在发起AI请求...',
  js_status_generated: '已成功生成 {{s}}/{{n}} 个版本...',
  js_status_done: '生成完成！共 {{n}} 个有效版本。',
  js_tab_version: '版本 {{i}}',
  js_alert_no_content: '请先输入内容！',
  js_alert_all_failed: '所有AI生成请求均失败或返回空内容。请检查API设置和网络。',
  js_alert_gen_failed: 'AI生成失败: {{msg}}',
  js_alert_no_clipboard: '您的浏览器不支持剪贴板 API，请手动粘贴内容。',
  js_alert_clipboard_empty: '剪贴板内容为空。',
  js_alert_clipboard_error: '无法读取剪贴板内容。\n请确保页面处于激活状态，并已授予浏览器读取剪贴板的权限。',
  js_alert_query_no_config: '请先在设置中配置API地址和密钥！',
  js_alert_query_failed: '查询模型失败: {{msg}}',
  js_alert_query_success: '成功获取到 {{n}} 个可用模型！',
  js_alert_no_mindmap: '找不到思维导图，无法导出。',
  js_alert_export_error: '导出{{type}}图片时发生错误，请稍后重试。',
  js_zoom_in: '放大',
  js_zoom_out: '缩小',
  js_reset_zoom: '重置缩放',
  mobileTabEditor: '编辑',
  mobileTabMindmap: '导图',
  mobileTabLandscape: '横屏',
  mobileCloseLandscape: '退出横屏',
  defaultMarkdown: `# 🤖 AI思维导图生成

## ✨ 新功能特性
### 🎯 智能生成
- ✨ **自定义生成版本数量 (1-5)**
- AI驱动的内容创建
### 🔧 自定义配置
- 便捷的模型选择
- 弹窗配置API密钥
- 个性化设置

## 🚀 使用流程
### 📝 输入内容
- 在左侧输入框描述内容
- 或直接粘贴Markdown
### 🤖 AI处理
- **拖动滑块选择版本数**
- 点击生成按钮
### 🎨 可视化展示
- **点击选项卡切换不同版本**
- 实时预览思维导图
- 一键导出SVG&PNG图片`,
  defaultPrompt: `{{CONTENT}}
请按以下设定的思维导图架构师的身份对以上内容执行任务。

# Role: 思维导图架构师

## Profile
- description: 精通信息结构提取与层次关系分析，能够将复杂文本内容转化为清晰、分层的思维导图格式，便于阅读与理解。
- background: 拥有丰富的信息架构设计经验，熟悉多种内容结构优化方法，擅长运用Markdown及视觉元素增强内容表现力。
- personality: 细致严谨，逻辑清晰，注重条理性与用户体验，表达简洁明了。
- expertise: 信息架构设计、内容层次化、结构化表达、Markdown思维导图制作。
- target_audience: 内容编辑人员、文档撰写者、项目管理者、学习者及需要清晰信息结构的用户群体。

## Skills

1. 信息结构设计
   - 层级划分: 根据内容逻辑精准划分多层级结构
   - 关系梳理: 明确主次、分支及关联节点
   - 内容细化: 优化内容条目，细化分点展开
   - 逻辑优化: 保持结构简洁且易读

2. Markdown及可视化表达
   - 思维导图格式制作: 灵活使用#、##、###等级标题表达层次
   - 列表运用: 以条目列表形式呈现节点内容
   - 语言保持: 保持原文语言与用词
   - Emoji增强: 合理使用Emoji增强视觉导向与可读性

3. Rules

1. 基本原则：
   - 原文尊重：所有内容必须保留原文句子，杜绝改写或删减关键内容
   - 结构清晰：层级分明，结构简洁，避免内容堆叠不清晰
   - 语言一致：输出语言应与原文本主要语言保持一致
   - 可视增强：尽量融合Emoji，增强层次感和视觉舒适度


2. 行为准则：
   - 不添不减：不得添加任何解释、观点或额外信息
   - 句式优化：适度调整句式以提升表达通顺度和条理明晰
   - 内容拆分：长句或内容过多时合理拆分并保持逻辑完整
   - 专业严谨：坚持专业风格，避免模糊和歧义表述


3. 限制条件：
   - 不允许自创内容：不加入个人见解或未出现的信息
   - 禁止格式错误：排版清晰，禁止Markdown语法错误
   - 中心主题限制：中心主题字数限制10个字左右
   - 层级限制：最少3级，层级数可根据内容合理扩展无上限

## Workflows

- 目标: 将原始文本内容转化为清晰分层的思维导图Markdown格式，便于直接阅读和内容解析
- 步骤 1: 彻底阅读并理解原始内容，分析其内在逻辑和层级关系
- 步骤 2: 按照层级使用#标题标记，条目采用列表形式排列，确保不少于三级层级
- 步骤 3: 对长句进行分点拆解，调整句式增强表述清晰度，并合适插入Emoji提升视觉效果
- 步骤 4: 最终输出为纯Markdown格式，只输出 Markdown文本本体，不要使用代码块包裹。
- 预期结果: 输出符合规范的Markdown格式思维导图文本，层级明晰，内容完整，语言统一，无任何附加解释或内容`
}

export default aimarkmap
