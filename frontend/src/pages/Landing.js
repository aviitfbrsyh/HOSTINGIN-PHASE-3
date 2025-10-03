import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, Shield, Zap, HeadphonesIcon, Globe, Lock, 
  Rocket, CheckCircle, Star, ArrowRight, Menu, X,
  Cloud, Database, Activity, Award
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Landing() {
  const [domain, setDomain] = useState('');
  const [domainStatus, setDomainStatus] = useState(null);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/packages`);
      setPackages(response.data);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    }
  };

  const checkDomain = async () => {
    if (!domain) {
      toast.error('Please enter a domain name');
      return;
    }

    setCheckingDomain(true);
    try {
      const response = await axios.get(`${API}/domain/check?q=${domain}`);
      setDomainStatus(response.data);
      if (response.data.available) {
        toast.success(`Great! ${domain} is available!`);
      } else {
        toast.error(`Sorry, ${domain} is already taken.`);
      }
    } catch (error) {
      toast.error('Failed to check domain');
    } finally {
      setCheckingDomain(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Free SSL certificates, DDoS protection, and automated security patches',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'SSD storage, CDN integration, and optimized performance',
      color: 'from-violet-500 to-purple-500'
    },
    {
      icon: HeadphonesIcon,
      title: '24/7 Support',
      description: 'Expert support team available round the clock for you',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: Database,
      title: 'Daily Backups',
      description: 'Automated daily backups with 30-day retention policy',
      color: 'from-amber-500 to-orange-500'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CEO, TechStart',
      content: 'HostingIn has been a game-changer for our business. The performance is outstanding!',
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
    },
    {
      name: 'Michael Chen',
      role: 'Developer',
      content: 'Best hosting platform I\'ve used. The support team is incredibly responsive.',
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Blogger',
      content: 'Affordable pricing with premium features. Highly recommend HostingIn!',
      rating: 5,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily'
    }
  ];

  const faqs = [
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, bank transfers, and cryptocurrency payments.'
    },
    {
      question: 'Can I upgrade my plan later?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. We\'ll pro-rate the difference.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee on all our hosting plans.'
    },
    {
      question: 'Is there a setup fee?',
      answer: 'No setup fees! You only pay for your chosen plan. Everything is included.'
    },
    {
      question: 'How long does it take to get started?',
      answer: 'Your hosting account is activated instantly after payment. You can start building right away!'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                <Server className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                HostingIn
              </span>
            </motion.div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                FAQ
              </a>
              <Link to="/login">
                <Button variant="ghost" data-testid="nav-login-btn">Login</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700" data-testid="nav-register-btn">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 pb-4 flex flex-col gap-4"
              >
                <a href="#features" className="text-slate-700 dark:text-slate-300">Features</a>
                <a href="#pricing" className="text-slate-700 dark:text-slate-300">Pricing</a>
                <a href="#faq" className="text-slate-700 dark:text-slate-300">FAQ</a>
                <Link to="/login">
                  <Button variant="ghost" className="w-full">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600">
                    Get Started
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" data-testid="hero-badge">
                🚀 Premium Cloud Hosting
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Hosting Modern
                </span>
                <br />
                untuk Bisnis Anda
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
                Platform hosting terbaik dengan performa tinggi, keamanan enterprise, dan dukungan 24/7. 
                Mulai dari $5/bulan.
              </p>

              {/* Domain Checker */}
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Cari domain Anda..."
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && checkDomain()}
                  className="flex-1"
                  data-testid="domain-input"
                />
                <Button 
                  onClick={checkDomain}
                  disabled={checkingDomain}
                  className="bg-gradient-to-r from-blue-600 to-violet-600"
                  data-testid="check-domain-btn"
                >
                  {checkingDomain ? 'Checking...' : 'Check'}
                </Button>
              </div>

              {domainStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg mb-6 ${
                    domainStatus.available 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                  data-testid="domain-status"
                >
                  <p className={domainStatus.available ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                    {domainStatus.message}
                  </p>
                </motion.div>
              )}

              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700" data-testid="hero-cta-btn">
                    Mulai Sekarang <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" data-testid="hero-demo-btn">
                  Lihat Demo
                </Button>
              </div>

              <div className="flex items-center gap-8 mt-8">
                <div>
                  <div className="text-3xl font-bold text-blue-600">99.9%</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Uptime</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-violet-600">50K+</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">24/7</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Support</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg"
                  alt="Hosting Infrastructure"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-violet-600/20"></div>
              </div>
              
              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-xs text-slate-500">Server Status</div>
                    <div className="text-sm font-bold text-green-500">Online</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-xs text-slate-500">Security</div>
                    <div className="text-sm font-bold text-blue-500">Protected</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Fitur <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Premium</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Semua yang Anda butuhkan untuk sukses online
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white/30 dark:bg-slate-900/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Harga <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Terbaik</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
              Pilih paket yang sesuai dengan kebutuhan Anda
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={billingPeriod === 'monthly' ? 'font-bold text-blue-600' : 'text-slate-500'}>
                Monthly
              </span>
              <Switch
                checked={billingPeriod === 'yearly'}
                onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
                data-testid="billing-toggle"
              />
              <span className={billingPeriod === 'yearly' ? 'font-bold text-blue-600' : 'text-slate-500'}>
                Yearly
                <Badge className="ml-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  Save 20%
                </Badge>
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {packages.map((pkg, index) => {
              const price = pkg.price_cents / 100;
              const yearlyPrice = price * 12 * 0.8;
              const displayPrice = billingPeriod === 'yearly' ? yearlyPrice / 12 : price;
              
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className={index === 1 ? 'md:-mt-4' : ''}
                >
                  <Card className={`relative ${
                    index === 1 
                      ? 'border-2 border-blue-600 shadow-2xl' 
                      : 'border-0 shadow-lg'
                  } bg-white/50 dark:bg-slate-800/50 backdrop-blur`}>
                    {index === 1 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-violet-600 text-white">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader>
                      <CardTitle className="text-2xl">{pkg.title}</CardTitle>
                      <CardDescription>{pkg.description}</CardDescription>
                      <div className="mt-4">
                        <div className="text-4xl font-bold">
                          ${displayPrice.toFixed(2)}
                          <span className="text-lg font-normal text-slate-500">/month</span>
                        </div>
                        {billingPeriod === 'yearly' && (
                          <div className="text-sm text-green-600 dark:text-green-400">
                            Billed ${yearlyPrice.toFixed(2)} yearly
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {pkg.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Link to="/register">
                        <Button 
                          className={`w-full ${
                            index === 1
                              ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700'
                              : ''
                          }`}
                          variant={index === 1 ? 'default' : 'outline'}
                          data-testid={`package-btn-${pkg.slug}`}
                        >
                          Get Started
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Apa Kata <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Customer</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Dipercaya oleh ribuan bisnis di seluruh dunia
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-3">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-slate-500">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-white/30 dark:bg-slate-900/30">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">FAQ</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Pertanyaan yang Sering Diajukan
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 dark:text-slate-400">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl p-12 text-center text-white"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Siap untuk Memulai?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Bergabunglah dengan ribuan pelanggan yang sudah mempercayai HostingIn
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100" data-testid="cta-btn">
                Get Started Now <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                  <Server className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold">HostingIn</span>
              </div>
              <p className="text-slate-400">
                Premium cloud hosting untuk bisnis modern
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; 2025 HostingIn. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
