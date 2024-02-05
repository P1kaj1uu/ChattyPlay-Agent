/*
 * @Description: 封装GPT响应内容流式输出
 * @Author: 不见水星记（P1kaj1uu）
 */
import Vue from 'vue'
import { toBottom } from './messageToBottom'

export const resolveStreamResponse = async (
  fetchPromise,
  onStreaming,
  onFailed,
  onFinished,
  button1,
  button2
) => {
  fetchPromise.catch((err) => {
    onFailed(err)
  })
  // 接受一个fetchPromise作为参数，该Promise用于发起异步请求
  const response = await fetchPromise
  // 通过response.body.getReader()获取到响应内容的reader对象
  const reader = response.body.getReader()
  // 使用while循环不停地读取响应内容，直到done为true时停止读取
  while (true) {
    const { value, done } = await reader.read()
    // 通过TextDecoder将二进制数据解码为UTF-8编码的字符串
    const utf8Decoder = new TextDecoder('utf-8')
    let data = value ? utf8Decoder.decode(value, { stream: true }) : ''
    console.log(data)
    const ids = data.replaceAll(`data: `, '')
                    .replaceAll('[DONE]', '')
                    .split('\n')
                    .filter(item => item !== '')
                    .filter(item => item !== undefined)[1]
    if (Boolean(!localStorage.getItem('newChatId')) && Boolean(ids) && Boolean(JSON.parse(ids).newChatId)) {
      localStorage.setItem('newChatId', JSON.parse(ids).newChatId)
    }
    // 对字符串进行处理，将"data: "和"[DONE]"替换掉，然后使用split方法将字符串分割成一个个的JSON字符串
    // 使用map方法将每个JSON字符串解析为JS对象，然后遍历这些对象并使用onStreaming回调函数进行处理
    try {
      /* data = data
        .replaceAll(`data: `, '')
        .replaceAll('[DONE]', '')
        .split('\n')
        .filter((_) => _ !== '')
        .map((_) => JSON.parse(_))
      data.forEach((_) => onStreaming(_)) */
      data = data
        .replaceAll(`data: `, '')
        .replaceAll('[DONE]', '')
        .split('\n')
        .filter(item => item !== '')
        .map(item => {
          if (item.indexOf('"content":') !== -1) {
            const stringify = JSON.stringify(item)
            return JSON.parse(stringify)
          }
        })
        .filter(item => item !== undefined)
      data.forEach((_) => onStreaming(_))
    } catch (e) {
      onFailed(e)
    }
    // 如果响应内容已经读取完毕，则通过onFinished回调函数进行处理，同时停止循环
    if (done) {
      document.querySelector('.loadEffect').style.display = 'none'
      document.querySelector('.loader').style.visibility = 'hidden'
      button1.disabled = false
      button2.disabled = false
      toBottom()
      onFinished(response)
      break
    } else {
      button1.disabled = true
      button2.disabled = true
    }
  }
}
