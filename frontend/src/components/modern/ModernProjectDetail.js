import React, { useState, useRef, useEffect } from 'react';
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
  Percent,
  Trash2,
  Settings,
  ChevronDown
} from 'lucide-react';

const ModernProjectDetail = ({ project, onBack, onProjectUpdate, onProjectStatusUpdate, onProjectDelete }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleEdit = () => {
    onProjectUpdate && onProjectUpdate(project);
  };

  const handleDelete = async () => {
    // Double confirmation
    const firstConfirm = window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.label}" ?`);
    if (firstConfirm) {
      const secondConfirm = window.confirm(`ATTENTION : Cette action est irréversible ! Confirmez-vous la suppression définitive de "${project.label}" ?`);
      if (secondConfirm) {
        try {
          await onProjectDelete(project.id);
          onBack(); // Return to previous view after deletion
        } catch (error) {
          console.error('Erreur suppression:', error);
          alert('❌ Erreur lors de la suppression');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Back Button and Actions */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour aux projets
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Modifier</span>
            </button>
            
            <button
              onClick={handleDelete}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Supprimer</span>
            </button>
          </div>
        </div>
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
            
            {/* Status Badge - Clickable Dropdown */}
            <div className="relative z-50" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStatusDropdown(!showStatusDropdown);
                }}
                className={`${currentStatus.bgColor} ${currentStatus.textColor} px-4 py-2 rounded-xl border border-white/20 backdrop-blur-md hover:shadow-lg transition-all cursor-pointer flex items-center space-x-2`}
              >
                <div className={`w-3 h-3 rounded-full ${currentStatus.color}`}></div>
                <span className="font-semibold">{currentStatus.label}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Status Dropdown Menu */}
              {showStatusDropdown && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-[100]">
                  {Object.entries(statusConfig).map(([statusKey, config]) => (
                    <button
                      key={statusKey}
                      onClick={(e) => {
                        e.stopPropagation();
                        onProjectStatusUpdate(project.id, statusKey);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center space-x-3 ${
                        project.status === statusKey ? 'bg-violet-50' : ''
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                      <span className={`font-medium ${project.status === statusKey ? 'text-violet-700' : 'text-slate-700'}`}>
                        {config.label}
                      </span>
                      {project.status === statusKey && (
                        <span className="ml-auto text-violet-600 text-sm">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
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

                {/* Google Maps */}
                <div className="bg-slate-100 rounded-xl h-64 overflow-hidden border border-slate-200">
                  {project.google_maps_link ? (
                    <iframe
                      src={project.google_maps_link.includes('embed') 
                        ? project.google_maps_link 
                        : `https://maps.google.com/maps?q=${encodeURIComponent(
                            typeof project.address === 'string' 
                              ? project.address 
                              : `${project.address?.line1 || ''}, ${project.address?.city || ''}`
                          )}&output=embed`
                      }
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Google Maps"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 font-medium">Carte non disponible</p>
                        <p className="text-slate-500 text-sm">Ajoutez un lien Google Maps</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Répartition des coûts</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pie Chart */}
                <div className="flex items-center justify-center">
                  <div className="relative w-56 h-56">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                      {(() => {
                        const prixAchat = project.prix_achat_ttc || 0;
                        const travaux = project.travaux_ttc || 0;
                        const fraisAgence = project.frais_agence_ttc || 0;
                        const total = prixAchat + travaux + fraisAgence;
                        
                        if (total === 0) return null;
                        
                        const prixAchatPercent = (prixAchat / total) * 100;
                        const travauxPercent = (travaux / total) * 100;
                        const fraisPercent = (fraisAgence / total) * 100;
                        
                        const radius = 80;
                        const circumference = 2 * Math.PI * radius;
                        
                        const prixAchatLength = (prixAchatPercent / 100) * circumference;
                        const travauxLength = (travauxPercent / 100) * circumference;
                        const fraisLength = (fraisPercent / 100) * circumference;
                        
                        let currentOffset = 0;
                        
                        return (
                          <>
                            {/* Prix d'achat */}
                            {prixAchat > 0 && (
                              <circle
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="30"
                                strokeDasharray={`${prixAchatLength} ${circumference}`}
                                strokeDashoffset={currentOffset}
                                className="transition-all duration-1000"
                              />
                            )}
                            
                            {/* Travaux */}
                            {travaux > 0 && (() => {
                              currentOffset -= prixAchatLength;
                              return (
                                <circle
                                  cx="100"
                                  cy="100"
                                  r={radius}
                                  fill="none"
                                  stroke="#f59e0b"
                                  strokeWidth="30"
                                  strokeDasharray={`${travauxLength} ${circumference}`}
                                  strokeDashoffset={currentOffset}
                                  className="transition-all duration-1000"
                                />
                              );
                            })()}
                            
                            {/* Frais d'agence */}
                            {fraisAgence > 0 && (() => {
                              currentOffset -= travauxLength;
                              return (
                                <circle
                                  cx="100"
                                  cy="100"
                                  r={radius}
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="30"
                                  strokeDasharray={`${fraisLength} ${circumference}`}
                                  strokeDashoffset={currentOffset}
                                  className="transition-all duration-1000"
                                />
                              );
                            })()}
                          </>
                        );
                      })()}
                    </svg>
                    
                    {/* Center text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">Total</div>
                        <div className="text-sm text-slate-600">
                          {formatEuro((project.prix_achat_ttc || 0) + (project.travaux_ttc || 0) + (project.frais_agence_ttc || 0))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend and Details */}
                <div className="space-y-4">
                  {/* Prix d'achat */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-blue-900">Prix d'achat</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-900">{formatEuro(project.prix_achat_ttc || 0)}</div>
                      <div className="text-xs text-blue-700">
                        {((project.prix_achat_ttc || 0) / ((project.prix_achat_ttc || 0) + (project.travaux_ttc || 0) + (project.frais_agence_ttc || 0)) * 100 || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Travaux */}
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                      <span className="font-medium text-amber-900">Travaux</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-amber-900">{formatEuro(project.travaux_ttc || 0)}</div>
                      <div className="text-xs text-amber-700">
                        {((project.travaux_ttc || 0) / ((project.prix_achat_ttc || 0) + (project.travaux_ttc || 0) + (project.frais_agence_ttc || 0)) * 100 || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Frais d'agence */}
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                      <span className="font-medium text-emerald-900">Frais d'agence</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-emerald-900">{formatEuro(project.frais_agence_ttc || 0)}</div>
                      <div className="text-xs text-emerald-700">
                        {((project.frais_agence_ttc || 0) / ((project.prix_achat_ttc || 0) + (project.travaux_ttc || 0) + (project.frais_agence_ttc || 0)) * 100 || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Total avec marge */}
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl">
                      <span className="font-semibold text-slate-900">Prix de vente prévu</span>
                      <span className="font-bold text-slate-900 text-lg">
                        {formatEuro(project.prix_vente_ttc || 0)}
                      </span>
                    </div>
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