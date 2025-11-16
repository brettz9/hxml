import ashNazg from 'eslint-config-ash-nazg';

export default [
  ...ashNazg(['sauron']),
  {
    files: ['**/*.html'],
    languageOptions: {
      globals: {
        alert: 'readonly'
      }
    },
    rules: {
      'no-alert': 0,
      'new-cap': 0
    }
  }
];
