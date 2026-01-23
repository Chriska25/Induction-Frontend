import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import { ActivityData, ContentData, RegistrationData } from './types';
import Section from './components/Section';
import Quiz from './components/Quiz';
import Certificate from './components/Certificate';
import AdminPanel from './components/AdminPanel';
import Registration from './components/Registration';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import InductionList from './components/InductionList';
import UserProfile from './components/UserProfile';
import { getImageUrl } from './utils/imageUrl';
import './App.css';
import './components/Footer.css';
import contentData from './data/content.json';


const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [userName, setUserName] = useState('');
  const [userNameInput, setUserNameInput] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [askAdminCode, setAskAdminCode] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [data, setData] = useState<ContentData>(contentData as ContentData);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [editingModuleMeta, setEditingModuleMeta] = useState<{ title: string, description: string, icon: string } | undefined>(undefined);
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [siteSettings, setSiteSettings] = useState<any>({
    site_name: 'Plateforme de Formation',
    org_name: 'Organisation',
    copyright: '© 2026. Tous droits réservés.',
    site_logo: '',
    site_description: 'Connectez-vous avec votre email professionnel.'
  });

  // Navigation State
  const [currentView, setCurrentView] = useState<'dashboard' | 'course' | 'admin'>('dashboard');

  // Dashboard State - for certificates section
  const [userTrainings, setUserTrainings] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);

  // Exit confirmation popup
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);

  const sections = data.sections;

  useEffect(() => {
    // 1. Initial Local Storage Load
    const savedName = localStorage.getItem('pm13_userName');
    if (savedName) setUserName(savedName);

    const savedAdmin = localStorage.getItem('pm13_is_admin');
    if (savedAdmin === '1') setIsAdmin(true);

    const savedReg = localStorage.getItem('pm13_current_registration');
    let userIdToRefresh: string | null = null;

    if (savedReg) {
      try {
        const parsed = JSON.parse(savedReg);
        if (parsed?.id) {
          setRegistration(parsed);
          if (parsed.fullName) setUserName(parsed.fullName);
          userIdToRefresh = parsed.id;
        }
      } catch (e) {
        localStorage.removeItem('pm13_current_registration');
      }
    }

    // 2. Refresh Logic
    const silentLogout = () => {
      localStorage.removeItem('pm13_userName');
      localStorage.removeItem('pm13_current_registration');
      setRegistration(null);
      setUserName('');
      setCurrentView('dashboard');
    };

    const refreshUser = async (id: string) => {
      try {
        const userData = await api.getUser(id);
        if (userData) {
          const mappedUser = {
            id: userData.id.toString(),
            fullName: userData.full_name,
            email: userData.email,
            jobTitle: userData.job_title,
            organization: userData.organization,
            city: userData.city,
            registeredAt: userData.registered_at,
            role: userData.role
          };
          setRegistration(mappedUser);
          setUserName(mappedUser.fullName);
          localStorage.setItem('pm13_current_registration', JSON.stringify(mappedUser));
        } else {
          silentLogout();
        }
      } catch (e) {
        console.error("Failed to refresh user", e);
      }
    };

    const fetchSettings = async () => {
      try {
        const settingsData = await api.getSettings();
        setSiteSettings((prev: any) => ({ ...prev, ...settingsData }));
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };

    fetchSettings();
    if (userIdToRefresh) refreshUser(userIdToRefresh);
  }, []);

  // Load user trainings and modules when in dashboard view
  useEffect(() => {
    if (currentView === 'dashboard' && registration) {
      const loadDashboardData = async () => {
        try {
          const userId = registration.id;
          console.log('[DEBUG] Fetching dashboard data for userId:', userId);
          const [trainingsData, modulesData] = await Promise.all([
            api.getUserTrainings(userId),
            api.getModules()
          ]);
          setUserTrainings(trainingsData);
          setModules(modulesData);
        } catch (error) {
          console.error('Failed to load dashboard data', error);
        }
      };
      loadDashboardData();
    }
  }, [currentView, registration]);

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleQuizComplete = async (score: number) => {
    setQuizScore(score);
    const entry: ActivityData = {
      registrationId: registration?.id,
      fullName: registration?.fullName || userName || 'Inconnu',
      type: 'quiz',
      score,
      completedAt: new Date().toISOString(),
    };

    if (registration?.id) {
      try {
        await api.saveTraining({ userId: registration.id, type: 'quiz', score, moduleId });
      } catch (err) {
        console.error("Failed to save training result to backend", err);
      }
    }

    const stored = localStorage.getItem('pm13_activity_log');
    let list: ActivityData[] = [];
    if (stored) {
      try {
        list = JSON.parse(stored) as ActivityData[];
      } catch {
        list = [];
      }
    }
    list.push(entry);
    localStorage.setItem('pm13_activity_log', JSON.stringify(list));

    if (score >= 80) {
      if (!userName) {
        setShowNameInput(true);
      } else {
        setShowCertificate(true);
      }
    }
  };

  const handleCertificateComplete = () => {
    setShowCertificate(false);
    setCurrentView('dashboard');
  };

  const handleRegistrationComplete = (reg: RegistrationData) => {
    setRegistration(reg);
    setUserName(reg.fullName);
    localStorage.setItem('pm13_userName', reg.fullName);
    localStorage.setItem('pm13_current_registration', JSON.stringify(reg));
    setCurrentView('dashboard');
  };

  const handleLoginComplete = (reg: RegistrationData) => {
    setRegistration(reg);
    setUserName(reg.fullName);
    localStorage.setItem('pm13_userName', reg.fullName);
    localStorage.setItem('pm13_current_registration', JSON.stringify(reg));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    if (window.confirm("Voulez-vous vraiment vous déconnecter ?")) {
      localStorage.removeItem('pm13_userName');
      localStorage.removeItem('pm13_current_registration');
      setRegistration(null);
      setUserName('');
      setCurrentView('dashboard'); // Will show login/register
    }
  };

  const handleAdminLoginClick = () => {
    if (isAdmin) {
      setIsAdmin(false);
      localStorage.removeItem('pm13_is_admin');
    } else {
      setAskAdminCode(true);
    }
  };

  const handleAdminCodeSubmit = () => {
    if (adminCodeInput === 'PM13ADMIN') {
      setIsAdmin(true);
      localStorage.setItem('pm13_is_admin', '1');
      setAskAdminCode(false);
      setAdminCodeInput('');
    } else {
      alert('Code incorrect');
    }
  };

  const handleCourseSelect = (courseData: ContentData | null, id: string) => {
    if (courseData) {
      setData(courseData);
      setModuleId(id);
      setCurrentSection(0);
      setShowQuiz(false);
      setShowCertificate(false);
      setCurrentView('course');
    }
  };

  const handleBackToDashboard = () => {
    setShowExitConfirm(true);
  };

  const confirmExitCourse = () => {
    setShowExitConfirm(false);
    setCurrentView('dashboard');
  };

  const cancelExitCourse = () => {
    setShowExitConfirm(false);
  };

  const handleSectionClick = (index: number) => {
    setCurrentSection(index);
    setShowQuiz(false);
    setShowCertificate(false);
  };

  const handleContentUpdate = (newData: ContentData) => {
    setData(newData);
    // AdminPanel now handles the API call to update server, including metadata.
    // We just update local state here to reflect changes immediately.
    /*
    if (moduleId) {
      api.updateModule(moduleId, { data: newData })
        .catch(err => console.error("Failed to persist module update", err));
    }
    */
  };

  // Auth Guard
  if (!registration) {
    return (
      <div className="app">
        <div className="app-header">
          {siteSettings.site_logo && (
            <div className="app-logo-container">
              <img src={siteSettings.site_logo} alt="Logo" className="site-logo-main" />
            </div>
          )}
          <h1>{siteSettings.site_name}</h1>
          <p className="app-subtitle">{siteSettings.org_name}</p>
        </div>
        <div className="auth-container">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              Connexion
            </button>
            <button
              className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => setAuthMode('register')}
            >
              Créer un compte
            </button>
          </div>
          {authMode === 'login' ? (
            <Login
              onSelect={handleLoginComplete}
              onNew={() => setAuthMode('register')}
              logo={siteSettings.site_logo}
              description={siteSettings.site_description}
            />
          ) : (
            <Registration onComplete={handleRegistrationComplete} />
          )}
        </div>
        <footer className="site-footer" style={{ textAlign: 'center', padding: '2rem', color: '#666', fontSize: '0.9rem' }}>
          {siteSettings.copyright}
        </footer>
      </div>
    );
  }

  // Logged In - Dashboard View
  if (currentView === 'dashboard') {
    return (
      <div className="app">
        <div className="app-header">
          {siteSettings.site_logo && (
            <div className="app-logo-small">
              <img src={siteSettings.site_logo} alt="Logo" />
            </div>
          )}
          <h1>{siteSettings.site_name}</h1>
          <div className="app-registrant">
            <span>
              Compte : <strong>{registration.fullName}</strong> – {registration.organization}
            </span>
            {(registration.role === 'admin' || isAdmin) && (
              <button
                onClick={() => setCurrentView('admin')}
                className="btn-admin-header"
                style={{
                  marginLeft: '10px',
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  borderRadius: '999px',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                ⚙️ Administration
              </button>
            )}
            <button onClick={handleLogout} className="btn-logout" style={{ marginLeft: '10px' }}>
              Déconnexion
            </button>
          </div>
          <div className="admin-toggle" style={{ marginTop: '1rem' }}>
            {askAdminCode ? (
              <div className="admin-login">
                <input
                  type="password"
                  className="admin-input"
                  placeholder="Code administrateur"
                  value={adminCodeInput}
                  onChange={(e) => setAdminCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminCodeSubmit()}
                />
                <button className="btn-admin-login" onClick={handleAdminCodeSubmit}>
                  Valider
                </button>
                <button
                  className="btn-admin-cancel"
                  onClick={() => setAskAdminCode(false)}
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button className="btn-admin-toggle" onClick={handleAdminLoginClick}>
                {isAdmin ? '🔒 Désactiver le mode édition' : '🛠️ Mode administrateur (édition)'}
              </button>
            )}
          </div>
        </div>

        <div className="app-container">
          <div className="sidebar">
            <h3>Menu Principal</h3>
            <div className="sidebar-section">
              <h4>👤 Profil</h4>
              <div className="user-info" style={{ textAlign: 'center' }}>
                <div
                  className="user-avatar"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    margin: '0 auto 1rem',
                    overflow: 'hidden',
                    border: '3px solid #667eea',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  {(registration as any).profilePhoto ? (
                    <img
                      src={getImageUrl((registration as any).profilePhoto)}
                      alt="Photo de profil"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '2rem',
                      fontWeight: 'bold'
                    }}>
                      {registration.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <p><strong>{registration.fullName}</strong></p>
                <p>{registration.jobTitle}</p>
                <p>{registration.organization}</p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>{registration.email}</p>
                <button
                  onClick={() => setShowProfileModal(true)}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}
                >
                  ✏️ Modifier mon profil
                </button>
              </div>
            </div>

            <div className="sidebar-section">
              <h4>📚 Navigation</h4>
              <ul className="section-nav">
                <li>
                  <button
                    className="nav-item active"
                    onClick={() => setCurrentView('dashboard')}
                  >
                    Mes Formations
                  </button>
                </li>
                {(registration.role === 'admin' || isAdmin) && (
                  <li>
                    <button
                      className="nav-item"
                      onClick={() => setCurrentView('admin')}
                    >
                      Admin Dashboard
                    </button>
                  </li>
                )}
              </ul>
            </div>

            <div className="sidebar-section">
              <h4>📜 Certificats</h4>
              <div className="certificate-list">
                {(() => {
                  const earnedCertificates = modules.filter(module => {
                    const moduleTrainings = userTrainings.filter(t => String(t.module_id) === String(module.id));
                    return moduleTrainings.some(t => t.type === 'quiz' && t.score >= 80);
                  });

                  if (earnedCertificates.length === 0) {
                    return (
                      <p style={{ fontSize: '0.9rem', color: '#999', fontStyle: 'italic', margin: '0.5rem 0' }}>
                        Aucun certificat pour le moment
                      </p>
                    );
                  }

                  return earnedCertificates.map(module => (
                    <div key={module.id} className="certificate-item">
                      <span className="certificate-icon">{module.icon || '📘'}</span>
                      <div className="certificate-info">
                        <span className="certificate-title">{module.title}</span>
                        <span className="certificate-badge">✅ Obtenu</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#fff',
                  border: '1px solid #dc3545',
                  color: '#dc3545',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🚪 Déconnexion
              </button>
            </div>
          </div>

          <div className="main-content">
            <InductionList
              userId={registration.id}
              userName={registration.fullName}
              userRole={isAdmin ? 'admin' : registration.role}
              isAdminMode={isAdmin}
              onAdminClick={() => setCurrentView('admin')}
              onSelect={handleCourseSelect}
            />
          </div>
        </div>
        <footer className="site-footer" style={{ textAlign: 'center', padding: '1.5rem', background: '#fff', borderTop: '1px solid #eee', color: '#666', fontSize: '0.85rem' }}>
          {siteSettings.copyright}
        </footer>

        {showProfileModal && (
          <UserProfile
            user={{
              id: registration.id,
              fullName: registration.fullName,
              email: registration.email,
              jobTitle: registration.jobTitle,
              organization: registration.organization,
              city: registration.city,
              profilePhoto: (registration as any).profilePhoto
            }}
            onUpdate={(updatedUser) => {
              setRegistration(updatedUser);
              setUserName(updatedUser.fullName);
              localStorage.setItem('pm13_current_registration', JSON.stringify(updatedUser));
            }}
            onClose={() => setShowProfileModal(false)}
          />
        )}
      </div>
    );
  }

  if (currentView === 'admin') {
    return (
      <div className="app">
        <AdminDashboard
          onClose={() => setCurrentView('dashboard')}
          onEditModule={(m) => {
            const moduleData = m.data ? JSON.parse(m.data) : null;
            setEditingModuleMeta({ title: m.title, description: m.description, icon: m.icon });
            handleCourseSelect(moduleData, m.id);
            setIsAdmin(true);
          }}
        />
      </div>
    );
  }

  // Logged In - Course View
  return (
    <div className="app">
      <div className="app-header">
        <button onClick={handleBackToDashboard} className="btn-back-dashboard">
          ✕ Quitter la formation
        </button>
        {siteSettings.site_logo && (
          <div className="app-logo-small">
            <img src={siteSettings.site_logo} alt="Logo" />
          </div>
        )}
        <h1>{data.appTitle}</h1>
        <p className="app-subtitle">
          Module d'induction - Durée estimée : 30-45 minutes
        </p>
        {registration && (
          <div className="app-registrant">
            <span>
              Compte : <strong>{registration.fullName}</strong> – {registration.organization} ({registration.city})
            </span>
          </div>
        )}
        <div className="admin-toggle">
          {askAdminCode ? (
            <div className="admin-login">
              <input
                type="password"
                className="admin-input"
                placeholder="Code administrateur"
                value={adminCodeInput}
                onChange={(e) => setAdminCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminCodeSubmit()}
              />
              <button className="btn-admin-login" onClick={handleAdminCodeSubmit}>
                Valider
              </button>
              <button
                className="btn-admin-cancel"
                onClick={() => setAskAdminCode(false)}
              >
                Annuler
              </button>
            </div>
          ) : (
            <button className="btn-admin-toggle" onClick={handleAdminLoginClick}>
              {isAdmin ? 'Désactiver le mode administrateur' : 'Mode administrateur'}
            </button>
          )}
        </div>
      </div>

      <div className="app-container">
        <div className="sidebar">
          <h3>Navigation</h3>
          <ul className="section-nav">
            {sections.map((section, index) => (
              <li key={section.id}>
                <button
                  className={`nav-item ${currentSection === index ? 'active' : ''}`}
                  onClick={() => handleSectionClick(index)}
                >
                  {section.title}
                </button>
              </li>
            ))}
            <li>
              <button
                className={`nav-item ${showQuiz ? 'active' : ''}`}
                onClick={() => {
                  setShowQuiz(true);
                  if (currentSection >= sections.length) {
                    setCurrentSection(sections.length - 1);
                  }
                }}
              >
                Quiz Final
              </button>
            </li>
          </ul>
          <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
            <button
              onClick={handleBackToDashboard}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#fff',
                border: '1px solid #dc3545',
                color: '#dc3545',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ✕ Quitter
            </button>
          </div>
        </div>

        <div className="main-content">
          {showCertificate ? (
            <div className="certificate-view">
              <Certificate
                certificateData={data.certificate}
                userName={userName}
                score={quizScore}
              />
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button className="btn-nav" onClick={handleCertificateComplete}>
                  Retour au tableau de bord
                </button>
              </div>
            </div>
          ) : showQuiz ? (
            <Quiz
              quizData={data.quiz}
              onComplete={handleQuizComplete}
            />
          ) : (
            <>
              {sections[currentSection] ? (
                <Section
                  title={sections[currentSection].title}
                  subtitle={sections[currentSection].subtitle}
                  content={sections[currentSection].content}
                />
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <p>Chargement de la section...</p>
                  <button
                    onClick={() => setCurrentSection(0)}
                    className="btn-nav"
                  >
                    Retour au début
                  </button>
                </div>
              )}

              <div className="navigation-footer">
                {currentSection > 0 && (
                  <button onClick={handlePrevious} className="btn-nav btn-prev">
                    ← Précédent
                  </button>
                )}
                <div className="nav-spacer"></div>
                {currentSection < sections.length - 1 ? (
                  <button onClick={handleNext} className="btn-nav btn-next">
                    Suivant →
                  </button>
                ) : (
                  <button onClick={handleNext} className="btn-nav btn-quiz">
                    Commencer le Quiz →
                  </button>
                )}
              </div>
            </>
          )}

          {isAdmin && (
            <AdminPanel
              moduleId={moduleId}
              initialData={data}
              moduleMetadata={editingModuleMeta}
              onUpdate={handleContentUpdate}
              onClose={() => setIsAdmin(false)}
            />
          )}
        </div>
      </div>

      <footer className="site-footer" style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderTop: '1px solid #eee', color: '#888', fontSize: '0.8rem' }}>
        {siteSettings.copyright}
      </footer>

      {showExitConfirm && (
        <div className="modal-overlay">
          <div className="modal-content exit-confirm-modal">
            <div className="modal-header">
              <h2>⚠️ Quitter la formation ?</h2>
            </div>
            <div className="modal-body">
              <p>Voulez-vous vraiment quitter la formation ?</p>
              <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.95rem' }}>
                Votre progression dans ce module sera sauvegardée jusqu'au dernier quiz.
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={confirmExitCourse} className="btn-confirm-exit">
                Oui, quitter
              </button>
              <button onClick={cancelExitCourse} className="btn-cancel-exit">
                Continuer la formation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
