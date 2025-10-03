import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, Users, ShoppingCart, TrendingUp, Package, 
  Activity, Clock, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDate, getStatusColor } from '../utils/formatters';
import DashboardLayout from '../components/DashboardLayout';
import { toast } from 'sonner';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { request } = useApi();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await request('GET', '/admin/stats');
      setStats(data);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts (will be replaced with real data)
  const revenueData = [
    { month: 'Jan', revenue: 45000000 },
    { month: 'Feb', revenue: 52000000 },
    { month: 'Mar', revenue: 61000000 },
    { month: 'Apr', revenue: 58000000 },
    { month: 'May', revenue: 70000000 },
    { month: 'Jun', revenue: 85000000 },
  ];

  const userGrowthData = [
    { month: 'Jan', users: 120 },
    { month: 'Feb', users: 185 },
    { month: 'Mar', users: 245 },
    { month: 'Apr', users: 320 },
    { month: 'May', users: 410 },
    { month: 'Jun', users: 520 },
  ];

  const orderDistribution = [
    { name: 'Active', value: stats?.active_orders || 0, color: '#10b981' },
    { name: 'Pending', value: stats?.pending_orders || 0, color: '#f59e0b' },
    { name: 'Paid', value: stats?.paid_orders || 0, color: '#3b82f6' },
    { name: 'Cancelled', value: stats?.cancelled_orders || 0, color: '#ef4444' },
  ];

  const summaryCards = [
    {
      title: 'Total Revenue',
      value: stats ? formatCurrency(stats.total_revenue) : 'Loading...',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      change: '+12.5%'
    },
    {
      title: 'Total Users',
      value: stats?.users_count || 0,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      change: '+8.2%'
    },
    {
      title: 'Active Orders',
      value: stats?.active_orders || 0,
      icon: CheckCircle,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-100 dark:bg-violet-900/20',
      change: '+15.3%'
    },
    {
      title: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: ShoppingCart,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      change: '+10.1%'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Overview of your platform performance and analytics
          </p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${card.bgColor}`}>
                      <card.icon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                    </div>
                    <Badge className="bg-green-500">{card.change}</Badge>
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* User Growth */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>Total registered users over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="url(#colorUsers)" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Order Distribution and Recent Orders */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Order Distribution</CardTitle>
                <CardDescription>Orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={orderDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from your customers</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                        </div>
                        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : stats?.recent_orders?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recent_orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{order.user_email}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {order.package_name} • {order.domain || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="font-semibold">{formatCurrency(order.price_cents)}</p>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                    No recent orders
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}