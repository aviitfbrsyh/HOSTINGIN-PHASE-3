import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Server, HardDrive, Wifi, Zap, Shield, Headphones,
  Check, ArrowRight, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useApi } from '../hooks/useApi';
import { formatCurrency } from '../utils/formatters';
import DashboardLayout from '../components/DashboardLayout';
import { toast } from 'sonner';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [domain, setDomain] = useState('');
  const [ordering, setOrdering] = useState(false);
  const { request } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const data = await request('GET', '/packages');
      setPackages(data);
    } catch (error) {
      toast.error('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (basePriceCents) => {
    const months = isAnnual ? 12 : 1;
    const totalPrice = basePriceCents * months;
    const discount = isAnnual ? totalPrice * 0.1 : 0; // 10% discount for annual
    return totalPrice - discount;
  };

  const openOrderDialog = (pkg) => {
    setSelectedPackage(pkg);
    setOrderDialogOpen(true);
  };

  const handleAddToCart = async () => {
    if (!domain.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    setOrdering(true);
    try {
      // Add hosting package to cart
      await request('POST', '/cart/add', {
        type: 'hosting',
        name: selectedPackage.title,
        slug: selectedPackage.slug,
        package_id: selectedPackage.id,
        price_cents: calculatePrice(selectedPackage.price_cents),
        description: `${isAnnual ? 'Annual' : 'Monthly'} hosting plan`,
        period: isAnnual ? 'yearly' : 'monthly'
      });
      
      // Add domain to cart (user will need to check availability first)
      // For now, we'll add it as a dummy item
      await request('POST', '/cart/add', {
        type: 'domain',
        name: domain.trim(),
        tld: domain.includes('.') ? domain.substring(domain.lastIndexOf('.')) : '.com',
        price_cents: 150000, // Default .com price
        description: 'Domain registration (1 year)'
      });
      
      toast.success('Added to cart! Review your order.');
      setOrderDialogOpen(false);
      setDomain('');
      
      // Navigate to cart page
      navigate('/dashboard/cart');
    } catch (error) {
      toast.error(error.message || 'Failed to add to cart');
    } finally {
      setOrdering(false);
    }
  };

  const getFeatureIcon = (feature) => {
    if (feature.toLowerCase().includes('storage')) return <HardDrive className="w-4 h-4" />;
    if (feature.toLowerCase().includes('bandwidth')) return <Wifi className="w-4 h-4" />;
    if (feature.toLowerCase().includes('ssl')) return <Shield className="w-4 h-4" />;
    if (feature.toLowerCase().includes('support')) return <Headphones className="w-4 h-4" />;
    if (feature.toLowerCase().includes('speed')) return <Zap className="w-4 h-4" />;
    return <Check className="w-4 h-4" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-2">Hosting Packages</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Choose the perfect plan for your needs
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur rounded-full border">
            <span className={`text-sm font-medium px-4 ${!isAnnual ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-violet-600"
            />
            <span className={`text-sm font-medium px-4 ${isAnnual ? 'text-violet-600' : 'text-slate-600 dark:text-slate-400'}`}>
              Annual
              <Badge className="ml-2 bg-green-500">Save 10%</Badge>
            </span>
          </div>
        </motion.div>

        {/* Packages Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, index) => {
              const price = calculatePrice(pkg.price_cents);
              const isPopular = index === 1; // Middle package is popular

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={isPopular ? 'lg:scale-105' : ''}
                >
                  <Card className={`border-0 shadow-lg hover:shadow-2xl transition-all relative overflow-hidden ${
                    isPopular 
                      ? 'bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 ring-2 ring-violet-500' 
                      : 'bg-white/50 dark:bg-slate-800/50 backdrop-blur'
                  }`}>
                    {isPopular && (
                      <div className="absolute top-0 right-0">
                        <Badge className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-tl-none rounded-br-none px-4 py-1">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pt-8">
                      <div className="mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mb-3">
                          <Server className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-2xl mb-2">{pkg.title}</CardTitle>
                        <CardDescription>{pkg.description}</CardDescription>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-end gap-2">
                          <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            {formatCurrency(price)}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 mb-1">
                            /{isAnnual ? 'year' : 'month'}
                          </span>
                        </div>
                        {isAnnual && (
                          <p className="text-sm text-green-600">
                            Save {formatCurrency(pkg.price_cents * 12 * 0.1)} per year!
                          </p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Key Specs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-900/50">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
                            <HardDrive className="w-4 h-4" />
                            <span className="text-xs">Storage</span>
                          </div>
                          <p className="font-semibold">{(pkg.storage_mb / 1024).toFixed(0)} GB</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-900/50">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
                            <Wifi className="w-4 h-4" />
                            <span className="text-xs">Bandwidth</span>
                          </div>
                          <p className="font-semibold">{pkg.bandwidth_gb} GB</p>
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400">Features included:</h4>
                        <ul className="space-y-2">
                          {pkg.features.map((feature, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 + idx * 0.05 }}
                              className="flex items-start gap-2 text-sm"
                            >
                              <div className="mt-0.5 p-1 rounded bg-green-100 dark:bg-green-900/20 text-green-600">
                                {getFeatureIcon(feature)}
                              </div>
                              <span>{feature}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        onClick={() => openOrderDialog(pkg)}
                        className={`w-full ${
                          isPopular
                            ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700'
                            : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900'
                        }`}
                        size="lg"
                      >
                        Order Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Order</DialogTitle>
          </DialogHeader>
          {selectedPackage && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20">
                <h3 className="font-semibold mb-1">{selectedPackage.title}</h3>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  {formatCurrency(calculatePrice(selectedPackage.price_cents))}
                  <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                    /{isAnnual ? 'year' : 'month'}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enter your domain name without http:// or www
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOrderDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                  onClick={handleAddToCart}
                  disabled={ordering}
                >
                  {ordering ? 'Adding...' : 'Add to Cart'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}