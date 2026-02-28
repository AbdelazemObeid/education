/* ===================================================================
 * Ashion - Product Renderer
 * Renders product cards from JSON data into a container element.
 * ------------------------------------------------------------------- */

(function () {
    'use strict';

    /**
     * Creates the HTML for a single product card.
     * @param {Object} product - Product data object
     * @returns {string} HTML string
     */
    function createProductCard(product) {
        // Build label HTML
        var labelHtml = '';
        if (product.label) {
            var labelClass = 'label';
            var labelText = product.label;

            switch (product.label.toLowerCase()) {
                case 'new':
                    labelClass += ' new';
                    labelText = 'New';
                    break;
                case 'sale':
                    labelClass += ' sale';
                    labelText = 'Sale';
                    break;
                case 'out of stock':
                    labelClass += ' stockout';
                    labelText = 'Out of Stock';
                    break;
            }
            labelHtml = '<div class="' + labelClass + '">' + labelText + '</div>';
        }

        // Build star rating
        var starsHtml = '';
        var rating = product.rating || 0;
        for (var i = 0; i < 5; i++) {
            if (i < rating) {
                starsHtml += '<i class="fa-solid fa-star"></i>';
            } else {
                starsHtml += '<i class="fa-regular fa-star"></i>';
            }
        }

        // Build price (with optional old price)
        var priceHtml = '$ ' + product.price.toFixed(1);
        if (product.oldPrice) {
            priceHtml += ' <span>$ ' + product.oldPrice.toFixed(1) + '</span>';
        }

        // Determine sale class
        var itemClass = 'product__item';
        if (product.label && product.label.toLowerCase() === 'sale') {
            itemClass += ' sale';
        }

        var link = product.link || './product-details.html';

        return '' +
            '<div class="' + itemClass + '">' +
            '<div class="product__item__pic set-bg" data-setbg="' + product.image + '">' +
            labelHtml +
            '<ul class="product__hover">' +
            '<li><a href="' + link + '"><i class="fa-solid fa-eye"></i></a></li>' +
            '<li><a href="#"><span class="icon_heart_alt"></span></a></li>' +
            '<li><a href="#"><span class="icon_bag_alt"></span></a></li>' +
            '</ul>' +
            '</div>' +
            '<div class="product__item__text">' +
            '<h6><a href="' + link + '">' + product.name + '</a></h6>' +
            '<div class="rating">' + starsHtml + '</div>' +
            '<div class="product__price">' + priceHtml + '</div>' +
            '</div>' +
            '</div>';
    }

    /**
     * Renders a grid of product cards into a container.
     * @param {string} containerId - ID of the container element
     * @param {string} jsonPath    - Path to the JSON data file
     * @param {Object} [options]   - Optional settings
     * @param {string} [options.colClass] - Bootstrap column class (default: "col-lg-4 col-md-6")
     */
    function renderProductGrid(containerId, jsonPath, options) {
        var container = document.getElementById(containerId);
        if (!container) return;

        var opts = options || {};
        var colClass = opts.colClass || 'col-lg-4 col-md-6';

        fetch(jsonPath)
            .then(function (response) {
                if (!response.ok) throw new Error('Failed to load ' + jsonPath);
                return response.json();
            })
            .then(function (products) {
                var html = '';

                products.forEach(function (product) {
                    html += '<div class="' + colClass + '">';
                    html += createProductCard(product);
                    html += '</div>';
                });

                container.innerHTML = html;

                // Re-initialize background images for new elements
                if (typeof window.refreshBackgrounds === 'function') {
                    window.refreshBackgrounds();
                }
            })
            .catch(function (err) {
                console.error('Product render error:', err);
            });
    }

    // Auto-initialize any product grids with data-source attribute
    function initProductGrids() {
        var grids = document.querySelectorAll('[data-product-source]');
        grids.forEach(function (grid) {
            var source = grid.getAttribute('data-product-source');
            var colClass = grid.getAttribute('data-col-class') || 'col-lg-4 col-md-6';
            if (source && grid.id) {
                renderProductGrid(grid.id, source, { colClass: colClass });
            }
        });
    }

    // Initialize when components are ready
    if (typeof window.onComponentsReady === 'function') {
        window.onComponentsReady(initProductGrids);
    } else {
        // Fallback
        document.addEventListener('DOMContentLoaded', initProductGrids);
    }

    // Expose for manual usage
    window.renderProductGrid = renderProductGrid;

})();
