import React, { useState } from 'react';
import { RegistrationData } from '../types';
import { api } from '../api/client';
import './Login.css';
import './Auth.css';


interface LoginProps {
  onSelect: (reg: RegistrationData) => void;
  onNew: () => void;
  logo?: string;
  description?: string;
}

const Login: React.FC<LoginProps> = ({ onSelect, onNew, logo, description }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<RegistrationData[]>([]);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Use the centralized API client logic or construct URL properly
        // Mais api.getUsers n'existe pas dans client.ts, je vais devoir l'ajouter d'abord ou l'importer.
        // Attendez, l'api client a `checkHealth`, `createUser`, `loginUser`. Il n'a PAS `getUsers`.
        // Je vais devoir modifier Login.tsx pour utiliser l'URL correcte.

        // Option rapide: importer API_URL ou utiliser le client api
        // Je vais utiliser api.getUsers que je vais ajouter dans client.ts juste après.
        // Pour l'instant, je corrige Login.tsx pour utiliser api.getAllUsers() que je vais créer.

        const response = await api.getAllUsers();
        // response est déjà le json
        const data = response;
        // Map backend users to RegistrationData format
        const mappedUsers = data.map((user: any) => ({
          id: user.id.toString(),
          fullName: user.full_name,
          email: user.email,
          jobTitle: user.job_title,
          organization: user.organization,
          city: user.city,
          registeredAt: user.registered_at,
          role: user.role
        }));
        setUsers(mappedUsers);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, []);

  const handleSelectUser = (user: RegistrationData) => {
    setEmail(user.email);
    // Focus the password field
    const passwordInput = document.getElementById('login-password');
    if (passwordInput) (passwordInput as HTMLInputElement).focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const value = email.trim().toLowerCase();
    if (!value || !password) {
      setError('Veuillez entrer votre email et votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.loginUser({
        email: value,
        password: password
      });

      // Backend should return user object
      if (response.status === 'logged_in' && response.user) {
        // Map backend user to RegistrationData format expected by App
        const user = response.user;
        onSelect({
          id: user.id.toString(),
          fullName: user.full_name, // Note: DB uses snake_case, verify response structure
          email: user.email,
          jobTitle: user.job_title,
          organization: user.organization,
          city: user.city,
          registeredAt: user.registered_at,
          role: user.role
        });
      }
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="auth-form-card">
        {logo && (
          <div className="auth-logo">
            <img src={logo} alt="Logo" />
          </div>
        )}

        <div className="login-header">
          <h1 style={{ color: '#667eea', fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Connexion à la plateforme
          </h1>
          <p className="auth-description">
            {description || 'Connectez-vous avec votre email professionnel.'}
          </p>
        </div>

        {users.length > 0 && (
          <div className="login-users">
            <h2 style={{ fontSize: '1.1rem', color: '#333', marginBottom: '1rem', fontWeight: '600' }}>
              Sélectionnez votre compte
            </h2>
            <div className="login-users-list">
              {users.map(user => (
                <button
                  key={user.id}
                  className="login-user-item"
                  onClick={() => handleSelectUser(user)}
                  type="button"
                >
                  <div className="login-user-name">{user.fullName}</div>
                  <div className="login-user-meta">{user.jobTitle} - {user.organization}</div>
                  <div className="login-user-email">{user.email}</div>
                </button>
              ))}
            </div>
            <div className="login-divider">ou entrez vos informations ci-dessous</div>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-form-label">Email professionnel</label>
            <input
              className="auth-form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@exemple.com"
              disabled={loading}
            />
          </div>
          <div className="auth-form-group">
            <label className="auth-form-label">Mot de passe</label>
            <input
              className="auth-form-input"
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              disabled={loading}
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="login-footer">
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '0.75rem' }}>
            Vous n'avez pas encore de compte&nbsp;?
          </p>
          <button type="button" className="btn-new-account" onClick={onNew}>
            Créer un nouveau compte
          </button>
        </div>
      </div>
    </div>
  );

};

export default Login;

