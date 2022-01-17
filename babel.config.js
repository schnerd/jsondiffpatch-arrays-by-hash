// Just needed for jest tests, not rollup build
module.exports = {
  presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
};