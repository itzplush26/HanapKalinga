const path = require('path');
const resolve = require('resolve');

module.exports = (request, options) => {
  if (request === 'react') {
    return resolve.sync('react', {
      basedir: path.resolve(__dirname, '../node_modules/react'),
    });
  }
  return options.defaultResolver(request, options);
};
