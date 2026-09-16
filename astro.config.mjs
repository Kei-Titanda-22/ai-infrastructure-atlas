import { defineConfig } from 'astro/config';

const repository = process.env.GITHUB_REPOSITORY?.split('/');
const owner = process.env.GITHUB_REPOSITORY_OWNER || repository?.[0] || 'Kei-Titanda-22';
const repo = repository?.[1] || 'ai-infrastructure-atlas';
const isUserSite = repo === `${owner}.github.io`;

function normalizeBasePath(value) {
  const segment = String(value).trim().replace(/^\/+|\/+$/g, '');
  return segment ? `/${segment}` : '/';
}

const site = process.env.SITE_URL || `https://${owner}.github.io`;
const base = normalizeBasePath(process.env.BASE_PATH || (isUserSite ? '/' : `/${repo}`));

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
});
