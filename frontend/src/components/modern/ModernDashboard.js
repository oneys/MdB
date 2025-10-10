import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign,
  Building,
  Calendar,
  Users,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  BarChart3
} from 'lucide-react';

const ModernDashboard = ({ projects, onProjectSelect }) => {
  // Calculate metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => 
    !['VENDU', 'ABANDONNE', 'CLOS'].includes(p.status)
  ).length;
  
  const soldProjects = projects.filter(p => 
    ['VENDU', 'CLOS'].includes(p.status)
  ).length;
  
  const totalMargin = projects.reduce((sum, p) => {
    const margin = (p.prix_vente_ttc || 0) - (p.prix_achat_ttc || 0) - (p.travaux_ttc || 0) - (p.frais_agence_ttc || 0);
    return sum + margin;
  }, 0);

  const avgTRI = projects.length > 0 
    ? projects.reduce((sum, p) => sum + (p.tri_estimated || 12), 0) / projects.length 
    : 0;

  // Status distribution for donut chart
  const statusCounts = projects.reduce((acc, project) => {
    const status = project.status || 'DETECTE';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusConfig = {
    DETECTE: { label: 'Détecté', color: 'bg-slate-500', percentage: 0 },
    OFFRE: { label: 'Offre', color: 'bg-blue-500', percentage: 0 },
    SOUS_COMPROMIS: { label: 'Sous compromis', color: 'bg-amber-500', percentage: 0 },
    ACTE_SIGNE: { label: 'Acte signé', color: 'bg-green-500', percentage: 0 },
    TRAVAUX: { label: 'Travaux', color: 'bg-purple-500', percentage: 0 },
    COMMERCIALISATION: { label: 'Commercialisation', color: 'bg-indigo-500', percentage: 0 },
    VENDU: { label: 'Vendu', color: 'bg-emerald-500', percentage: 0 },
    ABANDONNE: { label: 'Abandonné', color: 'bg-red-500', percentage: 0 },
  };

  // Calculate percentages
  Object.keys(statusCounts).forEach(status => {
    if (statusConfig[status]) {
      statusConfig[status].percentage = ((statusCounts[status] / totalProjects) * 100).toFixed(1);
    }
  });

  const formatEuro = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const recentProjects = projects
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 5);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Vue d'ensemble de votre activité</p>
          </div>
          <div className="flex items-center space-x-3">
            <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent">
              <option>30 derniers jours</option>
              <option>90 derniers jours</option>
              <option>Année en cours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Projects */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-3 rounded-xl">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12%
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{totalProjects}+</p>
            <p className="text-slate-600 font-medium">Projets Totaux</p>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              +8%
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{activeProjects}+</p>
            <p className="text-slate-600 font-medium">Projets Actifs</p>
          </div>
        </div>

        {/* Sold Projects */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              +15%
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{soldProjects}+</p>
            <p className="text-slate-600 font-medium">Projets Vendus</p>
          </div>
        </div>

        {/* TRI Average */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-3 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              +2.3%
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{avgTRI.toFixed(1)}%</p>
            <p className="text-slate-600 font-medium">TRI Moyen</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Évolution des marges</h3>
              <p className="text-slate-600 text-sm">6 derniers mois</p>
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-lg">
              <MoreHorizontal className="h-5 w-5 text-slate-400" />
            </button>
          </div>
          
          <div className="mb-4">
            <span className="text-2xl font-bold text-slate-900">{formatEuro(totalMargin)}</span>
            <div className="flex items-center mt-1">
              <ArrowUpRight className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600 text-sm font-medium">+12.5%</span>
              <span className="text-slate-500 text-sm ml-2">vs mois précédent</span>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="h-64 relative">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Grid Lines */}
              {[0, 1, 2, 3, 4].map(i => (
                <line key={i} x1="0" y1={40 + i * 30} x2="380" y2={40 + i * 30} 
                      stroke="#e2e8f0" strokeWidth="1" />
              ))}
              
              {/* Gradient */}
              <defs>
                <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
                </linearGradient>
              </defs>
              
              {/* Chart Line */}
              <path 
                d="M40,160 Q90,140 140,120 T240,100 T340,80" 
                fill="none" 
                stroke="url(#lineGradient)" 
                strokeWidth="3"
              />
              
              {/* Fill Area */}
              <path 
                d="M40,160 Q90,140 140,120 T240,100 T340,80 L340,180 L40,180 Z" 
                fill="url(#revenueGradient)"
              />
              
              {/* Data Points */}
              {[{x: 40, y: 160}, {x: 140, y: 120}, {x: 240, y: 100}, {x: 340, y: 80}].map((point, i) => (
                <circle key={i} cx={point.x} cy={point.y} r="4" fill="#8b5cf6" />
              ))}
              
              {/* Months Labels */}
              <text x="40" y="195" textAnchor="middle" className="text-xs fill-slate-500">Nov</text>
              <text x="140" y="195" textAnchor="middle" className="text-xs fill-slate-500">Jan</text>
              <text x="240" y="195" textAnchor="middle" className="text-xs fill-slate-500">Mar</text>
              <text x="340" y="195" textAnchor="middle" className="text-xs fill-slate-500">Oct</text>
            </svg>
            
            {/* Gradient for line */}
            <svg className="absolute inset-0 pointer-events-none">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6"/>
                  <stop offset="100%" stopColor="#3b82f6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Répartition des projets</h3>
              <p className="text-slate-600 text-sm">Par statut</p>
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-lg">
              <MoreHorizontal className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          {/* Donut Chart */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {/* Background circle */}
                <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                
                {/* Active projects arc */}
                <circle 
                  cx="100" 
                  cy="100" 
                  r="80" 
                  fill="none" 
                  stroke="url(#donutGradient)" 
                  strokeWidth="20"
                  strokeDasharray={`${(activeProjects / totalProjects) * 502.65} 502.65`}
                  strokeDashoffset="125.66"
                  transform="rotate(-90 100 100)"
                  className="transition-all duration-1000"
                />
                
                {/* Sold projects arc */}
                <circle 
                  cx="100" 
                  cy="100" 
                  r="80" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="20"
                  strokeDasharray={`${(soldProjects / totalProjects) * 502.65} 502.65`}
                  strokeDashoffset={`${125.66 - (activeProjects / totalProjects) * 502.65}`}
                  transform="rotate(-90 100 100)"
                />
                
                {/* Gradient */}
                <defs>
                  <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6"/>
                    <stop offset="100%" stopColor="#3b82f6"/>
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">{((activeProjects / totalProjects) * 100).toFixed(0)}%</div>
                  <div className="text-sm text-slate-600">Projets actifs</div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            {Object.entries(statusConfig)
              .filter(([status]) => statusCounts[status] > 0)
              .slice(0, 4)
              .map(([status, config]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                  <span className="text-sm font-medium text-slate-700">{config.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600">{statusCounts[status]}</span>
                  <span className="text-xs text-slate-500">({config.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Projets récents</h3>
              <p className="text-slate-600 text-sm">Dernières activités</p>
            </div>
            <button className="text-violet-600 hover:text-violet-700 font-medium text-sm">
              Voir tout
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Projet</th>
                <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Statut</th>
                <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Prix d'achat</th>
                <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Marge estimée</th>
                <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">TRI</th>
                <th className="text-left py-3 px-6 font-medium text-slate-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentProjects.map((project, index) => {
                const margin = (project.prix_vente_ttc || 0) - (project.prix_achat_ttc || 0) - (project.travaux_ttc || 0) - (project.frais_agence_ttc || 0);
                const statusInfo = statusConfig[project.status] || statusConfig.DETECTE;
                
                return (
                  <tr key={project.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onProjectSelect(project)}>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-slate-900">{project.label}</div>
                        <div className="text-sm text-slate-500">
                          {typeof project.address === 'string' 
                            ? project.address 
                            : project.address?.line1 || 'Adresse non renseignée'
                          }
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === 'VENDU' ? 'bg-emerald-100 text-emerald-800' :
                        project.status === 'ABANDONNE' ? 'bg-red-100 text-red-800' :
                        'bg-violet-100 text-violet-800'
                      }`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900">
                      {formatEuro(project.prix_achat_ttc || 0)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`font-medium ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatEuro(margin)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <span className="font-medium text-slate-900">{(project.tri_estimated || 12).toFixed(1)}%</span>
                        {(project.tri_estimated || 12) > 15 ? (
                          <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button className="text-violet-600 hover:text-violet-800 font-medium text-sm">
                        Voir détail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;