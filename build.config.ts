import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  clean: true,
  entries: ['./src/index'],
  declaration: true,
  rollup: {
    commonjs: {},
    emitCJS: true,
  },
});
