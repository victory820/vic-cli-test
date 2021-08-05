'use strict';
const path = require('path')
const pkgDir = require('pkg-dir').sync
const npminstall = require('npminstall')
const pathExists = require('path-exists').sync

const { isObject } = require('@vic-cli-test/utils')
const formatPath = require('@vic-cli-test/format-path')
const { getDefaultRegistry, getNpmLatestVersion } = require('@vic-cli-test/get-npm-info')

class Package {
  constructor (options) {
    if (!options) {
      throw new Error('Package类的options参数不能为空')
    }
    if (!isObject(options)) {
      throw new Error('Package类的options参数必须为对象')
    }
    // package的路径
    this.targetPath = options.targetPath
    // 缓存路径
    this.storeDir = options.storeDir
    // package的name
    this.packageName = options.packageName
    // package的version
    this.packageVersion = options.packageVersion
  }

  async prepare () {
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName)
    }
    console.log('--99--')
    console.log(this.packageVersion)
  }
  // 判断当前package是否存在
  async exists () {
    if (this.storeDir) { // 有缓存文件
      await this.prepare()
    } else {
      return pathExists(this.targetPath)
    }
  }

  // 安装package
  install () {
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion
        }
      ]
    })
  }

  // 更新
  update () {

  }

  // 获取入口文件的路径
  getRootFilePath () {
    // 获取package.json所在目录
    const dir = pkgDir(this.targetPath)
    if (dir) {
      // 读取package.json
      const pkgFile = require(path.resolve(dir, 'package.json'))
      // 寻找main/lib
      if (pkgFile && pkgFile.main) {
        // 路径的兼容（macOS/windows）
        return formatPath(path.resolve(dir, pkgFile.main))
      }
    }
    return null
  }
}

module.exports = Package;
