'use strict';
const path = require('path')
const pkgDir = require('pkg-dir').sync
const npminstall = require('npminstall')
const pathExists = require('path-exists').sync
const fse = require('fs-extra')

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
    // package缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_')
  }

  async prepare () {
    if (this.storeDir && !pathExists(this.storeDir)) {
      // 不存在就创建
      fse.mkdirSync(this.storeDir)
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName)
    }
  }

  get cacheFilePath () {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
  }

  getSpecificCacheFilePath (packageVersion) {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`)
  }

  // 判断当前package是否存在
  async exists () {
    if (this.storeDir) { // 有缓存文件
      await this.prepare()
      return pathExists(this.cacheFilePath)
    } else {
      return pathExists(this.targetPath)
    }
  }

  // 安装package
  async install () {
    await this.prepare()
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
  async update () {
    await this.prepare()
    // 1获取最新的npm模块版本
    const latestPackageVersion = await getNpmLatestVersion(this.packageName)
    // 2查询最新版本号对应的路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion)
    // 3如果不存在直接安装
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [
          {
            name: this.packageName,
            version: latestPackageVersion
          }
        ]
      })
      this.packageVersion = latestPackageVersion
    } else {
      this.packageVersion = latestPackageVersion
    }
  }

  // 获取入口文件的路径
  getRootFilePath () {
    function _getRootFile(targetPath) {
      // 获取package.json所在目录
      const dir = pkgDir(targetPath)
      if (dir) {
        // 读取package.json
        const pkgFile = require(path.resolve(dir, 'package.json'))
        if (pkgFile && pkgFile.main) {
          // 路径的兼容
          return formatPath(path.resolve(dir, pkgFile.main))
        }
      }
      return null
    }
    if (this.storeDir) {
      return _getRootFile(this.cacheFilePath)
    } else {
      return _getRootFile(this.targetPath)
    }
  }
}

module.exports = Package;
