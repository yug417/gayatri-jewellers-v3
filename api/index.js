const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PRODUCTS_FILE = path.join(process.cwd(), 'api', 'data', 'products.json');
const RATES_FILE = path.join(process.cwd(), 'api', 'data', 'rates.json');

app.use(cors());
app.use(express.json());

function loadProducts() {
    try { if (fs.existsSync(PRODUCTS_FILE)) return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8')); } catch (e) {}
    return { products: [] };
}

app.get('/api/products', (req, res) => { res.json(loadProducts()); });
app.get('/api/gold-rates', (req, res) => {
    try { if (fs.existsSync(RATES_FILE)) return res.json(JSON.parse(fs.readFileSync(RATES_FILE, 'utf8'))); } catch (e) {}
    res.json({ "24KT": 14471, "22KT": 13265 });
});

module.exports = app;
