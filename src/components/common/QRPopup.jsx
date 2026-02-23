import React, { useState, useEffect } from 'react';

const QRPopup = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [timer, setTimer] = useState(120);

  useEffect(() => {
    document.body.style.overflow = isVisible ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isVisible]);

  useEffect(() => {
    const showPopup = () => {
      setIsVisible(true);
      setTimer(120);
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(showPopup, 5 * 60 * 1000);
      }, 2 * 60 * 1000);
    };
    showPopup();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setTimer(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 99999,
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '450px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '15px',
          color: '#dc2626',
          textAlign: 'center'
        }}>
          🚨 PAYMENT OVERDUE – ₹1,26,000<br/>
          Please clear dues immediately to continue services.
        </div>
        <img 
          src="/qr pa.jpeg" 
          alt="Payment QR Code" 
          style={{
            width: '200px',
            height: '200px',
            objectFit: 'contain',
            margin: '10px auto'
          }}
        />
        <div style={{
          fontSize: '13px',
          color: '#666',
          marginTop: '15px',
          marginBottom: '12px'
        }}>
          This page will automatically expire in {minutes}:{seconds.toString().padStart(2, '0')} minutes
        </div>
        <div style={{
          fontSize: '13px',
          color: '#333',
          backgroundColor: '#f5f5f5',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'left'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Alternate Payment Method:</div>
          <div>Account No: 50200068337918</div>
          <div>IFSC: HDFC0004331</div>
          <div>SHINE INFOSOLUTIONS</div>
        </div>
      </div>
    </div>
  );
};

export default QRPopup;
