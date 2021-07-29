'use strict';
const path = require('path')
const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync

const log = require('@vic-cli-test/log')
const constant = require('./const')

module.exports = core;

const pkg = require('../package.json')
let args

async function core() {
  try {
    checkPkgVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkInputArgs()
    checkEnv()
    await checkGlobalUpdate()
  } catch (error) {
    log.error(error.message)
  }
}
// 检查npm包是否为最新
async function checkGlobalUpdate () {
  // 1获取当前版本和模块名
  const currentVersion = pkg.version
  const npmName = pkg.name
  // 2调用npm API获取所有版本号
  const { getNpmVersions } = require('@vic-cli-test/get-npm-info')
  const versions = await getNpmVersions(npmName)
  console.log(versions)
  // 3提取所有版本号，比对哪些版本号是大于当前版本号
  // 4获取最新的版本号，提示用户更新
}

// 检查环境变量
function checkEnv () {
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: path.resolve(userHome, '.env')
    })
  }
  createDefaultConfig()
  log.verbose('环境变量', process.env.CLI_HOME_PATH)
}
// 设置全局默认配置
function createDefaultConfig () {
  const cliConfig = {
    home: userHome
  }
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome
}

// 检查参数是否有debug，如果是需要更改错误级别
function checkInputArgs () {
  const minimist = require('minimist')
  args = minimist(process.argv.slice(2))
  checkArgs()
}
function checkArgs () {
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
}

// 检查主目录是否存在
function checkUserHome () {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red(`当前登录用户主目录不存在`))
  }
}

// 检查系统权限，防止创建的文件没有超级管理员权限无法访问
function checkRoot () {
  // 处理后不管是root启动还是指定账户启动，都一样
  const rootCheck = require('root-check')
  rootCheck()
}

// 检查node版本，防止低版本API无法使用
function checkNodeVersion () {
  // 获取当前版本
  const currentVersion = process.version
  // 是否满足最低版本要求
  const lowestVersion = constant.LOWEST_NODE_VERSION
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(colors.red(`脚手架需要 v${lowestVersion} 以上版本的nodejs`))
  }
}

// 检查包版本，用来判断是否为最新
function checkPkgVersion () {
  log.info('cli', pkg.version)
}
