import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { ContentData, Section, ContentItem, QuizQuestion, QuizData } from '../types';
import { api } from '../api/client';
import toast from 'react-hot-toast';

interface CourseBuilderProps {
    initialData: ContentData;
    onSave: (data: ContentData) => Promise<void>;
    onCancel: () => void;
}

const CourseBuilder: React.FC<CourseBuilderProps> = ({ initialData, onSave, onCancel }) => {
    const [data, setData] = useState<ContentData>(initialData);
    const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'certificate'>('content');
    const [expandedSection, setExpandedSection] = useState<number | null>(null);

    const handleSave = async () => {
        const toastId = toast.loading("Sauvegarde du cours...");
        try {
            await onSave(data);
            toast.success("Cours sauvegardé !", { id: toastId });
        } catch (error) {
            toast.error("Erreur lors de la sauvegarde", { id: toastId });
        }
    };

    // --- Section Management ---
    const addSection = () => {
        const newSection: Section = {
            id: `section-${Date.now()}`,
            title: 'Nouvelle Section',
            subtitle: 'Sous-titre de la section',
            content: []
        };
        setData({ ...data, sections: [...data.sections, newSection] });
        setExpandedSection(data.sections.length); // Open the new section
    };

    const updateSection = (index: number, field: keyof Section, value: any) => {
        const newSections = [...data.sections];
        newSections[index] = { ...newSections[index], [field]: value };
        setData({ ...data, sections: newSections });
    };

    const removeSection = (index: number) => {
        if (window.confirm("Supprimer cette section ?")) {
            const newSections = data.sections.filter((_, i) => i !== index);
            setData({ ...data, sections: newSections });
            setExpandedSection(null);
        }
    };

    // --- Content Item Management ---
    const addContentItem = (sectionIndex: number, type: ContentItem['type']) => {
        const newItem: ContentItem = { type, text: '' };
        if (type === 'list' || type === 'steps' || type === 'checklist') newItem.items = ['Nouvel élément'];
        if (type === 'faq') newItem.items = [{ question: 'Question ?', answer: 'Réponse' }];
        if (type === 'video') { newItem.src = ''; newItem.caption = ''; }
        if (type === 'document') { newItem.src = ''; newItem.text = 'Nouveau document'; newItem.caption = ''; }

        const newSections = [...data.sections];
        newSections[sectionIndex].content.push(newItem);
        setData({ ...data, sections: newSections });
    };

    const updateContentItem = (sectionIndex: number, itemIndex: number, field: keyof ContentItem, value: any) => {
        const newSections = [...data.sections];
        newSections[sectionIndex].content[itemIndex] = {
            ...newSections[sectionIndex].content[itemIndex],
            [field]: value
        };
        setData({ ...data, sections: newSections });
    };

    const removeContentItem = (sectionIndex: number, itemIndex: number) => {
        const newSections = [...data.sections];
        newSections[sectionIndex].content = newSections[sectionIndex].content.filter((_, i) => i !== itemIndex);
        setData({ ...data, sections: newSections });
    };

    // --- Quiz Management ---
    const addQuestion = () => {
        const newQ: QuizQuestion = {
            id: Date.now(),
            question: 'Nouvelle question ?',
            options: ['Réponse A', 'Réponse B'],
            correct: 0
        };
        setData({
            ...data,
            quiz: { ...data.quiz, questions: [...data.quiz.questions, newQ] }
        });
    };

    const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
        const newQuestions = [...data.quiz.questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setData({
            ...data,
            quiz: { ...data.quiz, questions: newQuestions }
        });
    };

    const removeQuestion = (index: number) => {
        const newQuestions = data.quiz.questions.filter((_, i) => i !== index);
        setData({
            ...data,
            quiz: { ...data.quiz, questions: newQuestions }
        });
    };

    // --- Image Upload Helper ---
    const handleImageUpload = async (file: File, callback: (url: string) => void) => {
        const toastId = toast.loading("Upload image...");
        try {
            const result = await api.uploadImage(file);
            callback(result.path);
            toast.success("Image ajoutée", { id: toastId });
        } catch (e) {
            toast.error("Erreur upload", { id: toastId });
        }
    };

    return (
        <div className="course-builder">
            <div className="builder-header">
                <h2>🛠️ Éditeur de Parcours</h2>
                <div className="builder-actions">
                    <button className="btn-cancel" onClick={onCancel}>Fermer</button>
                    <button className="btn-save" onClick={handleSave}>💾 Sauvegarder</button>
                </div>
            </div>

            <div className="builder-tabs">
                <button className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>📖 Contenu</button>
                <button className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => setActiveTab('quiz')}>❓ Quiz</button>
                <button className={`tab-btn ${activeTab === 'certificate' ? 'active' : ''}`} onClick={() => setActiveTab('certificate')}>🏆 Certificat</button>
            </div>

            <div className="builder-content">
                {/* --- CONTENT TAB --- */}
                {activeTab === 'content' && (
                    <div className="sections-list">
                        <div className="form-group mb-4">
                            <label>Titre global du cours</label>
                            <input
                                value={data.appTitle}
                                onChange={e => setData({ ...data, appTitle: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        {data.sections.map((section, sIdx) => (
                            <div key={section.id} className="section-editor-item">
                                <div className="section-header-bar" onClick={() => setExpandedSection(expandedSection === sIdx ? null : sIdx)}>
                                    <span className="font-bold">Section {sIdx + 1}: {section.title}</span>
                                    <div className="flex gap-2">
                                        <button className="btn-icon-sm" onClick={(e) => { e.stopPropagation(); removeSection(sIdx); }}>🗑️</button>
                                        <span>{expandedSection === sIdx ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {expandedSection === sIdx && (
                                    <div className="section-body">
                                        <div className="form-group">
                                            <label>Titre Section</label>
                                            <input value={section.title} onChange={e => updateSection(sIdx, 'title', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Sous-titre</label>
                                            <input value={section.subtitle} onChange={e => updateSection(sIdx, 'subtitle', e.target.value)} />
                                        </div>

                                        <div className="content-items-list">
                                            <h4>Contenus ({section.content.length})</h4>
                                            {section.content.map((item, cIdx) => (
                                                <div key={cIdx} className="content-item-editor">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="badge-type">{item.type}</span>
                                                        <button className="text-red-500 text-sm" onClick={() => removeContentItem(sIdx, cIdx)}>Supprimer</button>
                                                    </div>

                                                    {/* Editor based on type */}
                                                    {(item.type === 'paragraph' || item.type === 'heading') && (
                                                        <textarea
                                                            value={item.text}
                                                            onChange={e => updateContentItem(sIdx, cIdx, 'text', e.target.value)}
                                                            className="w-full p-2 border rounded"
                                                            rows={3}
                                                            placeholder="Texte..."
                                                        />
                                                    )}

                                                    {(item.type === 'list' || item.type === 'steps' || item.type === 'checklist') && (
                                                        <div>
                                                            <textarea
                                                                value={(item.items as string[]).join('\n')}
                                                                onChange={e => updateContentItem(sIdx, cIdx, 'items', e.target.value.split('\n'))}
                                                                className="w-full p-2 border rounded"
                                                                rows={4}
                                                                placeholder="Un élément par ligne..."
                                                            />
                                                            <p className="text-xs text-gray-500">Un élément par ligne</p>
                                                        </div>
                                                    )}

                                                    {item.type === 'image' && (
                                                        <div>
                                                            <div className="flex gap-2 mb-2">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], (url) => updateContentItem(sIdx, cIdx, 'src', url))}
                                                                />
                                                            </div>
                                                            {item.src && <img src={item.src} className="h-20 object-contain" alt="Preview" />}
                                                            <input
                                                                value={item.caption || ''}
                                                                onChange={e => updateContentItem(sIdx, cIdx, 'caption', e.target.value)}
                                                                placeholder="Légende (optionnel)"
                                                                className="w-full mt-2 p-1 border rounded"
                                                            />
                                                        </div>
                                                    )}

                                                    {item.type === 'video' && (
                                                        <div>
                                                            <input
                                                                value={item.src || ''}
                                                                onChange={e => updateContentItem(sIdx, cIdx, 'src', e.target.value)}
                                                                placeholder="Lien YouTube ou URL Vidéo"
                                                                className="w-full p-2 border rounded mb-2"
                                                            />
                                                            <input
                                                                value={item.caption || ''}
                                                                onChange={e => updateContentItem(sIdx, cIdx, 'caption', e.target.value)}
                                                                placeholder="Titre de la vidéo"
                                                                className="w-full p-2 border rounded"
                                                            />
                                                        </div>
                                                    )}

                                                    {item.type === 'document' && (
                                                        <div>
                                                            <div className="flex gap-2 mb-2 items-center">
                                                                <span style={{ fontSize: '1.5rem' }}>📄</span>
                                                                <input
                                                                    type="file"
                                                                    accept=".pdf,.doc,.docx"
                                                                    onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], (url) => {
                                                                        updateContentItem(sIdx, cIdx, 'src', url);
                                                                        updateContentItem(sIdx, cIdx, 'text', e.target.files![0].name);
                                                                    })}
                                                                />
                                                            </div>
                                                            <input
                                                                value={item.text || ''}
                                                                onChange={e => updateContentItem(sIdx, cIdx, 'text', e.target.value)}
                                                                placeholder="Nom du fichier"
                                                                className="w-full p-2 border rounded mb-2"
                                                            />
                                                            <input
                                                                value={item.caption || ''}
                                                                onChange={e => updateContentItem(sIdx, cIdx, 'caption', e.target.value)}
                                                                placeholder="Description du document"
                                                                className="w-full p-2 border rounded"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            <div className="add-content-bar">
                                                <small>Ajouter :</small>
                                                <button onClick={() => addContentItem(sIdx, 'heading')}>Titre</button>
                                                <button onClick={() => addContentItem(sIdx, 'paragraph')}>Texte</button>
                                                <button onClick={() => addContentItem(sIdx, 'list')}>Liste</button>
                                                <button onClick={() => addContentItem(sIdx, 'checklist')}>Checklist</button>
                                                <button onClick={() => addContentItem(sIdx, 'steps')}>Étapes</button>
                                                <button onClick={() => addContentItem(sIdx, 'image')}>Image</button>
                                                <button onClick={() => addContentItem(sIdx, 'video')}>Vidéo</button>
                                                <button onClick={() => addContentItem(sIdx, 'document')}>Fichier</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button className="btn-add-section" onClick={addSection}>➕ Ajouter une Section</button>
                    </div>
                )}

                {/* --- QUIZ TAB --- */}
                {activeTab === 'quiz' && (
                    <div className="quiz-editor">
                        <div className="form-group">
                            <label>Titre du Quiz</label>
                            <input value={data.quiz.title} onChange={e => setData({ ...data, quiz: { ...data.quiz, title: e.target.value } })} />
                        </div>
                        <div className="form-group">
                            <label>Instructions</label>
                            <textarea value={data.quiz.instructions} onChange={e => setData({ ...data, quiz: { ...data.quiz, instructions: e.target.value } })} />
                        </div>

                        <h3>Questions ({data.quiz.questions.length})</h3>
                        {data.quiz.questions.map((q, qIdx) => (
                            <div key={q.id} className="question-editor">
                                <div className="flex justify-between">
                                    <strong>Question {qIdx + 1}</strong>
                                    <button className="text-red-500" onClick={() => removeQuestion(qIdx)}>Supprimer</button>
                                </div>
                                <input
                                    className="w-full p-2 border rounded mb-2"
                                    value={q.question}
                                    onChange={e => updateQuestion(qIdx, 'question', e.target.value)}
                                    placeholder="Intitulé de la question..."
                                />
                                <div className="options-list">
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex gap-2 items-center mb-1">
                                            <input
                                                type="radio"
                                                name={`correct-${q.id}`}
                                                checked={q.correct === oIdx}
                                                onChange={() => updateQuestion(qIdx, 'correct', oIdx)}
                                            />
                                            <input
                                                className="flex-1 p-1 border rounded"
                                                value={opt}
                                                onChange={e => {
                                                    const newOpts = [...q.options];
                                                    newOpts[oIdx] = e.target.value;
                                                    updateQuestion(qIdx, 'options', newOpts);
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    const newOpts = q.options.filter((_, i) => i !== oIdx);
                                                    updateQuestion(qIdx, 'options', newOpts);
                                                    if (q.correct === oIdx) updateQuestion(qIdx, 'correct', 0); // Reset if deleted correct
                                                }}
                                            >✕</button>
                                        </div>
                                    ))}
                                    <button className="text-sm text-blue-500" onClick={() => updateQuestion(qIdx, 'options', [...q.options, 'Nouvelle option'])}>+ Ajouter option</button>
                                </div>
                            </div>
                        ))}
                        <button className="btn-add-section mt-4" onClick={addQuestion}>➕ Ajouter Question</button>
                    </div>
                )}

                {/* --- CERTIFICATE TAB --- */}
                {activeTab === 'certificate' && (
                    <div className="cert-editor">
                        <div className="form-group">
                            <label>Titre Certificat</label>
                            <input value={data.certificate.title} onChange={e => setData({ ...data, certificate: { ...data.certificate, title: e.target.value } })} />
                        </div>
                        <div className="form-group">
                            <label>Sous-titre</label>
                            <input value={data.certificate.subtitle} onChange={e => setData({ ...data, certificate: { ...data.certificate, subtitle: e.target.value } })} />
                        </div>
                        <div className="form-group">
                            <label>Nom Signataire</label>
                            <input value={data.certificate.signatureName || ''} onChange={e => setData({ ...data, certificate: { ...data.certificate, signatureName: e.target.value } })} />
                        </div>
                        <div className="form-group">
                            <label>Titre Signataire</label>
                            <input value={data.certificate.signatureTitle || ''} onChange={e => setData({ ...data, certificate: { ...data.certificate, signatureTitle: e.target.value } })} />
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .course-builder {
                    display: flex;
                    flex-direction: column;
                    height: 85vh; /* Fit in modal */
                }
                .builder-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 2rem;
                    background: white;
                    border-bottom: 1px solid #e2e8f0;
                }
                .builder-tabs {
                    display: flex;
                    gap: 1rem;
                    padding: 0.5rem 2rem;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                }
                .builder-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 2rem;
                    background: #f1f5f9;
                }
                .section-editor-item {
                    background: white;
                    margin-bottom: 1rem;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .section-header-bar {
                    padding: 1rem;
                    background: white;
                    border-bottom: 1px solid #f1f5f9;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .section-header-bar:hover {
                    background: #f8fafc;
                }
                .section-body {
                    padding: 1.5rem;
                }
                .content-item-editor {
                    background: #f8fafc;
                    padding: 1rem;
                    margin-bottom: 0.5rem;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .badge-type {
                    background: #cbd5e1;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .add-content-bar {
                    margin-top: 1rem;
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .add-content-bar button {
                    background: white;
                    border: 1px solid #cbd5e1;
                    padding: 4px 10px;
                    border-radius: 15px;
                    font-size: 0.85rem;
                    cursor: pointer;
                }
                .add-content-bar button:hover {
                    background: #3b82f6;
                    color: white;
                    border-color: #2563eb;
                }
                .btn-add-section {
                    width: 100%;
                    padding: 1rem;
                    background: #dfe7ff; /* light blue */
                    color: #2563eb;
                    border: 2px dashed #2563eb;
                    border-radius: 12px;
                    font-weight: bold;
                    cursor: pointer;
                }
                .btn-add-section:hover {
                    background: #dbeafe;
                }
                .question-editor {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    margin-bottom: 1rem;
                }
                .w-full { width: 100%; }
                .p-2 { padding: 0.5rem; }
                .border { border: 1px solid #e2e8f0; }
                .rounded { border-radius: 8px; }
            `}</style>
        </div>
    );
};

export default CourseBuilder;
