/*
 * @Description: 封装睡眠等待的函数
 * @Author: 不见水星记（P1kaj1uu）
*/
export const sleep = async (t) => new Promise((resolve) => setTimeout(resolve, t))