import ts from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';

export default [
  {
    input: './index.ts',
    output: {
      file: './dist/index.mjs',
      sourcemap: true,
    },
    external: ['node:events'],
    plugins: [ts()],
  },
  {
    input: './index.ts',
    output: {
      file: './dist/index.d.ts',
    },
    external: ['node:events'],
    plugins: [dts()],
  },
];
