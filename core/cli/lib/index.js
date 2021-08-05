'use strict';
const path = require('path')
const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const { Command } = require('commander')

const log = require('@vic-cli-test/log')
// const init = require('@vic-cli-test/init')
const exec = require('@vic-cli-test/exec')
const constant = require('./const')
const pkg = require('../package.json')

const program = new Command()

async function core() {
  try {
    await prepare()
    registerCommand()
  } catch (error) {
    log.error(error.message)
    if (program.opts().debug) {
      console.log(e)
    }
  }
}

function registerCommand () {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '')
  
  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制初始化项目')
    .action(exec)

  // 开启debug模式
  // 7.0版本后如下使用
  program.on('option:debug', function () {
    if (program.opts().debug) {
      process.env.LOG_LEVEL = 'verbose'
    } else {
      process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
  })
  // 指定targetPath
  program.on('option:targetPath', function() {
    process.env.CLI_TARGET_PATH = program.opts().targetPath
  })

  // 处理未知命令
  program.on('command:*', function(obj) {
    const availableCommands = program.commands.map(cmd => cmd.name())
    console.log(colors.red('未知的命令：', obj[0]))
    if (availableCommands.length > 0) {
      console.log(colors.red('可用命令：' + availableCommands.join(',')))
    }
  })

  program.parse(process.argv)

  if (program.args && program.args.length < 1) {
    program.outputHelp()
    console.log()
  }
}

async function prepare () {
  checkPkgVersion()
  checkNodeVersion()
  checkRoot()
  checkUserHome()
  checkEnv()
  await checkGlobalUpdate()
}

// 检查npm包是否为最新
async function checkGlobalUpdate () {
  // 1获取当前版本和模块名
  const currentVersion = pkg.version
  const npmName = pkg.name
  // 2调用npm API获取所有版本号
  const { getNpmSemverVersion } = require('@vic-cli-test/get-npm-info')
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
  // 3提取所有版本号，比对哪些版本号是大于当前版本号
  // 4获取最新的版本号，提示用户更新
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(colors.yellow(`请手动更新 ${npmName}, 当前版本：${currentVersion}, 最新版本：${lastVersion}
            更新命令：npm install -g ${npmName}`))
  }
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

module.exports = core;
