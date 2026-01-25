import React, { useState } from 'react';
import './HelpGuide.css';

const HelpGuide: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('getting-started');

    const sections = [
        { id: 'getting-started', title: '🚀 Démarrage', icon: '🚀' },
        { id: 'create-module', title: '📝 Créer un Module', icon: '📝' },
        { id: 'content-types', title: '📖 Types de Contenu', icon: '📖' },
        { id: 'quiz', title: '❓ Créer un Quiz', icon: '❓' },
        { id: 'certificate', title: '🎓 Configurer le Certificat', icon: '🎓' },
        { id: 'users', title: '👥 Gestion Utilisateurs', icon: '👥' },
        { id: 'settings', title: '⚙️ Paramètres', icon: '⚙️' },
        { id: 'troubleshooting', title: '🆘 Dépannage', icon: '🆘' }
    ];

    return (
        <div className="help-guide">
            <div className="help-sidebar">
                <h3>📚 Guide d'Utilisation</h3>
                <nav className="help-nav">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            className={`help-nav-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <span className="help-nav-icon">{section.icon}</span>
                            {section.title}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="help-content">
                {activeSection === 'getting-started' && <GettingStarted />}
                {activeSection === 'create-module' && <CreateModule />}
                {activeSection === 'content-types' && <ContentTypes />}
                {activeSection === 'quiz' && <QuizGuide />}
                {activeSection === 'certificate' && <CertificateGuide />}
                {activeSection === 'users' && <UsersGuide />}
                {activeSection === 'settings' && <SettingsGuide />}
                {activeSection === 'troubleshooting' && <Troubleshooting />}
            </div>
        </div>
    );
};

const GettingStarted: React.FC = () => (
    <div className="help-section">
        <h1>🚀 Démarrage Rapide</h1>

        <div className="help-card">
            <h2>🔐 Accès à l'Administration</h2>
            <p>Pour accéder à l'interface d'administration :</p>
            <ol>
                <li>Connectez-vous avec un compte <strong>admin</strong></li>
                <li>Sur le tableau de bord, cliquez sur la carte <strong>"Administration"</strong> (🛡️)</li>
                <li>Vous accédez au panneau avec 4 onglets principaux</li>
            </ol>
        </div>

        <div className="help-card">
            <h2>📊 Les 4 Onglets Principaux</h2>
            <div className="feature-grid">
                <div className="feature-item">
                    <div className="feature-icon">📈</div>
                    <h3>Vue d'ensemble</h3>
                    <p>Statistiques globales et métriques clés</p>
                </div>
                <div className="feature-item">
                    <div className="feature-icon">👥</div>
                    <h3>Utilisateurs</h3>
                    <p>Gestion des comptes et progression</p>
                </div>
                <div className="feature-item">
                    <div className="feature-icon">📚</div>
                    <h3>Modules</h3>
                    <p>Création et édition des formations</p>
                </div>
                <div className="feature-item">
                    <div className="feature-icon">⚙️</div>
                    <h3>Paramètres</h3>
                    <p>Configuration du site et apparence</p>
                </div>
            </div>
        </div>

        <div className="help-tip">
            <strong>💡 Conseil :</strong> Commencez par créer un module de test pour vous familiariser avec l'interface !
        </div>
    </div>
);

const CreateModule: React.FC = () => (
    <div className="help-section">
        <h1>📝 Créer un Nouveau Module</h1>

        <div className="help-card">
            <h2>Étape 1 : Création du Module Vide</h2>
            <ol>
                <li>Allez dans <strong>Administration → Modules</strong></li>
                <li>Cliquez sur le bouton <strong>"➕ Nouveau Module"</strong></li>
                <li>Remplissez le formulaire :
                    <ul>
                        <li><strong>Titre</strong> : Ex: "Hygiène et Sécurité"</li>
                        <li><strong>Description</strong> : Courte description du module</li>
                        <li><strong>Icône</strong> : Emoji (🏥, 🔥, 🏗️...) ou URL d'image</li>
                    </ul>
                </li>
                <li>Cliquez sur <strong>"Créer le module"</strong></li>
            </ol>
        </div>

        <div className="help-card">
            <h2>Étape 2 : Édition du Contenu</h2>
            <ol>
                <li>Dans la liste des modules, cliquez sur l'icône <strong>✏️ Éditer</strong></li>
                <li>Une interface d'édition JSON s'ouvre</li>
                <li>Modifiez le contenu selon vos besoins</li>
                <li>Cliquez sur <strong>"💾 Enregistrer"</strong></li>
            </ol>
        </div>

        <div className="help-card">
            <h2>📦 Structure JSON de Base</h2>
            <pre className="code-block">
                {`{
  "appTitle": "Titre de votre formation",
  "sections": [
    /* Vos sections de contenu */
  ],
  "quiz": {
    /* Questions d'évaluation */
  },
  "certificate": {
    /* Configuration du certificat */
  }
}`}
            </pre>
        </div>

        <div className="help-warning">
            <strong>⚠️ Important :</strong> Vérifiez toujours la syntaxe JSON avant d'enregistrer (accolades, virgules).
        </div>
    </div>
);

const ContentTypes: React.FC = () => (
    <div className="help-section">
        <h1>📖 Types de Contenu Disponibles</h1>

        <div className="help-card">
            <h2>1️⃣ Titre (heading)</h2>
            <pre className="code-block">
                {`{
  "type": "heading",
  "text": "Votre titre ici"
}`}
            </pre>
            <p>Utilisé pour les titres de section importants.</p>
        </div>

        <div className="help-card">
            <h2>2️⃣ Paragraphe (paragraph)</h2>
            <pre className="code-block">
                {`{
  "type": "paragraph",
  "text": "Votre paragraphe de texte ici..."
}`}
            </pre>
            <p>Pour du texte explicatif ou descriptif.</p>
        </div>

        <div className="help-card">
            <h2>3️⃣ Liste à puces (list)</h2>
            <pre className="code-block">
                {`{
  "type": "list",
  "items": [
    "Premier point",
    "Deuxième point",
    "Troisième point"
  ]
}`}
            </pre>
            <p>Affiche une liste avec des flèches (→).</p>
        </div>

        <div className="help-card">
            <h2>4️⃣ Liste numérotée (steps)</h2>
            <pre className="code-block">
                {`{
  "type": "steps",
  "items": [
    "Première étape",
    "Deuxième étape",
    "Troisième étape"
  ]
}`}
            </pre>
            <p>Affiche une liste numérotée avec badges circulaires.</p>
        </div>

        <div className="help-card">
            <h2>5️⃣ Checklist (checklist)</h2>
            <pre className="code-block">
                {`{
  "type": "checklist",
  "items": [
    "Tâche à cocher",
    "Autre tâche"
  ]
}`}
            </pre>
            <p>Affiche une liste avec des coches vertes ✓.</p>
        </div>

        <div className="help-card">
            <h2>6️⃣ Image (image)</h2>
            <pre className="code-block">
                {`{
  "type": "image",
  "src": "https://exemple.com/image.jpg",
  "caption": "Description (optionnel)"
}`}
            </pre>
            <p>Insère une image avec légende optionnelle.</p>
        </div>

        <div className="help-card">
            <h2>7️⃣ FAQ (faq)</h2>
            <pre className="code-block">
                {`{
  "type": "faq",
  "items": [
    {
      "question": "Question fréquente ?",
      "answer": "Réponse détaillée ici."
    }
  ]
}`}
            </pre>
            <p>Crée une section Questions/Réponses.</p>
        </div>

        <div className="help-tip">
            <strong>💡 Astuce :</strong> Vous pouvez combiner plusieurs types de contenu dans une même section !
        </div>
    </div>
);

const QuizGuide: React.FC = () => (
    <div className="help-section">
        <h1>❓ Créer un Quiz</h1>

        <div className="help-card">
            <h2>Structure de Base</h2>
            <pre className="code-block">
                {`{
  "quiz": {
    "title": "Quiz de validation",
    "instructions": "Répondez aux questions...",
    "timeLimit": 15,
    "questions": [
      /* Vos questions ici */
    ]
  }
}`}
            </pre>
            <p><strong>timeLimit</strong> : Temps en minutes (0 = pas de limite)</p>
        </div>

        <div className="help-card">
            <h2>Format d'une Question</h2>
            <pre className="code-block">
                {`{
  "text": "Quelle est la capitale de la France ?",
  "options": [
    "Londres",
    "Paris",
    "Berlin",
    "Rome"
  ],
  "correctAnswer": 1
}`}
            </pre>
        </div>

        <div className="help-warning">
            <strong>⚠️ Attention :</strong> <code>correctAnswer</code> commence à <strong>0</strong> !<br />
            Dans l'exemple ci-dessus, "Paris" est à l'index <strong>1</strong>.
        </div>

        <div className="help-card">
            <h2>Exemple Complet</h2>
            <pre className="code-block">
                {`{
  "quiz": {
    "title": "Évaluation Finale",
    "instructions": "10 questions - Score minimum : 80%",
    "timeLimit": 15,
    "questions": [
      {
        "text": "Que signifie HSE ?",
        "options": [
          "Hygiène, Sécurité, Environnement",
          "Haute Sécurité Européenne"
        ],
        "correctAnswer": 0
      },
      {
        "text": "Combien d'extincteurs par étage ?",
        "options": ["1", "2", "3", "4"],
        "correctAnswer": 1
      }
    ]
  }
}`}
            </pre>
        </div>

        <div className="help-tip">
            <strong>💡 Conseil :</strong> Créez au moins 5-10 questions pour une évaluation complète.
        </div>
    </div>
);

const CertificateGuide: React.FC = () => (
    <div className="help-section">
        <h1>🎓 Configurer le Certificat</h1>

        <div className="help-card">
            <h2>Paramètres Personnalisables</h2>
            <pre className="code-block">
                {`{
  "certificate": {
    "title": "CERTIFICAT DE RÉUSSITE",
    "subtitle": "Formation HSE - Niveau 1",
    "successMessage": "A réussi avec succès...",
    "logoText": "PM13",
    "leftLogoUrl": "https://...",
    "rightLogoUrl": "https://...",
    "signatureName": "Jean DUPONT",
    "signatureTitle": "Directeur Formation",
    "signatureImage": "https://...",
    "partnerLogos": [
      "https://partner1.png",
      "https://partner2.png"
    ]
  }
}`}
            </pre>
        </div>

        <div className="help-card">
            <h2>📋 Description des Champs</h2>
            <table className="help-table">
                <thead>
                    <tr>
                        <th>Champ</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>title</code></td>
                        <td>Titre principal du certificat</td>
                    </tr>
                    <tr>
                        <td><code>subtitle</code></td>
                        <td>Nom de la formation</td>
                    </tr>
                    <tr>
                        <td><code>successMessage</code></td>
                        <td>Message personnalisé de félicitations</td>
                    </tr>
                    <tr>
                        <td><code>logoText</code></td>
                        <td>Texte central (organisation)</td>
                    </tr>
                    <tr>
                        <td><code>leftLogoUrl</code></td>
                        <td>Logo en haut à gauche</td>
                    </tr>
                    <tr>
                        <td><code>rightLogoUrl</code></td>
                        <td>Logo en haut à droite</td>
                    </tr>
                    <tr>
                        <td><code>signatureName</code></td>
                        <td>Nom du signataire</td>
                    </tr>
                    <tr>
                        <td><code>signatureTitle</code></td>
                        <td>Fonction du signataire</td>
                    </tr>
                    <tr>
                        <td><code>signatureImage</code></td>
                        <td>Image de la signature manuscrite</td>
                    </tr>
                    <tr>
                        <td><code>partnerLogos</code></td>
                        <td>Liste d'URLs de logos partenaires</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div className="help-tip">
            <strong>💡 Astuce :</strong> Le certificat est téléchargeable en PDF directement depuis le navigateur.
        </div>
    </div>
);

const UsersGuide: React.FC = () => (
    <div className="help-section">
        <h1>👥 Gestion des Utilisateurs</h1>

        <div className="help-card">
            <h2>Voir la Progression</h2>
            <ol>
                <li>Allez dans <strong>Administration → Utilisateurs</strong></li>
                <li>Cliquez sur l'icône <strong>👁️ Voir</strong> à côté de l'utilisateur</li>
                <li>Vous voyez :
                    <ul>
                        <li>Informations personnelles</li>
                        <li>Modules commencés</li>
                        <li>Modules terminés</li>
                        <li>Scores obtenus</li>
                    </ul>
                </li>
            </ol>
        </div>

        <div className="help-card">
            <h2>Changer le Rôle</h2>
            <ol>
                <li>Cliquez sur <strong>✏️ Éditer</strong> à côté de l'utilisateur</li>
                <li>Modifiez le champ <strong>"Rôle"</strong> :
                    <ul>
                        <li><code>user</code> : Accès utilisateur standard</li>
                        <li><code>admin</code> : Accès administration complète</li>
                    </ul>
                </li>
                <li>Cliquez sur <strong>"Enregistrer"</strong></li>
            </ol>
        </div>

        <div className="help-card">
            <h2>Réinitialiser un Mot de Passe</h2>
            <ol>
                <li>Cliquez sur <strong>⚙️ Gérer</strong> à côté de l'utilisateur</li>
                <li>Cliquez sur <strong>"Réinitialiser le mot de passe"</strong></li>
                <li>Entrez le nouveau mot de passe</li>
                <li>Cliquez sur <strong>"Confirmer"</strong></li>
            </ol>
        </div>

        <div className="help-warning">
            <strong>⚠️ Sécurité :</strong> Communiquez le nouveau mot de passe de manière sécurisée (pas par email non chiffré).
        </div>
    </div>
);

const SettingsGuide: React.FC = () => (
    <div className="help-section">
        <h1>⚙️ Paramètres du Site</h1>

        <div className="help-card">
            <h2>🎨 Personnaliser les Couleurs</h2>
            <ol>
                <li>Allez dans <strong>Administration → Paramètres</strong></li>
                <li>Section <strong>"Apparence et Branding"</strong></li>
                <li>Modifiez les couleurs :
                    <ul>
                        <li><strong>Couleur Primaire</strong> : Boutons, liens, badges</li>
                        <li><strong>Login BG 1-4</strong> : Dégradé animé de la page de connexion</li>
                    </ul>
                </li>
                <li>Cliquez sur <strong>"💾 Enregistrer"</strong></li>
            </ol>
            <p>Les changements sont appliqués <strong>immédiatement</strong> pour tous les utilisateurs.</p>
        </div>

        <div className="help-card">
            <h2>🖼️ Changer le Logo</h2>
            <ol>
                <li>Dans <strong>Paramètres → "Logo du site"</strong></li>
                <li>Entrez l'URL de votre logo</li>
                <li>Cliquez sur <strong>"💾 Enregistrer"</strong></li>
            </ol>
            <p><strong>Format recommandé :</strong> PNG transparent, 200x80px</p>
        </div>

        <div className="help-card">
            <h2>✏️ Modifier le Nom du Site</h2>
            <ol>
                <li>Dans <strong>Paramètres → "Nom du site"</strong></li>
                <li>Entrez le nouveau nom (Ex: "Académie PM13")</li>
                <li>Cliquez sur <strong>"💾 Enregistrer"</strong></li>
            </ol>
        </div>

        <div className="help-tip">
            <strong>💡 Conseil :</strong> Testez les couleurs sur différents appareils (mobile, tablette, PC).
        </div>
    </div>
);

const Troubleshooting: React.FC = () => (
    <div className="help-section">
        <h1>🆘 Dépannage</h1>

        <div className="help-card error-card">
            <h2>❌ "Erreur de syntaxe JSON"</h2>
            <p><strong>Cause :</strong> Virgule manquante, accolade non fermée</p>
            <p><strong>Solution :</strong></p>
            <ul>
                <li>Vérifiez que chaque { } est bien fermée</li>
                <li>Vérifiez les virgules entre les éléments</li>
                <li>Utilisez un validateur JSON en ligne (jsonlint.com)</li>
            </ul>
        </div>

        <div className="help-card error-card">
            <h2>❌ "Le quiz ne s'affiche pas"</h2>
            <p><strong>Cause :</strong> Section quiz vide ou mal formatée</p>
            <p><strong>Solution :</strong></p>
            <ul>
                <li>Vérifiez que <code>questions</code> est un tableau non vide</li>
                <li>Assurez-vous que chaque question a bien <code>text</code>, <code>options</code> et <code>correctAnswer</code></li>
            </ul>
        </div>

        <div className="help-card error-card">
            <h2>❌ "Les images ne s'affichent pas"</h2>
            <p><strong>Cause :</strong> URL invalide ou serveur bloqué</p>
            <p><strong>Solution :</strong></p>
            <ul>
                <li>Vérifiez que l'URL commence par <code>https://</code></li>
                <li>Uploadez les images via l'admin Supabase</li>
                <li>Testez l'URL dans un nouvel onglet</li>
            </ul>
        </div>

        <div className="help-card error-card">
            <h2>❌ "Le certificat ne se télécharge pas"</h2>
            <p><strong>Cause :</strong> Navigateur bloque les popups</p>
            <p><strong>Solution :</strong></p>
            <ul>
                <li>Autorisez les popups pour ce site</li>
                <li>Désactivez temporairement le bloqueur de pubs</li>
                <li>Essayez avec un autre navigateur</li>
            </ul>
        </div>

        <div className="help-card error-card">
            <h2>❌ "Les modifications ne s'enregistrent pas"</h2>
            <p><strong>Cause :</strong> Problème de connexion ou session expirée</p>
            <p><strong>Solution :</strong></p>
            <ul>
                <li>Vérifiez votre connexion Internet</li>
                <li>Reconnectez-vous à la plateforme</li>
                <li>Copiez votre JSON avant de rafraîchir la page</li>
            </ul>
        </div>

        <div className="help-tip">
            <strong>💡 Conseil :</strong> Enregistrez régulièrement vos modifications et gardez une copie de sauvegarde du JSON.
        </div>
    </div>
);

export default HelpGuide;
