import React, { useState, useEffect } from 'react';
import {
  ActivityData,
  ContentData,
  Section,
  QuizQuestion,
  CertificateData,
  RegistrationData,
} from '../types';
import './AdminPanel.css';

import { api } from '../api/client';

interface AdminPanelProps {
  initialData: ContentData;
  moduleId: string | null;
  moduleMetadata?: { title: string, description: string, icon: string };
  onUpdate: (data: ContentData) => void;
  onClose: () => void;
}

const STORAGE_KEY = 'pm13_content_override'; // Keep for backup? Or maybe not needed.

type TabType = 'general' | 'sections' | 'quiz' | 'certificate' | 'data' | 'json';

const AdminPanel: React.FC<AdminPanelProps> = ({ initialData, moduleId, moduleMetadata, onUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [data, setData] = useState<ContentData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [jsonValue, setJsonValue] = useState('');
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [meta, setMeta] = useState({ title: '', description: '', icon: '' });

  useEffect(() => {
    setData(initialData);
    if (moduleMetadata) {
      setMeta(moduleMetadata);
    }
    setJsonValue(JSON.stringify(initialData, null, 2));

    // Load local data for reports
    const storedRegs = localStorage.getItem('pm13_registrations');
    if (storedRegs) {
      try {
        setRegistrations(JSON.parse(storedRegs) as RegistrationData[]);
      } catch {
        setRegistrations([]);
      }
    }
    const storedAct = localStorage.getItem('pm13_activity_log');
    if (storedAct) {
      try {
        setActivities(JSON.parse(storedAct) as ActivityData[]);
      } catch {
        setActivities([]);
      }
    }
  }, [initialData, moduleMetadata]);

  const handleSave = async () => {
    setError(null);
    setInfo(null);
    try {
      let dataToSave = data;
      if (activeTab === 'json') {
        const parsed = JSON.parse(jsonValue) as ContentData;
        if (!parsed.sections || !parsed.quiz || !parsed.certificate) {
          throw new Error("Le JSON doit contenir 'sections', 'quiz' et 'certificate'.");
        }
        dataToSave = parsed;
      }

      if (moduleId) {
        await api.updateModule(moduleId, {
          title: meta.title || dataToSave.appTitle,
          description: meta.description,
          icon: meta.icon,
          data: dataToSave
        });
        setInfo('Contenu et métadonnées sauvegardés sur le serveur avec succès.');
      } else {
        // Fallback just update local state if no module ID (should not happen in new flow)
        setInfo('Attention: Pas d\'ID de module. Sauvegarde locale uniquement (volatile).');
      }

      setData(dataToSave);
      setJsonValue(JSON.stringify(dataToSave, null, 2));
      onUpdate(dataToSave);

      setTimeout(() => setInfo(null), 3000);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la validation/sauvegarde.');
    }
  };

  const handleReset = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les modifications NON SAUVEGARDÉES ?')) {
      setData(initialData);
      setJsonValue(JSON.stringify(initialData, null, 2));
      onUpdate(initialData);
      setInfo('Données rechargées depuis la dernière version enregistrée.');
      setError(null);
      setTimeout(() => setInfo(null), 3000);
    }
  };

  const updateSection = (index: number, section: Section) => {
    const newSections = [...data.sections];
    newSections[index] = section;
    setData({ ...data, sections: newSections });
  };

  const addSection = () => {
    const newSection: Section = {
      id: `section-${data.sections.length + 1}`,
      title: 'Nouvelle section',
      subtitle: 'Sous-titre',
      content: []
    };
    setData({ ...data, sections: [...data.sections, newSection] });
    setEditingSectionIndex(data.sections.length);
  };

  const deleteSection = (index: number) => {
    if (window.confirm('Supprimer cette section ?')) {
      const newSections = data.sections.filter((_, i) => i !== index);
      setData({ ...data, sections: newSections });
      setEditingSectionIndex(null);
    }
  };

  const updateQuestion = (index: number, question: QuizQuestion) => {
    const newQuestions = [...data.quiz.questions];
    newQuestions[index] = question;
    setData({
      ...data,
      quiz: { ...data.quiz, questions: newQuestions }
    });
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: data.quiz.questions.length + 1,
      question: 'Nouvelle question ?',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correct: 0
    };
    setData({
      ...data,
      quiz: {
        ...data.quiz,
        questions: [...data.quiz.questions, newQuestion]
      }
    });
    setEditingQuestionIndex(data.quiz.questions.length);
  };

  const deleteQuestion = (index: number) => {
    if (window.confirm('Supprimer cette question ?')) {
      const newQuestions = data.quiz.questions.filter((_, i) => i !== index);
      setData({
        ...data,
        quiz: { ...data.quiz, questions: newQuestions }
      });
      setEditingQuestionIndex(null);
    }
  };

  const renderGeneralTab = () => (
    <div className="admin-tab-content">
      <h3>Informations générales du cours</h3>
      <div className="admin-form-group">
        <label>Titre de la formation</label>
        <input
          type="text"
          value={meta.title || data.appTitle}
          onChange={(e) => {
            setMeta({ ...meta, title: e.target.value });
            setData({ ...data, appTitle: e.target.value });
          }}
          className="admin-input"
        />
      </div>
      <div className="admin-form-group">
        <label>Description (visible sur le dashboard)</label>
        <textarea
          value={meta.description}
          onChange={(e) => setMeta({ ...meta, description: e.target.value })}
          className="admin-textarea-small"
          rows={3}
        />
      </div>
      <div className="admin-form-group">
        <label>Icône (Emoji ou URL image)</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            value={meta.icon}
            onChange={(e) => setMeta({ ...meta, icon: e.target.value })}
            className="admin-input"
            placeholder="Emoji ou URL..."
          />
          {/* Image Upload for Icon */}
          <label className="btn-admin-edit admin-image-upload" style={{ margin: 0 }}>
            Upload
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  try {
                    const res = await api.uploadImage(e.target.files[0]);
                    setMeta({ ...meta, icon: res.path }); // Assuming response has { path: '/uploads/...' }
                  } catch (err) {
                    alert('Erreur lors de l\'upload de l\'icône');
                  }
                }
              }}
            />
          </label>
        </div>
        {meta.icon && (meta.icon.startsWith('http') || meta.icon.startsWith('/')) && (
          <img src={meta.icon} alt="Icon Preview" style={{ width: '50px', height: '50px', objectFit: 'contain', marginTop: '0.5rem' }} />
        )}
      </div>
      <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #eee' }} />
      <h3>Configuration du Quiz</h3>
      <div className="admin-form-group">
        <label>Titre du quiz</label>
        <input
          type="text"
          value={data.quiz.title}
          onChange={(e) => setData({
            ...data,
            quiz: { ...data.quiz, title: e.target.value }
          })}
          className="admin-input"
        />
      </div>
      <div className="admin-form-group">
        <label>Minuteur (en minutes, 0 pour illimité)</label>
        <input
          type="number"
          min="0"
          value={data.quiz.timeLimit || 0}
          onChange={(e) => setData({
            ...data,
            quiz: { ...data.quiz, timeLimit: parseInt(e.target.value) || 0 }
          })}
          className="admin-input"
          style={{ width: '150px' }}
        />
      </div>
      <div className="admin-form-group">
        <label>Instructions du quiz</label>
        <textarea
          value={data.quiz.instructions}
          onChange={(e) => setData({
            ...data,
            quiz: { ...data.quiz, instructions: e.target.value }
          })}
          className="admin-textarea-small"
          rows={3}
        />
      </div>
    </div>
  );

  const renderSectionsTab = () => (
    <div className="admin-tab-content">
      <div className="admin-tab-header">
        <h3>Sections pédagogiques ({data.sections.length})</h3>
        <button className="btn-admin-add" onClick={addSection}>
          + Ajouter une section
        </button>
      </div>
      <div className="sections-list">
        {data.sections.map((section, index) => (
          <div key={section.id} className="section-editor-card">
            {editingSectionIndex === index ? (
              <div className="section-editor-form">
                <div className="admin-form-group">
                  <label>ID de la section</label>
                  <input
                    type="text"
                    value={section.id}
                    onChange={(e) => updateSection(index, { ...section, id: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Titre</label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(index, { ...section, title: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Sous-titre</label>
                  <input
                    type="text"
                    value={section.subtitle}
                    onChange={(e) => updateSection(index, { ...section, subtitle: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Contenu (JSON)</label>
                  <textarea
                    value={JSON.stringify(section.content, null, 2)}
                    onChange={(e) => {
                      try {
                        const content = JSON.parse(e.target.value);
                        updateSection(index, { ...section, content });
                      } catch {
                        // on laisse l'utilisateur corriger le JSON
                      }
                    }}
                    className="admin-textarea-small"
                    rows={8}
                  />
                  <small>
                    Format JSON pour le contenu (paragraphes, listes, étapes, FAQ, images).
                    Pour une image&nbsp;: {'{ \"type\": \"image\", \"src\": \"URL\", \"alt\": \"Texte\", \"caption\": \"Légende\" }'}
                  </small>
                  <button
                    type="button"
                    className="btn-admin-add"
                    style={{ marginTop: '0.5rem' }}
                    onClick={() => {
                      const newContent = [
                        ...(section.content || []),
                        {
                          type: 'image' as const,
                          src: 'https://via.placeholder.com/900x420?text=Illustration+PM13',
                          alt: 'Illustration PM13',
                          caption: 'Image d’illustration à personnaliser',
                        },
                      ];
                      updateSection(index, { ...section, content: newContent });
                    }}
                  >
                    + Ajouter une image d’illustration
                  </button>
                </div>
                <div className="admin-images-tools">
                  <h4>Images de la section</h4>
                  {section.content?.filter((c: any) => c.type === 'image').length === 0 && (
                    <p className="admin-images-empty">Aucune image pour l’instant.</p>
                  )}
                  <div className="admin-images-list">
                    {section.content
                      ?.map((c: any, contentIndex: number) => ({ c, contentIndex }))
                      .filter((item) => item.c.type === 'image')
                      .map(({ c, contentIndex }) => (
                        <div key={contentIndex} className="admin-image-item">
                          {c.src && (
                            <img
                              src={c.src}
                              alt={c.alt || 'Illustration'}
                              className="admin-image-preview"
                            />
                          )}
                          <div className="admin-image-meta">
                            <div className="admin-image-caption">
                              {c.caption || '(sans légende)'}
                            </div>
                            <div className="admin-image-actions">
                              <button
                                type="button"
                                className="btn-admin-secondary"
                                onClick={() => {
                                  const newContent = [...(section.content || [])];
                                  newContent.splice(contentIndex, 1);
                                  updateSection(index, { ...section, content: newContent });
                                }}
                              >
                                Supprimer l’image
                              </button>
                              <label className="btn-admin-edit admin-image-upload">
                                Changer (fichier local)
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      const src = reader.result as string;
                                      const newContent = [...(section.content || [])];
                                      newContent[contentIndex] = {
                                        ...(newContent[contentIndex] || {}),
                                        type: 'image' as const,
                                        src,
                                        alt: file.name,
                                        caption: c.caption || file.name,
                                      };
                                      updateSection(index, { ...section, content: newContent });
                                    };
                                    reader.readAsDataURL(file);
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="admin-image-upload-new">
                    <label className="btn-admin-secondary admin-image-upload">
                      + Ajouter une image depuis votre ordinateur
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const src = reader.result as string;
                            const newContent = [
                              ...(section.content || []),
                              {
                                type: 'image' as const,
                                src,
                                alt: file.name,
                                caption: file.name,
                              },
                            ];
                            updateSection(index, { ...section, content: newContent });
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="section-editor-actions">
                  <button
                    className="btn-admin-secondary"
                    onClick={() => setEditingSectionIndex(null)}
                  >
                    Fermer
                  </button>
                  <button
                    className="btn-admin-danger"
                    onClick={() => deleteSection(index)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <div className="section-editor-preview">
                <h4>{section.title}</h4>
                <p className="section-subtitle-preview">{section.subtitle}</p>
                <button
                  className="btn-admin-edit"
                  onClick={() => setEditingSectionIndex(index)}
                >
                  ✏️ Modifier
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderQuizTab = () => (
    <div className="admin-tab-content">
      <div className="admin-tab-header">
        <h3>Questions du quiz ({data.quiz.questions.length})</h3>
        <button className="btn-admin-add" onClick={addQuestion}>
          + Ajouter une question
        </button>
      </div>
      <div className="questions-list">
        {data.quiz.questions.map((question, index) => (
          <div key={question.id} className="question-editor-card">
            {editingQuestionIndex === index ? (
              <div className="question-editor-form">
                <div className="admin-form-group">
                  <label>Question</label>
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(index, { ...question, question: e.target.value })}
                    className="admin-textarea-small"
                    rows={2}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Options (une par ligne)</label>
                  <textarea
                    value={question.options.join('\n')}
                    onChange={(e) => {
                      const options = e.target.value.split('\n').filter(o => o.trim());
                      updateQuestion(index, { ...question, options });
                    }}
                    className="admin-textarea-small"
                    rows={4}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Réponse correcte (index)</label>
                  <select
                    value={question.correct}
                    onChange={(e) => updateQuestion(index, {
                      ...question,
                      correct: parseInt(e.target.value)
                    })}
                    className="admin-select"
                  >
                    {question.options.map((_, optIndex) => (
                      <option key={optIndex} value={optIndex}>
                        Option {optIndex + 1}: {question.options[optIndex]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Temps limite (secondes, 0 pour défaut/illimité)</label>
                  <input
                    type="number"
                    min="0"
                    value={question.timeLimit || 0}
                    onChange={(e) => updateQuestion(index, {
                      ...question,
                      timeLimit: parseInt(e.target.value) || 0
                    })}
                    className="admin-input"
                    style={{ width: '120px' }}
                  />
                </div>
                <div className="question-editor-actions">
                  <button
                    className="btn-admin-secondary"
                    onClick={() => setEditingQuestionIndex(null)}
                  >
                    Fermer
                  </button>
                  <button
                    className="btn-admin-danger"
                    onClick={() => deleteQuestion(index)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <div className="question-editor-preview">
                <div className="question-number">Question {index + 1}</div>
                <h4>{question.question}</h4>
                <ul className="question-options-preview">
                  {question.options.map((opt, optIndex) => (
                    <li key={optIndex} className={optIndex === question.correct ? 'correct-answer' : ''}>
                      {optIndex === question.correct && '✓ '}
                      {opt}
                    </li>
                  ))}
                </ul>
                <button
                  className="btn-admin-edit"
                  onClick={() => setEditingQuestionIndex(index)}
                >
                  ✏️ Modifier
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCertificateTab = () => (
    <div className="admin-tab-content">
      <h3>Paramètres du certificat</h3>
      <div className="admin-form-group">
        <label>Titre du certificat</label>
        <input
          type="text"
          value={data.certificate.title || ''}
          onChange={(e) => setData({
            ...data,
            certificate: { ...data.certificate, title: e.target.value }
          })}
          className="admin-input"
        />
      </div>
      <div className="admin-form-group">
        <label>Sous-titre</label>
        <input
          type="text"
          value={data.certificate.subtitle || ''}
          onChange={(e) => setData({
            ...data,
            certificate: { ...data.certificate, subtitle: e.target.value }
          })}
          className="admin-input"
        />
      </div>
      <div className="admin-form-group">
        <label>Message de réussite</label>
        <textarea
          value={data.certificate.successMessage || ''}
          onChange={(e) => setData({
            ...data,
            certificate: { ...data.certificate, successMessage: e.target.value }
          })}
          className="admin-textarea-small"
          rows={4}
        />
      </div>
      <div className="admin-form-group">
        <label>Texte du logo</label>
        <input
          type="text"
          value={data.certificate.logoText || ''}
          onChange={(e) => setData({
            ...data,
            certificate: { ...data.certificate, logoText: e.target.value }
          })}
          className="admin-input"
        />
      </div>
      <div className="admin-form-group">
        <label>Logo gauche (URL ou Image)</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="https://.../logo-adra.png"
            value={data.certificate.leftLogoUrl || ''}
            onChange={(e) => setData({
              ...data,
              certificate: { ...data.certificate, leftLogoUrl: e.target.value }
            })}
            className="admin-input"
          />
          <label className="btn-admin-edit admin-image-upload" style={{ margin: 0 }}>
            Upload
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  try {
                    const res = await api.uploadImage(e.target.files[0]);
                    setData({
                      ...data,
                      certificate: { ...data.certificate, leftLogoUrl: res.path }
                    });
                  } catch (err) {
                    alert('Erreur lors de l\'upload du logo');
                  }
                }
              }}
            />
          </label>
        </div>
        {data.certificate.leftLogoUrl && (
          <img src={data.certificate.leftLogoUrl} alt="Preview" style={{ height: '40px', marginTop: '5px', objectFit: 'contain' }} />
        )}
      </div>
      <div className="admin-form-group">
        <label>Logo droit (URL ou Image)</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="https://.../logo-partenaire.png"
            value={data.certificate.rightLogoUrl || ''}
            onChange={(e) => setData({
              ...data,
              certificate: { ...data.certificate, rightLogoUrl: e.target.value }
            })}
            className="admin-input"
          />
          <label className="btn-admin-edit admin-image-upload" style={{ margin: 0 }}>
            Upload
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  try {
                    const res = await api.uploadImage(e.target.files[0]);
                    setData({
                      ...data,
                      certificate: { ...data.certificate, rightLogoUrl: res.path }
                    });
                  } catch (err) {
                    alert('Erreur lors de l\'upload du logo');
                  }
                }
              }}
            />
          </label>
        </div>
        {data.certificate.rightLogoUrl && (
          <img src={data.certificate.rightLogoUrl} alt="Preview" style={{ height: '40px', marginTop: '5px', objectFit: 'contain' }} />
        )}
      </div>
      <div className="admin-form-group">
        <label>Nom pour la signature</label>
        <input
          type="text"
          placeholder="Nom du signataire"
          value={data.certificate.signatureName || ''}
          onChange={(e) => setData({
            ...data,
            certificate: { ...data.certificate, signatureName: e.target.value }
          })}
          className="admin-input"
        />
      </div>
      <div className="admin-form-group">
        <label>Fonction / titre sous la signature</label>
        <input
          type="text"
          placeholder="Fonction du signataire"
          value={data.certificate.signatureTitle || ''}
          onChange={(e) => setData({
            ...data,
            certificate: { ...data.certificate, signatureTitle: e.target.value }
          })}
          className="admin-input"
        />
      </div>
      <div className="admin-form-group">
        <label>Image de la signature (PNG)</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label className="btn-admin-edit admin-image-upload" style={{ margin: 0, width: '100%' }}>
            Choisir une image
            <input
              type="file"
              accept="image/png,image/jpeg"
              style={{ display: 'none' }}
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  try {
                    const res = await api.uploadImage(e.target.files[0]);
                    setData({
                      ...data,
                      certificate: { ...data.certificate, signatureImage: res.path }
                    });
                  } catch (err) {
                    alert('Erreur lors de l\'upload de la signature');
                  }
                }
              }}
            />
          </label>
        </div>
        {data.certificate.signatureImage && (
          <div style={{ marginTop: '5px', padding: '10px', background: '#f9f9f9', border: '1px dashed #ccc', textAlign: 'center' }}>
            <img src={data.certificate.signatureImage} alt="Signature Preview" style={{ maxHeight: '60px', objectFit: 'contain' }} />
            <button
              onClick={() => setData({ ...data, certificate: { ...data.certificate, signatureImage: undefined } })}
              style={{ display: 'block', margin: '5px auto 0', fontSize: '0.8rem', color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Supprimer
            </button>
          </div>
        )}
      </div>

      <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #eee' }} />
      <h3>Logos Partenaires (Bas de page)</h3>
      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
        Ajoutez jusqu'à 5 logos qui apparaîtront au bas du certificat.
      </p>

      <div className="admin-partner-logos" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {(data.certificate.partnerLogos || []).map((logoUrl, idx) => (
          <div key={idx} style={{ position: 'relative', border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px', background: '#f9f9f9', width: '100px', textAlign: 'center' }}>
            <img src={logoUrl} alt={`Partner ${idx + 1}`} style={{ width: '100%', height: '60px', objectFit: 'contain' }} />
            <button
              onClick={() => {
                const newLogos = [...(data.certificate.partnerLogos || [])];
                newLogos.splice(idx, 1);
                setData({ ...data, certificate: { ...data.certificate, partnerLogos: newLogos } });
              }}
              style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
            >
              ✕
            </button>
          </div>
        ))}

        {(!data.certificate.partnerLogos || data.certificate.partnerLogos.length < 5) && (
          <label className="btn-admin-add" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100px', height: '80px', margin: 0, cursor: 'pointer', border: '2px dashed #ccc', background: 'transparent', color: '#666' }}>
            <span style={{ fontSize: '1.5rem' }}>+</span>
            <span style={{ fontSize: '0.8rem' }}>Ajouter</span>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  try {
                    const res = await api.uploadImage(e.target.files[0]);
                    const currentLogos = data.certificate.partnerLogos || [];
                    setData({
                      ...data,
                      certificate: { ...data.certificate, partnerLogos: [...currentLogos, res.path] }
                    });
                  } catch (err) {
                    alert('Erreur lors de l\'upload');
                  }
                }
              }}
            />
          </label>
        )}
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="admin-tab-content">
      <h3>Données locales du module</h3>
      <div className="admin-help">
        Ces données sont stockées uniquement dans le navigateur (localStorage) de cet ordinateur.
        Elles ne sont pas envoyées sur un serveur.
      </div>

      <div className="admin-data-section">
        <h4>Comptes inscrits ({registrations.length})</h4>
        {registrations.length === 0 ? (
          <p className="admin-images-empty">Aucun compte inscrit pour l’instant.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Poste</th>
                  <th>Organisation</th>
                  <th>Email</th>
                  <th>Ville</th>
                  <th>Date inscription</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fullName}</td>
                    <td>{r.jobTitle}</td>
                    <td>{r.organization}</td>
                    <td>{r.email}</td>
                    <td>{r.city}</td>
                    <td>{new Date(r.registeredAt).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-data-section">
        <h4>Activités quiz ({activities.length})</h4>
        {activities.length === 0 ? (
          <p className="admin-images-empty">Aucune activité de quiz enregistrée.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a, idx) => (
                  <tr key={`${a.completedAt}-${idx}`}>
                    <td>{a.fullName}</td>
                    <td>{a.score.toFixed(0)}%</td>
                    <td>{new Date(a.completedAt).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderJsonTab = () => (
    <div className="admin-tab-content">
      <h3>Édition JSON complète</h3>
      <p className="admin-help">
        Édition avancée du JSON complet. Assurez-vous que le format est valide avant d'enregistrer.
      </p>
      <textarea
        className="admin-textarea"
        value={jsonValue}
        onChange={(e) => setJsonValue(e.target.value)}
      />
    </div>
  );

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>🔧 Administration – Contenu de la formation</h2>
        <button className="btn-close-admin" onClick={onClose}>
          ✕ Fermer
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          📋 Général
        </button>
        <button
          className={`admin-tab ${activeTab === 'sections' ? 'active' : ''}`}
          onClick={() => setActiveTab('sections')}
        >
          📚 Sections ({data.sections.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz')}
        >
          ❓ Quiz ({data.quiz.questions.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'certificate' ? 'active' : ''}`}
          onClick={() => setActiveTab('certificate')}
        >
          🏆 Certificat
        </button>
        <button
          className={`admin-tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => {
            // recharger les données à l'ouverture de l'onglet
            const storedRegs = localStorage.getItem('pm13_registrations');
            if (storedRegs) {
              try {
                setRegistrations(JSON.parse(storedRegs) as RegistrationData[]);
              } catch {
                setRegistrations([]);
              }
            }
            const storedAct = localStorage.getItem('pm13_activity_log');
            if (storedAct) {
              try {
                setActivities(JSON.parse(storedAct) as ActivityData[]);
              } catch {
                setActivities([]);
              }
            }
            setActiveTab('data');
          }}
        >
          📊 Données
        </button>
        <button
          className={`admin-tab ${activeTab === 'json' ? 'active' : ''}`}
          onClick={() => setActiveTab('json')}
        >
          ⚙️ JSON complet
        </button>
      </div>

      {activeTab === 'general' && renderGeneralTab()}
      {activeTab === 'sections' && renderSectionsTab()}
      {activeTab === 'quiz' && renderQuizTab()}
      {activeTab === 'certificate' && renderCertificateTab()}
      {activeTab === 'data' && renderDataTab()}
      {activeTab === 'json' && renderJsonTab()}

      {error && <div className="admin-error">⚠️ Erreur : {error}</div>}
      {info && <div className="admin-info">✓ {info}</div>}

      <div className="admin-actions">
        <button className="btn-admin-secondary" onClick={handleReset}>
          🔄 Réinitialiser
        </button>
        <button className="btn-admin-primary" onClick={handleSave}>
          💾 Enregistrer les modifications
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
