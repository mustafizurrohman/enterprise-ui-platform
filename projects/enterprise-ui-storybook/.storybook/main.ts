import type { StorybookConfig } from '@storybook/angular-vite';

const config: StorybookConfig = {
  stories: [
    '../projects/**/*.mdx',
    '../projects/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-onboarding'
  ],
  framework: {
    name: '@storybook/angular-vite',
    options: {}
  }
};

export default config;
