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
        const completed = moduleTrainings.some(t => t.type === 'quiz' && t.score >= 80);
        if (completed) return 'completed';
        const started = moduleTrainings.some(t => t.type === 'module_start' || t.type === 'quiz');
        if (started) return 'in-progress';
        return 'new';
    };

    const handleCreateModule = async () => {
        const title = prompt("Titre du nouveau module :");
        if (!title) return;
        const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        try {
            await api.createModule({
                id,
                title,
                description: "Nouvelle formation",
                icon: "🆕",
                data: null
            });
            loadData();
        } catch (err) {
            alert("Erreur lors de la création du module.");
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

    if (loading) return <div className="induction-list-page"><p>Chargement...</p></div>;
    if (error) return <div className="induction-list-page"><p className="error">{error}</p></div>;

    return (
        <div className="induction-list-page">
            <div className="induction-header">
                <h1>Bienvenue, {userName}</h1>
                <p>Veuillez sélectionner votre module de formation</p>
            </div>

            <div className="induction-grid">
                {modules.map((module) => {
                    const status = getModuleStatus(module.id);
                    return (
                        <div key={module.id} className={`induction-card status-${status}`}>
                            <div className="induction-icon">
                                {module.icon && (module.icon.startsWith('http') || module.icon.startsWith('/')) ? (
                                    <img src={module.icon} alt={module.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    module.icon || '📘'
                                )}
                            </div>
                            <h2>{module.title}</h2>
                            <p>{module.description}</p>

                            <div className="module-status-badge">
                                {status === 'completed' && <span className="badge completed">Terminé ✅</span>}
                                {status === 'in-progress' && <span className="badge in-progress">En cours ⏳</span>}
                            </div>

                            <button
                                className="btn-start-module"
                                onClick={() => handleSelect(module)}
                            >
                                {status === 'completed' ? 'Revoir' : (status === 'in-progress' ? 'Continuer' : 'Commencer')}
                            </button>
                            {isAdminMode && (
                                <button
                                    className="btn-delete-module"
                                    onClick={(e) => handleDeleteModule(e, module.id)}
                                    title="Supprimer ce module"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    );
                })}

                {isAdminMode && (
                    <div className="induction-card create-card" onClick={handleCreateModule}>
                        <div className="induction-icon">➕</div>
                        <h2>Créer un module</h2>
                        <p>Ajouter une nouvelle formation</p>
                    </div>
                )}

                {userRole === 'admin' && onAdminClick && (
                    <div className="induction-card admin-card" onClick={onAdminClick}>
                        <div className="induction-icon">🛡️</div>
                        <h2>Administration</h2>
                        <p>Gérer les utilisateurs et voir la progression</p>
                        <button className="btn-start-module">Ouvrir le tableau de bord</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InductionList;
