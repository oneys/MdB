import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Building, 
  MapPin,
  Euro,
  TrendingUp,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

const ModernProjectsGrid = ({ 
  projects, 
  onProjectSelect, 
  onProjectCreate, 
  onProjectUpdate, 
  onProjectDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('updated_at'); // updated_at, status, budget, marge
  const [showFilters, setShowFilters] = useState(false);

  const statusConfig = {
    DETECTE: { label: 'Détecté', color: 'bg-slate-500', textColor: 'text-slate-700', bgColor: 'bg-slate-100' },
    OFFRE: { label: 'Offre', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-100' },
    SOUS_COMPROMIS: { label: 'Sous compromis', color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-100' },
    ACTE_SIGNE: { label: 'Acte signé', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-100' },
    TRAVAUX: { label: 'Travaux', color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-100' },
    COMMERCIALISATION: { label: 'Commercialisation', color: 'bg-indigo-500', textColor: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    VENDU: { label: 'Vendu', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-100' },
    ABANDONNE: { label: 'Abandonné', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-100' }
  };

  const formatEuro = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof project.address === 'string' ? project.address : project.address?.line1 || '')
        .toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'ALL' || project.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'status':
        return (a.status || '').localeCompare(b.status || '');
      case 'budget':
        return (b.prix_achat_ttc || 0) - (a.prix_achat_ttc || 0);
      case 'marge':
        const margeA = (a.prix_vente_ttc || 0) - (a.prix_achat_ttc || 0) - (a.travaux_ttc || 0) - (a.frais_agence_ttc || 0);
        const margeB = (b.prix_vente_ttc || 0) - (b.prix_achat_ttc || 0) - (b.travaux_ttc || 0) - (b.frais_agence_ttc || 0);
        return margeB - margeA;
      case 'updated_at':
      default:
        return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
    }
  });

  // Group by status for status view
  const groupedByStatus = sortedProjects.reduce((acc, project) => {
    const status = project.status || 'DETECTE';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(project);
    return acc;
  }, {});

  const ProjectCard = ({ project }) => {
    const margin = (project.prix_vente_ttc || 0) - (project.prix_achat_ttc || 0) - (project.travaux_ttc || 0) - (project.frais_agence_ttc || 0);
    const address = typeof project.address === 'string' ? project.address : project.address?.line1 || 'Adresse non renseignée';
    const statusInfo = statusConfig[project.status] || statusConfig.DETECTE;
    
    // Get main photo from project images
    const mainPhoto = project.images && project.images.length > 0 
      ? project.images[0] 
      : null;

    const handleEdit = (e) => {
      e.stopPropagation();
      onProjectUpdate && onProjectUpdate(project);
    };

    const handleDelete = async (e) => {
      e.stopPropagation();
      
      const firstConfirm = window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.label}" ?`);
      if (firstConfirm) {
        const secondConfirm = window.confirm(`ATTENTION : Cette action est irréversible ! Confirmez-vous la suppression définitive de "${project.label}" ?`);
        if (secondConfirm) {
          try {
            await onProjectDelete(project.id);
            
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50';
            notification.innerHTML = `✅ Projet "${project.label}" supprimé avec succès`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
              if (document.body.contains(notification)) {
                document.body.removeChild(notification);
              }
            }, 3000);
          } catch (error) {
            console.error('Erreur suppression:', error);
            alert('❌ Erreur lors de la suppression');
          }
        }
      }
    };

    return (
      <div
        onClick={() => onProjectSelect(project)}
        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
      >
        {/* Photo Banner */}
        <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
          {mainPhoto ? (
            <img 
              src={mainPhoto} 
              alt={project.label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building className="h-16 w-16 text-slate-300" />
            </div>
          )}
          
          {/* Status Badge Overlay */}
          <div className={`absolute top-3 left-3`}>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor} backdrop-blur-sm bg-opacity-90`}>
              <span className={`w-2 h-2 rounded-full ${statusInfo.color} mr-2`}></span>
              {statusInfo.label}
            </span>
          </div>

          {/* Action buttons */}
          <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
            title="Modifier le projet"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
            title="Supprimer le projet"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <h3 className="font-bold text-lg text-slate-900 mb-2 pr-20 group-hover:text-violet-600 transition-colors">
              {project.label}
            </h3>
            <div className="flex items-start space-x-2 text-slate-600">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{address}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
              <span className={`w-2 h-2 rounded-full ${statusInfo.color} mr-2`}></span>
              {statusInfo.label}
            </span>
          </div>

          {/* Financial Metrics */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Prix d'achat</span>
              </div>
              <span className="font-semibold text-slate-900">
                {formatEuro(project.prix_achat_ttc || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Euro className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-600">Prix de vente</span>
              </div>
              <span className="font-semibold text-slate-900">
                {formatEuro(project.prix_vente_ttc || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-100">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-medium text-violet-700">Marge nette</span>
              </div>
              <span className={`font-bold ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatEuro(margin)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center space-x-2 text-slate-500">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">{formatDate(project.updated_at || project.created_at)}</span>
            </div>
            
            <button className="flex items-center space-x-1 text-violet-600 hover:text-violet-700 font-medium text-sm">
              <Eye className="h-4 w-4" />
              <span>Voir détail</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Projets</h1>
            <p className="text-slate-600 mt-1">Vue d'ensemble de tous vos projets immobiliers</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onProjectCreate}
              className="flex items-center space-x-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Nouveau projet</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
            >
              <option value="ALL">Tous les statuts</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
            >
              <option value="updated_at">Plus récents</option>
              <option value="status">Par statut</option>
              <option value="budget">Par budget</option>
              <option value="marge">Par marge</option>
            </select>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-violet-50 border-violet-300 text-violet-700' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="font-medium">Filtres</span>
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Budget minimum
                  </label>
                  <input
                    type="number"
                    placeholder="0 €"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Budget maximum
                  </label>
                  <input
                    type="number"
                    placeholder="1 000 000 €"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Régime TVA
                  </label>
                  <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="">Tous</option>
                    <option value="MARGE">TVA sur marge</option>
                    <option value="NORMAL">TVA normale</option>
                    <option value="EXO">Exonération</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-slate-900">{sortedProjects.length}</div>
          <div className="text-sm text-slate-600">Projets affichés</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-violet-600">{projects.length}</div>
          <div className="text-sm text-slate-600">Total projets</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-green-600">
            {projects.filter(p => p.status === 'VENDU').length}
          </div>
          <div className="text-sm text-slate-600">Vendus</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-blue-600">
            {projects.filter(p => !['VENDU', 'ABANDONNE'].includes(p.status)).length}
          </div>
          <div className="text-sm text-slate-600">En cours</div>
        </div>
      </div>

      {/* Projects Grid - Grouped by Status */}
      {sortBy === 'status' ? (
        <div className="space-y-8">
          {Object.entries(groupedByStatus).map(([status, statusProjects]) => {
            const config = statusConfig[status];
            return (
              <div key={status}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-4 h-4 rounded-full ${config.color}`}></div>
                  <h2 className="text-xl font-bold text-slate-900">{config.label}</h2>
                  <span className="text-slate-500">({statusProjects.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statusProjects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Regular Grid View - 4 columns
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {sortedProjects.length === 0 && (
        <div className="text-center py-16">
          <Building className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">
            Aucun projet trouvé
          </h3>
          <p className="text-slate-500 mb-6">
            {searchTerm || selectedStatus !== 'ALL' 
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Commencez par créer votre premier projet'}
          </p>
          {!searchTerm && selectedStatus === 'ALL' && (
            <button
              onClick={onProjectCreate}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Créer un projet</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ModernProjectsGrid;
