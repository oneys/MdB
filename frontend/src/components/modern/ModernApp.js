import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import ModernHomePage from '../../pages/ModernHomePage';
import ModernSidebar from './ModernSidebar';
import ModernDashboard from './ModernDashboard';
import ModernProjectDetail from './ModernProjectDetail';
import ModernProjectForm from './ModernProjectForm';
import { Palette, ArrowLeft } from 'lucide-react';

const ModernApp = ({ onSwitchToClassic }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load projects from API on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const apiProjects = await response.json();
          setProjects(apiProjects);
          console.log(`✅ ${apiProjects.length} projets chargés depuis l'API`);
        } else {
          console.log('⚠️ Échec du chargement des projets depuis l\'API');
          setProjects([]);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des projets:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadProjects();
    }
  }, [user]);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setActiveTab("project-detail");
  };

  const handleProjectUpdate = async (updatedProject) => {
    try {
      // Update local state immediately for responsive UI
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);

      // Make API call to persist changes
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects/${updatedProject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          label: updatedProject.label,
          address: updatedProject.address,
          status: updatedProject.status,
          regime_tva: updatedProject.regime_tva,
          prix_achat_ttc: updatedProject.prix_achat_ttc,
          prix_vente_ttc: updatedProject.prix_vente_ttc,
          travaux_ttc: updatedProject.travaux_ttc,
          frais_agence_ttc: updatedProject.frais_agence_ttc,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.status}`);
      }

      const persistedProject = await response.json();
      console.log(`✅ Projet "${updatedProject.label}" mis à jour en base de données`);
      
      // Update with server response to ensure consistency
      setProjects(prev => prev.map(p => p.id === persistedProject.id ? persistedProject : p));
      if (selectedProject?.id === persistedProject.id) {
        setSelectedProject(persistedProject);
      }
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du projet:', error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  };

  const handleProjectStatusUpdate = async (projectId, newStatus) => {
    try {
      // Update local state immediately
      setProjects(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, status: newStatus, updated_at: new Date().toISOString() }
          : p
      ));

      // Update selected project if it's the one being updated
      if (selectedProject?.id === projectId) {
        setSelectedProject(prev => ({ ...prev, status: newStatus }));
      }

      // Make API call to persist status change
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update project status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Statut du projet mis à jour: ${newStatus}`);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      // Revert the local state change on error
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          const originalProject = prev.find(proj => proj.id === projectId);
          return originalProject || p;
        }
        return p;
      }));
      alert('Erreur lors de la sauvegarde du statut. Veuillez réessayer.');
    }
  };

  const handleProjectCreate = async (newProjectData) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newProjectData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.status}`);
      }

      const createdProject = await response.json();
      setProjects(prev => [createdProject, ...prev]);
      setActiveTab("dashboard");
      console.log(`✅ Projet "${createdProject.label}" créé avec succès`);
      
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error);
      alert('Erreur lors de la création du projet. Veuillez réessayer.');
    }
  };

  const handleBackFromProject = () => {
    setSelectedProject(null);
    setActiveTab("dashboard");
  };

  const handleBackFromForm = () => {
    setActiveTab("dashboard");
  };

  // Show homepage if not authenticated
  if (!user) {
    return <ModernHomePage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement des projets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <ModernSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={logout}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Switch to Classic UI Button */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={onSwitchToClassic}
            className="flex items-center space-x-2 px-4 py-2 bg-white/90 backdrop-blur-md text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 shadow-lg hover:shadow-xl transition-all"
            title="Basculer vers l'interface classique"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Interface classique</span>
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === "dashboard" && (
          <ModernDashboard 
            projects={projects}
            onProjectSelect={handleProjectSelect}
          />
        )}

        {activeTab === "project-detail" && selectedProject && (
          <ModernProjectDetail
            project={selectedProject}
            onBack={handleBackFromProject}
            onProjectUpdate={handleProjectUpdate}
            onProjectStatusUpdate={handleProjectStatusUpdate}
          />
        )}

        {activeTab === "project-form" && (
          <ModernProjectForm
            onBack={handleBackFromForm}
            onProjectCreate={handleProjectCreate}
          />
        )}

        {/* Placeholder for other tabs */}
        {["pipeline", "dataroom", "estimator", "analytics", "calendar", "settings"].includes(activeTab) && (
          <div className="p-8">
            <div className="bg-white rounded-2xl p-16 border border-slate-200 shadow-sm text-center">
              <Palette className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-600 mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <p className="text-slate-500">
                Cette section est en cours de développement dans la nouvelle interface moderne.
              </p>
              <button
                onClick={onSwitchToClassic}
                className="mt-4 px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
              >
                Utiliser l'interface classique
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernApp;