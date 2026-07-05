import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` builds all asset URLs as relative paths, so the app works
// whether it's served from a GitHub Pages *project* site
// (https://user.github.io/repo-name/) or a *user/org* site
// (https://user.github.io/). No repo-name configuration needed here.
export default defineConfig({
  plugins: [react()],
  base: './'
});
