import React, { useEffect, useState } from 'react';
import { ContentItem, FAQItem } from '../types';
import { api } from '../api/client';
import './Section.css';

interface SectionProps {
  title: string;
  subtitle: string;
  content: ContentItem[];
}

import { motion, Variants } from 'framer-motion';

// ... imports remain the same ...

const Section: React.FC<SectionProps> = ({ title, subtitle, content }) => {
  const [bgGradient, setBgGradient] = useState('linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #fef3c7 100%)');

  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Stop speaking when component unmounts or content changes
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [content]);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert("Votre navigateur ne supporte pas la lecture vocale.");
      return;
    }

    const textParts = [title, subtitle];
    content.forEach(item => {
      if (item.type === 'paragraph' || item.type === 'heading') {
        textParts.push(item.text || '');
      }
      if (item.type === 'list' || item.type === 'steps') {
        (item.items as string[])?.forEach(i => textParts.push(i));
      }
    });

    const utterance = new SpeechSynthesisUtterance(textParts.join('. '));
    utterance.lang = 'fr-FR';
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  useEffect(() => {
    const loadBackgroundColors = async () => {
      try {
        const settings = await api.getSettings();
        const start = settings.background_color_start || '#f8fafc';
        const middle = settings.background_color_middle || '#e0e7ff';
        const end = settings.background_color_end || '#fef3c7';
        setBgGradient(`linear-gradient(135deg, ${start} 0%, ${middle} 50%, ${end} 100%)`);
      } catch (error) {
        console.error('Error loading background colors:', error);
      }
    };
    loadBackgroundColors();
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 20
      }
    }
  };

  const renderContent = (item: ContentItem, index: number) => {
    switch (item.type) {
      case 'heading':
        return (
          <motion.h3 key={index} variants={itemVariants} className="content-heading">
            {item.text}
          </motion.h3>
        );
      case 'paragraph':
        return (
          <motion.p key={index} variants={itemVariants} className="content-paragraph">
            {item.text}
          </motion.p>
        );
      case 'list':
        return (
          <motion.ul key={index} variants={itemVariants} className="content-list">
            {item.items?.map((listItem, idx) => (
              <li key={idx}>{listItem as string}</li>
            ))}
          </motion.ul>
        );
      case 'steps':
        return (
          <motion.ol key={index} variants={itemVariants} className="content-steps">
            {item.items?.map((step, idx) => (
              <li key={idx}><span>{step as string}</span></li>
            ))}
          </motion.ol>
        );
      case 'checklist':
        return (
          <motion.ul key={index} variants={itemVariants} className="content-checklist">
            {item.items?.map((checkItem, idx) => (
              <li key={idx}>
                <span className="check-icon">✓</span> {checkItem as string}
              </li>
            ))}
          </motion.ul>
        );
      case 'faq':
        return (
          <motion.div key={index} variants={itemVariants} className="content-faq">
            {(item.items as FAQItem[])?.map((faqItem, idx) => (
              <div key={idx} className="faq-item">
                <div className="faq-question">
                  <strong>Q:</strong> {faqItem.question}
                </div>
                <div className="faq-answer">
                  <strong>R:</strong> {faqItem.answer}
                </div>
              </div>
            ))}
          </motion.div>
        );
      case 'image':
        return (
          <motion.figure key={index} variants={itemVariants} className="content-image">
            {item.src && (
              <img src={item.src} alt={item.alt || 'Illustration'} loading="lazy" />
            )}
            {item.caption && <figcaption>{item.caption}</figcaption>}
          </motion.figure>
        );
      case 'video':
        return (
          <motion.div key={index} variants={itemVariants} className="content-video" style={{ margin: '2rem 0' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <iframe
                src={item.src?.replace("watch?v=", "embed/")}
                title={item.alt || "Video"}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {item.caption && <div style={{ marginTop: '1rem', textAlign: 'center', color: '#718096', fontStyle: 'italic' }}>{item.caption}</div>}
          </motion.div>
        );
      case 'document':
        return (
          <motion.div key={index} variants={itemVariants} className="content-document" style={{ margin: '1.5rem 0' }}>
            <a href={item.src} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              background: '#f8fafc', padding: '1.5rem', borderRadius: '16px',
              border: '1px solid #e2e8f0', textDecoration: 'none', color: '#2d3748',
              transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
            }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '2rem' }}>📄</div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.text || 'Télécharger le document'}</div>
                <div style={{ fontSize: '0.9rem', color: '#718096' }}>{item.caption || 'Cliquer pour ouvrir'}</div>
              </div>
              <div style={{ marginLeft: 'auto', color: '#3b82f6', fontWeight: 'bold' }}>⬇️ Télécharger</div>
            </a>
          </motion.div>
        );
      case 'table':
        return (
          <motion.div key={index} variants={itemVariants} className="content-table-wrapper" style={{ overflowX: 'auto', margin: '2rem 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              {item.headers && (
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {item.headers.map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 'bold', color: '#4a5568', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {item.rows?.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: '12px 16px', color: '#2d3748' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {item.caption && <div style={{ marginTop: '0.5rem', textAlign: 'center', color: '#718096', fontSize: '0.9rem', fontStyle: 'italic' }}>{item.caption}</div>}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="section" style={{ background: bgGradient }}>
      <motion.div
        className="section-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="section-title">{title}</h1>
        <h2 className="section-subtitle">{subtitle}</h2>
        <button
          onClick={handleSpeak}
          style={{
            marginTop: '1rem',
            padding: '0.6rem 1.2rem',
            background: isSpeaking ? '#ef4444' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {isSpeaking ? '🔇 Arrêter la lecture' : '🔊 Écouter le contenu'}
        </button>
      </motion.div>
      <motion.div
        className="section-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {content.map((item, index) => renderContent(item, index))}
      </motion.div>
    </div>
  );
};

export default Section;
