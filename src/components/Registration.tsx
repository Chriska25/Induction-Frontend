import React, { useState } from 'react';
import { RegistrationData } from '../types';
import { api } from '../api/client';
import './Registration.css';
import './Auth.css';


interface RegistrationProps {
  onComplete: (data: RegistrationData) => void;
}

const Registration: React.FC<RegistrationProps> = ({ onComplete }) => {
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !jobTitle || !organization || !email || !city || !password || !confirmPassword) {
      setError('Merci de remplir tous les champs obligatoires.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError("L'adresse email n'est pas valide.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create User via API
      const userData = {
        fullName: fullName.trim(),
        jobTitle: jobTitle.trim(),
        organization: organization.trim(),
        email: email.trim().toLowerCase(),
        city: city.trim(),
        password: password
      };

      const newUser = await api.createUser(userData);
      console.log("User created via API:", newUser);

      if (!newUser || !newUser.id) {
        throw new Error("La réponse du serveur ne contient pas d'ID utilisateur.");
      }

      // 2. Upload Photo if selected
      let profilePhoto = newUser.profile_photo;
      if (photo && newUser.id) {
        try {
          const uploadResult = await api.uploadImage(photo, newUser.id);
          profilePhoto = uploadResult.path;
        } catch (imgError) {
          console.error("Failed to upload image", imgError);
          // We don't block registration if image fails, but we could warn
        }
      }

      // 3. Complete registration
      const registration: RegistrationData = {
        ...userData,
        registeredAt: newUser.registered_at || new Date().toISOString(),
        id: newUser.id.toString(),
        role: newUser.role,
        profilePhoto: profilePhoto
      };

      onComplete(registration);
    } catch (err: any) {
      console.error(err);
      setError("Une erreur est survenue lors de l'inscription. Veuillez réessayer. " + (err.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-page">
      <div className="auth-form-card">
        <div className="registration-header">
          <h1 style={{ color: '#667eea', fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Inscription à la plateforme
          </h1>
          <p className="auth-description">
            Créez votre compte d'accès en renseignant vos informations professionnelles. Ces données
            sont utilisées pour tracer la participation et générer votre certificat.
          </p>
        </div>

        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-form-label">Nom complet *</label>
            <input
              className="auth-form-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex. Marie KABILA"
              disabled={isSubmitting}
            />
          </div>
          <div className="auth-form-group">
            <label className="auth-form-label">Poste / Fonction *</label>
            <input
              className="auth-form-input"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Ex. Superviseur ME"
              disabled={isSubmitting}
            />
          </div>
          <div className="auth-form-group">
            <label className="auth-form-label">Organisation / Projet *</label>
            <input
              className="auth-form-input"
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Ex. ADRA TUDIENZELE"
              disabled={isSubmitting}
            />
          </div>
          <div className="auth-form-group">
            <label className="auth-form-label">Email professionnel *</label>
            <input
              className="auth-form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@exemple.com"
              disabled={isSubmitting}
            />
          </div>
          <div className="auth-form-group">
            <label className="auth-form-label">Ville / Zone de travail *</label>
            <input
              className="auth-form-input"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex. Kananga"
              disabled={isSubmitting}
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label">Mot de passe *</label>
            <input
              className="auth-form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
              disabled={isSubmitting}
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label">Confirmer le mot de passe *</label>
            <input
              className="auth-form-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre mot de passe"
              disabled={isSubmitting}
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label">Photo de profil (Optionnel)</label>
            <input
              className="auth-form-input"
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)}
              disabled={isSubmitting}
              style={{ padding: '0.75rem 1rem' }}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Inscription en cours...' : "Créer mon compte d'accès"}
          </button>
        </form>
      </div>
    </div>
  );

};

export default Registration;

