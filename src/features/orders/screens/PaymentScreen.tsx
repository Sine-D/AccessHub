import React, { useState } from 'react';
import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { TopHeader } from '../../../core/navigation/TopHeader';
import { BottomNav } from '../../../core/navigation/BottomNav';
import { 
  CreditCard, 
  QrCode, 
  Banknote, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';

export const PaymentScreen: React.FC = () => {
  const { cart, setActiveScreen } = useAppState();
  const { speakText } = useAccessibility();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'payhere' | 'cod' | 'qr'>('payhere');
  const [isSuccess, setIsSuccess] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = 350;
  const total = subtotal + deliveryFee;

  const handlePay = () => {
    setIsSuccess(true);
    speakText(`Payment of LKR ${total.toLocaleString()} completed successfully! Order sent to seller.`);
    setTimeout(() => {
      setIsSuccess(false);
      setActiveScreen('order_tracking');
    }, 2000);
  };

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="Checkout & Payment 💳" />

      <div className="p-4 space-y-4 pb-24">
        
        {/* Order Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs">
          <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Order Summary</h3>

          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <img src={item.product.image} alt={item.product.title} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.product.title}</h4>
                  <span className="text-[10px] text-slate-400">Qty: {item.quantity}</span>
                </div>
              </div>
              <span className="font-extrabold text-blue-600 dark:text-blue-400">
                LKR {(item.product.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5 text-xs font-semibold">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>LKR {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Accessible Delivery Fee</span>
              <span>LKR {deliveryFee}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-1">
              <span>Total Payment</span>
              <span className="text-blue-600 dark:text-blue-400">LKR {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2">
          <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Select Payment Gateway</h3>

          <div className="space-y-2">
            {[
              { id: 'payhere', label: 'PayHere Sri Lanka (Cards, EzCash, M-Cash)', icon: CreditCard, badge: 'Popular' },
              { id: 'card', label: 'Credit / Debit Card (Visa, Mastercard, Stripe)', icon: CreditCard },
              { id: 'qr', label: 'LANKAQR Mobile Payment', icon: QrCode },
              { id: 'cod', label: 'Cash on Delivery (Accessible Hand-Off)', icon: Banknote },
            ].map((pm) => {
              const Icon = pm.icon;
              const isSelected = paymentMethod === pm.id;
              return (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id as any)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-bold">{pm.label}</span>
                  </div>
                  {pm.badge && (
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500 text-white">
                      {pm.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Badge */}
        <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-teal-500 shrink-0" />
          <span>256-Bit SSL Escrow Protected. Money held safely until order is delivered.</span>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePay}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white font-extrabold text-xs shadow-xl hover:opacity-95 transition-all"
        >
          Pay LKR {total.toLocaleString()} Securely
        </button>

        {isSuccess && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center space-y-3 max-w-xs shadow-2xl">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">Payment Successful! 🎉</h4>
              <p className="text-xs text-slate-500">Receipt generated. Redirecting to Live Order Tracking...</p>
            </div>
          </div>
        )}

      </div>

      <BottomNav />

    </div>
  );
};
