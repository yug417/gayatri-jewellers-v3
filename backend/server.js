const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── File Paths ───
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const WISHLISTS_FILE = path.join(__dirname, 'data', 'wishlists.json');
const RATES_FILE = path.join(__dirname, 'data', 'rates.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ─── Multer Storage Configuration ───
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPG, PNG, WebP, GIF) are allowed'));
        }
    }
});

// ─── Middleware ───
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, '..')));

// ─── Helper: Read products fresh from disk every time ───
function loadProducts() {
    try {
        const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error('Error reading products.json:', e.message);
        return { products: [], categories: [], popularSearches: [] };
    }
}

function saveProducts(data) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2));
}

// ─── Helper: Read/Save Users ───
function loadUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        }
    } catch (e) {}
    return [];
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ─── Helper: Read/Save Wishlists ───
function loadWishlists() {
    try {
        if (fs.existsSync(WISHLISTS_FILE)) {
            return JSON.parse(fs.readFileSync(WISHLISTS_FILE, 'utf8'));
        }
    } catch (e) {}
    return {};
}

function saveWishlists(data) {
    fs.writeFileSync(WISHLISTS_FILE, JSON.stringify(data, null, 2));
}

// ─── Helper: Gold Rates ───
function loadRates() {
    try {
        if (fs.existsSync(RATES_FILE)) {
            return JSON.parse(fs.readFileSync(RATES_FILE, 'utf8'));
        }
    } catch (e) {}
    return {
        "24KT": { price: 14471, date: new Date().toLocaleDateString('en-GB') },
        "22KT": { price: 13265, date: new Date().toLocaleDateString('en-GB') },
        "18KT": { price: 10853, date: new Date().toLocaleDateString('en-GB') },
        "14KT": { price: 8441, date: new Date().toLocaleDateString('en-GB') }
    };
}

function saveRates(rates) {
    fs.writeFileSync(RATES_FILE, JSON.stringify(rates, null, 2));
}

// ═══════════════════════════════════════════════════════════
//  PRODUCT API ROUTES
// ═══════════════════════════════════════════════════════════

// GET all products (with optional filters)
app.get('/api/products', (req, res) => {
    const data = loadProducts(); // Fresh read every time!
    let results = [...data.products];
    const { category, type, karat, featured } = req.query;

    if (category) results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
    if (type) results = results.filter(p => p.type.toLowerCase() === type.toLowerCase());
    if (karat) results = results.filter(p => p.karat.toLowerCase() === karat.toLowerCase());
    if (featured === 'true') results = results.filter(p => p.featured);

    res.json({ count: results.length, products: results });
});

// GET single product by ID
app.get('/api/products/:id', (req, res) => {
    const data = loadProducts();
    const product = data.products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
});

// GET categories
app.get('/api/categories', (req, res) => {
    const data = loadProducts();
    res.json(data.categories);
});

