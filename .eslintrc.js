module.exports = {
	env: {
		commonjs: true,
		es2021: true,
		node: true
	},
	extends: ['standard', 'prettier'],
	parserOptions: {
		ecmaVersion: 12
	},
	plugins: ['prettier'],
	rules: {
		'prettier/prettier': [
			'error',
			{
				singleQuote: true,
				trailingComma: 'none',
				semi: false,
				useTabs: true,
				printWidth: 80,
				bracketSpacing: true,
				endOfLine: 'auto',
				arrowParens: 'avoid'
			}
		]
	}
}
