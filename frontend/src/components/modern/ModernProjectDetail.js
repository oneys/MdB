import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Camera,
  Upload,
  FileText,
  BarChart3,
  Edit,
  ExternalLink,
  Target,
  Building,
  Percent
} from 'lucide-react';

const ModernProjectDetail = ({ project, onBack, onProjectUpdate, onProjectStatusUpdate }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock images for demonstration
  const projectImages = [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=400&fit=crop'
  ];

  // Calculate metrics
  const margin = (project.prix_vente_ttc || 0) - (project.prix_achat_ttc || 0) - (project.travaux_ttc || 0) - (project.frais_agence_ttc || 0);
  const marginPercent = project.prix_achat_ttc ? ((margin / project.prix_achat_ttc) * 100) : 0;
  const triEstimated = project.tri_estimated || 12;

  const formatEuro = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statusConfig = {
    'DETECTE': { label: 'Détecté', color: 'bg-slate-500', bgColor: 'bg-slate-100', textColor: 'text-slate-800' },
    'OFFRE': { label: 'Offre', color: 'bg-blue-500', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    'SOUS_COMPROMIS': { label: 'Sous compromis', color: 'bg-amber-500', bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
    'ACTE_SIGNE': { label: 'Acte signé', color: 'bg-green-500', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    'TRAVAUX': { label: 'Travaux', color: 'bg-purple-500', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
    'COMMERCIALISATION': { label: 'Commercialisation', color: 'bg-indigo-500', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
    'VENDU': { label: 'Vendu', color: 'bg-emerald-500', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800' },
    'ABANDONNE': { label: 'Abandonné', color: 'bg-red-500', bgColor: 'bg-red-100', textColor: 'text-red-800' }
  };

  const currentStatus = statusConfig[project.status] || statusConfig['DETECTE'];

  const openGoogleMaps = () => {
    const address = typeof project.address === 'string' ? project.address : project.address?.line1;
    const city = project.city || project.address?.city;
    const encodedAddress = encodeURIComponent(`${address}, ${city || ''}, France`);
    window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <button
          onClick={onBack}
          className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour aux projets
        </button>
      </div>

      {/* Hero Banner with Project Image */}
      <div className="relative h-96 bg-gradient-to-r from-violet-600 to-blue-600 overflow-hidden">
        <img
          src={projectImages[selectedImage]}
          alt={project.label}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Project Title Overlay */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{project.label}</h1>
              <div className="flex items-center text-white/90 text-lg">
                <MapPin className="h-5 w-5 mr-2" />
                {typeof project.address === 'string' 
                  ? project.address 
                  : project.address?.line1 || 'Adresse non renseignée'
                }
              </div>
            </div>
            
            {/* Status Badge */}
            <div className={`${currentStatus.bgColor} ${currentStatus.textColor} px-4 py-2 rounded-xl border border-white/20 backdrop-blur-md`}>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${currentStatus.color}`}></div>
                <span className="font-semibold">{currentStatus.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Thumbnails */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            {projectImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-20 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === index ? 'border-violet-500' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img src={img} alt={`Vue ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
            <button className="w-20 h-12 rounded-lg border-2 border-dashed border-slate-300 hover:border-violet-400 flex items-center justify-center text-slate-400 hover:text-violet-500 transition-colors">
              <Camera className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Ajouter photos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: Building },
              { id: 'financial', label: 'Analyse financière', icon: BarChart3 },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'activity', label: 'Activité', icon: Calendar }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-violet-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Purchase Price */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <Edit className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{formatEuro(project.prix_achat_ttc || 0)}</p>
                  <p className="text-slate-600 font-medium">Prix d'achat TTC</p>
                </div>
              </div>

              {/* Sale Price */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-emerald-100 p-3 rounded-xl">
                    <Target className="h-6 w-6 text-emerald-600" />
                  </div>
                  <Edit className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{formatEuro(project.prix_vente_ttc || 0)}</p>
                  <p className="text-slate-600 font-medium">Prix de vente TTC</p>
                </div>
              </div>

              {/* Margin */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${margin > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <TrendingUp className={`h-6 w-6 ${margin > 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className={`text-sm font-medium ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {marginPercent > 0 ? '+' : ''}{marginPercent.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatEuro(margin)}
                  </p>
                  <p className="text-slate-600 font-medium">Marge estimée</p>
                </div>
              </div>

              {/* TRI */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${triEstimated > 15 ? 'bg-violet-100' : 'bg-amber-100'}`}>
                    <Percent className={`h-6 w-6 ${triEstimated > 15 ? 'text-violet-600' : 'text-amber-600'}`} />
                  </div>
                  <div className={`text-sm font-medium ${triEstimated > 15 ? 'text-green-600' : 'text-amber-600'}`}>
                    {triEstimated > 15 ? 'Excellent' : 'Correct'}
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{triEstimated.toFixed(1)}%</p>
                  <p className="text-slate-600 font-medium">TRI estimé</p>
                </div>
              </div>
            </div>

            {/* Address and Map */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Localisation</h2>
                <button
                  onClick={openGoogleMaps}
                  className="flex items-center space-x-2 text-violet-600 hover:text-violet-700 font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Ouvrir dans Google Maps</span>
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-violet-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">
                          {typeof project.address === 'string' 
                            ? project.address 
                            : project.address?.line1 || 'Adresse non renseignée'
                          }
                        </p>
                        <p className="text-slate-600">
                          {project.city || project.address?.city || ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-4">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Département:</span>
                        <span className="font-medium text-slate-900">{project.dept || 'Non renseigné'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Régime TVA:</span>
                        <span className="font-medium text-slate-900">{project.regime_tva}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Créé le:</span>
                        <span className="font-medium text-slate-900">
                          {new Date(project.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map Placeholder */}
                <div className="bg-slate-100 rounded-xl h-64 flex items-center justify-center border border-slate-200">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 font-medium">Carte interactive</p>
                    <p className="text-slate-500 text-sm">Google Maps à intégrer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Répartition des coûts</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">Prix d'achat</span>
                  <span className="font-semibold text-slate-900">{formatEuro(project.prix_achat_ttc || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">Travaux</span>
                  <span className="font-semibold text-slate-900">{formatEuro(project.travaux_ttc || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">Frais d'agence</span>
                  <span className="font-semibold text-slate-900">{formatEuro(project.frais_agence_ttc || 0)}</span>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl">
                    <span className="font-semibold text-slate-900">Total coûts</span>
                    <span className="font-bold text-slate-900 text-lg">
                      {formatEuro((project.prix_achat_ttc || 0) + (project.travaux_ttc || 0) + (project.frais_agence_ttc || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs content placeholders */}
        {activeTab === 'financial' && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <div className="text-center py-16">
              <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Analyse financière détaillée</h3>
              <p className="text-slate-500">Graphiques et métriques financières à développer</p>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <div className="text-center py-16">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Dataroom</h3>
              <p className="text-slate-500">Gestion des documents du projet</p>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Journal d'activité</h3>
              <p className="text-slate-500">Historique des actions et événements</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernProjectDetail;