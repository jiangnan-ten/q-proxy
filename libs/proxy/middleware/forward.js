const zlib = require('zlib')
const https = require('https')
const http = require('http')
const Url = require('url')
const _ = require('lodash')

const isSupportBrotli = typeof zlib.createBrotliDecompress === 'function'

class ForwardMiddleware {
	getRequestOptions(req) {
		const url = new Url.URL(req.url)
		const isHttps = url.protocol && url.protocol.startsWith('https')
		const port = url.port || (isHttps ? 443 : 80)
		return {
			auth: url.auth,
			headers: req.headers,
			host: url.host,
			hostname: url.hostname,
			method: req.method,
			path: url.pathname + (url.search ? url.search : ''),
			port,
			protocol: url.protocol,
			rejectUnauthorized: false
		}
	}

	fixRequestHeaders(req, options) {
		// fix request headers
		// 插件修改 req.body 后，以插件提供的 body 为请求体内容，重新设置 content-length header
		if (req.body && req.body.length) {
			options.headers && (options.headers['content-length'] = req.body.length)
		}

		// node version under v11.7.0, not support brotli algorithm
		if (
			!isSupportBrotli &&
			options.headers &&
			options.headers['accept-encoding']
		) {
			const accpetEncoding = options.headers['accept-encoding']
			accpetEncoding
				.split(',')
				.map(encoding => encoding.trim())
				.filter(encoding => encoding !== 'br')
				.join(', ')
		}
	}

	async middleware(ctx) {
		return new Promise((resolve, reject) => {
			const { req, res } = ctx
			if (!res.writable || res.finished || !_.isNil(res.body)) {
				return resolve()
			}
			const options = this.getRequestOptions(req)
			const client =
				options.protocol && options.protocol.startsWith('https') ? https : http

			this.fixRequestHeaders(req, options)

			const proxyReq = client.request(options, proxyRes => {
				res.statusCode = proxyRes.statusCode
				Object.keys(proxyRes.headers).forEach(headerName => {
					res.setHeader(headerName, proxyRes.headers[headerName])
				})
				res.body = proxyRes
				return resolve()
			})

			if (req.body) {
				proxyReq.end(req.body)
			} else {
				req.pipe(proxyReq)
			}
			proxyReq.on('error', e => reject(e))
		})
	}
}

module.exports = ForwardMiddleware
