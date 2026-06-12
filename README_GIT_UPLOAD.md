# GitHub Pages upload

Upload all files from this archive to the repository root.

GitHub Pages settings:
- Branch: main
- Folder: /docs

This package uses `base: "./"` in `vite.config.ts`, so it works even if the repository URL/path is not exactly `/snkr_land/`.

After changing source files locally:
```bash
npm install
npm run build
git add .
git commit -m "Update frontend"
git push
```
