import React, { useState } from 'react';
import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { mockProducts } from '../../../mock/data';
import { TopHeader } from '../../../core/navigation/TopHeader';
import { BottomNav } from '../../../core/navigation/BottomNav';
import { 
  Search, 
  Mic, 
  Star, 
  Heart, 
  MapPin, 
  SlidersHorizontal 
} from 'lucide-react';

export const MarketplaceScreen: React.FC = () => {
  const { setSelectedProduct, setActiveScreen, wishlist, toggleWishlist } = useAppState();
  const { setAiModalOpen } = useAccessibility();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'nearby' | 'rating' | 'price'>('nearby');
  const [search, setSearch] = useState('');

  const categories = ['All', 'Crafts & Decor', 'Home Goods', 'Food & Organic', 'Apparel & Adaptive'];

  const filteredProducts = mockProducts.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="Inclusive Marketplace 🛍️" />

      <div className="p-4 space-y-4 pb-8">
        
        {/* Search & Voice */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search products by disabled sellers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={() => setAiModalOpen(true)}
            className="p-3 rounded-2xl bg-blue-600 text-white shadow-md hover:bg-blue-700"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeCategory === cat 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sorting Bar */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1">
          <span>{filteredProducts.length} Inclusive Products Found</span>
          <div className="flex items-center space-x-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer"
            >
              <option value="nearby">Nearby Sellers</option>
              <option value="rating">Highest Rated</option>
              <option value="price">Lowest Price</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => {
                setSelectedProduct(product);
                setActiveScreen('product_detail');
              }}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 p-2.5 space-y-2 cursor-pointer hover:shadow-xl transition-all group relative"
            >
              {/* Wishlist Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product.id);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 backdrop-blur-md z-10 hover:scale-110"
              >
                <Heart className={`w-3.5 h-3.5 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </button>

              {/* Image */}
              <div className="w-full h-36 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 relative">
                <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {product.disabilityBadge && (
                  <span className="absolute bottom-2 left-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500 text-white shadow-xs">
                    ♿ {product.disabilityBadge}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{product.title}</h4>
                
                <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{product.distanceKm} km away</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
                    LKR {product.price.toLocaleString()}
                  </span>
                  <div className="flex items-center space-x-0.5 text-[10px] font-bold text-amber-500">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span>{product.sellerRating}</span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>

      <BottomNav />

    </div>
  );
};
