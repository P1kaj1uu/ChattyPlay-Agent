const HtmlWebpackPlugin = require('html-webpack-plugin')
const packageJson = require('./package.json')

module.exports = {
  devServer: {
    proxy: {
      '/trans': {
        target: 'https://api.fanyi.baidu.com/api',
        changeOrigin: true,
        pathRewrite: {
          '^/trans': '/trans'
        }
      },
      '/api': {
        target: 'https://xxxxx',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        }
      },
    }
  },
}
