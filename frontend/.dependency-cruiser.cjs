module.exports = {
  forbidden: [
    {
      name: 'domain-does-not-depend-on-frameworks',
      severity: 'error',
      from: { path: '^src/features/[^/]+/domain/' },
      to: { dependencyTypes: ['npm'] },
    },
    {
      name: 'domain-does-not-depend-on-outer-layers',
      severity: 'error',
      from: { path: '^src/features/[^/]+/domain/' },
      to: { path: '^src/features/[^/]+/(application|infrastructure|presentation)/' },
    },
    {
      name: 'application-does-not-depend-on-infrastructure-or-presentation',
      severity: 'error',
      from: { path: '^src/features/[^/]+/application/' },
      to: { path: '^src/features/[^/]+/(infrastructure|presentation)/' },
    },
    {
      name: 'presentation-does-not-depend-on-infrastructure',
      severity: 'error',
      from: { path: '^src/features/[^/]+/presentation/' },
      to: { path: '^src/features/[^/]+/infrastructure/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
  },
}
