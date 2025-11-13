import vuetify from 'eslint-config-vuetify';

export default vuetify({
  rules: {
    '@stylistic/member-delimiter-style': [
      'error',
      {
        multiline: { delimiter: 'semi', requireLast: true },
      },
    ],
    '@stylistic/semi': ['error', 'always'],
    'stylistic/comma-dangle': ['error', 'never'],
    'vue/script-indent': 'off',
  },
});
