import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FolderOpen, File, Download, Upload, Trash2, Plus,
  Shield, Mail, Database, Terminal, Lock, CheckCircle,
  AlertCircle, ChevronRight, Search, FileText, Image as ImageIcon,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import DashboardLayout from '../components/DashboardLayout';
import DomainChecker from '../components/DomainChecker';
import { useApi } from '../hooks/useApi';
import { toast } from 'sonner';

export default function Tools() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileManagerOpen, setFileManagerOpen] = useState(false);
  const [sslDialogOpen, setSslDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [domainCheckerOpen, setDomainCheckerOpen] = useState(false);
  const [sslEnabled, setSslEnabled] = useState(true);
  const { request } = useApi();

  const handleAddToCart = async (item) => {
    try {
      await request('POST', '/cart/add', item);
      toast.success(`${item.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  // Dummy file structure
  const files = [
    { name: 'public_html', type: 'folder', size: '-', modified: '2 hours ago' },
    { name: 'index.html', type: 'file', size: '4.2 KB', modified: '1 day ago', icon: FileText },
    { name: 'style.css', type: 'file', size: '12.8 KB', modified: '1 day ago', icon: FileText },
    { name: 'script.js', type: 'file', size: '8.5 KB', modified: '2 days ago', icon: FileText },
    { name: 'logo.png', type: 'file', size: '156 KB', modified: '3 days ago', icon: ImageIcon },
    { name: 'background.jpg', type: 'file', size: '892 KB', modified: '1 week ago', icon: ImageIcon },
  ];

  const tools = [
    {
      id: 'domain-checker',
      title: 'Domain Checker',
      description: 'Search and register domains',
      icon: Globe,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      action: () => setDomainCheckerOpen(true)
    },
    {
      id: 'file-manager',
      title: 'File Manager',
      description: 'Manage your website files and folders',
      icon: FolderOpen,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      action: () => setFileManagerOpen(true)
    },
    {
      id: 'ssl',
      title: 'SSL Certificate',
      description: 'Secure your website with SSL/TLS',
      icon: Shield,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      action: () => setSslDialogOpen(true),
      badge: sslEnabled ? 'Active' : 'Inactive'
    },
    {
      id: 'email',
      title: 'Email Accounts',
      description: 'Create and manage email accounts',
      icon: Mail,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-100 dark:bg-violet-900/20',
      action: () => setEmailDialogOpen(true)
    },
    {
      id: 'database',
      title: 'Database Manager',
      description: 'Manage MySQL databases',
      icon: Database,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      action: () => toast.info('Database manager coming soon!')
    },
    {
      id: 'terminal',
      title: 'SSH Terminal',
      description: 'Access your server via SSH',
      icon: Terminal,
      color: 'from-slate-500 to-slate-700',
      bgColor: 'bg-slate-100 dark:bg-slate-900/20',
      action: () => toast.info('SSH terminal coming soon!')
    },
    {
      id: 'backup',
      title: 'Backup & Restore',
      description: 'Create and restore backups',
      icon: Download,
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-100 dark:bg-amber-900/20',
      action: () => toast.info('Backup manager coming soon!')
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Hosting Tools</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your hosting environment with powerful tools
          </p>
        </motion.div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="border-0 shadow-lg hover:shadow-xl transition-all bg-white/50 dark:bg-slate-800/50 backdrop-blur cursor-pointer group"
                onClick={tool.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${tool.bgColor}`}>
                      <tool.icon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                    </div>
                    {tool.badge && (
                      <Badge className={tool.badge === 'Active' ? 'bg-green-500' : 'bg-slate-500'}>
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {tool.description}
                  </p>
                  <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Open Tool
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks at your fingertips</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start h-auto py-4">
                <Upload className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Upload Files</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Via FTP or File Manager</p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-4">
                <Database className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">phpMyAdmin</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Manage databases</p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-4">
                <Shield className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Security Scan</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Check for vulnerabilities</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* File Manager Dialog */}
      <Dialog open={fileManagerOpen} onOpenChange={setFileManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>File Manager</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-violet-600">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <div className="flex-1" />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search files..." className="pl-9 w-64" />
              </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <FolderOpen className="w-4 h-4" />
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-400">home</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-blue-600 dark:text-blue-400">public_html</span>
            </div>

            {/* File List */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 grid grid-cols-12 gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                <div className="col-span-6">Name</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-3">Modified</div>
                <div className="col-span-1">Actions</div>
              </div>
              <div className="divide-y">
                {files.map((file, index) => {
                  const FileIcon = file.icon || FolderOpen;
                  return (
                    <div
                      key={index}
                      className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                    >
                      <div className="col-span-6 flex items-center gap-3">
                        <FileIcon className={`w-5 h-5 ${
                          file.type === 'folder' 
                            ? 'text-blue-600' 
                            : 'text-slate-600 dark:text-slate-400'
                        }`} />
                        <span className="font-medium">{file.name}</span>
                      </div>
                      <div className="col-span-2 text-sm text-slate-600 dark:text-slate-400">
                        {file.size}
                      </div>
                      <div className="col-span-3 text-sm text-slate-600 dark:text-slate-400">
                        {file.modified}
                      </div>
                      <div className="col-span-1 flex gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
              Note: This is a demo interface. Full file management capabilities coming soon.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* SSL Dialog */}
      <Dialog open={sslDialogOpen} onOpenChange={setSslDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SSL Certificate Manager</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900 dark:text-green-100">SSL Active</h4>
              </div>
              <p className="text-sm text-green-800 dark:text-green-200">
                Your website is secured with a valid SSL certificate
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Auto-Renew SSL</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Automatically renew before expiration
                  </p>
                </div>
                <Switch checked={true} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Force HTTPS</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Redirect all HTTP to HTTPS
                  </p>
                </div>
                <Switch checked={sslEnabled} onCheckedChange={setSslEnabled} />
              </div>

              <div className="space-y-2">
                <Label>Certificate Details</Label>
                <div className="p-4 border rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Issuer:</span>
                    <span className="font-medium">Let's Encrypt</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Valid From:</span>
                    <span className="font-medium">Jan 1, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Expires:</span>
                    <span className="font-medium">Apr 1, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Status:</span>
                    <Badge className="bg-green-500">Valid</Badge>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                Renew Certificate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Account Setup</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">Create Email Account</h4>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Set up professional email addresses for your domain
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email-username">Email Address</Label>
                <div className="flex gap-2">
                  <Input id="email-username" placeholder="username" className="flex-1" />
                  <span className="flex items-center px-4 border rounded-md bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                    @yourdomain.com
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-password">Password</Label>
                <Input id="email-password" type="password" placeholder="Secure password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-quota">Quota (MB)</Label>
                <Input id="email-quota" type="number" placeholder="1024" defaultValue="1024" />
              </div>

              <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                Create Email Account
              </Button>

              <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                Note: Email setup is a demo feature
              </p>
            </div>

            {/* Existing Emails */}
            <div className="space-y-2">
              <Label>Existing Email Accounts</Label>
              <div className="border rounded-lg p-3 text-center text-sm text-slate-600 dark:text-slate-400">
                No email accounts created yet
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Domain Checker Dialog */}
      <Dialog open={domainCheckerOpen} onOpenChange={setDomainCheckerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Domain Checker
            </DialogTitle>
          </DialogHeader>
          <DomainChecker onAddToCart={handleAddToCart} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}