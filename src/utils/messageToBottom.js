/*
 * @Description: 封装消息滚动到底部的方法
 * @Author: 不见水星记（P1kaj1uu）
*/
export const toBottom = () => {
  const content = document.querySelector('.chat-content')
  content.scrollTop = content.scrollHeight
}