# OSF (Open Science Framework) API Configuration Guide

## Overview

The autonomous-scientist extension now supports full OSF API integration with authentication using Personal Access Tokens. This provides access to both public and private research projects, preprints, and user data.

## What is OSF?

**Open Science Framework (OSF)** is a free, open platform to support research and enable collaboration. It provides:
- Project management and collaboration tools
- File storage and version control
- Preprint sharing and publishing
- DOI assignment for permanent identifiers
- Integration with popular research tools (GitHub, Mendeley, Zotero, etc.)

## Authentication Setup

### Step 1: Generate Personal Access Token

1. Visit [https://osf.io/settings/tokens/](https://osf.io/settings/tokens/)
2. Log in to your OSF account
3. Click "Create token"
4. Give it a descriptive name (e.g., "autonomous-scientist-dxt")
5. Select appropriate scopes (recommend "osf.full_read" and "osf.full_write" for full functionality)
6. Copy the generated token (it starts with characters like `e5qa8H7ei9r...`)

### Step 2: Configure in Extension

Run the API configuration wizard:
```bash
npm run configure-apis
```

Select option 4 to configure OSF API, then paste your token when prompted.

### Step 3: Developer App Registration (Optional)

If you want to create a developer app in OSF (for OAuth flows), use these settings:

- **App name**: `autonomous-scientist-dxt`
- **Project homepage URL**: `https://github.com/mroaromero/autonomous-scientist-dxt`
- **Authorization callback URL**: `https://github.com/mroaromero/autonomous-scientist-dxt` (not used for Personal Access Tokens)
- **App description**: Research automation tool for academic projects

**Note**: Since you're using a Personal Access Token, the callback URL won't be used, but it's required by the form.

## Available OSF Tools

### 1. Search Projects
```javascript
search_osf_projects({
  "query": "psychology",
  "include_private": false,  // Set to true to include your private projects
  "max_results": 20
})
```

### 2. Get Project Details
```javascript
get_osf_project({
  "project_id": "abc123"
})
```

### 3. Search Preprints
```javascript
search_osf_preprints({
  "query": "machine learning",
  "provider": "psyarxiv",  // Optional: specify preprint provider
  "max_results": 20
})
```

### 4. Get User Profile (Requires Authentication)
```javascript
get_osf_user_info({})
```

### 5. Get OSF Statistics
```javascript
get_osf_stats({})
```

## Authentication Benefits

With authentication, you gain access to:

✅ **Your private projects and components**
✅ **Enhanced project details** (contributors, files, permissions)
✅ **User profile information**
✅ **Personal project statistics**
✅ **Future features**: Creating projects, uploading files, managing collaborations

Without authentication, you only have:
- Public project search
- Public preprint search
- Limited project details

## Testing Your Configuration

1. **Test authentication**:
   ```bash
   npm run configure-apis
   ```
   Choose option 5 to test all APIs.

2. **Test in Claude**:
   Use the `get_osf_user_info` tool to verify authentication is working.

## API Token Security

- Your token is encrypted and stored securely by the DXT extension
- The token provides access to your OSF account, so keep it confidential
- You can revoke tokens at any time from [https://osf.io/settings/tokens/](https://osf.io/settings/tokens/)
- The extension uses the token only for API requests, never for web authentication

## Troubleshooting

### Authentication Failed
If you see "Authentication Failed" errors:
1. Check that your token is valid at [https://osf.io/settings/tokens/](https://osf.io/settings/tokens/)
2. Regenerate the token if expired
3. Update your configuration with `npm run configure-apis`

### Limited Access
If you can't access private projects:
1. Ensure `include_private: true` is set in your search
2. Verify your token has appropriate scopes (osf.full_read)
3. Check that you're the owner or have access to the projects

### API Rate Limits
OSF has generous rate limits for academic use, but if you encounter limits:
- Add delays between requests
- Reduce `max_results` in searches
- Contact OSF support if needed

## Your Token Information

**Your OSF Personal Access Token**: `e5qa8H7ei9rB1MTVY92eu1qSzC3EKvwb9qgywXgebuVCyAbTepuB34GY7ojdotWtweBXU9`

**Configuration Command**:
```bash
cd "C:\Users\Admin\Desktop\LOOM\Proyectos_MCP_Claude\autonomous-scientist-dxt"
npm run configure-apis
```

When prompted, select option 4 (Configure OSF API) and paste the token above.

## Next Steps

1. Configure the API with your token
2. Test authentication with `get_osf_user_info`
3. Start searching projects and preprints
4. Explore private project access with `include_private: true`

For support, refer to:
- [OSF API Documentation](https://developer.osf.io/)
- [Extension Documentation](./CLAUDE.md)
- Extension tool descriptions within Claude