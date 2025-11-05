const path = require('path')
const webpack = require('webpack')

module.exports = () => {
  return {
    entry: './public/js/main.js',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'public/js/build'),
      publicPath: '/'
    },
  }
}
