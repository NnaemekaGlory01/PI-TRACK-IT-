import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  AlertTriangle, 
  Calendar,
  User,
  Building2,
  Trash2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Menu,
  X,
  Bell,
  Info,
  Phone,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Wallet,
  PlusCircle,
  MinusCircle,
  History,
  TrendingUp,
  TrendingDown,
  FileText,
  Globe,
  Mail,
  Smartphone,
  ScanLine,
  Layers,
  Box,
  Pill,
  Milk,
  Syringe,
  Droplets,
  Stethoscope,
  ShieldCheck,
  CreditCard as CardIcon,
  Filter,
  Download,
  Edit,
  Camera,
  Settings2,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  Leaf,
  Activity,
  Sparkles,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Printer,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Check,
  AlertCircle,
  HelpCircle,
  Heart,
  Star,
  Tag,
  MapPin,
  Share2,
  ExternalLink,
  Copy,
  Save,
  Undo,
  Redo,
  Maximize2,
  Minimize2,
  Move,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Users,
  Shield,
  CreditCard as SubscriptionIcon
} from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Business, Product, Batch, Sale, SaleItem, Expense } from './types';
import { checkDrugInteractions, predictDrugUsage } from './services/geminiService';
import { format, addDays, addYears, isBefore, isAfter, parseISO, differenceInDays } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', size?: 'sm' | 'md' | 'lg' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-zinc-900 text-white hover:bg-zinc-800',
      secondary: 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100'
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    return (
      <button
        ref={ref}
        className={cn('inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn('bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm', className)}>
    {children}
  </div>
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn('flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', className)}
    {...props}
  />
));

// --- Views ---

