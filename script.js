/* Phoenix Edition: Global Boutique Script */
console.log("Gayatri Jewellers Boutique Engine Initializing...");

document.addEventListener('DOMContentLoaded', () => {
    initOverlays();
    initNavbar();
    initScrollAnimations();
    initGoldRates();
    initWishlist();
    initProfile();
    initSearch();
});

/* ═══ OVERLAYS ═══ */
function initOverlays() {
    const overlays = {
        search: document.getElementById('search-overlay'),
        wishlist: document.getElementById('wishlist-overlay'),
        profile: document.getElementById('profile-drawer-overlay')
    };

    const triggers = {
        search: document.getElementById('search-trigger'),
        wishlist: document.getElementById('wishlist-trigger'),
        profile: document.getElementById('profile-trigger')
    };

    const closers = {
        search: document.getElementById('search-close'),
        wishlist: document.getElementById('wishlist-close'),
        profile: document.getElementById('profile-close')
    };

    Object.keys(triggers).forEach(key => {
        if(triggers[key]) {
            triggers[key].addEventListener('click', () => overlays[key].classList.add('active'));
        }
    });

    Object.keys(closers).forEach(key => {
        if(closers[key]) {
            closers[key].addEventListener('click', () => overlays[key].classList.remove('active'));
        }
    });

    // Backdrop clicks
    Object.values(overlays).forEach(ov => {
        if(ov) {
            ov.querySelector('[class*="backdrop"]').addEventListener('click', () => ov.classList.remove('active'));
        }
    });
}
