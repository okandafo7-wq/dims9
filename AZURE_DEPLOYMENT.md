# Azure Static Web Apps Deployment Guide

## Build Configuration

When configuring your Azure Static Web App, use these settings:

### Build Details:
- **App location**: `/frontend`
- **API location**: `/backend` (if deploying API)
- **Output location**: `build`

### Build Command:
The build will automatically run `npm install` then `npm run build`

### Important Files:
- `.npmrc` - Contains `legacy-peer-deps=true` to resolve dependency conflicts
- `package.json` - Uses date-fns@^3.6.0 (compatible with react-day-picker)
- `package-lock.json` - Lock file generated with npm and legacy-peer-deps

### Environment Variables:
Make sure to set these in Azure Portal:
- `REACT_APP_BACKEND_URL` - Your backend API URL

### Troubleshooting:

If you get ERESOLVE errors:
1. Ensure `.npmrc` file is committed to git
2. Ensure `package-lock.json` is committed (not in .gitignore)
3. Verify date-fns version is 3.6.0 in package.json
4. In Azure build settings, the install command should respect .npmrc

### Manual Build Test:
```bash
cd frontend
npm install --legacy-peer-deps
npm run build
```

## Dependency Resolution

The key fix was downgrading `date-fns` from 4.1.0 to 3.6.0 because:
- `react-day-picker@8.10.1` requires `date-fns@^2.28.0 || ^3.0.0`
- date-fns 4.x is not compatible

## Files to Commit:
- `/app/frontend/package.json` (with date-fns@^3.6.0)
- `/app/frontend/package-lock.json` (generated with npm)
- `/app/frontend/.npmrc` (with legacy-peer-deps=true)
- `/app/.npmrc` (root level backup)
- `/app/staticwebapp.config.json` (Azure SWA config)
