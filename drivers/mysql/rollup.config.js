import ts from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';

export default [
  {
    input: './mysql.ts',
    output: {
      file: './dist/index.mjs',
      sourcemap: true,
    },
    external: ['mysql2', 'stream/web', '@sqltags/core'],
    plugins: [ts()],
  },
  {
    input: './mysql.ts',
    output: {
      file: './dist/index.d.ts',
    },
    external: ['mysql2', 'stream/web', '@sqltags/core'],
    plugins: [dts()],
  },
];
