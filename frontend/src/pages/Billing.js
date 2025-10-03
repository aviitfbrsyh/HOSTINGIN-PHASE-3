import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, Calendar, CheckCircle, XCircle, Clock, 
  Download, Receipt, TrendingUp, DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDate, getStatusColor } from '../utils/formatters';
import DashboardLayout from '../components/DashboardLayout';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function Billing() {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { request } = useApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const ordersData = await request('GET', '/orders');
      setOrders(ordersData);
      
      // Get all payments from orders
      const allPayments = [];
      for (const order of ordersData) {
        try {
          const orderDetail = await request('GET', `/orders/${order.id}`);
          if (orderDetail.payments) {
            allPayments.push(...orderDetail.payments.map(p => ({
              ...p,
              order_domain: order.domain,
              package_name: order.package_name
            })));
          }
        } catch (error) {
          console.error('Error fetching payments for order:', order.id);
        }
      }
      setPayments(allPayments);
    } catch (error) {
      toast.error('Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = (payment) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('PAYMENT RECEIPT', 20, 25);
    
    doc.setFontSize(10);
    doc.text('HostingIn Premium', 150, 20);
    doc.text('Cloud Hosting Platform', 150, 26);
    
    // Receipt details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Receipt #: ${payment.id.slice(-8).toUpperCase()}`, 20, 55);
    doc.text(`Date: ${formatDate(payment.created_at)}`, 20, 62);
    doc.text(`Status: ${payment.status.toUpperCase()}`, 20, 69);
    
    // Payment details
    doc.setFontSize(14);
    doc.text('Payment Details', 20, 90);
    
    doc.setFontSize(10);
    doc.text(`Domain: ${payment.order_domain}`, 20, 100);
    doc.text(`Package: ${payment.package_name}`, 20, 107);
    doc.text(`Payment Method: ${payment.method}`, 20, 114);
    
    // Amount
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Amount Paid:', 20, 135);
    doc.text(formatCurrency(payment.amount_cents), 150, 135);
    
    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated receipt.', 105, 270, { align: 'center' });
    doc.text('For inquiries: billing@hostingin.com', 105, 276, { align: 'center' });
    
    doc.save(`receipt-${payment.id.slice(-8)}.pdf`);
    toast.success('Receipt downloaded!');
  };

  const totalSpent = orders.reduce((sum, order) => 
    order.status !== 'cancelled' ? sum + order.price_cents : sum, 0
  );
  const successfulPayments = payments.filter(p => p.status === 'success').length;
  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  const stats = [
    {
      title: 'Total Spent',
      value: formatCurrency(totalSpent),
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Total Payments',
      value: payments.length,
      icon: Receipt,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Successful',
      value: successfulPayments,
      icon: CheckCircle,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-100 dark:bg-violet-900/20'
    },
    {
      title: 'Pending',
      value: pendingPayments,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20'
    }
  ];

  const getPaymentIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Receipt className="w-5 h-5" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Billing & Payments</h1>
          <p className="text-slate-600 dark:text-slate-400">
            View your payment history and download receipts
          </p>
        </motion.div>

        {/* Stats */}
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
                      <p className="text-3xl font-bold">{stat.value}</p>
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

        {/* Payment History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                      </div>
                      <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-xl font-semibold mb-2">No payments yet</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Your payment history will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20">
                          {getPaymentIcon(payment.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{payment.order_domain}</h4>
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {payment.package_name} • {payment.method} • {formatDate(payment.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            {formatCurrency(payment.amount_cents)}
                          </p>
                        </div>
                      </div>
                      {payment.status === 'success' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadReceipt(payment)}
                          className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Receipt
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary */}
        {!loading && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Total Revenue Contribution
                    </p>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                      {formatCurrency(totalSpent)}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Across {orders.length} order(s)
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-violet-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}