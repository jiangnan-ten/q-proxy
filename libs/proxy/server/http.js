const http = require('http')

class HttpProxy {
	constructor() {
		this.server = http.createServer()
	}

	setHttpHandler(httpHandler) {
		this.server.on('request', httpHandler.handle.bind(httpHandler))
	}

	setConnectHandler(connectHandler) {
		this.server.on('connect', connectHandler.handle.bind(connectHandler))
	}

	listen(port) {
		this.server.listen(port, '0.0.0.0')
	}
}

module.exports = HttpProxy
