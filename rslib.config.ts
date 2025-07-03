import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      dts: true,
    },
  ],
  output: {
    target: 'node',
  },
  source: {
    entry: {
      index: './src/index.ts',
      cli: './src/cli.ts',
    },
  },
});
