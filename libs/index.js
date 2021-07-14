const App = require('./app')

async function bootstrap({ port, dir }) {
	console.clear()
	const app = new App(port, dir)
	await app.init()
	app.start()
}

module.exports = bootstrap
