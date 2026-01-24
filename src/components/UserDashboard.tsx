import React from 'react';
import { RegistrationData } from '../types';
import { getImageUrl } from '../utils/imageUrl';

interface UserDashboardProps {
    user: RegistrationData;
    trainings: any[];
    modules: any[];
    onBack: () => void;
    onSelectModule: (module: any) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, trainings, modules, onBack, onSelectModule }) => {
    // Calcul des statistiques
    const modulesWithProgress = modules.map(m => {
        const moduleTrainings = trainings.filter(t => String(t.module_id) === String(m.id));
        const isCompleted = moduleTrainings.some(t => (t.status === 'quiz' || t.type === 'quiz') && (t.progress >= 80 || t.score >= 80));
        const isStarted = moduleTrainings.some(t => t.type === 'module_start' || t.progress > 0);

        // Trouver le meilleur score
        const scores = moduleTrainings.filter(t => t.score !== undefined).map(t => t.score);
        const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

        return { ...m, isCompleted, isStarted, bestScore };
    });

    const stats = {
        total: modules.length,
        followed: modulesWithProgress.filter(m => m.isStarted).length,
        completed: modulesWithProgress.filter(m => m.isCompleted).length,
        inProgress: modulesWithProgress.filter(m => m.isStarted && !m.isCompleted).length
    };

    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>Mon Tableau de Bord</h1>
                    <p style={{ opacity: 0.8, fontSize: '1.1rem', marginTop: '0.5rem' }}>Suivez votre progression et accédez à vos réussites.</p>
                </div>
                <button
                    onClick={onBack}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: 'white',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    ⬅️ Retour à l'accueil
                </button>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard title="Total Formations" value={stats.total} icon="📚" color="#667eea" />
                <StatCard title="En Cours" value={stats.inProgress} icon="⏳" color="#f59e0b" />
                <StatCard title="Terminées" value={stats.completed} icon="✅" color="#10b981" />
                <StatCard title="Taux de Réussite" value={`${completionRate}%`} icon="🏆" color="#764ba2" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
                {/* Detailed Progress */}
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        🎯 Mes Formations en Détail
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {modulesWithProgress.length === 0 ? (
                            <p style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '20px', textAlign: 'center' }}>
                                Aucune formation disponible pour le moment.
                            </p>
                        ) : (
                            modulesWithProgress.map(m => (
                                <div key={m.id} style={{
                                    background: 'rgba(255,255,255,1)',
                                    borderRadius: '20px',
                                    padding: '1.5rem',
                                    color: '#1a202c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1.5rem',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ fontSize: '2.5rem', background: '#f8fafc', width: '70px', height: '70px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {m.icon && (m.icon.startsWith('http') || m.icon.startsWith('/')) ? (
                                            <img src={m.icon} alt={m.title} style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
                                        ) : (
                                            m.icon || '📘'
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800 }}>{m.title}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ flex: 1, height: '8px', background: '#edf2f7', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: m.isCompleted ? '100%' : (m.isStarted ? '50%' : '0%'),
                                                    height: '100%',
                                                    background: m.isCompleted ? '#10b981' : '#667eea'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: m.isCompleted ? '#10b981' : '#667eea' }}>
                                                {m.isCompleted ? 'CHARGÉ' : (m.isStarted ? '50%' : 'PAS COMMENCÉ')}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        {m.isCompleted ? (
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#718096', fontWeight: 700, textTransform: 'uppercase' }}>Score</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{m.bestScore}%</div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => onSelectModule(m)}
                                                style={{
                                                    padding: '0.6rem 1.2rem',
                                                    background: '#667eea',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {m.isStarted ? 'Continuer' : 'Lancer'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Certificates List */}
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        🎓 Mes Certificats
                    </h2>
                    <div style={{
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '24px',
                        padding: '1.5rem',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        {modulesWithProgress.filter(m => m.isCompleted).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📜</div>
                                <p style={{ margin: 0, opacity: 0.8 }}>Complétez une formation pour débloquer votre premier certificat !</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {modulesWithProgress.filter(m => m.isCompleted).map(m => (
                                    <div
                                        key={m.id}
                                        onClick={() => onSelectModule(m)}
                                        style={{
                                            background: 'white',
                                            padding: '1.2rem',
                                            borderRadius: '18px',
                                            cursor: 'pointer',
                                            color: '#1a202c',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            transition: 'transform 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <div style={{ fontSize: '1.8rem' }}>🏆</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{m.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Certificat disponible</div>
                                        </div>
                                        <div style={{ color: '#667eea', fontSize: '1.2rem' }}>📥</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: any, icon: string, color: string }) => (
    <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '1.5rem',
        color: '#1a202c',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.2rem'
    }}>
        <div style={{ fontSize: '2rem', background: `${color}15`, width: '55px', height: '55px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        </div>
    </div>
);

export default UserDashboard;