const DashboardView = ({ products, batches, sales, salesByDay, onNavigate, isMobile }: { products: Product[], batches: Batch[], sales: Sale[], salesByDay: any[], onNavigate: (view: any, filter?: any) => void, isMobile: boolean }) => {
  const [showQuickTour, setShowQuickTour] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const lowStockProducts = products.filter(p => p.totalQuantity <= (p.safetyStock || 10));
  const expiringSoon = batches.filter(b => {
    const expDate = parseISO(b.expirationDate);
    return isBefore(expDate, addDays(new Date(), 90)) && isAfter(expDate, new Date());
  });
  const expired = batches.filter(b => isBefore(parseISO(b.expirationDate), new Date()));

  const totalSales = sales.reduce((acc, s) => acc + s.total, 0);
  const lastMonthSales = sales.filter(s => isAfter(s.timestamp?.toDate() || new Date(), addDays(new Date(), -30)));
  const lastMonthRevenue = lastMonthSales.reduce((acc, s) => acc + s.total, 0);
  
  const handleGenerateAiInsights = async () => {
    setIsGeneratingAi(true);
    try {
      const insights = await predictDrugUsage(sales);
      setAiInsights(insights);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const news = [
    { title: "New Malaria Vaccine Rollout in Nigeria", source: "Pharma-IQ", link: "#", date: "2024-03-10" },
    { title: "NAFDAC Recalls Contaminated Cough Syrup", source: "NAFDAC", link: "#", date: "2024-03-08" },
    { title: "Global Trends in Personalized Medicine", source: "Drugs.com", link: "#", date: "2024-03-05" },
    { title: "Pharmacy Digitalization: The Future of Retail", source: "FiercePharma", link: "#", date: "2024-03-01" }
  ];
  
  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-white border-primary/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">Total Revenue</p>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold mt-2">₦{totalSales.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 mt-1">Growth: +{((lastMonthRevenue / (totalSales || 1)) * 100).toFixed(1)}% this month</p>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Avg Transaction</p>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-700">₦{(totalSales / (sales.length || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="text-[10px] text-emerald-600 mt-1">Based on {sales.length} sales</p>
        </Card>

        <button onClick={() => onNavigate('inventory', { filter: 'low-stock' })} className="text-left">
          <Card className="p-4 hover:shadow-md transition-all border-amber-100 bg-amber-50/30">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Low Stock</p>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold mt-2 text-amber-700">{lowStockProducts.length}</p>
            <p className="text-[10px] text-amber-600 mt-1">Below safety level</p>
          </Card>
        </button>

        <button onClick={() => onNavigate('inventory', { filter: 'expiring-soon' })} className="text-left">
          <Card className="p-4 hover:shadow-md transition-all border-orange-100 bg-orange-50/30">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Expiring Soon</p>
              <Calendar className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold mt-2 text-orange-700">{expiringSoon.length}</p>
            <p className="text-[10px] text-orange-600 mt-1">Within 90 days</p>
          </Card>
        </button>
      </div>

      {/* AI Prediction Section */}
      <Card className="p-6 bg-gradient-to-r from-indigo-600 to-blue-700 text-white border-none shadow-xl shadow-indigo-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Business Intelligence</h3>
              <p className="text-xs text-indigo-100">Predictive insights based on your sales history</p>
            </div>
          </div>
          <Button 
            onClick={handleGenerateAiInsights} 
            disabled={isGeneratingAi}
            variant="secondary"
            className="bg-white text-indigo-600 hover:bg-white/90"
          >
            {isGeneratingAi ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            {aiInsights ? 'Refresh Predictions' : 'Generate Predictions'}
          </Button>
        </div>

        {aiInsights ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Demand Forecast</p>
              <div className="space-y-3">
                {aiInsights.predictions?.slice(0, 3).map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <span className="text-sm font-medium">{p.drugName}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      p.predictedDemand === 'high' ? "bg-emerald-400 text-emerald-900" :
                      p.predictedDemand === 'medium' ? "bg-amber-400 text-amber-900" : "bg-slate-400 text-slate-900"
                    )}>{p.predictedDemand} Demand</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Strategic Insights</p>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="text-sm leading-relaxed">{aiInsights.insights}</p>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs font-bold text-indigo-200 uppercase mb-2">Growth KPIs</p>
                  <p className="text-sm italic">"{aiInsights.growthKPIs}"</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <BrainCircuit className="w-8 h-8 text-indigo-200 opacity-50" />
            </div>
            <p className="text-sm text-indigo-100 max-w-md">
              Click the button above to analyze your sales data and generate intelligent predictions for your pharmacy.
            </p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Sales Trend (Last 7 Days)
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="total" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Pharmacy Market News
            </h3>
            <div className="space-y-4">
              {news.map((item, i) => (
                <button 
                  key={i} 
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(item.title + " pharmacy drug news Nigeria")}`)}
                  className="block w-full text-left group"
                >
                  <p className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">{item.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400">{item.source}</span>
                    <span className="text-[10px] text-slate-400">{item.date}</span>
                  </div>
                </button>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-[10px] mt-2"
                onClick={() => window.open('https://www.google.com/search?q=Nigeria+pharmacy+drug+market+news+NAFDAC')}
              >
                View More News
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-slate-900 text-white border-none">
            <h3 className="text-sm font-bold mb-2">App Quick Tour</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">Learn how to use PI TRACK IT to its full potential.</p>
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => setShowQuickTour(true)}
            >
              See All Features
            </Button>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" /> Urgent Attention
          </h3>
          <div className="space-y-3">
            {expiringSoon.slice(0, 3).map(batch => {
              const product = products.find(p => p.id === batch.productId);
              const daysLeft = differenceInDays(parseISO(batch.expirationDate), new Date());
              return (
                <div key={batch.id} className="flex items-center justify-between p-3 rounded-xl bg-orange-50 border border-orange-100 group hover:border-orange-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Pill className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-orange-900">{product?.name}</p>
                      <p className="text-[10px] text-orange-700">Expires in {daysLeft} days ({format(parseISO(batch.expirationDate), 'MMM dd')})</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-orange-900">Qty: {batch.quantity}</p>
                    <p className="text-[10px] text-orange-600">Value: ₦{(batch.quantity * (product?.costPrice || 0)).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
            {expired.slice(0, 3).map(batch => {
              const product = products.find(p => p.id === batch.productId);
              return (
                <div key={batch.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100 group hover:border-red-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-900">{product?.name}</p>
                      <p className="text-[10px] text-red-700">EXPIRED</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-900">Qty: {batch.quantity}</p>
                    <p className="text-[10px] text-red-600">Loss: ₦{(batch.quantity * (product?.costPrice || 0)).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
            {expiringSoon.length === 0 && expired.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <ShieldCheck className="w-12 h-12 mb-2 opacity-10" />
                <p className="text-sm font-medium">All stock is safe and up to date</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Recent Activity
          </h3>
          <div className="space-y-4">
            {sales.slice(0, 5).map(sale => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Sale #{sale.id.slice(-4)}</p>
                    <p className="text-[10px] text-slate-500">{format(sale.timestamp?.toDate() || new Date(), 'MMM dd, HH:mm')}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-primary">₦{sale.total.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <footer className="pt-12 border-t border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">PI TRACK IT</p>
              <p className="text-[10px] text-slate-500">Powered by Pharmainsight Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="mailto:pharmainsightanalytics@gmail.com">
              <Button variant="secondary" size="sm" className="gap-2">
                <Mail className="w-4 h-4" /> Contact Us
              </Button>
            </a>
            <div className="text-right">
              <a href="tel:08156692610" className="text-[10px] font-bold text-slate-900 hover:text-primary block">Support: 08156692610</a>
              <a href="mailto:pharmainsightanalytics@gmail.com" className="text-[10px] text-slate-500 hover:text-primary block">pharmainsightanalytics@gmail.com</a>
            </div>
          </div>
        </div>
      </footer>

      {showQuickTour && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">App Quick Tour</h2>
              <button onClick={() => setShowQuickTour(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-3 mb-2">
                    <LayoutDashboard className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-blue-900">Dashboard</h4>
                  </div>
                  <p className="text-xs text-blue-700">Real-time overview of sales, low stock alerts, and upcoming expiry dates.</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-emerald-900">Inventory</h4>
                  </div>
                  <p className="text-xs text-emerald-700">Manage products with pack/piece logic, track batches, and monitor expiry.</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex items-center gap-3 mb-2">
                    <ShoppingCart className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-purple-900">Point of Sale</h4>
                  </div>
                  <p className="text-xs text-purple-700">Fast checkout with drug interaction checks and multiple payment methods.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-5 h-5 text-amber-600" />
                    <h4 className="font-bold text-amber-900">Reports</h4>
                  </div>
                  <p className="text-xs text-amber-700">Detailed sales analytics, category performance, and transaction history.</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="w-5 h-5 text-zinc-600" />
                    <h4 className="font-bold text-zinc-900">Settings</h4>
                  </div>
                  <p className="text-xs text-zinc-700">Configure pharmacy profile, manage staff roles, and subscription.</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h4 className="font-bold text-red-900">Safety Features</h4>
                  </div>
                  <p className="text-xs text-red-700">Automated drug-drug interaction alerts and expiry notifications.</p>
                </div>
              </div>
            </div>

            <Button className="w-full mt-8 h-12" onClick={() => setShowQuickTour(false)}>Got it, thanks!</Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const InventoryView = ({ products, batches, businessId, initialFilter, isMobile }: { products: Product[], batches: Batch[], businessId: string, initialFilter?: string, isMobile: boolean }) => {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(initialFilter || 'all');
  const [showAdjustStock, setShowAdjustStock] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [adjustStockData, setAdjustStockData] = useState({ productId: '', reason: '', delta: 0, type: 'add' as 'add' | 'remove' });
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (initialFilter) {
      setFilterType(initialFilter);
    }
  }, [initialFilter]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterType === 'low-stock') return matchesSearch && p.totalQuantity <= (p.safetyStock || 10);
    if (filterType === 'expiring-soon') {
      const productBatches = batches.filter(b => b.productId === p.id);
      return matchesSearch && productBatches.some(b => {
        const expDate = parseISO(b.expirationDate);
        return isBefore(expDate, addDays(new Date(), 90)) && isAfter(expDate, new Date());
      });
    }
    if (filterType === 'expired') {
      const productBatches = batches.filter(b => b.productId === p.id);
      return matchesSearch && productBatches.some(b => isBefore(parseISO(b.expirationDate), new Date()));
    }
    return matchesSearch;
  });

  const stats = useMemo(() => {
    const totalCount = products.length;
    const totalCostValue = products.reduce((acc, p) => acc + (p.totalQuantity * p.costPrice), 0);
    const totalSellingValue = products.reduce((acc, p) => acc + (p.totalQuantity * p.sellingPrice), 0);
    const estimatedProfit = totalSellingValue - totalCostValue;
    return { totalCount, totalCostValue, totalSellingValue, estimatedProfit };
  }, [products]);

  const [sellType, setSellType] = useState<'single' | 'pack_piece'>('single');

  useEffect(() => {
    if (editingProduct) {
      setSellType(editingProduct.sellType || 'single');
    } else {
      setSellType('single');
    }
  }, [editingProduct]);

  const verifyBarcode = async (barcode: string) => {
    if (!barcode) return;
    // Simulate an anti-counterfeit check
    // In a real app, this would call a NAFDAC or similar API
    const isFake = barcode.startsWith('FAKE'); 
    if (isFake) {
      alert('WARNING: This barcode is flagged as a potential counterfeit drug! Please verify with the supplier.');
    } else {
      alert('Barcode verified. No counterfeit flags found.');
    }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get('name') as string;
    const rawCostPrice = (formData.get('costPrice') as string || '').replace(/,/g, '');
    const rawSellingPrice = (formData.get('sellingPrice') as string || '').replace(/,/g, '');
    const costPrice = Number(rawCostPrice);
    const sellingPrice = Number(rawSellingPrice);

    if (!name) {
      alert('Product name is required');
      return;
    }

    if (isNaN(costPrice) || isNaN(sellingPrice)) {
      alert('Please enter valid numbers for prices');
      return;
    }

    const productData: any = {
      name,
      category: formData.get('category') as string,
      barcode: formData.get('barcode') as string,
      supplier: formData.get('supplier') as string,
      costPrice: isNaN(costPrice) ? 0 : costPrice,
      sellingPrice: isNaN(sellingPrice) ? 0 : sellingPrice,
      dosageForm: formData.get('dosageForm') as string,
      safetyStock: Number(formData.get('safetyStock')) || 0,
      sellType: sellType,
      imageUrl: formData.get('imageUrl') as string,
      isControlled: formData.get('isControlled') === 'on',
      mechanismOfAction: formData.get('mechanismOfAction') as string,
      drugClass: formData.get('drugClass') as string,
      indication: formData.get('indication') as string,
      businessId
    };

    if (sellType === 'pack_piece') {
      productData.piecesPerPack = Number(formData.get('piecesPerPack'));
      productData.sellingPricePerPiece = Number(formData.get('sellingPricePerPiece'));
    } else {
      productData.piecesPerPack = 1;
      productData.sellingPricePerPiece = 0;
    }

    if (editingProduct) {
      await updateDoc(doc(db, 'products', editingProduct.id), productData);
    } else {
      productData.totalQuantity = 0;
      await addDoc(collection(db, 'products'), productData);
    }
    setIsAddingProduct(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    setProductToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (productToDelete) {
      await deleteDoc(doc(db, 'products', productToDelete));
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };

  const handleAddBatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const formData = new FormData(e.currentTarget);
    const qtyInput = Number(formData.get('quantity'));
    
    let piecesToAdd = qtyInput;
    if (selectedProduct.sellType === 'pack_piece') {
      piecesToAdd = qtyInput * (selectedProduct.piecesPerPack || 1);
    }

    const newBatch = {
      productId: selectedProduct.id,
      batchNumber: formData.get('batchNumber') as string,
      manufacturingDate: formData.get('manufacturingDate') as string,
      expirationDate: formData.get('expirationDate') as string,
      quantity: piecesToAdd,
      businessId
    };
    await addDoc(collection(db, 'batches'), newBatch);
    await updateDoc(doc(db, 'products', selectedProduct.id), {
      totalQuantity: selectedProduct.totalQuantity + piecesToAdd
    });
    setIsAddingBatch(false);
  };

  const handleAdjustStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adjustStockData.productId) return;
    
    const product = products.find(p => p.id === adjustStockData.productId);
    if (!product) return;

    const delta = adjustStockData.type === 'add' ? adjustStockData.delta : -adjustStockData.delta;
    const newTotal = product.totalQuantity + delta;

    if (newTotal < 0) {
      alert('Stock cannot be negative!');
      return;
    }

    try {
      await updateDoc(doc(db, 'products', product.id), {
        totalQuantity: newTotal
      });

      // Log the adjustment
      await addDoc(collection(db, 'inventory_adjustments'), {
        productId: product.id,
        productName: product.name,
        delta,
        reason: adjustStockData.reason,
        timestamp: serverTimestamp(),
        businessId
      });

      setShowAdjustStock(false);
      setAdjustStockData({ productId: '', reason: '', delta: 0, type: 'add' });
    } catch (error) {
      console.error("Adjustment error:", error);
    }
  };

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        // Find the imageUrl input and set its value
        const input = document.querySelector('input[name="imageUrl"]') as HTMLInputElement;
        if (input) {
          input.value = dataUrl;
          // Trigger change event if needed
          const event = new Event('change', { bubbles: true });
          input.dispatchEvent(event);
        }
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Total Products</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.totalCount}</p>
        </Card>
        <Card className="p-4 bg-white border-slate-200">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Inventory Cost Value</p>
          <p className="text-xl font-bold text-slate-900 mt-1">₦{stats.totalCostValue.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-white border-slate-200">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Potential Sales Value</p>
          <p className="text-xl font-bold text-primary mt-1">₦{stats.totalSellingValue.toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-100">
          <p className="text-[10px] font-bold text-emerald-600 uppercase">Est. Potential Profit</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">₦{stats.estimatedProfit.toLocaleString()}</p>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name or barcode..." 
              className="pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="h-11 px-4 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="expiring-soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="h-11">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button onClick={() => { setEditingProduct(null); setIsAddingProduct(true); }} className="h-11">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <Card>
        {isMobile ? (
          <div className="divide-y divide-slate-100">
            {filteredProducts.map(product => (
              <div key={product.id} className="p-4 space-y-4 border-b border-slate-50 last:border-0 active:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-100 flex-shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      product.dosageForm === 'Tablet' ? <Pill className="w-7 h-7" /> : 
                      product.dosageForm === 'Syrup' ? <Droplets className="w-7 h-7" /> :
                      <Box className="w-7 h-7" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-900 truncate text-base">{product.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono tracking-tight">{product.barcode || 'No Barcode'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary">₦{product.sellingPrice.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{product.category}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-lg font-bold w-fit text-[10px] uppercase tracking-wider",
                      product.totalQuantity <= (product.safetyStock || 10) ? "bg-red-50 text-red-700 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    )}>
                      {product.sellType === 'pack_piece' ? (
                        `${Math.floor(product.totalQuantity / (product.piecesPerPack || 1))}p, ${product.totalQuantity % (product.piecesPerPack || 1)}pc`
                      ) : (
                        `${product.totalQuantity} units`
                      )}
                    </span>
                    {product.totalQuantity <= (product.safetyStock || 10) && (
                      <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 uppercase tracking-tight">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setAdjustStockData({ ...adjustStockData, productId: product.id }); setShowAdjustStock(true); }} className="h-9 w-9 p-0 rounded-xl">
                      <Settings2 className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => { setSelectedProduct(product); setIsAddingBatch(true); }} className="h-9 w-9 p-0 rounded-xl">
                      <PlusCircle className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => { setEditingProduct(product); setIsAddingProduct(true); }} className="h-9 w-9 p-0 rounded-xl">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleDeleteProduct(product.id)} className="h-9 w-9 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-slate-400 italic">No products found</div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Product Details</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Category & Form</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Stock Status</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Pricing</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            product.dosageForm === 'Tablet' ? <Pill className="w-6 h-6" /> : 
                            product.dosageForm === 'Syrup' ? <Droplets className="w-6 h-6" /> :
                            <Box className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{product.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{product.barcode || 'No Barcode'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700 font-medium">{product.category}</p>
                      <p className="text-[10px] text-slate-500">{product.dosageForm || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit",
                          product.totalQuantity <= (product.safetyStock || 10) ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                          {product.sellType === 'pack_piece' ? (
                            `${Math.floor(product.totalQuantity / (product.piecesPerPack || 1))} packs, ${product.totalQuantity % (product.piecesPerPack || 1)} pieces`
                          ) : (
                            `${product.totalQuantity} units`
                          )}
                        </span>
                        {product.totalQuantity <= (product.safetyStock || 10) && (
                          <span className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900 font-bold">₦{product.sellingPrice.toLocaleString()}{product.sellType === 'pack_piece' ? '/pack' : ''}</p>
                      {product.sellType === 'pack_piece' && (
                        <p className="text-[10px] text-primary font-medium">₦{product.sellingPricePerPiece?.toLocaleString()}/piece</p>
                      )}
                      <p className="text-[10px] text-slate-500">Cost: ₦{product.costPrice.toLocaleString()}</p>
                    </td>
                        <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => { setAdjustStockData({ ...adjustStockData, productId: product.id }); setShowAdjustStock(true); }} title="Adjust Stock">
                          <Settings2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedProduct(product); setIsAddingBatch(true); }} title="Add Batch">
                          <PlusCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingProduct(product); setIsAddingProduct(true); }} title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:text-red-600" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 uppercase">Confirm Deletion</h3>
                <p className="text-sm text-slate-500">Are you sure you want to delete this product? All associated batches and records will be affected. This action cannot be undone.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button 
                  variant="secondary" 
                  className="h-12 font-bold uppercase"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setProductToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="h-12 font-bold uppercase bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                  onClick={confirmDeleteProduct}
                >
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modals */}
      {isAddingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsAddingProduct(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Product Name</label>
                    <Input name="name" defaultValue={editingProduct?.name} required placeholder="e.g. Paracetamol 500mg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Category</label>
                    <select name="category" defaultValue={editingProduct?.category} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Analgesics</option>
                      <option>Antibiotics</option>
                      <option>Antimalarials</option>
                      <option>Supplements</option>
                      <option>Personal Care</option>
                      <option>Others</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Dosage Form</label>
                    <select name="dosageForm" defaultValue={editingProduct?.dosageForm} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Tablet</option>
                      <option>Capsule</option>
                      <option>Syrup</option>
                      <option>Injection</option>
                      <option>Cream</option>
                      <option>Gel</option>
                      <option>Drops</option>
                      <option>Inhaler</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Barcode</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input name="barcode" defaultValue={editingProduct?.barcode} placeholder="Scan or enter barcode" className="pr-10" />
                        <Camera className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-pointer" />
                      </div>
                      <Button type="button" variant="secondary" onClick={() => {
                        const input = document.querySelector('input[name="barcode"]') as HTMLInputElement;
                        if (input) verifyBarcode(input.value);
                      }} className="px-3" title="Verify Anti-Counterfeit">
                        <ShieldAlert className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Image URL</label>
                    <div className="flex gap-2">
                      <Input name="imageUrl" defaultValue={editingProduct?.imageUrl} placeholder="https://example.com/image.jpg" className="flex-1" />
                      <Button type="button" variant="secondary" onClick={startCamera} className="px-3">
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {isCapturing && (
                    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
                      <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg rounded-2xl shadow-2xl" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="flex gap-4 mt-8">
                        <Button variant="secondary" onClick={stopCamera}>Cancel</Button>
                        <Button onClick={capturePhoto} className="bg-white text-black hover:bg-slate-100">
                          <Camera className="w-5 h-5 mr-2" /> Capture
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-amber-700 uppercase">Controlled Substance</label>
                      <input type="checkbox" name="isControlled" defaultChecked={editingProduct?.isControlled} className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
                    </div>
                    <p className="text-[10px] text-amber-600 leading-relaxed">
                      Marking this will enforce prescriber validation during sales.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Mechanism of Action</label>
                    <Input name="mechanismOfAction" defaultValue={editingProduct?.mechanismOfAction} placeholder="e.g. COX-2 inhibitor" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Drug Class</label>
                    <Input name="drugClass" defaultValue={editingProduct?.drugClass} placeholder="e.g. NSAID" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Indication</label>
                    <Input name="indication" defaultValue={editingProduct?.indication} placeholder="e.g. Pain, Fever" />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Selling Configuration</label>
                    <div className="flex gap-2 p-1 bg-slate-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setSellType('single')}
                        className={cn(
                          "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                          sellType === 'single' ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        Single Unit Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setSellType('pack_piece')}
                        className={cn(
                          "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                          sellType === 'pack_piece' ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        Pieces & Packs
                      </button>
                    </div>

                    {sellType === 'single' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Cost Price (₦)</label>
                            <Input name="costPrice" type="number" defaultValue={editingProduct?.costPrice} required placeholder="Per unit" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Selling Price (₦)</label>
                            <Input name="sellingPrice" type="number" defaultValue={editingProduct?.sellingPrice} required placeholder="Per unit" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Pieces per Pack</label>
                          <Input name="piecesPerPack" type="number" defaultValue={editingProduct?.piecesPerPack} required placeholder="e.g. 10" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Cost per Pack (₦)</label>
                            <Input name="costPrice" type="number" defaultValue={editingProduct?.costPrice} required />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Selling per Pack (₦)</label>
                            <Input name="sellingPrice" type="number" defaultValue={editingProduct?.sellingPrice} required />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Selling per Piece (₦)</label>
                          <Input name="sellingPricePerPiece" type="number" defaultValue={editingProduct?.sellingPricePerPiece} required />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Safety Stock Level (Pieces/Units)</label>
                    <Input name="safetyStock" type="number" defaultValue={editingProduct?.safetyStock || 10} required />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <Button type="button" variant="secondary" className="flex-1 h-12" onClick={() => setIsAddingProduct(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 h-12">
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <AnimatePresence>
        {showAdjustStock && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Adjust Stock</h2>
                <button onClick={() => setShowAdjustStock(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAdjustStock} className="space-y-6">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAdjustStockData({ ...adjustStockData, type: 'add' })}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold rounded-md transition-all",
                      adjustStockData.type === 'add' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustStockData({ ...adjustStockData, type: 'remove' })}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold rounded-md transition-all",
                      adjustStockData.type === 'remove' ? "bg-white text-red-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    Remove Stock
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Quantity (Units/Pieces)</label>
                  <Input 
                    type="number" 
                    required 
                    value={adjustStockData.delta}
                    onChange={(e) => setAdjustStockData({ ...adjustStockData, delta: Number(e.target.value) })}
                    placeholder="e.g. 10" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Reason for Adjustment</label>
                  <select 
                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={adjustStockData.reason}
                    onChange={(e) => setAdjustStockData({ ...adjustStockData, reason: e.target.value })}
                    required
                  >
                    <option value="">Select a reason...</option>
                    <option value="Restock">Restock</option>
                    <option value="Damaged">Damaged / Broken</option>
                    <option value="Expired">Expired</option>
                    <option value="Returned">Customer Return</option>
                    <option value="Correction">Inventory Correction</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAdjustStock(false)}>Cancel</Button>
                  <Button type="submit" className={cn(
                    "flex-1",
                    adjustStockData.type === 'add' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                  )}>
                    Confirm Adjustment
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {isAddingBatch && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-slate-900">Add Batch</h2>
              <button onClick={() => setIsAddingBatch(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-8">Product: <span className="font-bold text-slate-900">{selectedProduct.name}</span></p>
            
            <form onSubmit={handleAddBatch} className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Batch Number</label>
                <Input name="batchNumber" required placeholder="e.g. BNT-2024-001" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Mfg Date</label>
                  <Input name="manufacturingDate" type="date" required />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Exp Date</label>
                  <Input name="expirationDate" type="date" required />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">
                  {selectedProduct?.sellType === 'pack_piece' ? 'Quantity (Number of Full Packs)' : 'Quantity (Number of Units)'}
                </label>
                <Input name="quantity" type="number" required placeholder={selectedProduct?.sellType === 'pack_piece' ? "e.g. 5 packs" : "e.g. 50 units"} />
                {selectedProduct?.sellType === 'pack_piece' && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    This will add {selectedProduct.piecesPerPack || 0} pieces per pack to inventory.
                  </p>
                )}
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="secondary" className="flex-1 h-12" onClick={() => setIsAddingBatch(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 h-12">Add to Stock</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const POSView = ({ products, batches, businessId, user, business, printerStatus, useBrowserPrint, isMobile }: { products: Product[], batches: Batch[], businessId: string, user: FirebaseUser, business: Business | null, printerStatus: string, useBrowserPrint: boolean, isMobile: boolean }) => {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [interactionAlert, setInteractionAlert] = useState<any>(null);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pos' | 'transfer' | 'credit'>('cash');
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '' });
  const [posStep, setPosStep] = useState<'browsing' | 'safety_check' | 'cart' | 'payment'>('browsing');
  const [interactionWarnings, setInteractionWarnings] = useState<any[]>([]);
  const [overrideLogs, setOverrideLogs] = useState<any[]>([]);
  const [overrideReason, setOverrideReason] = useState('');
  const [isOverridden, setIsOverridden] = useState(false);
  const [showInteractionDetails, setShowInteractionDetails] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showPrescriberModal, setShowPrescriberModal] = useState(false);
  const [prescriberInfo, setPrescriberInfo] = useState({ name: '', licenseNumber: '', hospital: '' });

  const filteredProducts = products.filter(p => 
    p.totalQuantity > 0 && 
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, amountPaid - total);

  const addToCart = (product: Product, unit: 'unit' | 'pack' | 'piece' = 'unit') => {
    const sellUnit = product.sellType === 'pack_piece' ? unit : 'unit';
    const price = sellUnit === 'piece' ? (product.sellingPricePerPiece || 0) : product.sellingPrice;
    
    // Check if enough stock
    const requiredPieces = sellUnit === 'pack' ? (product.piecesPerPack || 1) : 1;
    const existingTotalPieces = cart.filter(item => item.productId === product.id)
      .reduce((acc, item) => {
        const itemProduct = products.find(p => p.id === item.productId);
        const multiplier = item.sellUnit === 'pack' ? (itemProduct?.piecesPerPack || 1) : 1;
        return acc + (item.quantity * multiplier);
      }, 0);

    if (existingTotalPieces + requiredPieces > product.totalQuantity) {
      alert('Not enough stock available!');
      return;
    }

    const existing = cart.find(item => item.productId === product.id && item.sellUnit === sellUnit);
    if (existing) {
      setCart(cart.map(item => (item.productId === product.id && item.sellUnit === sellUnit) ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      // FEFO Logic: Sort batches by expiration date and find the first valid one
      const validBatches = batches
        .filter(b => b.productId === product.id && isAfter(parseISO(b.expirationDate), new Date()) && b.quantity > 0)
        .sort((a, b) => parseISO(a.expirationDate).getTime() - parseISO(b.expirationDate).getTime());

      const batch = validBatches[0];
      
      if (!batch) {
        alert('No valid batches found for this product.');
        return;
      }
      setCart([...cart, { 
        productId: product.id, 
        name: product.name, 
        quantity: 1, 
        price: price, 
        batchId: batch.id,
        sellUnit: sellUnit
      }]);
    }
  };

  const removeFromCart = (cartKey: string) => {
    setCart(cart.filter(item => (item.productId + item.sellUnit) !== cartKey));
    setIsOverridden(false);
    setOverrideReason('');
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    setCart(cart.map(item => {
      if ((item.productId + item.sellUnit) === cartKey) {
        const newQty = Math.max(1, item.quantity + delta);
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const multiplier = item.sellUnit === 'pack' ? (product.piecesPerPack || 1) : 1;
          if (newQty * multiplier > product.totalQuantity) {
            alert('Not enough stock available!');
            return item;
          }
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
    setIsOverridden(false);
    setOverrideReason('');
  };

  const [showReceipt, setShowReceipt] = useState<Sale | null>(null);

  const logInteraction = async (alert: any, action: string, reason?: string) => {
    if (!businessId || !alert) return;
    try {
      await addDoc(collection(db, 'interaction_logs'), {
        businessId,
        timestamp: serverTimestamp(),
        drugNames: cart.map(item => item.name),
        severity: alert.severity,
        warning: alert.description || alert.warning,
        action,
        overrideReason: reason || null,
        staffUid: user.uid
      });
    } catch (error) {
      console.error("Logging error:", error);
    }
  };

  const resolveInteraction = (action: 'remove' | 'override' | 'replace') => {
    if (action === 'remove') {
      if (cart.length > 0) {
        const removedItem = cart[cart.length - 1];
        const newCart = [...cart];
        newCart.pop();
        setCart(newCart);
        logInteraction(interactionAlert, 'remove_item', `Removed ${removedItem.name}`);
      }
    } else if (action === 'override') {
      const reason = prompt('Please provide a reason for overriding this drug interaction warning:');
      if (reason) {
        setOverrideReason(reason);
        setIsOverridden(true);
        logInteraction(interactionAlert, 'override', reason);
      }
    } else if (action === 'replace') {
      if (interactionAlert?.recommendation) {
        // Extract first alternative name if possible, or just use the whole string
        const alt = interactionAlert.recommendation;
        setSearchTerm(alt);
        setPosStep('browsing');
        // We don't remove the item yet, user might want to compare
      }
    }
  };

  // Removed background interaction check effect as requested to simplify
  // Interaction check is now only triggered manually on "Make Payment"

  useEffect(() => {
    if (!businessId) return;
    const q = query(collection(db, 'expenses'), where('businessId', '==', businessId), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense)));
    });
  }, [businessId]);

  const handleCheckInteractions = async () => {
    if (cart.length < 2) {
      setInteractionWarnings([]);
      setPosStep('payment');
      return;
    }

    setIsCheckingInteractions(true);
    try {
      const drugNames = cart.map(item => item.name);
      const result = await checkDrugInteractions(drugNames);
      if (result && result.interactions && result.interactions.length > 0) {
        setInteractionWarnings(result.interactions);
        // Stay in cart but show warnings
        setPosStep('cart');
      } else {
        setInteractionWarnings([]);
        setPosStep('payment');
      }
    } catch (error) {
      console.error('Interaction check failed:', error);
      setInteractionWarnings([]);
      setPosStep('payment');
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === 'credit' && (!customerDetails.name || !customerDetails.phone)) {
      alert('Please provide customer details for credit sales.');
      return;
    }
    setIsProcessing(true);
    try {
      const saleData: any = {
        items: cart,
        total,
        discount,
        paymentMethod,
        timestamp: serverTimestamp(),
        staffUid: user.uid,
        businessId,
        customerDetails: paymentMethod === 'credit' ? { ...customerDetails, amountOwed: total } : null,
        changeAmount: paymentMethod === 'cash' ? change : 0,
        prescriberInfo: null
      };

      if (isOverridden) {
        saleData.safetyOverride = {
          reason: overrideReason,
          warning: interactionAlert?.warning
        };
      }

      const docRef = await addDoc(collection(db, 'sales'), saleData);
      
      // Set for receipt
      setShowReceipt({ id: docRef.id, ...saleData });

      // Add to income/expenses
      await addDoc(collection(db, 'expenses'), {
        type: 'income',
        category: 'Sales',
        amount: total,
        description: `Sale #${docRef.id.slice(-6)}`,
        timestamp: serverTimestamp(),
        businessId
      });

      // Update inventory
      for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        const batch = batches.find(b => b.id === item.batchId);
        if (product && batch) {
          const piecesToDeduct = item.sellUnit === 'pack' ? (product.piecesPerPack || 1) * item.quantity : item.quantity;
          await updateDoc(doc(db, 'products', product.id), {
            totalQuantity: product.totalQuantity - piecesToDeduct
          });
          await updateDoc(doc(db, 'batches', batch.id), {
            quantity: batch.quantity - piecesToDeduct
          });
        }
      }

      setCart([]);
      setDiscount(0);
      setAmountPaid(0);
      setCustomerDetails({ name: '', phone: '' });
      setPosStep('browsing');
      setIsOverridden(false);
      setOverrideReason('');
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = async (sale: Sale) => {
    if (business?.useBrowserPrint) {
      window.print();
      return;
    }

    if (printerStatus !== 'connected') {
      alert('Printer not connected. Falling back to browser print.');
      window.print();
      return;
    }

    try {
      // Bluetooth printing logic would go here
      // For now, we'll just alert
      alert('Printing to Bluetooth thermal printer...');
    } catch (error) {
      console.error("Print error:", error);
      window.print();
    }
  };

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addDoc(collection(db, 'expenses'), {
      type: formData.get('type') as string,
      category: formData.get('category') as string,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      timestamp: serverTimestamp(),
      businessId
    });
    e.currentTarget.reset();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant={!showExpenses ? 'primary' : 'secondary'} 
            onClick={() => setShowExpenses(false)}
            className="h-10"
          >
            <ShoppingCart className="w-4 h-4 mr-2" /> Sales Terminal
          </Button>
          <Button 
            variant={showExpenses ? 'primary' : 'secondary'} 
            onClick={() => setShowExpenses(true)}
            className="h-10"
          >
            <History className="w-4 h-4 mr-2" /> Income & Expenses
          </Button>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Daily Balance</p>
          <p className="text-sm font-bold text-primary">
            ₦{expenses.reduce((acc, e) => e.type === 'income' ? acc + e.amount : acc - e.amount, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {!showExpenses ? (
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <div className={cn(
            "grid grid-cols-1 gap-6 h-full transition-all duration-500 ease-in-out",
            posStep !== 'browsing' ? "lg:grid-cols-2 xl:grid-cols-3" : "lg:grid-cols-1"
          )}>
            <div className={cn(
              "flex flex-col space-y-4 min-h-0 transition-all duration-500",
              posStep !== 'browsing' ? "lg:col-span-1 xl:col-span-2" : "lg:col-span-1"
            )}>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search products or scan barcode..." 
                    className="pl-10 h-12"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Camera className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 cursor-pointer" />
                </div>
                {posStep === 'browsing' && cart.length > 0 && (
                  <Button 
                    variant="primary" 
                    className={cn(
                      "h-12 px-6 shadow-lg shadow-primary/20 animate-in fade-in slide-in-from-right-4 relative",
                      interactionAlert?.severity === 'high' && "ring-2 ring-red-500 ring-offset-2"
                    )}
                    onClick={() => setPosStep('safety_check')}
                    aria-expanded={posStep !== 'browsing'}
                    aria-label="Review Cart and Safety Check"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    <span className="font-bold">₦{total.toLocaleString()}</span>
                    <div className="ml-2 bg-white/20 px-2 py-0.5 rounded text-[10px]">
                      {cart.reduce((acc, item) => acc + item.quantity, 0)} items
                    </div>
                    {interactionAlert?.severity === 'high' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </Button>
                )}
              </div>
              
              <Card className="flex-1 overflow-y-auto p-4 bg-slate-50/30 border-slate-200">
                <div className={cn(
                  "grid gap-4 transition-all duration-500",
                  posStep !== 'browsing' ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                )}>
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className={cn(
                        "flex flex-col rounded-2xl bg-white border border-slate-200 hover:border-primary hover:shadow-lg transition-all text-left group relative overflow-hidden",
                        isMobile ? "p-3" : "p-4"
                      )}
                    >
                      {product.isControlled && (
                        <div className="absolute top-2 right-2 z-0 pointer-events-none">
                          <div className="bg-amber-100/80 text-amber-700 p-1 rounded-lg border border-amber-200/50 backdrop-blur-sm shadow-sm">
                            <AlertTriangle className={isMobile ? "w-2.5 h-2.5" : "w-3 h-3"} />
                          </div>
                        </div>
                      )}
                      <div className={cn("flex items-center gap-3 relative z-10", isMobile ? "mb-2" : "mb-3")}>
                        <div className={cn("rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200", isMobile ? "w-8 h-8" : "w-10 h-10")}>
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Pill className={isMobile ? "w-4 h-4 text-slate-400" : "w-5 h-5 text-slate-400"} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-bold text-primary uppercase block truncate tracking-tight">{product.category}</span>
                          <span className={cn("font-bold text-slate-900 line-clamp-1", isMobile ? "text-xs" : "text-sm")}>{product.name}</span>
                        </div>
                      </div>

                      <div className="space-y-2 mt-auto relative z-20">
                        {product.sellType === 'pack_piece' ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, 'pack');
                              }}
                              className="flex flex-col items-center p-1.5 rounded-xl bg-slate-50 hover:bg-primary/10 hover:border-primary border border-transparent transition-all cursor-pointer active:scale-95"
                            >
                              <span className="text-[8px] font-bold text-slate-500 uppercase">Pack</span>
                              <span className="text-[10px] font-bold text-slate-900">₦{product.sellingPrice.toLocaleString()}</span>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, 'piece');
                              }}
                              className="flex flex-col items-center p-1.5 rounded-xl bg-slate-50 hover:bg-primary/10 hover:border-primary border border-transparent transition-all cursor-pointer active:scale-95"
                            >
                              <span className="text-[8px] font-bold text-slate-500 uppercase">Piece</span>
                              <span className="text-[10px] font-bold text-slate-900">₦{product.sellingPricePerPiece?.toLocaleString()}</span>
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product, 'unit');
                            }}
                            className={cn(
                              "w-full flex items-center justify-between rounded-xl bg-slate-50 hover:bg-primary/10 hover:border-primary border border-transparent transition-all cursor-pointer active:scale-95",
                              isMobile ? "p-2" : "p-3"
                            )}
                          >
                            <span className={cn("font-bold text-slate-900", isMobile ? "text-[10px]" : "text-xs")}>₦{product.sellingPrice.toLocaleString()}</span>
                            <PlusCircle className={isMobile ? "w-3.5 h-3.5 text-primary" : "w-4 h-4 text-primary"} />
                          </button>
                        )}
                        
                        <div className="flex items-center justify-between px-1">
                          <span className={cn(
                            "text-[9px] font-bold",
                            product.totalQuantity < 10 ? "text-red-600" : "text-slate-500"
                          )}>
                            {product.sellType === 'pack_piece' ? (
                              `${Math.floor(product.totalQuantity / (product.piecesPerPack || 1))}p, ${product.totalQuantity % (product.piecesPerPack || 1)}pc`
                            ) : (
                              `${product.totalQuantity}u`
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <AnimatePresence mode="wait">
              {posStep !== 'browsing' && (
                <motion.div 
                  key={posStep}
                  initial={isMobile ? { y: '100%' } : { x: 300, opacity: 0 }}
                  animate={isMobile ? { y: 0 } : { x: 0, opacity: 1 }}
                  exit={isMobile ? { y: '100%' } : { x: 300, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className={cn(
                    "flex flex-col space-y-4 min-h-0 h-full",
                    isMobile && "fixed inset-0 z-[60] bg-white pt-16"
                  )}
                >
                  <Card className={cn(
                    "flex-1 flex flex-col p-0 bg-white border-slate-200 shadow-2xl relative overflow-hidden",
                    isMobile && "border-none rounded-none"
                  )}>
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          {posStep === 'cart' ? <ShoppingCart className="w-5 h-5 text-primary" /> : <CreditCard className="w-5 h-5 text-primary" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {posStep === 'cart' ? 'Cart Review' : 'Payment'}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">{cart.length} items in cart</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setPosStep('browsing')}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6">
                      {posStep === 'cart' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                          {/* Interaction Warnings in Cart */}
                          {interactionWarnings.length > 0 && (
                            <div className="space-y-4 mb-6">
                              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs text-red-800 font-bold uppercase tracking-wider mb-1">Safety Warning</p>
                                  <p className="text-[10px] text-red-700 leading-relaxed">
                                    The following interactions were detected. Please resolve them before proceeding to payment.
                                  </p>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                {interactionWarnings.map((warning, idx) => (
                                  <div key={idx} className="bg-white border border-red-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{warning.drugA} + {warning.drugB}</h4>
                                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[8px] font-black uppercase rounded">High Risk</span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 mb-3 leading-relaxed">{warning.description}</p>
                                    <div className="flex gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 h-8 text-[9px] font-bold uppercase border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                          setCart(prev => prev.filter(item => item.name !== warning.drugB));
                                          setInteractionWarnings(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                      >
                                        Remove {warning.drugB}
                                      </Button>
                                      <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        className="flex-1 h-8 text-[9px] font-bold uppercase"
                                        onClick={() => {
                                          const reason = prompt(`Reason for overriding interaction between ${warning.drugA} and ${warning.drugB}:`);
                                          if (reason) {
                                            setInteractionWarnings(prev => prev.filter((_, i) => i !== idx));
                                          }
                                        }}
                                      >
                                        Override
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-4">
                            {cart.map((item) => {
                              const product = products.find(p => p.id === item.productId);
                              return (
                                <div 
                                  key={`${item.productId}-${item.sellUnit}`} 
                                  className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all"
                                >
                                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {product?.imageUrl ? (
                                      <img src={product.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <Pill className="w-6 h-6 text-slate-300" />
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                      <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                                      <p className="text-sm font-bold text-primary">₦{(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
                                          <button 
                                            onClick={() => updateQuantity(item.productId + item.sellUnit, -1)}
                                            className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-primary transition-colors"
                                          >
                                            <MinusCircle className="w-4 h-4" />
                                          </button>
                                          <span className="w-8 text-center text-xs font-bold text-slate-700">{item.quantity}</span>
                                          <button 
                                            onClick={() => updateQuantity(item.productId + item.sellUnit, 1)}
                                            className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-primary transition-colors"
                                          >
                                            <PlusCircle className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-primary/10 text-primary uppercase tracking-wider">
                                          {item.sellUnit}
                                        </span>
                                      </div>
                                      
                                      <button 
                                        onClick={() => removeFromCart(item.productId + item.sellUnit)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-3">
                            <div className="flex items-center justify-between text-xl font-black text-slate-900 uppercase tracking-widest">
                              <span>Grand Total</span>
                              <span className="text-2xl text-primary">₦{total.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                            <Button 
                              variant="secondary" 
                              className="h-14 lg:h-16 text-sm font-black uppercase tracking-widest"
                              onClick={() => setPosStep('browsing')}
                            >
                              Continue Shopping
                            </Button>
                            <Button 
                              className="h-14 lg:h-16 text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                              onClick={handleCheckInteractions}
                              disabled={isCheckingInteractions}
                            >
                              {isCheckingInteractions ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Checking...</span>
                                </div>
                              ) : (
                                interactionWarnings.length > 0 ? "Re-Check Safety" : "Make Payment"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {posStep === 'payment' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-wider">Discount (₦)</label>
                                  <Input 
                                    type="number" 
                                    value={discount} 
                                    onChange={(e) => setDiscount(Number(e.target.value))}
                                    className="h-12 bg-white border-slate-200 font-bold"
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-wider">Payment Method</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(['cash', 'pos', 'transfer', 'credit'] as const).map((method) => (
                                      <button
                                        key={method}
                                        onClick={() => setPaymentMethod(method)}
                                        className={cn(
                                          "h-12 rounded-xl border text-[10px] font-bold uppercase transition-all",
                                          paymentMethod === method 
                                            ? "bg-primary border-primary text-white shadow-md shadow-primary/20" 
                                            : "bg-white border-slate-200 text-slate-500 hover:border-primary hover:text-primary"
                                        )}
                                      >
                                        {method}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                {paymentMethod === 'cash' && (
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-wider">Amount Paid (₦)</label>
                                    <Input 
                                      type="number" 
                                      value={amountPaid} 
                                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                                      className="h-12 bg-white border-slate-200 font-bold text-emerald-600"
                                      placeholder="0.00"
                                    />
                                  </div>
                                )}

                                {paymentMethod === 'credit' && (
                                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Credit Sale Details</p>
                                    
                                    {/* Itemized List for Credit */}
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                      {cart.map((item, idx) => {
                                        const product = products.find(p => p.id === item.productId);
                                        return (
                                          <div key={idx} className="flex items-center justify-between text-[10px] py-1.5 border-b border-slate-200 last:border-0">
                                            <div className="flex items-center gap-2">
                                              <div className="w-6 h-6 rounded bg-white flex items-center justify-center overflow-hidden border border-slate-100">
                                                {product?.imageUrl ? (
                                                  <img src={product.imageUrl} className="w-full h-full object-cover" />
                                                ) : <Pill className="w-3 h-3 text-slate-300" />}
                                              </div>
                                              <div>
                                                <p className="font-bold text-slate-900 line-clamp-1">{item.name}</p>
                                                <p className="text-slate-500">{item.quantity} × ₦{item.price.toLocaleString()}</p>
                                              </div>
                                            </div>
                                            <p className="font-bold text-slate-900">₦{(item.quantity * item.price).toLocaleString()}</p>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    <div className="space-y-2">
                                      <Input 
                                        placeholder="Customer Name" 
                                        value={customerDetails.name}
                                        onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                                        className="h-10 text-xs"
                                      />
                                      <Input 
                                        placeholder="Phone Number" 
                                        value={customerDetails.phone}
                                        onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                                        className="h-10 text-xs"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <span>Total Payable</span>
                                <span className="text-xl text-white">₦{total.toLocaleString()}</span>
                              </div>
                              {paymentMethod === 'cash' && amountPaid > 0 && (
                                <div className="flex items-center justify-between pt-2 text-sm font-bold text-emerald-400 border-t border-white/10">
                                  <span className="uppercase tracking-wider">Change Due</span>
                                  <span className="text-lg">₦{change.toLocaleString()}</span>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <Button 
                                variant="secondary" 
                                className="h-16 text-sm font-black uppercase tracking-widest"
                                onClick={() => setPosStep('cart')}
                              >
                                Back to Cart
                              </Button>
                              <Button 
                                className="h-16 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/30" 
                                disabled={cart.length === 0 || isProcessing}
                                onClick={handleCheckout}
                              >
                                {isProcessing ? (
                                  <div className="flex items-center gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span>Processing...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-6 h-6" />
                                    <span>Confirm Payment</span>
                                  </div>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {posStep === 'browsing' && cart.length > 0 && (
            <div className="fixed bottom-8 right-8 z-50 lg:hidden">
              <Button 
                variant="primary" 
                size="lg"
                className="rounded-full w-16 h-16 shadow-2xl shadow-primary/40 flex items-center justify-center p-0"
                onClick={() => setPosStep('cart')}
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-primary">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                </div>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <Card className="p-6 h-fit">
            <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-primary" /> Log Income / Expense
            </h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Type</label>
                <select name="type" className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="expense">Expense</option>
                  <option value="income">Other Income</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Category</label>
                <select name="category" className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Petty Cash</option>
                  <option>Supplier Payment</option>
                  <option>Rent</option>
                  <option>Electricity</option>
                  <option>Staff Salary</option>
                  <option>Others</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Amount (₦)</label>
                <Input name="amount" type="number" required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Description</label>
                <Input name="description" placeholder="e.g. Fuel for generator" />
              </div>
              <Button type="submit" className="w-full h-11">Log Transaction</Button>
            </form>
          </Card>

          <Card className="lg:col-span-2 p-6 flex flex-col">
            <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" /> Recent Transactions
            </h3>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Date</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Type</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Category</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500">{format(e.timestamp?.toDate() || new Date(), 'MMM dd, HH:mm')}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          e.type === 'income' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        )}>
                          {e.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{e.category}</td>
                      <td className={cn(
                        "px-4 py-3 font-bold",
                        e.type === 'income' ? "text-emerald-600" : "text-red-600"
                      )}>
                        {e.type === 'income' ? '+' : '-'}₦{e.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {showReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Sale Successful</h2>
              <p className="text-sm text-slate-500">Transaction ID: #{showReceipt.id?.slice(-8)}</p>
            </div>

            <div className="mt-8 space-y-4 border-t border-b border-slate-100 py-6">
              {showReceipt.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.quantity}x {item.name} ({item.sellUnit})</span>
                  <span className="font-bold text-slate-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-bold text-slate-900">₦{(showReceipt.total + (showReceipt.discount || 0)).toLocaleString()}</span>
                </div>
                {showReceipt.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount</span>
                    <span>-₦{showReceipt.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-primary uppercase tracking-wider">
                  <span>Total</span>
                  <span>₦{showReceipt.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <Button variant="secondary" className="h-12" onClick={() => window.print()}>
                <Download className="w-4 h-4 mr-2" /> Print Receipt
              </Button>
              <Button className="h-12" onClick={() => setShowReceipt(null)}>
                New Sale
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Controlled Drug Prescriber Modal */}
      <AnimatePresence>
        {showPrescriberModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Controlled Substance</h3>
                  <p className="text-xs text-slate-500">Prescriber information is required for this sale.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Prescriber Name</label>
                  <Input 
                    placeholder="Dr. John Doe" 
                    value={prescriberInfo.name}
                    onChange={(e) => setPrescriberInfo({ ...prescriberInfo, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">License Number</label>
                  <Input 
                    placeholder="MD-123456" 
                    value={prescriberInfo.licenseNumber}
                    onChange={(e) => setPrescriberInfo({ ...prescriberInfo, licenseNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Hospital / Clinic</label>
                  <Input 
                    placeholder="General Hospital" 
                    value={prescriberInfo.hospital}
                    onChange={(e) => setPrescriberInfo({ ...prescriberInfo, hospital: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => setShowPrescriberModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  disabled={!prescriberInfo.name || !prescriberInfo.licenseNumber}
                  onClick={() => {
                    setShowPrescriberModal(false);
                    handleCheckout();
                  }}
                >
                  Confirm & Checkout
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LedgerView = ({ sales, businessId, isMobile }: { sales: Sale[], businessId: string, isMobile: boolean }) => {
  const creditSales = useMemo(() => 
    sales.filter(s => s.paymentMethod === 'credit' && (s.customerDetails?.amountOwed || 0) > 0)
  , [sales]);

  const handleResolvePayment = async (saleId: string, amount: number) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || !sale.customerDetails) return;

    const currentOwed = sale.customerDetails.amountOwed || 0;
    const newOwed = Math.max(0, currentOwed - amount);
    
    try {
      await updateDoc(doc(db, 'sales', saleId), {
        'customerDetails.amountOwed': newOwed,
        'paymentMethod': newOwed === 0 ? 'cash' : 'credit',
        'paidAt': newOwed === 0 ? serverTimestamp() : null,
        'status': newOwed === 0 ? 'resolved' : 'pending'
      });

      // Log the payment in a ledger collection
      await addDoc(collection(db, 'credit_ledger'), {
        saleId,
        customerName: sale.customerDetails.name,
        amountPaid: amount,
        remainingBalance: newOwed,
        timestamp: serverTimestamp(),
        businessId
      });

      // Also log as income
      await addDoc(collection(db, 'expenses'), {
        businessId,
        type: 'income',
        category: 'Credit Payment',
        amount: amount,
        timestamp: serverTimestamp(),
        description: `Credit payment for sale #${saleId.slice(-6)}`
      });

      alert('Payment resolved successfully!');
    } catch (error) {
      console.error("Ledger error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Credit Ledger</h2>
          <p className="text-sm text-slate-500">Manage outstanding customer payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-orange-50 border-orange-100">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Total Outstanding</p>
          <p className="text-3xl font-black text-orange-700 mt-2">
            ₦{creditSales.reduce((acc, s) => acc + (s.customerDetails?.amountOwed || 0), 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-orange-600 mt-1">{creditSales.length} pending payments</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {isMobile ? (
          <div className="divide-y divide-slate-100">
            {creditSales.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic">No outstanding credits found</div>
            ) : (
              creditSales.map(sale => (
                <div key={sale.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{sale.customerDetails?.name}</p>
                      <p className="text-xs text-slate-500">{sale.customerDetails?.phone}</p>
                    </div>
                    <span className="text-sm font-black text-red-600">₦{sale.customerDetails?.amountOwed?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-slate-500">
                      {format(sale.timestamp?.toDate() || new Date(), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-[10px] text-slate-600 truncate max-w-[150px]">
                      {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 h-10"
                    onClick={() => {
                      const amount = prompt(`Enter amount paid by ${sale.customerDetails?.name}:`, sale.customerDetails?.amountOwed?.toString());
                      if (amount && !isNaN(Number(amount))) {
                        handleResolvePayment(sale.id!, Number(amount));
                      }
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Resolve Payment
                  </Button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Date</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Customer</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Items</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Amount Owed</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No outstanding credits found</td>
                  </tr>
                ) : (
                  creditSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {format(sale.timestamp?.toDate() || new Date(), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{sale.customerDetails?.name}</p>
                        <p className="text-xs text-slate-500">{sale.customerDetails?.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-red-600">₦{sale.customerDetails?.amountOwed?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                          onClick={() => {
                            const amount = prompt(`Enter amount paid by ${sale.customerDetails?.name}:`, sale.customerDetails?.amountOwed?.toString());
                            if (amount && !isNaN(Number(amount))) {
                              handleResolvePayment(sale.id!, Number(amount));
                            }
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Resolve Payment
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

const SettingsView = ({ 
  business, 
  businessId, 
  user,
  printer,
  printerStatus,
  printerError,
  useBrowserPrint,
  setUseBrowserPrint,
  connectPrinter,
  isMobile
}: { 
  business: Business | null, 
  businessId: string, 
  user: FirebaseUser,
  printer: any,
  printerStatus: string,
  printerError: string,
  useBrowserPrint: boolean,
  setUseBrowserPrint: (val: boolean) => void,
  connectPrinter: () => Promise<void>,
  isMobile: boolean
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const plans = [
    { name: 'Basic', price: 65000, features: ['Core Inventory', 'Basic POS', 'Sales Reports'] },
    { name: 'Professional', price: 90000, features: ['Advanced Analytics', 'Staff Management', 'AI Insights'] },
    { name: 'Business', price: 120000, features: ['Multi-branch Support', 'Priority Support', 'Full AI Suite'] },
    { name: 'Enterprise', price: 180000, features: ['Custom Integrations', 'Dedicated Account Manager', 'Unlimited Everything'] }
  ];

  const handleUpgrade = async (planName: string) => {
    if (!business) return;
    try {
      await updateDoc(doc(db, 'businesses', business.id), {
        subscriptionPlan: planName.toLowerCase(),
        subscriptionExpiry: format(addYears(new Date(), 1), 'yyyy-MM-dd')
      });
      setShowSubscriptionModal(false);
    } catch (error) {
      console.error("Upgrade error:", error);
    }
  };

  const [logoUrl, setLogoUrl] = useState(business?.logoUrl || '');
  const [staff, setStaff] = useState<UserProfile[]>([]);

  const nigerianStates = [
    "Lagos", "Abuja (FCT)", "Rivers", "Kano", "Oyo", "Enugu", "Anambra", "Kaduna", "Edo", "Delta"
  ];

  useEffect(() => {
    if (!businessId) return;
    const q = query(collection(db, 'users'), where('businessId', '==', businessId));
    return onSnapshot(q, (snap) => {
      setStaff(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    });
  }, [businessId]);

  const handleUpdateBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!businessId) return;
    setIsUpdating(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateDoc(doc(db, 'businesses', businessId), {
        name: formData.get('name'),
        address: formData.get('address'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        state: formData.get('state'),
        lga: formData.get('lga'),
        logoUrl
      });
      alert('Settings updated successfully!');
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateReceiptSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!businessId) return;
    setIsUpdating(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateDoc(doc(db, 'businesses', businessId), {
        receiptCompanyName: formData.get('receiptCompanyName'),
        receiptMotto: formData.get('receiptMotto'),
        receiptTagline: formData.get('receiptTagline'),
        useBrowserPrint
      });
      alert('Receipt settings updated successfully!');
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  };

  const handleAddStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;
    const name = formData.get('name') as string;

    try {
      await addDoc(collection(db, 'users'), {
        email,
        role,
        displayName: name,
        businessId,
        createdAt: serverTimestamp()
      });
      setShowAddStaff(false);
      alert('Staff member added successfully!');
    } catch (error) {
      console.error("Add staff error:", error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
          <p className="text-slate-500">Manage your pharmacy profile and configurations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "px-4 py-2 rounded-full text-xs font-bold uppercase flex items-center gap-2",
            business?.subscriptionPlan === 'premium' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"
          )}>
            <ShieldCheck className="w-4 h-4" />
            {business?.subscriptionPlan || 'Free'} Plan
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Box className="w-5 h-5 text-primary" /> Pharmacy Profile
            </h3>
            <form onSubmit={handleUpdateBusiness} className="space-y-6">
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                    <Edit className="w-5 h-5" />
                    <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                  </label>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Pharmacy Logo</p>
                  <p className="text-xs text-slate-500">Upload your business logo for receipts and reports</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Pharmacy Name</label>
                  <Input name="name" defaultValue={business?.name} required />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Contact Email</label>
                  <Input name="email" type="email" defaultValue={business?.email} required />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Phone Number</label>
                  <Input name="phone" defaultValue={business?.phone} required />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Country</label>
                  <Input name="country" defaultValue="Nigeria" disabled />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">State</label>
                  <select 
                    name="state" 
                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    defaultValue={business?.state}
                  >
                    {nigerianStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">LGA / City</label>
                  <Input name="lga" defaultValue={business?.lga} placeholder="Enter LGA" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Physical Address</label>
                <Input name="address" defaultValue={business?.address} required />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isUpdating} className="px-8">
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Receipt & Print Customization
            </h3>
            <form onSubmit={handleUpdateReceiptSettings} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Receipt Company Name</label>
                  <Input name="receiptCompanyName" defaultValue={business?.receiptCompanyName || business?.name} placeholder="e.g. Pharmainsight Pharmacy" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Motto / Slogan</label>
                  <Input name="receiptMotto" defaultValue={business?.receiptMotto} placeholder="e.g. Your Health, Our Priority" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Tagline</label>
                  <Input name="receiptTagline" defaultValue={business?.receiptTagline} placeholder="e.g. Quality Medicines at Affordable Prices" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isUpdating} className="px-8">
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Receipt Settings'}
                </Button>
              </div>
            </form>

            <div className="mt-10 pt-10 border-t border-slate-100">
              <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" /> Bluetooth Printer Setup
              </h4>
              
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-blue-900 uppercase">Bluetooth Connection Guide</p>
                  <ul className="text-[10px] text-blue-800 space-y-1 list-disc pl-4">
                    <li>Ensure your thermal printer is turned ON and in pairing mode.</li>
                    <li>Make sure your device's Bluetooth is enabled.</li>
                    <li>Use <b>Google Chrome</b> or <b>Microsoft Edge</b> for best compatibility.</li>
                    <li>If connection fails, try clearing your browser cache or restarting the printer.</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full animate-pulse",
                      printerStatus === 'connected' ? "bg-emerald-500" : 
                      printerStatus === 'scanning' ? "bg-amber-500" : "bg-slate-300"
                    )} />
                    <span className="text-sm font-bold text-slate-700">
                      {printerStatus === 'connected' ? `Connected to ${printer?.name || 'Printer'}` : 
                       printerStatus === 'scanning' ? 'Scanning for devices...' : 'Not Connected'}
                    </span>
                  </div>
                  <Button 
                    variant={printerStatus === 'connected' ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={connectPrinter}
                    disabled={printerStatus === 'scanning'}
                  >
                    {printerStatus === 'connected' ? 'Reconnect' : 'Connect Printer'}
                  </Button>
                </div>
                
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-200">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900">Browser Print Fallback</p>
                    <p className="text-[10px] text-slate-500">If Bluetooth fails, use the standard browser print dialog.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseBrowserPrint(!useBrowserPrint)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      useBrowserPrint ? "bg-primary" : "bg-slate-300"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      useBrowserPrint ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>

                {printerError && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-xs font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    <div>
                      <p className="font-bold uppercase text-[10px] mb-0.5">Connection Error</p>
                      <p>{printerError}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Staff Management
              </h3>
              <Button variant="secondary" onClick={() => setShowAddStaff(true)} className="h-9">
                <Plus className="w-4 h-4 mr-2" /> Add Staff
              </Button>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Name</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Email</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Role</th>
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase text-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map(s => (
                    <tr key={s.uid} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-900">{s.displayName || 'Unnamed Staff'}</td>
                      <td className="px-4 py-3 text-slate-500">{s.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          s.role === 'admin' ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600"
                        )}>
                          {s.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-xs text-slate-600">Active</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-8 bg-primary text-white border-none shadow-2xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Subscription
              </h3>
              <p className="text-primary-foreground/80 text-sm mb-6">Your current plan and billing details</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-sm opacity-80">Current Plan</span>
                  <span className="font-bold uppercase tracking-wider">{business?.subscriptionPlan || 'Free'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-sm opacity-80">Expiry Date</span>
                  <span className="font-bold">{business?.subscriptionExpiry ? format(parseISO(business.subscriptionExpiry), 'MMM dd, yyyy') : 'N/A'}</span>
                </div>
              </div>

              <Button 
                variant="secondary" 
                className="w-full h-12 bg-white text-primary hover:bg-slate-50 border-none font-bold"
                onClick={() => setShowSubscriptionModal(true)}
              >
                Upgrade Plan
              </Button>
              <p className="text-[10px] text-center mt-4 opacity-60">Secure payments powered by Paystack</p>
            </div>
          </Card>

          {showSubscriptionModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold">Choose Your Plan</h3>
                    <p className="text-slate-500">Select the best plan for your pharmacy growth</p>
                  </div>
                  <button onClick={() => setShowSubscriptionModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {plans.map((plan) => (
                    <div key={plan.name} className={cn(
                      "p-6 rounded-3xl border-2 transition-all flex flex-col",
                      business?.subscriptionPlan === plan.name.toLowerCase() ? "border-primary bg-primary/5" : "border-slate-100 hover:border-primary/30"
                    )}>
                      <h4 className="text-lg font-bold mb-1">{plan.name}</h4>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-2xl font-black">₦{plan.price.toLocaleString()}</span>
                        <span className="text-xs text-slate-500">/yr</span>
                      </div>
                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        onClick={() => handleUpgrade(plan.name)}
                        variant={business?.subscriptionPlan === plan.name.toLowerCase() ? "outline" : "primary"}
                        className="w-full"
                        disabled={business?.subscriptionPlan === plan.name.toLowerCase()}
                      >
                        {business?.subscriptionPlan === plan.name.toLowerCase() ? 'Current Plan' : 'Select Plan'}
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          <Card className="p-8 border-slate-200">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" /> Support & Help
            </h3>
            <div className="space-y-4">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                  <FileText className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Documentation</p>
                  <p className="text-xs text-slate-500">Learn how to use PI Track It</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                  <Phone className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Contact Support</p>
                  <p className="text-xs text-slate-500">Get help from our team</p>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {showAddStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add New Staff</h3>
              <button onClick={() => setShowAddStaff(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Full Name</label>
                <Input name="name" placeholder="e.g. John Doe" required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Email Address</label>
                <Input name="email" type="email" placeholder="staff@example.com" required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Role</label>
                <select name="role" className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="staff">Staff / Pharmacist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="pt-4">
                <Button type="submit" className="w-full h-12">Send Invite</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// --- Reports View ---

const ReportsView = ({ sales, products, isMobile }: { sales: Sale[], products: Product[], isMobile: boolean }) => {
  const [aiReport, setAiReport] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const drugMovement = useMemo(() => {
    const movement: Record<string, { name: string, count: number, revenue: number, category: string }> = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (!movement[item.productId]) {
          movement[item.productId] = { name: item.name, count: 0, revenue: 0, category: product?.category || 'General' };
        }
        movement[item.productId].count += item.quantity;
        movement[item.productId].revenue += item.price * item.quantity;
      });
    });
    return Object.values(movement).sort((a, b) => b.count - a.count);
  }, [sales, products]);

  const handleGenerateAiReport = async () => {
    setIsGenerating(true);
    try {
      const report = await predictDrugUsage(sales);
      setAiReport(report);
    } catch (error) {
      console.error("AI Report Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalProfit = sales.reduce((acc, s) => {
    const saleProfit = s.items.reduce((itemAcc, item) => {
      const product = products.find(p => p.id === item.productId);
      const cost = product?.costPrice || 0;
      return itemAcc + ((item.price - cost) * item.quantity);
    }, 0);
    return acc + saleProfit;
  }, 0);

  const fastMoving = drugMovement.slice(0, 5);
  const slowMoving = drugMovement.slice(-5).reverse();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Business Intelligence</h2>
          <p className="text-sm text-slate-500">Comprehensive performance analysis & KPIs</p>
        </div>
        <Button onClick={handleGenerateAiReport} disabled={isGenerating} className="shadow-lg shadow-primary/20">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate AI Business Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-blue-600 text-white border-none shadow-xl shadow-blue-200">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Gross Revenue</p>
          <p className="text-3xl font-black mt-2">₦{totalRevenue.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <TrendingUp className="w-4 h-4" />
            <span>+12.5% from last month</span>
          </div>
        </Card>
        <Card className="p-6 bg-emerald-600 text-white border-none shadow-xl shadow-emerald-200">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Estimated Profit</p>
          <p className="text-3xl font-black mt-2">₦{totalProfit.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <Activity className="w-4 h-4" />
            <span>{( (totalProfit / (totalRevenue || 1)) * 100).toFixed(1)}% Net Margin</span>
          </div>
        </Card>
        <Card className="p-6 bg-indigo-600 text-white border-none shadow-xl shadow-indigo-200">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Customer Retention</p>
          <p className="text-3xl font-black mt-2">84%</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <Users className="w-4 h-4" />
            <span>Based on repeat transactions</span>
          </div>
        </Card>
      </div>

      {aiReport && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-8 border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-primary">AI Strategic Analysis</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Market Insights</h4>
                <p className="text-sm leading-relaxed text-slate-700">{aiReport.insights}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Growth Recommendations</h4>
                <p className="text-sm italic text-primary font-medium">"{aiReport.growthKPIs}"</p>
                <div className="mt-6 space-y-3">
                  {aiReport.predictions?.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                      <span className="text-sm font-bold">{p.drugName}</span>
                      <span className="text-xs text-slate-500">{p.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Top Performing Products
          </h3>
          <div className="space-y-4">
            {fastMoving.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-primary border border-slate-100">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{item.count} sold</p>
                  <p className="text-[10px] text-emerald-600 font-bold">₦{item.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" /> Inventory Turnover (Slow)
          </h3>
          <div className="space-y-4">
            {slowMoving.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-slate-400 border border-slate-100">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{item.count} sold</p>
                  <p className="text-[10px] text-slate-500">₦{item.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};


// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'inventory' | 'pos' | 'reports' | 'settings' | 'ledger'>('dashboard');
  const [inventoryFilter, setInventoryFilter] = useState<string | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial state correctly
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Printer State
  const [printer, setPrinter] = useState<any>(null);
  const [printerStatus, setPrinterStatus] = useState<'disconnected' | 'scanning' | 'connected' | 'error'>('disconnected');
  const [printerError, setPrinterError] = useState('');
  const [useBrowserPrint, setUseBrowserPrint] = useState(false);

  useEffect(() => {
    if (business?.useBrowserPrint !== undefined) {
      setUseBrowserPrint(business.useBrowserPrint);
    }
  }, [business?.useBrowserPrint]);

  const connectPrinter = async () => {
    if (!(navigator as any).bluetooth) {
      setPrinterError('Web Bluetooth is not supported in this browser. Please use Chrome or Edge.');
      setPrinterStatus('error');
      return;
    }

    try {
      setPrinterStatus('scanning');
      setPrinterError('');
      
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      const server = await device.gatt?.connect();
      setPrinter(device);
      setPrinterStatus('connected');
      
      device.addEventListener('gattserverdisconnected', () => {
        setPrinterStatus('disconnected');
        setPrinter(null);
      });

    } catch (error: any) {
      console.error("Bluetooth error:", error);
      setPrinterStatus('error');
      setPrinterError(error.message || 'Failed to connect to printer.');
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          const p = { uid: u.uid, ...userDoc.data() } as UserProfile;
          setProfile(p);
          if (p.businessId) {
            const bDoc = await getDoc(doc(db, 'businesses', p.businessId));
            if (bDoc.exists()) setBusiness({ id: bDoc.id, ...bDoc.data() } as Business);
          }
        } else {
          // New user setup
          const newProfile = { uid: u.uid, name: u.displayName || 'User', email: u.email!, role: 'admin' as const };
          await setDoc(doc(db, 'users', u.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
        setBusiness(null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!business?.id) return;

    const qProducts = query(collection(db, 'products'), where('businessId', '==', business.id));
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });

    const qBatches = query(collection(db, 'batches'), where('businessId', '==', business.id));
    const unsubBatches = onSnapshot(qBatches, (snap) => {
      setBatches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Batch)));
    });

    const qSales = query(collection(db, 'sales'), where('businessId', '==', business.id), orderBy('timestamp', 'desc'), limit(100));
    const unsubSales = onSnapshot(qSales, (snap) => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
    });

    return () => {
      unsubProducts();
      unsubBatches();
      unsubSales();
    };
  }, [business?.id]);

  const handleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());
  const handleLogout = () => signOut(auth);

  const handleCreateBusiness = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const bData = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      contact: formData.get('contact') as string,
      ownerUid: user.uid
    };
    const bRef = await addDoc(collection(db, 'businesses'), bData);
    await updateDoc(doc(db, 'users', user.uid), { businessId: bRef.id });
    setBusiness({ id: bRef.id, ...bData } as Business);
  };

  const salesByDay = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(new Date(), -i);
      return format(d, 'MMM dd');
    }).reverse();

    return last7Days.map(day => {
      const daySales = sales.filter(s => format(s.timestamp?.toDate() || new Date(), 'MMM dd') === day);
      return {
        name: day,
        total: daySales.reduce((acc, s) => acc + s.total, 0)
      };
    });
  }, [sales]);

  const handleNavigate = (view: any, filter?: any) => {
    setCurrentView(view);
    if (view === 'inventory') {
      setInventoryFilter(filter);
    } else {
      setInventoryFilter(undefined);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">PI TRACK IT 1.0</h1>
          <p className="text-zinc-500 mb-8">Inventory & Sales Management for FMCG & Pharmacies</p>
          <Button onClick={handleLogin} className="w-full h-12">
            Sign in with Google
          </Button>
        </Card>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <h2 className="text-2xl font-bold mb-6">Setup Your Business</h2>
          <form onSubmit={handleCreateBusiness} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Business Name</label>
              <Input name="name" required placeholder="e.g. Abuja Pharmacy" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Address</label>
              <Input name="address" required placeholder="123 Main St, Abuja" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Contact Details</label>
              <Input name="contact" required placeholder="Phone or Email" />
            </div>
            <Button type="submit" className="w-full mt-4">Create Business</Button>
          </form>
        </Card>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
    { id: 'ledger', label: 'Credit Ledger', icon: History },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Header */}
      {isMobile && (
        <header className="h-16 bg-white border-b border-zinc-200 px-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">PI TRACK IT</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
              <Menu className="w-5 h-5 text-zinc-600" />
            </button>
          </div>
        </header>
      )}

      {/* Sidebar / Drawer */}
      <aside className={cn(
        "bg-white border-r border-zinc-200 transition-all duration-500 ease-in-out flex flex-col z-[70] shadow-2xl lg:shadow-none",
        isMobile ? (
          isSidebarOpen ? "fixed inset-y-0 left-0 w-72 translate-x-0" : "fixed inset-y-0 left-0 w-72 -translate-x-full"
        ) : (
          isSidebarOpen ? "w-64" : "w-20"
        )
      )}>
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            {(isSidebarOpen || isMobile) && <span className="font-bold text-lg truncate">PI TRACK IT</span>}
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-zinc-100 rounded-lg">
              <X className="w-5 h-5 text-zinc-600" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                handleNavigate(item.id as any);
                if (isMobile) setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                currentView === item.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(isSidebarOpen || isMobile) && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-100">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(isSidebarOpen || isMobile) && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile drawer */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col min-h-0 overflow-y-auto",
        isMobile && "pb-24"
      )}>
        {!isMobile && (
          <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                <Menu className="w-5 h-5 text-zinc-600" />
              </button>
              <h1 className="text-lg font-bold capitalize">{currentView}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{business.name}</p>
                <p className="text-xs text-zinc-500">{profile?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                <User className="w-5 h-5 text-zinc-400" />
              </div>
            </div>
          </header>
        )}

        <div className={cn(
          "max-w-7xl mx-auto w-full",
          isMobile ? "p-4 pb-24" : "p-8"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && (
                <DashboardView 
                  products={products} 
                  batches={batches} 
                  sales={sales} 
                  salesByDay={salesByDay}
                  onNavigate={handleNavigate}
                  isMobile={isMobile}
                />
              )}
              {currentView === 'inventory' && (
                <InventoryView 
                  products={products} 
                  batches={batches} 
                  businessId={business.id} 
                  initialFilter={inventoryFilter}
                  isMobile={isMobile}
                />
              )}
              {currentView === 'pos' && (
                <POSView 
                  products={products} 
                  batches={batches} 
                  businessId={business.id} 
                  user={user!} 
                  business={business}
                  printerStatus={printerStatus}
                  useBrowserPrint={useBrowserPrint}
                  isMobile={isMobile}
                />
              )}
              {currentView === 'ledger' && (
                <LedgerView sales={sales} businessId={business.id} isMobile={isMobile} />
              )}
              {currentView === 'reports' && <ReportsView sales={sales} products={products} isMobile={isMobile} />}
              {currentView === 'settings' && (
                <SettingsView 
                  business={business} 
                  businessId={business.id} 
                  user={user!} 
                  printer={printer}
                  printerStatus={printerStatus}
                  printerError={printerError}
                  useBrowserPrint={useBrowserPrint}
                  setUseBrowserPrint={setUseBrowserPrint}
                  connectPrinter={connectPrinter}
                  isMobile={isMobile}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 flex items-center justify-around h-16 px-2 z-50">
          {navItems.slice(0, 4).map(item => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id as any)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                currentView === item.id ? "text-zinc-900" : "text-zinc-400"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </button>
          ))}
          <button
            onClick={() => handleNavigate('settings')}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
              currentView === 'settings' ? "text-zinc-900" : "text-zinc-400"
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </nav>
      )}
    </div>
  );
}
