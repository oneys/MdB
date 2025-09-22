import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Building2, CheckCircle, X, ArrowRight, Star, Zap
} from 'lucide-react';

const PricingPage = () => {
  const plans = [
    {
      name: "Starter",
      price: "49",
      period: "mois",
      description: "Parfait pour débuter votre activité de marchand de biens",
      badge: null,
      features: [
        "Jusqu'à 10 projets simultanés",
        "Estimateur fiscal complet",
        "Pipeline Kanban",
        "Export PDF basique",
        "Support email",
        "1 utilisateur"
      ],
      notIncluded: [
        "Analytics avancés",
        "Dataroom illimitée",
        "Intégrations tierces",
        "Support prioritaire"
      ],
      cta: "Commencer l'essai gratuit",
      popular: false
    },
    {
      name: "Professional",
      price: "149",
      period: "mois",
      description: "Pour les marchands de biens confirmés avec équipe",
      badge: "Plus populaire",
      features: [
        "Projets illimités",
        "Estimateur fiscal + IA",
        "Pipeline Kanban avancé",
        "Dataroom complète",
        "Export PDF premium",
        "Analytics & graphiques",
        "Intégrations (banques, notaires)",
        "Support prioritaire",
        "Jusqu'à 5 utilisateurs"
      ],
      notIncluded: [
        "White-label",
        "API accès",
        "Support dédié"
      ],
      cta: "Choisir Professional",
      popular: true
    },
    {
      name: "Enterprise",
      price: "399",
      period: "mois",
      description: "Solution sur-mesure pour grandes structures",
      badge: "Recommandé",
      features: [
        "Tout de Professional",
        "White-label complet",
        "API accès illimité",
        "Intégrations personnalisées",
        "Support dédié 24/7",
        "Formation équipe",
        "Utilisateurs illimités",
        "SLA garanti 99.9%",
        "Conformité RGPD+",
        "Backup quotidien"
      ],
      notIncluded: [],
      cta: "Contacter les ventes",
      popular: false
    }
  ];

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
              <a href="/" className="text-slate-600 hover:text-slate-900">Accueil</a>
              <a href="/#features" className="text-slate-600 hover:text-slate-900">Fonctionnalités</a>
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
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">
            Tarifs transparents pour tous les
            <span className="text-amber-600"> marchands de biens</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Choisissez le plan qui correspond à votre volume d'activité. 
            Tous nos plans incluent 14 jours d'essai gratuit, sans engagement.
          </p>
          <div className="flex items-center justify-center gap-4 mb-8">
            <Badge className="bg-green-100 text-green-800">
              ✅ 14 jours gratuits
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              💳 Sans engagement
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              📞 Support français
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={plan.name} 
                className={`relative hover:shadow-xl transition-all duration-300 ${
                  plan.popular ? 'ring-2 ring-amber-500 scale-105' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-amber-500 text-white px-4 py-1">
                      {plan.popular && <Star className="h-3 w-3 mr-1" />}
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-baseline justify-center gap-1 my-4">
                    <span className="text-4xl font-bold text-slate-900">
                      {plan.price}€
                    </span>
                    <span className="text-slate-500">/{plan.period}</span>
                  </div>
                  <CardDescription className="text-slate-600">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Button 
                    className={`w-full mb-6 ${
                      plan.popular 
                        ? 'bg-amber-600 hover:bg-amber-700' 
                        : 'bg-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    {plan.cta}
                    {plan.name !== 'Enterprise' && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>

                  <div className="space-y-3">
                    <p className="font-semibold text-slate-900 mb-3">Inclus :</p>
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.notIncluded.length > 0 && (
                      <>
                        <p className="font-semibold text-slate-400 mb-3 mt-6">Non inclus :</p>
                        {plan.notIncluded.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-3">
                            <X className="h-4 w-4 text-slate-300 flex-shrink-0" />
                            <span className="text-sm text-slate-400">{feature}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-lg text-slate-600">
              Tout ce que vous devez savoir sur nos tarifs
            </p>
          </div>

          <div className="space-y-8">
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Puis-je changer de plan à tout moment ?
              </h3>
              <p className="text-slate-600">
                Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. 
                Les changements prennent effet immédiatement et nous ajustons la facturation au prorata.
              </p>
            </div>

            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                L'essai gratuit nécessite-t-il une carte bancaire ?
              </h3>
              <p className="text-slate-600">
                Non, notre essai gratuit de 14 jours ne nécessite aucune carte bancaire. 
                Vous pouvez explorer toutes les fonctionnalités sans engagement.
              </p>
            </div>

            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Que se passe-t-il si je dépasse mes limites ?
              </h3>
              <p className="text-slate-600">
                Nous vous préviendrons avant d'atteindre vos limites. Vous pourrez alors 
                passer à un plan supérieur ou nous pourrons discuter d'options personnalisées.
              </p>
            </div>

            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Proposez-vous des remises pour les paiements annuels ?
              </h3>
              <p className="text-slate-600">
                Oui, nous offrons 2 mois gratuits (soit 16,7% de réduction) pour tout 
                abonnement annuel payé d'avance.
              </p>
            </div>

            <div className="pb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Votre support est-il vraiment en français ?
              </h3>
              <p className="text-slate-600">
                Absolument ! Notre équipe support est basée en France et répond en français. 
                Nous comprenons les spécificités du marché immobilier français et de la fiscalité des marchands de biens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-amber-600 to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <Zap className="h-16 w-16 text-white mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à booster votre activité ?
          </h2>
          <p className="text-xl text-amber-100 mb-8">
            Commencez votre essai gratuit de 14 jours. Aucune carte bancaire requise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Commencer l'essai gratuit
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 border-white text-white hover:bg-white hover:text-amber-600">
              Voir une démo
            </Button>
          </div>
          <p className="text-amber-200 text-sm mt-4">
            Essai gratuit • Sans engagement • Support français
          </p>
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
                <li><a href="/" className="hover:text-white">Accueil</a></li>
                <li><a href="/#features" className="hover:text-white">Fonctionnalités</a></li>
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

export default PricingPage;