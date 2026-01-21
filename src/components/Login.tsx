import React, { useState } from 'react';
import { RegistrationData } from '../types';
import { api } from '../api/client';
import './Login.css';

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
        const response = await fetch('/api/users');
        if (!response.ok) return;
        const data = await response.json();
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
      <div className="login-card">
        <div className="login-header">
          {logo && (
            <div className="login-logo">
              <img src={logo} alt="Logo" />
            </div>
          )}
          <h1>Connexion à la plateforme PM13</h1>
          <p>
            {description || 'Connectez-vous avec votre email professionnel.'}
          </p>
        </div>

        {users.length > 0 && (
          <div className="login-users">
            <h2>Sélectionnez votre compte</h2>
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
          <div className="form-group">
            <label>Email professionnel</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@exemple.com"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              disabled={loading}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="login-footer">
          <p>Vous n'avez pas encore de compte&nbsp;?</p>
          <button type="button" className="btn-new-account" onClick={onNew}>
            Créer un nouveau compte
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

