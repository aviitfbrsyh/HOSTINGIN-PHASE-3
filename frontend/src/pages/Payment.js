import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Clock, Copy, CheckCircle, XCircle, Loader2, 
  CreditCard, QrCode, Building2, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useApi } from '../hooks/useApi';
import { formatCurrency } from '../utils/formatters';
import DashboardLayout from '../components/DashboardLayout';
import { toast } from 'sonner';

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { request } = useApi();
  
  const paymentData = location.state;
  
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [orderStatus, setOrderStatus] = useState('pending');
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes in seconds
  const [elapsedTime, setElapsedTime] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!paymentData || !paymentData.paymentId) {
      toast.error('Invalid payment data');
      navigate('/dashboard/cart');
      return;
    }

    // Start payment simulation
    startPaymentSimulation();
  }, []);

  const startPaymentSimulation = async () => {
    try {
      await request('POST', `/payment/${paymentData.paymentId}/simulate`);
      // Start polling for status
      startStatusPolling();
    } catch (error) {
      toast.error('Failed to start payment process');
    }
  };

  const startStatusPolling = useCallback(() => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await request('GET', `/payment/${paymentData.paymentId}/status`);
        
        setPaymentStatus(status.payment_status);
        setOrderStatus(status.order_status);
        setElapsedTime(status.elapsed_seconds);
        setTimeRemaining(status.expires_in_seconds);

        // Stop polling if payment is complete or failed
        if (status.payment_status === 'success' || status.payment_status === 'failed') {
          clearInterval(pollInterval);
          
          if (status.payment_status === 'success') {
            toast.success('Payment successful! Redirecting...');
            setTimeout(() => {
              navigate('/dashboard/services');
            }, 2000);
          } else {
            toast.error('Payment failed or cancelled');
          }
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [paymentData?.paymentId, request, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getPaymentIcon = () => {
    const method = paymentData?.method || '';
    if (method.includes('VA')) return Building2;
    if (method.includes('QRIS')) return QrCode;
    return CreditCard;
  };

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case 'success':
        return { label: 'Paid', color: 'bg-green-500', icon: CheckCircle };
      case 'failed':
        return { label: 'Failed', color: 'bg-red-500', icon: XCircle };
      case 'pending':
      default:
        return { label: 'Pending', color: 'bg-yellow-500', icon: Clock };
    }
  };

  const statusBadge = getStatusBadge();
  const PaymentIcon = getPaymentIcon();

  if (!paymentData) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Complete Payment
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Order ID: {paymentData.orderId?.slice(-8)}
          </p>
        </motion.div>

        {/* Countdown Timer */}
        {paymentStatus === 'pending' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Alert className={`border-2 ${timeRemaining < 300 ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'}`}>
              <Clock className="h-5 w-5" />
              <AlertDescription className="ml-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {timeRemaining < 300 ? '⚠️ Payment expires soon!' : 'Please complete payment within:'}
                  </span>
                  <span className="text-2xl font-bold">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Payment Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PaymentIcon className="w-5 h-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Method</span>
                    <span className="font-medium">{paymentData.method}</span>
                  </div>

                  {paymentData.reference && (
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <label className="text-sm text-slate-600 dark:text-slate-400 block mb-2">
                        {paymentData.method.includes('VA') ? 'Virtual Account Number' : 'Payment Reference'}
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-lg font-mono font-bold">
                          {paymentData.reference}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(paymentData.reference)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total Payment</span>
                    <span className="text-2xl text-blue-600 dark:text-blue-400">
                      {formatCurrency(paymentData.amount)}
                    </span>
                  </div>
                </div>

                {paymentData.method.includes('QRIS') && (
                  <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="w-48 h-48 mx-auto bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg flex items-center justify-center mb-3">
                      <QrCode className="w-24 h-24 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Scan this QR code with any banking app
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {paymentStatus === 'pending' && (
              <Card className="border-0 shadow-lg bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Waiting for payment confirmation...
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        This is a simulation. Payment will be automatically confirmed in ~3 minutes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Status & Instructions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${statusBadge.color} flex items-center justify-center`}>
                    <statusBadge.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{statusBadge.label}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Order Status: {orderStatus}
                    </p>
                  </div>
                </div>

                {paymentStatus === 'success' && (
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="ml-2 text-green-800 dark:text-green-200">
                      Payment successful! Your service is now active.
                    </AlertDescription>
                  </Alert>
                )}

                {paymentStatus === 'failed' && (
                  <Alert className="border-red-500 bg-red-50 dark:bg-red-900/20">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="ml-2 text-red-800 dark:text-red-200">
                      Payment was cancelled or expired. Please try again.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Payment Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>Copy the payment reference number above</li>
                  <li>Open your banking app or e-wallet</li>
                  <li>Select the payment method you chose</li>
                  <li>Enter the reference number</li>
                  <li>Complete the payment</li>
                  <li>Wait for confirmation (automatic)</li>
                </ol>
              </CardContent>
            </Card>

            {paymentStatus === 'pending' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/dashboard/orders')}
              >
                Continue Shopping
              </Button>
            )}

            {paymentStatus === 'success' && (
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                onClick={() => navigate('/dashboard/services')}
              >
                View My Services
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
