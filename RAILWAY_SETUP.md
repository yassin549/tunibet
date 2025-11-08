# Railway Deployment Setup

## Required Environment Variables

Make sure these are set in your Railway project settings:

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Build Configuration

Railway will automatically use the `nixpacks.toml` file in the root directory.

### Build Steps:
1. Install dependencies: `pnpm install --frozen-lockfile`
2. Build Next.js app: `pnpm run build`
3. Start production server: `pnpm run start`

## Port Configuration

Railway automatically sets the `PORT` environment variable. Next.js will use port 8080 by default in the container.

## Deployment Checklist

- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` in Railway environment variables
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Railway environment variables
- [ ] Update Supabase redirect URLs to include your Railway domain
- [ ] Commit and push `nixpacks.toml` to your repository
- [ ] Redeploy on Railway

## Troubleshooting

### Container Stops Immediately
- Check Railway logs for build errors
- Verify environment variables are set
- Ensure build completes successfully

### Build Fails
- Check if all dependencies are in `package.json`
- Verify TypeScript compilation succeeds locally
- Check Railway build logs for specific errors

### App Starts But Crashes
- Missing environment variables
- Database connection issues
- Check application logs in Railway dashboard
