'use strict';

const path = require('path')

const Package = require('@vic-cli-test/package')
const log = require('@vic-cli-test/log')

const SETTINGS = {
  init: '@vic-cli-test/init'
}

const CACHE_DIR = 'dependencies'

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH
  const homePath = process.env.CLI_HOME_PATH
  let storeDir = ''
  let pkg = null
  log.verbose(targetPath)
  log.verbose(homePath)

  const cmdObj = arguments[arguments.length - 1]
  const cmdName = cmdObj.name()
  const packageName = SETTINGS[cmdName]
  const packageVersion = 'latest'

  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR) // 生成缓存路径
    storeDir = path.resolve(targetPath, 'node_modules')
    log.verbose('targetPath:', targetPath)
    log.verbose('storeDir::', storeDir)
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion
    })
    if (pkg.exists()) {
      // 更新package
    } else {
      // 安装package
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion
    })
  }
  const rootFile = pkg.getRootFilePath()
  if (rootFile) {
    require(rootFile).apply(null, arguments)
  }
}

module.exports = exec;
