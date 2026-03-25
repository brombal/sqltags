import ts from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';

export default [
  {
    input: './postgres.ts',
    output: {
      file: './dist/index.mjs',
      sourcemap: true,
    },
    external: ['pg-cursor', '@sqltags/core'],
    plugins: [ts()],
  },
  {
    input: './postgres.ts',
    output: {
      file: './dist/index.d.ts',
    },
    external: ['pg-cursor', '@sqltags/core'],
    plugins: [dts()],
  },
];
