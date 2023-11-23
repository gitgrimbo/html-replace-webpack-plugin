const path = require("path");

function HtmlReplaceWebpackPlugin(options) {
  options = Array.isArray(options) ? options : [options]

  options.forEach(option => {
    if (typeof option.pattern == 'undefined' || typeof option.replacement == 'undefined') {
      throw new Error('Both `pattern` and `replacement` options must be defined!')
    }
  })

  this.replace = (compiler) => (htmlPluginData, callback) => {
    options.forEach(option => {
      if (typeof option.replacement === 'function') {
        try {
          new RegExp(option.pattern)
        } catch (e) {
          throw new Error('Invalid `pattern` option provided, it must be a valid regex.')
        }

        const outputFile = path.resolve(compiler.outputPath, htmlPluginData.outputName);
        const replacement = (...args) => option.replacement(...[outputFile].concat(args));
        htmlPluginData.html = htmlPluginData.html.replace(option.pattern, replacement)
      } else {
        if (option.pattern instanceof RegExp)
          htmlPluginData.html = htmlPluginData.html.replace(option.pattern, option.replacement)
        else
          htmlPluginData.html = htmlPluginData.html.split(option.pattern).join(option.replacement)
      }
    })

    callback(null, htmlPluginData)
  }
}

HtmlReplaceWebpackPlugin.prototype.apply = function (compiler) {
  if (compiler.hooks) {
    compiler.hooks.compilation.tap('HtmlReplaceWebpackPlugin', compilation => {
      if (compilation.hooks.htmlWebpackPluginAfterHtmlProcessing) {
        compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(
          'HtmlReplaceWebpackPlugin',
          this.replace(compiler)
        )
      } else {
        var HtmlWebpackPlugin = require('html-webpack-plugin')

        if (!HtmlWebpackPlugin) {
          throw new Error(
            'Please ensure that `html-webpack-plugin` was placed before `html-replace-webpack-plugin` in your Webpack config if you were working with Webpack 4.x!'
          )
        }

        HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
          'HtmlReplaceWebpackPlugin',
          this.replace(compiler)
        )
      }
    })
  } else {
    compiler.plugin('compilation', compilation => {
      compilation.plugin('html-webpack-plugin-beforeEmit', this.replace(compiler))
    })
  }
}

module.exports = HtmlReplaceWebpackPlugin