// GET search
app.get('/api/search', (req, res) => {
    const data = loadProducts();
    const query = (req.query.q || '').toLowerCase().trim();
    if (!query) {
        return res.json({ products: [], categories: data.categories, popularSearches: data.popularSearches });
    }

    const matchedProducts = data.products.filter(p => {
        const searchableText = [p.name, p.category, p.type, p.description, p.karat, ...(p.tags || [])].join(' ').toLowerCase();
        return searchableText.includes(query);
    });

    matchedProducts.sort((a, b) => {
        const aName = a.name.toLowerCase().includes(query) ? 1 : 0;
        const bName = b.name.toLowerCase().includes(query) ? 1 : 0;
        if (bName !== aName) return bName - aName;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

    const matchedCategories = data.categories.filter(c =>
        c.name.toLowerCase().includes(query) || c.id.toLowerCase().includes(query)
    );

    res.json({ query, products: matchedProducts, categories: matchedCategories, totalResults: matchedProducts.length });
});

// GET search suggestions
app.get('/api/search/suggestions', (req, res) => {
    const data = loadProducts();
    const query = (req.query.q || '').toLowerCase().trim();
    if (!query) return res.json({ suggestions: data.popularSearches });

    const allTerms = new Set();
    data.products.forEach(p => {
        if (p.name.toLowerCase().includes(query)) allTerms.add(p.name);
        if (p.type.toLowerCase().includes(query)) allTerms.add(p.type);
        (p.tags || []).forEach(tag => {
            if (tag.toLowerCase().includes(query)) allTerms.add(tag.charAt(0).toUpperCase() + tag.slice(1));
        });
    });
    data.categories.forEach(c => {
        if (c.name.toLowerCase().includes(query)) allTerms.add(c.name);
    });

    res.json({ query, suggestions: Array.from(allTerms).slice(0, 8) });
});

// GET popular searches
app.get('/api/popular-searches', (req, res) => {
    const data = loadProducts();
    res.json(data.popularSearches);
});

// ═══════════════════════════════════════════════════════════
//  ADMIN: ADD PRODUCT (with image upload)
// ═══════════════════════════════════════════════════════════

app.post('/api/products', upload.single('imageFile'), (req, res) => {
    const { name, category, type, karat, weight, price, description, featured, secret, tags } = req.body;

    // Security check
    if (secret !== 'gayatri786') {
        return res.status(401).json({ error: 'Unauthorized. Incorrect owner secret key.' });
    }

    if (!name || !category) {
        return res.status(400).json({ error: 'Product name and category are required.' });
    }

    if (!req.file && !req.body.image) {
        return res.status(400).json({ error: 'Please upload an image or provide an image URL.' });
    }

    try {
        const data = loadProducts();

        // Generate a unique ID: find the highest existing number and add 1
        let maxNum = 0;
        data.products.forEach(p => {
            const match = p.id.match(/GJ-(\d+)/);
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxNum) maxNum = num;
            }
        });
        const newId = `GJ-${String(maxNum + 1).padStart(3, '0')}`;

        // Determine image path
        let imagePath;
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        } else {
            imagePath = req.body.image;
        }

        // Parse tags
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch {
                parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
            }
        }
        // Auto-add category and type as tags
        if (!parsedTags.includes(category)) parsedTags.push(category);
        if (type && !parsedTags.includes(type.toLowerCase())) parsedTags.push(type.toLowerCase());

        const newProduct = {
            id: newId,
            name: name.trim(),
            category: category.toLowerCase().trim(),
            type: type ? type.trim() : 'Jewellery',
            karat: karat || '22KT',
            weight: weight || '0g',
            price: price || '₹ Price on Request',
            description: description || '',
            image: imagePath,
            tags: parsedTags,
            featured: featured === 'true' || featured === true
        };

        data.products.push(newProduct);
        saveProducts(data);

        console.log(`✅ New product added: ${newProduct.name} (${newProduct.id}) → ${newProduct.category}`);

        res.status(201).json({
            message: `Product "${newProduct.name}" added successfully to ${newProduct.category} collection!`,
            product: newProduct
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to save product. Server error.' });
    }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN: DELETE PRODUCT
// ═══════════════════════════════════════════════════════════

app.delete('/api/products/:id', (req, res) => {
    const { secret } = req.body || {};
    const authHeader = req.headers['x-owner-secret'];
    const key = secret || authHeader;

    if (key !== 'gayatri786') {
        return res.status(401).json({ error: 'Unauthorized.' });
    }

    try {
        const data = loadProducts();
        const idx = data.products.findIndex(p => p.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Product not found.' });

        const removed = data.products.splice(idx, 1)[0];

        // Delete uploaded image file if it's a local upload
        if (removed.image && removed.image.startsWith('/uploads/')) {
            const imgPath = path.join(__dirname, '..', removed.image);
            if (fs.existsSync(imgPath)) {
                fs.unlinkSync(imgPath);
            }
        }

        saveProducts(data);
        console.log(`🗑️ Product deleted: ${removed.name} (${removed.id})`);
        res.json({ message: `Product "${removed.name}" deleted.`, product: removed });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product.' });
    }
});

// ═══════════════════════════════════════════════════════════
//  USER / AUTH ROUTES
// ═══════════════════════════════════════════════════════════

app.post('/api/auth/register', (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) return res.status(400).json({ error: 'Please enter a valid 10-digit phone number' });

    const users = loadUsers();
    let user = users.find(u => u.phone === cleanPhone);

    if (user) {
        user.name = name.trim();
        user.lastLogin = new Date().toISOString();
        saveUsers(users);
        return res.json({ message: 'Welcome back!', user: { id: user.id, name: user.name, phone: user.phone, joinedAt: user.joinedAt, lastLogin: user.lastLogin } });
    }

    user = {
        id: 'USR-' + Date.now(),
        name: name.trim(),
        phone: cleanPhone,
        joinedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);

    res.status(201).json({ message: 'Welcome to Gayatri Jewellers!', user: { id: user.id, name: user.name, phone: user.phone, joinedAt: user.joinedAt, lastLogin: user.lastLogin } });
});

app.get('/api/auth/user/:phone', (req, res) => {
    const cleanPhone = req.params.phone.replace(/\D/g, '').slice(-10);
    const users = loadUsers();
    const user = users.find(u => u.phone === cleanPhone);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, name: user.name, phone: user.phone, joinedAt: user.joinedAt, lastLogin: user.lastLogin } });
});

