// GitHub API configuration
const GITHUB_USERNAME = 'Peponks9'; // Replace with your GitHub username
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null; // Will be null in browser environment
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

// For client-side usage, you can hardcode a public token or use a proxy
// NEVER commit real tokens to version control
const PUBLIC_GITHUB_TOKEN = null; // Set to your token if you want to use it (not recommended for security)
