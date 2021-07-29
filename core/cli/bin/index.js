#! /usr/bin/env node
const importLocal = require('import-local')

if (importLocal(__filename)) { // 加载本地文件
  require('npmlog').info('cli', '正在使用本地版本')
} else {
  require('../lib')(process.argv.slice(2))
}