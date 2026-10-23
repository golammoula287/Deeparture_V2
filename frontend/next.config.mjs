/** @type {import('next').NextConfig} */
const commit = process.env.RENDER_GIT_COMMIT || process.env.BUILD_COMMIT || '';
const nextConfig = {
  reactStrictMode: true,
  // Embed source identity at build time so a runtime environment change cannot relabel a build.
  env: { NEXT_PUBLIC_BUILD_COMMIT: /^[a-f0-9]{40}$/i.test(commit) ? commit : '' },
};
export default nextConfig;
