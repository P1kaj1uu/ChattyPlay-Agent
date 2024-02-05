/**
 * @Description: 压缩图片到指定大小
 * @Author: 不见水星记（P1kaj1uu）
 * @param baseImg base64图片
 * @param maxSize 单位kb
 */
export function compressImgBySize(baseImg, maxSize = 200) {
  return new Promise((resolve) => {
    // 计算图片大小
    const strLength = baseImg.length
    const fileLength = parseInt(strLength - (strLength / 8) * 2)
    let size = parseInt((fileLength / 1024).toFixed(2))
    // 判断图片是否符合指定大小要求
    if (size <= maxSize) {
      resolve(baseImg)
      return
    }
    // 创建image对象
    const img = new Image()
    if (baseImg.indexOf('data:image/') !== -1) {
      img.src = baseImg
    } else {
      img.src = 'data:image/jpeg;base64,' + baseImg
    }
    img.onload = () => {
      // 把image对象 转换为 canvas对象
      const canvas = imgToCanvas(img)
      let resUrl = ''
      // 图片质量，范围：0 ~ 1
      let quality = 0.9
      // 当图片大小大于指定maxSize，图片质量大于0时继续通过降低图片资料来压缩
      while (size > maxSize && quality > 0) {
        // 在canvas上绘制该HTMLImageElement，得到图片base64
        resUrl = canvas
          .toDataURL('image/jpeg', quality)
          .replace(/^data:image\/\w+;base64,/, '')
        const resLength = resUrl.length
        // 计算绘制出的base64图片大小
        const resFileLength = parseInt(resLength - (resLength / 8) * 2)
        size = parseInt((resFileLength / 1024).toFixed(2))
        // 降低图片质量
        quality = (quality - 0.1).toFixed(1)
      }
      resolve(resUrl)
    }
    img.onerror = () => {
      resolve(baseImg)
    }
  })
}

// 把image 转换为 canvas对象
export function imgToCanvas(image) {
  let canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  canvas.getContext('2d').drawImage(image, 0, 0)
  return canvas
}
