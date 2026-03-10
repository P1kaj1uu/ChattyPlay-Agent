const aimarkmap = {
  promptSettingsBtn: '📝 Prompt Settings',
  apiSettingsBtn: '⚙️ API Settings',
  modelLabel: 'Model:',
  modelLabelMobile: 'Model Select:',
  queryBtn: '🔍 Query',
  versionsLabel: 'Versions:',
  generateBtn: 'AI Generate',
  showOriginalBtn: 'Original',
  showMarkdownBtn: 'Markdown',
  clearBtn: 'Clear',
  fullscreenBtn: 'Fullscreen',
  exportPngBtn: 'Export PNG',
  exportSvgBtn: 'Export SVG',
  mindmapPreviewTitle: '🧠 Mind Map Preview',
  thinkingMessage: 'AI is thinking...',
  apiSettingsTitle: '⚙️ API Settings',
  apiUrlLabel: 'API URL:',
  apiKeyLabel: 'API Key:',
  saveAndCloseBtn: '💾 Save & Close',
  promptSettingsTitle: '📝 Prompt Settings',
  promptTip: 'Please make sure to include <code>{{CONTENT}}</code> in the prompt template, which will be replaced with the input content from the left.',
  editNodeTitle: '✏️ Edit Node',
  deleteNodeBtn: '🗑️ Delete Node',
  helpBtnTitle: 'Help & Information',
  infoModalTitle: 'Instructions, Terms & Privacy Policy',
  infoModalContentHtml: `
    <h2>Instructions</h2>
    <ul>
      <li><strong>API Settings:</strong> On first use, click the <code>⚙️ API Settings</code> button in the top right to enter the API URL and Key provided by your AI service provider. The configuration will be saved locally in your browser.</li>
      <li><strong>Model Selection:</strong> In the left panel, select or enter the AI model you want to use. Click <code>🔍 Query</code> to automatically fetch a list of supported models from the API URL.</li>
      <li><strong>Content Input:</strong> In the largest input box on the left, you can enter descriptive text or paste pre-formatted Markdown content.</li>
      <li><strong>AI Generation:</strong> After entering descriptive text, use the slider to select the number of different versions you want the AI to generate (1-5), then click <code>🚀 AI Generate</code>.</li>
      <li><strong>Switching Versions:</strong> After successful generation, version tabs (e.g., "Version 1", "Version 2") will appear above the mind map preview area. Click to view different versions.</li>
      <li><strong>Editing and Viewing:</strong>
        <ul style="margin-top: 0.5rem;">
          <li>On the mind map, <strong>right-click</strong> any node to select <strong>"Edit Node"</strong> or <strong>"Delete Node"</strong>.</li>
          <li>The <code>📝 Show Markdown</code> button on the left allows you to view and edit the AI-generated Markdown source.</li>
        </ul>
      </li>
      <li><strong>Export & Fullscreen:</strong> Use the buttons in the top right of the preview area to export the current mind map as an <code>SVG</code> or <code>PNG</code> image, or enter fullscreen mode.</li>
    </ul>
    <h2>Terms of Service</h2>
    <p>By using AiMarkmap, you agree to the following terms:</p>
    <ul>
      <li>You are solely responsible for all content (including text, API keys, etc.) you input into this product. You must ensure that the input content does not infringe on any third-party rights and does not violate any applicable laws and regulations.</li>
      <li>You are prohibited from using this product for any form of malicious activity, including but not limited to, making a large number of unreasonable API requests, disseminating illegal information, or attacking third-party services.</li>
    </ul>
    <h2>Privacy Policy</h2>
    <p>We take your privacy very seriously. Please read the following information carefully about how we handle your data:</p>
    <h3>Data Collection</h3>
    <p>This product primarily handles two types of data:</p>
    <ul>
      <li><strong>Configuration Information:</strong> The API URL, API Key, selected model, and other settings you enter. This information is stored <strong>only on your own computer</strong> using the browser's <code>localStorage</code> technology to simplify your subsequent use and is not uploaded to AiMarkmap's servers.</li>
      <li><strong>Input Content:</strong> The text content you provide to generate mind maps.</li>
    </ul>
    <p>This product <strong>does not use</strong> any third-party analytics tools (like Google Analytics) to track your personal behavior.</p>
    <h3>Data Usage</h3>
    <p>All of your data processing is done on the <strong>client-side (in your browser)</strong>. The process is as follows:</p>
    <ul>
      <li>Your API key and input content are combined into a request by your browser and sent directly to the third-party AI service you specify in the settings (such as OpenAI, Google AI, etc.) only when you click the "AI Generate" button.</li>
      <li><strong>AiMarkmap's servers do not store, proxy, or have any visibility into</strong> your API key and input content. The data transmission path is: Your Browser -> Your Specified AI Service Provider.</li>
    </ul>
    <h3>Third-Party Services</h3>
    <p>As a client-side tool, this product calls third-party AI services based on your configuration. The data you send is subject to the privacy policy and data usage terms of the AI service provider you use. We strongly recommend that you review the official privacy policies of the respective service providers before use.</p>
    <h2>Disclaimer</h2>
    <ul>
      <li><strong>Accuracy of AI-Generated Content:</strong> All content generated by AI models is for reference only. We do not guarantee its accuracy, completeness, or suitability. You need to judge for yourself and are responsible for all consequences arising from the use of these results.</li>
      <li><strong>Service Availability:</strong> As this product relies on network connectivity and the stability of third-party API services, we do not promise that the service will be 100% uninterrupted or error-free. We do not assume any responsibility for service unavailability caused by network issues, API provider failures, or your own configuration errors.</li>
    </ul>`,
  customModelInputPlaceholder: 'Enter custom model name',
  topicInputPlaceholder: 'Enter or paste Markdown directly, or input text and click "AI Generate"...',
  contentDisplayPlaceholder: 'Edit content...',
  apiUrlPlaceholder: 'AI API Address',
  apiKeyPlaceholder: 'API Key',
  toggleVisibilityTitle: 'Show/Hide Key',
  promptInputPlaceholder: 'Edit AI Prompt template here...',
  editNodePlaceholder: 'Enter the new content for the node...',
  js_generating: 'Generating...',
  js_exporting: 'Exporting...',
  js_querying: 'Querying...',
  js_exit_fullscreen: 'Exit Fullscreen',
  js_fullscreen: 'Fullscreen',
  js_status_requesting: 'Initiating AI request...',
  js_status_generated: 'Successfully generated {{s}}/{{n}} versions...',
  js_status_done: 'Generation complete! {{n}} valid versions available.',
  js_tab_version: 'Version {{i}}',
  js_alert_no_content: 'Please enter content first!',
  js_alert_all_failed: 'All AI generation requests failed or returned empty content. Please check API settings and network.',
  js_alert_gen_failed: 'AI generation failed: {{msg}}',
  js_alert_no_clipboard: "Your browser does not support the Clipboard API. Please paste the content manually.",
  js_alert_clipboard_empty: 'Clipboard is empty.',
  js_alert_clipboard_error: 'Could not read from clipboard.\nPlease ensure the page is active and has permission to read the clipboard.',
  js_alert_query_no_config: 'Please configure API URL and Key in settings first!',
  js_alert_query_failed: 'Query models failed: {{msg}}',
  js_alert_query_success: 'Successfully fetched {{n}} available models!',
  js_alert_no_mindmap: 'Could not find the mind map to export.',
  js_alert_export_error: 'An error occurred while exporting the {{type}} image. Please try again later.',
  js_zoom_in: 'Zoom In',
  js_zoom_out: 'Zoom Out',
  js_reset_zoom: 'Reset Zoom',
  mobileTabEditor: 'Edit',
  mobileTabMindmap: 'Map',
  mobileTabLandscape: 'Rotate',
  mobileCloseLandscape: 'Exit',
  defaultMarkdown: `# 🤖 AI Mind Map Generation - AiMarkmap

## ✨ Features
### 🎯 Smart Generation
- ✨ **Custom number of versions (1-5)**
- AI-driven content creation
### 🔧 Custom Configuration
- Easy model selection
- API key configuration via modal
- Personalized settings

## 🚀 How to Use
### 📝 Input Content
- Describe content in the left input box
- Or paste Markdown directly
### 🤖 AI Processing
- **Use the slider to select version count**
- Click the generate button
### 🎨 Visualization
- **Click tabs to switch between versions**
- Real-time mind map preview
- One-click PNG export`,
  defaultPrompt: `You are an expert in information architecture, skilled at extracting the structure and hierarchy of information. Please output the following content in Markdown format for a mind map: "{{CONTENT}}".

Please adhere to the following requirements:

1.  Content Analysis:
    - Analyze the inherent logical structure of the content and elaborate on the hierarchy as much as possible, expanding on each point.

2.  Structural Requirements:
    - Keep the structure clear for easy reading and parsing.
    - Use clear hierarchies with #, ##, ###, etc., for different levels.
    - Use the original language of the text for all nodes.
    - Present items in the content as lists.
    - The central topic should be around 10 words.
    - There should be a minimum of 3 levels, with no maximum limit.
    - If a level or branch contains too much text, split the content into same-level items or create deeper levels to keep the structure clean and concise.

3.  Content Handling:
    - Preserve the original sentences.
    - Do not add explanations or extra comments.
    - Do not add your own opinions or information outside the provided text.
    - Minor sentence adjustments for clarity are acceptable.
    - Long or complex sentences can be broken down into bullet points.

4.  Enhance Visibility:
    - Use Emoji to improve readability where appropriate.

5.  Output Language:
    - If the main content of the original text is not Chinese, output all Markdown content in the language of the original text.

6.  Output Format:
    - The final output must be in pure Markdown format.
    - Output only the Markdown text itself.
    - Do not wrap the output in code blocks.`
}

export default aimarkmap
