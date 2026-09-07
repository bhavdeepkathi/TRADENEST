const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Mock product data
const mockProducts = [
  {
    id: "1",
    name: "Nova X1 5G Smartphone",
    category: "Mobiles",
    subcategory: "Smartphones",
    brand: "Nova",
    description: "A modern 5G smartphone with a high-resolution display and powerful processor.",
    price: 18999,
    originalPrice: 22999,
    discount: 17,
    rating: 4.4,
    reviews: 324,
    stock: 48,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop",
    category: "Mobiles",
    subcategory: "Smartphones",
    brand: "Nova",
    description: "A modern 5G smartphone with a high-resolution display and powerful processor.",
    slug: "nova-x1-5g-smartphone",
    stock: 48,
    rating: 4.4,
    reviews: 324,
    originalPrice: 22999,
    discount: 17,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop",
    category: "Mobiles",
    subcategory: "Smartphones",
    brand: "Nova",
    stock: 48
  },
  {
    id: "2",
    name: "PixelEdge Pro 5G",
    category: "Mobiles",
    subcategory: "Smartphones",
    brand: "PixelEdge",
    description: "Premium 5G smartphone with advanced camera system and AI-powered photography.",
    price: 45999,
    originalPrice: 49999,
    discount: 8,
    rating: 4.6,
    reviews: 156,
    stock: 23,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop",
    category: "Mobiles",
    subcategory: "Smartphones",
    brand: "PixelEdge",
    description: "Premium 5G smartphone with advanced camera system and AI-powered photography.",
    slug: "pixel-edge-pro-5g",
    stock: 23,
    rating: 4.6,
    reviews: 156,
    originalPrice: 49999,
    discount: 8,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop",
    category: "Mobiles",
    subcategory: "Smartphones",
    brand: "PixelEdge",
    stock: 23
  },
  {
    id: "3",
    name: "ProBook Air 14",
    category: "Computers",
    subcategory: "Laptops",
    brand: "ProBook",
    description: "Ultra-light 14-inch laptop with M3 chip, 16GB RAM, 512GB SSD, and 18-hour battery life.",
    price: 89999,
    originalPrice: 99999,
    discount: 10,
    rating: 4.5,
    reviews: 234,
    stock: 12,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop",
    category: "Computers",
    subcategory: "Laptops",
    brand: "ProBook",
    description: "Ultra-light 14-inch laptop with M3 chip, 16GB RAM, 512GB SSD, and 18-hour battery life.",
    slug: "probook-air-14",
    stock: 12,
    rating: 4.5,
    reviews: 234,
    originalPrice: 99999,
    discount: 10,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop",
    category: "Computers",
    subcategory: "Laptops",
    brand: "ProBook",
    stock: 12
  }
];

const mockCategories = [
  { id: "1", name: "Mobiles", slug: "mobiles", icon: "📱" },
  { id: "2", name: "Electronics", slug: "electronics", icon: "💻" },
  { id: "3", name: "Computers", slug: "computers", icon: "💻" },
  { id: "4", name: "Appliances", slug: "appliances", icon: "❄️" },
  { id: "5", name: "Fashion", slug: "fashion", icon: "👕" },
  { id: "6", name: "Beauty", slug: "beauty", icon: "💄" },
  { id: "7", name: "Home & Furniture", slug: "home-furniture", icon: "🏠" },
  { id: "8", name: "Kitchen", slug: "kitchen", icon: "🍳" },
  { id: "8", name: "Grocery", slug: "grocery", icon: "🛒" },
  { id: "9", name: "Sports", slug: "sports", icon: "⚽" },
  { id: "10", name: "Toys", slug: "toys", icon: "🧸" },
  { id: "11", name: "Baby", slug: "baby", icon: "👶" },
  { id: "11", name: "Books", slug: "books", icon: "📚" },
  { id: "12", name: "Automotive", slug: "automotive", icon: "🚗" },
  { id: "13", name: "Travel", slug: "travel", icon: "🧳" },
  { id: "14", name: "Pet Care", slug: "pet", icon: "🐾" },
  { id: "14", name: "Stationery", slug: "stationery", icon: "📝" },
  { id: "15", name: "Gaming", slug: "gaming", icon: "🎮" },
  { id: "16", name: "Jewellery", slug: "jewellery", icon: "💍" },
  { id: "17", name: "Health", slug: "health", icon: "🏥" },
  { id: "18", name: "Music", slug: "music", icon: "🎵" },
  { id: "18", name: "Digital", slug: "digital", icon: "💻" },
  { id: "19", name: "Gifting", slug: "gifting", icon: "🎁" },
];

const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const mockProducts = []; // Products defined above

const mockCategories = [
  { id: "1", name: "Mobiles", slug: "mobiles", icon: "📱" },
  { id: "2", name: "Electronics", slug: "electronics", icon: "💻" },
  { id: "3", name: "Computers", slug: "computers", icon: "💻" },
  { id: "4", name: "Appliances", slug: "appliances", icon: "❄️" },
  { id: "5", name: "Fashion", slug: "fashion", icon: "👕" },
  { id: "6", name: "Beauty", slug: "beauty", icon: "💄" },
  { id: "7", name: "Home & Furniture", slug: "home-furniture", icon: "🏠" },
  { id: "8", name: "Kitchen", slug: "kitchen", icon: "🍳" },
  { id: "8", name: "Grocery", slug: "grocery", icon: "🛒" },
  { id: "9", name: "Sports", slug: "sports", icon: "⚽" },
  { id: "10", name: "Toys", slug: "toys", icon: "🧸" },
  { id: "11", name: "Baby", slug: "baby", icon: "👶" },
  { id: "11", name: "Books", slug: "books", icon: "📚" },
  { id: "12", name: "Automotive", slug: "automotive", icon: "🚗" },
  { id: "13", name: "Travel", slug: "travel", icon: "🧳" },
  { id: "14", name: "Pet Care", slug: "pet", icon: "🐾" },
  { id: "14", name: "Stationery", slug: "stationery", icon: "📝" },
  { id: "15", name: "Gaming", slug: "gaming", icon: "🎮" },
  { id: "16", name: "Jewellery", slug: "jewellery", icon: "💍" },
  { id: "17", name: "Health", slug: "health", icon: "🏥" },
  { id: "18", name: "Music", slug: "music", icon: "🎵" },
  { id: "18", name: "Digital", slug: "digital", icon: "💻" },
  { id: "19", name: "Gifting", slug: "gifting", icon: "🎁" },
];

const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const mockProducts = []; // Products defined above

const mockCategories = [/* categories defined above */];

const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Products API
app.get("/api/products", (req, res) => {
  const { page = 1, limit = 20, category, subcategory, sort, order, q, minPrice, maxPrice, rating } = req.query;
  let filteredProducts = [...mockProducts];

  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (subcategory) {
    filteredProducts = filteredProducts.filter(p => p.subcategory.toLowerCase() === subcategory.toLowerCase());
  }
  if (q) {
    const query = q.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query)
    );
  }
  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
  }
  if (rating) {
    filteredProducts = filteredProducts.filter(p => p.rating >= parseFloat(rating));
  }

  const sortField = sort || "createdAt";
  const sortOrder = order === "asc" ? 1 : -1;
  filteredProducts.sort((a, b) => {
    if (a[sortField] < b[sortField]) return -sortOrder;
    if (a[sortField] > b[sortField]) return sortOrder;
    return 0;
  });

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;
  const paginatedProducts = filteredProducts.slice(start, end);

  res.json({
    data: paginatedProducts,
    meta: {
      page: pageNum,
      limit: limitNum,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / limitNum)
    }
  });
});

app.get("/api/categories", (req, res) => {
  res.json(mockCategories);
});

app.get("/api/products/:id", (req, res) => {
  const product = mockProducts.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
});

app.get("/api/categories", (req, res) => {
  res.json(mockCategories);
});

app.get("/api/categories/:id", (req, res) => {
  const category = mockCategories.find(c => c.id === req.params.id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }
  res.json(category);
);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log("Endpoints:");
  console.log("  GET /api/products");
  console.log("  GET /api/products/:id");
  console.log("  GET /api/categories");
  console.log("  GET /api/categories/:id");
});

module.exports = app;
