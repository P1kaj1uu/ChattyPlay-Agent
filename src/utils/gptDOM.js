/*
 * @Description: 封装GPT回答的内容的DOM结构
 * @Author: 不见水星记（P1kaj1uu）
*/
import Vue from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import { Message } from 'element-ui'
Vue.prototype.$message = Message

// 复制GPT回答的内容
const copy = (e) => {
  const input = e.target.parentNode.parentNode.nextElementSibling.querySelector('#markdown-content')
  const textarea = document.createElement('textarea')
  textarea.value = input.innerText || input.textContent
  // 将隐藏的 <textarea> 元素添加到文档中，并选中其中的文本
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  // 删除隐藏的 <textarea> 元素
  document.body.removeChild(textarea)
  Vue.prototype.$message.success('复制成功')
}

const markdown = (content) => {
  const md = new MarkdownIt({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return '<pre class="hljs"><code>' +
            hljs.highlight(lang, str, true).value +
            '</code></pre>'
          } catch (__) { }
      }
      return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
    }
  })
  const result = md.render(content)
  return result
}

export const getGPTDOM = (value, time) => {
  // 获取内容区域元素
  let content = document.querySelector('.chat-content')
  // 创建一段元素
  const chatWrapper = document.createElement('div')
  chatWrapper.className = 'chat-wrapper'
  chatWrapper.style.height = '0px'
  const chatFriend = document.createElement('div')
  chatFriend.className = 'chat-friend'
  chatFriend.style.width = '80%'
  chatFriend.style.float = 'left'
  chatFriend.style.marginBottom = '20px'
  chatFriend.style.position = 'relative'
  chatFriend.style.display = 'flex'
  chatFriend.style.flexDirection = 'column'
  chatFriend.style.justifyContent = 'flex-end'
  chatFriend.style.alignItems = 'flex-start'
  const chatText = document.createElement('div')
  chatText.className = 'chat-text'
  chatText.style.float = 'left'
  chatText.style.maxWidth = '90%'
  chatText.style.padding = '15px'
  chatText.style.borderRadius = '20px 20px 20px 5px'
  chatText.style.backgroundColor = '#fff'
  const elRow = document.createElement('div')
  elRow.className = 'el-row'
  elRow.style.marginLeft = '-10px'
  elRow.style.marginRight = '-10px'
  const elCol1 = document.createElement('div')
  elCol1.className = 'el-col el-col-2'
  elCol1.style.paddingLeft = '10px'
  elCol1.style.paddingRight = '10px'
  elCol1.style.cursor = 'pointer'
  elCol1.addEventListener('click', copy)
  const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svgIcon.setAttribute('t', 1679666016648)
  svgIcon.setAttribute('viewBox', '0 0 1024 1024')
  svgIcon.setAttribute('version', '1.1')
  svgIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svgIcon.setAttribute('width', '22')
  svgIcon.setAttribute('height', '22')
  svgIcon.setAttribute('class', 'icon')
  const pathIcon = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  pathIcon.setAttribute('fill', '#909399')
  pathIcon.setAttribute('d', 'M661.333333 234.666667A64 64 0 0 1 725.333333 298.666667v597.333333a64 64 0 0 1-64 64h-469.333333A64 64 0 0 1 128 896V298.666667a64 64 0 0 1 64-64z m-21.333333 85.333333H213.333333v554.666667h426.666667v-554.666667z m191.829333-256a64 64 0 0 1 63.744 57.856l0.256 6.144v575.701333a42.666667 42.666667 0 0 1-85.034666 4.992l-0.298667-4.992V149.333333H384a42.666667 42.666667 0 0 1-42.368-37.674666L341.333333 106.666667a42.666667 42.666667 0 0 1 37.674667-42.368L384 64h447.829333z')
  const elCol2 = document.createElement('div')
  elCol2.className = 'el-col el-col-21'
  elCol2.style.paddingLeft = '10px'
  elCol2.style.paddingRight = '10px'
  const markdownBody = document.createElement('div')
  markdownBody.className = 'markdown-body'
  markdownBody.style.webkitTextSizeAdjust = '100%'
  markdownBody.style.color = '#24292e'
  markdownBody.style.fontFamily = '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji'
  markdownBody.style.fontSize = '16px'
  markdownBody.style.lineHeight = '1.5'
  markdownBody.style.wordWrap = 'break-word'
  if (markdownBody.children.length >= 2) {
    markdownBody.firstElementChild.style.marginTop = '0 !important'
    markdownBody.lastElementChild.style.marginBottom = '0 !important'
  }
  const markdownContent = document.createElement('p')
  markdownContent.id = 'markdown-content'
  markdownContent.textContent = value
  markdownContent.style.whiteSpace = 'pre-wrap'
  const infoTime = document.createElement('div')
  infoTime.className = 'info-time'
  infoTime.style.margin = '10px 0'
  infoTime.style.color = '#fff'
  infoTime.style.fontSize = '14px'
  infoTime.style.display = 'flex'
  infoTime.style.justifyContent = 'flex-start'
  infoTime.style.alignItems = 'center'
  const imgElem = document.createElement('img')
  imgElem.src = require('@/assets/images/gpt/chatgpt.jpg')
  imgElem.style.width = '30px'
  imgElem.style.height = '30px'
  imgElem.style.borderRadius = '50%'
  imgElem.style.verticalAlign = 'middle'
  imgElem.style.marginLeft = '10px'
  const gptNameSpan = document.createElement('span')
  gptNameSpan.className = 'gptName'
  gptNameSpan.textContent = 'ChatGPT'
  gptNameSpan.style.lineHeight = '30px'
  gptNameSpan.style.margin = '0 10px'
  const timeSpan = document.createElement('span')
  timeSpan.textContent = time
  timeSpan.style.color = 'rgb(101, 104, 115)'
  timeSpan.style.marginRight = '10px'
  timeSpan.style.verticalAlign = 'middle'
  timeSpan.style.height = '30px'
  timeSpan.style.lineHeight = '30px'
  // 将元素添加到父元素中
  svgIcon.appendChild(pathIcon)
  elCol1.appendChild(svgIcon)
  elRow.appendChild(elCol1)
  elRow.appendChild(elCol2)
  markdownBody.appendChild(markdownContent)
  chatText.appendChild(elRow)
  chatText.appendChild(markdownBody)
  chatFriend.appendChild(chatText)
  infoTime.appendChild(imgElem)
  infoTime.appendChild(gptNameSpan)
  infoTime.appendChild(timeSpan)
  chatFriend.appendChild(infoTime)
  chatWrapper.appendChild(chatFriend)
  // 追加到DOM中
  content.appendChild(chatWrapper)
}