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
import UserDashboard from './components/UserDashboard';
import VerifyEmail from './components/VerifyEmail';
import VerifyCertificate from './components/VerifyCertificate';
import { getImageUrl } from './utils/imageUrl';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import './components/Footer.css';
import './components/Auth.css';
import './App.css';
import contentData from './data/content.json';


const App: React.FC = () => {
  // Simple routing for email verification
  if (window.location.pathname === '/verify-email') {
    return <VerifyEmail />;
  }
  if (window.location.pathname.startsWith('/verify-certificate')) {
    return <VerifyCertificate />;
  }
  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [userName, setUserName] = useState('');

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
  const [currentView, setCurrentView] = useState<'dashboard' | 'course' | 'admin' | 'user_dashboard'>('dashboard');

  // Dashboard State - for certificates section
  const [userTrainings, setUserTrainings] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);

  // Exit confirmation popup
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Auto-print certificate when opened from sidebar
  const [autoPrintCertificate, setAutoPrintCertificate] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('pm13_dark_mode') === 'true';
  });

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
          const mappedUser: RegistrationData = {
            id: userData.id.toString(),
            fullName: userData.full_name,
            email: userData.email,
            jobTitle: userData.job_title,
            organization: userData.organization,
            city: userData.city,
            registeredAt: userData.registered_at,
            role: userData.role,
            profilePhoto: userData.profile_photo
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

        // Nettoyage global
        const cleanSettings = { ...settingsData };
        const fieldsToClean = ['site_name', 'org_name', 'site_description'];

        fieldsToClean.forEach(field => {
          if (cleanSettings[field] && (cleanSettings[field].includes('supabase.co') || cleanSettings[field].includes('http'))) {
            if (field === 'site_name') cleanSettings[field] = 'Plateforme de Formation TUDIENZELE';
            if (field === 'org_name') cleanSettings[field] = 'ADRA';
            if (field === 'site_description') cleanSettings[field] = 'Module d\'induction et de formation continue.';
          }
        });

        setSiteSettings((prev: any) => ({ ...prev, ...cleanSettings }));

        // APPLIQUER LES COULEURS DYNAMIQUEMENT
        const root = document.documentElement;
        if (cleanSettings.primary_color) root.style.setProperty('--primary-color', cleanSettings.primary_color);

        // Background App
        if (cleanSettings.background_color_start) root.style.setProperty('--bg-start', cleanSettings.background_color_start);
        if (cleanSettings.background_color_middle) root.style.setProperty('--bg-middle', cleanSettings.background_color_middle);
        if (cleanSettings.background_color_end) root.style.setProperty('--bg-end', cleanSettings.background_color_end);

        // Background Login
        if (cleanSettings.login_bg_color_1) root.style.setProperty('--login-bg-1', cleanSettings.login_bg_color_1);
        if (cleanSettings.login_bg_color_2) root.style.setProperty('--login-bg-2', cleanSettings.login_bg_color_2);
        if (cleanSettings.login_bg_color_3) root.style.setProperty('--login-bg-3', cleanSettings.login_bg_color_3);
        if (cleanSettings.login_bg_color_4) root.style.setProperty('--login-bg-4', cleanSettings.login_bg_color_4);

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

  // Reset autoPrintCertificate after it's been used
  useEffect(() => {
    if (autoPrintCertificate && showCertificate) {
      // Reset after a delay to ensure the print dialog has opened
      const timer = setTimeout(() => {
        setAutoPrintCertificate(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoPrintCertificate, showCertificate]);

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
      setShowCertificate(true);
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
      <div className="app auth-page" style={{
        background: `linear-gradient(-45deg, var(--login-bg-1, #667eea), var(--login-bg-2, #764ba2), var(--login-bg-3, #f093fb), var(--login-bg-4, #4facfe))`,
        backgroundSize: '400% 400%',
        animation: 'gradientBG 15s ease infinite'
      }}>
        <div className="auth-header">
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
            {siteSettings.allow_registration === 'true' && (
              <button
                className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => setAuthMode('register')}
              >
                Créer un compte
              </button>
            )}
          </div>
          {authMode === 'login' ? (
            <Login
              onSelect={handleLoginComplete}
              onNew={() => setAuthMode('register')}
              logo={siteSettings.site_logo}
              description={siteSettings.site_description}
              allowRegistration={siteSettings.allow_registration === 'true'}
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
  if (currentView === 'dashboard' || currentView === 'user_dashboard') {
    return (
      <div className={`app dashboard-theme ${isDarkMode ? 'dark-mode' : ''}`} style={{
        minHeight: '100vh',
        background: isDarkMode
          ? '#1a202c'
          : 'linear-gradient(135deg, var(--bg-start, #667eea) 0%, var(--bg-middle, #764ba2) 50%, var(--bg-end, #fef3c7) 100%)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div className="app-header" style={{
          padding: '2.5rem 1rem 1.5rem',
          textAlign: 'center',
          color: 'white',
          background: 'transparent',
          border: 'none',
          boxShadow: 'none'
        }}>
          {siteSettings.site_logo && (
            <div style={{ marginBottom: '1.2rem' }}>
              <img
                src={getImageUrl(siteSettings.site_logo)}
                alt="Logo"
                style={{ maxHeight: '70px', maxWidth: '200px', objectFit: 'contain' }}
              />
            </div>
          )}
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-2px', textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {siteSettings.site_name || 'Plateforme de Formation TUDIENZELE'}
          </h1>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '0.6rem 1.8rem',
              borderRadius: '50px',
              fontSize: '1rem',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              Compte : <strong>{registration.fullName}</strong> – {registration.organization}
            </div>

            {(registration.role === 'admin' || isAdmin) && (
              <button
                onClick={() => setCurrentView('admin')}
                style={{
                  padding: '0.6rem 1.8rem',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  color: 'white',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  backdropFilter: 'blur(15px)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}
              >
                ⚙️ Administration
              </button>
            )}

            <button
              onClick={() => {
                const newMode = !isDarkMode;
                setIsDarkMode(newMode);
                localStorage.setItem('pm13_dark_mode', String(newMode));
              }}
              style={{
                padding: '0.6rem 1.8rem',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                color: 'white',
                borderRadius: '50px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                backdropFilter: 'blur(15px)',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
            >
              {isDarkMode ? '☀️ Mode Jour' : '🌙 Mode Nuit'}
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: '0.6rem 1.8rem',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                color: 'white',
                borderRadius: '50px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                backdropFilter: 'blur(15px)',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
            >
              Déconnexion
            </button>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            {askAdminCode ? (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem' }}>
                <input
                  type="password"
                  style={{ padding: '0.6rem 1.5rem', borderRadius: '50px', border: 'none', width: '220px', boxShadow: '0 8px 25px rgba(0,0,0,0.2)' }}
                  placeholder="Code de sécurité"
                  value={adminCodeInput}
                  onChange={(e) => setAdminCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminCodeSubmit()}
                />
                <button
                  onClick={handleAdminCodeSubmit}
                  style={{ padding: '0.6rem 2rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: '800' }}
                >
                  Valider
                </button>
                <button
                  onClick={() => setAskAdminCode(false)}
                  style={{ padding: '0.6rem 2rem', background: '#9ca3af', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: '800' }}
                >
                  Annuler
                </button>
              </div>
            ) : (
              /* Only show the "Edit Mode" button if user is ACTUALLY an admin or trainer role */
              (registration.role === 'admin' || registration.role === 'trainer') ? (
                !isAdmin && (
                  <button
                    onClick={handleAdminLoginClick}
                    className="admin-login-btn"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Activer le mode édition
                  </button>
                )
              ) : null
            )}

            {isAdmin && (
              <div style={{ marginTop: '0.5rem', color: '#10b981', fontWeight: 'bold' }}>
                ✍️ Mode Édition Activé
              </div>
            )}
          </div>
        </div>

        <div className="app-container" style={{
          display: 'flex',
          flex: 1,
          padding: '1.5rem 3rem 3rem',
          gap: '3rem',
          maxWidth: '1600px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* SIDEBAR */}
          <div className="sidebar" style={{
            width: '350px',
            background: 'white',
            borderRadius: '30px',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2.5rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            height: 'fit-content'
          }}>
            <h3 style={{ margin: 0, color: '#1a5490', fontSize: '1.4rem', fontWeight: 800, borderBottom: '2px solid #f0f4f8', paddingBottom: '0.8rem' }}>
              Menu Principal
            </h3>

            <div className="sidebar-section">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#4a5568', margin: '0 0 1.2rem', fontSize: '1.1rem' }}>
                👤 Profil
              </h4>
              <div className="user-info" style={{ textAlign: 'left' }}>
                <div
                  onClick={() => setShowProfileModal(true)}
                  style={{
                    width: 90, height: 90, borderRadius: '24px', overflow: 'hidden',
                    marginBottom: '1.2rem', border: '3px solid #667eea',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {(registration as any).profilePhoto ? (
                    <img src={getImageUrl((registration as any).profilePhoto)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold'
                    }}>
                      {registration.fullName.charAt(0)}
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '0.6rem',
                    textAlign: 'center', padding: '2px 0', fontWeight: 800
                  }}>MODIFIER</div>
                </div>
                <p style={{ margin: '0 0 0.3rem', fontWeight: 800, color: '#1a202c', fontSize: '1.2rem' }}>{registration.fullName}</p>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#718096', lineHeight: 1.4 }}>{registration.jobTitle}</p>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#718096' }}>{registration.organization}</p>
                <p style={{ margin: '0.8rem 0 1rem', fontSize: '0.85rem', color: '#a0aec0', fontStyle: 'italic' }}>{registration.email}</p>

                <button
                  onClick={() => setShowProfileModal(true)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                  }}
                >
                  ✏️ Modifier mon profil
                </button>
              </div>
            </div>

            <div className="sidebar-section">
              <h4 style={{ color: '#4a5568', margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>🚀 Espace Personnel</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="sidebar-nav-btn"
                  style={{
                    width: '100%', padding: '1.1rem 1.4rem', textAlign: 'left',
                    background: (currentView as string) === 'dashboard' ? 'linear-gradient(135deg, #1a5490, #2c7bb6)' : '#f8fafc',
                    color: (currentView as string) === 'dashboard' ? 'white' : '#4a5568',
                    border: (currentView as string) === 'dashboard' ? 'none' : '1px solid #e2e8f0',
                    borderRadius: '18px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: (currentView as string) === 'dashboard' ? '0 10px 20px rgba(26, 84, 144, 0.2)' : 'none',
                    fontSize: '1rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex', alignItems: 'center', gap: '12px'
                  }}
                >
                  <span style={{ fontSize: '1.3rem' }}>🏠</span> ACCUEIL
                </button>
                <button
                  onClick={() => setCurrentView('user_dashboard')}
                  className="sidebar-nav-btn"
                  style={{
                    width: '100%', padding: '1.1rem 1.4rem', textAlign: 'left',
                    background: (currentView as string) === 'user_dashboard' ? 'linear-gradient(135deg, #1a5490, #2c7bb6)' : '#f8fafc',
                    color: (currentView as string) === 'user_dashboard' ? 'white' : '#4a5568',
                    border: (currentView as string) === 'user_dashboard' ? 'none' : '1px solid #e2e8f0',
                    borderRadius: '18px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: (currentView as string) === 'user_dashboard' ? '0 10px 20px rgba(26, 84, 144, 0.2)' : 'none',
                    fontSize: '1rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex', alignItems: 'center', gap: '12px'
                  }}
                >
                  <span style={{ fontSize: '1.3rem' }}>📊</span> STATISTIQUES DÉTAILLÉES
                </button>
                {(registration.role === 'admin' || isAdmin) && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="sidebar-nav-btn admin"
                    style={{
                      width: '100%', padding: '1.1rem 1.4rem', textAlign: 'left',
                      background: (currentView as string) === 'admin' ? 'linear-gradient(135deg, #be185d, #ec4899)' : '#fff5f7',
                      color: (currentView as string) === 'admin' ? 'white' : '#be185d',
                      border: (currentView as string) === 'admin' ? 'none' : '1px solid #fbcfe8',
                      borderRadius: '18px', fontWeight: 800, cursor: 'pointer',
                      fontSize: '1rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: (currentView as string) === 'admin' ? '0 10px 20px rgba(190, 24, 93, 0.2)' : 'none',
                      display: 'flex', alignItems: 'center', gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '1.3rem' }}>⚙️</span> ADMIN PANEL
                  </button>
                )}
              </div>
            </div>

            <div className="sidebar-section">
              <h4 style={{ color: '#4a5568', margin: '0 0 1.2rem', fontSize: '1.1rem' }}>📜 Mes Certificats</h4>
              <div className="certificate-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(() => {
                  const earnedCertificates = modules.filter(module => {
                    const moduleTrainings = userTrainings.filter(t => String(t.module_id) === String(module.id));
                    return moduleTrainings.some(t =>
                      (t.status === 'quiz' || t.type === 'quiz') &&
                      (t.progress >= 80 || (t.score !== undefined && t.score >= 80))
                    );
                  });

                  if (earnedCertificates.length === 0) {
                    return <p style={{ fontSize: '0.9rem', color: '#cbd5e0', fontStyle: 'italic', textAlign: 'center' }}>Aucun certificat obtenu</p>;
                  }

                  return earnedCertificates.map(module => (
                    <div
                      key={module.id}
                      onClick={() => {
                        const moduleData = module.data ? (typeof module.data === 'string' ? JSON.parse(module.data) : module.data) : null;
                        if (moduleData) {
                          // Récupérer le meilleur score pour ce module
                          const moduleTrainings = userTrainings.filter(t => String(t.module_id) === String(module.id));
                          const quizTrainings = moduleTrainings.filter(t => t.type === 'quiz' && t.score !== undefined);
                          const bestScore = quizTrainings.length > 0 ? Math.max(...quizTrainings.map(t => t.score)) : 80;

                          setData(moduleData);
                          setModuleId(module.id);
                          setQuizScore(bestScore); // Définir le score pour l'affichage du certificat
                          setCurrentView('course');
                          setShowCertificate(true);
                          setShowQuiz(false);
                          setCurrentSection(0);
                          setAutoPrintCertificate(true); // Activer l'auto-impression
                        }
                      }}
                      style={{
                        padding: '0.8rem',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(5px)';
                        e.currentTarget.style.borderColor = '#667eea';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', background: '#e0efff', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {(module.icon && (module.icon.startsWith('http') || module.icon.includes('/storage/'))) ? (
                          <img src={module.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          module.icon || '🎓'
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a5490', lineHeight: 1.2 }}>{module.title}</div>
                        <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>Ouvrir & Télécharger</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                marginTop: 'auto', padding: '1rem', background: '#fff',
                color: '#e53e3e', border: '2px solid #fed7d7', borderRadius: '16px',
                fontWeight: 800, cursor: 'pointer', fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}
            >
              🚪 Déconnexion
            </button>
          </div>

          {/* MAIN CONTENT Area */}
          <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {currentView === 'user_dashboard' ? (
              <UserDashboard
                user={registration}
                trainings={userTrainings}
                modules={modules}
                onBack={() => setCurrentView('dashboard')}
                onSelectModule={(m) => {
                  const moduleData = m.data ? (typeof m.data === 'string' ? JSON.parse(m.data) : m.data) : null;
                  handleCourseSelect(moduleData, m.id);
                }}
              />
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
                  <h2 style={{ fontSize: '4.2rem', fontWeight: 900, margin: '0 0 0.8rem', letterSpacing: '-2px', textShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                    Bienvenue, {registration.fullName.split(' ')[0]}
                  </h2>
                  <p style={{ opacity: 0.95, fontSize: '1.5rem', fontWeight: 500, letterSpacing: '0.5px' }}>
                    Veuillez sélectionner votre module de formation
                  </p>
                </div>

                <InductionList
                  userId={registration.id}
                  userName={registration.fullName}
                  userRole={isAdmin ? 'admin' : registration.role}
                  isAdminMode={isAdmin}
                  onAdminClick={() => setCurrentView('admin')}
                  onSelect={handleCourseSelect}
                />
              </>
            )}
          </div>
        </div>
        <footer style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{
            background: 'white',
            padding: '1rem 3.5rem',
            borderRadius: '50px',
            display: 'inline-block',
            color: '#4a5568',
            fontWeight: 700,
            fontSize: '0.95rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            letterSpacing: '0.5px'
          }}>
            {siteSettings.copyright}
          </div>
        </footer>

        {showProfileModal && registration && (
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
      </div >
    );
  }

  if (currentView === 'admin') {
    return (
      <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
        <Toaster position="top-center" toastOptions={{
          style: {
            background: isDarkMode ? '#1a202c' : '#333',
            color: '#fff',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        }} />
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
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
      }} />
      <div className="app-header">
        <button onClick={handleBackToDashboard} className="btn-back-dashboard">
          ✕ Quitter la formation
        </button>
        <div className="app-header-content">
          {siteSettings.site_logo && (
            <div className="app-logo-center">
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
        </div>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="app-container"
      >
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
                autoPrint={autoPrintCertificate}
                moduleId={data.appTitle}
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
      </motion.div>

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
