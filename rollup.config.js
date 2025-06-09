import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
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
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist/types'
    }),
    nodeResolve()
  ]
};
