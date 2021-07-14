const Proxy = require('./proxy')
const { log } = require('../libs/utils')

global.qProxy = {
	httpsProxyPort: 4433
}

class App {
	constructor(proxyPort, configDir) {
		global.qProxy.httpProxyPort = proxyPort
		global.qProxy.configDir = configDir

		this.proxy = new Proxy()
	}

	async init() {
		await this.proxy.init()
	}

	start() {
		this.proxy.listen(global.qProxy.httpProxyPort)
		log(`proxy端口运行在: ${global.qProxy.httpProxyPort}`)
	}
}

module.exports = App