app.put('/api/auth/user/:phone', (req, res) => {
    const cleanPhone = req.params.phone.replace(/\D/g, '').slice(-10);
    const users = loadUsers();
    const idx = users.findIndex(u => u.phone === cleanPhone);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    if (req.body.name) users[idx].name = req.body.name.trim();
    saveUsers(users);
    res.json({ message: 'Profile updated', user: { id: users[idx].id, name: users[idx].name, phone: users[idx].phone, joinedAt: users[idx].joinedAt } });
});

// ═══════════════════════════════════════════════════════════
//  WISHLIST API ROUTES
// ═══════════════════════════════════════════════════════════

// GET wishlist by phone
app.get('/api/wishlist/:phone', (req, res) => {
    const cleanPhone = req.params.phone.replace(/\D/g, '').slice(-10);
    const wishlists = loadWishlists();
    res.json(wishlists[cleanPhone] || []);
});

// POST update wishlist by phone
app.post('/api/wishlist/:phone', (req, res) => {
    const cleanPhone = req.params.phone.replace(/\D/g, '').slice(-10);
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Items must be an array' });

    const wishlists = loadWishlists();
    wishlists[cleanPhone] = items;
    saveWishlists(wishlists);

    console.log(`❤️ Wishlist updated for ${cleanPhone} (${items.length} items)`);
    res.json({ message: 'Wishlist synced successfully', items });
});

// ═══════════════════════════════════════════════════════════
//  GOLD RATE ROUTES
// ═══════════════════════════════════════════════════════════

app.get('/api/gold-rates', (req, res) => {
    res.json(loadRates());
});

app.post('/api/gold-rates', (req, res) => {
    const { rates, secret } = req.body;
    if (secret !== 'gayatri786') {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!rates) return res.status(400).json({ error: 'Rates data required.' });

    // Update date on each
    const today = new Date().toLocaleDateString('en-GB');
    const updatedRates = {};
    Object.keys(rates).forEach(k => {
        updatedRates[k] = {
            price: parseFloat(rates[k]),
            date: today
        };
    });

    saveRates(updatedRates);
    console.log(`💰 Gold rates updated for ${today}`);
    res.json({ message: 'Gold rates updated successfully!', rates: updatedRates });
});

// ═══════════════════════════════════════════════════════════
//  CATCH-ALL: Serve frontend pages
// ═══════════════════════════════════════════════════════════
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ═══════════════════════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════════════════════
app.listen(PORT, () => {
    const data = loadProducts();
    console.log(`\n  ✨ Gayatri Jewellers Backend`);
    console.log(`  ───────────────────────────`);
    console.log(`  Server running at: http://localhost:${PORT}`);
    console.log(`  Total products in database: ${data.products.length}`);
    console.log(`  API endpoints:`);
    console.log(`    GET    /api/products          → All products`);
    console.log(`    GET    /api/products/:id       → Single product`);
    console.log(`    POST   /api/products           → Add product (with image upload)`);
    console.log(`    DELETE /api/products/:id        → Delete product`);
    console.log(`    GET    /api/search?q=...       → Search products`);
    console.log(`    POST   /api/auth/register      → Register user`);
    console.log(`    GET    /api/auth/user/:phone    → Get user`);
    console.log(`  Owner Dashboard: http://localhost:${PORT}/owner.html\n`);
});
