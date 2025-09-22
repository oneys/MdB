import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Building2, Calculator, FileText, BarChart3, 
  Shield, Users, Clock, Star, ArrowRight, CheckCircle
} from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-amber-600" />
              <span className="text-2xl font-bold text-slate-900">MarchndsBiens</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-slate-600 hover:text-slate-900">Fonctionnalités</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900">Tarifs</a>
              <a href="/contact" className="text-slate-600 hover:text-slate-900">Contact</a>
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => window.location.href = '/app'}>
                Accéder à l'App
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-amber-100 text-amber-800">
            🚀 Plateforme SaaS pour Marchands de Biens
          </Badge>
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Décisions Go/No Go
            <span className="text-amber-600"> en moins de 15 minutes</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            La première plateforme tout-en-un pour marchands de biens immobiliers. 
            Centralisez vos projets, automatisez vos calculs fiscaux et générez vos dossiers professionnels.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-lg px-8" onClick={() => window.location.href = '/app'}>
              Essayer gratuitement
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Voir la démo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Tout ce dont vous avez besoin pour réussir
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Des outils professionnels conçus spécifiquement pour les marchands de biens immobiliers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Calculator className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle>Estimateur Fiscal</CardTitle>
                <CardDescription>
                  Calculs automatiques TVA sur marge, DMTO 0,715%, barèmes notaires
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">3 régimes TVA (Normal/Marge/EXO)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Calculs auditables et expliqués</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Barèmes notaires à jour</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle>Pipeline Kanban</CardTitle>
                <CardDescription>
                  Visualisez et pilotez vos projets de Détecté à Clos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Drag & drop entre étapes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Suivi temps réel</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Analytics de performance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle>Dataroom & Export</CardTitle>
                <CardDescription>
                  Centralisez vos documents et générez vos dossiers professionnels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Upload multi-fichiers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Dossiers Banque/Notaire PDF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Organisation automatique</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle>Conformité KYC/TRACFIN</CardTitle>
                <CardDescription>
                  Respectez automatiquement vos obligations réglementaires
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Alertes automatiques</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Documentation conforme</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Audit trail complet</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle>Gestion d'équipe</CardTitle>
                <CardDescription>
                  Collaborez efficacement avec votre équipe et partenaires
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Rôles et permissions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Notifications temps réel</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Accès invités</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle>Décisions Rapides</CardTitle>
                <CardDescription>
                  Go/No Go en moins de 15 minutes avec tous les éléments clés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Dashboard KPIs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Analyse de risque</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Recommandations IA</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-lg text-slate-600">
              Découvrez ce que disent nos clients marchands de biens
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">
                  "MarchndsBiens a révolutionné notre processus. Nous prenons maintenant nos décisions d'investissement en 10 minutes au lieu d'une journée complète."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-amber-600 font-semibold">JM</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Jean-Michel D.</p>
                    <p className="text-sm text-slate-500">MdB Paris • 50+ projets/an</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">
                  "L'estimateur fiscal est un vrai gain de temps. Fini les erreurs de calcul TVA sur marge, tout est automatisé et auditable."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-amber-600 font-semibold">SM</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Sophie M.</p>
                    <p className="text-sm text-slate-500">MdB Lyon • 30+ projets/an</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">
                  "Le pipeline Kanban nous permet de suivre nos 20 projets simultanés. L'export PDF pour la banque fait gagner des heures."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <span className="text-amber-600 font-semibold">AL</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Antoine L.</p>
                    <p className="text-sm text-slate-500">MdB Marseille • 80+ projets/an</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-amber-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à révolutionner votre activité de marchand de biens ?
          </h2>
          <p className="text-xl text-amber-100 mb-8">
            Rejoignez les marchands de biens qui font déjà confiance à MarchndsBiens
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => window.location.href = '/app'}>
              Commencer maintenant
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 border-white text-white hover:bg-white hover:text-amber-600">
              Planifier une démo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="h-6 w-6 text-amber-600" />
                <span className="text-xl font-bold text-white">MarchndsBiens</span>
              </div>
              <p className="text-slate-400">
                La plateforme SaaS de référence pour les marchands de biens immobiliers.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Produit</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white">Tarifs</a></li>
                <li><a href="/app" className="hover:text-white">Accéder à l'App</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Aide</a></li>
                <li><a href="#" className="hover:text-white">Tutoriels</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Légal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-white">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-white">RGPD</a></li>
                <li><a href="#" className="hover:text-white">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2025 MarchndsBiens. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;