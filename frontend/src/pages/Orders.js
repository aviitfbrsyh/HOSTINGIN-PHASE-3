import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Clock, CheckCircle, XCircle, Search, Filter, 
  ChevronDown, Download, RefreshCw, FileText, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDate, getStatusColor } from '../utils/formatters';
import DashboardLayout from '../components/DashboardLayout';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { request } = useApi();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      const data = await request('GET', '/orders');
      setOrders(data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.package_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const viewOrderDetail = async (orderId) => {
    try {
      const data = await request('GET', `/orders/${orderId}`);
      setSelectedOrder(data);
      setDetailOpen(true);
    } catch (error) {
      toast.error('Failed to fetch order details');
    }
  };

  const handleRenew = async (orderId) => {
    try {
      const result = await request('POST', `/orders/${orderId}/renew`);
      toast.success('Order renewed successfully!');
      fetchOrders();
      setDetailOpen(false);
    } catch (error) {
      toast.error('Failed to renew order');
    }
  };

  const downloadInvoice = (order) => {
    const doc = new jsPDF();
    
    // Header with gradient background simulation
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('INVOICE', 20, 25);
    
    doc.setFontSize(10);
    doc.text('HostingIn Premium', 150, 20);
    doc.text('Cloud Hosting Platform', 150, 26);
    
    // Invoice details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Invoice #: ${order.id.slice(-8).toUpperCase()}`, 20, 55);
    doc.text(`Date: ${formatDate(order.created_at)}`, 20, 62);
    
    // Order details
    doc.setFontSize(14);
    doc.text('Order Details', 20, 80);
    
    doc.setFontSize(10);
    doc.text(`Domain: ${order.domain}`, 20, 90);
    doc.text(`Package: ${order.package?.title || 'N/A'}`, 20, 97);
    doc.text(`Period: ${order.period_months} month(s)`, 20, 104);
    doc.text(`Status: ${order.status.toUpperCase()}`, 20, 111);
    
    // Features
    if (order.package?.features) {
      doc.text('Features:', 20, 125);
      order.package.features.forEach((feature, idx) => {
        doc.text(`• ${feature}`, 25, 132 + (idx * 7));
      });
    }
    
    // Payment breakdown
    const subtotal = order.price_cents;
    const discount = 0;
    const total = subtotal - discount;
    
    doc.setFontSize(12);
    const startY = 180;
    doc.text('Subtotal:', 120, startY);
    doc.text(formatCurrency(subtotal), 170, startY, { align: 'right' });
    
    doc.text('Discount:', 120, startY + 7);
    doc.text(formatCurrency(discount), 170, startY + 7, { align: 'right' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(120, startY + 12, 180, startY + 12);
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Total:', 120, startY + 20);
    doc.text(formatCurrency(total), 170, startY + 20, { align: 'right' });
    
    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for choosing HostingIn!', 105, 270, { align: 'center' });
    doc.text('For support: support@hostingin.com', 105, 276, { align: 'center' });
    
    doc.save(`invoice-${order.id.slice(-8)}.pdf`);
    toast.success('Invoice downloaded!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage and track all your hosting orders
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search by domain or package..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-900"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48 bg-white dark:bg-slate-900">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : currentOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Start by ordering your first hosting package'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {currentOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/50 dark:bg-slate-800/50 backdrop-blur group">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{order.domain}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {order.package_name} • {order.period_months} month(s)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(order.created_at)}
                          </div>
                          {order.expires_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Expires: {formatDate(order.expires_at)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            {formatCurrency(order.price_cents)}
                          </p>
                          <Badge className={`mt-1 ${getStatusColor(order.status)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                          </Badge>
                        </div>
                        <Button
                          onClick={() => viewOrderDetail(order.id)}
                          className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                        >
                          View Details
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? 'bg-gradient-to-r from-blue-600 to-violet-600' : ''}
              >
                {page}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Order Info */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{selectedOrder.domain}</h3>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Order ID: {selectedOrder.id}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Created: {formatDate(selectedOrder.created_at)}
                  </p>
                  {selectedOrder.expires_at && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Expires: {formatDate(selectedOrder.expires_at)}
                    </p>
                  )}
                </div>

                {/* Package Details */}
                {selectedOrder.package && (
                  <div>
                    <h4 className="font-semibold mb-2">Package: {selectedOrder.package.title}</h4>
                    <ul className="space-y-2">
                      {selectedOrder.package.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Invoice Breakdown */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Invoice Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Period:</span>
                      <span className="font-medium">{selectedOrder.period_months} month(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.price_cents)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span className="font-medium text-green-600">- {formatCurrency(0)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                        {formatCurrency(selectedOrder.price_cents)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Payment History</h4>
                    <div className="space-y-2">
                      {selectedOrder.payments.map((payment) => (
                        <div key={payment.id} className="p-3 border rounded-lg flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{payment.method}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {formatDate(payment.created_at)}
                            </p>
                          </div>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => downloadInvoice(selectedOrder)}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
                {(selectedOrder.status === 'active' || selectedOrder.status === 'paid') && (
                  <Button
                    onClick={() => handleRenew(selectedOrder.id)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renew Order
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}