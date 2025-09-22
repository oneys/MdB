import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Building2, Mail, Phone, MapPin, Clock, 
  MessageSquare, ArrowRight, CheckCircle
} from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
              <a href="/pricing" className="text-slate-600 hover:text-slate-900">Tarifs</a>
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
            Contactez notre équipe
            <span className="text-amber-600"> d'experts</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Une question ? Un projet ? Notre équipe française est là pour vous accompagner 
            dans votre réussite en tant que marchand de biens.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-amber-600" />
                    Envoyez-nous un message
                  </CardTitle>
                  <CardDescription>
                    Nous vous répondons généralement sous 2h en jour ouvré
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        Message envoyé !
                      </h3>
                      <p className="text-slate-600">
                        Merci pour votre message. Notre équipe vous recontactera très rapidement.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nom complet *</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Jean Dupont"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="jean@example.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="company">Société</Label>
                          <Input
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="Votre société"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Téléphone</Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="06 12 34 56 78"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="subject">Sujet *</Label>
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">Sélectionnez un sujet</option>
                          <option value="demo">Demande de démo</option>
                          <option value="pricing">Questions tarifaires</option>
                          <option value="features">Questions techniques</option>
                          <option value="support">Support technique</option>
                          <option value="partnership">Partenariat</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="message">Message *</Label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Décrivez votre projet ou votre question..."
                          required
                          rows={6}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                        />
                      </div>

                      <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">
                        Envoyer le message
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              {/* Contact Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations de contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-slate-600">contact@marchndsbiens.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium">Téléphone</p>
                      <p className="text-slate-600">01 23 45 67 89</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-slate-600">
                        75 Avenue des Champs-Élysées<br />
                        75008 Paris, France
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium">Horaires</p>
                      <p className="text-slate-600">
                        Lun-Ven: 9h-18h<br />
                        Sam: 9h-12h
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Options de support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">Support Standard</h3>
                    <p className="text-sm text-green-700">
                      Email • Réponse sous 24h • Plans Starter & Professional
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Support Prioritaire</h3>
                    <p className="text-sm text-blue-700">
                      Email & Téléphone • Réponse sous 2h • Plan Enterprise
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">Support Dédié</h3>
                    <p className="text-sm text-purple-700">
                      Manager dédié • SLA garanti • Formations incluses
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Liens rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <a href="#" className="block text-amber-600 hover:text-amber-700">
                    📚 Documentation API
                  </a>
                  <a href="#" className="block text-amber-600 hover:text-amber-700">
                    🎥 Tutoriels vidéo
                  </a>
                  <a href="#" className="block text-amber-600 hover:text-amber-700">
                    ❓ FAQ complète
                  </a>
                  <a href="#" className="block text-amber-600 hover:text-amber-700">
                    📊 Status système
                  </a>
                  <a href="/app" className="block text-amber-600 hover:text-amber-700">
                    🚀 Accéder à l'application
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-amber-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à transformer votre activité ?
          </h2>
          <p className="text-xl text-amber-100 mb-8">
            Commencez votre essai gratuit dès aujourd'hui et découvrez la différence MarchndsBiens
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => window.location.href = '/app'}>
              Essai gratuit 14 jours
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
                <li><a href="/" className="hover:text-white">Accueil</a></li>
                <li><a href="/#features" className="hover:text-white">Fonctionnalités</a></li>
                <li><a href="/pricing" className="hover:text-white">Tarifs</a></li>
                <li><a href="/app" className="hover:text-white">Accéder à l'App</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Aide</a></li>
                <li><a href="#" className="hover:text-white">Tutoriels</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
                <li><a href="#" className="hover:text-white">API Docs</a></li>
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

export default ContactPage;