# SNKR LAND frontend upload

This archive contains only the frontend files that should be uploaded to the GitHub repository.

## Upload to GitHub

Copy all files from this folder into the repository root, then run:

```bash
git add .
git commit -m "Update SNKR LAND frontend"
git push
```

## GitHub Pages settings

Use:

- Branch: `main`
- Folder: `/docs`

Mini App URL:

```text
https://liknine.github.io/snkr_land/
```

## Local development

```bash
npm install
npm run dev
```

## Rebuild docs for GitHub Pages

```bash
npm run build
```

The Vite config builds into `docs/`.
