import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

const VerifyEmail: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Lien de vérification invalide (token manquant).');
                return;
            }

            try {
                // We need to implement verifyEmail in api client first, or just fetch here
                // Since api client is better, let's assume we add it. 
                // But for speed, direct fetch:
                const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';
                const response = await fetch(`${API_URL}/verify-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Échec de la vérification.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Erreur de connexion au serveur.');
            }
        };

        verifyToken();
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '3rem',
                width: '100%',
                maxWidth: '500px',
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
                {status === 'loading' && (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                        <h2>Vérification en cours...</h2>
                        <p style={{ color: '#666' }}>Veuillez patienter.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                        <h2 style={{ color: '#10b981', marginBottom: '1rem' }}>Email Vérifié !</h2>
                        <p style={{ color: '#4b5563', marginBottom: '2rem' }}>
                            Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.
                        </p>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 2rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Retour à la connexion
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
                        <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Échec de la vérification</h2>
                        <p style={{ color: '#4b5563', marginBottom: '2rem' }}>{message}</p>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                background: '#64748b',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 2rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Retour à l'accueil
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
