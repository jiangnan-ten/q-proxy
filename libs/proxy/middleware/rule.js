const Url = require('url')
const mime = require('mime-types')
const fs = require('fs-extra')
const { log } = require('../../utils')

const RuleService = require('../../services/rule')
const MockService = require('../../services/mock')

class RuleMiddleware {
	constructor() {
		this.ruleService = new RuleService(global.qProxy.configDir)
		this.mockService = new MockService()
	}

	async init() {
		await this.ruleService
			.genRuleFromConfig()
			.catch(err => log(`规则配置文件读取出错: ${err.toString()}`, 'error'))
	}

	async processMock(body, urlObj, method, ctx) {
		ctx.res.body = await this.mockService.getRes(body, urlObj, method, ctx)
		ctx.res.setHeader('Content-Type', 'application/json;charset=utf-8')
	}

	async processForward(urlObj, matchUrl, target, ctx) {
		const finalTarget = this.ruleService.calcPath(urlObj.href, matchUrl, target)
		if (!finalTarget) {
			return
		}

		ctx.res.setHeader('q-proxy-target', finalTarget)
		if (finalTarget.startsWith('http') || target.startsWith('ws')) {
			ctx.req.url = finalTarget
		} else {
			const exists = await fs.pathExists(target)
			if (exists) {
				ctx.res.body = fs.createReadStream(target)
			} else {
				ctx.res.body = `target ${target} does not exist`
				ctx.res.statusCode = 404
			}
		}
	}

	async middleware(ctx, next) {
		const { req } = ctx
		const { method, url } = req
		const urlObj = new Url.URL(url)

		const matchedRule = this.ruleService.getMatchedRule(urlObj, method)

		if (!matchedRule) {
			return next()
		}

		ctx.res.setHeader('q-proxy-rule-match', matchedRule.urlRegex)
		if (urlObj.pathname && mime.lookup(urlObj.pathname)) {
			ctx.res.setHeader('Content-Type', mime.lookup(urlObj.pathname))
		}

		switch (matchedRule.action) {
			case 'forward':
				await this.processForward(
					urlObj,
					matchedRule.urlRegex,
					matchedRule.target,
					ctx
				)
				break
			case 'mock':
				await this.processMock(matchedRule.target, urlObj, method, ctx)
				break
			default:
				break
		}

		await next()
	}
}

module.exports = RuleMiddleware
