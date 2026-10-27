module.exports = {
  forbidden: [
    {
      name: 'domain-does-not-depend-on-application',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { path: '^src/application/' },
    },
    {
      name: 'domain-does-not-depend-on-infrastructure',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { path: '^src/infrastructure/' },
    },
    {
      name: 'application-does-not-depend-on-infrastructure',
      severity: 'error',
      from: { path: '^src/application/' },
      to: { path: '^src/infrastructure/' },
    },
    {
      name: 'domain-does-not-depend-on-frameworks',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { dependencyTypes: ['npm'] },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
  },
};
