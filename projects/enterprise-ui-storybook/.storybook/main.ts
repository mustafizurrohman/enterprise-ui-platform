import type { StorybookConfig } from '@storybook/angular-vite';
import remarkGfm from 'remark-gfm';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
  framework: {
    name: '@storybook/angular-vite',
    options: {},
  },
  async viteFinal(config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mr/enterprise-ui/datepicker': path.resolve(__dirname, '../../enterprise-ui/datepicker/src/public-api.ts'),
      '@mr/enterprise-ui': path.resolve(__dirname, '../../enterprise-ui/src/public-api.ts'),
    };
    return config;
  },
};

export default config;
