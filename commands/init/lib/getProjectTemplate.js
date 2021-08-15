const request = require('@vic-cli-test/request');

module.exports = function() {
  return request({
    url: '/project/template',
  });
};
