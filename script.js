// GitHub API configuration
const GITHUB_USERNAME = 'Peponks9'; // Replace with your GitHub username
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

// Fetch GitHub user data
async function fetchGitHubData() {
    try {
        // Fetch specific repositories
        const specificRepos = await fetchSpecificRepositories();

        // Fetch pull requests
        const prsResponse = await fetch(`${GITHUB_API_BASE}/search/issues?q=author:${GITHUB_USERNAME}+type:pr&sort=updated&per_page=10`);
        const prsData = await prsResponse.json();

        // Use specific repos or fall back to regular repos
        let reposToShow = specificRepos;
        if (!reposToShow || reposToShow.length === 0) {
            const reposResponse = await fetch(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6&type=public`);
            const reposData = await reposResponse.json();
            reposToShow = reposData.slice(0, 6);
        }

        // Render projects
        renderProjects(reposToShow);

        // Render pull requests
        renderPullRequests(prsData.items || []);

    } catch (error) {
        console.error('Error fetching GitHub data:', error);

        // Show error messages
        document.getElementById('projects-list').innerHTML = '<div class="loading">Unable to load GitHub data. Please check the username configuration.</div>';
        document.getElementById('pull-requests').innerHTML = '<div class="loading">Unable to load pull requests.</div>';
    }
}

// Fetch specific repositories by name
async function fetchSpecificRepositories() {
    const repoNames = ['smol-evm', 'merkle-tree-rs', 'codeforces-problemset'];

    try {
        const repoPromises = repoNames.map(async (repoName) => {
            const response = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_USERNAME}/${repoName}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        });

        const repos = await Promise.all(repoPromises);
        return repos.filter(repo => repo !== null);

    } catch (error) {
        console.error('Error fetching specific repositories:', error);
        return null;
    }
}

function renderProjects(repos) {
    const projectsList = document.getElementById('projects-list');
    
    if (!repos || repos.length === 0) {
        projectsList.innerHTML = '<div class="loading">No repositories found.</div>';
        return;
    }

    // Filter out forks and show only original repos, or most starred ones
    const filteredRepos = repos
        .filter(repo => !repo.fork || repo.stargazers_count > 0)
        .sort((a, b) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count))
        .slice(0, 8);

    projectsList.innerHTML = filteredRepos.map(repo => `
        <div class="project-item">
            <a href="${repo.html_url}" target="_blank" class="project-title">${repo.name}</a>
            <div class="project-meta">
                ${repo.language || 'Mixed'} • Updated ${formatDate(repo.updated_at)}
            </div>
            <div class="project-description">
                ${repo.description || 'No description available.'}
            </div>
            <div class="project-stats">
                ★ ${repo.stargazers_count} • ⑂ ${repo.forks_count}
                ${repo.topics && repo.topics.length > 0 ? ' • ' + repo.topics.slice(0, 3).join(', ') : ''}
            </div>
        </div>
    `).join('');
}

function renderPullRequests(prs) {
    const prContainer = document.getElementById('pull-requests');
    
    if (!prs || prs.length === 0) {
        prContainer.innerHTML = '<div class="loading">No pull requests found.</div>';
        return;
    }

    prContainer.innerHTML = prs.map(pr => `
        <div class="pr-item">
            <span class="pr-status ${pr.state === 'open' ? 'status-open' : 'status-merged'}">
                ${pr.state === 'open' ? 'Open' : 'Merged'}
            </span>
            <a href="${pr.html_url}" target="_blank" class="pr-title">${pr.title}</a>
            <div class="pr-meta">
                ${extractRepo(pr.repository_url)} • ${formatDate(pr.updated_at)}
            </div>
        </div>
    `).join('');
}

function extractRepo(url) {
    return url.split('/').slice(-1)[0];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

// Smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Load GitHub data when page loads
document.addEventListener('DOMContentLoaded', fetchGitHubData);

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');

// Check for saved theme preference or default to dark mode
const currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);
themeToggle.setAttribute('aria-checked', currentTheme === 'dark' ? 'true' : 'false');

// Toggle theme function
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.setAttribute('aria-checked', newTheme === 'dark' ? 'true' : 'false');
}

// Add event listener to theme toggle button
themeToggle.addEventListener('click', toggleTheme);

// Scroll Progress Indicator
function updateScrollProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    
    const progressBar = document.querySelector('.scroll-progress-bar');
    if (progressBar) {
        progressBar.style.width = scrollPercent + '%';
    }
}

// Throttle scroll events for better performance
let scrollThrottleTimer = null;
window.addEventListener('scroll', function() {
    if (!scrollThrottleTimer) {
        scrollThrottleTimer = setTimeout(function() {
            updateScrollProgress();
            scrollThrottleTimer = null;
        }, 10);
    }
});

// Initialize scroll progress on page load
document.addEventListener('DOMContentLoaded', function() {
    updateScrollProgress();
});

// Pull-to-Refresh functionality for mobile
let startY = 0;
let isPulling = false;

document.addEventListener('touchstart', function(e) {
    startY = e.touches[0].clientY;
    isPulling = window.pageYOffset === 0; // Only enable at top of page
});

document.addEventListener('touchmove', function(e) {
    if (!isPulling) return;
    
    const currentY = e.touches[0].clientY;
    const pullDistance = currentY - startY;
    
    if (pullDistance > 80) { // Minimum pull distance
        e.preventDefault(); // Prevent default scrolling
        // Add visual feedback here if desired
    }
});

document.addEventListener('touchend', function(e) {
    if (!isPulling) return;
    
    const endY = e.changedTouches[0].clientY;
    const pullDistance = endY - startY;
    
    if (pullDistance > 80) {
        // Trigger refresh
        fetchGitHubData();
        
        // Add success feedback
        const notification = document.createElement('div');
        notification.textContent = '🔄 Refreshing...';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--link-color);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            z-index: 1001;
            animation: fadeIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    isPulling = false;
});

// Add fadeIn animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
