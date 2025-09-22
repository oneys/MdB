import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import axios from "axios";
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Progress } from "./components/ui/progress";
import { Textarea } from "./components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import AnalyticsPanel from "./components/AnalyticsPanel";
import { 
  Calculator, 
  Building2, 
  TrendingUp, 
  AlertTriangle, 
  Home, 
  Kanban, 
  Euro,
  Clock,
  Users,
  FileText,
  Target,
  Calendar,
  ArrowRight,
  Plus,
  Download,
  Upload,
  Edit,
  CheckCircle,
  Circle,
  AlertCircle,
  FolderOpen,
  DollarSign,
  Percent,
  Activity,
  Eye,
  ArrowLeft,
  LogOut,
  User,
  Settings,
  Shield,
  X,
  BarChart3
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = async () => {
    try {
      console.log("🔍 Vérification authentification...");
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      console.log("✅ Utilisateur authentifié:", response.data);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.log("❌ Utilisateur non authentifié:", error.response?.status);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = "/login";
    }
  };

  const authenticateWithSession = async (sessionId) => {
    try {
      console.log("🔍 Début authentification avec session ID:", sessionId);
      const formData = new FormData();
      formData.append('session_id', sessionId);
      
      console.log("🔍 Appel API /auth/session...");
      const response = await axios.post(`${API}/auth/session`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log("✅ Réponse API reçue:", response.data);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("❌ Erreur authentification session:", error);
      console.error("❌ Détails erreur:", error.response?.data);
      return false;
    }
  };

  useEffect(() => {
    console.log("🔍 Initialisation de l'application...");
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        loading, 
        logout, 
        authenticateWithSession,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Session Handler Component
const SessionHandler = ({ children }) => {
  const { authenticateWithSession, isAuthenticated } = useAuth();
  const [processing, setProcessing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionId = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch && !isAuthenticated && !processing) {
        setProcessing(true);
        const sessionId = sessionIdMatch[1];
        console.log("🔍 Session ID trouvé:", sessionId);
        
        const success = await authenticateWithSession(sessionId);
        if (success) {
          console.log("✅ Authentification réussie, redirection vers dashboard");
          // Clean URL fragment
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          navigate("/dashboard", { replace: true });
        } else {
          console.log("❌ Authentification échouée, redirection vers login");
          navigate("/login", { replace: true });
        }
        setProcessing(false);
      }
    };

    handleSessionId();
  }, [location, isAuthenticated, authenticateWithSession, processing, navigate]);

  if (processing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Authentification en cours...</p>
        </div>
      </div>
    );
  }

  return children;
};

