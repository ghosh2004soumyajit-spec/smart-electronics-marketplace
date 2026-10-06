import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice } from '../lib/format';
import { IconPlus, IconTrash, IconCheck, IconSearch, IconShield, IconClose } from '../components/ui/Icons';
import EmptyState from '../components/ui/EmptyState';
import { LineSkeleton } from '../components/ui/Skeletons';

export default function Admin() {
  useDocumentTitle('VoltHaus — Admin Management Panel');
  const { user } = useAuth();
  const { toast } = useShop();
  const reduce = useReducedMotion();

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'orders' | 'categories' | 'brands' | 'customers' | 'reviews' | 'offers'

  // Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Products Data
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Create Product Modal State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProd, setNewProd] = useState({
    title: '',
    category_id: '',
    brand_id: '',
    base_price: '',
    discount_price: '',
    stock_quantity: '10',
    image_url: '',
    description: '',
  });
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Orders Data
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Categories Data
  const [categoriesList, setCategoriesList] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', slug: '', description: '', image_url: '', display_order: '0' });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Brands Data
  const [brandsList, setBrandsList] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: '', slug: '', logo_url: '' });
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);

  // Customers Data
  const [customersList, setCustomersList] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingCustomerDetails, setLoadingCustomerDetails] = useState(false);

  // Reviews Data
  const [reviewsList, setReviewsList] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Offers Data
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [newOffer, setNewOffer] = useState({
    code: '',
    title: '',
    discount_percent: '',
    max_discount: '',
    min_order_amount: '0',
    description: '',
  });
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);

  // Load Dashboard Data
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.getAdminStats();
      setStats(res);
    } catch {
      console.error('Failed to load admin stats');
    } finally {
      setLoadingStats(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await api.listProducts({ page: 1, limit: 100 });
      setProducts(res.items || res || []);
    } catch {
      console.error('Failed to load admin products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await api.getAllOrdersAdmin();
      setOrders(res || []);
    } catch {
      console.error('Failed to load admin orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadOffers = async () => {
    try {
      setLoadingOffers(true);
      const res = await api.getOffersAdmin();
      setOffers(res || []);
    } catch {
      console.error('Failed to load admin offers');
    } finally {
      setLoadingOffers(false);
    }
  };

  const loadCategoriesAdmin = async () => {
    try {
      setLoadingCategories(true);
      const res = await api.getCategoriesAdmin();
      setCategoriesList(res || []);
    } catch {
      console.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadBrandsAdmin = async () => {
    try {
      setLoadingBrands(true);
      const res = await api.getBrandsAdmin();
      setBrandsList(res || []);
    } catch {
      console.error('Failed to load brands');
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadCustomersAdmin = async () => {
    try {
      setLoadingCustomers(true);
      const res = await api.getUsersAdmin();
      setCustomersList(res || []);
    } catch {
      console.error('Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadReviewsAdmin = async () => {
    try {
      setLoadingReviews(true);
      const res = await api.getReviewsAdmin();
      setReviewsList(res || []);
    } catch {
      console.error('Failed to load reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadProducts();
    loadOrders();
    loadOffers();

    // Fetch categories and brands for dropdowns
    api.listCategories().then(setCategories).catch(() => {});
    api.listBrands().then(setBrands).catch(() => {});
  }, []);

  // Lazy tab loaders
  useEffect(() => {
    if (activeTab === 'categories') loadCategoriesAdmin();
    if (activeTab === 'brands') loadBrandsAdmin();
    if (activeTab === 'customers') loadCustomersAdmin();
    if (activeTab === 'reviews') loadReviewsAdmin();
  }, [activeTab]);

  // Check Admin Authorization
  if (user?.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          code="403 / FORBIDDEN"
          icon={<IconShield size={28} />}
          title="Admin Access Required."
          message="Your current user account does not have administrator privileges to access the backend management console."
          action={{ label: 'Return to Homepage', to: '/' }}
        />
      </div>
    );
  }

  // Create Product Submit
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProd.title || !newProd.category_id || !newProd.brand_id || !newProd.base_price) {
      toast('Please fill in title, category, brand, and base price.', 'error');
      return;
    }
    try {
      setIsCreatingProduct(true);
      await api.createProduct({
        title: newProd.title,
        category_id: parseInt(newProd.category_id, 10),
        brand_id: parseInt(newProd.brand_id, 10),
        base_price: parseFloat(newProd.base_price),
        discount_price: newProd.discount_price ? parseFloat(newProd.discount_price) : null,
        stock_quantity: parseInt(newProd.stock_quantity || 0, 10),
        image_url: newProd.image_url || null,
        description: newProd.description,
      });
      toast('New product created successfully.', 'success');
      setShowAddProduct(false);
      setNewProd({
        title: '',
        category_id: '',
        brand_id: '',
        base_price: '',
        discount_price: '',
        stock_quantity: '10',
        image_url: '',
        description: '',
      });
      loadProducts();
      loadStats();
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to create product.', 'error');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id, title) => {
    if (!window.confirm(`Delete product "${title}" from catalog?`)) return;
    try {
      await api.deleteProduct(id);
      toast('Product deleted.', 'info');
      setProducts((cur) => cur.filter((p) => p.id !== id));
      loadStats();
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to delete product.', 'error');
    }
  };

  // Quick Update Stock
  const handleUpdateStock = async (id, newStock) => {
    try {
      await api.updateInventory(id, parseInt(newStock, 10));
      toast('Stock updated.', 'success');
      loadProducts();
      loadStats();
    } catch {
      toast('Failed to update stock.', 'error');
    }
  };

  // Update Order Status
  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      toast(`Order status updated to ${newStatus}`, 'success');
      loadOrders();
      loadStats();
    } catch {
      toast('Failed to update order status.', 'error');
    }
  };

  // Create Offer Submit
  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!newOffer.code || !newOffer.title || !newOffer.discount_percent) {
      toast('Offer code, title, and discount percentage are required.', 'error');
      return;
    }
    try {
      setIsCreatingOffer(true);
      await api.createOfferAdmin(newOffer);
      toast(`Offer coupon "${newOffer.code}" created!`, 'success');
      setShowAddOffer(false);
      setNewOffer({
        code: '',
        title: '',
        discount_percent: '',
        max_discount: '',
        min_order_amount: '0',
        description: '',
      });
      loadOffers();
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to create offer.', 'error');
    } finally {
      setIsCreatingOffer(false);
    }
  };

  // Toggle Offer Active
  const handleToggleOffer = async (id, currentActive) => {
    try {
      await api.updateOfferAdmin(id, { is_active: !currentActive });
      toast(`Coupon ${!currentActive ? 'activated' : 'deactivated'}.`, 'success');
      loadOffers();
    } catch {
      toast('Failed to update coupon status.', 'error');
    }
  };

  // Delete Offer
  const handleDeleteOffer = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await api.deleteOfferAdmin(id);
      toast(`Coupon "${code}" deleted.`, 'info');
      loadOffers();
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to delete offer.', 'error');
    }
  };

  // Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name) return toast('Category name is required.', 'error');
    try {
      setIsCreatingCategory(true);
      await api.createCategoryAdmin(newCat);
      toast(`Category "${newCat.name}" created!`, 'success');
      setShowAddCategory(false);
      setNewCat({ name: '', slug: '', description: '', image_url: '', display_order: '0' });
      loadCategoriesAdmin();
      api.listCategories().then(setCategories).catch(() => {});
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to create category.', 'error');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await api.deleteCategoryAdmin(id);
      toast(`Category "${name}" deleted.`, 'info');
      loadCategoriesAdmin();
      api.listCategories().then(setCategories).catch(() => {});
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to delete category.', 'error');
    }
  };

  // Create Brand
  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.name) return toast('Brand name is required.', 'error');
    try {
      setIsCreatingBrand(true);
      await api.createBrandAdmin(newBrand);
      toast(`Brand "${newBrand.name}" created!`, 'success');
      setShowAddBrand(false);
      setNewBrand({ name: '', slug: '', logo_url: '' });
      loadBrandsAdmin();
      api.listBrands().then(setBrands).catch(() => {});
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to create brand.', 'error');
    } finally {
      setIsCreatingBrand(false);
    }
  };

  // Delete Brand
  const handleDeleteBrand = async (id, name) => {
    if (!window.confirm(`Delete brand "${name}"?`)) return;
    try {
      await api.deleteBrandAdmin(id);
      toast(`Brand "${name}" deleted.`, 'info');
      loadBrandsAdmin();
      api.listBrands().then(setBrands).catch(() => {});
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to delete brand.', 'error');
    }
  };

  // View Customer History
  const handleViewCustomer = async (cust) => {
    try {
      setLoadingCustomerDetails(true);
      setSelectedCustomer({ ...cust, orders: [] });
      const details = await api.getUserDetailsAdmin(cust.id);
      setSelectedCustomer(details);
    } catch {
      toast('Failed to load customer order details.', 'error');
    } finally {
      setLoadingCustomerDetails(false);
    }
  };

  // Delete Review
  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this review from the store?')) return;
    try {
      await api.deleteReviewAdmin(id);
      toast('Review removed.', 'info');
      loadReviewsAdmin();
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to delete review.', 'error');
    }
  };

  const filteredProducts = products.filter((p) =>
    (p.title || p.name || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-8 lg:px-8">
      {/* Page Header */}
      <header className="border-b border-ink pb-6">
        <div className="flex items-center gap-3">
          <span className="bg-volt px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-paper">
            ADMINISTRATOR MODE
          </span>
          <span className="font-mono text-xs text-ink3">Full Store Control &amp; Fulfillment Suite</span>
        </div>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-bold uppercase leading-none tracking-tight">
          Admin Management Console.
        </h1>
        <p className="label mt-2">Inventory control, order fulfillment, catalog CRUD, categories, brands, customers, moderation, and promotions</p>
      </header>

      {/* Analytics Metric Cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="border border-line bg-card p-5">
          <p className="label text-ink3">Total Revenue</p>
          <div className="mt-2 font-display text-2xl font-bold tnum text-volt">
            {loadingStats ? <LineSkeleton className="h-7 w-24" /> : formatPrice(stats?.totalRevenue || 0)}
          </div>
        </div>

        <div className="border border-line bg-card p-5">
          <p className="label text-ink3">Total Orders</p>
          <div className="mt-2 font-display text-2xl font-bold tnum text-ink">
            {loadingStats ? <LineSkeleton className="h-7 w-12" /> : stats?.totalOrders || 0}
          </div>
        </div>

        <div className="border border-line bg-card p-5">
          <p className="label text-ink3">Customers</p>
          <div className="mt-2 font-display text-2xl font-bold tnum text-ink">
            {loadingStats ? <LineSkeleton className="h-7 w-12" /> : stats?.totalCustomers || 0}
          </div>
        </div>

        <div className="border border-line bg-card p-5">
          <p className="label text-ink3">Catalog Products</p>
          <div className="mt-2 font-display text-2xl font-bold tnum text-ink">
            {loadingStats ? <LineSkeleton className="h-7 w-12" /> : stats?.totalProducts || 0}
          </div>
        </div>

        <div className="border border-line bg-card p-5 col-span-2 sm:col-span-1">
          <p className="label text-ink3">Low Stock Alerts</p>
          <div className="mt-2 font-display text-2xl font-bold tnum text-red-500">
            {loadingStats ? <LineSkeleton className="h-7 w-12" /> : stats?.lowStockAlerts || 0}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mt-8 flex flex-wrap border-b border-ink font-mono text-xs uppercase tracking-wider">
        {[
          { key: 'products', label: `Products (${products.length})` },
          { key: 'orders', label: `Orders (${orders.length})` },
          { key: 'categories', label: `Categories (${categoriesList.length || categories.length})` },
          { key: 'brands', label: `Brands (${brandsList.length || brands.length})` },
          { key: 'customers', label: `Customers (${customersList.length})` },
          { key: 'reviews', label: `Reviews (${reviewsList.length})` },
          { key: 'offers', label: `Coupons (${offers.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 border-b-2 font-bold transition-colors ${
              activeTab === tab.key ? 'border-volt text-volt bg-volt/5' : 'border-transparent text-ink3 hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Product Catalog Management */}
      {activeTab === 'products' && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
              <input
                type="text"
                placeholder="Search products by title..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full border border-line bg-paper pl-9 pr-4 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAddProduct((s) => !s)}
              className="inline-flex h-10 items-center gap-1.5 border border-ink bg-ink px-4 font-mono text-xs uppercase tracking-wider text-paper hover:bg-volt hover:border-volt"
            >
              <IconPlus size={16} /> {showAddProduct ? 'Cancel' : 'Create New Product'}
            </button>
          </div>

          {/* Add Product Modal/Form */}
          {showAddProduct && (
            <motion.form
              initial={reduce ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateProduct}
              className="border border-volt bg-volt/5 p-6 space-y-4"
            >
              <h3 className="font-display text-base font-bold uppercase text-ink">Add New Product to Database</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="label mb-1 block">Product Title *</label>
                  <input
                    type="text"
                    value={newProd.title}
                    onChange={(e) => setNewProd((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Sony Bravia 55-inch 4K OLED TV"
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
                  />
                </div>

                <div>
                  <label className="label mb-1 block">Category *</label>
                  <select
                    value={newProd.category_id}
                    onChange={(e) => setNewProd((p) => ({ ...p, category_id: e.target.value }))}
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label mb-1 block">Brand *</label>
                  <select
                    value={newProd.brand_id}
                    onChange={(e) => setNewProd((p) => ({ ...p, brand_id: e.target.value }))}
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label mb-1 block">MRP Base Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProd.base_price}
                    onChange={(e) => setNewProd((p) => ({ ...p, base_price: e.target.value }))}
                    placeholder="e.g. 89999"
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt tnum"
                  />
                </div>

                <div>
                  <label className="label mb-1 block">Sale Discount Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProd.discount_price}
                    onChange={(e) => setNewProd((p) => ({ ...p, discount_price: e.target.value }))}
                    placeholder="e.g. 74999"
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt tnum"
                  />
                </div>

                <div>
                  <label className="label mb-1 block">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    value={newProd.stock_quantity}
                    onChange={(e) => setNewProd((p) => ({ ...p, stock_quantity: e.target.value }))}
                    placeholder="10"
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt tnum"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="label mb-1 block">Primary Image URL</label>
                  <input
                    type="url"
                    value={newProd.image_url}
                    onChange={(e) => setNewProd((p) => ({ ...p, image_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="label mb-1 block">Description</label>
                  <textarea
                    rows={3}
                    value={newProd.description}
                    onChange={(e) => setNewProd((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Product specification details..."
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingProduct}
                className="h-11 w-full bg-volt font-mono text-xs uppercase tracking-wider font-bold text-paper hover:opacity-90 disabled:opacity-50"
              >
                {isCreatingProduct ? 'Saving to Database...' : 'Save Product to Database'}
              </button>
            </motion.form>
          )}

          {/* Products Table */}
          <div className="border border-line bg-card overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-ink bg-paper2 uppercase tracking-wider text-ink3">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">MRP / Sale Price</th>
                  <th className="px-4 py-3">Stock Inventory</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loadingProducts ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink3">Loading products from database...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink3">No matching products found.</td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const title = p.title || p.name;
                    const mrp = p.base_price ?? p.price?.mrp ?? 0;
                    const sale = p.discount_price ?? p.price?.sale ?? mrp;
                    const stock = p.stock_quantity ?? p.stock ?? 0;
                    return (
                      <tr key={p.id} className="hover:bg-paper2/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-ink3">#{p.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-ink line-clamp-1">{title}</p>
                          <p className="text-[10.5px] text-ink3">{p.brand_name || p.brand?.name} · {p.category_name || p.category?.name}</p>
                        </td>
                        <td className="px-4 py-3 tnum">
                          <span className="font-bold text-ink">{formatPrice(sale)}</span>
                          {sale < mrp && <span className="ml-2 text-ink3 line-through">{formatPrice(mrp)}</span>}
                        </td>
                        <td className="px-4 py-3 tnum">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${stock <= 5 ? 'text-red-500' : 'text-ink'}`}>{stock} units</span>
                            <button
                              type="button"
                              onClick={() => {
                                const val = prompt(`Update stock for "${title}":`, stock);
                                if (val !== null && !isNaN(val)) handleUpdateStock(p.id, val);
                              }}
                              className="border border-line bg-paper px-2 py-0.5 text-[10px] uppercase text-ink hover:border-ink"
                            >
                              Edit Stock
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, title)}
                            aria-label={`Delete ${title}`}
                            className="inline-flex h-8 w-8 items-center justify-center text-ink3 hover:text-red-500 transition-colors"
                          >
                            <IconTrash size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Orders Fulfillment */}
      {activeTab === 'orders' && (
        <div className="mt-6 space-y-4">
          <div className="border border-line bg-card overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-ink bg-paper2 uppercase tracking-wider text-ink3">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loadingOrders ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink3">Loading orders...</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink3">No customer orders recorded yet.</td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const shipping = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address;
                    return (
                      <tr key={o.id} className="hover:bg-paper2/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-ink">#{o.order_number}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-ink">{o.customer_name || shipping?.fullName}</p>
                          <p className="text-[10.5px] text-ink3">{o.customer_email || shipping?.phone}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-volt tnum">{formatPrice(o.final_amount)}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-ink">{o.payment_status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={o.order_status}
                            onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}
                            className="border border-line bg-paper px-2 py-1 font-mono text-xs font-bold text-ink outline-none focus:border-volt"
                          >
                            {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Categories CRUD */}
      {activeTab === 'categories' && (
        <div className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <p className="label font-bold">Catalog Product Categories</p>
            <button
              type="button"
              onClick={() => setShowAddCategory((s) => !s)}
              className="inline-flex h-10 items-center gap-1.5 border border-ink bg-ink px-4 font-mono text-xs uppercase tracking-wider text-paper hover:bg-volt hover:border-volt"
            >
              <IconPlus size={16} /> {showAddCategory ? 'Cancel' : 'Create New Category'}
            </button>
          </div>

          {showAddCategory && (
            <motion.form
              initial={reduce ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateCategory}
              className="border border-volt bg-volt/5 p-6 space-y-4"
            >
              <h3 className="font-display text-base font-bold uppercase text-ink">New Category Registration</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="label mb-1 block">Category Name *</label>
                  <input
                    type="text"
                    value={newCat.name}
                    onChange={(e) => setNewCat((c) => ({ ...c, name: e.target.value }))}
                    placeholder="e.g. Smart Watches"
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">Slug (optional)</label>
                  <input
                    type="text"
                    value={newCat.slug}
                    onChange={(e) => setNewCat((c) => ({ ...c, slug: e.target.value }))}
                    placeholder="e.g. smart-watches"
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">Display Order</label>
                  <input
                    type="number"
                    value={newCat.display_order}
                    onChange={(e) => setNewCat((c) => ({ ...c, display_order: e.target.value }))}
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="label mb-1 block">Description</label>
                  <input
                    type="text"
                    value={newCat.description}
                    onChange={(e) => setNewCat((c) => ({ ...c, description: e.target.value }))}
                    placeholder="Category description..."
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isCreatingCategory}
                className="h-11 w-full bg-volt font-mono text-xs uppercase tracking-wider font-bold text-paper hover:opacity-90 disabled:opacity-50"
              >
                {isCreatingCategory ? 'Saving Category...' : 'Save Category'}
              </button>
            </motion.form>
          )}

          <div className="border border-line bg-card overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-ink bg-paper2 uppercase tracking-wider text-ink3">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name &amp; Slug</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loadingCategories ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-ink3">Loading categories...</td></tr>
                ) : categoriesList.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-ink3">No categories found.</td></tr>
                ) : (
                  categoriesList.map((cat) => (
                    <tr key={cat.id} className="hover:bg-paper2/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-ink3">#{cat.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-ink">{cat.name}</p>
                        <p className="text-[10.5px] text-volt">{cat.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-ink2">{cat.description || '—'}</td>
                      <td className="px-4 py-3 font-bold tnum">{cat.product_count ?? cat.productCount ?? 0} items</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="inline-flex h-8 w-8 items-center justify-center text-ink3 hover:text-red-500 transition-colors"
                        >
                          <IconTrash size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Brands CRUD */}
      {activeTab === 'brands' && (
        <div className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <p className="label font-bold">Partner Hardware Brands</p>
            <button
              type="button"
              onClick={() => setShowAddBrand((s) => !s)}
              className="inline-flex h-10 items-center gap-1.5 border border-ink bg-ink px-4 font-mono text-xs uppercase tracking-wider text-paper hover:bg-volt hover:border-volt"
            >
              <IconPlus size={16} /> {showAddBrand ? 'Cancel' : 'Create New Brand'}
            </button>
          </div>

          {showAddBrand && (
            <motion.form
              initial={reduce ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateBrand}
              className="border border-volt bg-volt/5 p-6 space-y-4"
            >
              <h3 className="font-display text-base font-bold uppercase text-ink">New Brand Registration</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label mb-1 block">Brand Name *</label>
                  <input
                    type="text"
                    value={newBrand.name}
                    onChange={(e) => setNewBrand((b) => ({ ...b, name: e.target.value }))}
                    placeholder="e.g. Apple"
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">Slug (optional)</label>
                  <input
                    type="text"
                    value={newBrand.slug}
                    onChange={(e) => setNewBrand((b) => ({ ...b, slug: e.target.value }))}
                    placeholder="e.g. apple"
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isCreatingBrand}
                className="h-11 w-full bg-volt font-mono text-xs uppercase tracking-wider font-bold text-paper hover:opacity-90 disabled:opacity-50"
              >
                {isCreatingBrand ? 'Saving Brand...' : 'Save Brand'}
              </button>
            </motion.form>
          )}

          <div className="border border-line bg-card overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-ink bg-paper2 uppercase tracking-wider text-ink3">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Brand Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loadingBrands ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-ink3">Loading brands...</td></tr>
                ) : brandsList.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-ink3">No brands found.</td></tr>
                ) : (
                  brandsList.map((brand) => (
                    <tr key={brand.id} className="hover:bg-paper2/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-ink3">#{brand.id}</td>
                      <td className="px-4 py-3 font-bold text-ink">{brand.name}</td>
                      <td className="px-4 py-3 text-volt">{brand.slug}</td>
                      <td className="px-4 py-3 font-bold tnum">{brand.product_count ?? brand.productCount ?? 0} items</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteBrand(brand.id, brand.name)}
                          className="inline-flex h-8 w-8 items-center justify-center text-ink3 hover:text-red-500 transition-colors"
                        >
                          <IconTrash size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Customers & History */}
      {activeTab === 'customers' && (
        <div className="mt-6 space-y-6">
          <p className="label font-bold">Registered Accounts &amp; Customer Order History</p>
          <div className="border border-line bg-card overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-ink bg-paper2 uppercase tracking-wider text-ink3">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Total Spent</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loadingCustomers ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-ink3">Loading customers...</td></tr>
                ) : customersList.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-ink3">No registered customers.</td></tr>
                ) : (
                  customersList.map((cust) => (
                    <tr key={cust.id} className="hover:bg-paper2/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-ink3">#{cust.id}</td>
                      <td className="px-4 py-3 font-bold text-ink">{cust.full_name}</td>
                      <td className="px-4 py-3">
                        <p className="text-ink">{cust.email}</p>
                        <p className="text-[10px] text-ink3">{cust.phone || 'No phone'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold ${cust.role === 'ADMIN' ? 'bg-volt/10 text-volt border border-volt' : 'bg-paper2 text-ink2'}`}>
                          {cust.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold tnum">{cust.order_count || 0}</td>
                      <td className="px-4 py-3 font-bold text-volt tnum">{formatPrice(cust.total_spent || 0)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewCustomer(cust)}
                          className="border border-line bg-paper px-2.5 py-1 text-[10px] uppercase font-bold text-ink hover:border-volt hover:text-volt transition-colors"
                        >
                          View Orders
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Customer Detail Modal */}
          {selectedCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
              <div className="w-full max-w-2xl border border-line bg-paper p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold uppercase text-ink">
                      Customer Profile: {selectedCustomer.user?.full_name || selectedCustomer.full_name}
                    </h3>
                    <p className="font-mono text-xs text-ink3">{selectedCustomer.user?.email || selectedCustomer.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-ink3 hover:text-ink"
                  >
                    <IconClose size={20} />
                  </button>
                </div>

                <div className="mt-4">
                  <h4 className="font-mono text-xs font-bold uppercase text-ink mb-3">Order History</h4>
                  {loadingCustomerDetails ? (
                    <p className="font-mono text-xs text-ink3 py-4 text-center">Loading orders...</p>
                  ) : (!selectedCustomer.orders || selectedCustomer.orders.length === 0) ? (
                    <p className="font-mono text-xs text-ink3 py-4 text-center">No orders placed by this customer.</p>
                  ) : (
                    <div className="space-y-3 font-mono text-xs">
                      {selectedCustomer.orders.map((ord) => (
                        <div key={ord.id} className="border border-line bg-card p-3 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-ink">#{ord.order_number}</span>
                            <span className="ml-3 text-[10px] text-ink3">
                              {new Date(ord.created_at).toLocaleDateString('en-IN')}
                            </span>
                            <span className="ml-3 font-bold text-volt">{ord.order_status}</span>
                          </div>
                          <span className="font-bold text-volt tnum">{formatPrice(ord.final_amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Review Moderation */}
      {activeTab === 'reviews' && (
        <div className="mt-6 space-y-6">
          <p className="label font-bold">Customer Product Reviews Moderation</p>
          <div className="border border-line bg-card overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-ink bg-paper2 uppercase tracking-wider text-ink3">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Reviewer</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Comment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loadingReviews ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-ink3">Loading reviews...</td></tr>
                ) : reviewsList.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-ink3">No reviews submitted yet.</td></tr>
                ) : (
                  reviewsList.map((rev) => (
                    <tr key={rev.id} className="hover:bg-paper2/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-ink3">#{rev.id}</td>
                      <td className="px-4 py-3 font-bold text-ink max-w-[200px] truncate">
                        {rev.product_title || 'Product'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-ink">{rev.reviewer_name}</p>
                        <p className="text-[10px] text-ink3">{rev.reviewer_email}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-volt tnum">{rev.rating}★</td>
                      <td className="px-4 py-3 text-ink2 max-w-[320px]">
                        {rev.title && <span className="font-bold text-ink block">{rev.title}</span>}
                        <span className="line-clamp-2">{rev.comment}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          className="inline-flex h-8 w-8 items-center justify-center text-ink3 hover:text-red-500 transition-colors"
                        >
                          <IconTrash size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Offers & Coupons Management */}
      {activeTab === 'offers' && (
        <div className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <p className="label font-bold">Active Discount Coupons &amp; Promotional Codes</p>
            <button
              type="button"
              onClick={() => setShowAddOffer((s) => !s)}
              className="inline-flex h-10 items-center gap-1.5 border border-ink bg-ink px-4 font-mono text-xs uppercase tracking-wider text-paper hover:bg-volt hover:border-volt"
            >
              <IconPlus size={16} /> {showAddOffer ? 'Cancel' : 'Create New Offer Coupon'}
            </button>
          </div>

          {/* Add Offer Form */}
          {showAddOffer && (
            <motion.form
              initial={reduce ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateOffer}
              className="border border-volt bg-volt/5 p-6 space-y-4"
            >
              <h3 className="font-display text-base font-bold uppercase text-ink">New Promotional Coupon Registration</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="label mb-1 block">Coupon Code *</label>
                  <input
                    type="text"
                    value={newOffer.code}
                    onChange={(e) => setNewOffer((p) => ({ ...p, code: e.target.value }))}
                    placeholder="e.g. SUMMER20"
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs uppercase text-ink outline-none focus:border-volt"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="label mb-1 block">Offer Title *</label>
                  <input
                    type="text"
                    value={newOffer.title}
                    onChange={(e) => setNewOffer((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Summer Special 20% Discount"
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
                  />
                </div>

                <div>
                  <label className="label mb-1 block">Discount Percentage (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newOffer.discount_percent}
                    onChange={(e) => setNewOffer((p) => ({ ...p, discount_percent: e.target.value }))}
                    placeholder="e.g. 20"
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt tnum"
                  />
                </div>

                <div>
                  <label className="label mb-1 block">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    value={newOffer.max_discount}
                    onChange={(e) => setNewOffer((p) => ({ ...p, max_discount: e.target.value }))}
                    placeholder="e.g. 3000"
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt tnum"
                  />
                </div>

                <div>
                  <label className="label mb-1 block">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={newOffer.min_order_amount}
                    onChange={(e) => setNewOffer((p) => ({ ...p, min_order_amount: e.target.value }))}
                    placeholder="e.g. 5000"
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt tnum"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="label mb-1 block">Description</label>
                  <input
                    type="text"
                    value={newOffer.description}
                    onChange={(e) => setNewOffer((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Coupon terms and eligibility..."
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs text-ink outline-none focus:border-volt"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingOffer}
                className="h-11 w-full bg-volt font-mono text-xs uppercase tracking-wider font-bold text-paper hover:opacity-90 disabled:opacity-50"
              >
                {isCreatingOffer ? 'Creating Offer...' : 'Save Offer Coupon'}
              </button>
            </motion.form>
          )}

          {/* Offers Table */}
          <div className="border border-line bg-card overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-ink bg-paper2 uppercase tracking-wider text-ink3">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Title &amp; Terms</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Min Order</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loadingOffers ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-ink3">Loading offer coupons...</td>
                  </tr>
                ) : offers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-ink3">No active offer coupons found.</td>
                  </tr>
                ) : (
                  offers.map((off) => {
                    const isActive = off.is_active !== false;
                    return (
                      <tr key={off.id} className="hover:bg-paper2/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-volt">{off.code}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-ink">{off.title}</p>
                          <p className="text-[10.5px] text-ink3">{off.description || 'General store promotion'}</p>
                        </td>
                        <td className="px-4 py-3 font-bold tnum">{off.discount_percent}% OFF</td>
                        <td className="px-4 py-3 tnum">{formatPrice(off.min_order_amount || 0)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleOffer(off.id, isActive)}
                            className={`px-2 py-0.5 text-[10px] font-bold border ${
                              isActive
                                ? 'bg-volt/10 text-volt border-volt hover:bg-volt/20'
                                : 'bg-red-500/10 text-red-500 border-red-500 hover:bg-red-500/20'
                            }`}
                          >
                            {isActive ? 'ACTIVE (CLICK TO DISABLE)' : 'DISABLED (CLICK TO ACTIVATE)'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteOffer(off.id, off.code)}
                            className="inline-flex h-8 w-8 items-center justify-center text-ink3 hover:text-red-500 transition-colors"
                          >
                            <IconTrash size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
