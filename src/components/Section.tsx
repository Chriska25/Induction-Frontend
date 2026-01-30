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