// Login Component
const LoginPage = () => {
  const { isAuthenticated, checkAuth } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    console.log("🔍 URL de redirection:", redirectUrl);
    const oauthUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    console.log("🔍 URL OAuth complète:", oauthUrl);
    window.location.href = oauthUrl;
  };

  // Temporary dev session function
  const handleDevSession = async () => {
    try {
      const response = await axios.post(`${API}/auth/dev-session`, {}, { withCredentials: true });
      if (response.data.user) {
        // The backend sets the session cookie, so we just need to check auth
        await checkAuth();
        // The auth context will handle the redirect via the Navigate component above
      }
    } catch (error) {
      console.error('Dev session error:', error);
      console.error('Session de développement échouée. Vérifiez les logs backend.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Building2 className="h-12 w-12 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-2xl">MarchndsBiens</CardTitle>
            <CardDescription>
              Plateforme SaaS pour marchands de biens immobiliers
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Button 
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">ou</span>
              </div>
            </div>
            
            <Button 
              onClick={handleGoogleLogin}
              variant="outline" 
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#0078d4">
                <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zM1.636 12c0 5.732 4.632 10.364 10.364 10.364S22.364 17.732 22.364 12 17.732 1.636 12 1.636 1.636 6.268 1.636 12z"/>
                <path d="m12.005 6.545c1.396 0 2.65.496 3.613 1.459l2.707-2.707c-1.637-1.52-3.773-2.451-6.32-2.451-3.918 0-7.234 2.403-8.653 5.818l3.145 2.441c.739-2.197 2.777-3.787 5.205-3.787z"/>
              </svg>
              Continuer avec Microsoft
            </Button>

            {/* Temporary dev session button - remove in production */}
            <Button 
              onClick={handleDevSession}
              variant="outline" 
              className="w-full text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
            >
              🧪 Session Développement (Temporaire)
            </Button>
          </div>
          
          <div className="text-center text-xs text-slate-500">
            En vous connectant, vous acceptez nos conditions d'utilisation
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Advanced financial calculations
const FinancialCalculator = {
  calculateTRI: (project) => {
    const investissement = project.prix_achat_ttc + project.travaux_ttc + project.frais_agence_ttc;
    const benefice = project.prix_vente_ttc - investissement;
    
    if (investissement === 0) return 0;
    
    // Enhanced TRI calculation with risk factors
    let tri_base = benefice / investissement;
    
    // Department risk adjustment
    const deptRiskFactors = {
      '75': 0.95,   // Paris - lower risk
      '92': 0.96,   // Hauts-de-Seine
      '93': 1.05,   // Seine-Saint-Denis - higher risk
      '94': 1.02,   // Val-de-Marne
      '95': 1.03    // Val-d'Oise
    };
    
    const deptRisk = deptRiskFactors[project.address?.dept] || 1.0;
    
    // Renovation intensity risk
    let renovationRisk = 1.0;
    if (project.prix_achat_ttc > 0) {
      const renovationRatio = project.travaux_ttc / project.prix_achat_ttc;
      if (renovationRatio > 0.5) renovationRisk = 0.9;       // Heavy renovation
      else if (renovationRatio > 0.3) renovationRisk = 0.95; // Moderate renovation
    }
    
    const tri_adjusted = tri_base * deptRisk * renovationRisk;
    return Math.max(0, Math.min(1, tri_adjusted));
  },

  calculateMarge: (project) => {
    return project.prix_vente_ttc - project.prix_achat_ttc - project.travaux_ttc - project.frais_agence_ttc;
  },

  calculateMarketIndicators: (project) => {
    const dept = project.address?.dept || '75';
    const prixAchat = project.prix_achat_ttc || 0;
    const prixVente = project.prix_vente_ttc || 0;
    
    // Estimated surface based on department
    let estimatedSurface = 0;
    if (['75', '92'].includes(dept)) {
      estimatedSurface = prixAchat / 10000; // ~10k€/m² for Paris area
    } else {
      estimatedSurface = prixAchat / 6000;  // ~6k€/m² for other areas
    }
    
    return {
      estimatedSurface: Math.round(estimatedSurface * 10) / 10,
      prixM2Achat: estimatedSurface > 0 ? Math.round(prixAchat / estimatedSurface) : 0,
      prixM2Vente: estimatedSurface > 0 ? Math.round(prixVente / estimatedSurface) : 0,
      plusValueM2: estimatedSurface > 0 ? Math.round((prixVente - prixAchat) / estimatedSurface) : 0,
      liquidityScore: this.calculateLiquidityScore(dept, prixAchat)
    };
  },

  calculateLiquidityScore: (dept, prix) => {
    const baseScores = {
      '75': 8, '92': 7, '93': 5, '94': 6, '95': 6
    };
    let score = baseScores[dept] || 5;
    
    // Price range adjustments
    if (prix > 1500000) score -= 2;        // Luxury market
    else if (prix < 200000) score -= 1;    // Very low end
    else if (prix >= 300000 && prix <= 800000) score += 1; // Sweet spot
    
    return Math.max(1, Math.min(10, score));
  }
};

// Project state management utilities
const ProjectUtils = {
  createProject: (id, label, address, status, regime_tva, prix_achat_ttc, prix_vente_ttc, travaux_ttc, frais_agence_ttc, flags = {}) => {
    const baseProject = {
      id,
      label,
      address,
      status,
      regime_tva,
      prix_achat_ttc,
      prix_vente_ttc,
      travaux_ttc,
      frais_agence_ttc,
      flags,
      milestones: {},
      financing: {},
      owner_id: "test-user-12345",
      team_members: [],
      documents: [],
      tasks: [],
      events: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Calculate dynamic values
    baseProject.marge_estimee = FinancialCalculator.calculateMarge(baseProject);
    baseProject.tri_estime = FinancialCalculator.calculateTRI(baseProject);
    baseProject.market_indicators = FinancialCalculator.calculateMarketIndicators(baseProject);
    
    return baseProject;
  },

  updateProjectFinancials: (project, updates) => {
    const updatedProject = { ...project, ...updates, updated_at: new Date().toISOString() };
    
    // Recalculate dynamic values
    updatedProject.marge_estimee = FinancialCalculator.calculateMarge(updatedProject);
    updatedProject.tri_estime = FinancialCalculator.calculateTRI(updatedProject);
    updatedProject.market_indicators = FinancialCalculator.calculateMarketIndicators(updatedProject);
    
    return updatedProject;
  },

  validateProject: (projectData) => {
    const errors = [];
    
    if (!projectData.label || projectData.label.length < 3) {
      errors.push("Le nom du projet doit contenir au moins 3 caractères");
    }
    
    if (projectData.prix_achat_ttc <= 0) {
      errors.push("Le prix d'achat doit être supérieur à 0");
    }
    
    if (projectData.prix_vente_ttc <= projectData.prix_achat_ttc) {
      errors.push("Le prix de vente doit être supérieur au prix d'achat");
    }
    
    if (projectData.travaux_ttc < 0) {
      errors.push("Les travaux ne peuvent pas être négatifs");
    }
    
    if (projectData.frais_agence_ttc < 0) {
      errors.push("Les frais d'agence ne peuvent pas être négatifs");
    }
    
    // Business rules validation
    if (projectData.travaux_ttc > projectData.prix_achat_ttc * 2) {
      errors.push("Les travaux ne peuvent pas dépasser 200% du prix d'achat");
    }
    
    if (projectData.frais_agence_ttc > projectData.prix_achat_ttc * 0.15) {
      errors.push("Les frais d'agence ne peuvent pas dépasser 15% du prix d'achat");
    }
    
    return errors;
  },

  sortProjects: (projects, sortBy, sortOrder = 'desc') => {
    return [...projects].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'tri':
          aValue = a.tri_estime || 0;
          bValue = b.tri_estime || 0;
          break;
        case 'marge':
          aValue = a.marge_estimee || 0;
          bValue = b.marge_estimee || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
          break;
        case 'prix_achat':
          aValue = a.prix_achat_ttc || 0;
          bValue = b.prix_achat_ttc || 0;
          break;
        default:
          aValue = a.label || '';
          bValue = b.label || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  },

  filterProjects: (projects, filters) => {
    return projects.filter(project => {
      // Status filter
      if (filters.status && project.status !== filters.status) {
        return false;
      }
      
      // Department filter
      if (filters.dept && project.address?.dept !== filters.dept) {
        return false;
      }
      
      // Price range filter
      if (filters.minPrice && project.prix_achat_ttc < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && project.prix_achat_ttc > filters.maxPrice) {
        return false;
      }
      
      // TRI filter
      if (filters.minTRI && project.tri_estime < filters.minTRI) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesLabel = project.label?.toLowerCase().includes(searchLower);
        const matchesAddress = project.address?.city?.toLowerCase().includes(searchLower);
        if (!matchesLabel && !matchesAddress) {
          return false;
        }
      }
      
      return true;
    });
  }
};

const mockProjects = [
  createMockProject(
    "project_1",
    "Rénovation Appartement Montmartre", 
    { line1: "15 rue des Abbesses", city: "Paris", dept: "75" },
    "COMPROMIS",
    "MARGE",
    320000, 485000, 65000, 12000,
    { md_b_0715_ok: true, travaux_structurants: false }
  ),
  createMockProject(
    "project_2",
    "Maison Familiale Banlieue",
    { line1: "42 avenue du Général Leclerc", city: "Le Perreux-sur-Marne", dept: "94" },
    "DETECTE", 
    "NORMAL",
    425000, 580000, 85000, 15000,
    { md_b_0715_ok: false, travaux_structurants: true }
  )
];

const statusConfig = {
  DETECTE: { label: "Détecté", color: "bg-slate-500", order: 1 },
  OFFRE: { label: "Offre", color: "bg-blue-500", order: 2 },
  COMPROMIS: { label: "Compromis", color: "bg-yellow-500", order: 3 },
  ACTE: { label: "Acte", color: "bg-orange-500", order: 4 },
  TRAVAUX: { label: "Travaux", color: "bg-purple-500", order: 5 },
  COMMERCIALISATION: { label: "Commercialisation", color: "bg-indigo-500", order: 6 },
  REVENTE: { label: "Revente", color: "bg-green-500", order: 7 },
  CLOS: { label: "Clos", color: "bg-emerald-600", order: 8 }
};

// Navigation Component
const Navigation = ({ activeTab, setActiveTab, selectedProject, setSelectedProject, onNavigateFromProject }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleTabClick = (tab) => {
    // If coming from a project page, trigger auto-save
    if (selectedProject && onNavigateFromProject) {
      onNavigateFromProject();
    }
    setActiveTab(tab);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'OWNER': return 'bg-red-100 text-red-700';
      case 'PM': return 'bg-blue-100 text-blue-700';
      case 'ANALYSTE': return 'bg-green-100 text-green-700';
      case 'INVITE': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">MarchndsBiens</h1>
              <p className="text-sm text-slate-600">Plateforme SaaS Immobilier</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {selectedProject && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSelectedProject(null);
                  setActiveTab("dashboard");
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
            )}
            
            <Tabs value={activeTab} onValueChange={handleTabClick} className="w-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="pipeline" className="flex items-center gap-2">
                  <Kanban className="h-4 w-4" />
                  Pipeline
                </TabsTrigger>
                <TabsTrigger value="estimateur" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Estimateur
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  {user?.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <User className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                </div>
              </Button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        {user?.picture ? (
                          <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <User className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{user?.name}</div>
                        <div className="text-sm text-slate-500">{user?.email}</div>
                        <Badge className={`text-xs mt-1 ${getRoleColor(user?.role)}`}>
                          {user?.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      onClick={logout}
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Se déconnecter
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay to close menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </div>
  );
};

// Dashboard Component (unchanged structure but now shows user-specific data)
const Dashboard = ({ projects, onProjectSelect, onProjectCreate }) => {
  const { user } = useAuth();
  const [showCreateProject, setShowCreateProject] = useState(false);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };

  // Filter projects based on user role and access
  const getAccessibleProjects = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'OWNER':
        return projects; // Owner sees all projects
      case 'PM':
        return projects.filter(p => 
          p.owner_id === user.id || p.team_members?.includes(user.id)
        );
      case 'ANALYSTE':
      case 'INVITE':
        return projects.filter(p => p.team_members?.includes(user.id));
      default:
        return [];
    }
  };

  const accessibleProjects = getAccessibleProjects();
  
  // Calculate KPIs based on accessible projects
  const totalProjects = accessibleProjects.length;
  const totalMargeEstimee = accessibleProjects.reduce((sum, p) => sum + (p.marge_estimee || 0), 0);
  const avgTRI = totalProjects > 0 ? accessibleProjects.reduce((sum, p) => sum + (p.tri_estime || 0), 0) / totalProjects : 0;
  const activeProjects = accessibleProjects.filter(p => !['CLOS', 'REVENTE'].includes(p.status)).length;

  // Status distribution
  const statusCounts = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = accessibleProjects.filter(p => p.status === status).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-amber-50 to-emerald-50 rounded-lg p-6 border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Bienvenue, {user?.name} !
            </h2>
            <p className="text-slate-600">
              Vous avez accès à {totalProjects} projet{totalProjects > 1 ? 's' : ''} en tant que{' '}
              <Badge className={getRoleColor(user?.role)}>{user?.role}</Badge>
            </p>
          </div>
          {(['OWNER', 'PM'].includes(user?.role)) && (
            <Button 
              onClick={() => setShowCreateProject(true)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Projet
            </Button>
          )}
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="kpi-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Projets Accessibles</p>
                <p className="text-3xl font-bold text-slate-900">{totalProjects}</p>
                <p className="text-xs text-slate-500">{activeProjects} en cours</p>
              </div>
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Marge Estimée</p>
                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalMargeEstimee)}</p>
                <p className="text-xs text-emerald-600">+12% vs mois dernier</p>
              </div>
              <Euro className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">TRI Moyen</p>
                <p className="text-3xl font-bold text-amber-600">{formatPercent(avgTRI)}</p>
                <p className="text-xs text-slate-500">Objectif: 18%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">En Retard</p>
                <p className="text-3xl font-bold text-red-600">1</p>
                <p className="text-xs text-red-600">Alertes actives</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition des Projets</CardTitle>
          <CardDescription>Vue d'ensemble du pipeline par étape</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statusConfig).map(([status, config]) => (
              <div key={status} className="text-center">
                <div className={`w-16 h-16 rounded-full ${config.color} flex items-center justify-center mx-auto mb-2`}>
                  <span className="text-white font-bold text-lg">{statusCounts[status] || 0}</span>
                </div>
                <p className="text-sm font-medium text-slate-700">{config.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>Projets Récents</CardTitle>
          <CardDescription>Dernières activités sur vos opérations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accessibleProjects.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Aucun projet accessible</p>
                <p className="text-sm text-slate-400">Contactez votre administrateur pour obtenir des accès</p>
              </div>
            ) : (
              accessibleProjects.slice(0, 6).map((project) => (
                <div 
                  key={project.id} 
                  className="project-item flex items-center justify-between p-4 border border-slate-200 rounded-lg cursor-pointer"
                  onClick={() => onProjectSelect(project)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${statusConfig[project.status].color}`}></div>
                    <div>
                      <h4 className="font-medium text-slate-900">{project.label}</h4>
                      <p className="text-sm text-slate-600">{project.address.line1}, {project.address.city}</p>
                      {(user?.role === 'OWNER' || user?.role === 'PM') && (
                        <p className="text-xs text-slate-400">
                          Propriétaire: {project.owner_id === user?.id ? 'Vous' : 'Autre'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <Badge variant="secondary" className="text-xs">
                      {statusConfig[project.status].label}
                    </Badge>
                    <div className="text-right">
                      <p className="font-medium text-emerald-600">{formatCurrency(project.marge_estimee)}</p>
                      <p className="text-xs text-slate-500">TRI: {formatPercent(project.tri_estime)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de création de projet depuis Dashboard */}
      {showCreateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Nouveau Projet</h2>
            <ProjectCreateForm 
              onClose={() => setShowCreateProject(false)}
              onSubmit={(newProject) => {
                onProjectCreate(newProject);
                setShowCreateProject(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  function getRoleColor(role) {
    switch (role) {
      case 'OWNER': return 'bg-red-100 text-red-700';
      case 'PM': return 'bg-blue-100 text-blue-700';
      case 'ANALYSTE': return 'bg-green-100 text-green-700';
      case 'INVITE': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
};

// Composant d'édition de projet
const ProjectEditForm = ({ project, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    label: project.label || '',
    address: {
      line1: project.address?.line1 || '',
      city: project.address?.city || '',
      dept: project.address?.dept || '75'
    },
    regime_tva: project.regime_tva || 'MARGE',
    prix_achat_ttc: project.prix_achat_ttc || 0,
    prix_vente_ttc: project.prix_vente_ttc || 0,
    travaux_ttc: project.travaux_ttc || 0,
    frais_agence_ttc: project.frais_agence_ttc || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const updatedProject = {
      ...project,
      ...formData,
      marge_estimee: formData.prix_vente_ttc - formData.prix_achat_ttc - formData.travaux_ttc - formData.frais_agence_ttc,
      updated_at: new Date().toISOString()
    };

    onUpdate(updatedProject);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-project-name">Nom du projet</Label>
        <Input
          id="edit-project-name"
          value={formData.label}
          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-address">Adresse</Label>
          <Input
            id="edit-address"
            value={formData.address.line1}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, line1: e.target.value }
            }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-city">Ville</Label>
          <Input
            id="edit-city"
            value={formData.address.city}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, city: e.target.value }
            }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-dept">Département</Label>
          <Select 
            value={formData.address.dept} 
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, dept: value }
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="75">75 - Paris</SelectItem>
              <SelectItem value="92">92 - Hauts-de-Seine</SelectItem>
              <SelectItem value="93">93 - Seine-Saint-Denis</SelectItem>
              <SelectItem value="94">94 - Val-de-Marne</SelectItem>
              <SelectItem value="95">95 - Val-d'Oise</SelectItem>
              <SelectItem value="69">69 - Rhône</SelectItem>
              <SelectItem value="13">13 - Bouches-du-Rhône</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="edit-regime">Régime TVA</Label>
          <Select 
            value={formData.regime_tva} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, regime_tva: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MARGE">TVA sur marge</SelectItem>
              <SelectItem value="NORMAL">TVA normale</SelectItem>
              <SelectItem value="EXO">Exonération</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-prix-achat">Prix d'achat TTC</Label>
          <Input
            id="edit-prix-achat"
            type="number"
            value={formData.prix_achat_ttc}
            onChange={(e) => setFormData(prev => ({ ...prev, prix_achat_ttc: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label htmlFor="edit-prix-vente">Prix de vente TTC</Label>
          <Input
            id="edit-prix-vente"
            type="number"
            value={formData.prix_vente_ttc}
            onChange={(e) => setFormData(prev => ({ ...prev, prix_vente_ttc: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-travaux">Travaux TTC</Label>
          <Input
            id="edit-travaux"
            type="number"
            value={formData.travaux_ttc}
            onChange={(e) => setFormData(prev => ({ ...prev, travaux_ttc: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div>
          <Label htmlFor="edit-frais">Frais agence TTC</Label>
          <Input
            id="edit-frais"
            type="number"
            value={formData.frais_agence_ttc}
            onChange={(e) => setFormData(prev => ({ ...prev, frais_agence_ttc: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
          Sauvegarder
        </Button>
      </div>
    </form>
  );
};

// Composant de création de projet
const ProjectCreateForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    label: '',
    address: {
      line1: '',
      city: '',
      dept: '75'
    },
    regime_tva: 'MARGE',
    prix_achat_ttc: 0,
    prix_vente_ttc: 0,
    travaux_ttc: 0,
    frais_agence_ttc: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newProject = {
      id: `project_${Date.now()}`,
      ...formData,
      status: 'DETECTE',
      marge_estimee: formData.prix_vente_ttc - formData.prix_achat_ttc - formData.travaux_ttc - formData.frais_agence_ttc,
      tri_estime: 0.15,
      flags: {},
      milestones: {},
      financing: {},
      owner_id: 'current_user',
      team_members: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onSubmit(newProject);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="project-name">Nom du projet</Label>
        <Input
          id="project-name"
          value={formData.label}
          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
          placeholder="Ex: Rénovation Appartement Paris 11e"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            value={formData.address.line1}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, line1: e.target.value }
            }))}
            placeholder="123 rue de la Paix"
            required
          />
        </div>
        <div>
          <Label htmlFor="city">Ville</Label>
          <Input
            id="city"
            value={formData.address.city}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, city: e.target.value }
            }))}
            placeholder="Paris"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dept-create">Département</Label>
          <Select 
            value={formData.address.dept} 
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, dept: value }
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="75">75 - Paris</SelectItem>
              <SelectItem value="92">92 - Hauts-de-Seine</SelectItem>
              <SelectItem value="93">93 - Seine-Saint-Denis</SelectItem>
              <SelectItem value="94">94 - Val-de-Marne</SelectItem>
              <SelectItem value="95">95 - Val-d'Oise</SelectItem>
              <SelectItem value="69">69 - Rhône</SelectItem>
              <SelectItem value="13">13 - Bouches-du-Rhône</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="regime-create">Régime TVA</Label>
          <Select 
            value={formData.regime_tva} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, regime_tva: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MARGE">TVA sur marge</SelectItem>
              <SelectItem value="NORMAL">TVA normale</SelectItem>
              <SelectItem value="EXO">Exonération</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="prix-achat-create">Prix d'achat TTC</Label>
          <Input
            id="prix-achat-create"
            type="number"
            value={formData.prix_achat_ttc}
            onChange={(e) => setFormData(prev => ({ ...prev, prix_achat_ttc: parseFloat(e.target.value) || 0 }))}
            placeholder="300000"
          />
        </div>
        <div>
          <Label htmlFor="prix-vente-create">Prix de vente TTC</Label>
          <Input
            id="prix-vente-create"
            type="number"
            value={formData.prix_vente_ttc}
            onChange={(e) => setFormData(prev => ({ ...prev, prix_vente_ttc: parseFloat(e.target.value) || 0 }))}
            placeholder="520000"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
          Créer le projet
        </Button>
      </div>
    </form>
  );
};

// Duplicate ProjectEditForm component removed - using the one defined earlier

// Pipeline Component (with role-based access)
const Pipeline = ({ projects, onProjectSelect, onProjectUpdate, onProjectCreate }) => {
  const { user } = useAuth();
  const [localProjects, setLocalProjects] = useState(projects);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [draggedProjectId, setDraggedProjectId] = useState(null);
  const [mouseDownPos, setMouseDownPos] = useState(null);

  // Sync with parent projects when they change
  React.useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  // Filter projects based on user access
  const getAccessibleProjects = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'OWNER':
        return localProjects;
      case 'PM':
        return localProjects.filter(p => 
          p.owner_id === user.id || p.team_members?.includes(user.id)
        );
      case 'ANALYSTE':
      case 'INVITE':
        return localProjects.filter(p => p.team_members?.includes(user.id));
      default:
        return [];
    }
  };

  const accessibleProjects = getAccessibleProjects();

  const handleMouseDown = (e, projectId) => {
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setDraggedProjectId(null);
  };

  const handleDragStart = (e, projectId) => {
    // Only allow drag if user has write access
    if (user?.role === 'INVITE') {
      e.preventDefault();
      return;
    }
    
    setDraggedProjectId(projectId);
    e.dataTransfer.setData('text/plain', projectId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  const handleClick = (e, project) => {
    // Simple approach: only open if no drag occurred
    if (!draggedProjectId) {
      onProjectSelect(project);
    }
    
    // Reset drag state
    setDraggedProjectId(null);
    setMouseDownPos(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-amber-50', 'border-amber-300');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-amber-50', 'border-amber-300');
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-amber-50', 'border-amber-300');
    
    // Only allow drop if user has write access
    if (user?.role === 'INVITE') {
      return;
    }
    
    const projectId = e.dataTransfer.getData('text/plain');
    const draggedProject = localProjects.find(p => p.id === projectId);
    
    if (!draggedProject || draggedProject.status === newStatus) {
      return;
    }
    
    // Update local state and notify parent
    const updatedProject = { ...draggedProject, status: newStatus, updated_at: new Date().toISOString() };
    
    setLocalProjects(prev => 
      prev.map(project => 
        project.id === projectId ? updatedProject : project
      )
    );
    
    // Notify parent component to update global state
    onProjectUpdate(updatedProject);
    
    // Reset drag state
    setDraggedProjectId(null);
    setMouseDownPos(null);
    
    console.log(`📝 Projet "${draggedProject.label}" déplacé de ${draggedProject.status} vers ${newStatus}`);
  };

  const getProjectsByStatus = (status) => {
    return accessibleProjects.filter(project => project.status === status);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const canCreateProject = ['OWNER', 'PM'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pipeline des Projets</h2>
          <p className="text-slate-600">
            {user?.role === 'INVITE' ? 
              'Vue en lecture seule du pipeline' : 
              'Glissez-déposez les projets entre les étapes'
            }
          </p>
        </div>
        <div className="flex gap-4">
          {canCreateProject && (
            <Button 
              onClick={() => setShowCreateProject(true)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Projet
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => setShowAnalytics(true)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const statusProjects = getProjectsByStatus(status);
          
          return (
            <div 
              key={status}
              className="kanban-column flex-shrink-0 w-80 bg-slate-50 rounded-lg p-4 border-2 border-transparent transition-colors"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                  <h3 className="font-medium text-slate-900">{config.label}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {statusProjects.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {statusProjects.map((project) => (
                  <div
                    key={project.id}
                    draggable={user?.role !== 'INVITE'}
                    onMouseDown={(e) => handleMouseDown(e, project.id)}
                    onDragStart={(e) => handleDragStart(e, project.id)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => handleClick(e, project)}
                    className={`kanban-card bg-white rounded-lg p-4 shadow-sm border border-slate-200 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      user?.role === 'INVITE' ? 'cursor-default' : 'hover:scale-105'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-slate-900 text-sm leading-tight">
                        {project.label}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ml-2 ${
                          project.regime_tva === 'MARGE' ? 'border-amber-300 text-amber-700' :
                          project.regime_tva === 'NORMAL' ? 'border-blue-300 text-blue-700' :
                          'border-slate-300 text-slate-700'
                        }`}
                      >
                        {project.regime_tva}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-slate-600 mb-3">
                      {project.address.city} ({project.address.dept})
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Achat</span>
                        <span className="font-medium">{formatCurrency(project.prix_achat_ttc)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Vente cible</span>
                        <span className="font-medium">{formatCurrency(project.prix_vente_ttc)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-emerald-600">
                        <span>Marge</span>
                        <span>{formatCurrency(project.marge_estimee)}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {project.milestones.offre ? 
                            new Date(project.milestones.offre).toLocaleDateString('fr-FR') : 
                            'Pas de date'
                          }
                        </span>
                      </div>
                      {(user?.role === 'OWNER' || user?.role === 'PM') && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <User className="h-3 w-3" />
                          <span>{project.owner_id === user?.id ? 'Vous' : 'Autre'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {statusProjects.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Aucun projet dans cette étape
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de création de projet */}
      {showCreateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Nouveau Projet</h2>
            <ProjectCreateForm 
              onClose={() => setShowCreateProject(false)}
              onSubmit={(newProject) => {
                setLocalProjects(prev => [...prev, newProject]);
                onProjectCreate(newProject);
                setShowCreateProject(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal d'analytics */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Analytics & Graphiques</h2>
              <Button variant="ghost" onClick={() => setShowAnalytics(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AnalyticsPanel projects={localProjects} />
          </div>
        </div>
      )}
    </div>
  );
};

// Estimateur Component
const Estimateur = () => {
  const [formData, setFormData] = useState({
    dept: "75",
    regime_tva: "MARGE",
    prix_achat_ttc: 300000,
    prix_vente_ttc: 520000,
    travaux_ttc: 80000,
    frais_agence_ttc: 15000,
    hypotheses: {
      md_b_0715_ok: true,
      travaux_structurants: false
    }
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    if (field.startsWith('hypotheses.')) {
      const hypothesesField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        hypotheses: {
          ...prev.hypotheses,
          [hypothesesField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const runEstimate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API}/estimate/run`, formData, { withCredentials: true });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors du calcul");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercent = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Estimateur Fiscal</h2>
        <p className="text-slate-600">Calculez précisément vos marges et obligations fiscales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulaire d'entrée */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Paramètres du projet
            </CardTitle>
            <CardDescription>
              Saisissez les données de votre opération immobilière
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Localisation */}
            <div className="space-y-2">
              <Label htmlFor="dept">Département</Label>
              <Select value={formData.dept} onValueChange={(value) => handleInputChange('dept', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="75">75 - Paris</SelectItem>
                  <SelectItem value="92">92 - Hauts-de-Seine</SelectItem>
                  <SelectItem value="93">93 - Seine-Saint-Denis</SelectItem>
                  <SelectItem value="94">94 - Val-de-Marne</SelectItem>
                  <SelectItem value="95">95 - Val-d'Oise</SelectItem>
                  <SelectItem value="69">69 - Rhône</SelectItem>
                  <SelectItem value="13">13 - Bouches-du-Rhône</SelectItem>
                  <SelectItem value="33">33 - Gironde</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Régime TVA */}
            <div className="space-y-2">
              <Label htmlFor="regime_tva">Régime TVA</Label>
              <Select value={formData.regime_tva} onValueChange={(value) => handleInputChange('regime_tva', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARGE">TVA sur marge</SelectItem>
                  <SelectItem value="NORMAL">TVA normale</SelectItem>
                  <SelectItem value="EXO">Exonération</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Montants */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prix_achat">Prix d'achat TTC</Label>
                <Input
                  id="prix_achat"
                  type="number"
                  value={formData.prix_achat_ttc}
                  onChange={(e) => handleInputChange('prix_achat_ttc', parseFloat(e.target.value) || 0)}
                  placeholder="300000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prix_vente">Prix de vente TTC</Label>
                <Input
                  id="prix_vente"
                  type="number"
                  value={formData.prix_vente_ttc}
                  onChange={(e) => handleInputChange('prix_vente_ttc', parseFloat(e.target.value) || 0)}
                  placeholder="520000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="travaux">Travaux TTC</Label>
                <Input
                  id="travaux"
                  type="number"
                  value={formData.travaux_ttc}
                  onChange={(e) => handleInputChange('travaux_ttc', parseFloat(e.target.value) || 0)}
                  placeholder="80000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frais_agence">Frais agence TTC</Label>
                <Input
                  id="frais_agence"
                  type="number"
                  value={formData.frais_agence_ttc}
                  onChange={(e) => handleInputChange('frais_agence_ttc', parseFloat(e.target.value) || 0)}
                  placeholder="15000"
                />
              </div>
            </div>

            <Separator />

            {/* Hypothèses */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Hypothèses</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="md_b_eligible" className="text-sm">Éligible droits MdB 0,715%</Label>
                  <input
                    id="md_b_eligible"
                    type="checkbox"
                    checked={formData.hypotheses.md_b_0715_ok}
                    onChange={(e) => handleInputChange('hypotheses.md_b_0715_ok', e.target.checked)}
                    className="rounded border-slate-300"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="travaux_structurants" className="text-sm">Travaux structurants</Label>
                  <input
                    id="travaux_structurants"
                    type="checkbox"
                    checked={formData.hypotheses.travaux_structurants}
                    onChange={(e) => handleInputChange('hypotheses.travaux_structurants', e.target.checked)}
                    className="rounded border-slate-300"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={runEstimate} 
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? "Calcul en cours..." : "Calculer l'estimation"}
            </Button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Résultats */}
        {result && (
          <div className="space-y-6">
            {/* KPIs principaux */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Marge nette</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(result.marge_nette)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">TRI estimé</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {formatPercent(result.tri)}
                      </p>
                    </div>
                    <Calculator className="h-8 w-8 text-amber-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Détail des coûts */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des coûts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">DMTO</span>
                    <span className="font-medium">{formatCurrency(result.dmto)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Émoluments notaire</span>
                    <span className="font-medium">{formatCurrency(result.emoluments)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">CSI (0,1%)</span>
                    <span className="font-medium">{formatCurrency(result.csi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Débours</span>
                    <span className="font-medium">{formatCurrency(result.debours)}</span>
                  </div>
                  {result.tva_collectee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">TVA collectée</span>
                      <span className="font-medium">{formatCurrency(result.tva_collectee)}</span>
                    </div>
                  )}
                  {result.tva_marge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">TVA sur marge</span>
                      <span className="font-medium">{formatCurrency(result.tva_marge)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Marge brute</span>
                    <span>{formatCurrency(result.marge_brute)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Détail des calculs */}
            <Card>
              <CardHeader>
                <CardTitle>Détail des calculs</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {result.explain}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant Tâches interactif
const TasksPanel = ({ project, onProjectUpdate }) => {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Compromis de vente", status: "completed", due: "2025-01-15" },
    { id: 2, title: "Demande permis travaux", status: "in_progress", due: "2025-02-01" },
    { id: 3, title: "Devis entreprises", status: "pending", due: "2025-02-15" },
    { id: 4, title: "Début travaux", status: "pending", due: "2025-03-01" },
    { id: 5, title: "Fin travaux", status: "pending", due: "2025-06-01" }
  ]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const toggleTaskStatus = (taskId) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        return { ...task, status: newStatus };
      }
      return task;
    }));
  };

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask = {
        id: Date.now(),
        title: newTaskTitle,
        status: 'pending',
        due: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0] // +7 days
      };
      setTasks(prev => [...prev, newTask]);
      setNewTaskTitle('');
      setShowAddTask(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Tâches
        </CardTitle>
        <CardDescription>To-do et jalons du projet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => toggleTaskStatus(task.id)}
                className="cursor-pointer hover:scale-110 transition-transform"
              >
                {task.status === 'completed' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : task.status === 'in_progress' ? (
                  <Clock className="h-4 w-4 text-amber-500" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-300" />
                )}
              </button>
              <span className={`text-sm ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                {task.title}
              </span>
            </div>
            <span className="text-xs text-slate-500">{new Date(task.due).toLocaleDateString('fr-FR')}</span>
          </div>
        ))}
        
        {showAddTask ? (
          <div className="p-3 bg-white border-2 border-amber-200 rounded-lg">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Nouvelle tâche..."
              className="mb-2"
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addTask} className="bg-amber-600 hover:bg-amber-700">
                Ajouter
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                setShowAddTask(false);
                setNewTaskTitle('');
              }}>
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
            onClick={() => setShowAddTask(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une tâche
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Composant Dataroom pour gestion des documents
const DataroomPanel = ({ project }) => {
  const [files, setFiles] = useState(project.documents || []);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('JURIDIQUE');
  const fileInputRef = React.useRef(null);

  // Sync with project documents when project changes
  React.useEffect(() => {
    setFiles(project.documents || []);
  }, [project.documents]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    await uploadFiles(droppedFiles);
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    await uploadFiles(selectedFiles);
    e.target.value = ''; // Reset input
  };

  const uploadFiles = async (filesToUpload) => {
    setUploading(true);
    
    for (const file of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', selectedCategory);

        const response = await axios.post(
          `${API}/projects/${project.id}/documents`,
          formData,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data.document) {
          // Format document for display
          const formattedDoc = {
            ...response.data.document,
            type: response.data.document.category,
            size: `${(response.data.document.size / 1024 / 1024).toFixed(1)} MB`,
            date: new Date(response.data.document.uploaded_at).toISOString().split('T')[0]
          };
          setFiles(prev => [...prev, formattedDoc]);
          
          // Also update parent component if callback exists
          if (onProjectUpdate) {
            // Trigger project refresh to sync documents
            window.location.reload(); // Force refresh for now to ensure sync
          }
        }
      } catch (error) {
        console.error('Upload error:', error);
        console.error(`Erreur lors de l'upload de ${file.name}: ${error.response?.data?.detail || error.message}`);
      }
    }
    
    setUploading(false);
  };

  const downloadFile = async (document) => {
    try {
      console.log(`Downloading document: ${document.filename} (ID: ${document.id})`);
      
      const response = await axios.get(
        `${API}/projects/${project.id}/documents/${document.id}/download`,
        {
          withCredentials: true,
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new window.Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.filename || `document_${document.id}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Download successful: ${document.filename}`);
    } catch (error) {
      console.error('Download error:', error);
      if (error.response?.status === 404) {
        alert(`Document non trouvé: ${document.filename}`);
      } else {
        alert(`Erreur lors du téléchargement de ${document.filename}: ${error.response?.data?.detail || error.message}`);
      }
    }
  };

  const deleteFile = async (document) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${document.filename} ?`)) {
      return;
    }

    try {
      await axios.delete(
        `${API}/projects/${project.id}/documents/${document.id}`,
        { withCredentials: true }
      );

      setFiles(prev => prev.filter(f => f.id !== document.id));
    } catch (error) {
      console.error('Delete error:', error);
      console.error(`Erreur lors de la suppression: ${error.response?.data?.detail || error.message}`);
    }
  };

  const exportPDF = async (type) => {
    try {
      setUploading(true); // Use uploading state for export feedback
      
      const response = await axios.get(
        `${API}/projects/${project.id}/export/${type}`,
        {
          withCredentials: true,
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new window.Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dossier_${type}_${project.label.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Export ${type} réussi`);
    } catch (error) {
      console.error('Export error:', error);
      console.error(`Erreur lors de l'export ${type}: ${error.response?.data?.detail || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const getCategoryColor = (type) => {
    switch (type) {
      case 'JURIDIQUE': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'TECHNIQUE': return 'bg-green-100 text-green-700 border-green-300';
      case 'FINANCIER': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'ADMINISTRATIF': return 'bg-slate-100 text-slate-700 border-slate-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getCategoryIcon = (type) => {
    switch (type) {
      case 'JURIDIQUE': return <FileText className="h-4 w-4" />;
      case 'TECHNIQUE': return <Calculator className="h-4 w-4" />;
      case 'FINANCIER': return <Euro className="h-4 w-4" />;
      case 'ADMINISTRATIF': return <Upload className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Zone de drop */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragOver 
            ? 'border-amber-400 bg-amber-50' 
            : 'border-slate-300 bg-slate-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {uploading ? 'Upload en cours...' : 'Glissez-déposez vos documents ici'}
            </h3>
            <p className="text-slate-500 mb-4">
              Ou cliquez pour sélectionner des fichiers
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-4">
              <Label htmlFor="category-select" className="text-sm font-medium">Catégorie :</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 mx-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JURIDIQUE">📋 Juridique</SelectItem>
                  <SelectItem value="TECHNIQUE">🔧 Technique</SelectItem>
                  <SelectItem value="FINANCIER">💰 Financier</SelectItem>
                  <SelectItem value="ADMINISTRATIF">📄 Administratif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            />
            
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Upload en cours...' : 'Choisir des fichiers'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organisation par catégories */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {['JURIDIQUE', 'TECHNIQUE', 'FINANCIER', 'ADMINISTRATIF'].map(category => {
          const categoryFiles = files.filter(f => f.category === category);
          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {getCategoryIcon(category)}
                  {category}
                  <Badge variant="secondary" className="ml-auto">
                    {categoryFiles.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {categoryFiles.map(file => (
                    <div key={file.id} className="p-2 bg-slate-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 truncate" title={file.filename}>
                            {file.filename}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(file.size)} • {new Date(file.uploaded_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => downloadFile(file)}
                            title="Télécharger"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            onClick={() => deleteFile(file)}
                            title="Supprimer"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {categoryFiles.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">
                      Aucun document
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions d'export */}
      <Card>
        <CardHeader>
          <CardTitle>Export & Génération</CardTitle>
          <CardDescription>Créer les dossiers pour partenaires</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => exportPDF('bank')}
              disabled={uploading}
            >
              <Download className="h-4 w-4 mr-2" />
              Dossier Banque PDF
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => exportPDF('notary')}
              disabled={uploading}
            >
              <Download className="h-4 w-4 mr-2" />
              Dossier Notaire PDF
            </Button>
            <Button variant="outline" disabled>
              <Upload className="h-4 w-4 mr-2" />
              Archive ZIP (bientôt)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Fiche Projet Simplifiée (pour l'instant)
const FicheProjet = ({ project, onBack, onProjectUpdate }) => {
  const [showEditProject, setShowEditProject] = useState(false);
  const [activeProjectTab, setActiveProjectTab] = useState('overview');
  const [projectEvents, setProjectEvents] = useState([
    {
      id: 1,
      type: "project_created",
      description: "Projet créé",
      user: "Test User - Dev",
      timestamp: project.created_at || new Date().toISOString(),
      icon: <Plus className="h-4 w-4 text-slate-500" />
    }
  ]);

  const addEvent = (type, description) => {
    const newEvent = {
      id: Date.now(),
      type,
      description,
      user: "Test User - Dev",
      timestamp: new Date().toISOString(),
      icon: type === 'status_change' ? <ArrowRight className="h-4 w-4 text-blue-500" /> :
            type === 'budget_update' ? <Euro className="h-4 w-4 text-amber-500" /> :
            type === 'document_upload' ? <Upload className="h-4 w-4 text-green-500" /> :
            <Edit className="h-4 w-4 text-slate-500" />
    };
    setProjectEvents(prev => [newEvent, ...prev]);
  };

  const handleProjectEdit = (updatedProject) => {
    addEvent('project_update', `Projet modifié : ${updatedProject.label}`);
    onProjectUpdate && onProjectUpdate(updatedProject);
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-emerald-50 border-none">
        <CardContent className="pt-8 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.label}</h1>
              <p className="text-lg text-slate-600">{project.address.line1}, {project.address.city}</p>
              <div className="flex items-center gap-4 mt-2">
                <Badge className="bg-amber-100 text-amber-700 border-transparent">
                  {project.status}
                </Badge>
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  {project.regime_tva}
                </Badge>
              </div>
            </div>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-1">
                {formatCurrency(project.marge_estimee)}
              </div>
              <div className="text-sm text-slate-600">Marge Estimée</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600 mb-1">
                {formatPercent(project.tri_estime)}
              </div>
              <div className="text-sm text-slate-600">TRI Estimé</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {formatCurrency(project.prix_achat_ttc)}
              </div>
              <div className="text-sm text-slate-600">Prix d'Achat</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {formatCurrency(project.prix_vente_ttc)}
              </div>
              <div className="text-sm text-slate-600">Prix de Vente</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détails du projet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations Financières</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Prix d'achat TTC</span>
                <span className="font-medium">{formatCurrency(project.prix_achat_ttc)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Travaux TTC</span>
                <span className="font-medium">{formatCurrency(project.travaux_ttc)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Frais agence TTC</span>
                <span className="font-medium">{formatCurrency(project.frais_agence_ttc)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Prix de vente cible</span>
                <span className="text-emerald-600">{formatCurrency(project.prix_vente_ttc)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Marge estimée</span>
                <span className="text-emerald-600">{formatCurrency(project.marge_estimee)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jalons du Projet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(project.milestones || {}).map(([milestone, date]) => (
                <div key={milestone} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {date ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300" />
                    )}
                    <span className="capitalize">{milestone.replace('_', ' ')}</span>
                  </div>
                  <span className="text-sm text-slate-500">
                    {date ? new Date(date).toLocaleDateString('fr-FR') : 'À prévoir'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation par onglets */}
      <div className="mb-6">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'budget', 'tasks', 'dataroom', 'journal'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveProjectTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeProjectTab === tab
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab === 'overview' && 'Vue d\'ensemble'}
                {tab === 'budget' && 'Budget & Écarts'}
                {tab === 'tasks' && 'Tâches'}
                {tab === 'dataroom' && 'Dataroom'}
                {tab === 'journal' && 'Journal'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeProjectTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations Financières</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Prix d'achat TTC</span>
                  <span className="font-medium">{formatCurrency(project.prix_achat_ttc)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Travaux TTC</span>
                  <span className="font-medium">{formatCurrency(project.travaux_ttc)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Frais agence TTC</span>
                  <span className="font-medium">{formatCurrency(project.frais_agence_ttc)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Prix de vente cible</span>
                  <span className="text-emerald-600">{formatCurrency(project.prix_vente_ttc)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Marge estimée</span>
                  <span className="text-emerald-600">{formatCurrency(project.marge_estimee)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jalons du Projet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(project.milestones || {}).map(([milestone, date]) => (
                  <div key={milestone} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {date ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300" />
                      )}
                      <span className="capitalize">{milestone.replace('_', ' ')}</span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {date ? new Date(date).toLocaleDateString('fr-FR') : 'À prévoir'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeProjectTab === 'budget' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Budget & Écarts */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Budget & Écarts
            </CardTitle>
            <CardDescription>Suivi des coûts prévisionnels vs réels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-slate-600 border-b pb-2">
                <div>Poste</div>
                <div className="text-right">Prévu HT</div>
                <div className="text-right">Réel HT</div>
                <div className="text-right">Écart</div>
              </div>
              
              {/* Acquisition */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="font-medium">Prix d'achat</div>
                <div className="text-right">{formatCurrency(project.prix_achat_ttc / 1.20)}</div>
                <div className="text-right text-slate-400">En cours</div>
                <div className="text-right text-slate-400">-</div>
              </div>
              
              {/* Travaux */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="font-medium">Travaux</div>
                <div className="text-right">{formatCurrency(project.travaux_ttc / 1.20)}</div>
                <div className="text-right text-amber-600">{formatCurrency(project.travaux_ttc / 1.20 * 1.15)}</div>
                <div className="text-right text-red-600">+{formatPercent(0.15)}</div>
              </div>
              
              {/* Frais agence */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="font-medium">Frais agence</div>
                <div className="text-right">{formatCurrency(project.frais_agence_ttc / 1.20)}</div>
                <div className="text-right text-green-600">{formatCurrency(project.frais_agence_ttc / 1.20 * 0.95)}</div>
                <div className="text-right text-green-600">-{formatPercent(0.05)}</div>
              </div>
              
              <Separator />
              
              {/* Total */}
              <div className="grid grid-cols-4 gap-4 text-sm font-semibold">
                <div>Total HT</div>
                <div className="text-right">{formatCurrency((project.prix_achat_ttc + project.travaux_ttc + project.frais_agence_ttc) / 1.20)}</div>
                <div className="text-right text-amber-600">{formatCurrency((project.prix_achat_ttc + project.travaux_ttc * 1.15 + project.frais_agence_ttc * 0.95) / 1.20)}</div>
                <div className="text-right text-amber-600">+{formatPercent(0.08)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tâches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Tâches
            </CardTitle>
            <CardDescription>To-do et jalons du projet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: 1, title: "Compromis de vente", status: "completed", due: "2025-01-15" },
              { id: 2, title: "Demande permis travaux", status: "in_progress", due: "2025-02-01" },
              { id: 3, title: "Devis entreprises", status: "pending", due: "2025-02-15" },
              { id: 4, title: "Début travaux", status: "pending", due: "2025-03-01" },
              { id: 5, title: "Fin travaux", status: "pending", due: "2025-06-01" }
            ].map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {task.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : task.status === 'in_progress' ? (
                    <Clock className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-300" />
                  )}
                  <span className={`text-sm ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                    {task.title}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{new Date(task.due).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full mt-3">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une tâche
            </Button>
          </CardContent>
        </Card>
      </div>
      )}

      {activeProjectTab === 'tasks' && (
        <TasksPanel project={project} onProjectUpdate={onProjectUpdate} />
      )}

      {activeProjectTab === 'dataroom' && (
        <DataroomPanel project={project} />
      )}

      {activeProjectTab === 'journal' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Journal d'événements
            </CardTitle>
            <CardDescription>Historique complet des modifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    {event.icon}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-slate-900">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <User className="h-3 w-3" />
                      <span>{event.user}</span>
                      <span>•</span>
                      <span>{new Date(event.timestamp).toLocaleDateString('fr-FR')} à {new Date(event.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Download className="h-4 w-4 mr-2" />
              Dossier Banque
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Dossier Notaire
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowEditProject(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier le projet
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Modal d'édition de projet */}
      {showEditProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Modifier le projet</h2>
            <ProjectEditForm 
              project={project}
              onClose={() => setShowEditProject(false)}
              onUpdate={(updatedProject) => {
                handleProjectEdit(updatedProject);
                setShowEditProject(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
const MainApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [projects, setProjects] = useState(mockProjects);
  const [selectedProject, setSelectedProject] = useState(null);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setActiveTab("project");
  };

  const handleProjectUpdate = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
  };

  const handleProjectCreate = (newProject) => {
    setProjects(prev => [...prev, newProject]);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        onNavigateFromProject={() => {
          // Auto-save when navigating away from project
          if (selectedProject) {
            console.log(`🔄 Auto-sauvegarde du projet: ${selectedProject.label}`);
            // Here you would typically save to backend
            // await saveProjectToBackend(selectedProject);
          }
          setSelectedProject(null);
        }}
      />
      
      <div className="max-w-7xl mx-auto p-6">
        {selectedProject ? (
          <FicheProjet 
            project={selectedProject} 
            onBack={() => {
              setSelectedProject(null);
              setActiveTab("dashboard");
            }}
            onProjectUpdate={handleProjectUpdate}
          />
        ) : (
          <>
            {activeTab === "dashboard" && (
              <Dashboard 
                projects={projects} 
                onProjectSelect={handleProjectSelect}
                onProjectCreate={handleProjectCreate}
              />
            )}
            {activeTab === "pipeline" && (
              <Pipeline 
                projects={projects} 
                onProjectSelect={handleProjectSelect}
                onProjectUpdate={handleProjectUpdate}
                onProjectCreate={handleProjectCreate}
              />
            )}
            {activeTab === "estimateur" && <Estimateur />}
          </>
        )}
      </div>
    </div>
  );
};

// App Root Component
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionHandler>
          <Routes>
            {/* Marketing Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            
            {/* App Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/app" 
              element={
                <ProtectedRoute>
                  <MainApp />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={<Navigate to="/app" replace />} 
            />
          </Routes>
        </SessionHandler>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;