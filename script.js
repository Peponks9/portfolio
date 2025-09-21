const GITHUB_USERNAME = 'Peponks9'; 
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

let currentSection = 0;
const totalSections = 6;
const sectionNames = ['about', 'technologies', 'experience', 'projects', 'opensource', 'blog'];

const SCROLL_BUFFER_THRESHOLD = 200; // Increased from 120px for less sensitivity
const NAVIGATION_DELAY = 250;
const BUFFER_VISUAL_THRESHOLD = 80;
const MOMENTUM_THRESHOLD = 5;
const SCROLL_VELOCITY_MULTIPLIER = 0.8; // Reduced velocity for slower buffer accumulation

let scrollBuffer = 0;
let bufferDirection = 0;
let navigationTimeout = null;
let lastScrollTime = 0;
let scrollMomentum = 0;

// Navigation cooldown to prevent rapid successive jumps
let navigationCooldown = false;
const NAVIGATION_COOLDOWN_MS = 500;

function initHorizontalNavigation() {
    const container = document.querySelector('.horizontal-container');
    const navDots = document.querySelectorAll('.nav-dot');
    
    function updateNavigation() {
        const translateX = -currentSection * 100;
        container.style.transform = `translateX(${translateX}vw)`;
        
        const progress = (currentSection / (totalSections - 1)) * 100;
        document.querySelector('.scroll-progress-bar').style.width = `${progress}%`;
        
        document.querySelectorAll('.horizontal-section').forEach((section, index) => {
            section.classList.toggle('active', index === currentSection);
        });
        
        navDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSection);
        });
        
        updateActiveNavLink();
    }
    
    function goToSection(index) {
        if (navigationCooldown) return; 
        
        if (index >= 0 && index < totalSections && index !== currentSection) {
            // Set cooldown
            navigationCooldown = true;
            setTimeout(() => {
                navigationCooldown = false;
            }, NAVIGATION_COOLDOWN_MS);
            
            resetScrollBuffer();
            currentSection = index;
            updateNavigation();
        }
    }
    
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSection(index);
        });
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goToSection(currentSection - 1);
        } else if (e.key === 'ArrowRight') {
            goToSection(currentSection + 1);
        }
    });

    let startX = 0;
    let isDragging = false;
    
    container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });
    
    container.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
    });
    
    container.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                goToSection(currentSection + 1);
            } else {
                goToSection(currentSection - 1);
            }
        }
    });
    
    let isNavigating = false;
    
    document.addEventListener('wheel', (e) => {
        const target = e.target;
        const sectionContent = target.closest('.section-content');
        const currentTime = Date.now();
        
        // Ignore small scroll movements to prevent accidental navigation
        if (Math.abs(e.deltaY) < 50) return;
        
        if (sectionContent) {
            const scrollTop = sectionContent.scrollTop;
            const scrollHeight = sectionContent.scrollHeight;
            const clientHeight = sectionContent.clientHeight;
            
            const isAtTop = scrollTop === 0;
            const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1;
            const scrollDirection = e.deltaY > 0 ? 1 : -1;
            
            // Allow normal scrolling if content is scrollable and not at boundaries
            if (scrollHeight > clientHeight && !isAtTop && !isAtBottom) {
                resetScrollBuffer();
                return; // Let normal scroll happen
            }
            
            // Handle buffer zone scrolling at boundaries
            if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                e.preventDefault();
                handleBufferZoneScroll(e.deltaY, sectionContent, currentTime);
            }
        } else {
            // Scrolling outside section content - navigate sections with higher threshold
            if (Math.abs(e.deltaY) > 100) { // Higher threshold for direct navigation
                e.preventDefault();
                resetScrollBuffer();
                handleSectionNavigation(e.deltaY);
            }
        }
    }, { passive: false });
    
    function handleBufferZoneScroll(deltaY, sectionContent, currentTime) {
        const scrollDirection = deltaY > 0 ? 1 : -1;
        const timeDelta = currentTime - lastScrollTime;
        
        // Calculate scroll momentum (pixels per millisecond)
        scrollMomentum = timeDelta > 0 ? Math.abs(deltaY) / timeDelta : 0;
        
        // Reset buffer if direction changed or too much time passed
        if (bufferDirection !== scrollDirection || timeDelta > 500) {
            resetScrollBuffer();
            bufferDirection = scrollDirection;
        }
        
        // Apply velocity multiplier to reduce sensitivity
        const adjustedDelta = Math.abs(deltaY) * SCROLL_VELOCITY_MULTIPLIER;
        const momentumMultiplier = Math.min(scrollMomentum / MOMENTUM_THRESHOLD, 2);
        scrollBuffer += adjustedDelta * momentumMultiplier;
        lastScrollTime = currentTime;
        
        updateBufferVisualFeedback(sectionContent, scrollBuffer, scrollDirection);
        
        // Clear existing navigation timeout
        if (navigationTimeout) {
            clearTimeout(navigationTimeout);
        }
        
        // Dynamic delay based on momentum (faster scrolling = shorter delay)
        const dynamicDelay = Math.max(NAVIGATION_DELAY - (scrollMomentum * 50), 100);
        
        // Check if buffer threshold is reached
        if (scrollBuffer >= SCROLL_BUFFER_THRESHOLD) {
            navigationTimeout = setTimeout(() => {
                resetScrollBuffer();
                handleSectionNavigation(deltaY);
            }, dynamicDelay);
        }
    }
    
    function resetScrollBuffer() {
        scrollBuffer = 0;
        bufferDirection = 0;
        if (navigationTimeout) {
            clearTimeout(navigationTimeout);
            navigationTimeout = null;
        }
        // Clear visual feedback
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('buffer-zone-top', 'buffer-zone-bottom');
            section.style.removeProperty('--buffer-progress');
        });
    }
    
    function updateBufferVisualFeedback(sectionContent, buffer, direction) {
        const progress = Math.min(buffer / SCROLL_BUFFER_THRESHOLD, 1);
        
        // Add visual feedback classes
        sectionContent.classList.remove('buffer-zone-top', 'buffer-zone-bottom');
        if (direction < 0) {
            sectionContent.classList.add('buffer-zone-top');
        } else {
            sectionContent.classList.add('buffer-zone-bottom');
        }
        
        // Set CSS custom property for progress indication
        sectionContent.style.setProperty('--buffer-progress', progress);
    }
    
    function handleSectionNavigation(deltaY) {
        if (isNavigating) return;
        
        isNavigating = true;
        
        const container = document.querySelector('.horizontal-container');
        container.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        
        if (deltaY > 0) {
            goToSection(currentSection + 1);
        } else {
            goToSection(currentSection - 1);
        }
        
        // Reset navigation flag with enhanced timing
        setTimeout(() => {
            isNavigating = false;
            // Reset to default transition for other interactions
            container.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }, 800);
    }
    
    // Navigation menu clicks
    
    // Navigation menu clicks - improved with better debugging
    const navLinks = document.querySelectorAll('.nav-links a[data-section]');
    
    navLinks.forEach((link, index) => {
        const sectionIndex = parseInt(link.getAttribute('data-section'));
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            goToSection(sectionIndex);
        });
    });
    
    function updateActiveNavLink() {
        navLinks.forEach((link) => {
            const linkSection = parseInt(link.getAttribute('data-section'));
            const isActive = linkSection === currentSection;
            link.classList.toggle('active', isActive);
        });
    }
    
    // Initialize
    updateNavigation();
}

