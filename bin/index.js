#!/usr/bin/env node

const pkg = require('../package.json')
const { program } = require('commander')
const path = require('path')
const chalk = require('chalk')
const { checkNodeVersion, log } = require('../libs/utils')

const bootstrap = require('../libs/index')

const CONFIG_ROOT_PATH = path.resolve(__dirname, '..', 'config')
const PROXY_PORT = 8001

console.clear()
checkNodeVersion(pkg.engines.node)

program
	.name('q-proxy')
	.description('前端代理转发工具')
	.version(`当前版本 ${pkg.version}`)
	.usage('[options]')

program
	.option('-d --dir [dir]', '配置文件目录', CONFIG_ROOT_PATH)
	.option('-p --port [port]', '代理端口', PROXY_PORT)
	.action(async cmd => {
		await bootstrap(cmd)
	})

program.on('--help', () => {
	console.log()
	console.log(`运行 ${chalk.cyan(`q-proxy --help`)} 获取详情`)
})

program.parse(process.argv)

process.on('unhandledRejection', (reason, p) => {
	console.log(reason)
	log(reason, 'warning')
})

process.on('uncaughtException', err => {
	console.log(err)
	log(err, 'warning')
})
