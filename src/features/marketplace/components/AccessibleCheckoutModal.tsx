import React, { useEffect, useState, useRef } from 'react';
import { Product } from '../../../core/types';

interface AccessibleCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

type CheckoutState = 'review' | 'processing' | 'success';
type PaymentMethod = 'saved_card' | 'cod' | 'new_card';

export const AccessibleCheckoutModal: React.FC<AccessibleCheckoutModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('review');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('saved_card');
  const [address, setAddress] = useState('42 Access Way, Colombo 03');
  const [isListening, setIsListening] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const startVoiceTyping = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      console.error('Speech recognition error', e.error);
      setIsListening(false);
    };
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setAddress(transcript);
    };

    recognition.start();
  };

  // Computed values
  const price = product?.price || 0;
  const tax = price * 0.1;
  const discount = 22;
  const total = price + tax - discount;
  const formattedTotal = total.toLocaleString(undefined, { maximumFractionDigits: 0 });

  // Focus modal on open and reset state
  useEffect(() => {
    if (isOpen) {
      setCheckoutState('review');
      setPaymentMethod('saved_card');
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
      announceState('review');
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && checkoutState !== 'processing') {
        onClose();
      }
      // Only capture Enter if not typing in an input
      if (e.key === 'Enter' && isOpen && checkoutState === 'review') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'BUTTON') {
          handleConfirmOrder();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, checkoutState, onClose]);

  const announceState = (state: CheckoutState) => {
    let message = '';
    if (state === 'review') {
      message = 'Checkout opened. Review your order.';
    } else if (state === 'processing') {
      message = `Processing payment of LKR ${formattedTotal}.`;
    } else if (state === 'success') {
      message = 'Order placed successfully. Confirmation number AC-8821.';
    }
    
    if (message) {
      const utterance = new SpeechSynthesisUtterance(message);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleConfirmOrder = () => {
    setCheckoutState('processing');
    announceState('processing');

    setTimeout(() => {
      setCheckoutState('success');
      announceState('success');
    }, 1200);
  };

  if (!isOpen || !product) return null;

  let liveRegionText = '';
  if (checkoutState === 'review') liveRegionText = 'Reviewing order for ' + product.title;
  if (checkoutState === 'processing') liveRegionText = `Processing payment of LKR ${formattedTotal}...`;
  if (checkoutState === 'success') liveRegionText = 'Order successful! Confirmation number AC-8821.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        tabIndex={-1}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] focus:outline-none"
      >
        <div role="status" aria-live="polite" className="sr-only">
          {liveRegionText}
        </div>

        <div className="p-6">
          <h2 id="checkout-title" className="text-2xl font-black text-slate-900 dark:text-white mb-6">
            {checkoutState === 'review' && 'Complete Accessible Checkout'}
            {checkoutState === 'processing' && 'Processing Order'}
            {checkoutState === 'success' && 'Order Successful!'}
          </h2>

          {checkoutState === 'review' && (
            <div className="space-y-6">
              {/* Order Summary & Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border-2 border-slate-300 dark:border-slate-600">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Order Summary</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-slate-800 dark:text-slate-200 font-medium">
                    <span>{product.title}</span>
                    <span>LKR {price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Tax (10%)</span>
                    <span>LKR {tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span>- LKR {discount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="pt-3 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                  <span className="text-xl text-blue-700 dark:text-blue-400 font-black">
                    LKR {formattedTotal}
                  </span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Delivery Address</h3>
                  <button 
                    onClick={startVoiceTyping} 
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isListening ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 animate-pulse' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                    aria-label={isListening ? "Listening for address..." : "Start voice typing for delivery address"}
                    aria-pressed={isListening}
                  >
                    <span>🎤</span>
                    <span>{isListening ? 'Listening...' : 'Voice Type'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-4 min-h-[52px] rounded-2xl border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-4 focus:ring-blue-500"
                  aria-label="Delivery Address"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Payment Method</h3>
                
                {/* Saved Card Option */}
                <button
                  onClick={() => setPaymentMethod('saved_card')}
                  className={`w-full flex items-center min-h-[52px] p-4 rounded-2xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500 ${
                    paymentMethod === 'saved_card'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40'
                      : 'border-slate-300 dark:border-slate-600 bg-transparent'
                  }`}
                  aria-pressed={paymentMethod === 'saved_card'}
                >
                  <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                    paymentMethod === 'saved_card' ? 'border-blue-600' : 'border-slate-500'
                  }`}>
                    {paymentMethod === 'saved_card' && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="bg-blue-600 px-2 py-1 rounded text-white text-xs font-bold tracking-wider">VISA</span>
                    <span className="text-slate-900 dark:text-white font-bold text-lg">Saved Card (•••• 4242)</span>
                  </div>
                </button>

                {/* Cash on Delivery Option */}
                <button
                  onClick={() => setPaymentMethod('cod')}
                  className={`w-full flex items-center min-h-[52px] p-4 rounded-2xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500 ${
                    paymentMethod === 'cod'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40'
                      : 'border-slate-300 dark:border-slate-600 bg-transparent'
                  }`}
                  aria-pressed={paymentMethod === 'cod'}
                >
                  <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                    paymentMethod === 'cod' ? 'border-blue-600' : 'border-slate-500'
                  }`}>
                    {paymentMethod === 'cod' && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                  </div>
                  <span className="text-slate-900 dark:text-white font-bold text-lg">Cash on Delivery</span>
                </button>

                {/* Use a Different Card Option */}
                <div className={`rounded-2xl border-2 transition-all ${
                  paymentMethod === 'new_card' 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/40' 
                    : 'border-slate-300 dark:border-slate-600 bg-transparent'
                }`}>
                  <button
                    onClick={() => setPaymentMethod('new_card')}
                    className="w-full flex items-center min-h-[52px] p-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500"
                    aria-expanded={paymentMethod === 'new_card'}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                      paymentMethod === 'new_card' ? 'border-blue-600' : 'border-slate-500'
                    }`}>
                      {paymentMethod === 'new_card' && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold text-lg">+ Use a different card</span>
                  </button>
                  
                  {/* Collapsible Form */}
                  {paymentMethod === 'new_card' && (
                    <div className="px-4 pb-5 pt-2 space-y-4">
                      <div>
                        <label htmlFor="cc-name" className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Name on Card</label>
                        <input 
                          id="cc-name" 
                          type="text" 
                          className="w-full min-h-[52px] px-4 rounded-xl border-2 border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500" 
                          placeholder="e.g. Jane Doe" 
                        />
                      </div>
                      <div>
                        <label htmlFor="cc-number" className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Card Number</label>
                        <input 
                          id="cc-number" 
                          type="text" 
                          className="w-full min-h-[52px] px-4 rounded-xl border-2 border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-4 focus:ring-blue-500" 
                          placeholder="0000 0000 0000 0000" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="w-full sm:flex-1 min-h-[52px] rounded-2xl border-2 border-slate-400 dark:border-slate-500 text-slate-800 dark:text-slate-200 font-black text-lg focus:outline-none focus:ring-4 focus:ring-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOrder}
                  className="w-full sm:flex-1 min-h-[52px] rounded-2xl bg-blue-700 text-white font-black text-lg focus:outline-none focus:ring-4 focus:ring-blue-500 hover:bg-blue-800 transition-colors shadow-lg"
                >
                  CONFIRM & PAY
                </button>
              </div>
            </div>
          )}

          {checkoutState === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-20 h-20 border-8 border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-xl text-slate-900 dark:text-white font-bold">Securely processing your payment...</p>
            </div>
          )}

          {checkoutState === 'success' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 border-4 border-green-200 dark:border-green-800">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black text-slate-900 dark:text-white">Order placed successfully!</p>
                <p className="text-lg font-bold text-slate-600 dark:text-slate-400">Order #AC-8821</p>
              </div>
              <button
                onClick={onClose}
                className="w-full min-h-[52px] mt-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg focus:outline-none focus:ring-4 focus:ring-blue-500 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                Done / Back to Marketplace
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
