import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/uiflow.js',
      format: 'umd',
      name: 'UIFlow',
      exports: 'named'
    },
    {
      file: 'dist/uiflow.min.js',
      format: 'umd',
      name: 'UIFlow',
      exports: 'named',
      plugins: [terser()]
    },
    {
      file: 'dist/uiflow.esm.js',
      format: 'es'
    }
  ],
  plugins: [nodeResolve()]
};
