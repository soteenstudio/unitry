export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-min-length': [2, 'always', 10],
    'subject-case': [2, 'always', 'sentence-case']
  }
};