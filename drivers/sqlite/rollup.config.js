import ts from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';

export default [
  {
    input: './sqlite.ts',
    output: {
      file: './dist/index.mjs',
      sourcemap: true,
    },
    external: ['sqlite3', '@sqltags/core'],
    plugins: [ts()],
  },
  {
    input: './sqlite.ts',
    output: {
      file: './dist/index.d.ts',
    },
    external: ['sqlite3', '@sqltags/core'],
    plugins: [dts()],
  },
];
