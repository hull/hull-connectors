module.exports = {
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },

  env: {
    es6: true,
    browser: true,
    node: true,
    jest: true
  },

  settings: {
    ecmascript: 6,
    jsx: true,
    "import/extensions": [".js", ".jsx"],
    react: {
      version: "detect"
    },
    flowtype: {
      onlyFilesWithFlowAnnotation: true
    }
  },

  extends: [
    "airbnb-base",
    "plugin:react/recommended",
    "plugin:flowtype/recommended",
    "plugin:prettier/recommended",
    "prettier",
    "prettier/react",
    "prettier/flowtype",
    "prettier/standard"
  ],
  plugins: [
    "flowtype",
    "flowtype-errors",
    "jsx-a11y",
    "prettier",
    "react"
  ],
  rules: {
    "arrow-body-style" : [0],
    "arrow-parens": [0],
    "camelcase": [0],
    "class-methods-use-this": [0],
    "comma-dangle": [0],
    "eqeqeq": [1],
    // "flowtype-errors/show-errors": 2,
    // "flowtype/no-primitive-constructor-types": 2,
    // "flowtype/no-types-missing-file-annotation": 2,
    // "flowtype/require-valid-file-annotation": [1, "always"],
    "import/no-extraneous-dependencies": [0],
    "max-len": [0],
    "new-cap": [0],
    "no-console": [0],
    "no-param-reassign" : [0],
    "no-underscore-dangle": [0],
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-use-before-define": ["error", { "classes": false }],
    "prefer-arrow-callback": [0],
    "prefer-destructuring": [0],
    "prettier/prettier": ["error"],
    "quotes": [2, "double", { "avoidEscape": true }],
    "spaced-comment": ["error", "always", { "markers": [":", "::"] }],
    "react/jsx-uses-vars": [2],
    "react/jsx-wrap-multilines": [0],
    "react/no-deprecated": [2],
    "react/no-multi-comp": [2],
    "react/prefer-es6-class": [2],
    "react/require-default-props": [0],
    "react/no-find-dom-node": [2]
  }
}
