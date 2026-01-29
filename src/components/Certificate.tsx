import React, { useRef, useEffect } from 'react';
import { CertificateData } from '../types';
import { getImageUrl } from '../utils/imageUrl';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { QRCodeSVG } from 'qrcode.react';
import './Certificate.css';

interface CertificateProps {
  certificateData: CertificateData;
  userName: string;
  score: number;
  autoPrint?: boolean;
  moduleId?: string;
  userId?: string;
}

const Certificate: React.FC<CertificateProps> = ({ certificateData, userName, score, autoPrint = false, moduleId, userId }) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  // Common options for PDF generation
  const getPdfOptions = () => ({
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
  });

  const handleOpenPdf = () => {
    if (!certificateRef.current) return;

    // Visual feedback
    const btn = document.querySelector('.btn-print') as HTMLButtonElement;
    const originalText = btn ? btn.innerText : 'Ouvrir en PDF';
    if (btn) {
      btn.innerText = 'Génération... ⏳';
      btn.disabled = true;
    }

    html2pdf()
      .from(certificateRef.current)
      .set(getPdfOptions())
      .output('bloburl')
      .then((pdfUrl: string) => {
        window.open(pdfUrl, '_blank');
      })
      .finally(() => {
        if (btn) {
          btn.innerText = originalText;
          btn.disabled = false;
        }
      });
  };

  // Auto-action when component mounts if autoPrint is true
  // We prefer downloading or opening PDF directly as requested
  useEffect(() => {
    if (autoPrint && certificateRef.current) {
      // Wait a bit for the component to fully render
      const timer = setTimeout(() => {
        handleOpenPdf();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handleDownload = () => {
    if (!certificateRef.current) return;

    const btn = document.querySelector('.btn-download') as HTMLButtonElement;
    const originalText = btn ? btn.innerText : 'Télécharger en PDF';
    if (btn) {
      btn.innerText = 'Génération... ⏳';
      btn.disabled = true;
    }

    html2pdf()
      .from(certificateRef.current)
      .set(getPdfOptions())
      .save()
      .finally(() => {
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

  // Generate verification URL
  // Ideally this would be a public verification page
  // We prefer VITE_PUBLIC_URL if set (production), otherwise origin
  const appUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  const qrValue = `${appUrl}/verify-certificate?user=${encodeURIComponent(userName)}&score=${score}&module=${moduleId || 'induction'}`;

  // Debug log to check what is being generated
  // console.log('Generated QR Value:', qrValue);

  return (
    <div className="certificate-wrapper">
      <div className="certificate-actions">
        <button onClick={handleOpenPdf} className="btn-print">
          Ouvrir en PDF
        </button>
        <button onClick={handleDownload} className="btn-download">
          Télécharger en PDF
        </button>

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
          <div style={{ textAlign: 'center', marginBottom: '5px' }}>
            <div className="certificate-date">Délivré le {currentDate}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
            {certificateData.partnerLogos && certificateData.partnerLogos.length > 0 && (
              <div className="certificate-partners" style={{ flex: 'unset', width: '100%' }}>
                {certificateData.partnerLogos.map((logo, idx) => (
                  <img key={idx} src={getImageUrl(logo)} alt={`Partner ${idx}`} className="certificate-partner-logo" />
                ))}
              </div>
            )}
          </div>

          {(certificateData.signatureName || certificateData.signatureTitle || certificateData.signatureImage) && (
            <div className="certificate-signature-block">
              {certificateData.signatureImage ? (
                <img src={getImageUrl(certificateData.signatureImage)} alt="Signature" className="signature-img" style={{ marginBottom: '10px' }} />
              ) : (
                <div className="signature-line" style={{ marginBottom: '15px' }} />
              )}
              {certificateData.signatureName && (
                <div className="signature-name">{certificateData.signatureName}</div>
              )}
              {certificateData.signatureTitle && (
                <div className="signature-title">{certificateData.signatureTitle}</div>
              )}
            </div>
          )}
        </div>
        {/* QR Code */}
        <div className="certificate-qrcode">
          <QRCodeSVG value={qrValue} size={80} />
          <div style={{ fontSize: '8px', marginTop: '2px', color: '#666' }}>Vérifier</div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
