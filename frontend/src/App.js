import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
  ArrowLeft
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mock data for demo
const mockProjects = [
  {
    id: "proj_001",
    label: "Rénovation Rue Mozart",
    address: { line1: "12 Rue Mozart", city: "Paris", insee: "75116", dept: "75" },
    status: "COMPROMIS",
    regime_tva: "MARGE",
    prix_achat_ttc: 320000,
    prix_vente_ttc: 550000,
    travaux_ttc: 85000,
    frais_agence_ttc: 16000,
    marge_estimee: 95000,
    tri_estime: 0.22,
    milestones: {
      offre: "2025-08-15",
      compromis: "2025-09-02",
      acte_achat: "2025-10-15",
      fin_travaux: null,
      commercialisation: null,
      revente: null
    },
    financing: {
      pret_montant: 240000,
      pret_taux: 0.045,
      pret_duree: 180,
      apport_personnel: 80000
    },
    flags: {
      md_b_0715_ok: true,
      travaux_structurants: true
    },
    created_at: "2025-08-01T10:00:00Z"
  },
  {
    id: "proj_002", 
    label: "Appartement Haussmannien",
    address: { line1: "45 Avenue Victor Hugo", city: "Paris", insee: "75116", dept: "75" },
    status: "TRAVAUX",
    regime_tva: "MARGE", 
    prix_achat_ttc: 480000,
    prix_vente_ttc: 720000,
    travaux_ttc: 120000,
    frais_agence_ttc: 24000,
    marge_estimee: 88000,
    tri_estime: 0.18,
    milestones: {
      offre: "2025-07-10",
      compromis: "2025-07-25", 
      acte_achat: "2025-08-30",
      fin_travaux: "2025-11-30",
      commercialisation: null,
      revente: null
    },
    financing: {
      pret_montant: 360000,
      pret_taux: 0.042,
      pret_duree: 240,
      apport_personnel: 120000
    },
    flags: {
      md_b_0715_ok: true,
      travaux_structurants: false
    },
    created_at: "2025-07-01T14:00:00Z"
  },
  {
    id: "proj_003",
    label: "Maison Familiale Vincennes", 
    address: { line1: "23 Rue de la République", city: "Vincennes", insee: "94300", dept: "94" },
    status: "COMMERCIALISATION",
    regime_tva: "NORMAL",
    prix_achat_ttc: 420000,
    prix_vente_ttc: 580000,
    travaux_ttc: 45000,
    frais_agence_ttc: 21000,
    marge_estimee: 82000,
    tri_estime: 0.19,
    milestones: {
      offre: "2025-06-01",
      compromis: "2025-06-15",
      acte_achat: "2025-07-20",
      fin_travaux: "2025-09-15",
      commercialisation: "2025-09-20",
      revente: null
    },
    financing: {
      pret_montant: 315000,
      pret_taux: 0.038,
      pret_duree: 180,
      apport_personnel: 105000
    },
    flags: {
      md_b_0715_ok: false,
      travaux_structurants: false
    },
    created_at: "2025-05-15T09:00:00Z"
  },
  {
    id: "proj_004",
    label: "Studio Étudiant",
    address: { line1: "8 Rue des Écoles", city: "Lyon", insee: "69005", dept: "69" },
    status: "REVENTE",
    regime_tva: "EXO",
    prix_achat_ttc: 180000,
    prix_vente_ttc: 220000,
    travaux_ttc: 15000,
    frais_agence_ttc: 9000,
    marge_estimee: 12000,
    tri_estime: 0.08,
    milestones: {
      offre: "2025-04-10",
      compromis: "2025-04-25",
      acte_achat: "2025-05-30",
      fin_travaux: "2025-07-15",
      commercialisation: "2025-07-20",
      revente: "2025-09-25"
    },
    financing: {
      pret_montant: 135000,
      pret_taux: 0.04,
      pret_duree: 120,
      apport_personnel: 45000
    },
    flags: {
      md_b_0715_ok: false,
      travaux_structurants: false
    },
    created_at: "2025-04-01T11:00:00Z"
  },
  {
    id: "proj_005",
    label: "Loft Industriel",
    address: { line1: "34 Rue de la Gare", city: "Marseille", insee: "13001", dept: "13" },
    status: "OFFRE",
    regime_tva: "MARGE",
    prix_achat_ttc: 280000,
    prix_vente_ttc: 420000,
    travaux_ttc: 70000,
    frais_agence_ttc: 14000,
    marge_estimee: 48000,
    tri_estime: 0.15,
    milestones: {
      offre: "2025-09-10",
      compromis: null,
      acte_achat: null,
      fin_travaux: null,
      commercialisation: null,
      revente: null
    },
    financing: {
      pret_montant: 210000,
      pret_taux: 0.046,
      pret_duree: 180,
      apport_personnel: 70000
    },
    flags: {
      md_b_0715_ok: true,
      travaux_structurants: true
    },
    created_at: "2025-09-05T16:00:00Z"
  },
  {
    id: "proj_006",
    label: "Duplex Centre-ville",
    address: { line1: "67 Place Bellecour", city: "Lyon", insee: "69002", dept: "69" },
    status: "DETECTE",
    regime_tva: "MARGE",
    prix_achat_ttc: 380000,
    prix_vente_ttc: 520000,
    travaux_ttc: 60000,
    frais_agence_ttc: 19000,
    marge_estimee: 55000,
    tri_estime: 0.14,
    milestones: {
      offre: null,
      compromis: null,
      acte_achat: null,
      fin_travaux: null,
      commercialisation: null,
      revente: null
    },
    financing: {
      pret_montant: 285000,
      pret_taux: 0.043,
      pret_duree: 180,
      apport_personnel: 95000
    },
    flags: {
      md_b_0715_ok: true,
      travaux_structurants: false
    },
    created_at: "2025-09-08T12:00:00Z"
  }
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
const Navigation = ({ activeTab, setActiveTab, selectedProject, setSelectedProject }) => {
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
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
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
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ projects, onProjectSelect }) => {
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

  // Calculate KPIs
  const totalProjects = projects.length;
  const totalMargeEstimee = projects.reduce((sum, p) => sum + (p.marge_estimee || 0), 0);
  const avgTRI = projects.reduce((sum, p) => sum + (p.tri_estime || 0), 0) / totalProjects;
  const activeProjects = projects.filter(p => !['CLOS', 'REVENTE'].includes(p.status)).length;

  // Status distribution
  const statusCounts = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = projects.filter(p => p.status === status).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="kpi-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Projets Total</p>
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
                <p className="text-3xl font-bold text-red-600">2</p>
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
            {projects.slice(0, 6).map((project) => (
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Pipeline Kanban Component
const Pipeline = ({ projects, onProjectSelect }) => {
  const [localProjects, setLocalProjects] = useState(projects);

  const handleDragStart = (e, projectId) => {
    e.dataTransfer.setData('text/plain', projectId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('text/plain');
    
    setLocalProjects(prev => 
      prev.map(project => 
        project.id === projectId 
          ? { ...project, status: newStatus }
          : project
      )
    );
  };

  const getProjectsByStatus = (status) => {
    return localProjects.filter(project => project.status === status);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pipeline des Projets</h2>
          <p className="text-slate-600">Glissez-déposez les projets entre les étapes</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Projet
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const statusProjects = getProjectsByStatus(status);
          
          return (
            <div 
              key={status}
              className="kanban-column flex-shrink-0 w-80 bg-slate-50 rounded-lg p-4"
              onDragOver={handleDragOver}
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
                    draggable
                    onDragStart={(e) => handleDragStart(e, project.id)}
                    onClick={() => onProjectSelect(project)}
                    className="kanban-card bg-white rounded-lg p-4 shadow-sm border border-slate-200 cursor-pointer"
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
    </div>
  );
};

// Fiche Projet Component
const FicheProjet = ({ project, onBack }) => {
  const [activePanel, setActivePanel] = useState("apercu");
  const [tasks, setTasks] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [files, setFiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", description: "", due_date: "" });
  const [newBudgetItem, setNewBudgetItem] = useState({ 
    category: "", 
    description: "", 
    montant_prevu_ht: 0 
  });

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

  const calculateBudgetEcarts = () => {
    const prevuTotal = budgetItems.reduce((sum, item) => sum + item.montant_prevu_ht, 0);
    const reelTotal = budgetItems.reduce((sum, item) => sum + item.montant_reel_ht, 0);
    const ecart = reelTotal - prevuTotal;
    const ecartPercent = prevuTotal > 0 ? ecart / prevuTotal : 0;
    return { prevuTotal, reelTotal, ecart, ecartPercent };
  };

  const addTask = async () => {
    if (!newTask.title) return;
    
    try {
      const response = await axios.post(`${API}/projects/${project.id}/tasks`, newTask);
      setTasks([...tasks, response.data]);
      setNewTask({ title: "", description: "", due_date: "" });
    } catch (error) {
      console.error("Erreur lors de l'ajout de la tâche:", error);
    }
  };

  const addBudgetItem = async () => {
    if (!newBudgetItem.category || !newBudgetItem.description) return;
    
    try {
      const response = await axios.post(`${API}/projects/${project.id}/budget`, newBudgetItem);
      setBudgetItems([...budgetItems, response.data]);
      setNewBudgetItem({ category: "", description: "", montant_prevu_ht: 0 });
    } catch (error) {
      console.error("Erreur lors de l'ajout du poste budgétaire:", error);
    }
  };

  const exportPDF = async (type) => {
    try {
      const response = await axios.get(`${API}/projects/${project.id}/export/${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `dossier_${type}_${project.label.replace(/\s+/g, '_')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Erreur lors de l'export ${type}:`, error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header KPIs XXL */}
      <Card className="bg-gradient-to-r from-amber-50 to-emerald-50 border-none">
        <CardContent className="pt-8 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.label}</h1>
              <p className="text-lg text-slate-600">{project.address.line1}, {project.address.city}</p>
              <div className="flex items-center gap-4 mt-2">
                <Badge 
                  variant="outline" 
                  className={`${statusConfig[project.status].color} text-white border-transparent`}
                >
                  {statusConfig[project.status].label}
                </Badge>
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  {project.regime_tva}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => exportPDF('bank')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Dossier Banque
              </Button>
              <Button onClick={() => exportPDF('notaire')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Dossier Notaire
              </Button>
            </div>
          </div>

          {/* KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-1">
                {formatCurrency(project.marge_estimee)}
              </div>
              <div className="text-sm text-slate-600">Marge Nette</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600 mb-1">
                {formatPercent(project.tri_estime)}
              </div>
              <div className="text-sm text-slate-600">TRI Estimé</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {project.milestones.acte_achat ? 
                  new Date(project.milestones.acte_achat).toLocaleDateString('fr-FR') : 
                  'À prévoir'
                }
              </div>
              <div className="text-sm text-slate-600">Date Acte</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                +5%
              </div>
              <div className="text-sm text-slate-600">Δ Budget</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-600 mb-1">
                65%
              </div>
              <div className="text-sm text-slate-600">Avancement</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panneaux */}
      <Tabs value={activePanel} onValueChange={setActivePanel}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="apercu">Aperçu</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="taches">Tâches</TabsTrigger>
          <TabsTrigger value="dataroom">Dataroom</TabsTrigger>
          <TabsTrigger value="financement">Financement</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
        </TabsList>

        <TabsContent value="apercu" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations Générales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Prix d'achat TTC</Label>
                      <div className="font-medium text-lg">{formatCurrency(project.prix_achat_ttc)}</div>
                    </div>
                    <div>
                      <Label>Prix de vente TTC</Label>
                      <div className="font-medium text-lg">{formatCurrency(project.prix_vente_ttc)}</div>
                    </div>
                    <div>
                      <Label>Travaux TTC</Label>
                      <div className="font-medium text-lg">{formatCurrency(project.travaux_ttc)}</div>
                    </div>
                    <div>
                      <Label>Frais agence TTC</Label>
                      <div className="font-medium text-lg">{formatCurrency(project.frais_agence_ttc)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jalons */}
            <Card>
              <CardHeader>
                <CardTitle>Jalons du Projet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(project.milestones).map(([milestone, date]) => (
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
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KPIs Budget */}
            <Card>
              <CardHeader>
                <CardTitle>Synthèse Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(calculateBudgetEcarts().prevuTotal)}
                    </div>
                    <div className="text-sm text-slate-600">Budget Prévu</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(calculateBudgetEcarts().reelTotal)}
                    </div>
                    <div className="text-sm text-slate-600">Réalisé</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      calculateBudgetEcarts().ecart > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {calculateBudgetEcarts().ecart > 0 ? '+' : ''}{formatCurrency(calculateBudgetEcarts().ecart)}
                    </div>
                    <div className="text-sm text-slate-600">Écart</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ajouter poste budgétaire */}
            <Card>
              <CardHeader>
                <CardTitle>Nouveau Poste</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Catégorie</Label>
                    <Select 
                      value={newBudgetItem.category} 
                      onValueChange={(value) => setNewBudgetItem({...newBudgetItem, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gros oeuvre">Gros œuvre</SelectItem>
                        <SelectItem value="Second oeuvre">Second œuvre</SelectItem>
                        <SelectItem value="Finitions">Finitions</SelectItem>
                        <SelectItem value="Équipements">Équipements</SelectItem>
                        <SelectItem value="Divers">Divers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input 
                      value={newBudgetItem.description}
                      onChange={(e) => setNewBudgetItem({...newBudgetItem, description: e.target.value})}
                      placeholder="Description du poste"
                    />
                  </div>
                  <div>
                    <Label>Montant HT</Label>
                    <Input 
                      type="number"
                      value={newBudgetItem.montant_prevu_ht}
                      onChange={(e) => setNewBudgetItem({...newBudgetItem, montant_prevu_ht: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  <Button onClick={addBudgetItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Liste des postes budgétaires */}
            <Card>
              <CardHeader>
                <CardTitle>Postes Budgétaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {budgetItems.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">Aucun poste budgétaire</p>
                  ) : (
                    budgetItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 border border-slate-200 rounded">
                        <div>
                          <div className="font-medium">{item.description}</div>
                          <div className="text-sm text-slate-600">{item.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(item.montant_prevu_ht)}</div>
                          <div className="text-sm text-slate-500">HT</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="taches" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ajouter tâche */}
            <Card>
              <CardHeader>
                <CardTitle>Nouvelle Tâche</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Titre</Label>
                    <Input 
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      placeholder="Titre de la tâche"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea 
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      placeholder="Description détaillée"
                    />
                  </div>
                  <div>
                    <Label>Date d'échéance</Label>
                    <Input 
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                    />
                  </div>
                  <Button onClick={addTask} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter Tâche
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Liste des tâches */}
            <Card>
              <CardHeader>
                <CardTitle>Tâches du Projet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">Aucune tâche créée</p>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded">
                        {task.status === 'TERMINE' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : task.status === 'EN_RETARD' ? (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-slate-600">{task.description}</div>
                          )}
                          {task.due_date && (
                            <div className="text-xs text-slate-500">
                              Échéance: {new Date(task.due_date).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dataroom" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Fichier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Glissez-déposez vos fichiers ici</p>
                    <p className="text-sm text-slate-500">ou cliquez pour sélectionner</p>
                  </div>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JURIDIQUE">Juridique</SelectItem>
                      <SelectItem value="TECHNIQUE">Technique</SelectItem>
                      <SelectItem value="FINANCIER">Financier</SelectItem>
                      <SelectItem value="ADMINISTRATIF">Administratif</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Arborescence */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Documents du Projet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['JURIDIQUE', 'TECHNIQUE', 'FINANCIER', 'ADMINISTRATIF'].map((category) => (
                    <div key={category} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FolderOpen className="h-5 w-5 text-amber-600" />
                        <span className="font-medium">{category}</span>
                        <Badge variant="outline" className="ml-auto">0</Badge>
                      </div>
                      <div className="text-sm text-slate-500 text-center py-4">
                        Aucun fichier dans cette catégorie
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations de financement */}
            <Card>
              <CardHeader>
                <CardTitle>Détails du Financement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Montant du prêt</Label>
                      <div className="font-medium text-lg">
                        {formatCurrency(project.financing?.pret_montant || 0)}
                      </div>
                    </div>
                    <div>
                      <Label>Taux d'intérêt</Label>
                      <div className="font-medium text-lg">
                        {formatPercent(project.financing?.pret_taux || 0)}
                      </div>
                    </div>
                    <div>
                      <Label>Durée (mois)</Label>
                      <div className="font-medium text-lg">
                        {project.financing?.pret_duree || 0} mois
                      </div>
                    </div>
                    <div>
                      <Label>Apport personnel</Label>
                      <div className="font-medium text-lg">
                        {formatCurrency(project.financing?.apport_personnel || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Simulation */}
            <Card>
              <CardHeader>
                <CardTitle>Simulation Échéancier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {project.financing?.pret_montant && project.financing?.pret_taux ? 
                        formatCurrency(
                          (project.financing.pret_montant * project.financing.pret_taux / 12) / 
                          (1 - Math.pow(1 + project.financing.pret_taux / 12, -project.financing.pret_duree))
                        ) : 
                        'N/A'
                      }
                    </div>
                    <div className="text-sm text-slate-600">Mensualité estimée</div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Capital emprunté</span>
                      <span>{formatCurrency(project.financing?.pret_montant || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Intérêts totaux</span>
                      <span>
                        {project.financing?.pret_montant && project.financing?.pret_taux && project.financing?.pret_duree ? 
                          formatCurrency(
                            ((project.financing.pret_montant * project.financing.pret_taux / 12) / 
                            (1 - Math.pow(1 + project.financing.pret_taux / 12, -project.financing.pret_duree))) * 
                            project.financing.pret_duree - project.financing.pret_montant
                          ) : 
                          'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Coût total</span>
                      <span>
                        {project.financing?.pret_montant && project.financing?.pret_taux && project.financing?.pret_duree ? 
                          formatCurrency(
                            ((project.financing.pret_montant * project.financing.pret_taux / 12) / 
                            (1 - Math.pow(1 + project.financing.pret_taux / 12, -project.financing.pret_duree))) * 
                            project.financing.pret_duree
                          ) : 
                          'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="journal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Journal des Événements</CardTitle>
              <CardDescription>Historique complet des activités du projet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Aucun événement enregistré</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="font-medium">{event.description}</div>
                        <div className="text-sm text-slate-600">{event.event_type}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(event.timestamp).toLocaleString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Estimateur Component (unchanged from previous)
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
      const response = await axios.post(`${API}/estimate/run`, formData);
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

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [projects] = useState(mockProjects);
  const [selectedProject, setSelectedProject] = useState(null);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setActiveTab("project");
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
        />
        
        <div className="max-w-7xl mx-auto p-6">
          {selectedProject ? (
            <FicheProjet 
              project={selectedProject} 
              onBack={() => {
                setSelectedProject(null);
                setActiveTab("dashboard");
              }}
            />
          ) : (
            <>
              {activeTab === "dashboard" && <Dashboard projects={projects} onProjectSelect={handleProjectSelect} />}
              {activeTab === "pipeline" && <Pipeline projects={projects} onProjectSelect={handleProjectSelect} />}
              {activeTab === "estimateur" && <Estimateur />}
            </>
          )}
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;