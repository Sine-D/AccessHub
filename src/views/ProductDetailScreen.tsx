import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Star, 
  MapPin, 
  MessageSquare, 
  Phone, 
  Mic, 
  ShoppingBag, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';

export const ProductDetailScreen: React.FC = () => {
  const { selectedProduct, setActiveScreen, addToCart, wishlist, toggleWishlist } = useAppState();
  const { speakText } = useAccessibility();
  const [selectedImg, setSelectedImg] = useState(0);

  if (!selectedProduct) return null;

  const gallery = selectedProduct.gallery || [selectedProduct.image];

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      {/* Top Floating Bar */}
      <div className="relative w-full h-72 bg-slate-900">
        <img 
          src={gallery[selectedImg]} 
          alt={selectedProduct.title}
          className="w-full h-full object-cover"
        />

        {/* Back & Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <button
            onClick={() => setActiveScreen('marketplace')}
            className="p-2.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-white shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleWishlist(selectedProduct.id)}
              className="p-2.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-white shadow-lg"
            >
              <Heart className={`w-4 h-4 ${wishlist.includes(selectedProduct.id) ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button
              onClick={() => speakText(`Sharing product ${selectedProduct.title}`)}
              className="p-2.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-white shadow-lg"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thumbnails */}
        {gallery.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {gallery.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImg(idx)}
                className={`w-10 h-10 rounded-xl overflow-hidden border-2 ${
                  selectedImg === idx ? 'border-blue-500 scale-105' : 'border-white/50'
                }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Details Content */}
      <div className="p-4 space-y-4 pb-24">
        
        {/* Title & Price */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2.5 py-0.5 rounded-full">
            {selectedProduct.category}
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
            {selectedProduct.title}
          </h2>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              LKR {selectedProduct.price.toLocaleString()}
            </span>
            <div className="flex items-center space-x-1 text-xs font-bold text-amber-500">
              <Star className="w-4 h-4 fill-amber-500" />
              <span>{selectedProduct.sellerRating} ({selectedProduct.reviewsCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* Seller Card */}
        <div className="p-3.5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={selectedProduct.sellerAvatar} alt={selectedProduct.sellerName} className="w-12 h-12 rounded-full object-cover" />
            <div>
              <div className="flex items-center space-x-1">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{selectedProduct.sellerName}</h4>
                <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              </div>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 block">
                ♿ {selectedProduct.disabilityBadge}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{selectedProduct.distanceKm} km away</span>
              </span>
            </div>
          </div>

          {/* Quick Connect Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveScreen('chat')}
              className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
              title="Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => speakText(`Calling seller ${selectedProduct.sellerName}`)}
              className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400"
              title="Call"
            >
              <Phone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Accessibility Features Badges */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Accessibility Highlights</span>
          <div className="flex flex-wrap gap-1.5">
            {selectedProduct.accessibilityFeatures.map((feat, i) => (
              <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-teal-500" />
                <span>{feat}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {selectedProduct.description}
          </p>
        </div>

        {/* Specifications Table */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">Specifications</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            {Object.entries(selectedProduct.specifications).map(([key, val]) => (
              <div key={key} className="flex justify-between px-3 py-2">
                <span className="text-slate-500">{key}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 flex items-center space-x-2 z-40">
        <button
          onClick={() => {
            addToCart(selectedProduct);
            speakText(`Added ${selectedProduct.title} to cart`);
          }}
          className="flex-1 py-3.5 rounded-2xl border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold text-xs hover:bg-blue-50 dark:hover:bg-blue-950 transition-all flex items-center justify-center space-x-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>

        <button
          onClick={() => {
            addToCart(selectedProduct);
            setActiveScreen('payment');
          }}
          className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
        >
          Buy Now
        </button>
      </div>

    </div>
  );
};
