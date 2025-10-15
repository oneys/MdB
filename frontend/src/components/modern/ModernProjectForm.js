import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  MapPin, 
  DollarSign, 
  Camera, 
  Upload,
  AlertCircle,
  Building,
  Calculator,
  FileText
} from 'lucide-react';

const ModernProjectForm = ({ onBack, onProjectCreate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    label: '',
    address: '',
    city: '',
    dept: '',
    google_maps_link: '',
    status: 'DETECTE',
    prix_achat_ttc: '',
    prix_vente_ttc: '',
    travaux_ttc: '',
    frais_agence_ttc: '',
    regime_tva: 'MARGE',
    description: '',
    photos: []
  });

  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);

  const totalSteps = 4;

  const steps = [
    { id: 1, title: 'Informations générales', icon: Building },
    { id: 2, title: 'Détails financiers', icon: DollarSign },
    { id: 3, title: 'Photos et documents', icon: Camera },
    { id: 4, title: 'Récapitulatif', icon: FileText }
  ];

  const formatEuro = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.label.trim()) newErrors.label = 'Le nom du projet est requis';
        if (!formData.address.trim()) newErrors.address = 'L\'adresse est requise';
        if (!formData.city.trim()) newErrors.city = 'La ville est requise';
        if (!formData.dept.trim()) newErrors.dept = 'Le département est requis';
        break;
      case 2:
        if (!formData.prix_achat_ttc || formData.prix_achat_ttc <= 0) {
          newErrors.prix_achat_ttc = 'Le prix d\'achat est requis';
        }
        if (!formData.prix_vente_ttc || formData.prix_vente_ttc <= 0) {
          newErrors.prix_vente_ttc = 'Le prix de vente est requis';
        }
        if (parseFloat(formData.prix_vente_ttc) <= parseFloat(formData.prix_achat_ttc)) {
          newErrors.prix_vente_ttc = 'Le prix de vente doit être supérieur au prix d\'achat';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      try {
        const newProject = {
          label: formData.label,
          address: {
            line1: formData.address,
            city: formData.city,
            zipcode: formData.dept
          },
          google_maps_link: formData.google_maps_link || null,
          status: formData.status || 'DETECTE',
          prix_achat_ttc: parseFloat(formData.prix_achat_ttc) || 0,
          prix_vente_ttc: parseFloat(formData.prix_vente_ttc) || 0,
          travaux_ttc: parseFloat(formData.travaux_ttc) || 0,
          frais_agence_ttc: parseFloat(formData.frais_agence_ttc) || 0,
          regime_tva: formData.regime_tva
        };
        
        console.log('💾 Création du projet:', newProject);
        
        if (onProjectCreate) {
          await onProjectCreate(newProject);
          
          // Success notification
          setCurrentStep(1); // Reset form
          setFormData({
            label: '',
            address: '',
            city: '',
            dept: '',
            google_maps_link: '',
            status: 'DETECTE',
            prix_achat_ttc: '',
            prix_vente_ttc: '',
            travaux_ttc: '',
            frais_agence_ttc: '',
            regime_tva: 'MARGE',
            description: '',
            photos: []
          });
          
          // Show success message
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50';
          notification.innerHTML = '✅ Projet créé avec succès !';
          document.body.appendChild(notification);
          
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 3000);
          
        } else {
          throw new Error('onProjectCreate function not provided');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la création:', error);
        
        // Error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50';
        notification.innerHTML = '❌ Erreur lors de la création du projet';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 3000);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files) => {
    const newPhotos = [];
    
    for (let i = 0; i < files.length && i < 10; i++) {
      const file = files[i];
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const photo = {
            id: Date.now() + i,
            name: file.name,
            url: e.target.result,
            file: file
          };
          newPhotos.push(photo);
          
          setFormData(prev => ({
            ...prev,
            photos: [...(prev.photos || []), photo]
          }));
        };
        reader.readAsDataURL(file);
      }
    }
    
    console.log('📷 Images ajoutées:', files.length);
  };

  const handleFileSelect = (e) => {
    e.preventDefault();
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    };
    input.click();
  };

  const removePhoto = (photoId) => {
    setFormData(prev => ({
      ...prev,
      photos: (prev.photos || []).filter(photo => photo.id !== photoId)
    }));
  };

  // Calculate estimated margin
  const estimatedMargin = (parseFloat(formData.prix_vente_ttc) || 0) - 
                         (parseFloat(formData.prix_achat_ttc) || 0) - 
                         (parseFloat(formData.travaux_ttc) || 0) - 
                         (parseFloat(formData.frais_agence_ttc) || 0);

  const marginPercent = formData.prix_achat_ttc ? (estimatedMargin / parseFloat(formData.prix_achat_ttc)) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour
          </button>
          
          <h1 className="text-2xl font-bold text-slate-900">Créer un nouveau projet</h1>
          
          <div className="text-sm text-slate-600">
            Étape {currentStep} sur {totalSteps}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-center max-w-2xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isActive
                      ? 'bg-violet-500 border-violet-500 text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    isActive ? 'text-violet-600' : isCompleted ? 'text-green-600' : 'text-slate-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-slate-200'
                  }`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 py-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Step 1: General Information */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="text-center mb-8">
                <Building className="h-12 w-12 text-violet-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Informations générales</h2>
                <p className="text-slate-600">Renseignez les détails de base de votre projet</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nom du projet *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => handleInputChange('label', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      errors.label 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-slate-300 focus:ring-violet-500'
                    }`}
                    placeholder="Ex: Maison familiale Boulogne"
                  />
                  {errors.label && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.label}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Adresse * 
                    <button
                      type="button"
                      onClick={() => {
                        const address = `${formData.address}, ${formData.city}, France`;
                        const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
                        window.open(url, '_blank');
                      }}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      📍 Voir sur Google Maps
                    </button>
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      errors.address 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-slate-300 focus:ring-violet-500'
                    }`}
                    placeholder="Ex: 123 rue de la Paix"
                  />
                  {errors.address && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Ville *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                        errors.city 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-slate-300 focus:ring-violet-500'
                      }`}
                      placeholder="Ex: Paris"
                    />
                    {errors.city && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Département *
                    </label>
                    <input
                      type="text"
                      value={formData.dept}
                      onChange={(e) => handleInputChange('dept', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                        errors.dept 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-slate-300 focus:ring-violet-500'
                      }`}
                      placeholder="Ex: 75"
                    />
                    {errors.dept && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.dept}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Lien Google Maps (optionnel)
                  </label>
                  <input
                    type="url"
                    value={formData.google_maps_link || ''}
                    onChange={(e) => handleInputChange('google_maps_link', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="https://maps.google.com/..."
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Copiez le lien Google Maps de l'adresse du bien
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Niveau d'avancement
                  </label>
                  <select
                    value={formData.status || 'DETECTE'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="DETECTE">Détecté</option>
                    <option value="OFFRE">Offre</option>
                    <option value="SOUS_COMPROMIS">Sous compromis</option>
                    <option value="ACTE_SIGNE">Acte signé</option>
                    <option value="TRAVAUX">Travaux</option>
                    <option value="COMMERCIALISATION">Commercialisation</option>
                    <option value="VENDU">Vendu</option>
                    <option value="ABANDONNE">Abandonné</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Régime de TVA
                  </label>
                  <select
                    value={formData.regime_tva}
                    onChange={(e) => handleInputChange('regime_tva', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="MARGE">TVA sur la marge</option>
                    <option value="NORMAL">TVA normale</option>
                    <option value="EXO">Exonération</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Description du projet, notes particulières..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Financial Details */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="text-center mb-8">
                <Calculator className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Détails financiers</h2>
                <p className="text-slate-600">Saisissez les montants pour calculer la rentabilité</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Prix d'achat TTC *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      value={formData.prix_achat_ttc}
                      onChange={(e) => handleInputChange('prix_achat_ttc', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                        errors.prix_achat_ttc 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-slate-300 focus:ring-violet-500'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {errors.prix_achat_ttc && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.prix_achat_ttc}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Prix de vente TTC *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      value={formData.prix_vente_ttc}
                      onChange={(e) => handleInputChange('prix_vente_ttc', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                        errors.prix_vente_ttc 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-slate-300 focus:ring-violet-500'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {errors.prix_vente_ttc && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.prix_vente_ttc}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Travaux TTC (optionnel)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      value={formData.travaux_ttc}
                      onChange={(e) => handleInputChange('travaux_ttc', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Frais d'agence TTC (optionnel)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      value={formData.frais_agence_ttc}
                      onChange={(e) => handleInputChange('frais_agence_ttc', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Margin Preview */}
              {formData.prix_achat_ttc && formData.prix_vente_ttc && (
                <div className="mt-8 p-6 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl border border-violet-100">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                    <Calculator className="h-5 w-5 mr-2 text-violet-600" />
                    Estimation préliminaire
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-slate-600">Marge estimée</span>
                      <p className={`text-lg font-bold ${estimatedMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatEuro(estimatedMargin)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600">Pourcentage de marge</span>
                      <p className={`text-lg font-bold ${marginPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {marginPercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Photos */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="text-center mb-8">
                <Camera className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Photos et documents</h2>
                <p className="text-slate-600">Ajoutez des visuels à votre projet (optionnel)</p>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  dragActive 
                    ? 'border-violet-400 bg-violet-50' 
                    : 'border-slate-300 hover:border-violet-300 hover:bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleFileSelect}
              >
                <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Glissez-déposez vos images ici
                </h3>
                <p className="text-slate-500 mb-4">
                  ou cliquez pour sélectionner des fichiers
                </p>
                <button 
                  type="button"
                  className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileSelect(e);
                  }}
                >
                  Choisir des images
                </button>
                <p className="text-xs text-slate-400 mt-4">
                  Formats acceptés: JPG, PNG, GIF - Taille max: 10MB par fichier
                </p>
              </div>

              {/* Preview Area */}
              {formData.photos && formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden">
                      <img 
                        src={photo.url} 
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs truncate">
                        {photo.name}
                      </div>
                    </div>
                  ))}
                  
                  {/* Add more photos button */}
                  <div 
                    className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center border border-dashed border-slate-300 cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors"
                    onClick={handleFileSelect}
                  >
                    <div className="text-center">
                      <Camera className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Ajouter</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Summary */}
          {currentStep === 4 && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="text-center mb-8">
                <FileText className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Récapitulatif</h2>
                <p className="text-slate-600">Vérifiez les informations avant de créer le projet</p>
              </div>

              <div className="space-y-6">
                {/* Project Info */}
                <div className="p-6 bg-slate-50 rounded-xl">
                  <h3 className="font-semibold text-slate-900 mb-4">Informations générales</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Nom:</span>
                      <p className="font-medium text-slate-900">{formData.label}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Adresse:</span>
                      <p className="font-medium text-slate-900">{formData.address}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Ville:</span>
                      <p className="font-medium text-slate-900">{formData.city}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Département:</span>
                      <p className="font-medium text-slate-900">{formData.dept}</p>
                    </div>
                    {formData.google_maps_link && (
                      <div className="col-span-2">
                        <span className="text-slate-600">Google Maps:</span>
                        <p className="font-medium text-violet-600 truncate">{formData.google_maps_link}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-6 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl border border-violet-100">
                  <h3 className="font-semibold text-slate-900 mb-4">Résumé financier</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Prix d'achat TTC</span>
                      <span className="font-medium">{formatEuro(parseFloat(formData.prix_achat_ttc) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Prix de vente TTC</span>
                      <span className="font-medium">{formatEuro(parseFloat(formData.prix_vente_ttc) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Travaux TTC</span>
                      <span className="font-medium">{formatEuro(parseFloat(formData.travaux_ttc) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Frais d'agence TTC</span>
                      <span className="font-medium">{formatEuro(parseFloat(formData.frais_agence_ttc) || 0)}</span>
                    </div>
                    <div className="border-t border-violet-200 pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-900">Marge estimée</span>
                        <span className={`font-bold text-lg ${estimatedMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatEuro(estimatedMargin)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                currentStep === 1
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Précédent</span>
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-8 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium shadow-lg hover:shadow-xl"
              >
                <span>Suivant</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-colors font-medium shadow-lg hover:shadow-xl"
              >
                <Check className="h-4 w-4" />
                <span>Créer le projet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernProjectForm;