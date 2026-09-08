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
  },
  {
    id: "4",
    name: "UltraTech Gaming 15",
    category: "Computers",
    subcategory: "Laptops",
    brand: "UltraTech",
    description: "Gaming laptop with RTX 4070, 240Hz display, 32GB RAM, 1TB SSD.",
    price: 129999,
    originalPrice: 139999,
    discount: 7,
    rating: 4.6,
    reviews: 187,
    stock: 8,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&h=800&fit=crop",
    category: "Computers",
    subcategory: "Laptops",
    brand: "UltraTech",
    description: "Gaming laptop with RTX 4070, 240Hz display, 32GB RAM, 1TB SSD.",
    slug: "ultratech-gaming-15",
    stock: 8,
    rating: 4.6,
    reviews: 187,
    originalPrice: 139999,
    discount: 7,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&h=800&fit=crop",
    category: "Computers",
    subcategory: "Laptops",
    brand: "UltraTech",
    stock: 8
  },
  {
    id: "5",
    name: "SoundBeat Air Pro",
    category: "Electronics",
    subcategory: "Audio",
    brand: "SoundBeat",
    description: "True wireless earbuds with ANC, 30hr battery, IPX4 water resistance, and premium sound quality.",
    price: 4999,
    originalPrice: 6999,
    discount: 28,
    rating: 4.4,
    reviews: 1234,
    stock: 67,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
    category: "Electronics",
    subcategory: "Audio",
    brand: "SoundBeat",
    description: "True wireless earbuds with ANC, 30hr battery, IPX4 water resistance, and premium sound quality.",
    slug: "soundbeat-air-pro",
    stock: 67,
    rating: 4.4,
    reviews: 1234,
    originalPrice: 6999,
    discount: 28,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
    category: "Electronics",
    subcategory: "Audio",
    brand: "SoundBeat",
    stock: 67
  }
];



































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


app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log("Endpoints:");
  console.log("  GET /api/products");
  console.log("  GET /api/products/:id");
  console.log("  GET /api/categories");
  console.log("  GET /api/categories/:id");
});

module.exports = app;



