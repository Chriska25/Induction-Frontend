import React, { useEffect, useState, useMemo } from 'react';
import './AdminDashboard.css';
import { api } from '../api/client';
import HelpGuide from './HelpGuide';

interface AdminUser {
    id: number;
    full_name: string;
    email: string;
    job_title: string;
    organization: string;
    role: string;
    training_count: number;
    last_training_at: string | null;
    registered_at?: string;
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

interface CustomRole {
    id: string;
    name: string;
    description: string;
    color: string;
    permissions: string[];
}

interface AdminDashboardProps {
    onClose: () => void;
    onEditModule?: (module: Module) => void;
}

type AdminTab = 'overview' | 'users' | 'modules' | 'roles' | 'settings' | 'logs' | 'help';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onEditModule }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [logs, setLogs] = useState<ServerLog[]>([]);
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals state
    const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
    const [userTrainings, setUserTrainings] = useState<TrainingRecord[]>([]);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [auditPassword, setAuditPassword] = useState('');

    // New Items state
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showAddModuleModal, setShowAddModuleModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [newUser, setNewUser] = useState({ fullName: '', email: '', jobTitle: '', organization: '', city: '', password: '' });
    const [newModule, setNewModule] = useState({ id: '', title: '', description: '', icon: '' });

    // Roles management
    const [siteRoles, setSiteRoles] = useState<CustomRole[]>([]);
    const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
    const [showAddRoleModal, setShowAddRoleModal] = useState(false);
    const [newRole, setNewRole] = useState<CustomRole>({
        id: '',
        name: '',
        description: '',
        color: '#3b82f6',
        permissions: ['take_courses']
    });

    // Permissions management
    const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [newPermission, setNewPermission] = useState('');

    const defaultPermissions: string[] = [
        'take_courses',
        'manage_modules',
        'manage_users',
        'manage_settings',
        'view_logs',
        'manage_roles',
        'view_stats',
        'export_data',
        'manage_certificates'
    ];

    const defaultRoles: CustomRole[] = [
        { id: 'admin', name: 'Administrateur', description: 'Accès complet au système', color: '#ef4444', permissions: ['manage_users', 'manage_modules', 'manage_settings', 'view_logs', 'manage_roles'] },
        { id: 'trainer', name: 'Formateur', description: 'Gérer le contenu des formations', color: '#10b981', permissions: ['manage_modules', 'view_stats'] },
        { id: 'user', name: 'Utilisateur', description: 'Suivre les formations', color: '#3b82f6', permissions: ['take_courses'] },
        { id: 'observer', name: 'Observateur', description: 'Consultation uniquement', color: '#f59e0b', permissions: ['view_stats'] }
    ];

    useEffect(() => {
        loadData();
        // Load custom permissions from settings
        if (settings.site_permissions) {
            try {
                const customPerms = JSON.parse(settings.site_permissions);
                setAvailablePermissions([...defaultPermissions, ...customPerms]);
            } catch (e) {
                setAvailablePermissions(defaultPermissions);
            }
        } else {
            setAvailablePermissions(defaultPermissions);
        }
    }, [activeTab, settings.site_permissions]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load Settings & Roles first as they are needed for others
            const settingsData = await api.getSettings();
            setSettings(settingsData);

            if (settingsData.site_roles) {
                try {
                    setSiteRoles(JSON.parse(settingsData.site_roles));
                } catch (e) {
                    setSiteRoles(defaultRoles);
                }
            } else {
                setSiteRoles(defaultRoles);
            }

            if (activeTab === 'users' || activeTab === 'overview') {
                const userData = await api.getAdminUsers();
                setUsers(userData);
            }

            if (activeTab === 'modules' || activeTab === 'overview') {
                const moduleData = await api.getModules();
                setModules(moduleData);
            }

            if (activeTab === 'logs') {
                const logData = await api.getAdminLogs();
                setLogs(logData);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filters and Searches
    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const lowSearch = searchTerm.toLowerCase();
        return users.filter(u =>
            u.full_name.toLowerCase().includes(lowSearch) ||
            u.email.toLowerCase().includes(lowSearch) ||
            u.organization.toLowerCase().includes(lowSearch)
        );
    }, [users, searchTerm]);

    const filteredModules = useMemo(() => {
        if (!searchTerm) return modules;
        const lowSearch = searchTerm.toLowerCase();
        return modules.filter(m =>
            m.title.toLowerCase().includes(lowSearch) ||
            m.id.toLowerCase().includes(lowSearch)
        );
    }, [modules, searchTerm]);

    // Stats Calculation
    const stats = useMemo(() => {
        return {
            totalUsers: users.length,
            totalModules: modules.length,
            totalTrainings: users.reduce((sum, u) => sum + (u.training_count || 0), 0),
            adminsCount: users.filter(u => u.role === 'admin').length
        };
    }, [users, modules]);

    const handleSaveRole = async () => {
        if (!newRole.id || !newRole.name) {
            alert("L'ID et le nom du rôle sont obligatoires.");
            return;
        }

        let updatedRoles;
        if (editingRole) {
            updatedRoles = siteRoles.map(r => r.id === editingRole.id ? newRole : r);
        } else {
            if (siteRoles.find(r => r.id === newRole.id)) {
                alert("Cet ID de rôle existe déjà.");
                return;
            }
            updatedRoles = [...siteRoles, newRole];
        }

        try {
            await api.updateSettings({ ...settings, site_roles: JSON.stringify(updatedRoles) });
            setSiteRoles(updatedRoles);
            setShowAddRoleModal(false);
            setEditingRole(null);
            alert("Rôle enregistré !");
        } catch (err) {
            alert("Erreur lors de l'enregistrement.");
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (roleId === 'admin' || roleId === 'user') {
            alert("Ce rôle système ne peut pas être supprimé.");
            return;
        }

        if (window.confirm(`Supprimer le rôle "${roleId}" ?`)) {
            const updatedRoles = siteRoles.filter(r => r.id !== roleId);
            try {
                await api.updateSettings({ ...settings, site_roles: JSON.stringify(updatedRoles) });
                setSiteRoles(updatedRoles);
            } catch (err) {
                alert("Erreur suppression.");
            }
        }
    };

    const handleCloneModule = async (module: Module) => {
        if (!confirm(`Voulez-vous cloner le module "${module.title}" ?`)) return;

        try {
            // Parse module data
            let moduleData = {};
            try {
                moduleData = module.data ? JSON.parse(module.data) : {};
            } catch (e) {
                console.error('Error parsing module data:', e);
            }

            // Generate new ID and title
            const timestamp = Date.now();
            const newId = `${module.id}-copie-${timestamp}`;
            const newTitle = `Copie de ${module.title}`;

            // Create cloned module
            await api.createModule({
                id: newId,
                title: newTitle,
                description: module.description,
                icon: module.icon,
                data: moduleData
            });

            alert(`Module "${newTitle}" créé avec succès !`);
            loadData();
        } catch (err) {
            console.error('Clone error:', err);
            alert("Erreur lors du clonage du module.");
        }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.updateSettings(settings);
            alert("Paramètres enregistrés !");
        } catch (err) {
            alert("Erreur enregistrement.");
        }
    };

    const handleAddPermission = async () => {
        if (!newPermission.trim()) {
            alert("Le nom de la permission est requis.");
            return;
        }

        // Convert to snake_case
        const permSlug = newPermission.toLowerCase().replace(/\s+/g, '_');

        if (availablePermissions.includes(permSlug)) {
            alert("Cette permission existe déjà.");
            return;
        }

        try {
            const customPerms = availablePermissions.filter(p => !defaultPermissions.includes(p));
            customPerms.push(permSlug);

            await api.updateSettings({
                ...settings,
                site_permissions: JSON.stringify(customPerms)
            });

            setAvailablePermissions([...availablePermissions, permSlug]);
            setNewPermission('');
            alert(`Permission "${permSlug}" ajoutée avec succès !`);
        } catch (err) {
            alert("Erreur lors de l'ajout de la permission.");
        }
    };

    const handleDeletePermission = async (permission: string) => {
        if (defaultPermissions.includes(permission)) {
            alert("Les permissions système ne peuvent pas être supprimées.");
            return;
        }

        if (!confirm(`Supprimer la permission "${permission}" ?`)) return;

        try {
            const customPerms = availablePermissions
                .filter(p => !defaultPermissions.includes(p))
                .filter(p => p !== permission);

            await api.updateSettings({
                ...settings,
                site_permissions: JSON.stringify(customPerms)
            });

            setAvailablePermissions(availablePermissions.filter(p => p !== permission));

            // Remove from all roles
            const updatedRoles = siteRoles.map(role => ({
                ...role,
                permissions: role.permissions.filter(p => p !== permission)
            }));
            setSiteRoles(updatedRoles);
            await api.updateSettings({
                ...settings,
                site_roles: JSON.stringify(updatedRoles)
            });

            alert("Permission supprimée.");
        } catch (err) {
            alert("Erreur lors de la suppression.");
        }
    };

    const exportUsersCSV = () => {
        const headers = "ID,Nom,Email,Poste,Organisation,Role,Sessions\n";
        const rows = users.map(u => `${u.id},"${u.full_name}",${u.email},"${u.job_title}","${u.organization}",${u.role},${u.training_count}`).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleRoleChange = async (role: string) => {
        if (!editingUser) return;
        try {
            await api.updateUserRole(editingUser.id.toString(), role);
            setShowRoleModal(false);
            setEditingUser(null);
            loadData();
        } catch (err) {
            alert("Erreur changement rôle.");
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser || !auditPassword) return;
        try {
            await api.resetUserPassword(editingUser.id.toString(), auditPassword);
            setEditingUser(null);
            setAuditPassword('');
            alert("Mot de passe réinitialisé avec succès !");
        } catch (err) {
            alert("Erreur lors de la réinitialisation.");
        }
    };

    const handleAddModule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createModule(newModule);
            setShowAddModuleModal(false);
            setNewModule({ id: '', title: '', description: '', icon: '' });
            loadData();
            alert("Formation créée !");
        } catch (err) {
            alert("Erreur lors de la création.");
        }
    };

    // Helper functions for API
    async function getUserTrainings(id: string) {
        try {
            const data = await api.getUserTrainings(id);
            setUserTrainings(data);
        } catch (e) {
            setUserTrainings([]);
        }
    }

    async function handleAddUser(e: React.FormEvent) {
        e.preventDefault();
        try {
            await api.createUser(newUser);
            setShowAddUserModal(false);
            loadData();
            alert("Utilisateur créé !");
        } catch (e) { alert("Erreur."); }
    }

    async function handleDeleteModule(id: string) {
        if (window.confirm("Supprimer ce module ?")) {
            await api.deleteModule(id);
            loadData();
        }
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <div className="admin-title">
                    <div className="admin-logo">🚀</div>
                    <div>
                        <h1>Panel d'Administration</h1>
                        <p>{stats.totalUsers} Utilisateurs • {stats.totalModules} Formations</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={exportUsersCSV} className="btn-close-admin" style={{ background: '#f8fafc' }}>📦 Exporter Données</button>
                    <button onClick={onClose} className="btn-close-admin">Fermer</button>
                </div>
            </div>

            <div className="admin-tabs">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Vue d'Ensemble</button>
                <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 Utilisateurs</button>
                <button className={`tab-btn ${activeTab === 'modules' ? 'active' : ''}`} onClick={() => setActiveTab('modules')}>📚 Parcours</button>
                <button className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>🎭 Permissions</button>
                <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ Système</button>
                <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>📜 Historique</button>
                <button className={`tab-btn ${activeTab === 'help' ? 'active' : ''}`} onClick={() => setActiveTab('help')}>📚 Aide</button>
            </div>

            <div className="admin-tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-container">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: '#ebf5ff', color: '#2563eb' }}>👥</div>
                                <div className="stat-info">
                                    <h3>Utilisateurs</h3>
                                    <p>{stats.totalUsers}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>🏅</div>
                                <div className="stat-info">
                                    <h3>Total Certificats</h3>
                                    <p>{stats.totalTrainings}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>🛠️</div>
                                <div className="stat-info">
                                    <h3>Administrateurs</h3>
                                    <p>{stats.adminsCount}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>📖</div>
                                <div className="stat-info">
                                    <h3>Formations Actives</h3>
                                    <p>{stats.totalModules}</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                            <div className="table-container">
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                                    Dernières Inscriptions
                                    <button onClick={() => setActiveTab('users')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.85rem' }}>Voir tout →</button>
                                </div>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Utilisateur</th>
                                            <th>Organisation</th>
                                            <th>Sessions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.slice(0, 5).map(u => (
                                            <tr key={u.id}>
                                                <td>
                                                    <div style={{ fontWeight: '600' }}>{u.full_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                                                </td>
                                                <td>{u.organization}</td>
                                                <td>{u.training_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="table-container" style={{ padding: '1.5rem' }}>
                                <h3 style={{ marginTop: 0, fontSize: '1rem' }}>⚡ Actions Rapides</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <button onClick={() => setShowAddUserModal(true)} className="btn-add-item" style={{ width: '100%', justifyContent: 'center' }}>➕ Nouvel Utilisateur</button>
                                    <button onClick={() => setShowAddModuleModal(true)} className="btn-add-item" style={{ width: '100%', justifyContent: 'center', background: '#6366f1' }}>➕ Nouveau Parcours</button>
                                    <button onClick={() => setActiveTab('settings')} className="tab-btn" style={{ width: '100%', justifyContent: 'center' }}>⚙️ Paramètres Site</button>
                                </div>

                                <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Mode Maintenance</span>
                                        <input
                                            type="checkbox"
                                            checked={settings.maintenance_mode === 'true'}
                                            onChange={e => {
                                                const newVal = e.target.checked ? 'true' : 'false';
                                                setSettings({ ...settings, maintenance_mode: newVal });
                                                api.updateSettings({ ...settings, maintenance_mode: newVal });
                                            }}
                                        />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Désactive l'accès aux parcours pour les utilisateurs.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'users' || activeTab === 'modules') && (
                    <>
                        <div className="admin-actions-bar">
                            <div className="search-wrapper">
                                <span className="search-icon">🔍</span>
                                <input
                                    className="search-input"
                                    placeholder={activeTab === 'users' ? "Rechercher un utilisateur (nom, email, ville)..." : "Chercher une formation..."}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="btn-add-item" onClick={() => activeTab === 'users' ? setShowAddUserModal(true) : setShowAddModuleModal(true)}>
                                {activeTab === 'users' ? '➕ Ajouter Utilisateur' : '➕ Créer Formation'}
                            </button>
                        </div>

                        {activeTab === 'users' && (
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Identité</th>
                                            <th>Contact & Poste</th>
                                            <th>Rôle</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(user => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div style={{ fontWeight: '700', color: '#1e293b' }}>{user.full_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Inscrit le {user.registered_at ? new Date(user.registered_at).toLocaleDateString() : '-'}</div>
                                                </td>
                                                <td>
                                                    <div>{user.email}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: '600' }}>{user.job_title} @ {user.organization}</div>
                                                </td>
                                                <td>
                                                    <span
                                                        className="role-badge"
                                                        style={{
                                                            background: `${siteRoles.find(r => r.id === user.role)?.color || '#94a3b8'}15`,
                                                            color: siteRoles.find(r => r.id === user.role)?.color || '#64748b'
                                                        }}
                                                    >
                                                        {siteRoles.find(r => r.id === user.role)?.name || user.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <button onClick={() => { setViewingUser(user); getUserTrainings(user.id.toString()); }} className="action-icon" title="Historique">📑</button>
                                                        <button onClick={() => { setEditingUser(user); setShowRoleModal(true); }} className="action-icon" title="Changer Rôle">👑</button>
                                                        <button onClick={() => { setEditingUser(user); setAuditPassword(''); }} className="action-icon" title="Réinitialiser MDP">🔑</button>
                                                    </div>
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
                                            <th>Icon</th>
                                            <th>Titre du Parcours</th>
                                            <th>Identifiant</th>
                                            <th>Date Création</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredModules.map(m => (
                                            <tr key={m.id}>
                                                <td style={{ fontSize: '1.5rem' }}>{m.icon}</td>
                                                <td><strong>{m.title}</strong></td>
                                                <td><code>{m.id}</code></td>
                                                <td>{new Date(m.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <button onClick={() => onEditModule?.(m)} className="action-icon" title="Éditer">📝</button>
                                                    <button onClick={() => handleCloneModule(m)} className="action-icon" title="Cloner">📋</button>
                                                    <button onClick={() => handleDeleteModule(m.id)} className="action-icon" title="Supprimer">🗑️</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'roles' && (
                    <>
                        {/* Permissions Management Section */}
                        <div className="table-container" style={{ marginBottom: '2rem' }}>
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h2 style={{ margin: 0 }}>🔐 Gestion des Permissions</h2>
                                    <button
                                        className="btn-add-item"
                                        onClick={() => setShowPermissionsModal(true)}
                                    >
                                        ➕ Nouvelle Permission
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                    {availablePermissions.map(perm => (
                                        <div
                                            key={perm}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                background: defaultPermissions.includes(perm) ? '#f1f5f9' : '#eff6ff',
                                                borderRadius: '8px',
                                                border: `1px solid ${defaultPermissions.includes(perm) ? '#cbd5e1' : '#3b82f6'}`,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' }}>
                                                {perm}
                                            </span>
                                            {!defaultPermissions.includes(perm) && (
                                                <button
                                                    onClick={() => handleDeletePermission(perm)}
                                                    className="action-icon"
                                                    style={{ padding: '0.2rem', fontSize: '0.9rem' }}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
                                    💡 Les permissions en gris sont système et ne peuvent être supprimées. Les bleues sont personnalisées.
                                </p>
                            </div>
                        </div>

                        {/* Roles Table */}
                        <div className="table-container">
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ margin: 0 }}>🎭 Rôles et Accès</h2>
                                <button
                                    className="btn-add-item"
                                    onClick={() => {
                                        setEditingRole(null);
                                        setNewRole({ id: '', name: '', description: '', color: '#3b82f6', permissions: ['take_courses'] });
                                        setShowAddRoleModal(true);
                                    }}
                                >
                                    ➕ Nouveau Rôle
                                </button>
                            </div>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Nom du Rôle</th>
                                        <th>Slug</th>
                                        <th>Permissions</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {siteRoles.map(role => (
                                        <tr key={role.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: role.color }}></div>
                                                    <strong>{role.name}</strong>
                                                </div>
                                            </td>
                                            <td><code>{role.id}</code></td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {role.permissions.map(p => (
                                                        <span key={p} style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px' }}>{p}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <button onClick={() => { setEditingRole(role); setNewRole(role); setShowAddRoleModal(true); }} className="action-icon">⚙️</button>
                                                <button onClick={() => handleDeleteRole(role.id)} className="action-icon">🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'settings' && (
                    <div className="settings-panel">
                        <form onSubmit={handleUpdateSettings} className="admin-form">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                                {/* Section : Identité Visuelle */}
                                <div className="table-container" style={{ padding: '2rem' }}>
                                    <h2 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>🎨 Identité Visuelle</h2>

                                    <div className="form-group">
                                        <label>Logo du Site</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                                            {settings.site_logo ? (
                                                <img src={settings.site_logo} alt="Logo" style={{ height: '80px', objectFit: 'contain' }} />
                                            ) : (
                                                <div style={{ height: '80px', display: 'flex', alignItems: 'center', color: '#94a3b8' }}>Aucun logo</div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ fontSize: '0.8rem' }}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        try {
                                                            const result = await api.uploadImage(file);
                                                            setSettings({ ...settings, site_logo: result.path });
                                                        } catch (err) {
                                                            alert("Erreur d'upload");
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Couleur Thème Principale</label>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <input type="color" value={settings.primary_color || '#2563eb'} onChange={e => setSettings({ ...settings, primary_color: e.target.value })} style={{ width: '60px', height: '45px', padding: '2px', cursor: 'pointer' }} />
                                            <input type="text" value={settings.primary_color || '#2563eb'} onChange={e => setSettings({ ...settings, primary_color: e.target.value })} placeholder="#000000" />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Copyright (Pied de page)</label>
                                        <input value={settings.copyright || ''} onChange={e => setSettings({ ...settings, copyright: e.target.value })} placeholder="© 2026 Votre Organisation" />
                                    </div>
                                </div>

                                {/* Section : Informations Plateforme */}
                                <div className="table-container" style={{ padding: '2rem' }}>
                                    <h2 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>🏢 Informations Plateforme</h2>
                                    <div className="form-group">
                                        <label>Nom de la Plateforme</label>
                                        <input value={settings.site_name || ''} onChange={e => setSettings({ ...settings, site_name: e.target.value })} placeholder="Ex: Portail de Formation" />
                                    </div>
                                    <div className="form-group">
                                        <label>Nom de l'Organisation</label>
                                        <input value={settings.org_name || ''} onChange={e => setSettings({ ...settings, org_name: e.target.value })} placeholder="Ex: ADRA" />
                                    </div>
                                    <div className="form-group">
                                        <label>Email de Contact</label>
                                        <input type="email" value={settings.contact_email || ''} onChange={e => setSettings({ ...settings, contact_email: e.target.value })} placeholder="contact@example.com" />
                                    </div>
                                    <div className="form-group">
                                        <label>Description (Page Login)</label>
                                        <textarea value={settings.site_description || ''} onChange={e => setSettings({ ...settings, site_description: e.target.value })} placeholder="Message de bienvenue sur la page de connexion..." style={{ minHeight: '80px' }} />
                                    </div>
                                </div>

                                {/* Section : Fond App (3 Couleurs) */}
                                <div className="table-container" style={{ padding: '2rem' }}>
                                    <h2 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>🌈 Fond des Formations</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {['start', 'middle', 'end'].map((pos) => (
                                            <div key={pos} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <input
                                                    type="color"
                                                    value={settings[`background_color_${pos}`] || (pos === 'start' ? '#f8fafc' : pos === 'middle' ? '#e0e7ff' : '#fef3c7')}
                                                    onChange={e => setSettings({ ...settings, [`background_color_${pos}`]: e.target.value })}
                                                    style={{ width: '40px', height: '40px', padding: '0', border: 'none', background: 'none', cursor: 'pointer' }}
                                                />
                                                <label style={{ margin: 0, flex: 1, fontSize: '0.85rem' }}>Couleur {pos === 'start' ? 'Haute' : pos === 'middle' ? 'Milieu' : 'Basse'}</label>
                                                <input
                                                    type="text"
                                                    value={settings[`background_color_${pos}`] || ''}
                                                    onChange={e => setSettings({ ...settings, [`background_color_${pos}`]: e.target.value })}
                                                    style={{ width: '100px', fontSize: '0.8rem', padding: '0.4rem' }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{
                                        marginTop: '1.5rem', height: '60px', borderRadius: '12px',
                                        background: `linear-gradient(135deg, ${settings.background_color_start || '#f8fafc'} 0%, ${settings.background_color_middle || '#e0e7ff'} 50%, ${settings.background_color_end || '#fef3c7'} 100%)`,
                                        border: '1px solid #e2e8f0'
                                    }}></div>
                                </div>

                                {/* Section : Fond Login (4 Couleurs Animées) */}
                                <div className="table-container" style={{ padding: '2rem' }}>
                                    <h2 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>✨ Fond Page de Connexion</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input
                                                    type="color"
                                                    value={settings[`login_bg_color_${i}`] || (i === 1 ? '#667eea' : i === 2 ? '#764ba2' : i === 3 ? '#f093fb' : '#4facfe')}
                                                    onChange={e => setSettings({ ...settings, [`login_bg_color_${i}`]: e.target.value })}
                                                    style={{ width: '30px', height: '30px', cursor: 'pointer' }}
                                                />
                                                <span style={{ fontSize: '0.75rem' }}>C{i}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{
                                        marginTop: '1.5rem', height: '60px', borderRadius: '12px',
                                        background: `linear-gradient(-45deg, ${settings.login_bg_color_1 || '#667eea'}, ${settings.login_bg_color_2 || '#764ba2'}, ${settings.login_bg_color_3 || '#f093fb'}, ${settings.login_bg_color_4 || '#4facfe'})`,
                                        backgroundSize: '400% 400%',
                                        border: '1px solid #e2e8f0'
                                    }}></div>
                                </div>

                                {/* Section : Sécurité & Système */}
                                <div className="table-container" style={{ padding: '2rem' }}>
                                    <h2 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>🛡️ Sécurité & Système</h2>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px' }}>
                                            <input type="checkbox" checked={settings.allow_registration === 'true'} onChange={e => setSettings({ ...settings, allow_registration: e.target.checked ? 'true' : 'false' })} style={{ width: '20px', height: '20px' }} />
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Inscriptions Ouvertes</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Permettre aux nouveaux utilisateurs de créer un compte</div>
                                            </div>
                                        </label>

                                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px' }}>
                                            <input type="checkbox" checked={settings.maintenance_mode === 'true'} onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked ? 'true' : 'false' })} style={{ width: '20px', height: '20px' }} />
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '0.95rem', color: settings.maintenance_mode === 'true' ? '#ef4444' : 'inherit' }}>Mode Maintenance</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Verrouille l'accès aux formations pour tout le monde (sauf admin)</div>
                                            </div>
                                        </label>

                                        <div className="form-group">
                                            <label>Expiration Session (minutes)</label>
                                            <input type="number" value={settings.session_timeout || 60} onChange={e => setSettings({ ...settings, session_timeout: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                position: 'sticky', bottom: '2rem', marginTop: '2rem',
                                display: 'flex', justifyContent: 'center', zIndex: 10
                            }}>
                                <button type="submit" className="btn-save" style={{ maxWidth: '400px', height: '55px', fontSize: '1.1rem', boxShadow: '0 15px 30px rgba(37, 99, 235, 0.4)' }}>
                                    💾 Enregistrer tous les paramètres
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="table-container" style={{ background: '#0f172a', color: '#94a3b8', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <span style={{ color: 'white', fontWeight: '600' }}>Derniers Événements Système</span>
                            <button className="tab-btn" style={{ background: '#1e293b', border: '1px solid #334155' }} onClick={loadData}>🔄 Rafraîchir</button>
                        </div>
                        <div style={{ maxHeight: '500px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {logs.map((log, i) => (
                                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #1e293b', display: 'flex', gap: '15px' }}>
                                    <span style={{ color: '#64748b' }}>[{new Date(log.timestamp).toLocaleString()}]</span>
                                    <span style={{ color: log.level === 'ERROR' ? '#ef4444' : log.level === 'WARN' ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>{log.level}</span>
                                    <span style={{ color: '#e2e8f0' }}>{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'help' && (
                    <HelpGuide />
                )}
            </div>

            {/* Modals Implementation (Simplified for brevity but fully functional) */}

            {showRoleModal && editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Changer Rôle : {editingUser.full_name}</h2>
                            <button onClick={() => setShowRoleModal(false)} className="action-icon">✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {siteRoles.map(role => (
                                    <button
                                        key={role.id}
                                        onClick={() => handleRoleChange(role.id)}
                                        className="tab-btn"
                                        style={{ justifyContent: 'flex-start', background: editingUser.role === role.id ? '#eff6ff' : 'white', border: editingUser.role === role.id ? '1px solid #3b82f6' : '1px solid #eee' }}
                                    >
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: role.color }}></div>
                                        {role.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>➕ Nouvel Utilisateur</h2>
                            <button onClick={() => setShowAddUserModal(false)} className="action-icon">✕</button>
                        </div>
                        <form onSubmit={handleAddUser} className="modal-body">
                            <div className="form-group">
                                <label>Nom Complet</label>
                                <input required value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Rôle</label>
                                <select onChange={e => setNewUser({ ...newUser, role: e.target.value } as any)}>
                                    {siteRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Mot de passe</label>
                                <input type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn-save">Créer Compte</button>
                                <button type="button" onClick={() => setShowAddUserModal(false)} className="btn-cancel">Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* User History Modal */}
            {viewingUser && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px' }}>
                        <div className="modal-header">
                            <h2>🎓 Historique : {viewingUser.full_name}</h2>
                            <button onClick={() => setViewingUser(null)} className="action-icon">✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="user-details-header">
                                <div className="user-avatar-large">{viewingUser.full_name.charAt(0)}</div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{viewingUser.full_name}</h3>
                                    <p style={{ margin: 0, color: '#64748b' }}>{viewingUser.email} • {viewingUser.job_title}</p>
                                </div>
                            </div>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Formation</th>
                                        <th>Score</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userTrainings.map(t => (
                                        <tr key={t.id}>
                                            <td>{t.module_title || t.module_id}</td>
                                            <td>
                                                <div style={{ fontWeight: 'bold', color: t.score >= 80 ? '#10b981' : '#f59e0b' }}>{t.score}%</div>
                                                <div className="progress-bar-container"><div className="progress-bar-fill" style={{ width: `${t.score}%`, background: t.score >= 80 ? '#10b981' : '#f59e0b' }}></div></div>
                                            </td>
                                            <td>{new Date(t.completed_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {userTrainings.length === 0 && <tr><td colSpan={3} className="no-data-state">Aucun historique d'apprentissage.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {editingUser && !showRoleModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>🔑 Réinitialiser MDP : {editingUser.full_name}</h2>
                            <button onClick={() => { setEditingUser(null); setAuditPassword(''); }} className="action-icon">✕</button>
                        </div>
                        <form onSubmit={handleResetPassword} className="modal-body">
                            <div className="form-group">
                                <label>Nouveau Mot de Passe</label>
                                <input
                                    type="password"
                                    value={auditPassword}
                                    onChange={e => setAuditPassword(e.target.value)}
                                    placeholder="Entrez le nouveau mot de passe"
                                    required
                                    autoFocus
                                />
                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>L'utilisateur devra utiliser ce mot de passe pour sa prochaine connexion.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn-save">Mettre à jour</button>
                                <button type="button" onClick={() => { setEditingUser(null); setAuditPassword(''); }} className="btn-cancel">Annuler</button>
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
                            <h2>📚 Créer un nouveau Parcours</h2>
                            <button onClick={() => setShowAddModuleModal(false)} className="action-icon">✕</button>
                        </div>
                        <form onSubmit={handleAddModule} className="modal-body">
                            <div className="form-group">
                                <label>ID Unique (sans espace)</label>
                                <input required value={newModule.id} onChange={e => setNewModule({ ...newModule, id: e.target.value })} placeholder="ex: hygiene-base" />
                            </div>
                            <div className="form-group">
                                <label>Titre de la Formation</label>
                                <input required value={newModule.title} onChange={e => setNewModule({ ...newModule, title: e.target.value })} placeholder="ex: Hygiène en milieu hospitalier" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={newModule.description} onChange={e => setNewModule({ ...newModule, description: e.target.value })} placeholder="Courte description de l'objectif..." style={{ minHeight: '80px' }} />
                            </div>
                            <div className="form-group">
                                <label>Icône (Emoji ou URL)</label>
                                <input value={newModule.icon} onChange={e => setNewModule({ ...newModule, icon: e.target.value })} placeholder="ex: 🏥" />
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn-save">Créer la formation</button>
                                <button type="button" onClick={() => setShowAddModuleModal(false)} className="btn-cancel">Annuler</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Role Modal */}
            {showAddRoleModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingRole ? '✏️ Modifier le Rôle' : '➕ Nouveau Rôle'}</h2>
                            <button onClick={() => { setShowAddRoleModal(false); setEditingRole(null); }} className="action-icon">✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Identifiant du Rôle (ID)</label>
                                {editingRole ? (
                                    <input
                                        type="text"
                                        value={newRole.id}
                                        disabled={true}
                                        style={{ background: '#f1f5f9' }}
                                    />
                                ) : (
                                    <>
                                        <select
                                            value={['admin', 'trainer', 'user', 'observer'].includes(newRole.id) ? newRole.id : 'custom'}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === 'custom') {
                                                    setNewRole({ ...newRole, id: '' });
                                                } else {
                                                    setNewRole({ ...newRole, id: val });
                                                }
                                            }}
                                            style={{ marginBottom: newRole.id && !['admin', 'trainer', 'user', 'observer'].includes(newRole.id) ? '0.5rem' : '0' }}
                                        >
                                            <option value="user">Utilisateur Standard (user)</option>
                                            <option value="trainer">Formateur (trainer)</option>
                                            <option value="observer">Observateur (observer)</option>
                                            <option value="admin">Administrateur (admin)</option>
                                            <option value="custom">-- Personnalisé --</option>
                                        </select>
                                        {(!['admin', 'trainer', 'user', 'observer'].includes(newRole.id) || newRole.id === '') && (
                                            <input
                                                type="text"
                                                value={newRole.id}
                                                onChange={(e) => setNewRole({ ...newRole, id: e.target.value })}
                                                placeholder="ex: viewer_plus"
                                                autoFocus
                                            />
                                        )}
                                    </>
                                )}
                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Identifiant unique (en minuscules, sans espace).</p>
                            </div>
                            <div className="form-group">
                                <label>Nom d'affichage</label>
                                <input
                                    type="text"
                                    value={newRole.name}
                                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                    placeholder="ex: Superviseur"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={newRole.description}
                                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Couleur du badge</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="color"
                                        value={newRole.color}
                                        onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                                        style={{ width: '50px', padding: '0', height: '40px' }}
                                    />
                                    <div style={{ flex: 1, background: newRole.color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                        {newRole.name || 'Aperçu'}
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Permissions</label>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', background: '#f8fafc' }}>
                                    {availablePermissions.map(perm => (
                                        <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={newRole.permissions.includes(perm)}
                                                onChange={(e) => {
                                                    const currentPerms = newRole.permissions;
                                                    if (e.target.checked) {
                                                        setNewRole({ ...newRole, permissions: [...currentPerms, perm] });
                                                    } else {
                                                        setNewRole({ ...newRole, permissions: currentPerms.filter(p => p !== perm) });
                                                    }
                                                }}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>{perm}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => { setShowAddRoleModal(false); setEditingRole(null); }} className="btn-cancel">Annuler</button>
                            <button onClick={handleSaveRole} className="btn-save">Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Add Permission Modal */}
            {
                showPermissionsModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '400px' }}>
                            <div className="modal-header">
                                <h2>➕ Nouvelle Permission</h2>
                                <button onClick={() => setShowPermissionsModal(false)} className="action-icon">✕</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Nom de la permission</label>
                                    <input
                                        type="text"
                                        value={newPermission}
                                        onChange={(e) => setNewPermission(e.target.value)}
                                        placeholder="Ex: manage_content"
                                    />
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                                        Le nom sera automatiquement converti en format système (ex: Manage Content → manage_content)
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button onClick={() => setShowPermissionsModal(false)} className="btn-cancel">Annuler</button>
                                <button onClick={() => { handleAddPermission(); setShowPermissionsModal(false); }} className="btn-save">Ajouter</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminDashboard;
