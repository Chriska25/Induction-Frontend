import React, { useRef, useEffect } from 'react';
import { CertificateData } from '../types';
import { getImageUrl } from '../utils/imageUrl';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import './Certificate.css';

interface CertificateProps {
  certificateData: CertificateData;
  userName: string;
  score: number;
  autoPrint?: boolean;
}

const Certificate: React.FC<CertificateProps> = ({ certificateData, userName, score, autoPrint = false }) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (certificateRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="fr">
            <head>
              <title>Certificat - ${userName}</title>
              <style>
                @media print {
                  @page {
                    size: A4 landscape;
                    margin: 2cm;
                  }
                }
                body {
                  font-family: 'Times New Roman', serif;
                  margin: 0;
                  padding: 40px;
                  background: white;
                }
                .certificate-container {
                  border: 8px solid #1a5490;
                  padding: 60px;
                  text-align: center;
                  background: white;
                  min-height: 600px;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  position: relative;
                }
                .certificate-container::after {
                  display: none !important;
                }
                .certificate-header {
                  display: grid;
                  grid-template-columns: 1fr auto 1fr;
                  align-items: center;
                  margin-bottom: 20px;
                }
                .certificate-logo-side {
                  display: flex;
                  justify-content: flex-start;
                }
                .certificate-logo-side:last-child {
                  justify-content: flex-end;
                }
                .certificate-logo-img {
                  max-height: 60px;
                  max-width: 160px;
                  object-fit: contain;
                }
                .certificate-logo-center {
                  text-align: center;
                }
                .certificate-logo-text {
                  font-size: 20px;
                  font-weight: bold;
                  color: #1a5490;
                  letter-spacing: 2px;
                }
                .certificate-title {
                  font-size: 32px;
                  font-weight: bold;
                  color: #1a5490;
                  margin: 30px 0;
                  text-transform: uppercase;
                }
                .certificate-subtitle {
                  font-size: 20px;
                  color: #333;
                  margin-bottom: 40px;
                }
                .certificate-name {
                  font-size: 28px;
                  font-weight: bold;
                  color: #1a5490;
                  margin: 30px 0;
                  text-decoration: underline;
                }
                .certificate-message {
                  font-size: 16px;
                  line-height: 1.8;
                  color: #333;
                  margin: 30px auto;
                  text-align: center;
                  max-width: 800px;
                }
                .certificate-score {
                  font-size: 18px;
                  font-weight: bold;
                  color: #1a5490;
                  margin-top: 20px;
                }
                .certificate-footer-row {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  margin-top: auto;
                  gap: 3rem;
                  padding-top: 20px;
                  text-align: center;
                }
                .certificate-date {
                  font-size: 14px;
                  color: #666;
                  font-style: italic;
                }
                .certificate-signature-block {
                  text-align: center;
                }
                .signature-line {
                  display: none;
                }
                .signature-name {
                  font-size: 16px;
                  font-weight: 600;
                  color: #333;
                }
                .signature-title {
                  font-size: 14px;
                  color: #555;
                }
                .signature-img {
                  height: 100px;
                  object-fit: contain;
                  display: block;
                  margin: 10px auto 0 auto;
                }
                .certificate-partners {
                  display: flex;
                  justify-content: center;
                  gap: 20px;
                  align-items: center;
                  flex-wrap: wrap;
                  flex: 1;
                  margin-bottom: 5px;
                }
                .certificate-partner-logo {
                  max-height: 30px;
                  max-width: 80px;
                  object-fit: contain;
                }
              </style>
            </head>
            <body>
              ${certificateRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  };

  // Auto-print when component mounts if autoPrint is true
  useEffect(() => {
    if (autoPrint && certificateRef.current) {
      // Wait a bit for the component to fully render
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handleDownload = () => {
    if (!certificateRef.current) return;

    const element = certificateRef.current;

    // Options pour le PDF
    const opt = {
      margin: 0,
      filename: `Certificat_${userName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
    };

    // Notification visuelle
    const btn = document.querySelector('.btn-download') as HTMLButtonElement;
    const originalText = btn ? btn.innerText : 'Télécharger en PDF';
    if (btn) {
      btn.innerText = 'Génération... ⏳';
      btn.disabled = true;
    }

    html2pdf().from(element).set(opt).save().finally(() => {
      if (btn) {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    });
  };

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="certificate-wrapper">
      <div className="certificate-actions">
        <button onClick={handlePrint} className="btn-print">
          Imprimer le certificat
        </button>
        <button onClick={handleDownload} className="btn-download">
          Télécharger en PDF
        </button>
        <div className="download-hint">
          Astuce : utilisez l'impression du navigateur pour enregistrer en PDF.
        </div>
      </div>
      <div ref={certificateRef} className="certificate-container">
        <div className="certificate-header">
          <div className="certificate-logo-side">
            {certificateData.leftLogoUrl && (
              <img
                src={getImageUrl(certificateData.leftLogoUrl)}
                alt="Logo gauche"
                className="certificate-logo-img"
              />
            )}
          </div>
          <div className="certificate-logo-center">
            <div className="certificate-logo-text">{certificateData.logoText}</div>
          </div>
          <div className="certificate-logo-side">
            {certificateData.rightLogoUrl && (
              <img
                src={getImageUrl(certificateData.rightLogoUrl)}
                alt="Logo droit"
                className="certificate-logo-img"
              />
            )}
          </div>
        </div>
        <h1 className="certificate-title">{certificateData.title}</h1>
        <h2 className="certificate-subtitle">{certificateData.subtitle}</h2>
        <div className="certificate-name">{userName}</div>
        <p className="certificate-message">{certificateData.successMessage}</p>
        <div className="certificate-score">Score obtenu : {score.toFixed(0)}%</div>
        <div className="certificate-footer-row">
          <div className="certificate-date">Délivré le {currentDate}</div>

          {certificateData.partnerLogos && certificateData.partnerLogos.length > 0 && (
            <div className="certificate-partners">
              {certificateData.partnerLogos.map((logo, idx) => (
                <img key={idx} src={getImageUrl(logo)} alt={`Partner ${idx}`} className="certificate-partner-logo" />
              ))}
            </div>
          )}

          {(certificateData.signatureName || certificateData.signatureTitle || certificateData.signatureImage) && (
            <div className="certificate-signature-block">
              {certificateData.signatureName && (
                <div className="signature-name">{certificateData.signatureName}</div>
              )}
              {certificateData.signatureTitle && (
                <div className="signature-title">{certificateData.signatureTitle}</div>
              )}
              {certificateData.signatureImage ? (
                <img src={getImageUrl(certificateData.signatureImage)} alt="Signature" className="signature-img" style={{ marginTop: '10px' }} />
              ) : (
                <div className="signature-line" style={{ marginTop: '15px' }} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Certificate;
