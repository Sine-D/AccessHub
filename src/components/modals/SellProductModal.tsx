import React, { useState } from 'react';
import { useAppState } from '../../context/AppStateContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { 
  X, 
  ShoppingBag, 
  Wrench, 
  Briefcase, 
  HeartHandshake, 
  Upload, 
  CheckCircle2 
} from 'lucide-react';

export const SellProductModal: React.FC = () => {
  const { sellModalOpen, setSellModalOpen, setActiveScreen } = useAppState();
  const { speakText } = useAccessibility();

  const [itemType, setItemType] = useState<'product' | 'service' | 'job' | 'donation'>('product');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Crafts & Decor');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!sellModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    speakText(`Listing published successfully! Your ${itemType} is now live on AccessLink.`);

    setTimeout(() => {
      setIsSubmitted(false);
      setSellModalOpen(false);
      if (itemType === 'product') setActiveScreen('marketplace');
      if (itemType === 'service') setActiveScreen('services');
      if (itemType === 'job') setActiveScreen('jobs');
      if (itemType === 'donation') setActiveScreen('donations');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Create Inclusive Listing
            </h3>
            <p className="text-xs text-slate-500">Sell products, offer services, or request support</p>
          </div>
          <button
            onClick={() => setSellModalOpen(false)}
            className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-4 overflow-y-auto space-y-4">
          
          {isSubmitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Listing Published! 🎉
              </h4>
              <p className="text-xs text-slate-500">
                Your item is verified and now visible to customers across Sri Lanka.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Type Selection Tabs */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'product', label: 'Sell Product', icon: ShoppingBag },
                  { id: 'service', label: 'Offer Service', icon: Wrench },
                  { id: 'job', label: 'Post Job', icon: Briefcase },
                  { id: 'donation', label: 'Donation Drive', icon: HeartHandshake },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = itemType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setItemType(t.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-xs' 
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {itemType === 'product' ? 'Product Name' : itemType === 'service' ? 'Service Title' : itemType === 'job' ? 'Job Position' : 'Campaign Title'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={itemType === 'product' ? 'e.g. Ergonomic Bamboo Desk Organizer' : 'e.g. Sign Language Translation'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Price / Target Amount Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {itemType === 'product' ? 'Price (LKR)' : itemType === 'service' ? 'Hourly Rate (LKR)' : itemType === 'job' ? 'Salary (LKR)' : 'Target Amount (LKR)'}
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 4500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Image Upload Box */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-500 transition-all bg-slate-50 dark:bg-slate-800/40">
                <Upload className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Upload High-Res Photo / Certificate
                </span>
                <span className="text-[10px] text-slate-400">PNG, JPG up to 10MB</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-extrabold text-xs shadow-lg hover:opacity-95 transition-all"
              >
                Publish Listing Now
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
