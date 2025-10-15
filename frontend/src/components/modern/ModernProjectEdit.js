import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  DollarSign, 
  Building,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const ModernProjectEdit = ({ project, onBack, onProjectUpdate }) => {
  const [formData, setFormData] = useState({
    label: project.label || '',
    address: typeof project.address === 'string' ? project.address : project.address?.line1 || '',
    city: project.city || project.address?.city || '',
    dept: project.dept || project.address?.dept || '',
    prix_achat_ttc: project.prix_achat_ttc || 0,
    prix_vente_ttc: project.prix_vente_ttc || 0,
    travaux_ttc: project.travaux_ttc || 0,
    frais_agence_ttc: project.frais_agence_ttc || 0,
    regime_tva: project.regime_tva || 'MARGE',
    description: project.description || ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.label.trim()) newErrors.label = 'Le nom du projet est requis';
    if (!formData.address.trim()) newErrors.address = 'L\'adresse est requise';
    if (!formData.prix_achat_ttc || formData.prix_achat_ttc <= 0) {
      newErrors.prix_achat_ttc = 'Le prix d\'achat est requis';
    }
    if (!formData.prix_vente_ttc || formData.prix_vente_ttc <= 0) {
      newErrors.prix_vente_ttc = 'Le prix de vente est requis';
    }
    if (parseFloat(formData.prix_vente_ttc) <= parseFloat(formData.prix_achat_ttc)) {
      newErrors.prix_vente_ttc = 'Le prix de vente doit être supérieur au prix d\'achat';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const updatedProject = {
        ...project,
        label: formData.label,
        address: {
          line1: formData.address,
          city: formData.city,
          zipcode: formData.dept,
          dept: formData.dept
        },
        prix_achat_ttc: parseFloat(formData.prix_achat_ttc),
        prix_vente_ttc: parseFloat(formData.prix_vente_ttc),
        travaux_ttc: parseFloat(formData.travaux_ttc) || 0,
        frais_agence_ttc: parseFloat(formData.frais_agence_ttc) || 0,
        regime_tva: formData.regime_tva,
        description: formData.description,
        updated_at: new Date().toISOString()
      };

      await onProjectUpdate(updatedProject);
      
      // Success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50';
      notification.innerHTML = '✅ Projet modifié avec succès !';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);

      // Return to project detail
      onBack();
      
    } catch (error) {
      console.error('❌ Erreur lors de la modification:', error);
      
      // Error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50';
      notification.innerHTML = '❌ Erreur lors de la modification du projet';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Calculate preview values
  const investmentTotal = (parseFloat(formData.prix_achat_ttc) || 0) + 
                         (parseFloat(formData.travaux_ttc) || 0) + 
                         (parseFloat(formData.frais_agence_ttc) || 0);
  
  const grossMargin = (parseFloat(formData.prix_vente_ttc) || 0) - investmentTotal;
  const marginPercent = investmentTotal > 0 ? (grossMargin / investmentTotal) * 100 : 0;

  const formatEuro = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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
          
          <h1 className="text-2xl font-bold text-slate-900">Modifier le projet</h1>
          
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Section */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Informations du projet</h2>
                    <p className="text-slate-600 text-sm">Modifiez les détails de votre projet immobilier</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Nom du projet */}
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
                          : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors.label && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.label}
                      </p>
                    )}
                  </div>

                  {/* Adresse et ville */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            : 'border-slate-300 focus:ring-blue-500'
                        }`}
                      />
                      {errors.address && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.address}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Prix d'achat et vente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              : 'border-slate-300 focus:ring-blue-500'
                          }`}
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
                              : 'border-slate-300 focus:ring-blue-500'
                          }`}
                        />
                      </div>
                      {errors.prix_vente_ttc && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.prix_vente_ttc}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Travaux et frais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Travaux TTC
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <input
                          type="number"
                          value={formData.travaux_ttc}
                          onChange={(e) => handleInputChange('travaux_ttc', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Frais d'agence TTC
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <input
                          type="number"
                          value={formData.frais_agence_ttc}
                          onChange={(e) => handleInputChange('frais_agence_ttc', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Régime TVA */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Régime de TVA
                    </label>
                    <select
                      value={formData.regime_tva}
                      onChange={(e) => handleInputChange('regime_tva', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MARGE">TVA sur la marge</option>
                      <option value="NORMAL">TVA normale</option>
                      <option value="EXO">Exonération</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Description du projet, notes particulières..."
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end mt-8">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Modification...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Enregistrer les modifications</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                  Aperçu financier
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Investissement total</span>
                    <span className="font-medium text-slate-900">{formatEuro(investmentTotal)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Prix de vente</span>
                    <span className="font-medium text-slate-900">{formatEuro(parseFloat(formData.prix_vente_ttc) || 0)}</span>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-900">Marge brute</span>
                      <span className={`font-bold ${grossMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatEuro(grossMargin)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-slate-500">Pourcentage</span>
                      <span className={`text-sm font-medium ${marginPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {marginPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernProjectEdit;