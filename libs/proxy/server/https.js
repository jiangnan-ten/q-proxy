const https = require('https')
const fs = require('fs')
const path = require('path')
const { fillReqUrl } = require('../../utils')

class HttpsProxy {
	constructor() {
		const options = {
			key: fs.readFileSync(
				path.resolve(__dirname, '../../../', 'localhost+2-key.pem')
			),
			cert: fs.readFileSync(
				path.resolve(__dirname, '../../../', 'localhost+2.pem')
			)
		}
		this.server = https.createServer(options)
	}

	setHttpHandler(httpHandler) {
		this.server.on('request', (req, res) => {
			fillReqUrl(req, 'https')
			httpHandler.handle(req, res)
		})
	}

	listen(port) {
		this.server.listen(port, '0.0.0.0')
	}
}

module.exports = HttpsProxy
