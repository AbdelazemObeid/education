/* ===================================================================
 * Ashion - Main JS (Vanilla JavaScript)
 * Version: 2.0.0
 * ------------------------------------------------------------------- */

(function () {
    'use strict';

    /* --------------------------------------------------
     * Preloader
     * -------------------------------------------------- */
    function initPreloader() {
        function hidePreloader() {
            var loader = document.querySelector('.loader');
            var preloader = document.getElementById('preloder');

            if (loader) loader.style.opacity = '0';
            if (preloader) {
                setTimeout(function () {
                    preloader.style.opacity = '0';
                    preloader.style.visibility = 'hidden';
                }, 200);
            }
        }

        // If page already loaded (component injection happened after load)
        if (document.readyState === 'complete') {
            hidePreloader();
        } else {
            window.addEventListener('load', hidePreloader);
        }
    }

    /* --------------------------------------------------
     * WebP Support Detection
     * -------------------------------------------------- */
    function detectWebPSupport() {
        // Check if already detected
        if (document.documentElement.classList.contains('webp') ||
            document.documentElement.classList.contains('no-webp')) {
            return document.documentElement.classList.contains('webp');
        }

        // Modern detection using createImageBitmap (faster, async)
        if (window.createImageBitmap) {
            var webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
            fetch(webpData)
                .then(function (r) { return r.blob(); })
                .then(function (blob) { return createImageBitmap(blob); })
                .then(function () {
                    document.documentElement.classList.add('webp');
                    document.documentElement.classList.remove('no-webp');
                })
                .catch(function () {
                    document.documentElement.classList.add('no-webp');
                    document.documentElement.classList.remove('webp');
                });
        }

        // Fallback: canvas method (sync, for immediate use)
        try {
            var canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            var supported = canvas.toDataURL('image/webp').indexOf('webp') > 0;
            document.documentElement.classList.add(supported ? 'webp' : 'no-webp');
            return supported;
        } catch (e) {
            document.documentElement.classList.add('no-webp');
            return false;
        }
    }

    /* --------------------------------------------------
     * Background Image from Data Attribute
     * -------------------------------------------------- */
    function initSetBackground(root) {
        root = root || document;
        var supportsWebP = document.documentElement.classList.contains('webp');

        document.querySelectorAll('.set-bg').forEach(function (el) {
            var bg = el.dataset.setbg;
            var bgWebp = el.dataset.setbgWebp;

            if (bg) {
                var finalBg = bg;

                // Use explicit WebP path if provided
                if (supportsWebP && bgWebp) {
                    finalBg = bgWebp;
                }
                // Auto-detect WebP: try appending .webp to the original path
                // This handles the common naming convention: image.jpg -> image.jpg.webp
                else if (supportsWebP && !bg.match(/\.webp$/i)) {
                    finalBg = bg + '.webp';
                }
                // Fallback: if bg is WebP but not supported, try removing .webp
                else if (!supportsWebP && bg.match(/\.webp$/i)) {
                    finalBg = bg.replace(/\.webp$/i, '');
                }

                el.style.backgroundImage = 'url(' + finalBg + ')';

                // Add fallback handling for background images
                // If WebP fails, fall back to original
                if (supportsWebP && finalBg !== bg) {
                    var testImg = new Image();
                    testImg.onerror = function () {
                        el.style.backgroundImage = 'url(' + bg + ')';
                    };
                    testImg.src = finalBg;
                }
            }
        });

        // Handle img tags without picture element
        document.querySelectorAll('img:not(picture img)').forEach(function (img) {
            var src = img.src;
            var dataWebp = img.dataset.webp;

            // Skip if already processed or no src
            if (!src || img.dataset.webpProcessed) return;
            img.dataset.webpProcessed = 'true';

            // Store original src for fallback
            var originalSrc = src;

            if (supportsWebP) {
                // Use explicit WebP path if provided via data attribute
                if (dataWebp) {
                    img.src = dataWebp;
                    originalSrc = src;
                }
                // Auto-detect: try WebP version (image.jpg -> image.jpg.webp)
                else if (!src.match(/\.webp$/i)) {
                    img.src = src + '.webp';
                }

                // Add error handler to fall back to original if WebP doesn't exist
                img.onerror = function () {
                    if (this.src !== originalSrc) {
                        this.onerror = null; // Prevent infinite loop
                        this.src = originalSrc;
                    }
                };
            } else {
                // Fallback for browsers without WebP support
                if (src.match(/\.webp$/i)) {
                    var fallback = img.dataset.fallback;
                    if (fallback) {
                        img.src = fallback;
                    } else {
                        // Remove .webp extension to get original
                        img.src = src.replace(/\.webp$/i, '');
                    }
                }
            }
        });
    }

    /* --------------------------------------------------
     * WebP Picture Element Helper
     * Creates responsive <picture> elements with WebP/fallback
     * Usage: createPictureElement('img/photo', 'jpg', 'Photo alt text', 'my-class')
     * -------------------------------------------------- */
    window.createPictureElement = function (basePath, fallbackExt, alt, className) {
        var picture = document.createElement('picture');
        if (className) picture.className = className;

        // WebP source
        var sourceWebP = document.createElement('source');
        sourceWebP.srcset = basePath + '.webp';
        sourceWebP.type = 'image/webp';
        picture.appendChild(sourceWebP);

        // Fallback image
        var img = document.createElement('img');
        img.src = basePath + '.' + (fallbackExt || 'jpg');
        img.alt = alt || '';
        img.loading = 'lazy';
        picture.appendChild(img);

        return picture;
    };

    /* --------------------------------------------------
     * Convert existing images to picture elements
     * Looks for img[data-webp] and wraps them in picture tags
     * -------------------------------------------------- */
    function initPictureElements() {
        document.querySelectorAll('img[data-webp]:not(picture img)').forEach(function (img) {
            var webpSrc = img.dataset.webp;
            var fallbackSrc = img.src;

            // Create picture element
            var picture = document.createElement('picture');

            // Copy classes from img to picture
            if (img.className) {
                picture.className = img.className;
                img.className = '';
            }

            // WebP source
            var sourceWebP = document.createElement('source');
            sourceWebP.srcset = webpSrc;
            sourceWebP.type = 'image/webp';

            // Replace img with picture
            img.parentNode.insertBefore(picture, img);
            picture.appendChild(sourceWebP);
            picture.appendChild(img);

            // Remove data attribute after processing
            img.removeAttribute('data-webp');
        });
    }

    /* --------------------------------------------------
     * Search Modal (with keyboard support)
     * -------------------------------------------------- */
    function initSearchModal() {
        var searchModel = document.querySelector('.search-model');
        var searchSwitches = document.querySelectorAll('.search-switch');
        var searchClose = document.querySelector('.search-close-switch');
        var searchInput = document.getElementById('search-input');
        var lastFocusedElement = null;

        function openSearch() {
            if (searchModel) {
                lastFocusedElement = document.activeElement;
                searchModel.removeAttribute('hidden');
                searchModel.style.display = 'block';
                setTimeout(function () {
                    searchModel.style.opacity = '1';
                }, 10);
                if (searchInput) searchInput.focus();
                document.body.style.overflow = 'hidden';
            }
        }

        function closeSearch() {
            if (searchModel) {
                searchModel.style.opacity = '0';
                setTimeout(function () {
                    searchModel.style.display = 'none';
                    searchModel.setAttribute('hidden', '');
                    if (searchInput) searchInput.value = '';
                    document.body.style.overflow = '';
                    if (lastFocusedElement) lastFocusedElement.focus();
                }, 400);
            }
        }

        searchSwitches.forEach(function (trigger) {
            trigger.addEventListener('click', openSearch);
            trigger.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openSearch();
                }
            });
        });

        if (searchClose) {
            searchClose.addEventListener('click', closeSearch);
            searchClose.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    closeSearch();
                }
            });
        }

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && searchModel && searchModel.style.display === 'block') {
                closeSearch();
            }
        });

        // Close on overlay click
        if (searchModel) {
            searchModel.addEventListener('click', function (e) {
                if (e.target === searchModel || e.target.classList.contains('d-flex')) {
                    closeSearch();
                }
            });
        }
    }

    /* --------------------------------------------------
     * Off-Canvas Mobile Menu (with keyboard support)
     * -------------------------------------------------- */
    function initOffCanvasMenu() {
        var menuWrapper = document.querySelector('.offcanvas-menu-wrapper');
        var menuOverlay = document.querySelector('.offcanvas-menu-overlay');
        var canvasOpen = document.querySelector('.canvas__open');
        var canvasClose = document.querySelector('.offcanvas__close');
        var lastFocusedElement = null;

        function openMenu() {
            if (menuWrapper && menuOverlay) {
                lastFocusedElement = document.activeElement;
                menuWrapper.classList.add('active');
                menuOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                if (canvasOpen) canvasOpen.setAttribute('aria-expanded', 'true');
                // Focus close button
                if (canvasClose) canvasClose.focus();
            }
        }

        function closeMenu() {
            if (menuWrapper && menuOverlay) {
                menuWrapper.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.style.overflow = '';
                if (canvasOpen) canvasOpen.setAttribute('aria-expanded', 'false');
                if (lastFocusedElement) lastFocusedElement.focus();
            }
        }

        if (canvasOpen) {
            canvasOpen.addEventListener('click', openMenu);
            canvasOpen.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openMenu();
                }
            });
        }

        [menuOverlay, canvasClose].forEach(function (el) {
            if (el) {
                el.addEventListener('click', closeMenu);
                if (el === canvasClose) {
                    el.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            closeMenu();
                        }
                    });
                }
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menuWrapper && menuWrapper.classList.contains('active')) {
                closeMenu();
            }
        });

        // Trap focus within mobile menu when open
        if (menuWrapper) {
            menuWrapper.addEventListener('keydown', function (e) {
                if (e.key === 'Tab' && menuWrapper.classList.contains('active')) {
                    var focusables = menuWrapper.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    var firstFocusable = focusables[0];
                    var lastFocusable = focusables[focusables.length - 1];

                    if (e.shiftKey && document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            });
        }
    }

    /* --------------------------------------------------
     * Mobile Navigation (replaces SlickNav)
     * -------------------------------------------------- */
    function initMobileNav() {
        var headerMenu = document.querySelector('.header__menu ul');
        var mobileMenuWrap = document.getElementById('mobile-menu-wrap');

        if (!headerMenu || !mobileMenuWrap) return;

        // Prevent duplicate initialization
        if (mobileMenuWrap.querySelector('.mobile-menu')) return;

        // Clone menu for mobile
        var mobileMenu = headerMenu.cloneNode(true);
        mobileMenu.classList.add('mobile-menu');
        mobileMenuWrap.appendChild(mobileMenu);

        // Handle dropdowns - only top-level li items with direct dropdown children
        var topLevelItems = mobileMenu.children;
        for (var i = 0; i < topLevelItems.length; i++) {
            var li = topLevelItems[i];
            if (li.tagName !== 'LI') continue;

            // Find direct .dropdown child
            var dropdown = null;
            var children = li.children;
            for (var j = 0; j < children.length; j++) {
                if (children[j].classList && children[j].classList.contains('dropdown')) {
                    dropdown = children[j];
                    break;
                }
            }

            if (dropdown) {
                var toggle = document.createElement('span');
                toggle.className = 'dropdown-toggle';
                toggle.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
                li.insertBefore(toggle, dropdown);

                (function (dropdown, toggle) {
                    toggle.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        dropdown.classList.toggle('show');
                        toggle.classList.toggle('active');
                    });
                })(dropdown, toggle);
            }
        }
    }

    /* --------------------------------------------------
     * Product Filter (replaces MixItUp)
     * -------------------------------------------------- */
    function initProductFilter() {
        var controls = document.querySelectorAll('.filter__controls li');
        var gallery = document.querySelector('.property__gallery');

        if (!controls.length || !gallery) return;

        controls.forEach(function (control) {
            control.addEventListener('click', function () {
                // Update active state
                controls.forEach(function (c) { c.classList.remove('active'); });
                this.classList.add('active');

                var filter = this.dataset.filter;
                var items = gallery.querySelectorAll('[class*="col-"]');

                items.forEach(function (item) {
                    item.style.transition = 'opacity 0.3s ease';

                    if (filter === '*') {
                        item.style.display = '';
                        setTimeout(function () {
                            item.style.opacity = '1';
                        }, 10);
                    } else {
                        var filterClass = filter.replace('.', '');
                        if (item.classList.contains(filterClass)) {
                            item.style.display = '';
                            setTimeout(function () {
                                item.style.opacity = '1';
                            }, 10);
                        } else {
                            item.style.opacity = '0';
                            setTimeout(function () {
                                item.style.display = 'none';
                            }, 300);
                        }
                    }
                });
            });
        });
    }

    /* --------------------------------------------------
     * Banner Slider (replaces Owl Carousel)
     * -------------------------------------------------- */
    function initBannerSlider() {
        var slider = document.querySelector('.banner__slider');
        if (!slider) return;

        var items = slider.querySelectorAll('.banner__item');
        if (items.length <= 1) return;

        var currentIndex = 0;
        var autoplayInterval;

        // Create wrapper and dots
        var wrapper = document.createElement('div');
        wrapper.className = 'banner__slider-wrapper';

        items.forEach(function (item, i) {
            if (i === 0) {
                item.classList.add('active');
            }
            wrapper.appendChild(item.cloneNode(true));
        });

        slider.innerHTML = '';
        slider.appendChild(wrapper);

        var slides = wrapper.querySelectorAll('.banner__item');

        // Create dots
        var dotsContainer = document.createElement('div');
        dotsContainer.className = 'banner__dots';
        slides.forEach(function (_, i) {
            var dot = document.createElement('span');
            dot.className = 'banner__dot' + (i === 0 ? ' active' : '');
            dot.dataset.index = i;
            dotsContainer.appendChild(dot);
        });
        slider.appendChild(dotsContainer);

        function showSlide(index) {
            if (index < 0) index = slides.length - 1;
            if (index >= slides.length) index = 0;

            slides.forEach(function (slide, i) {
                slide.classList.toggle('active', i === index);
            });
            dotsContainer.querySelectorAll('.banner__dot').forEach(function (dot, i) {
                dot.classList.toggle('active', i === index);
            });
            currentIndex = index;
        }

        function nextSlide() {
            showSlide(currentIndex + 1);
        }

        // Initialize
        showSlide(0);
        autoplayInterval = setInterval(nextSlide, 5000);

        // Dot clicks
        dotsContainer.addEventListener('click', function (e) {
            if (e.target.classList.contains('banner__dot')) {
                clearInterval(autoplayInterval);
                showSlide(parseInt(e.target.dataset.index, 10));
                autoplayInterval = setInterval(nextSlide, 5000);
            }
        });

        // Touch support
        var touchStartX = 0;
        slider.addEventListener('touchstart', function (e) {
            touchStartX = e.changedTouches[0].screenX;
            clearInterval(autoplayInterval);
        }, { passive: true });

        slider.addEventListener('touchend', function (e) {
            var diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) {
                showSlide(diff > 0 ? currentIndex + 1 : currentIndex - 1);
            }
            autoplayInterval = setInterval(nextSlide, 5000);
        }, { passive: true });
    }

    /* --------------------------------------------------
     * Product Details Slider
     * -------------------------------------------------- */
    function initProductSlider() {
        var slider = document.querySelector('.product__details__pic__slider');
        if (!slider) return;

        var items = slider.querySelectorAll('.product__details__pic__item');
        var thumbs = document.querySelectorAll('.product__thumb a');
        var currentIndex = 0;

        if (items.length === 0) return;

        function showSlide(index) {
            if (index < 0) index = items.length - 1;
            if (index >= items.length) index = 0;

            items.forEach(function (item, i) {
                item.classList.toggle('active', i === index);
            });
            thumbs.forEach(function (thumb, i) {
                thumb.classList.toggle('active', i === index);
            });
            currentIndex = index;
        }

        // Initialize from URL hash or first slide
        var hash = window.location.hash;
        if (hash && hash.startsWith('#product-')) {
            var hashIndex = parseInt(hash.replace('#product-', ''), 10) - 1;
            if (!isNaN(hashIndex) && hashIndex >= 0 && hashIndex < items.length) {
                showSlide(hashIndex);
            } else {
                showSlide(0);
            }
        } else {
            showSlide(0);
        }

        // Thumbnail clicks
        thumbs.forEach(function (thumb, index) {
            thumb.addEventListener('click', function (e) {
                e.preventDefault();
                showSlide(index);
            });
        });

        // Navigation arrows (if present)
        var navPrev = slider.querySelector('.nav-prev');
        var navNext = slider.querySelector('.nav-next');

        if (navPrev) {
            navPrev.addEventListener('click', function (e) {
                e.preventDefault();
                showSlide(currentIndex - 1);
            });
        }
        if (navNext) {
            navNext.addEventListener('click', function (e) {
                e.preventDefault();
                showSlide(currentIndex + 1);
            });
        }

        // Touch/swipe support
        var touchStartX = 0;
        slider.addEventListener('touchstart', function (e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        slider.addEventListener('touchend', function (e) {
            var diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) {
                showSlide(diff > 0 ? currentIndex + 1 : currentIndex - 1);
            }
        }, { passive: true });
    }

    /* --------------------------------------------------
     * Countdown Timer (replaces jQuery Countdown)
     * -------------------------------------------------- */
    function initCountdown() {
        var countdownEl = document.getElementById('countdown-time');
        if (!countdownEl) return;

        // Set target date (1 month from now for demo)
        var now = new Date();
        var targetDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

        function updateCountdown() {
            var now = new Date().getTime();
            var distance = targetDate.getTime() - now;

            if (distance < 0) {
                countdownEl.innerHTML = '<div class="countdown__item"><span>0</span><p>Day</p></div>' +
                    '<div class="countdown__item"><span>0</span><p>Hour</p></div>' +
                    '<div class="countdown__item"><span>0</span><p>Min</p></div>' +
                    '<div class="countdown__item"><span>0</span><p>Sec</p></div>';
                return;
            }

            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);

            countdownEl.innerHTML =
                '<div class="countdown__item"><span>' + days + '</span><p>Day</p></div>' +
                '<div class="countdown__item"><span>' + hours + '</span><p>Hour</p></div>' +
                '<div class="countdown__item"><span>' + minutes + '</span><p>Min</p></div>' +
                '<div class="countdown__item"><span>' + seconds + '</span><p>Sec</p></div>';
        }

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    /* --------------------------------------------------
     * Price Range Slider (replaces jQuery UI)
     * -------------------------------------------------- */
    function initPriceRange() {
        var rangeSlider = document.querySelector('.price-range');
        if (!rangeSlider) return;

        var minInput = document.getElementById('minamount');
        var maxInput = document.getElementById('maxamount');
        var minPrice = parseInt(rangeSlider.dataset.min, 10) || 0;
        var maxPrice = parseInt(rangeSlider.dataset.max, 10) || 1000;

        // Create dual range slider with overlapping inputs on single track
        rangeSlider.innerHTML =
            '<div class="price-range__track"></div>' +
            '<div class="price-range__selected"></div>' +
            '<input type="range" class="price-range__input price-range__input--min" min="' + minPrice + '" max="' + maxPrice + '" value="' + minPrice + '">' +
            '<input type="range" class="price-range__input price-range__input--max" min="' + minPrice + '" max="' + maxPrice + '" value="' + maxPrice + '">';

        var rangeMin = rangeSlider.querySelector('.price-range__input--min');
        var rangeMax = rangeSlider.querySelector('.price-range__input--max');
        var rangeSelected = rangeSlider.querySelector('.price-range__selected');

        function updateRange() {
            var min = parseInt(rangeMin.value, 10);
            var max = parseInt(rangeMax.value, 10);

            // Prevent handles from crossing
            if (min > max - 1) {
                rangeMin.value = max - 1;
                min = max - 1;
            }
            if (max < min + 1) {
                rangeMax.value = min + 1;
                max = min + 1;
            }

            var percentMin = ((min - minPrice) / (maxPrice - minPrice)) * 100;
            var percentMax = ((max - minPrice) / (maxPrice - minPrice)) * 100;

            rangeSelected.style.left = percentMin + '%';
            rangeSelected.style.right = (100 - percentMax) + '%';

            if (minInput) minInput.value = '$' + min;
            if (maxInput) maxInput.value = '$' + max;
        }

        rangeMin.addEventListener('input', updateRange);
        rangeMax.addEventListener('input', updateRange);
        updateRange();
    }

    /* --------------------------------------------------
     * Quantity Buttons
     * -------------------------------------------------- */
    function initQuantityButtons() {
        document.querySelectorAll('.pro-qty').forEach(function (qtyWrapper) {
            var input = qtyWrapper.querySelector('input');
            if (!input) return;

            // Add buttons if not present
            if (!qtyWrapper.querySelector('.qtybtn')) {
                var decBtn = document.createElement('span');
                decBtn.className = 'dec qtybtn';
                decBtn.textContent = '-';

                var incBtn = document.createElement('span');
                incBtn.className = 'inc qtybtn';
                incBtn.textContent = '+';

                qtyWrapper.insertBefore(decBtn, input);
                qtyWrapper.appendChild(incBtn);
            }

            qtyWrapper.addEventListener('click', function (e) {
                if (!e.target.classList.contains('qtybtn')) return;

                var currentVal = parseInt(input.value, 10) || 0;

                if (e.target.classList.contains('inc')) {
                    input.value = currentVal + 1;
                } else if (e.target.classList.contains('dec') && currentVal > 0) {
                    input.value = currentVal - 1;
                }
            });
        });
    }

    /* --------------------------------------------------
     * Image Lightbox (GLightbox)
     * -------------------------------------------------- */
    function initLightbox() {
        if (typeof GLightbox === 'undefined') return;

        GLightbox({
            selector: '.image-popup',
            touchNavigation: true,
            loop: true
        });
    }

    /* --------------------------------------------------
     * Accordion Active States
     * -------------------------------------------------- */
    function initAccordion() {
        document.querySelectorAll('.collapse').forEach(function (collapse) {
            collapse.addEventListener('show.bs.collapse', function () {
                var trigger = document.querySelector('[data-bs-target="#' + this.id + '"]');
                if (trigger) trigger.classList.add('active');
            });
            collapse.addEventListener('hide.bs.collapse', function () {
                var trigger = document.querySelector('[data-bs-target="#' + this.id + '"]');
                if (trigger) trigger.classList.remove('active');
            });
        });
    }

    /* --------------------------------------------------
     * Size Button Selection
     * -------------------------------------------------- */
    function initSizeButtons() {
        document.querySelectorAll('.size__btn label').forEach(function (label) {
            label.addEventListener('click', function () {
                document.querySelectorAll('.size__btn label').forEach(function (l) {
                    l.classList.remove('active');
                });
                this.classList.add('active');
            });
        });
    }

    /* --------------------------------------------------
     * Nice Scroll replacement (CSS-based)
     * -------------------------------------------------- */
    function initCustomScrollbar() {
        // CSS handles scrollbar styling now via ::-webkit-scrollbar
        // This function is kept for potential future enhancements
    }

    /* --------------------------------------------------
     * Dropdown Keyboard Navigation
     * -------------------------------------------------- */
    function initDropdownKeyboard() {
        var dropdownItems = document.querySelectorAll('.header__menu .has-dropdown > a, .header__menu li:has(.dropdown) > a');

        dropdownItems.forEach(function (trigger) {
            var parent = trigger.parentElement;
            var dropdown = parent.querySelector('.dropdown');
            if (!dropdown) return;

            // Toggle on Enter/Space
            trigger.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    var isExpanded = trigger.getAttribute('aria-expanded') === 'true';
                    trigger.setAttribute('aria-expanded', !isExpanded);
                    dropdown.classList.toggle('show');

                    if (!isExpanded) {
                        var firstLink = dropdown.querySelector('a');
                        if (firstLink) firstLink.focus();
                    }
                }

                // Arrow down opens dropdown
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    trigger.setAttribute('aria-expanded', 'true');
                    dropdown.classList.add('show');
                    var firstLink = dropdown.querySelector('a');
                    if (firstLink) firstLink.focus();
                }
            });

            // Navigate within dropdown
            dropdown.addEventListener('keydown', function (e) {
                var links = dropdown.querySelectorAll('a');
                var currentIndex = Array.from(links).indexOf(document.activeElement);

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    var nextIndex = (currentIndex + 1) % links.length;
                    links[nextIndex].focus();
                }

                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    var prevIndex = currentIndex - 1;
                    if (prevIndex < 0) prevIndex = links.length - 1;
                    links[prevIndex].focus();
                }

                if (e.key === 'Escape') {
                    trigger.setAttribute('aria-expanded', 'false');
                    dropdown.classList.remove('show');
                    trigger.focus();
                }

                if (e.key === 'Tab' && !e.shiftKey && currentIndex === links.length - 1) {
                    trigger.setAttribute('aria-expanded', 'false');
                    dropdown.classList.remove('show');
                }
            });

            // Close on click outside
            document.addEventListener('click', function (e) {
                if (!parent.contains(e.target)) {
                    trigger.setAttribute('aria-expanded', 'false');
                    dropdown.classList.remove('show');
                }
            });
        });
    }

    /* --------------------------------------------------
     * Form Validation
     * -------------------------------------------------- */
    function initFormValidation() {
        var validatedForms = document.querySelectorAll('.checkout__form, .contact__form form, .newsletter-form');

        var errorMessages = {
            valueMissing: 'This field is required',
            typeMismatch: 'Please enter a valid value',
            patternMismatch: 'Please match the required format',
            tooShort: 'Please enter at least {minLength} characters',
            tooLong: 'Please enter no more than {maxLength} characters',
            email: 'Please enter a valid email address',
            tel: 'Please enter a valid phone number'
        };

        function getErrorMessage(input) {
            var validity = input.validity;

            if (validity.valueMissing) {
                return errorMessages.valueMissing;
            }
            if (validity.typeMismatch) {
                if (input.type === 'email') return errorMessages.email;
                return errorMessages.typeMismatch;
            }
            if (validity.patternMismatch) {
                if (input.type === 'tel') return errorMessages.tel;
                return errorMessages.patternMismatch;
            }
            if (validity.tooShort) {
                return errorMessages.tooShort.replace('{minLength}', input.minLength);
            }
            if (validity.tooLong) {
                return errorMessages.tooLong.replace('{maxLength}', input.maxLength);
            }
            return 'Please enter a valid value';
        }

        function showError(input, message) {
            var wrapper = input.closest('.checkout__form__input, .form-group');
            if (wrapper) {
                wrapper.classList.add('has-error');
                var errorEl = wrapper.querySelector('.error-message');
                if (errorEl) errorEl.textContent = message;
            }
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            input.setAttribute('aria-invalid', 'true');
        }

        function clearError(input) {
            var wrapper = input.closest('.checkout__form__input, .form-group');
            if (wrapper) {
                wrapper.classList.remove('has-error');
                var errorEl = wrapper.querySelector('.error-message');
                if (errorEl) errorEl.textContent = '';
            }
            input.classList.remove('is-invalid');
            if (input.value) input.classList.add('is-valid');
            input.setAttribute('aria-invalid', 'false');
        }

        function validateInput(input) {
            if (!input.checkValidity()) {
                showError(input, getErrorMessage(input));
                return false;
            }
            clearError(input);
            return true;
        }

        validatedForms.forEach(function (form) {
            var inputs = form.querySelectorAll('input, select, textarea');

            // Real-time validation on blur
            inputs.forEach(function (input) {
                input.addEventListener('blur', function () {
                    if (input.value || input.required) {
                        validateInput(input);
                    }
                });

                // Clear error on input
                input.addEventListener('input', function () {
                    if (input.classList.contains('is-invalid')) {
                        validateInput(input);
                    }
                });
            });

            // Validate on submit
            form.addEventListener('submit', function (e) {
                var isValid = true;
                var firstInvalidInput = null;

                inputs.forEach(function (input) {
                    if (!validateInput(input)) {
                        isValid = false;
                        if (!firstInvalidInput) firstInvalidInput = input;
                    }
                });

                if (!isValid) {
                    e.preventDefault();
                    if (firstInvalidInput) firstInvalidInput.focus();
                }
            });
        });
    }

    /* --------------------------------------------------
     * Checkbox Toggle Controls
     * -------------------------------------------------- */
    function initCheckboxControls() {
        // Toggle visibility of related fields based on checkbox state
        document.querySelectorAll('[aria-controls]').forEach(function (checkbox) {
            var targetId = checkbox.getAttribute('aria-controls');
            var target = document.getElementById(targetId);

            if (!target) return;

            function updateVisibility() {
                if (checkbox.checked) {
                    target.removeAttribute('hidden');
                    target.style.display = '';
                    // Make required inputs actually required when shown
                    target.querySelectorAll('input[aria-required="true"]').forEach(function (input) {
                        input.required = true;
                    });
                } else {
                    target.setAttribute('hidden', '');
                    target.style.display = 'none';
                    // Remove required when hidden
                    target.querySelectorAll('input').forEach(function (input) {
                        input.required = false;
                        input.classList.remove('is-invalid', 'is-valid');
                    });
                }
            }

            checkbox.addEventListener('change', updateVisibility);
            // Initialize on load
            updateVisibility();
        });
    }

    /* --------------------------------------------------
     * Skip Link Focus Management
     * -------------------------------------------------- */
    function initSkipLinks() {
        // Add skip link if not present
        var skipLink = document.querySelector('.skip-link');
        if (!skipLink) {
            skipLink = document.createElement('a');
            skipLink.href = '#main-content';
            skipLink.className = 'skip-link visually-hidden';
            skipLink.textContent = 'Skip to main content';
            document.body.insertBefore(skipLink, document.body.firstChild);
        }

        // Handle skip link click
        skipLink.addEventListener('click', function (e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.setAttribute('tabindex', '-1');
                target.focus();
                target.addEventListener('blur', function () {
                    target.removeAttribute('tabindex');
                }, { once: true });
            }
        });
    }

    /* --------------------------------------------------
     * Initialize All
     * -------------------------------------------------- */
    // Expose refreshBackgrounds globally for dynamic content
    window.refreshBackgrounds = function (root) {
        initSetBackground(root);
    };

    /**
     * Core initialization — called on DOMContentLoaded and after
     * shared components are injected.
     */
    function initAll() {
        detectWebPSupport();
        initPreloader();
        initSetBackground();
        initPictureElements();
        initSearchModal();
        initOffCanvasMenu();
        initMobileNav();
        initProductFilter();
        initBannerSlider();
        initProductSlider();
        initCountdown();
        initPriceRange();
        initQuantityButtons();
        initLightbox();
        initAccordion();
        initSizeButtons();
        initCustomScrollbar();
        initDropdownKeyboard();
        initFormValidation();
        initCheckboxControls();
        initSkipLinks();
    }

    document.addEventListener('DOMContentLoaded', initAll);

    // Re-initialize after shared components are loaded
    if (typeof window.onComponentsReady === 'function') {
        window.onComponentsReady(function () {
            initPreloader();
            initSetBackground();
            initSearchModal();
            initOffCanvasMenu();
            initMobileNav();
            initDropdownKeyboard();
            initFormValidation();
        });
    }

})();
