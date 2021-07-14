const { compose } = require('../utils')
const HttpProxy = require('./server/http')
const HttpsProxy = require('./server/https')
const { RequestHandler, ConnectHandler } = require('./handler')
const { RuleMiddleware, ForwardMiddleware } = require('./middleware')

// 顺序不能错 ForwardMiddleware是最终转发的中间件
const Middlewares = [RuleMiddleware, ForwardMiddleware]

class Proxy {
	constructor() {
		this.middlewares = []
		this.httpProxy = new HttpProxy()
		this.httpsProxy = new HttpsProxy()
		this.handlers = {
			request: new RequestHandler(),
			connect: new ConnectHandler()
		}
	}

	async useMiddleware() {
		for (const Middleware of Middlewares) {
			const middleIns = new Middleware()
			if (middleIns.init) {
				await middleIns.init()
			}

			this.middlewares.push(middleIns.middleware.bind(middleIns))
		}
	}

	async init() {
		await this.useMiddleware()
		this.handlers.request.setMiddleware(compose(this.middlewares))

		this.httpProxy.setHttpHandler(this.handlers.request)
		this.httpProxy.setConnectHandler(this.handlers.connect)

		this.httpsProxy.setHttpHandler(this.handlers.request)
	}

	listen(port) {
		this.httpProxy.listen(port)
		this.httpsProxy.listen(global.qProxy.httpsProxyPort)
	}
}

module.exports = Proxy
