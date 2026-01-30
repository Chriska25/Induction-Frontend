import { motion, Variants } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { ContentData } from '../types';
import { api } from '../api/client';
import './InductionList.css';

interface InductionListProps {
    onSelect: (data: ContentData, moduleId: string) => void;
    userName: string;
    userId: string;
    userRole?: string;
    isAdminMode?: boolean;
    onAdminClick?: () => void;
}

interface Module {
    id: string;
    title: string;
    description: string;
    icon: string;
    data: string | ContentData;
}

interface TrainingRecord {
    id: number;
    module_id: string;
    type: string;
    score: number;
    completed_at: string;
}

const InductionList: React.FC<InductionListProps> = ({ onSelect, userName, userId, userRole, isAdminMode, onAdminClick }) => {
    const [modules, setModules] = useState<Module[]>([]);
    const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [newModuleDesc, setNewModuleDesc] = useState('');
    const [newModuleIcon, setNewModuleIcon] = useState('📘');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [modulesData, trainingsData] = await Promise.all([
                api.getModules(),
                api.getUserTrainings(userId)
            ]);

            setModules(modulesData);
            setTrainings(trainingsData);
        } catch (err) {
            console.error("Failed to load data", err);
            setError("Impossible de charger les modules ou la progression.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (module: Module) => {
        const hasStarted = trainings.some(t => t.module_id === module.id && t.type === 'module_start');
        if (!hasStarted) {
            try {
                await api.saveTraining({ userId, type: 'module_start', score: 0, moduleId: module.id });
                setTrainings(prev => [...prev, { id: Date.now(), module_id: module.id, type: 'module_start', score: 0, completed_at: new Date().toISOString() }]);
            } catch (e) {
                console.error("Failed to track module start", e);
            }
        }

        let content: ContentData;
        if (typeof module.data === 'string') {
            try {
                content = JSON.parse(module.data);
            } catch (e) {
                console.error("Invalid JSON data for module", module.id);
                alert("Erreur: Les données de ce module sont corrompues.");
                return;
            }
        } else {
            content = module.data;
        }
        onSelect(content, module.id);
    };

    const getModuleStatus = (moduleId: string) => {
        const moduleTrainings = trainings.filter(t => String(t.module_id) === String(moduleId));

        // Un cours est terminé si un record de type 'quiz' a un progrès >= 80
        const completed = moduleTrainings.some(t => {
            const currentStatus = (t as any).status || (t as any).type;
            const currentProgress = (t as any).progress !== undefined ? (t as any).progress : (t as any).score;
            return currentStatus === 'quiz' && (currentProgress || 0) >= 80;
        });

        if (completed) return 'completed';

        const started = moduleTrainings.some(t => {
            const currentStatus = (t as any).status || (t as any).type;
            return currentStatus === 'module_start' || currentStatus === 'quiz';
        });

        if (started) return 'in-progress';
        return 'new';
    };

    const getBestScore = (moduleId: string): number | null => {
        const moduleTrainings = trainings.filter(t => String(t.module_id) === String(moduleId));
        const quizTrainings = moduleTrainings.filter(t => {
            const currentStatus = (t as any).status || (t as any).type;
            const currentProgress = (t as any).progress !== undefined ? (t as any).progress : (t as any).score;
            return currentStatus === 'quiz' && currentProgress !== undefined;
        });

        if (quizTrainings.length === 0) return null;

        return Math.max(...quizTrainings.map(t => {
            const val = (t as any).progress !== undefined ? (t as any).progress : (t as any).score;
            return Number(val) || 0;
        }));
    };

    const handleCreateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newModuleTitle) return;

        setIsCreating(true);
        const id = newModuleTitle.toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]/g, '') + '-' + Math.random().toString(36).substring(2, 5);

        try {
            await api.createModule({
                id,
                title: newModuleTitle,
                description: newModuleDesc || "Nouvelle formation",
                icon: newModuleIcon || "📘",
                data: null
            });
            setShowCreateModal(false);
            setNewModuleTitle('');
            setNewModuleDesc('');
            setNewModuleIcon('📘');
            loadData();
        } catch (err) {
            alert("Erreur lors de la création du module.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteModule = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce module ?")) {
            try {
                await api.deleteModule(id);
                loadData();
            } catch (err) {
                alert("Erreur lors de la suppression.");
            }
        }
    };

    // Animation variants
    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item: Variants = {
        hidden: { opacity: 0, y: 30 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 50,
                damping: 20
            }
        }
    };

    if (loading) return <div className="induction-list-page"><p>Chargement...</p></div>;
    if (error) return <div className="induction-list-page"><p className="error">{error}</p></div>;

    return (
        <div className="induction-list-page">
            <div className="induction-header">
                <h1>Bienvenue, {userName}</h1>
                <p>Veuillez sélectionner votre module de formation</p>
                <div style={{ marginTop: '1.5rem', position: 'relative', maxWidth: '500px', margin: '1.5rem auto 0' }}>
                    <input
                        type="text"
                        placeholder="🔍 Rechercher une formation..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 1.5rem',
                            borderRadius: '50px',
                            border: '1px solid #e2e8f0',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                            paddingLeft: '3rem'
                        }}
                    />
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', opacity: 0.5 }}>🔍</span>
                </div>
            </div>

            <motion.div
                className="induction-grid"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {modules.filter(m =>
                    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    m.description?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((module) => {
                    const calculateProgress = (moduleId: string): number => {
                        const status = getModuleStatus(moduleId);
                        if (status === 'completed') return 100;

                        const moduleTrainings = trainings.filter(t => String(t.module_id) === String(moduleId));
                        const quizWithScore = moduleTrainings.find(t => (t as any).status === 'quiz' || (t as any).type === 'quiz');

                        // If they took the quiz but failed, they are far along (e.g. 90%)
                        if (quizWithScore) return 90;

                        // If they just started
                        if (status === 'in-progress') return 30;

                        return 0;
                    };

                    const status = getModuleStatus(module.id);
                    const bestScore = getBestScore(module.id);
                    const progress = calculateProgress(module.id);

                    return (
                        <motion.div
                            key={module.id}
                            className={`induction-card status-${status}`}
                            onClick={() => handleSelect(module)}
                            variants={item}
                            whileHover={{ y: -12, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isAdminMode && (
                                <button
                                    className="btn-delete-module"
                                    onClick={(e) => handleDeleteModule(e, module.id)}
                                    title="Supprimer ce module"
                                >
                                    🗑️
                                </button>
                            )}

                            <div className="induction-icon">
                                {module.icon && (module.icon.startsWith('http') || module.icon.startsWith('/')) ? (
                                    <img src={module.icon} alt={module.title} style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ fontSize: '3rem' }}>{module.icon || '📘'}</span>
                                )}
                            </div>

                            <h2>{module.title}</h2>
                            <p>{module.description || "Complétez ce module pour obtenir votre certificat."}</p>

                            <div className="module-status-badge">
                                {status === 'completed' ? (
                                    <span className="badge completed">Terminé ✅</span>
                                ) : status === 'in-progress' ? (
                                    <span className="badge in-progress">En cours ⏳</span>
                                ) : (
                                    <span className="badge new">Nouveau ✨</span>
                                )}
                            </div>

                            {/* Progress Bar Container */}
                            <div className="progress-container">
                                <div
                                    className="progress-bar"
                                    style={{
                                        width: `${progress}%`,
                                        background: status === 'completed' ? '#10b981' : (progress > 0 ? 'linear-gradient(90deg, #667eea, #764ba2)' : 'transparent'),
                                    }}
                                />
                            </div>

                            {status === 'completed' && bestScore !== null && (
                                <div className="module-score-display">
                                    <span className="score-label">Score obtenu :</span>
                                    <span className="score-value">{bestScore}%</span>
                                </div>
                            )}

                            <button className="btn-start-module">
                                {status === 'completed' ? 'Revoir' : (status === 'in-progress' ? 'Continuer' : 'Commencer')}
                            </button>
                        </motion.div>
                    );
                })}

                {isAdminMode && (
                    <div className="induction-card create-card" onClick={() => setShowCreateModal(true)}>
                        <div className="induction-icon">➕</div>
                        <h2>Créer un module</h2>
                        <p>Ajouter une nouvelle formation</p>
                    </div>
                )}

                {isAdminMode && onAdminClick && (
                    <motion.div
                        className="induction-card admin-card"
                        onClick={onAdminClick}
                        variants={item}
                        whileHover={{ y: -12, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="induction-icon">🛡️</div>
                        <h2>Administration</h2>
                        <p>Gérer les utilisateurs et voir la progression</p>
                        <button className="btn-start-module">Ouvrir le tableau de bord</button>
                    </motion.div>
                )}
            </motion.div>

            {showCreateModal && (
                <div className="profile-modal-overlay">
                    <div className="profile-modal" style={{ maxWidth: '600px' }}>
                        <div className="profile-header">
                            <h2>🆕 Nouveau Module</h2>
                            <button className="profile-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateModule} className="profile-form">
                            <div className="profile-field">
                                <label>Titre de la formation *</label>
                                <input
                                    type="text"
                                    className="profile-input"
                                    value={newModuleTitle}
                                    onChange={(e) => setNewModuleTitle(e.target.value)}
                                    placeholder="Ex: Hygiène et Sécurité"
                                    required
                                />
                            </div>
                            <div className="profile-field">
                                <label>Description courte</label>
                                <textarea
                                    className="profile-input"
                                    style={{ minHeight: '100px', resize: 'vertical' }}
                                    value={newModuleDesc}
                                    onChange={(e) => setNewModuleDesc(e.target.value)}
                                    placeholder="Décrivez brièvement le contenu de cette formation..."
                                />
                            </div>
                            <div className="profile-field">
                                <label>Icône / Emoji</label>
                                <input
                                    type="text"
                                    className="profile-input"
                                    value={newModuleIcon}
                                    onChange={(e) => setNewModuleIcon(e.target.value)}
                                    placeholder="Copiez un emoji (📘, 🏗️, 🏥...)"
                                />
                            </div>
                            <div className="profile-actions">
                                <button type="button" className="profile-cancel-btn" onClick={() => setShowCreateModal(false)}>Annuler</button>
                                <button type="submit" className="profile-save-btn" disabled={isCreating}>
                                    {isCreating ? 'Création...' : '🚀 Créer la formation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InductionList;
