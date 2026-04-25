import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
	{
		ignores: ['dist/**']
	},
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2021,
				sourceType: 'module'
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin
		},
		rules: {
			'@typescript-eslint/no-unused-vars': 'warn',
			'array-bracket-spacing': 'warn',
			'comma-dangle': 'warn',
			'indent': 'off',
			'multiline-ternary': 'off',
			'no-tabs': 'off',
			'no-unused-vars': 'off',
			'no-use-before-define': 'off',
			'no-useless-constructor': 'off',
			'quote-props': ['warn', 'consistent'],
			'quotes': 'off',
			'semi': ['warn', 'always'],
			'space-before-function-paren': 'off'
		}
	}
];
