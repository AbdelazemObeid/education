/* ===================================================================
 * Ashion - Component Loader
 * Loads shared header/footer HTML from partials to eliminate duplication.
 * ------------------------------------------------------------------- */

(function () {
    'use strict';

    // Global ready state for component loading
    window.__componentsReady = false;
    window.__onComponentsReady = [];

    /**
     * Register a callback to run after components are loaded.
     * If components are already loaded, runs immediately.
     */
    window.onComponentsReady = function (fn) {
        if (window.__componentsReady) {
            fn();
        } else {
            window.__onComponentsReady.push(fn);
        }
    };

    /**
     * Loads a partial HTML file and injects it into a placeholder element.
     */
    function loadPartial(placeholderId, partialPath) {
        var placeholder = document.getElementById(placeholderId);
        if (!placeholder) return Promise.resolve();

        return fetch(partialPath)
            .then(function (response) {
                if (!response.ok) throw new Error('Failed to load ' + partialPath);
                return response.text();
            })
            .then(function (html) {
                placeholder.outerHTML = html;
            });
    }

    /**
     * Sets the active class on the nav item matching the current page.
     */
    function setActiveNav() {
        var activePage = document.body.getAttribute('data-active-page') || '';
        if (!activePage) return;

        var navItems = document.querySelectorAll('.header__menu ul > li[data-page]');
        navItems.forEach(function (li) {
            if (li.getAttribute('data-page') === activePage) {
                li.classList.add('active');
            } else {
                li.classList.remove('active');
            }
        });
    }

    /**
     * Initialize components: load partials then fire callbacks.
     */
    function initComponents() {
        // Store active page in body before placeholders are replaced
        var headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            var activePage = headerPlaceholder.getAttribute('data-active-page') || '';
            document.body.setAttribute('data-active-page', activePage);
        }

        var loads = [];

        if (document.getElementById('header-placeholder')) {
            loads.push(loadPartial('header-placeholder', 'partials/header.html'));
        }
        if (document.getElementById('footer-placeholder')) {
            loads.push(loadPartial('footer-placeholder', 'partials/footer.html'));
        }

        if (loads.length === 0) {
            window.__componentsReady = true;
            return;
        }

        Promise.all(loads).then(function () {
            setActiveNav();

            // Mark ready and fire all queued callbacks
            window.__componentsReady = true;
            window.__onComponentsReady.forEach(function (fn) { fn(); });
            window.__onComponentsReady = [];
        });
    }

    // Run as early as possible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initComponents);
    } else {
        initComponents();
    }

})();
