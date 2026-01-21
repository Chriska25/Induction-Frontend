import React from 'react';
import { ContentItem, FAQItem } from '../types';
import './Section.css';

interface SectionProps {
  title: string;
  subtitle: string;
  content: ContentItem[];
}

const Section: React.FC<SectionProps> = ({ title, subtitle, content }) => {
  const renderContent = (item: ContentItem, index: number) => {
    switch (item.type) {
      case 'heading':
        return (
          <h3 key={index} className="content-heading">
            {item.text}
          </h3>
        );
      case 'paragraph':
        return (
          <p key={index} className="content-paragraph">
            {item.text}
          </p>
        );
      case 'list':
        return (
          <ul key={index} className="content-list">
            {item.items?.map((listItem, idx) => (
              <li key={idx}>{listItem}</li>
            ))}
          </ul>
        );
      case 'steps':
        return (
          <ol key={index} className="content-steps">
            {item.items?.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        );
      case 'checklist':
        return (
          <ul key={index} className="content-checklist">
            {item.items?.map((checkItem, idx) => (
              <li key={idx}>
                <span className="check-icon">✓</span> {checkItem}
              </li>
            ))}
          </ul>
        );
      case 'faq':
        return (
          <div key={index} className="content-faq">
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
          </div>
        );
      case 'image':
        return (
          <figure key={index} className="content-image">
            {item.src && (
              <img src={item.src} alt={item.alt || 'Illustration'} loading="lazy" />
            )}
            {item.caption && <figcaption>{item.caption}</figcaption>}
          </figure>
        );
      default:
        return null;
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h1 className="section-title">{title}</h1>
        <h2 className="section-subtitle">{subtitle}</h2>
      </div>
      <div className="section-content">
        {content.map((item, index) => renderContent(item, index))}
      </div>
    </div>
  );
};

export default Section;
