const { defineConfig } = require('@vue/cli-service')
// 引入等比适配插件
const px2rem = require("postcss-px2rem");
// 配置基本大小
const postcss = px2rem({
  //配置rem基准值 基准大小 baseSize
  remUnit: 192, // 设计稿尺寸1920/10
});
module.exports = {
 chainWebpack: (config) => {
     config.module
    .rule("css")
    .test(/\.css$/)
    .oneOf("vue")
    .use("px2rem-loader")
    .loader("px2rem-loader")
    .options({
      remUnit: 192,
      remPrecision: 8,
    })
    .end();
 },
  css: {
    loaderOptions: {
      postcss: {
        plugins: [postcss]
      },
    },
  },
}
module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false
})
