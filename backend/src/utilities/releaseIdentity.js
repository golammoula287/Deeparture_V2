// Only expose the immutable source identity, never the service environment.
module.exports = () => {
  const commit = process.env.RENDER_GIT_COMMIT || process.env.BUILD_COMMIT || '';
  return { commit: /^[a-f0-9]{40}$/i.test(commit) ? commit : null };
};
