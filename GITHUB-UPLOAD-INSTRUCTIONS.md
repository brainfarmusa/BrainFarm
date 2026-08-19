# Uploading BrainFarm USA to GitHub

This folder contains the complete source for BrainFarm USA website version 24.

## Upload through the GitHub website

1. Sign in to GitHub and create a new repository.
2. Give it a name such as `brainfarm-usa-website`.
3. Leave **Add a README**, **Add .gitignore**, and **Choose a license** unchecked because those files are already included here.
4. Open the new repository and choose **uploading an existing file**.
5. Unzip the package on your computer first.
6. Open the unzipped `BrainFarm-USA-GitHub-v24` folder, select all files and folders inside it, and drag them into GitHub's upload window. Do not upload only the ZIP file.
7. Enter a message such as `Add BrainFarm USA website version 24` and select **Commit changes**.

## Important

- Keep the folder structure unchanged.
- Do not upload `node_modules`, `.next`, `dist`, or environment files. They are intentionally excluded.
- The website source uses Node.js 22.13 or newer.
- The current production content and graphics are under `public/site`.
- The application routes are under `app`.
- GitHub stores the source code. A separate hosting service or deployment connection is required to make the repository publicly viewable as a live website.

## Local installation

```bash
npm ci
npm run dev
```

## Production build

```bash
npm run build
```

Current permanent website:

https://brain-farm-usa-site.darrell217587.chatgpt.site
