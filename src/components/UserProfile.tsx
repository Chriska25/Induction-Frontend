import React, { useState, useRef } from 'react';
import { api } from '../api/client';
import { getImageUrl } from '../utils/imageUrl';
import './UserProfile.css';

interface UserProfileProps {
    user: {
        id: string;
        fullName: string;
        email: string;
        jobTitle?: string;
        organization?: string;
        city?: string;
        profilePhoto?: string;
    };
    onUpdate: (updatedUser: any) => void;
    onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate, onClose }) => {
    const [fullName, setFullName] = useState(user.fullName || '');
    const [jobTitle, setJobTitle] = useState(user.jobTitle || '');
    const [organization, setOrganization] = useState(user.organization || '');
    const [city, setCity] = useState(user.city || '');
    const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const result = await api.uploadImage(file, user.id);
            setProfilePhoto(result.path);
            setMessage('Photo uploadée avec succès!');
        } catch (error) {
            setMessage('Erreur lors de l\'upload de la photo');
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        // Validate passwords if at least one is typed
        if (password || confirmPassword) {
            if (password !== confirmPassword) {
                setMessage('Erreur: Les mots de passe ne correspondent pas');
                setIsLoading(false);
                return;
            }
            if (password.length < 6) {
                setMessage('Erreur: Le mot de passe doit faire au moins 6 caractères');
                setIsLoading(false);
                return;
            }
        }

        try {
            const updatedData = await api.updateUserProfile(user.id, {
                fullName,
                jobTitle,
                organization,
                city,
                profilePhoto,
                ...(password ? { password } : {})
            });

            // Map backend response to frontend format
            const mappedUser = {
                id: updatedData.id,
                fullName: updatedData.full_name,
                email: updatedData.email,
                jobTitle: updatedData.job_title,
                organization: updatedData.organization,
                city: updatedData.city,
                profilePhoto: updatedData.profile_photo,
                role: updatedData.role
            };

            onUpdate(mappedUser);
            setMessage('Profil mis à jour avec succès!');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            setMessage('Erreur lors de la mise à jour du profil');
        }
        setIsLoading(false);
    };

    return (
        <div className="profile-modal-overlay">
            <div className="profile-modal">
                <div className="profile-header">
                    <h2>Mon Profil</h2>
                    <button className="profile-close-btn" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="profile-photo-section">
                        <div className="profile-photo-container">
                            {profilePhoto ? (
                                <img
                                    src={getImageUrl(profilePhoto)}
                                    alt="Photo de profil"
                                    className="profile-photo"
                                />
                            ) : (
                                <div className="profile-photo-placeholder">
                                    {fullName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        <button
                            type="button"
                            className="profile-photo-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                        >
                            📷 Changer la photo
                        </button>
                    </div>

                    <div className="profile-field">
                        <label>Email</label>
                        <input type="email" value={user.email} disabled className="profile-input disabled" />
                        <span className="field-hint">L'email ne peut pas être modifié</span>
                    </div>

                    <div className="profile-field">
                        <label>Nom complet</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="profile-input"
                            required
                        />
                    </div>

                    <div className="profile-field">
                        <label>Poste / Fonction</label>
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="profile-input"
                            placeholder="Ex: Chef de projet"
                        />
                    </div>

                    <div className="profile-field">
                        <label>Organisation</label>
                        <input
                            type="text"
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                            className="profile-input"
                            placeholder="Ex: ADRA"
                        />
                    </div>

                    <div className="profile-field">
                        <label>Ville</label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="profile-input"
                            placeholder="Ex: Kinshasa"
                        />
                    </div>

                    <div className="profile-divider" style={{ margin: '2rem 0 1rem', borderTop: '1px solid #eee' }}>
                        <h4 style={{ color: '#4a5568', fontSize: '0.9rem' }}>Changer le mot de passe</h4>
                    </div>

                    <div className="profile-field">
                        <label>Nouveau mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="profile-input"
                            placeholder="Laissez vide pour ne pas changer"
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="profile-field">
                        <label>Confirmer le mot de passe</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="profile-input"
                            placeholder="Confirmez le nouveau mot de passe"
                            autoComplete="new-password"
                        />
                    </div>

                    {message && (
                        <div className={`profile-message ${message.includes('Erreur') ? 'error' : 'success'}`}>
                            {message}
                        </div>
                    )}

                    <div className="profile-actions">
                        <button type="button" className="profile-cancel-btn" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="profile-save-btn" disabled={isLoading}>
                            {isLoading ? 'Enregistrement...' : '💾 Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserProfile;
