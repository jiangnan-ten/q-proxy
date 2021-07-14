const qs = require('qs')
const iconv = require('iconv-lite')

class MockService {
	getRes(body, urlObj, method, ctx) {
		if (typeof body === 'function') {
			return this.getResFun(body, urlObj, method, ctx)
		} else {
			return body
		}
	}

	async getResFun(body, urlObj, method, ctx) {
		const queryString = urlObj.searchParams.toString() || ''
		const queryObj = qs.parse(queryString)
		const reqBody = await this.getBody(ctx.req)
		const params = {
			url: urlObj.href,
			pathname: urlObj.pathname,
			body: reqBody,
			header: ctx.req.header,
			method,
			queryString,
			queryObj
		}

		return body.call(body, params)
	}

	getBody(req) {
		return new Promise((resolve, reject) => {
			let size = 0
			const chunks = []
			req.on('data', function (chunk) {
				chunks.push(chunk)
				size += chunk.length
			})
			req.on('end', function () {
				const buf = Buffer.concat(chunks, size)
				const str = iconv.decode(buf, 'utf8')
				return resolve(
					req.headers['content-type'].includes('application/json')
						? JSON.parse(str)
						: str
				)
			})
			req.on('error', reject)
		})
	}
}

module.exports = MockService
