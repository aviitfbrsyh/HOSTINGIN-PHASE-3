import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useApi } from '../hooks/useApi';
import { formatCurrency } from '../utils/formatters';
import DashboardLayout from '../components/DashboardLayout';
import { toast } from 'sonner';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const { request } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const data = await request('GET', '/cart');
      setCart(data);
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (index) => {
    try {
      await request('DELETE', `/cart/remove/${index}`);
      toast.success('Item removed from cart');
      fetchCart();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await request('DELETE', '/cart/clear');
      toast.success('Cart cleared');
      fetchCart();
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  const proceedToCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/dashboard/checkout');
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'domain':
        return '🌐';
      case 'hosting':
        return '🖥️';
      case 'addon':
        return '🔧';
      default:
        return '📦';
    }
  };

  const getItemTypeBadge = (type) => {
    const badges = {
      domain: { label: 'Domain', color: 'bg-blue-500' },
      hosting: { label: 'Hosting', color: 'bg-violet-500' },
      addon: { label: 'Add-on', color: 'bg-purple-500' }
    };
    return badges[type] || { label: 'Item', color: 'bg-slate-500' };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Shopping Cart
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Review your items before checkout
            </p>
          </div>
          
          {cart && cart.items.length > 0 && (
            <Button
              variant="outline"
              onClick={clearCart}
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : !cart || cart.items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-900">
                  <CardContent className="p-12 text-center">
                    <ShoppingCart className="w-24 h-24 mx-auto text-slate-300 dark:text-slate-700 mb-6" />
                    <h3 className="text-2xl font-semibold mb-2">Your cart is empty</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Start by browsing our packages or searching for a domain
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => navigate('/dashboard/packages')}
                        className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Browse Packages
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {cart.items.map((item, index) => {
                  const badge = getItemTypeBadge(item.type);
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-0 shadow-md hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-2xl">
                              {getItemIcon(item.type)}
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-lg">{item.name}</h4>
                                    <Badge className={`${badge.color} text-white text-xs`}>
                                      {badge.label}
                                    </Badge>
                                  </div>
                                  {item.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                  {formatCurrency(item.price_cents)}
                                </span>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
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
                  {cart && cart.items.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Items ({cart.items.length})</span>
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
                        onClick={proceedToCheckout}
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-base font-semibold"
                      >
                        Proceed to Checkout
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>

                      <p className="text-xs text-center text-slate-600 dark:text-slate-400">
                        Secure checkout • Protected payment
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-slate-600 dark:text-slate-400">No items in cart</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
