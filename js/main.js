document.addEventListener('DOMContentLoaded', function () {

    // ===== Helper: Generate Slug =====
    function generateSlug(title) {
        return title
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // ===== Saved Orders (localStorage) =====
    function getSavedOrders() {
        try {
            return JSON.parse(localStorage.getItem('pub-orders')) || {};
        } catch (e) {
            return {};
        }
    }

    function saveOrder(pubId, images) {
        var orders = getSavedOrders();
        orders[pubId] = images;
        localStorage.setItem('pub-orders', JSON.stringify(orders));
    }

    function applySavedOrders(data) {
        var orders = getSavedOrders();
        var years = Object.keys(data);
        years.forEach(function(year) {
            var pubs = data[year];
            pubs.forEach(function(pub) {
                var slug = generateSlug(pub.title);
                var pubId = year + '/' + slug;
                if (orders[pubId]) {
                    var validImages = orders[pubId].filter(function(img) {
                        return pub.images.indexOf(img) !== -1;
                    });
                    pub.images.forEach(function(img) {
                        if (validImages.indexOf(img) === -1) {
                            validImages.push(img);
                        }
                    });
                    pub.images = validImages;
                }
            });
        });
    }

    // ===== Section Orders (localStorage) =====
    function getSectionOrders() {
        try {
            return JSON.parse(localStorage.getItem('pub-section-orders')) || {};
        } catch (e) {
            return {};
        }
    }

    function saveSectionOrder(year, pubIds) {
        var orders = getSectionOrders();
        orders[year] = pubIds;
        localStorage.setItem('pub-section-orders', JSON.stringify(orders));
    }

    function applySectionOrders(data) {
        var orders = getSectionOrders();
        Object.keys(orders).forEach(function(year) {
            if (data[year]) {
                var orderedPubs = [];
                var pubIds = orders[year];
                pubIds.forEach(function(pubId) {
                    var slug = pubId.split('/')[1];
                    var pub = data[year].find(function(p) {
                        return generateSlug(p.title) === slug;
                    });
                    if (pub) {
                        orderedPubs.push(pub);
                    }
                });
                data[year].forEach(function(pub) {
                    var slug = generateSlug(pub.title);
                    var pubId = year + '/' + slug;
                    if (pubIds.indexOf(pubId) === -1) {
                        orderedPubs.push(pub);
                    }
                });
                data[year] = orderedPubs;
            }
        });
    }

    // ===== Helper: Get Visitor ID =====
    function getVisitorId() {
        var id = localStorage.getItem('visitor-id');
        if (!id) {
            id = 'v_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('visitor-id', id);
        }
        return id;
    }

    // ===== Build Year Page (single year) =====
    function buildYearPage(data, year) {
        var container = document.getElementById('publications-container');
        if (!container) return;

        var pubs = data[year];
        if (!pubs || pubs.length === 0) return;

        var pubsHTML = '';
        pubs.forEach(function(pub) {
            var imagesHTML = '';
            if (pub.images) {
                pub.images.forEach(function(imgSrc, imgIndex) {
                    imagesHTML += '<div class="masonry-item" data-index="' + imgIndex + '" draggable="false">';
                    imagesHTML += '<img src="' + imgSrc + '" alt="' + pub.title + '" loading="lazy" onerror="this.style.display=\'none\'; console.warn(\'Imagen no encontrada:\', \'' + imgSrc.replace(/'/g, "\\'") + '\')">';
                    imagesHTML += '</div>';
                });
            }

            var slug = generateSlug(pub.title);
            var pubId = year + '/' + slug;

            pubsHTML += '<article class="publication" data-pub-id="' + pubId + '">';
            pubsHTML += '<header class="publication-header">';
            pubsHTML += '<h2 class="publication-title">' + pub.title + '</h2>';
            pubsHTML += '<div class="publication-actions">';
            pubsHTML += '<button class="like-btn" data-pub-id="' + pubId + '" aria-label="Me gusta">';
            pubsHTML += '<svg class="heart-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
            pubsHTML += '<span class="like-count">0</span>';
            pubsHTML += '</button>';
            pubsHTML += '<button class="share-btn" data-pub-id="' + pubId + '" data-title="' + pub.title + '" aria-label="Compartir">';
            pubsHTML += '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>';
            pubsHTML += '<span class="share-feedback">Copiado</span>';
            pubsHTML += '</button>';
            pubsHTML += '</div>';
            pubsHTML += '</header>';
            pubsHTML += '<div class="masonry-grid" data-pub-id="' + pubId + '">' + imagesHTML + '</div>';
            pubsHTML += '</article>';

            if (pub !== pubs[pubs.length - 1]) {
                pubsHTML += '<div class="publication-separator"></div>';
            }
        });

        container.innerHTML = pubsHTML;
    }

    // ===== Build Publications from JSON (all-years mode) =====
    function buildPublications(data) {
        var container = document.getElementById('publications-container');
        if (!container) return;

        var years = Object.keys(data).sort().reverse();
        var yearItemsHTML = '';

        years.forEach(function(year) {
            var pubs = data[year];
            var pubsHTML = '';

            pubs.forEach(function(pub) {
                var imagesHTML = '';
                if (pub.images) {
                    pub.images.forEach(function(imgSrc, imgIndex) {
                        imagesHTML += '<div class="masonry-item" data-index="' + imgIndex + '" draggable="false">';
                        imagesHTML += '<img src="' + imgSrc + '" alt="' + pub.title + '" loading="lazy" onerror="this.style.display=\'none\'; console.warn(\'Imagen no encontrada:\', \'' + imgSrc.replace(/'/g, "\\'") + '\')">';
                        imagesHTML += '</div>';
                    });
                }

                var slug = generateSlug(pub.title);
                var pubId = year + '/' + slug;

                pubsHTML += '<article class="publication" data-pub-id="' + pubId + '">';
                pubsHTML += '<header class="publication-header">';
                pubsHTML += '<h2 class="publication-title">' + pub.title + '</h2>';
                pubsHTML += '<div class="publication-actions">';
                pubsHTML += '<button class="like-btn" data-pub-id="' + pubId + '" aria-label="Me gusta">';
                pubsHTML += '<svg class="heart-icon" viewBox="0 0 24 24" width="18" height="18"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
                pubsHTML += '<span class="like-count">0</span>';
                pubsHTML += '</button>';
                pubsHTML += '<button class="share-btn" data-pub-id="' + pubId + '" data-title="' + pub.title + '" aria-label="Compartir">';
                pubsHTML += '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>';
                pubsHTML += '<span class="share-feedback">Copiado</span>';
                pubsHTML += '</button>';
                pubsHTML += '</div>';
                pubsHTML += '</header>';
                pubsHTML += '<div class="masonry-grid" data-pub-id="' + pubId + '">' + imagesHTML + '</div>';
                pubsHTML += '</article>';

                if (pub !== pubs[pubs.length - 1]) {
                    pubsHTML += '<div class="publication-separator"></div>';
                }
            });

            var sectionHTML = '<section id="section-' + year + '" class="content-section">' + pubsHTML + '</section>';
            container.insertAdjacentHTML('beforeend', sectionHTML);

            yearItemsHTML += '<li class="blog-collection"><a href="#" data-section="' + year + '">' + year + '</a></li>';
        });

        var workFolders = document.querySelectorAll('#main-work-list, #mobile-work-list');
        workFolders.forEach(function(list) {
            if (list) {
                list.innerHTML = yearItemsHTML;
            }
        });

        var newSectionLinks = document.querySelectorAll('[data-section]');
        newSectionLinks.forEach(function (link) {
            if (!link.hasAttribute('data-bound')) {
                link.setAttribute('data-bound', 'true');
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    var sectionId = this.getAttribute('data-section');

                    newSectionLinks.forEach(function (l) {
                        l.classList.remove('active');
                    });
                    document.querySelectorAll('[data-section="' + sectionId + '"]').forEach(function (l) {
                        l.classList.add('active');
                    });

                    var sections = document.querySelectorAll('.content-section');
                    sections.forEach(function (section) {
                        section.classList.remove('active');
                    });
                    var targetSection = document.getElementById('section-' + sectionId);
                    if (targetSection) {
                        targetSection.classList.add('active');
                    }

                    updateCurrentYear(sectionId);
                });
            }
        });

        // Auto-activate last year (most recent)
        if (years.length > 0) {
            var firstYear = years[0];
            var firstSection = document.getElementById('section-' + firstYear);
            if (firstSection) {
                firstSection.classList.add('active');
            }
            document.querySelectorAll('[data-section="' + firstYear + '"]').forEach(function (l) {
                l.classList.add('active');
            });
            updateCurrentYear(firstYear);
        }
    }

    function updateCurrentYear(year) {
        var desktopSpan = document.getElementById('current-year');
        var mobileSpan = document.getElementById('current-year-mobile');
        if (desktopSpan) desktopSpan.textContent = year;
        if (mobileSpan) mobileSpan.textContent = year;
    }

    // ===== Likes System =====
    function initLikes() {
        if (typeof db === 'undefined' || !db) return;
        var likeBtns = document.querySelectorAll('.like-btn');
        likeBtns.forEach(function(btn) {
            var pubId = btn.getAttribute('data-pub-id');
            var countEl = btn.querySelector('.like-count');
            var visitorId = getVisitorId();
            var likeRef = db.ref('likes/' + pubId);

            likeRef.child('count').on('value', function(snap) {
                countEl.textContent = snap.val() || 0;
            });

            likeRef.child('users/' + visitorId).once('value', function(snap) {
                if (snap.exists()) {
                    btn.classList.add('liked');
                }
            });

            btn.addEventListener('click', function() {
                toggleLike(pubId, visitorId, btn);
            });
        });
    }

    function toggleLike(pubId, visitorId, btn) {
        if (typeof db === 'undefined' || !db) return;
        var likeRef = db.ref('likes/' + pubId);
        var userRef = likeRef.child('users/' + visitorId);
        var countRef = likeRef.child('count');

        userRef.once('value', function(snap) {
            if (snap.exists()) {
                userRef.remove();
                countRef.transaction(function(current) {
                    return (current || 1) - 1;
                });
                btn.classList.remove('liked');
            } else {
                userRef.set(true);
                countRef.transaction(function(current) {
                    return (current || 0) + 1;
                });
                btn.classList.add('liked');
            }
        });
    }

    // ===== Share System =====
    document.addEventListener('click', function(e) {
        var shareBtn = e.target.closest('.share-btn');
        if (!shareBtn) return;

        var pubId = shareBtn.getAttribute('data-pub-id');
        var year = pubId.split('/')[0];
        var url = window.location.origin + window.location.pathname + '?y=' + year;

        navigator.clipboard.writeText(url).then(function() {
            var feedback = shareBtn.querySelector('.share-feedback');
            feedback.classList.add('show');
            setTimeout(function() {
                feedback.classList.remove('show');
            }, 2000);
        });
    });

    // ===== Navigator Fade-in =====
    var navigator = document.getElementById('navigator');
    if (navigator) {
        setTimeout(function () {
            navigator.classList.add('loaded');
        }, 100);
    }

    // ===== Mobile Navigation Toggle =====
    var navLabel = document.getElementById('mobile-navigation-label');
    var body = document.body;

    if (navLabel) {
        navLabel.addEventListener('click', function (e) {
            if (!e.target.getAttribute('href')) {
                body.classList.toggle('sqs-mobile-nav-open');
                var mobileNav = document.getElementById('mobile-navigation');
                if (mobileNav) {
                    mobileNav.classList.toggle('sqs-mobile-nav-open');
                }
            }
        });
    }

    // ===== Mobile Folder Toggle =====
    var folderToggles = document.querySelectorAll('.folder-toggle');
    folderToggles.forEach(function (toggle) {
        toggle.addEventListener('click', function (e) {
            e.preventDefault();
            var li = this.closest('.folder');
            if (li) {
                var child = li.querySelector('.folder-child');
                if (child) {
                    child.classList.toggle('open');
                }
            }
        });
    });

    // ===== Lazy Loading Images =====
    var lazyImages = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var img = entry.target;
                    img.src = img.getAttribute('data-src');
                    img.addEventListener('load', function () {
                        img.classList.add('loaded');
                    });
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '200px' });

        lazyImages.forEach(function (img) {
            observer.observe(img);
        });
    } else {
        lazyImages.forEach(function (img) {
            img.src = img.getAttribute('data-src');
            img.addEventListener('load', function () {
                img.classList.add('loaded');
            });
        });
    }

    // ===== Footer Autohide =====
    var footer = document.getElementById('bottomBar');

    if (footer) {
        function checkFooter() {
            var scrollPos = window.scrollY + window.innerHeight;
            var pageHeight = document.documentElement.scrollHeight;
            if (scrollPos >= pageHeight - 50) {
                footer.classList.add('viewable');
            } else {
                footer.classList.remove('viewable');
            }
        }

        window.addEventListener('scroll', checkFooter);
        window.addEventListener('resize', checkFooter);
        checkFooter();
    }

    // ===== Social Icon Hover Effects =====
    var socialList = document.querySelector('.social-accounts.social-links');
    if (socialList) {
        var socialIcons = socialList.querySelectorAll('.sqs-svg-icon--wrapper, a');
        socialList.addEventListener('mouseenter', function () {
            socialIcons.forEach(function (icon) {
                icon.style.opacity = '0.4';
            });
        });
        socialList.addEventListener('mouseleave', function () {
            socialIcons.forEach(function (icon) {
                icon.style.opacity = '1';
            });
        });
        socialIcons.forEach(function (icon) {
            icon.addEventListener('mouseenter', function () {
                this.style.opacity = '1';
            });
            icon.addEventListener('mouseleave', function () {
                if (socialList.matches(':hover')) {
                    this.style.opacity = '0.4';
                }
            });
        });
    }

    // ===== Expose initPublications globally for year-data.js =====
    window.initPublications = function() {
        var data = typeof publicationsData !== 'undefined' ? publicationsData : null;
        if (!data) return;

        var urlParams = new URLSearchParams(window.location.search);
        var isYearPage = urlParams.has('y');
        var currentYear = urlParams.get('y');

        applySavedOrders(data);

        if (isYearPage && currentYear && data[currentYear]) {
            buildYearPage(data, currentYear);
        } else {
            applySectionOrders(data);
            buildPublications(data);
        }

        initLikes();
    };

    // Auto-init if data is already available (painting.html path)
    if (typeof publicationsData !== 'undefined') {
        window.initPublications();
    }

});
