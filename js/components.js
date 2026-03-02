/**
 * components.js
 * Handles loading of shared HTML components (header, footer).
 */

document.addEventListener('DOMContentLoaded', function () {
    loadComponent('header-placeholder', 'partials/header.html', initHeader);
    loadComponent('footer-placeholder', 'partials/footer.html');
});

function loadComponent(placeholderId, url, callback) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${url}`);
            return response.text();
        })
        .then(data => {
            placeholder.innerHTML = data;
            if (callback) callback(placeholder);
        })
        .catch(error => console.error('Error loading component:', error));
}

function initHeader(container) {
    const activePage = container.getAttribute('data-active-page');
    if (activePage) {
        const navLinks = container.querySelectorAll('.header__menu ul li');
        navLinks.forEach(li => {
            const link = li.querySelector('a');
            if (link) {
                const href = link.getAttribute('href');
                if (href && (href.includes(activePage) || (activePage === 'home' && href.includes('index.html')))) {
                    li.classList.add('active');
                } else {
                    li.classList.remove('active');
                }
            }
        });
    }

    // Initialize search switch functionality for dynamically loaded header
    const searchSwitch = container.querySelector('.search-switch');
    if (searchSwitch) {
        searchSwitch.addEventListener('click', function () {
            const searchModel = document.querySelector('.search-model');
            if (searchModel) {
                searchModel.style.display = 'block';
                const searchInput = searchModel.querySelector('#search-input');
                if (searchInput) searchInput.focus();
            }
        });
    }
}
