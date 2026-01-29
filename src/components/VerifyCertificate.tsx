import React, { useEffect, useState } from 'react';
import { getImageUrl } from '../utils/imageUrl';

const VerifyCertificate: React.FC = () => {
    const [data, setData] = useState<{ user: string; score: string; module: string } | null>(null);
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const user = params.get('user');
            const score = params.get('score');
            const module = params.get('module');

            console.log('VerifyCertificate Params:', { user, score, module });

            if (user && score && module) {
                setData({ user, score, module });
                setIsValid(true);
            } else {
                console.warn('Missing parameters for certificate verification');
            }
        } catch (e) {
            console.error('Error parsing verification parameters:', e);
        }
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a5490 0%, #2c7bb6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '3rem 2rem',
                width: '100%',
                maxWidth: '480px',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative background element */}
                <div style={{
                    position: 'absolute',
                    top: -50,
                    left: -50,
                    width: '150px',
                    height: '150px',
                    background: 'radial-gradient(circle, #e0efff 0%, transparent 70%)',
                    borderRadius: '50%',
                    opacity: 0.6
                }} />

                {isValid && data ? (
                    <>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: '#ecfdf5',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            color: '#10b981',
                            fontSize: '2.5rem',
                            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)'
                        }}>
                            ✓
                        </div>

                        <h1 style={{
                            color: '#064e3b',
                            fontSize: '1.8rem',
                            fontWeight: 800,
                            marginBottom: '0.5rem'
                        }}>
                            Certificat Vérifié
                        </h1>

                        <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '2rem' }}>
                            Ce document certifie l'achèvement réussi de la formation.
                        </p>

                        <div style={{
                            background: '#f9fafb',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            marginBottom: '2rem',
                            border: '1px solid #f3f4f6',
                            textAlign: 'left'
                        }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Apprenant</span>
                                <span style={{ fontSize: '1.2rem', color: '#1f2937', fontWeight: 700 }}>{decodeURIComponent(data.user)}</span>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Module</span>
                                <span style={{ fontSize: '1.1rem', color: '#1f2937', fontWeight: 600 }}>
                                    {data.module === 'induction' ? "Module d'Induction" : data.module}
                                </span>
                            </div>

                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Score Final</span>
                                <span style={{ fontSize: '1.5rem', color: '#1a5490', fontWeight: 800 }}>{parseFloat(data.score).toFixed(0)}%</span>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>
                            Vérifié par la Plateforme de Formation TUDIENZELE
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❓</div>
                        <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Information Manquante</h2>
                        <p style={{ color: '#4b5563', marginBottom: '2rem' }}>
                            Impossible de vérifier ce certificat. Les données requises sont incomplètes ou invalides.
                        </p>
                    </>
                )}

                <button
                    onClick={() => window.location.href = '/'}
                    style={{
                        marginTop: '2rem',
                        background: '#1a5490',
                        color: 'white',
                        border: 'none',
                        padding: '0.8rem 2rem',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#154373'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#1a5490'}
                >
                    Accéder à la Plateforme
                </button>
            </div>
        </div>
    );
};

export default VerifyCertificate;