function showGitHubLoadingSkeleton() {
    const projectsList = document.getElementById('projects-list');
    const pullRequests = document.getElementById('pull-requests');
    
    if (projectsList) {
        projectsList.innerHTML = `
            <div class="github-loading">
                <div class="skeleton-card">
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton skeleton-text long"></div>
                </div>
                <div class="skeleton-card">
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton skeleton-text long"></div>
                </div>
                <div class="skeleton-card">
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton skeleton-text long"></div>
                </div>
            </div>
        `;
    }
    
    if (pullRequests) {
        pullRequests.innerHTML = `
            <div class="github-loading">
                <div class="skeleton-card">
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton skeleton-text long"></div>
                </div>
                <div class="skeleton-card">
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton skeleton-text long"></div>
                </div>
            </div>
        `;
    }
}

async function fetchGitHubData() {
    showGitHubLoadingSkeleton();
    
    try {
        const rateLimitResponse = await fetch(`${GITHUB_API_BASE}/rate_limit`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (rateLimitResponse.ok) {
            const rateLimitData = await rateLimitResponse.json();
            
            if (rateLimitData.rate.remaining < 10) {
                const resetTime = new Date(rateLimitData.rate.reset * 1000);
                throw new Error(`GitHub API rate limit exceeded. Resets at ${resetTime.toLocaleTimeString()}`);
            }
        }

        const repoNames = ['dsa-rs', 'smol-evm', 'coding-interview-patterns', 'merkle-tree-rs'];
        
        const repoPromises = repoNames.map(async (repoName) => {
            try {
                const repoUrl = `${GITHUB_API_BASE}/repos/${GITHUB_USERNAME}/${repoName}`;
                
                const response = await fetch(repoUrl, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (response.ok) {
                    const repo = await response.json();
                    return repo;
                } else if (response.status === 404) {
                    return null;
                } else if (response.status === 403) {
                    return null;
                } else {
                    return null;
                }
            } catch (error) {
                return null;
            }
        });

        let fallbackRepos = [];
        try {
            const userReposResponse = await fetch(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=10&type=public`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (userReposResponse.ok) {
                fallbackRepos = await userReposResponse.json();
            }
        } catch (error) {
            // Fallback failed
        }

        let prsData = { items: [] };
        try {
            const prsUrl = `${GITHUB_API_BASE}/search/issues?q=author:${GITHUB_USERNAME}+type:pr&sort=updated&per_page=15`;
            
            const prsResponse = await fetch(prsUrl, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            console.log('📡 PRs response:', {
                status: prsResponse.status,
                statusText: prsResponse.statusText,
                rateLimitRemaining: prsResponse.headers.get('x-ratelimit-remaining')
            });

            if (prsResponse.ok) {
                prsData = await prsResponse.json();
                console.log(`📊 Found ${prsData.items?.length || 0} pull requests`);
            } else {
                console.warn('❌ Failed to fetch pull requests:', prsResponse.status, prsResponse.statusText);
            }
        } catch (error) {
            console.error('❌ Error fetching pull requests:', error);
        }

        // Process results
        const specificRepos = (await Promise.all(repoPromises)).filter(repo => repo !== null);
        let reposToShow = specificRepos;

        // Use fallback if no specific repos found
        if (reposToShow.length === 0) {
            console.log('📦 Using fallback repositories...');
            reposToShow = fallbackRepos
                .filter(repo => !repo.fork) // Exclude forks
                .sort((a, b) => (b.stargazers_count + b.forks_count) - (a.stargazers_count + a.forks_count))
                .slice(0, 6);
        }

        console.log('✅ GitHub data fetch completed');
        console.log(`📊 Final results: ${reposToShow.length} repos, ${prsData.items?.length || 0} PRs`);
        
        // Render the data
        renderProjects(reposToShow);
        renderPullRequestsWithContributions(prsData.items || [], null);

    } catch (error) {
        console.error('❌ Critical error fetching GitHub data:', error);
        
        document.getElementById('projects-list').innerHTML = 
            `<div class="loading">Fetching project data...</div>`;
        document.getElementById('pull-requests').innerHTML = 
            `<div class="loading">Loading contributions...</div>`;
    }
}

function renderProjects(repos) {
    const projectsList = document.getElementById('projects-list');
    
    console.log('🎨 Rendering projects:', repos);
    
    if (!repos || repos.length === 0) {
        projectsList.innerHTML = `
            <div class="loading">
                📦 No repositories found. 
                <br><small>This might be due to API rate limits or repository privacy settings.</small>
                <br><small>Check the browser console for more details.</small>
            </div>`;
        return;
    }

    // Filter and sort repositories
    const filteredRepos = repos
        .filter(repo => {
            const isValidRepo = repo && repo.name && repo.html_url;
            if (!isValidRepo) {
                console.warn('Filtering out invalid repo:', repo);
            }
            return isValidRepo;
        })
        .filter(repo => !repo.fork || repo.stargazers_count > 0) // Keep popular forks
        .sort((a, b) => {
            // Sort by stars + forks, then by update date
            const aScore = (a.stargazers_count || 0) + (a.forks_count || 0);
            const bScore = (b.stargazers_count || 0) + (b.forks_count || 0);
            if (aScore !== bScore) return bScore - aScore;
            return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
        })
        .slice(0, 8);

    console.log('🎨 Filtered and sorted repos:', filteredRepos.map(r => ({
        name: r.name,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language
    })));

    if (filteredRepos.length === 0) {
        projectsList.innerHTML = `
            <div class="loading">
                📦 No valid repositories to display after filtering.
                <br><small>Repositories might be private or have API access issues.</small>
            </div>`;
        return;
    }

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
                ⭐ ${repo.stargazers_count || 0} • 🍴 ${repo.forks_count || 0}
                ${repo.topics && repo.topics.length > 0 ? ' • 🏷️ ' + repo.topics.slice(0, 3).join(', ') : ''}
            </div>
        </div>
    `).join('');
    
    console.log('✅ Projects rendered successfully');
}

function renderPullRequestsWithContributions(prs, contributedRepos) {
    const prContainer = document.getElementById('pull-requests');
    
    console.log('🎨 Rendering pull requests...');
    
    let html = '';
    
    // Add Recent Pull Requests section header
    html += '<h4 style="margin-top: 2rem;">Recent Pull Requests</h4>';
    
    // Add pull requests section
    if (!prs || prs.length === 0) {
        html += '<div class="loading">No pull requests found.</div>';
        prContainer.innerHTML = html;
        return;
    }

    console.log('🔍 Processing pull requests:', prs.length);
    
    // Set initial content while loading detailed PR info
    prContainer.innerHTML = html + '<div class="loading">Loading pull request details...</div>';

    // Fetch detailed PR information for accurate status
    const prPromises = prs.slice(0, 10).map(async (pr, index) => {
        try {
            console.log(`📡 Fetching PR details ${index + 1}/${Math.min(10, prs.length)}: ${pr.title}`);
            
            const prDetailResponse = await fetch(pr.pull_request.url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (prDetailResponse.ok) {
                const prDetail = await prDetailResponse.json();
                return {
                    ...pr,
                    merged_at: prDetail.merged_at,
                    merged: prDetail.merged
                };
            } else {
                console.warn(`⚠️ Failed to fetch PR details for: ${pr.title}`);
            }
        } catch (error) {
            console.warn('❌ Error fetching PR details:', error);
        }
        return pr;
    });

    Promise.all(prPromises).then(detailedPrs => {
        console.log('✅ All PR details fetched, rendering...');
        
        const prHtml = detailedPrs.map(pr => {
            let status, statusClass;
            if (pr.state === 'open') {
                status = 'Open';
                statusClass = 'status-open';
            } else if (pr.merged_at || pr.merged) {
                status = 'Merged';
                statusClass = 'status-merged';
            } else {
                status = 'Closed';
                statusClass = 'status-closed';
            }
            
            return `
                <div class="pr-item">
                    <span class="pr-status ${statusClass}">
                        ${status}
                    </span>
                    <a href="${pr.html_url}" target="_blank" class="pr-title">${pr.title}</a>
                    <div class="pr-meta">
                        ${extractRepo(pr.repository_url)} • ${formatDate(pr.updated_at)}
                    </div>
                </div>
            `;
        }).join('');
        
        prContainer.innerHTML = html + `<div class="pr-grid">${prHtml}</div>`;
        console.log('✅ Pull requests rendered successfully');
    }).catch(error => {
        console.error('❌ Error processing PR details:', error);
        
        // Fallback rendering without detailed status
        const fallbackPrHtml = prs.slice(0, 10).map(pr => `
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
        
        prContainer.innerHTML = html + `<div class="pr-grid">${fallbackPrHtml}</div>`;
        console.log('✅ Pull requests rendered with fallback');
    });
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

    // Initialize horizontal navigation
    initHorizontalNavigation();

    function updateScrollProgress() {
        // Now handled by horizontal navigation
        const progress = (currentSection / (totalSections - 1)) * 100;
        const progressBar = document.querySelector('.scroll-progress-bar');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }

    // Update progress when section changes
    const observer = new MutationObserver(() => {
        updateScrollProgress();
    });
    
    const progressBar = document.querySelector('.scroll-progress-bar');
    if (progressBar) {
        observer.observe(progressBar, { attributes: true, attributeFilter: ['style'] });
    }
});

// Initialize mobile menu and visual enhancements when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing components...');

    // Fetch GitHub data when page loads
    fetchGitHubData();
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

// Mobile menu functionality
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;
    
    // Create mobile overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    body.appendChild(overlay);
    
    // Toggle mobile menu
    function toggleMobileMenu() {
        const isOpen = navLinks.classList.contains('mobile-open');
        
        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }
    
    function openMobileMenu() {
        mobileToggle.classList.add('active');
        navLinks.classList.add('mobile-open');
        overlay.classList.add('active');
        body.style.overflow = 'hidden';
        
        // Set ARIA attributes for accessibility
        mobileToggle.setAttribute('aria-expanded', 'true');
        navLinks.setAttribute('aria-hidden', 'false');
    }
    
    function closeMobileMenu() {
        mobileToggle.classList.remove('active');
        navLinks.classList.remove('mobile-open');
        overlay.classList.remove('active');
        body.style.overflow = '';
        
        // Set ARIA attributes for accessibility
        mobileToggle.setAttribute('aria-expanded', 'false');
        navLinks.setAttribute('aria-hidden', 'true');
    }
    
    // Event listeners
    mobileToggle.addEventListener('click', toggleMobileMenu);
    overlay.addEventListener('click', closeMobileMenu);
    
    // Close menu when clicking nav links
    navLinks.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            closeMobileMenu();
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('mobile-open')) {
            closeMobileMenu();
        }
    });
    
    // Set initial ARIA attributes
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.setAttribute('aria-label', 'Toggle navigation menu');
    navLinks.setAttribute('aria-hidden', 'true');
}

function initVisualEnhancements() {
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.section').forEach(section => {
        sectionObserver.observe(section);
    });

    document.querySelectorAll('.project-card, .skill-item, .social-icon').forEach(element => {
        element.classList.add('interactive-pulse');
    });

    document.querySelectorAll('.project-card, .pull-request').forEach(card => {
        card.classList.add('card-hover-effect');
    });

    const bufferIndicators = document.querySelectorAll('.buffer-indicator');
    window.addEventListener('scroll', () => {
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        bufferIndicators.forEach((indicator, index) => {
            const sectionPercent = index / (bufferIndicators.length - 1);
            if (Math.abs(scrollPercent - sectionPercent) < 0.1) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initVisualEnhancements();

    const horizontalContainer = document.querySelector('.horizontal-container');
    if (horizontalContainer) {
        setTimeout(() => {
            horizontalContainer.classList.add('loaded');
        }, 100);
    }

    fetchGitHubData();
});
