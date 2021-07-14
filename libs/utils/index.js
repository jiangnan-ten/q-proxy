const chalk = require('chalk')
const semver = require('semver')
const Url = require('url')

function log(msg, type = 'info', emoji = '') {
	const map = {
		success: 'green',
		error: 'red',
		warning: 'yellow',
		info: 'cyan'
	}

	const emojiMap = {
		success: '🎉',
		error: '❗',
		info: '👉',
		warning: '🔔'
	}

	const flag = msg ? emoji || emojiMap[type] : ''
	console.log(chalk`{${map[type]} ${flag} ${msg}}`)
	type === 'error' && process.exit()
}

function checkNodeVersion(wanted) {
	if (!semver.satisfies(process.version, wanted)) {
		log(
			`你的nodejs版本: ${process.version}, 系统最低版本: ${wanted}, 请升级你的nodejs版本`,
			'error'
		)
	}
}

function compose(middleware) {
	if (!Array.isArray(middleware))
		throw new TypeError('Middleware stack must be an array!')
	for (const fn of middleware) {
		if (typeof fn !== 'function')
			throw new TypeError('Middleware must be composed of functions!')
	}

	return function (context, next) {
		// last called middleware #
		let index = -1
		return dispatch(0)
		function dispatch(i) {
			if (i <= index)
				return Promise.reject(new Error('next() called multiple times'))
			index = i
			let fn = middleware[i]
			if (i === middleware.length) fn = next
			if (!fn) return Promise.resolve()
			try {
				return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
			} catch (err) {
				return Promise.reject(err)
			}
		}
	}
}

function fillReqUrl(req, protocal = 'http') {
	// eslint-disable-next-line node/no-deprecated-api
	const reqUrlObj = Url.parse(req.url)
	const host = req.headers.host
	reqUrlObj.host = host
	reqUrlObj.protocol = protocal
	let urlStr = Url.format(reqUrlObj)
	// 兼容 ws、wss，因为 URL.format 不会给除 http 和 https 以外的协议添加双斜杠
	if (protocal.includes('ws')) {
		urlStr = urlStr.replace(/(wss?:)/, '$1//')
	}
	req._proxyOriginUrl = urlStr
	req.url = urlStr
}

function getEditDistance(a, b) {
	if (a.length === 0) return b.length
	if (b.length === 0) return a.length

	const matrix = []

	// increment along the first column of each row
	let i
	for (i = 0; i <= b.length; i++) {
		matrix[i] = [i]
	}

	// increment each column in the first row
	let j
	for (j = 0; j <= a.length; j++) {
		matrix[0][j] = j
	}

	// Fill in the rest of the matrix
	for (i = 1; i <= b.length; i++) {
		for (j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1]
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					Math.min(
						matrix[i][j - 1] + 1, // insertion
						matrix[i - 1][j] + 1
					)
				) // deletion
			}
		}
	}

	return matrix[b.length][a.length]
}

module.exports = {
	log,
	checkNodeVersion,
	compose,
	fillReqUrl,
	getEditDistance
}
