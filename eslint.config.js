/*! eslint-config-standard. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

// Importing necessary ESLint plugins using ES module syntax
import pluginN from 'eslint-plugin-n'
import * as pluginImport from 'eslint-plugin-import'
import pluginPromise from 'eslint-plugin-promise'
import globals from 'globals'

const config = {
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',

    parserOptions: {
      ecmaFeatures: { jsx: true }
    },

    globals: {
      ...globals.es2021,
      ...globals.node,
      document: 'readonly',
      navigator: 'readonly',
      window: 'readonly'
    }
  },

  plugins: {
    n: pluginN,
    promise: pluginPromise,
    import: pluginImport
  },

  rules: {
    'no-var': 'warn',
    'object-shorthand': ['warn', 'properties'],

    'accessor-pairs': ['error', { setWithoutGet: true, enforceForClassMembers: true }],
    'array-bracket-spacing': ['error', 'never'],
    'array-callback-return': ['error', {
      allowImplicit: false,
      checkForEach: false
    }],
    'arrow-spacing': ['error', { before: true, after: true }],
    'block-spacing': ['error', 'always'],
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    camelcase: ['error', {
      allow: ['^UNSAFE_'],
      properties: 'never',
      ignoreGlobals: true
    }],
    'comma-dangle': ['error', {
      arrays: 'never',
      objects: 'never',
      imports: 'never',
      exports: 'never',
      functions: 'never'
    }],
    'comma-spacing': ['error', { before: false, after: true }],
    'comma-style': ['error', 'last'],
    'computed-property-spacing': ['error', 'never', { enforceForClassMembers: true }],
    'constructor-super': 'error',
    curly: ['error', 'multi-line'],
    'default-case-last': 'error',
    'dot-location': ['error', 'property'],
    'dot-notation': ['error', { allowKeywords: true }],
    'eol-last': 'error',
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'func-call-spacing': ['error', 'never'],
    'generator-star-spacing': ['error', { before: true, after: true }],
    indent: ['error', 2, {
      SwitchCase: 1,
      VariableDeclarator: 1,
      outerIIFEBody: 1,
      MemberExpression: 1,
      FunctionDeclaration: { parameters: 1, body: 1 },
      FunctionExpression: { parameters: 1, body: 1 },
      CallExpression: { arguments: 1 },
      ArrayExpression: 1,
      ObjectExpression: 1,
      ImportDeclaration: 1,
      flatTernaryExpressions: false,
      ignoreComments: false,
      ignoredNodes: [
        'TemplateLiteral *',
        'JSXElement',
        'JSXElement > *',
        'JSXAttribute',
        'JSXIdentifier',
        'JSXNamespacedName',
        'JSXMemberExpression',
        'JSXSpreadAttribute',
        'JSXExpressionContainer',
        'JSXOpeningElement',
        'JSXClosingElement',
        'JSXFragment',
        'JSXOpeningFragment',
        'JSXClosingFragment',
        'JSXText',
        'JSXEmptyExpression',
        'JSXSpreadChild'
      ],
      offsetTernaryExpressions: true
    }],
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    'keyword-spacing': ['error', { before: true, after: true }],
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'multiline-ternary': ['error', 'always-multiline'],
    'new-cap': ['error', { newIsCap: true, capIsNew: false, properties: true }],
    'new-parens': 'error',
    'no-array-constructor': 'error',
    'no-async-promise-executor': 'error',
    'no-caller': 'error',
    'no-case-declarations': 'error',
    'no-class-assign': 'error',
    'no-compare-neg-zero': 'error',
    'no-cond-assign': 'error',
    'no-const-assign': 'error',
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-control-regex': 'error',
    'no-debugger': 'error',
    'no-delete-var': 'error',
    'no-dupe-args': 'error',
    'no-dupe-class-members': 'error',
    'no-dupe-keys': 'error',
    'no-useless-backreference': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-empty-character-class': 'error',
    'no-empty-pattern': 'error',
    'no-eval': 'error',
    'no-ex-assign': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-extra-boolean-cast': 'error',
    'no-extra-parens': ['error', 'functions'],
    'no-fallthrough': 'error',
    'no-floating-decimal': 'error',
    'no-func-assign': 'error',
    'no-global-assign': 'error',
    'no-implied-eval': 'error',
    'no-import-assign': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-iterator': 'error',
    'no-labels': ['error', { allowLoop: false, allowSwitch: false }],
    'no-lone-blocks': 'error',
    'no-loss-of-precision': 'error',
    'no-misleading-character-class': 'error',
    'no-prototype-builtins': 'error',
    'no-useless-catch': 'error',
    'no-mixed-operators': ['error', {
      groups: [
        ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
        ['&&', '||'],
        ['in', 'instanceof']
      ],
      allowSamePrecedence: true
    }],
    'no-mixed-spaces-and-tabs': 'error',
    'no-multi-spaces': 'error',
    'no-multi-str': 'error',
    'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-object': 'error',
    'no-new-symbol': 'error',
    'no-new-wrappers': 'error',
    'no-obj-calls': 'error',
    'no-octal': 'error',
    'no-octal-escape': 'error',
    'no-proto': 'error',
    'no-redeclare': ['error', { builtinGlobals: false }],
    'no-regex-spaces': 'error',
    'no-return-assign': ['error', 'except-parens'],
    'no-self-assign': ['error', { props: true }],
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-shadow-restricted-names': 'error',
    'no-sparse-arrays': 'error',
    'no-tabs': 'error',
    'no-template-curly-in-string': 'error',
    'no-this-before-super': 'error',
    'no-throw-literal': 'error',
    'no-trailing-spaces': 'error',
    'no-undef': 'error',
    'no-undef-init': 'error',
    'no-unexpected-multiline': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unneeded-ternary': ['error', { defaultAssignment: false }],
    'no-unreachable': 'error',
    'no-unreachable-loop': 'error',
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': 'error',
    'no-unused-expressions': ['error', {
      allowShortCircuit: true,
      allowTernary: true,
      allowTaggedTemplates: true
    }],
    'no-unused-vars': ['error', {
      args: 'none',
      caughtErrors: 'none',
      ignoreRestSiblings: true,
      vars: 'all'
    }],
    'no-use-before-define': ['error', { functions: false, classes: false, variables: false }],
    'no-useless-call': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-constructor': 'error',
    'no-useless-escape': 'error',
    'no-useless-rename': 'error',
    'no-useless-return': 'error',
    'no-void': 'error',
    'no-whitespace-before-property': 'error',
    'no-with': 'error',
    'object-curly-newline': ['error', { multiline: true, consistent: true }],
    'object-curly-spacing': ['error', 'always'],
    'operator-linebreak': ['error', 'before'],
    'padded-blocks': ['error', {
      blocks: 'never',
      switches: 'never',
      classes: 'never'
    }],
    'prefer-const': ['error', {
      destructuring: 'any',
      ignoreReadBeforeAssign: true
    }],
    'prefer-promise-reject-errors': ['error', { allowEmptyReject: true }],
    'quote-props': ['error', 'as-needed'],
    quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: false }],
    'rest-spread-spacing': ['error', 'never'],
    semi: ['error', 'never'],
    'semi-spacing': ['error', { before: false, after: true }],
    'semi-style': ['error', 'first'],
    'space-before-blocks': ['error', 'always'],
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    'space-unary-ops': ['error', {
      words: true,
      nonwords: false,
      overrides: {}
    }],
    'spaced-comment': ['error', 'always', {
      line: { markers: ['*package', '!', '/', ',', '='] },
      block: {
        balanced: true,
        markers: ['*package', '!', ',', ':', '::', 'flow-include'],
        exceptions: ['*']
      }
    }],
    'switch-colon-spacing': ['error', { after: true, before: false }],
    'template-curly-spacing': ['error', 'never'],
    'yield-star-spacing': ['error', 'both']
  }
}

export default config
