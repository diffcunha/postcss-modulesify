import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import { Transform } from 'stream';

class Postcssify extends Transform {

  constructor(filename, options) {
    super();
    this._data = '';
    this._filename = filename;
    this._options = options;
  }

  isValidExtension(filename) {
    return (/\.css$/.test(filename)
    );
  }

  _transform(buf, enc, next) {
    if (!this.isValidExtension(this._filename)) {
      this.push(buf);
      return next();
    }
    this._data += buf;
    next();
  }

  _flush(next) {
    if (!this.isValidExtension(this._filename)) {
      return next();
    }

    const rootDir = process.cwd();
    const filename = path.relative(rootDir, this._filename);

    const modules = require('postcss-modules')({
      generateScopedName: '[name]__[local]___[hash:base64:5]',
      getJSON: (cssFileName, json) => {
        this.push(`module.exports = ${ JSON.stringify(json) };`);
        next();
      }
    });

    const plugins = this._options.plugins || [];

    postcss([modules, ...plugins]).process(this._data, { from: filename, to: 'build/app.css', map: { inline: false } }).then(function (result) {
      fs.writeFileSync('build/app.css', result.css);
      // if ( result.map ) fs.writeFileSync('app.css.map', result.map);
      // console.log('css', result.css)
      // console.log('map', result.map)
    }).catch(err => {
      console.log('ERROR:', err);
    });
  }

}

module.exports = function (file, options) {
  console.log(options);
  return new Postcssify(file, options);
};
