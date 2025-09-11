import React, { useState } from "react";
import "./App.css";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { Calculator, Building2, TrendingUp, AlertTriangle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
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
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-8 w-8 text-amber-600" />
            <h1 className="text-3xl font-bold text-slate-900">Estimateur Fiscal</h1>
          </div>
          <p className="text-slate-600">Plateforme SaaS pour marchands de biens immobiliers</p>
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
    </div>
  );
}

export default App;