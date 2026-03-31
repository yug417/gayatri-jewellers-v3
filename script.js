// ══════════════════════════════════════════════════════════════════════════════════════
//  GAYATRI JEWELLERS - CONSOLIDATED CORE BOUTIQUE ENGINE (PHOENIX EDITION)
// ══════════════════════════════════════════════════════════════════════════════════════

// 1. GLOBAL STATE & CONFIGURATION
window.API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3000' : '';
window.GLOBAL_PRODUCTS = [
    { id: "GJ-001", name: "Royal Kundan Bridal Set", category: "wedding", type: "Necklace Set", karat: "22KT", weight: "124g", price: "₹4,85,000", image: "https://images.unsplash.com/photo-1599643478514-4a1101859187", tags: ["bridal", "kundan", "necklace", "wedding", "set", "gold"], featured: true, description: "An opulent masterpiece of Kundan craftsmanship, this bridal set is designed for the modern queen who cherishes her heritage." },
    { id: "GJ-002", name: "Eternity Diamond Ring", category: "women", type: "Ring", karat: "18KT", weight: "8g", price: "₹85,500", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908", tags: ["diamond", "ring", "women", "engagement", "solitaire"], featured: true, description: "A timeless 18KT gold band adorned with brilliant-cut diamonds." },
    { id: "GJ-003", name: "Signature Gold Kadha", category: "men", type: "Bracelet", karat: "22KT", weight: "42g", price: "₹2,65,000", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a", tags: ["men", "gold", "kadha", "bracelet", "traditional"], featured: true, description: "A bold and powerful 22KT gold kadha for men, symbolizing strength and status." },
    { id: "GJ-004", name: "Twin Souls Bands", category: "couple", type: "Rings", karat: "18KT", weight: "12g", price: "₹1,15,000", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e", tags: ["couple", "rings", "wedding", "matching", "gold"], featured: true, description: "Matching 18KT gold bands for those who have found their missing half." }
];

// 2. CORE SYNC ENGINES (API ↔ FRONTEND)
async function syncGlobalProducts() {
    try {
        const res = await fetch(`${window.API_BASE}/api/products?t=${Date.now()}`);
        if (!res.ok) throw new Error("API Offline");
        const data = await res.json();
        if (data && data.products && data.products.length > 0) {
            window.GLOBAL_PRODUCTS = data.products;
        }
    } catch (err) { 
        console.warn("Using Fallback Product State."); 
    } finally {
        // Always run initializations even if fetch fails
        if (window.initCollection) window.initCollection();
        if (window.renderProductDetails) window.renderProductDetails();
        const track = document.getElementById('scroll-track');
        if (track) renderHomeFeatured(window.GLOBAL_PRODUCTS.filter(p => p.featured));
        if (window.syncWishlistUI) window.syncWishlistUI();
    }
}

async function syncGoldRates() {
    try {
        const res = await fetch(`${window.API_BASE}/api/gold-rates`);
        if (!res.ok) throw new Error("API Offline");
        const data = await res.json();
        if (data && data.rates) {
            const r = data.rates;
            const updateUI = (ka, val) => {
                const e1 = document.getElementById(`rate-${ka}-1g`);
                const e10 = document.getElementById(`rate-${ka}-10g`);
                if (e1) e1.innerHTML = `₹${parseInt(val).toLocaleString('en-IN')} <span class="per-unit">/ 1g</span>`;
                if (e10) e10.textContent = `₹${((parseInt(val) || 0) * 10).toLocaleString('en-IN')} / 10g`;
            };
            if (r['24KT']) updateUI('24', r['24KT'].price || r['24KT']);
            if (r['22KT']) updateUI('22', r['22KT'].price || r['22KT']);
            if (r['18KT']) updateUI('18', r['18KT'].price || r['18KT']);
            if (r['14KT']) updateUI('14', r['14KT'].price || r['14KT']);
        }
    } catch (err) { console.warn("Rates sync deferred."); }
}

// 3. UI RENDERING LOGIC
function renderHomeFeatured(featuredProducts) {
    const track = document.getElementById('scroll-track');
    if (!track) return;
    track.innerHTML = featuredProducts.map((p, i) => `
        <div class="product-card ${i % 2 === 0 ? 'large-card' : ''}" data-product-id="${p.id}" onclick="window.location.href='product-detail.html?id=${p.id}'">
            <div class="card-image-wrap">
                <img src="${p.image}" alt="${p.name}" class="product-img">
                <button class="wishlist-add" onclick="event.stopPropagation(); window.toggleWishlist('${p.id}')"><i class="ph ph-heart"></i></button>
                <div class="purity-badge">${p.karat}</div>
            </div>
            <div class="card-info"><h3 class="product-name">${p.name}</h3><p class="product-weight">${p.weight}</p></div>
        </div>
    `).join('');
    if (window.syncWishlistUI) window.syncWishlistUI();
}

function generateProductCardHTML(p, i) {
    if (!p) return "";
    let img = p.image || "";
    if (img && !img.startsWith("http") && window.API_BASE) img = window.API_BASE + (img.startsWith("/") ? "" : "/") + img;
    return `
        <div class="premium-card" data-product-id="${p.id}" onclick="window.location.href='product-detail.html?id=${p.id}'" style="animation-delay: ${i*0.05}s">
            <div class="premium-card-inner">
                <div class="premium-img-wrap">
                    <img src="${img}" alt="${p.name}" class="p-img" loading="lazy">
                    <button class="wish-btn" onclick="event.stopPropagation(); window.toggleWishlist('${p.id}')"><i class="ph ph-heart"></i></button>
                    <div class="p-header-top"><span class="p-pill">${p.karat}</span></div>
                </div>
                <div class="premium-content">
                    <div class="p-type-sub">${p.type || "Jewellery"}</div>
                    <h3 class="p-title">${p.name}</h3>
                    <div class="p-footer"><span class="p-wt">${p.weight}</span><span class="p-price">${p.price || "Contact Us"}</span></div>
                </div>
            </div>
        </div>`;
}

window.initCollection = function(typeFilter) {
    const grid = document.getElementById('collection-grid');
    if (!grid) return;
    const cat = (document.body.getAttribute('data-category') || 'all').toLowerCase();
    let prods = (window.GLOBAL_PRODUCTS || []).filter(p => { 
        const pc = (p.category || "").toLowerCase(); 
        return pc === cat || pc === 'all' || cat === 'all'; 
    });
    if (typeFilter && typeFilter !== 'all') prods = prods.filter(p => (p.type || "").toLowerCase() === typeFilter.toLowerCase());
    
    const countDisp = document.getElementById('count-display') || document.getElementById('count-display-sub');
    if(countDisp) countDisp.textContent = prods.length;
    
    if(prods.length === 0) { 
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:100px 20px; opacity:0.3;"><h3>No pieces found in this selection.</h3></div>'; 
        return; 
    }
    grid.innerHTML = `<div class="type-grid">${prods.map((p, i) => generateProductCardHTML(p, i)).join('')}</div>`;
    if (window.syncWishlistUI) window.syncWishlistUI();
};

window.renderProductDetails = function() {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('id');
    if (!pid || !document.getElementById('detail-name')) return;

    const p = (window.GLOBAL_PRODUCTS || []).find(prod => prod.id === pid);
    if (!p) {
        document.getElementById('detail-name').textContent = "Piece Not Found";
        return;
    }

    // Populate elements
    const set = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
    set('detail-name', p.name);
    set('detail-id', `ID: ${p.id}`);
    set('detail-type', p.type);
    set('detail-price', p.price || "Contact Us");
    set('detail-karat', p.karat);
    set('detail-weight', p.weight);
    set('detail-desc', p.description || "A masterfully crafted piece of high-jewellery, showcasing traditional techniques and modern elegance.");
    set('breadcrumb-category', p.category.charAt(0).toUpperCase() + p.category.slice(1));
    set('breadcrumb-name', p.name);

    const img = document.getElementById('main-image');
    if (img) img.src = p.image || p.img;

    const wa = document.getElementById('whatsapp-inquiry');
    if (wa) wa.href = `https://wa.me/919876543210?text=I am interested in ${p.name} (ID: ${p.id}). Please provide more details.`;

    // Render related
    const relatedGrid = document.getElementById('related-grid');
    if (relatedGrid) {
        const related = (window.GLOBAL_PRODUCTS || []).filter(item => item.category === p.category && item.id !== p.id).slice(0, 4);
        relatedGrid.innerHTML = related.map((item, i) => generateProductCardHTML(item, i)).join('');
    }
};

// 4. TREASURY (WISHLIST) ENGINE
(function() {
    // ─── Helper: Re-query Essential Wishlist Elements ───
    function getWishlistElements() {
        return {
            wO: document.getElementById('wishlist-overlay'),
            wT: document.getElementById('wishlist-trigger') || document.getElementById('wishlist-trigger-sub'),
            wC: document.getElementById('wishlist-close') || document.querySelector('.wishlist-close'),
            wG: document.getElementById('wishlist-grid'),
            empty: document.getElementById('wishlist-empty'),
            itemsCont: document.getElementById('wishlist-items'),
            footer: document.getElementById('wishlist-footer'),
            totalItems: document.getElementById('wishlist-total-count') || document.getElementById('wishlist-total-items'),
            totalWeight: document.getElementById('wishlist-total-weight'),
            badge: document.getElementById('wishlist-badge') || document.getElementById('wishlist-badge-sub'),
            inquireBtn: document.getElementById('wishlist-inquire')
        };
    }

    // ─── Helper: Sync with Backend ───
    async function syncWithBackend(items) {
        const user = JSON.parse(localStorage.getItem('gj_user') || 'null');
        if (!user || !user.phone) return;
        
        try {
            await fetch(`${window.API_BASE}/api/wishlist/${user.phone}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: items })
            });
        } catch (e) {
            console.warn("Backend sync deferred (Offline).");
        }
    }

    window.toggleWishlist = async function(id) {
        if (!id) return;
        let wl = JSON.parse(localStorage.getItem('gj_wishlist') || '[]');
        const idx = wl.findIndex(i => i.id === id);
        
        if (idx > -1) {
            wl.splice(idx, 1);
            showToast('Piece removed from your curated gallery.');
        } else {
            let p = (window.GLOBAL_PRODUCTS || []).find(prod => prod.id === id);
            if (!p) {
                const card = document.querySelector(`[data-product-id="${id}"]`);
                if (card) p = { 
                    id, 
                    name: card.querySelector('.p-title, .product-name')?.textContent || "Masterpiece", 
                    image: card.querySelector('.p-img, .product-img')?.src || "", 
                    karat: card.querySelector('.p-pill, .purity-badge')?.textContent || "22KT", 
                    weight: card.querySelector('.p-wt, .product-weight')?.textContent || "0g"
                };
            }
            if (p) {
                wl.push({ id: p.id, name: p.name, img: p.image || p.img, karat: p.karat, weight: p.weight });
                showToast('Added to your curated gallery!');
                if(window.animateFlyHeart) window.animateFlyHeart(document.querySelector(`[data-product-id="${id}"]`));
            } else { 
                showToast('Unable to capture piece details.'); 
            }
        }
        
        localStorage.setItem('gj_wishlist', JSON.stringify(wl));
        window.syncWishlistUI();
        syncWithBackend(wl);
        
        const els = getWishlistElements();
        if (els.wO && els.wO.classList.contains('active')) window.renderWishlist();
        
        const detailBtn = document.getElementById('detail-wish-btn');
        if(detailBtn) {
            const isIn = wl.some(i => i.id === id);
            detailBtn.innerHTML = isIn ? '<i class="ph-fill ph-heart"></i> In Your Selection' : '<i class="ph ph-heart"></i> Add to Selection';
            detailBtn.classList.toggle('active', isIn);
        }
    };

    window.syncWishlistUI = function() {
        const wl = JSON.parse(localStorage.getItem('gj_wishlist') || '[]');
        const els = getWishlistElements();
        if (els.badge) els.badge.textContent = wl.length;
        
        const pBadge = document.getElementById('profile-wishlist-count');
        if (pBadge) pBadge.textContent = wl.length;
        
        document.querySelectorAll('.wish-btn, .wishlist-add, .detail-wishlist-toggle').forEach(btn => {
            let pid = btn.closest('[data-product-id]')?.dataset.productId;
            if(!pid) {
                const params = new URLSearchParams(window.location.search);
                pid = params.get('id');
            }
            if (pid) {
                const isIn = wl.some(i => i.id === pid);
                const icon = btn.querySelector('i');
                if(icon) icon.className = isIn ? 'ph-fill ph-heart' : 'ph ph-heart';
                btn.classList.toggle('active', isIn);
            }
        });
    };

    window.renderWishlist = function() {
        const els = getWishlistElements();
        if (!els.wG) return;
        
        const wl = JSON.parse(localStorage.getItem('gj_wishlist') || '[]');
        if (wl.length === 0) {
            if (els.empty) els.empty.style.display = 'block';
            if (els.itemsCont) els.itemsCont.style.display = 'none';
            if (els.footer) els.footer.style.display = 'none';
            return;
        }

        if (els.empty) els.empty.style.display = 'none';
        if (els.itemsCont) els.itemsCont.style.display = 'block';
        if (els.footer) els.footer.style.display = 'block';

        els.wG.innerHTML = wl.map((item, i) => `
            <div class="wishlist-item-card" style="animation: fadeInUp 0.5s ease both; animation-delay: ${i*0.08}s">
                <div class="wi-img-wrap" onclick="window.location.href='product-detail.html?id=${item.id}'">
                    <img src="${item.img || item.image}" alt="${item.name}" class="wi-img">
                </div>
                <div class="wi-info" onclick="window.location.href='product-detail.html?id=${item.id}'">
                    <h4 class="wi-name">${item.name}</h4>
                    <p class="wi-meta">${item.karat} • ${item.weight}</p>
                </div>
                <button class="wi-remove" onclick="event.stopPropagation(); window.toggleWishlist('${item.id}')" title="Remove Item">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        `).join('');

        let totalWeight = 0;
        wl.forEach(item => {
            const w = parseFloat(item.weight) || 0;
            totalWeight += w;
        });

        if (els.totalItems) els.totalItems.textContent = `${wl.length} Pieces`;
        if (els.totalWeight) els.totalWeight.textContent = `${totalWeight.toFixed(2)}g Est.`;

        if (els.inquireBtn) {
            const itemNames = wl.map(it => it.name).join(', ');
            els.inquireBtn.onclick = () => {
                const message = encodeURIComponent(`Hello Gayatri Jewellers, I'm interested in these pieces from my curated selection: ${itemNames}. Please let me know more. `);
                window.open(`https://wa.me/918181823950?text=${message}`, '_blank');
            };
        }
    };

    function showToast(m) {
        let t = document.getElementById('gj-toast');
        if(!t){ t=document.createElement('div'); t.id='gj-toast'; t.className='toast'; document.body.appendChild(t); }
        t.textContent = m; t.style.opacity = '1'; t.style.bottom = '40px';
        setTimeout(() => { t.style.opacity = '0'; t.style.bottom = '30px'; }, 3000);
    }
    
    // Initial Bindings
    const els = getWishlistElements();
    if (els.wT) els.wT.addEventListener('click', () => { window.renderWishlist(); if(els.wO) els.wO.classList.add('active'); });
    if (els.wC) els.wC.addEventListener('click', () => { if(els.wO) els.wO.classList.remove('active'); });
    
    document.querySelectorAll('.wishlist-overlay-backdrop').forEach(bd => {
        bd.addEventListener('click', () => {
            const wO = document.getElementById('wishlist-overlay');
            if(wO) wO.classList.remove('active');
        });
    });

    window.animateFlyHeart = function(from) {
        const fh = document.getElementById('fly-heart'); 
        const els = getWishlistElements();
        const to = els.wT;
        if(!fh || !to || !from) return;
        const fr = from.getBoundingClientRect(); const tr = to.getBoundingClientRect();
        fh.style.left = `${fr.left}px`; fh.style.top = `${fr.top}px`;
        fh.style.display = 'block'; fh.style.opacity = '1';
        setTimeout(() => { 
            fh.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)'; 
            fh.style.left = `${tr.left}px`; fh.style.top = `${tr.top}px`; 
            fh.style.transform = 'scale(0.2) rotate(20deg)'; 
            fh.style.opacity = '0'; 
            setTimeout(() => { fh.style.display = 'none'; fh.style.transition = ''; fh.style.transform = ''; }, 800); 
        }, 50);
    };

    // Global Delegated Listener for Wishlist Buttons
    document.addEventListener('click', e => {
        const btn = e.target.closest('.wish-btn, .wishlist-add, .detail-wishlist-toggle');
        if (btn) {
            e.preventDefault(); e.stopPropagation();
            let pid = btn.dataset.productId || btn.closest('[data-product-id]')?.dataset.productId;
            if(!pid) { const params = new URLSearchParams(window.location.search); pid = params.get('id'); }
            if (pid) window.toggleWishlist(pid);
        }
    });

    // User Login Sync: If user logs in, pull their wishlist from DB
    window.syncUserWishlistFromBackend = async function(phone) {
        if(!phone) return;
        try {
            const res = await fetch(`${window.API_BASE}/api/wishlist/${phone}`);
            if(res.ok) {
                const items = await res.json();
                if(items && Array.isArray(items) && items.length > 0) {
                    // Merge or replace? Let's merge and deduplicate
                    let localWl = JSON.parse(localStorage.getItem('gj_wishlist') || '[]');
                    const combined = [...localWl];
                    items.forEach(newItem => {
                        if(!combined.some(i => i.id === newItem.id)) combined.push(newItem);
                    });
                    localStorage.setItem('gj_wishlist', JSON.stringify(combined));
                    window.syncWishlistUI();
                }
            }
        } catch(e) {}
    }
})();

// 5. SEARCH & PROFILE LOGIC
(function() {
    // Search Overlay Logic
    const sO = document.getElementById('search-overlay');
    const sT = document.getElementById('search-trigger') || document.getElementById('nav-search-btn');
    const sC = document.getElementById('search-close') || document.querySelector('.search-close');
    const sI = document.getElementById('search-input') || document.getElementById('collection-search');
    const sG = document.getElementById('results-grid');
    const sRes = document.getElementById('search-results');
    const sNone = document.getElementById('search-no-results');
    const sClear = document.getElementById('search-clear');
    const sSugg = document.getElementById('search-suggestions');
    const sList = document.getElementById('suggestion-list');
    const sDef = document.getElementById('search-default');

    function performSearch(q) {
        if (!q) { 
            if(sDef) sDef.style.display = 'block'; 
            if(sRes) sRes.style.display = 'none';
            if(sNone) sNone.style.display = 'none';
            if(sSugg) sSugg.style.display = 'none';
            if(sG) sG.innerHTML = ''; 
            return; 
        }
        
        q = q.toLowerCase();
        const results = (window.GLOBAL_PRODUCTS || []).filter(function(p) {
            const name = (p.name || '').toLowerCase();
            const type = (p.type || '').toLowerCase();
            const tags = (p.tags || []).join(' ').toLowerCase();
            return name.indexOf(q) !== -1 || type.indexOf(q) !== -1 || tags.indexOf(q) !== -1;
        });

        if (sDef) sDef.style.display = 'none';

        // Suggestions logic
        if (q.length > 1 && q.length < 4 && results.length > 0) {
            if(sSugg) sSugg.style.display = 'block';
            if(sList) sList.innerHTML = results.slice(0, 5).map(p => `
                <li class="suggestion-item" onclick="document.getElementById('search-input').value='${p.name}'; performSearch('${p.name}');" style="padding:15px 20px; cursor:pointer; list-style:none; border-bottom:1px solid rgba(0,0,0,0.03); color:var(--deep-navy); font-weight:500;">
                    <i class="ph ph-arrow-up-right" style="margin-right:10px; opacity:0.3;"></i>${p.name}
                </li>`).join('');
        } else {
            if(sSugg) sSugg.style.display = 'none';
        }

        if (results.length === 0) {
            if(sRes) sRes.style.display = 'none';
            if(sNone) sNone.style.display = 'block';
            if(sG) sG.innerHTML = '';
            return;
        }

        if(sRes) sRes.style.display = 'block';
        if(sNone) sNone.style.display = 'none';
        
        if(sG) sG.innerHTML = results.map(function(p) {
            return `
            <div class="result-card" onclick="location.href='product-detail.html?id=${p.id}'" style="display:flex; align-items:center; gap:20px; padding:20px; background:rgba(255,255,255,0.7); border:1px solid rgba(0,0,0,0.05); border-radius:18px; cursor:pointer; transition:all 0.4s cubic-bezier(0.19, 1, 0.22, 1); margin-bottom:12px;">
                <img src="${p.image}" style="width:85px; height:85px; object-fit:cover; border-radius:14px; box-shadow:0 5px 15px rgba(0,0,0,0.1);">
                <div style="flex:1;">
                    <div style="font-family:var(--font-heading); font-size:1.15rem; font-weight:700; color:var(--deep-navy); margin-bottom:4px;">${p.name}</div>
                    <div style="font-size:0.75rem; color:var(--warm-gold); letter-spacing:1px; font-weight:700; text-transform:uppercase;">${p.type} | ${p.karat}</div>
                    <div style="font-family:var(--font-body); opacity:0.6; font-size:0.85rem; margin-top:4px;">${p.weight}</div>
                </div>
                <i class="ph ph-caret-right" style="opacity:0.3; font-size:1.2rem;"></i>
            </div>`;
        }).join('');
    }

    if (sT) sT.addEventListener('click', () => { if(sO) sO.classList.add('active'); if(sI) setTimeout(() => sI.focus(), 400); });
    if (sC) sC.addEventListener('click', () => sO.classList.remove('active'));
    if (sI) sI.addEventListener('input', () => performSearch(sI.value));
    if (sClear) sClear.addEventListener('click', () => { if(sI) sI.value = ''; if(sI) performSearch(sI.value); });

    // Profile Drawer Logic
    const pO = document.getElementById('profile-drawer-overlay');
    const pT = document.getElementById('profile-trigger') || document.getElementById('profile-btn');
    const pC = document.getElementById('profile-close') || document.querySelector('.profile-close');
    const guestEl = document.getElementById('profile-guest');
    const loggedEl = document.getElementById('profile-logged');
    const lForm = document.getElementById('profile-login-form');
    const nInput = document.getElementById('login-name');
    const pInput = document.getElementById('login-phone');
    const lBtn = document.getElementById('login-submit-btn');
    const aInit = document.getElementById('avatar-initial');
    const dName = document.getElementById('profile-display-name');
    const dPhone = document.getElementById('profile-display-phone');
    const wCountEl = document.getElementById('profile-wishlist-count');
    const logoutBtn = document.getElementById('profile-logout');
    const wNav = document.getElementById('profile-open-wishlist');

    function getS() { try { return JSON.parse(localStorage.getItem('gj_user')); } catch (e) { return null; } }
    function saveS(u) { localStorage.setItem('gj_user', JSON.stringify(u)); }
    function clearS() { localStorage.removeItem('gj_user'); }

    function showG() { if(guestEl) guestEl.style.display = 'block'; if(loggedEl) loggedEl.style.display = 'none'; }
    function showL(u) {
        if(guestEl) guestEl.style.display = 'none';
        if(loggedEl) loggedEl.style.display = 'block';
        if(aInit) aInit.textContent = (u.name || "?").charAt(0).toUpperCase();
        if(dName) dName.textContent = u.name;
        if(dPhone) dPhone.textContent = `+91 ${u.phone.slice(0, 5)} ${u.phone.slice(5)}`;
        const wl = JSON.parse(localStorage.getItem('gj_wishlist') || '[]');
        if(wCountEl) wCountEl.textContent = wl.length;
    }

    if (pT) pT.addEventListener('click', () => {
        const u = getS(); if (u) showL(u); else showG();
        if(pO) pO.classList.add('active');
        if (!u && nInput) setTimeout(() => nInput.focus(), 450);
    });
    if (pC) pC.addEventListener('click', () => pO.classList.remove('active'));
    
    if (lForm) {
        lForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = nInput.value.trim();
            const phone = pInput.value.replace(/\D/g, '');
            if (!name || phone.length !== 10) return;
            if(lBtn) lBtn.disabled = true;
            try {
                let u = null; let saved = false;
                if (window.saveProfileToSupabase) {
                    const res = await window.saveProfileToSupabase(name, phone);
                    if (res && res.success) { u = res.user; saved = true; }
                }
                if (!saved) {
                    try {
                        const r = await fetch(`${window.API_BASE}/api/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name, phone}) });
                        const d = await r.json(); if (r.ok) u = d.user;
                    } catch (err) { u = { id: 'LOCAL-'+Date.now(), name, phone }; }
                }
                if(u){ 
                    saveS(u); 
                    showL(u); 
                    if(window.syncUserWishlistFromBackend) window.syncUserWishlistFromBackend(u.phone);
                }
            } finally { if(lBtn) lBtn.disabled = false; }
        });
    }

    if (logoutBtn) logoutBtn.addEventListener('click', () => { clearS(); showG(); });
    if (wNav) wNav.addEventListener('click', () => { if(pO) pO.classList.remove('active'); setTimeout(() => { window.renderWishlist(); if(document.getElementById('wishlist-overlay')) document.getElementById('wishlist-overlay').classList.add('active'); }, 450); });

    const exU = getS();
    if (exU) {
        showL(exU);
        if (window.getProfileFromSupabase && exU.phone) {
            window.getProfileFromSupabase(exU.phone).then(u => { 
                if(u){ 
                    saveS(u); 
                    showL(u); 
                    if(window.syncUserWishlistFromBackend) window.syncUserWishlistFromBackend(u.phone);
                } 
            });
        } else if (exU.phone && window.syncUserWishlistFromBackend) {
            window.syncUserWishlistFromBackend(exU.phone);
        }
    }
})();

// 6. DOM INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    syncGlobalProducts();
    syncGoldRates();

    // Navbar
    const nav = document.getElementById('navbar');
    if(nav) window.addEventListener('scroll', () => window.scrollY > 50 ? nav.classList.add('scrolled') : nav.classList.remove('scrolled'));

    // Showcase Slider
    const slides = document.querySelectorAll('.shop-slide'); const dots = document.querySelectorAll('.dot');
    let cur = 0; if(slides.length) setInterval(() => { slides[cur].classList.remove('active'); if(dots[cur]) dots[cur].classList.remove('active'); cur = (cur+1)%slides.length; slides[cur].classList.add('active'); if(dots[cur]) dots[cur].classList.add('active'); }, 4500);

    // Reveals
    if(typeof IntersectionObserver !== "undefined") {
        const obs = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting) e.target.classList.add('active'); }), { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    }

    // Progress Bar
    const sc = document.querySelector('.horizontal-scroll-container'); const pb = document.getElementById('scroll-progress');
    if(sc && pb) sc.addEventListener('scroll', () => pb.style.width = ((sc.scrollLeft / (sc.scrollWidth - sc.clientWidth)) * 100) + '%');

    // Filter Circles
    document.querySelectorAll('.filter-circle-item').forEach(c => c.addEventListener('click', () => { document.querySelectorAll('.filter-circle-item').forEach(ci => ci.classList.remove('active')); c.classList.add('active'); window.initCollection(c.dataset.filter); }));

    window.syncWishlistUI();
});
