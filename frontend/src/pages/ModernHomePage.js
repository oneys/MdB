import React from 'react';
import { ArrowRight, Play, BarChart3, Users, Zap, Shield } from 'lucide-react';

const ModernHomePage = () => {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="https://customer-assets.emergentagent.com/job_b81ae64c-2fe6-4bdc-ba5d-5856c5d34670/artifacts/vqhmqsxn_bg%20video%20mdb.mp4" type="video/mp4" />
        </video>
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-slate-900/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="bg-white/90 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">MDB</span>
                </div>
                <span className="text-slate-800 font-semibold text-xl">MarchandsBiens</span>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-slate-600 hover:text-violet-600 font-medium transition-colors">
                  Fonctionnalités
                </a>
                <a href="#pricing" className="text-slate-600 hover:text-violet-600 font-medium transition-colors">
                  Pricing
                </a>
                <a href="#faq" className="text-slate-600 hover:text-violet-600 font-medium transition-colors">
                  FAQ
                </a>
                <button className="text-slate-600 hover:text-violet-600 font-medium transition-colors">
                  Connexion
                </button>
                <button 
                  onClick={() => window.location.href = '/app'}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Accès au Dashboard
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex items-center min-h-screen px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Heading */}
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                <span className="block">Décisions</span>
                <span className="block bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                  Go/No Go
                </span>
                <span className="block text-4xl md:text-5xl">en moins de 15 minutes</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-200 max-w-3xl mx-auto leading-relaxed">
                La plateforme SaaS dédiée aux marchands de biens pour optimiser vos investissements immobiliers 
                avec des analyses financières précises et une gestion de projets centralisée.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button 
                onClick={() => window.location.href = '/app'}
                className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center gap-2 transition-all shadow-2xl hover:shadow-violet-500/25 transform hover:-translate-y-1"
              >
                <Play className="h-5 w-5" />
                Lancer un projet
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-lg border border-white/20 transition-all hover:border-white/40">
                Voir la démo
              </button>
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="bg-gradient-to-br from-violet-500 to-violet-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Analyse Financière</h3>
                <p className="text-slate-300 text-sm">
                  Calculs automatiques du TRI, TVA sur marge, et optimisation fiscale
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Gestion Centralisée</h3>
                <p className="text-slate-300 text-sm">
                  Pipeline Kanban, dataroom, et suivi temps réel de vos projets
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Décisions Rapides</h3>
                <p className="text-slate-300 text-sm">
                  Estimations instantanées et aide à la décision d'investissement
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernHomePage;