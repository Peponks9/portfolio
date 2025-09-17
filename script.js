// GitHub API configuration
const GITHUB_USERNAME = 'Peponks9'; 
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

async function fetchGitHubData() {
    try {
        const specificRepos = await fetchSpecificRepositories();

        const prsResponse = await fetch(`${GITHUB_API_BASE}/search/issues?q=author:${GITHUB_USERNAME}+type:pr&sort=updated&per_page=10`);
        const prsData = await prsResponse.json();

        let reposToShow = specificRepos;
        if (!reposToShow || reposToShow.length === 0) {
            const reposResponse = await fetch(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6&type=public`);
            const reposData = await reposResponse.json();
            reposToShow = reposData.slice(0, 6);
        }

        renderProjects(reposToShow);
        renderPullRequests(prsData.items);

    } catch (error) {
        console.error('Error fetching GitHub data:', error);

        document.getElementById('projects-list').innerHTML = '<div class="loading">Unable to load GitHub data. Please check the username configuration.</div>';
        document.getElementById('pull-requests').innerHTML = '<div class="loading">Unable to load pull requests.</div>';
    }
}

async function fetchSpecificRepositories() {
    const repoNames = ['smol-EVM', 'merkle-tree-rs', 'codeforces-problemset'];

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

document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
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

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');

    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggle.setAttribute('aria-checked', currentTheme === 'dark' ? 'true' : 'false');

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.setAttribute('aria-checked', newTheme === 'dark' ? 'true' : 'false');
    }

    themeToggle.addEventListener('click', toggleTheme);

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

    updateScrollProgress();
});

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
    }
});

document.addEventListener('touchend', function(e) {
    if (!isPulling) return;
    
    const endY = e.changedTouches[0].clientY;
    const pullDistance = endY - startY;
    
    if (pullDistance > 80) {
        fetchGitHubData();
        
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

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

class CryptographicBackground {
    constructor() {
        this.container = document.getElementById('cryptoBackground');
        this.characters = [];
        this.hexChars = '0123456789ABCDEF';
        this.cryptoSymbols = ['⊕', '∈', '≡', '∧', '∨', '¬'];
        this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        
        this.init();
        this.setupThemeObserver();
    }

    init() {
        console.log('Initializing cryptographic background...');
        this.createStaticElements();
        this.startAnimatedElements();
        console.log('Cryptographic background initialized');
    }

    setupThemeObserver() {
        // Watch for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    this.isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
                    this.updateTheme();
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    updateTheme() {
        // Update existing elements' opacity and colors based on theme
        const elements = this.container.querySelectorAll('.crypto-character');
        elements.forEach(element => {
            element.style.opacity = this.isDarkMode ? '0.20' : '0.15';
        });
    }

    createHexString() {
        const element = document.createElement('div');
        element.className = 'crypto-character hex-string';
        
        // Generate random hex string
        let hexString = '';
        const length = Math.floor(Math.random() * 6) + 4;
        for (let i = 0; i < length; i++) {
            hexString += this.hexChars[Math.floor(Math.random() * this.hexChars.length)];
        }
        
        element.textContent = hexString;
        element.style.left = Math.random() * 100 + '%';
        element.style.animationDelay = Math.random() * 5 + 's';
        element.style.animationDuration = (20 + Math.random() * 10) + 's';
        
        this.container.appendChild(element);
        
        // Remove element after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 30000);
    }

    createBinaryCluster() {
        const element = document.createElement('div');
        element.className = 'crypto-character binary-cluster';
        
        // Generate binary string
        let binary = '';
        const length = Math.floor(Math.random() * 10) + 6;
        for (let i = 0; i < length; i++) {
            binary += Math.random() > 0.5 ? '1' : '0';
        }
        
        element.textContent = binary;
        element.style.top = Math.random() * 100 + '%';
        element.style.animationDelay = Math.random() * 3 + 's';
        element.style.animationDuration = (15 + Math.random() * 8) + 's';
        
        this.container.appendChild(element);
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 23000);
    }

    createCryptoSymbol() {
        const element = document.createElement('div');
        element.className = 'crypto-character crypto-symbol';
        
        element.textContent = this.cryptoSymbols[Math.floor(Math.random() * this.cryptoSymbols.length)];
        element.style.left = Math.random() * 100 + '%';
        element.style.top = Math.random() * 100 + '%';
        element.style.animationDelay = Math.random() * 4 + 's';
        element.style.animationDuration = (4 + Math.random() * 2) + 's';
        
        this.container.appendChild(element);
        console.log('Created crypto symbol:', element.textContent);
    }

    createHashSymbol() {
        const element = document.createElement('div');
        element.className = 'crypto-character hash-symbol';
        
        element.textContent = '#';
        element.style.left = Math.random() * 100 + '%';
        element.style.top = Math.random() * 100 + '%';
        element.style.animationDelay = Math.random() * 8 + 's';
        element.style.animationDuration = (8 + Math.random() * 4) + 's';
        
        this.container.appendChild(element);
    }

    createStaticElements() {
        // Create fewer static elements for subtlety
        for (let i = 0; i < 8; i++) {
            this.createCryptoSymbol();
        }
        
        for (let i = 0; i < 5; i++) {
            this.createHashSymbol();
        }
    }

    startAnimatedElements() {
        // Create floating hex strings less frequently
        setInterval(() => {
            this.createHexString();
        }, 3000);

        // Create binary clusters occasionally
        setInterval(() => {
            this.createBinaryCluster();
        }, 5000);

        // Occasionally refresh static symbols
        setInterval(() => {
            const symbols = this.container.querySelectorAll('.crypto-symbol');
            if (symbols.length > 0) {
                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                randomSymbol.textContent = this.cryptoSymbols[Math.floor(Math.random() * this.cryptoSymbols.length)];
            }
        }, 10000);
    }
}

// Initialize cryptographic background when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing cryptographic background...');
    const container = document.getElementById('cryptoBackground');
    if (container) {
        console.log('Container found, creating CryptographicBackground instance');
        new CryptographicBackground();
    } else {
        console.error('Cryptographic background container not found!');
    }

    // Fetch GitHub data when page loads
    fetchGitHubData();
});
