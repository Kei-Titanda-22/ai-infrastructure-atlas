import { defineConfig } from 'astro/config';

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const owner = process.env.GITHUB_REPOSITORY_OWNER;
const onGitHubActions = process.env.GITHUB_ACTIONS === 'true' && repo && owner;
const isUserSite = onGitHubActions && repo === `${owner}.github.io`;

const site = process.env.SITE_URL || (onGitHubActions ? `https://${owner}.github.io` : 'http://localhost:4321');
const base = process.env.BASE_PATH || (onGitHubActions && !isUserSite ? `/${repo}` : '/');

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
});
