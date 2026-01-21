import React, { useEffect, useState } from 'react';
import './AdminDashboard.css';
import { api } from '../api/client';

interface AdminUser {
    id: number;
    full_name: string;
    email: string;
    job_title: string;
    organization: string;
    role: string;
    training_count: number;
    last_training_at: string | null;
}

interface TrainingRecord {
    id: number;
    module_id: string;
    module_title?: string;
    type: string;
    score: number;
    completed_at: string;
}

interface Module {
    id: string;
    title: string;
    description: string;
    icon: string;
    created_at: string;
    data?: string;
}

interface ServerLog {
    timestamp: string;
    level: string;
    message: string;
    service?: string;
}

interface AdminDashboardProps {
    onClose: () => void;
    onEditModule?: (module: Module) => void;
}

type AdminTab = 'users' | 'modules' | 'settings' | 'logs';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onEditModule }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [logs, setLogs] = useState<ServerLog[]>([]);
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);

    // Modals state
    const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
    const [userTrainings, setUserTrainings] = useState<TrainingRecord[]>([]);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [auditPassword, setAuditPassword] = useState('');

    // New Items state
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showAddModuleModal, setShowAddModuleModal] = useState(false);
    const [newUser, setNewUser] = useState({ fullName: '', email: '', jobTitle: '', organization: '', city: '', password: '' });
    const [newModule, setNewModule] = useState({ id: '', title: '', description: '', icon: '' });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                try {
                    const response = await fetch('/api/admin/users');
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        setUsers(data);
                    } else {
                        console.warn('API returned non-JSON response for users');
                        setUsers([]); // Fallback to empty array
                    }
                } catch (error) {
                    console.error('Failed to fetch users:', error);
                    setUsers([]); // Fallback to empty array
                }
            } else if (activeTab === 'modules') {
                try {
                    const data = await api.getModules();
                    setModules(data);
                } catch (error) {
                    console.error('Failed to fetch modules:', error);
                    setModules([]); // Fallback to empty array
                }
            } else if (activeTab === 'settings') {
                try {
                    const response = await fetch('/api/settings');
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        setSettings(data);
                    } else {
                        console.warn('API returned non-JSON response for settings');
                        // Fallback to default settings
                        setSettings({
                            site_name: 'Plateforme PM13',
                            org_name: 'ADRA TUDIENZELE',
                            copyright: '© 2026 ADRA TUDIENZELE. Tous droits réservés.',
                            site_description: 'Plateforme de formation en ligne'
                        });
                    }
                } catch (error) {
                    console.error('Failed to fetch settings:', error);
                    // Fallback to default settings
                    setSettings({
                        site_name: 'Plateforme PM13',
                        org_name: 'ADRA TUDIENZELE',
                        copyright: '© 2026 ADRA TUDIENZELE. Tous droits réservés.',
                        site_description: 'Plateforme de formation en ligne'
                    });
                }
            } else if (activeTab === 'logs') {
                try {
                    const response = await fetch('/api/admin/logs');
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        setLogs(data);
                    } else {
                        console.warn('API returned non-JSON response for logs');
                        setLogs([]); // Fallback to empty array
                    }
                } catch (error) {
                    console.error('Failed to fetch logs:', error);
                    setLogs([]); // Fallback to empty array
                }
            }
        } catch (error) {
            console.error('Error in loadData:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            alert("Paramètres enregistrés !");
        } catch (e) {
            alert("Erreur");
        }
    };

    const handleViewDetails = async (user: AdminUser) => {
        setViewingUser(user);
        try {
            const trainings = await api.getUserTrainings(user.id);
            setUserTrainings(trainings);
        } catch (e) {
            console.error(e);
        }
    };

    const handlePromote = async (user: AdminUser) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        try {
            await fetch(`/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            loadData();
        } catch (e) {
            alert("Erreur");
        }
    };

    const handleResetPassword = async () => {
        if (!editingUser || !auditPassword) return;
        try {
            await fetch(`/api/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: auditPassword })
            });
            alert("Mot de passe mis à jour.");
            setEditingUser(null);
            setAuditPassword('');
        } catch (e) {
            alert("Erreur");
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createUser(newUser);
            alert("Utilisateur ajouté !");
            setShowAddUserModal(false);
            setNewUser({ fullName: '', email: '', jobTitle: '', organization: '', city: '', password: '' });
            if (activeTab === 'users') loadData();
        } catch (e) {
            alert("Erreur lors de l'ajout de l'utilisateur");
        }
    };

    const handleAddModule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createModule(newModule);
            alert("Formation ajoutée !");
            setShowAddModuleModal(false);
            setNewModule({ id: '', title: '', description: '', icon: '' });
            if (activeTab === 'modules') loadData();
        } catch (e) {
            alert("Erreur lors de l'ajout de la formation");
        }
    };

    const handleDeleteModule = async (id: string) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette formation ?")) return;
        try {
            await api.deleteModule(id);
            loadData();
        } catch (e) {
            alert("Erreur");
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await api.uploadImage(file);
            setSettings({ ...settings, site_logo: res.path });
        } catch (e) {
            alert("Erreur d'upload");
        }
    };

    return (
        <div className="admin-dashboard-page">
            <div className="admin-dashboard-header">
                <div className="header-title">
                    <h1>Administration du Système</h1>
                    <p>Gestion globale de la plateforme PM13</p>
                </div>
                <button onClick={onClose} className="btn-close-admin">Fermer</button>
            </div>

            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👤 Utilisateurs
                </button>
                <button
                    className={`tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
                    onClick={() => setActiveTab('modules')}
                >
                    📚 Formations
                </button>
                <button
                    className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Paramètres
                </button>
                <button
                    className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                >
                    📜 Logs Système
                </button>
            </div>

            <div className="admin-actions-bar">
                {activeTab === 'users' && (
                    <button className="btn-add-item" onClick={() => setShowAddUserModal(true)}>
                        ➕ Ajouter un Utilisateur
                    </button>
                )}
                {activeTab === 'modules' && (
                    <button className="btn-add-item" onClick={() => setShowAddModuleModal(true)}>
                        ➕ Ajouter une Formation
                    </button>
                )}
            </div>

            {/* Warning Banner for API Issues */}
            {(users.length === 0 && activeTab === 'users') || (Object.keys(settings).length <= 4 && activeTab === 'settings') ? (
                <div style={{
                    margin: '1rem 2rem',
                    padding: '1rem',
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    color: '#856404'
                }}>
                    <strong>⚠️ Mode Dégradé</strong>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                        Certaines données ne peuvent pas être chargées actuellement en raison d'un problème de configuration serveur.
                        Les fonctionnalités de base restent disponibles. Le problème sera résolu prochainement.
                    </p>
                </div>
            ) : null}

            <div className="admin-tab-content">
                {loading ? (
                    <div className="loading-state">Chargement des données...</div>
                ) : (
                    <>
                        {activeTab === 'users' && (
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Utilisateur</th>
                                            <th>Email</th>
                                            <th>Rôle</th>
                                            <th>Activités</th>
                                            <th>Dernière activité</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className="user-info-cell">
                                                        <strong>{user.full_name}</strong>
                                                        <span>{user.job_title}</span>
                                                    </div>
                                                </td>
                                                <td>{user.email}</td>
                                                <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                                                <td>{user.training_count} sessions</td>
                                                <td>{user.last_training_at ? new Date(user.last_training_at).toLocaleDateString() : '-'}</td>
                                                <td>
                                                    <button onClick={() => handleViewDetails(user)} className="action-icon" title="Détails">👁️</button>
                                                    <button onClick={() => handlePromote(user)} className="action-icon" title="Changer Rôle">🔄</button>
                                                    <button onClick={() => setEditingUser(user)} className="action-icon" title="Password">🔑</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'modules' && (
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Icône</th>
                                            <th>Titre de la Formation</th>
                                            <th>ID</th>
                                            <th>Description</th>
                                            <th>Créé le</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modules.map(module => (
                                            <tr key={module.id}>
                                                <td className="module-icon-cell">
                                                    {module.icon && (module.icon.startsWith('http') || module.icon.startsWith('/')) ? (
                                                        <img src={module.icon} alt="icon" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                                    ) : (
                                                        module.icon
                                                    )}
                                                </td>
                                                <td><strong>{module.title}</strong></td>
                                                <td><code>{module.id}</code></td>
                                                <td>{module.description}</td>
                                                <td>{new Date(module.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <button onClick={() => onEditModule?.(module)} className="action-icon" title="Éditer">✏️</button>
                                                    <button onClick={() => handleDeleteModule(module.id)} className="action-icon" title="Supprimer">🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="settings-container">
                                <form onSubmit={handleUpdateSettings} className="admin-form">
                                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#1a1a2e' }}>🏢 Informations Générales</h3>

                                    <div className="form-group">
                                        <label>Nom de la Plateforme</label>
                                        <input
                                            type="text"
                                            value={settings.site_name || ''}
                                            onChange={e => setSettings({ ...settings, site_name: e.target.value })}
                                            placeholder="Ex: Plateforme de Formation PM13"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Organisation</label>
                                        <input
                                            type="text"
                                            value={settings.org_name || ''}
                                            onChange={e => setSettings({ ...settings, org_name: e.target.value })}
                                            placeholder="Ex: ADRA TUDIENZELE"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Description du site</label>
                                        <textarea
                                            value={settings.site_description || ''}
                                            onChange={e => setSettings({ ...settings, site_description: e.target.value })}
                                            placeholder="Texte affiché sur la page de connexion"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>URL du site</label>
                                        <input
                                            type="url"
                                            value={settings.site_url || ''}
                                            onChange={e => setSettings({ ...settings, site_url: e.target.value })}
                                            placeholder="https://votre-domaine.com"
                                        />
                                        <p className="help-text">URL complète de votre site (utilisée pour les liens dans les emails)</p>
                                    </div>

                                    <div className="form-group">
                                        <label>Email de contact</label>
                                        <input
                                            type="email"
                                            value={settings.contact_email || ''}
                                            onChange={e => setSettings({ ...settings, contact_email: e.target.value })}
                                            placeholder="contact@votre-organisation.org"
                                        />
                                        <p className="help-text">Email affiché pour le support et les questions</p>
                                    </div>

                                    <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #eee' }} />
                                    <h3 style={{ marginBottom: '1.5rem', color: '#1a1a2e' }}>🌍 Localisation</h3>

                                    <div className="form-group">
                                        <label>Langue par défaut</label>
                                        <select
                                            value={settings.default_language || 'fr'}
                                            onChange={e => setSettings({ ...settings, default_language: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
                                        >
                                            <option value="fr">Français</option>
                                            <option value="en">English</option>
                                            <option value="es">Español</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Fuseau horaire</label>
                                        <select
                                            value={settings.timezone || 'Africa/Kinshasa'}
                                            onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem' }}
                                        >
                                            <option value="Africa/Kinshasa">Afrique/Kinshasa (GMT+1)</option>
                                            <option value="Africa/Lubumbashi">Afrique/Lubumbashi (GMT+2)</option>
                                            <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                                            <option value="UTC">UTC (GMT+0)</option>
                                        </select>
                                    </div>

                                    <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #eee' }} />
                                    <h3 style={{ marginBottom: '1.5rem', color: '#1a1a2e' }}>🔒 Sécurité & Accès</h3>

                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={settings.allow_public_registration === 'true' || settings.allow_public_registration === true}
                                                onChange={e => setSettings({ ...settings, allow_public_registration: e.target.checked ? 'true' : 'false' })}
                                                style={{ width: 'auto' }}
                                            />
                                            Autoriser l'inscription publique
                                        </label>
                                        <p className="help-text">Si désactivé, seuls les administrateurs peuvent créer des comptes</p>
                                    </div>

                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={settings.require_email_verification === 'true' || settings.require_email_verification === true}
                                                onChange={e => setSettings({ ...settings, require_email_verification: e.target.checked ? 'true' : 'false' })}
                                                style={{ width: 'auto' }}
                                            />
                                            Vérification email obligatoire
                                        </label>
                                        <p className="help-text">Les nouveaux utilisateurs doivent vérifier leur email</p>
                                    </div>

                                    <div className="form-group">
                                        <label>Durée de session (minutes)</label>
                                        <input
                                            type="number"
                                            min="15"
                                            max="1440"
                                            value={settings.session_duration || '480'}
                                            onChange={e => setSettings({ ...settings, session_duration: e.target.value })}
                                        />
                                        <p className="help-text">Temps avant déconnexion automatique (15 min - 24h)</p>
                                    </div>

                                    <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #eee' }} />
                                    <h3 style={{ marginBottom: '1.5rem', color: '#1a1a2e' }}>🎨 Apparence</h3>

                                    <div className="form-group">
                                        <label>Copyright (Pied de page)</label>
                                        <input
                                            type="text"
                                            value={settings.copyright || ''}
                                            onChange={e => setSettings({ ...settings, copyright: e.target.value })}
                                            placeholder="© 2026 ADRA TUDIENZELE. Tous droits réservés."
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Couleur principale (thème)</label>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <input
                                                type="color"
                                                value={settings.primary_color || '#1a1a2e'}
                                                onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                                                style={{ width: '60px', height: '40px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}
                                            />
                                            <input
                                                type="text"
                                                value={settings.primary_color || '#1a1a2e'}
                                                onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                                                placeholder="#1a1a2e"
                                                style={{ flex: 1 }}
                                            />
                                        </div>
                                        <p className="help-text">Couleur utilisée pour les boutons et éléments principaux</p>
                                    </div>

                                    <div className="form-group">
                                        <label>Logo du site</label>
                                        <div className="logo-upload-zone">
                                            {settings.site_logo && (
                                                <div className="current-logo-preview">
                                                    <img src={settings.site_logo} alt="Logo" />
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                            />
                                            <p className="help-text">Le logo apparaîtra sur la page d'accueil et de connexion.</p>
                                        </div>
                                    </div>

                                    <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid #eee' }} />
                                    <h3 style={{ marginBottom: '1.5rem', color: '#1a1a2e' }}>📊 Statistiques & Rapports</h3>

                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={settings.enable_analytics === 'true' || settings.enable_analytics === true}
                                                onChange={e => setSettings({ ...settings, enable_analytics: e.target.checked ? 'true' : 'false' })}
                                                style={{ width: 'auto' }}
                                            />
                                            Activer les statistiques détaillées
                                        </label>
                                        <p className="help-text">Collecte des données d'utilisation pour les rapports</p>
                                    </div>

                                    <div className="form-group">
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={settings.auto_backup === 'true' || settings.auto_backup === true}
                                                onChange={e => setSettings({ ...settings, auto_backup: e.target.checked ? 'true' : 'false' })}
                                                style={{ width: 'auto' }}
                                            />
                                            Sauvegarde automatique quotidienne
                                        </label>
                                        <p className="help-text">Sauvegarde automatique de la base de données chaque jour</p>
                                    </div>

                                    <button type="submit" className="btn-save-settings" style={{ marginTop: '2rem' }}>💾 Enregistrer tous les paramètres</button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'logs' && (
                            <div className="logs-container">
                                <div className="logs-viewer">
                                    {logs.map((log, i) => (
                                        <div key={i} className={`log-line ${log.level}`}>
                                            <span className="log-time">{log.timestamp}</span>
                                            <span className="log-level">[{log.level}]</span>
                                            <span className="log-msg">{log.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* User Details Modal with Certificate Logic */}
            {viewingUser && (
                <div className="modal-overlay">
                    <div className="modal-content wide">
                        <div className="modal-header">
                            <h2>Activités de {viewingUser.full_name}</h2>
                            <button onClick={() => setViewingUser(null)} className="btn-close-modal">✕</button>
                        </div>
                        <div className="user-detail-grid">
                            <div className="sessions-list">
                                <h3>Sessions de formation</h3>
                                {userTrainings.length === 0 ? <p>Aucune activité enregistrée</p> : (
                                    <div className="trainings-scroll">
                                        {userTrainings.map(t => (
                                            <div key={t.id} className="training-card-admin">
                                                <div className="t-head">
                                                    <strong>{t.module_title || t.module_id}</strong>
                                                    <span className={`t-type ${t.type}`}>{t.type}</span>
                                                </div>
                                                <div className="t-body">
                                                    <span>Score: {t.score}%</span>
                                                    <span>Date: {new Date(t.completed_at).toLocaleString()}</span>
                                                </div>
                                                {t.type === 'quiz' && t.score >= 80 && (
                                                    <div className="cert-badge">🎓 Certifié</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Réinitialiser MDP: {editingUser.full_name}</h2>
                        <div className="form-group">
                            <label>Nouveau mot de passe</label>
                            <input
                                type="text"
                                value={auditPassword}
                                onChange={e => setAuditPassword(e.target.value)}
                                placeholder="Entrer le nouveau mot de passe"
                            />
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleResetPassword} className="btn-save">Valider</button>
                            <button onClick={() => setEditingUser(null)} className="btn-cancel">Annuler</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Ajouter un Utilisateur</h2>
                            <button onClick={() => setShowAddUserModal(false)} className="btn-close-modal">✕</button>
                        </div>
                        <form onSubmit={handleAddUser} className="admin-form">
                            <div className="form-group">
                                <label>Nom Complet</label>
                                <input required type="text" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input required type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Mot de passe</label>
                                <input required type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Fonction</label>
                                <input type="text" value={newUser.jobTitle} onChange={e => setNewUser({ ...newUser, jobTitle: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Organisation</label>
                                <input type="text" value={newUser.organization} onChange={e => setNewUser({ ...newUser, organization: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Ville</label>
                                <input type="text" value={newUser.city} onChange={e => setNewUser({ ...newUser, city: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-save">Créer l'utilisateur</button>
                                <button type="button" onClick={() => setShowAddUserModal(false)} className="btn-cancel">Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Module Modal */}
            {showAddModuleModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Ajouter une Formation</h2>
                            <button onClick={() => setShowAddModuleModal(false)} className="btn-close-modal">✕</button>
                        </div>
                        <form onSubmit={handleAddModule} className="admin-form">
                            <div className="form-group">
                                <label>ID Unique (ex: se-module)</label>
                                <input required type="text" placeholder="Slug sans espaces" value={newModule.id} onChange={e => setNewModule({ ...newModule, id: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Titre de la Formation</label>
                                <input required type="text" value={newModule.title} onChange={e => setNewModule({ ...newModule, title: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={newModule.description} onChange={e => setNewModule({ ...newModule, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Icône (Emoji)</label>
                                <input type="text" placeholder="📘" value={newModule.icon} onChange={e => setNewModule({ ...newModule, icon: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn-save">Créer la formation</button>
                                <button type="button" onClick={() => setShowAddModuleModal(false)} className="btn-cancel">Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
