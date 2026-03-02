/**
 * products.js
 * Renders product grids dynamically from JSON data.
 */

document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const source = grid.getAttribute('data-product-source') || 'data/products.json';
    const limit = parseInt(grid.getAttribute('data-limit')) || 0;

    fetch(source)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${source}`);
            return response.text();
        })
        .then(text => JSON.parse(text))
        .then(data => {
            renderProducts(grid, data, limit);
        })
        .catch(error => console.error('Error loading products:', error));
});

function renderProducts(container, products, limit) {
    container.innerHTML = '';
    const itemsToShow = limit > 0 ? products.slice(0, limit) : products;

    itemsToShow.forEach(product => {
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-md-4 col-sm-6';
        if (product.categories) {
            product.categories.forEach(cat => col.classList.add(cat));
        }
        col.classList.add('mix');

        col.innerHTML = `
            <div class="product__item ${product.isSale ? 'sale' : ''}">
                <div class="product__item__pic set-bg" data-setbg="${product.image}">
                    ${product.label ? `<div class="label ${product.labelClass || ''}">${product.label}</div>` : ''}
                    <ul class="product__hover">
                        <li><a href="${product.image}" class="image-popup"><i class="fa-solid fa-eye"></i></a></li>
                        <li><a href="#"><span class="icon_heart_alt"></span></a></li>
                        <li><a href="#"><span class="icon_bag_alt"></span></a></li>
                    </ul>
                </div>
                <div class="product__item__text">
                    <h6><a href="./product-details.html">${product.title}</a></h6>
                    <div class="rating">
                        ${renderRating(product.rating || 0)}
                    </div>
                    <div class="product__price">$ ${product.price.toFixed(1)} ${product.oldPrice ? `<span>$ ${product.oldPrice.toFixed(1)}</span>` : ''}</div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });

    // Re-initialize background images and filters after dynamic load
    if (typeof initSetBackground === 'function') initSetBackground();
}

function renderRating(count) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
        stars += `<i class="fa-solid fa-star${i < count ? '' : '-o'}"></i>`;
    }
    return stars;
}
