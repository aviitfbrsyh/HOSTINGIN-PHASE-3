import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Server, ShoppingCart, Clock, CreditCard, TrendingUp,
  Activity, HardDrive, Wifi, Plus, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDate, getStatusColor } from '../utils/formatters';
import DashboardLayout from '../components/DashboardLayout';
import { toast } from 'sonner';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { request } = useApi();
  const navigate = useNavigate();

  // Simulated usage data
  const [usage, setUsage] = useState({
    storage: { used: 4500, total: 10240 },
    bandwidth: { used: 45, total: 100 }
  });

  useEffect(() => {
    fetchData();
    
    // Simulate usage animation
    const interval = setInterval(() => {
      setUsage(prev => ({
        storage: { 
          ...prev.storage, 
          used: Math.min(prev.storage.used + Math.random() * 10, prev.storage.total) 
        },
        bandwidth: { 
          ...prev.bandwidth, 
          used: Math.min(prev.bandwidth.used + Math.random() * 0.5, prev.bandwidth.total) 
        }
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [ordersData, packagesData] = await Promise.all([
        request('GET', '/orders'),
        request('GET', '/packages')
      ]);
      setOrders(ordersData);
      setPackages(packagesData);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Services',
      value: orders.length,
      icon: Server,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Active Plans',
      value: orders.filter(o => o.status === 'paid' || o.status === 'active').length,
      icon: ShoppingCart,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-100 dark:bg-violet-900/20'
    },
    {
      title: 'Pending Payments',
      value: orders.filter(o => o.status === 'pending').length,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20'
    },
    {
      title: 'Total Spent',
      value: formatCurrency(orders.reduce((sum, o) => sum + o.price_cents, 0)),
      icon: CreditCard,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    }
  ];

  const storagePercent = (usage.storage.used / usage.storage.total) * 100;
  const bandwidthPercent = (usage.bandwidth.used / usage.bandwidth.total) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="user-dashboard">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Welcome back! Here's what's happening with your services.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Usage Panels */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Storage Usage
                </CardTitle>
                <CardDescription>
                  {(usage.storage.used / 1024).toFixed(2)} GB of {(usage.storage.total / 1024).toFixed(2)} GB used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={storagePercent} className="h-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  {storagePercent.toFixed(1)}% used
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Bandwidth Usage
                </CardTitle>
                <CardDescription>
                  {usage.bandwidth.used.toFixed(2)} GB of {usage.bandwidth.total} GB used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={bandwidthPercent} className="h-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  {bandwidthPercent.toFixed(1)}% used
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Your latest hosting orders</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/orders')}
                  data-testid="view-all-orders-btn"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex gap-4">
                      <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 mb-4">No orders yet</p>
                  <Button
                    onClick={() => navigate('/dashboard/packages')}
                    className="bg-gradient-to-r from-blue-600 to-violet-600"
                    data-testid="create-first-order-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Order
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <motion.div
                      key={order.id}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                      data-testid={`order-item-${order.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                          <Server className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold">{order.domain}</p>
                          <p className="text-sm text-slate-500">
                            {order.package_name} • {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <p className="font-bold">{formatCurrency(order.price_cents)}</p>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-2">Ready to scale?</h3>
              <p className="opacity-90 mb-6">
                Upgrade your hosting plan to get more resources and features.
              </p>
              <Button
                className="bg-white text-blue-600 hover:bg-slate-100"
                onClick={() => navigate('/dashboard/packages')}
                data-testid="upgrade-plan-btn"
              >
                View Plans <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
