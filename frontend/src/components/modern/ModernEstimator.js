import React, { useState } from 'react';
import { 
  Calculator,
  Building,
  DollarSign,
  Percent,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart,
  FileText
} from 'lucide-react';

const ModernEstimator = () => {
  const [formData, setFormData] = useState({
    dept: '',
    regime_tva: 'MARGE',
    prix_achat_ttc: '',
    prix_vente_ttc: '',
    travaux_ttc: '',
    frais_agence_ttc: '',
    md_b_0715_ok: false,
    travaux_structurants: false
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatEuro = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const calculateEstimation = async () => {
    if (!formData.dept || !formData.prix_achat_ttc || !formData.prix_vente_ttc) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/estimate/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          dept: formData.dept,
          regime_tva: formData.regime_tva,
          prix_achat_ttc: parseFloat(formData.prix_achat_ttc),
          prix_vente_ttc: parseFloat(formData.prix_vente_ttc),
          travaux_ttc: parseFloat(formData.travaux_ttc) || 0,
          frais_agence_ttc: parseFloat(formData.frais_agence_ttc) || 0,
          flags: {
            md_b_0715_ok: formData.md_b_0715_ok,
            travaux_structurants: formData.travaux_structurants
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
        console.log('✅ Estimation calculée:', data);
      } else {
        throw new Error(`Erreur API: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erreur calcul:', error);
      alert('Erreur lors du calcul. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      dept: '',
      regime_tva: 'MARGE',
      prix_achat_ttc: '',
      prix_vente_ttc: '',
      travaux_ttc: '',
      frais_agence_ttc: '',
      md_b_0715_ok: false,
      travaux_structurants: false
    });
    setResults(null);
  };

  // Calculate preview values
  const investmentTotal = (parseFloat(formData.prix_achat_ttc) || 0) + 
                         (parseFloat(formData.travaux_ttc) || 0) + 
                         (parseFloat(formData.frais_agence_ttc) || 0);
  
  const grossMargin = (parseFloat(formData.prix_vente_ttc) || 0) - investmentTotal;
  const marginPercent = investmentTotal > 0 ? (grossMargin / investmentTotal) * 100 : 0;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Estimateur fiscal</h1>
        <p className="text-slate-600">
          Calculez la rentabilité et l'optimisation fiscale de vos projets immobiliers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-violet-100 p-3 rounded-xl">
                <Calculator className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Paramètres du projet</h2>
                <p className="text-slate-600 text-sm">Renseignez les informations de votre opération</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Département */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Département *
                </label>
                <input
                  type="text"
                  value={formData.dept}
                  onChange={(e) => handleInputChange('dept', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Ex: 75, 92, 93..."
                />
              </div>

              {/* Régime TVA */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Régime de TVA *
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

              {/* Prix d'achat */}
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
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="300000"
                  />
                </div>
              </div>

              {/* Prix de vente */}
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
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="450000"
                  />
                </div>
              </div>

              {/* Travaux */}
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
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="80000"
                  />
                </div>
              </div>

              {/* Frais d'agence */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Frais d'agence TTC
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    value={formData.frais_agence_ttc}
                    onChange={(e) => handleInputChange('frais_agence_ttc', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="15000"
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-3">Options fiscales</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.md_b_0715_ok}
                    onChange={(e) => handleInputChange('md_b_0715_ok', e.target.checked)}
                    className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-700">
                    DMTO Marchand de Biens 0,715% (au lieu de 5,80%)
                  </span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.travaux_structurants}
                    onChange={(e) => handleInputChange('travaux_structurants', e.target.checked)}
                    className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-700">
                    Travaux structurants (impact sur les frais de notaire)
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={resetForm}
                className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors"
              >
                Réinitialiser
              </button>
              
              <button
                onClick={calculateEstimation}
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Calcul...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4" />
                    <span>Calculer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview & Results */}
        <div className="lg:col-span-1">
          {/* Quick Preview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-violet-600" />
              Aperçu rapide
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

          {/* Results Section */}
          {results && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Résultats détaillés
              </h3>
              
              <div className="space-y-4">
                {/* DMTO */}
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-blue-900">DMTO</span>
                    <span className="font-bold text-blue-900">{formatEuro(results.dmto || 0)}</span>
                  </div>
                  <div className="text-xs text-blue-700">
                    Taux: {results.dmto_rate || 'N/A'}%
                  </div>
                </div>

                {/* Frais de notaire */}
                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-amber-900">Frais notaire</span>
                    <span className="font-bold text-amber-900">{formatEuro(results.notary_fees || 0)}</span>
                  </div>
                </div>

                {/* Marge nette */}
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-green-900">Marge nette</span>
                    <span className="font-bold text-green-900">{formatEuro(results.net_margin || 0)}</span>
                  </div>
                  <div className="text-xs text-green-700">
                    TRI estimé: {(results.tri_estimated || 0).toFixed(1)}%
                  </div>
                </div>

                {/* TVA */}
                {results.tva_due && (
                  <div className="p-4 bg-violet-50 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-violet-900">TVA due</span>
                      <span className="font-bold text-violet-900">{formatEuro(results.tva_due)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Explanation */}
              {results.explanation && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-medium text-slate-900 mb-2 text-sm">Détails du calcul</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {results.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Help Card */}
          <div className="mt-6 bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl p-6 border border-violet-100">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-violet-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-violet-900 text-sm mb-1">Aide au calcul</h4>
                <p className="text-xs text-violet-700 leading-relaxed">
                  L'estimateur prend en compte les spécificités fiscales des marchands de biens : 
                  TVA sur marge, DMTO réduit, et optimisations possibles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernEstimator;