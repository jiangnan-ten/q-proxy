// 原理 http tunnel https://www.bookstack.cn/read/https-mitm-proxy-handbook/doc-Chapter2.md
const net = require('net')

class ConnectHandler {
	handle(req, socket) {
		const conn = net.connect(global.qProxy.httpsProxyPort, '0.0.0.0', () => {
			socket.write(`HTTP/${req.httpVersion} 200 OK\r\n\r\n`, 'UTF-8', () => {
				socket.pipe(conn).pipe(socket)
			})
		})

		conn.on('error', e => {
			console.error(e)
		})
	}
}

module.exports = ConnectHandler
