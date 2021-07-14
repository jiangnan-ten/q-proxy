const { readdir } = require('fs/promises')
const path = require('path')
const _ = require('lodash')
const { getEditDistance } = require('../utils')

class RuleService {
	constructor(configRootPath) {
		this.rules = new Set()
		this.configRootPath = configRootPath
	}

	async genRuleFromConfig() {
		return new Promise((resolve, reject) => {
			readdir(this.configRootPath)
				.then(files => {
					for (const file of files) {
						const filePath = path.resolve(this.configRootPath, file)
						const jsFile = require(filePath)
						if (!jsFile.enabled) {
							continue
						}

						if (!jsFile.rules || !jsFile.rules.length) {
							continue
						}

						const rules = jsFile.rules.filter(rule => rule.enabled)
						rules.length &&
							this.rules.add({
								...jsFile,
								rules
							})
					}

					return resolve()
				})
				.catch(err => reject(err))
		})
	}

	getMatchedRule(urlObj, method) {
		const matchMethod = (reqMethod, ruleMethod) => {
			const reqMethodFormat = reqMethod.toLowerCase()
			const ruleMethodFormat = ruleMethod.toLowerCase()

			return (
				reqMethodFormat === ruleMethodFormat ||
				ruleMethodFormat === 'all' ||
				!ruleMethodFormat ||
				reqMethodFormat === 'option'
			)
		}

		const matchUrl = (reqUrl, ruleUrl) => {
			return (
				ruleUrl &&
				(reqUrl.includes(ruleUrl) || new RegExp(ruleUrl).test(reqUrl))
			)
		}

		for (const project of this.rules) {
			const foundRule = project.rules.filter(
				rule =>
					matchMethod(method, rule.method) &&
					matchUrl(urlObj.href, rule.urlRegex)
			)

			// 获取高权重路径
			const res = foundRule
				.map(function (item) {
					item.distance = getEditDistance(urlObj.href, item.urlRegex)
					return item
				})
				.sort(function (a, b) {
					if (a.distance < b.distance) return -1
					else if (a.distance > b.distance) return 1
					else return 0
				})

			if (res.length) {
				return res[0]
			}
		}
	}

	calcPath(href, match, target) {
		if (match) {
			const matchList = href.match(new RegExp(match))
			_.forEach(matchList, (value, index) => {
				if (index === 0) {
					return
				}
				const reg = new RegExp('\\$' + index, 'g')
				if (!value) {
					value = ''
				}
				target = target.replace(reg, value)
			})
			const compiled = _.template(target)
			return compiled()
		}
	}
}

module.exports = RuleService
