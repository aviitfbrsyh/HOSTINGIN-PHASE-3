import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, Smartphone, QrCode, Upload, Building2, 
  ArrowRight, Lock, CheckCircle, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { useApi } from '../hooks/useApi';
import { formatCurrency } from '../utils/formatters';
import DashboardLayout from '../components/DashboardLayout';
import { toast } from 'sonner';

export default function Checkout() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const { request } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const data = await request('GET', '/cart');
      if (!data || data.items.length === 0) {
        toast.error('Your cart is empty');
        navigate('/dashboard/cart');
        return;
      }
      setCart(data);
    } catch (error) {
      toast.error('Failed to load cart');
      navigate('/dashboard/cart');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      category: 'Virtual Account',
      icon: Building2,
      options: [
        { id: 'VA-BCA', label: 'BCA Virtual Account', logo: '🏦' },
        { id: 'VA-BNI', label: 'BNI Virtual Account', logo: '🏦' },
        { id: 'VA-MANDIRI', label: 'Mandiri Virtual Account', logo: '🏦' },
        { id: 'VA-BRI', label: 'BRI Virtual Account', logo: '🏦' }
      ]
    },
    {
      category: 'E-Wallet',
      icon: Smartphone,
      options: [
        { id: 'EWALLET-GOPAY', label: 'GoPay', logo: '💳' },
        { id: 'EWALLET-OVO', label: 'OVO', logo: '💳' },
        { id: 'EWALLET-DANA', label: 'DANA', logo: '💳' },
        { id: 'EWALLET-SHOPEEPAY', label: 'ShopeePay', logo: '💳' }
      ]
    },
    {
      category: 'QRIS',
      icon: QrCode,
      options: [
        { id: 'QRIS', label: 'QRIS - All Banks', logo: '📱' }
      ]
    },
    {
      category: 'Credit Card',
      icon: CreditCard,
      options: [
        { id: 'CARD-VISA', label: 'Visa', logo: '💳' },
        { id: 'CARD-MASTERCARD', label: 'MasterCard', logo: '💳' }
      ]
    }
  ];

  const handleCheckout = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessing(true);

    try {
      const result = await request('POST', '/checkout', {
        method: selectedMethod
      });

      toast.success('Order created! Redirecting to payment...');
      
      // Navigate to payment page with order details
      navigate('/dashboard/payment', {
        state: {
          orderId: result.order_id,
          paymentId: result.payment_id,
          amount: result.amount_cents,
          method: result.method,
          reference: result.payment_reference,
          expiresIn: result.expires_in_seconds
        }
      });
    } catch (error) {
      toast.error(error.message || 'Failed to process checkout');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Checkout
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Complete your purchase securely
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Select Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {paymentMethods.map((category, catIndex) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIndex * 0.1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <category.icon className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{category.category}</h3>
                    </div>

                    <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                      <div className="grid gap-3">
                        {category.options.map((option) => (
                          <Label
                            key={option.id}
                            htmlFor={option.id}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedMethod === option.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                            }`}
                          >
                            <RadioGroupItem value={option.id} id={option.id} />
                            <span className="text-2xl">{option.logo}</span>
                            <span className="flex-1 font-medium">{option.label}</span>
                            {selectedMethod === option.id && (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            )}
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>

                    {catIndex < paymentMethods.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-6"
            >
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    </div>
                  ) : cart ? (
                    <>
                      {/* Items List */}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {cart.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                            <span className="flex-1 text-slate-700 dark:text-slate-300">
                              {item.name}
                            </span>
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {formatCurrency(item.price_cents)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Total */}
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">
                            Subtotal ({cart.items.length} items)
                          </span>
                          <span className="font-medium">{formatCurrency(cart.total_cents)}</span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between text-lg font-bold pt-2">
                          <span>Total</span>
                          <span className="text-2xl bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            {formatCurrency(cart.total_cents)}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handleCheckout}
                        disabled={!selectedMethod || processing}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-base font-semibold"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Complete Payment
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Lock className="w-3 h-3" />
                        <span>Secure 256-bit SSL encryption</span>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
