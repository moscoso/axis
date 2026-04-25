import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
    {
        ignores: ['dist/**', '**/*.json'],
    },
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsPlugin.configs['recommended'].rules,
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'array-bracket-spacing': 'warn',
            'comma-dangle': 'off',
            'indent': 'off',
            'multiline-ternary': 'off',
            'no-tabs': 'off',
            'no-unused-vars': 'off',
            'no-useless-constructor': 'off',
            'quote-props': ['warn', 'consistent'],
            'quotes': ['warn', 'single', { allowTemplateLiterals: true }],
            'semi': ['warn', 'always'],
            'space-before-function-paren': 'off',
        },
    },
];
