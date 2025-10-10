import React, { useState } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Building, 
  DollarSign, 
  TrendingUp,
  Filter,
  Search,
  ArrowUpRight
} from 'lucide-react';

const ModernPipeline = ({ projects, onProjectSelect, onProjectStatusUpdate, onProjectCreate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedProject, setDraggedProject] = useState(null);

  const statusConfig = {
    DETECTE: { 
      label: 'Détecté', 
      color: 'bg-slate-500', 
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700'
    },
    OFFRE: { 
      label: 'Offre', 
      color: 'bg-blue-500', 
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    },
    SOUS_COMPROMIS: { 
      label: 'Sous compromis', 
      color: 'bg-amber-500', 
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-700'
    },
    ACTE_SIGNE: { 
      label: 'Acte signé', 
      color: 'bg-green-500', 
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700'
    },
    TRAVAUX: { 
      label: 'Travaux', 
      color: 'bg-purple-500', 
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700'
    },
    COMMERCIALISATION: { 
      label: 'Commercialisation', 
      color: 'bg-indigo-500', 
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700'
    },
    VENDU: { 
      label: 'Vendu', 
      color: 'bg-emerald-500', 
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700'
    },
    ABANDONNE: { 
      label: 'Abandonné', 
      color: 'bg-red-500', 
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700'
    }
  };

  const columns = [
    'DETECTE',
    'OFFRE', 
    'SOUS_COMPROMIS',
    'ACTE_SIGNE',
    'TRAVAUX',
    'COMMERCIALISATION',
    'VENDU',
    'ABANDONNE'
  ];

  const filteredProjects = projects.filter(project => 
    project.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof project.address === 'string' ? project.address : project.address?.line1 || '')
      .toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProjectsByStatus = (status) => {
    return filteredProjects.filter(project => project.status === status);
  };

  const formatEuro = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleDragStart = (e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    
    if (draggedProject && draggedProject.status !== newStatus) {
      console.log(`🔄 Moving project "${draggedProject.label}" from ${draggedProject.status} to ${newStatus}`);
      
      if (onProjectStatusUpdate) {
        await onProjectStatusUpdate(draggedProject.id, newStatus);
      }
    }
    
    setDraggedProject(null);
  };

  const ProjectCard = ({ project }) => {
    const margin = (project.prix_vente_ttc || 0) - (project.prix_achat_ttc || 0) - (project.travaux_ttc || 0) - (project.frais_agence_ttc || 0);
    const address = typeof project.address === 'string' ? project.address : project.address?.line1 || 'Adresse non renseignée';

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, project)}
        onClick={() => onProjectSelect(project)}
        className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-slate-900 text-sm leading-tight pr-2 group-hover:text-violet-600 transition-colors">
            {project.label}
          </h3>
          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded transition-all">
            <MoreVertical className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Address */}
        <p className="text-xs text-slate-500 mb-3 truncate">
          {address}
        </p>

        {/* Metrics */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Prix d'achat</span>
            <span className="text-xs font-medium text-slate-900">
              {formatEuro(project.prix_achat_ttc || 0)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Marge estimée</span>
            <span className={`text-xs font-semibold ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatEuro(margin)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1">
            <Building className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-500">{project.regime_tva}</span>
          </div>
          
          <div className="flex items-center space-x-1 text-violet-600">
            <span className="text-xs font-medium">Détails</span>
            <ArrowUpRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    );
  };

  const KanbanColumn = ({ status, projects }) => {
    const config = statusConfig[status];
    const projectCount = projects.length;

    return (
      <div className="flex-1 min-w-80">
        {/* Column Header */}
        <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 mb-4`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
              <h2 className={`font-semibold ${config.textColor}`}>{config.label}</h2>
            </div>
            <span className={`px-2 py-1 text-xs font-medium ${config.textColor} bg-white rounded-full`}>
              {projectCount}
            </span>
          </div>
          
          {status === 'DETECTE' && (
            <button
              onClick={onProjectCreate}
              className="flex items-center space-x-2 text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau projet</span>
            </button>
          )}
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
          className="space-y-3 min-h-96 p-2 rounded-xl transition-colors"
          style={{
            backgroundColor: draggedProject && draggedProject.status !== status ? config.bgColor : 'transparent'
          }}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}

          {projects.length === 0 && (
            <div className="text-center py-8">
              <div className="text-slate-400 text-sm">Aucun projet</div>
              {status === 'DETECTE' && (
                <button
                  onClick={onProjectCreate}
                  className="mt-2 text-violet-600 hover:text-violet-700 text-sm font-medium"
                >
                  Créer le premier projet
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Pipeline</h1>
            <p className="text-slate-600 mt-1">Vue Kanban de vos projets immobiliers</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Filter */}
            <button className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-white transition-colors">
              <Filter className="h-4 w-4 text-slate-600" />
              <span className="text-slate-600 font-medium">Filtres</span>
            </button>

            {/* New Project */}
            <button
              onClick={onProjectCreate}
              className="flex items-center space-x-2 px-6 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau projet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-8">
        <div className="flex space-x-6 min-w-max">
          {columns.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              projects={getProjectsByStatus(status)}
            />
          ))}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-slate-900">{filteredProjects.length}</div>
          <div className="text-sm text-slate-600">Total projets</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-green-600">{getProjectsByStatus('VENDU').length}</div>
          <div className="text-sm text-slate-600">Vendus</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-blue-600">
            {getProjectsByStatus('SOUS_COMPROMIS').length + getProjectsByStatus('ACTE_SIGNE').length}
          </div>
          <div className="text-sm text-slate-600">En cours</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-violet-600">
            {Math.round(filteredProjects.reduce((sum, p) => {
              const margin = (p.prix_vente_ttc || 0) - (p.prix_achat_ttc || 0) - (p.travaux_ttc || 0) - (p.frais_agence_ttc || 0);
              return sum + margin;
            }, 0) / 1000)}k€
          </div>
          <div className="text-sm text-slate-600">Marge totale</div>
        </div>
      </div>
    </div>
  );
};

export default ModernPipeline;