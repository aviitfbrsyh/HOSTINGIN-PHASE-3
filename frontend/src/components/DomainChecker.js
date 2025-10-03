import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, X, ShoppingCart, Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useApi } from '../hooks/useApi';
import { formatCurrency } from '../utils/formatters';
import { toast } from 'sonner';

export default function DomainChecker({ onAddToCart }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { request } = useApi();

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const data = await request('GET', `/domain/check?q=${searchQuery.trim()}`);
      setResults(data.results || []);
    } catch (error) {
      toast.error('Failed to check domain availability');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (tld, domain, price) => {
    if (onAddToCart) {
      onAddToCart({
        type: 'domain',
        tld: tld,
        name: domain,
        price_cents: price,
        quantity: 1
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-900">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Enter domain name (e.g., mywebsite)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-8 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="animate-pulse flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                    </div>
                    <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {!loading && searched && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Domain Availability Results
            </h3>
            
            {results.map((result, index) => (
              <motion.div
                key={result.tld}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`border-0 shadow-md hover:shadow-lg transition-all ${
                  result.available 
                    ? 'bg-white dark:bg-slate-800' 
                    : 'bg-slate-50 dark:bg-slate-900/50 opacity-75'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          result.available 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {result.available ? (
                            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                              {result.domain}
                            </span>
                            <Badge variant={result.available ? 'success' : 'secondary'}>
                              {result.available ? 'Available' : 'Taken'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {formatCurrency(result.price_cents)}/year
                          </p>
                        </div>
                      </div>

                      {result.available ? (
                        <Button
                          onClick={() => handleAddToCart(result.tld, result.domain, result.price_cents)}
                          className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      ) : (
                        <Button disabled variant="secondary">
                          Not Available
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && searched && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">No results found</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
