const Stream = require('stream').Stream
const { fillReqUrl } = require('../../utils')
const Url = require('url')

class RequestHandler {
	setMiddleware(middlewaresFun) {
		this.middlewaresFun = middlewaresFun
	}

	responseWriteHandler(ctx) {
		const { res } = ctx
		if (!res.writable || res.finished) {
			return false
		}
		const { body } = res
		if (!body) {
			return res.end('')
		}
		if (Buffer.isBuffer(body) || typeof body === 'string') {
			return res.end(body)
		}
		if (body instanceof Stream) {
			return body.pipe(res)
		}
		return res.end(JSON.stringify(body))
	}

	handle(req, res) {
		const ctx = { req, res }
		fillReqUrl(req, req.connection.encrypted ? 'https' : 'http') // 直接访问没有host, url补齐
		this.middlewaresFun(ctx).then(() => this.responseWriteHandler(ctx))
	}
}

module.exports = RequestHandler
