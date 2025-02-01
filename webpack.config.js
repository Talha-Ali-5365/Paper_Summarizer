const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    app: './src/app.js',
    content: './src/content.js',
    popup: './src/popup.js',
    background: './src/background.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  chrome: '58'
                }
              }]
            ]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    fallback: {
      fs: false,
      path: false,
      crypto: false
    }
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '' },
        {
          from: 'node_modules/pdfjs-dist/build/pdf.worker.min.js',
          to: 'pdf.worker.min.js'
        }
      ]
    })
  ]
};