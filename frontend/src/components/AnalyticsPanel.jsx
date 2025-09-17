import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  Euro, 
  Building2, 
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

const AnalyticsPanel = ({ projects }) => {
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

  // Calculs des métriques
  const totalProjects = projects.length;
  const totalInvestment = projects.reduce((sum, p) => sum + (p.prix_achat_ttc || 0), 0);
  const totalRevenue = projects.reduce((sum, p) => sum + (p.prix_vente_ttc || 0), 0);
  const totalMargin = projects.reduce((sum, p) => sum + (p.marge_estimee || 0), 0);
  const avgTRI = totalProjects > 0 ? projects.reduce((sum, p) => sum + (p.tri_estime || 0), 0) / totalProjects : 0;

  // Répartition par statut
  const statusConfig = {
    DETECTE: { label: "Détecté", color: "bg-slate-500" },
    OFFRE: { label: "Offre", color: "bg-blue-500" },
    COMPROMIS: { label: "Compromis", color: "bg-yellow-500" },
    ACTE: { label: "Acte", color: "bg-orange-500" },
    TRAVAUX: { label: "Travaux", color: "bg-purple-500" },
    COMMERCIALISATION: { label: "Commercialisation", color: "bg-indigo-500" },
    REVENTE: { label: "Revente", color: "bg-green-500" },
    CLOS: { label: "Clos", color: "bg-emerald-600" }
  };

  const statusDistribution = Object.keys(statusConfig).map(status => ({
    status,
    count: projects.filter(p => p.status === status).length,
    ...statusConfig[status]
  }));

  // Répartition par département
  const deptDistribution = projects.reduce((acc, project) => {
    const dept = project.address?.dept || 'Inconnu';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  // Évolution temporelle (simulation)
  const monthlyData = [
    { month: 'Jan', projects: 2, margin: 180000 },
    { month: 'Fév', projects: 1, margin: 95000 },
    { month: 'Mar', projects: 3, margin: 275000 },
    { month: 'Avr', projects: 2, margin: 160000 },
    { month: 'Mai', projects: 4, margin: 320000 },
    { month: 'Juin', projects: 3, margin: 240000 }
  ];

  return (
    <div className="space-y-6">
      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Projets</p>
                <p className="text-3xl font-bold text-slate-900">{totalProjects}</p>
              </div>
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Investissement Total</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalInvestment)}</p>
              </div>
              <Euro className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">TRI Moyen</p>
                <p className="text-2xl font-bold text-amber-600">{formatPercent(avgTRI)}</p>
              </div>
              <Activity className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par statut */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Répartition par Statut
            </CardTitle>
            <CardDescription>Distribution des projets par étape</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusDistribution.map(({ status, count, label, color }) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={totalProjects > 0 ? (count / totalProjects) * 100 : 0} 
                      className="w-20 h-2" 
                    />
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Répartition géographique */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Répartition Géographique
            </CardTitle>
            <CardDescription>Projets par département</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(deptDistribution).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm font-medium">Département {dept}</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={totalProjects > 0 ? (count / totalProjects) * 100 : 0} 
                      className="w-20 h-2" 
                    />
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Évolution temporelle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Évolution Mensuelle
          </CardTitle>
          <CardDescription>Nombre de projets et marges par mois</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            {monthlyData.map((data, index) => (
              <div key={index} className="text-center">
                <div className="bg-slate-100 rounded-lg p-4 mb-2">
                  <div className="text-2xl font-bold text-slate-900">{data.projects}</div>
                  <div className="text-xs text-slate-600">projets</div>
                </div>
                <div className="text-xs font-medium text-slate-700">{data.month}</div>
                <div className="text-xs text-emerald-600">{formatCurrency(data.margin)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métriques de performance */}
      <Card>
        <CardHeader>
          <CardTitle>Métriques de Performance</CardTitle>
          <CardDescription>Indicateurs clés de rentabilité</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {formatCurrency(totalMargin)}
              </div>
              <div className="text-sm text-slate-600">Marge Totale Estimée</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {totalProjects > 0 ? formatCurrency(totalMargin / totalProjects) : formatCurrency(0)}
              </div>
              <div className="text-sm text-slate-600">Marge Moyenne par Projet</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600 mb-2">
                {totalInvestment > 0 ? formatPercent(totalMargin / totalInvestment) : '0%'}
              </div>
              <div className="text-sm text-slate-600">Taux de Marge Global</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPanel;