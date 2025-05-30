import React, { useState, useEffect } from 'react';
import './App.css';
import './Dropzone.js';

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState('pay'); // 'pay' | 'upload'

  // Start Stripe Checkout
  const startCheckout = async () => {
    const res = await fetch('http://localhost:3001/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success_url: window.location.origin + '?paid=1',
        cancel_url: window.location.href
      })
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  // On mount, check for session_id in URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    if (sid) {
      fetch('http://localhost:3001/validate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sid })
      })
        .then(r => r.json())
        .then(d => {
          if (d.valid) {
            setSessionId(sid);
            setStep('upload');
          }
        });
    }
  }, []);

  // Mount dropzone after component mounts (always show on home page)
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window as any).createDropzone &&
      document.getElementById('upload-dropzone')
    ) {
      (window as any).createDropzone('upload-dropzone');
    }
  }, []);

  return (
    <>
      <header className="site-header">QuickDrop.ai</header>
      <div className="quickdrop-root">
        {/* Hero Section */}
        <section className="hero">
          <h1 className="headline">Send Files from Windows to iPhone — First 2 Transfers Free!</h1>
          <p className="subtitle">Enjoy <b>2 free file transfers</b> with QuickDrop.ai. After that, it's just <b>$0.50 per transfer</b> or <b>$3.99/month</b> for unlimited transfers. Fast, secure, and effortless — no cables, no hassle.</p>
          <button
            className="cta-btn gradient-btn animate-btn"
            onClick={() => {
              const dropzone = document.getElementById('upload-dropzone');
              if (dropzone) {
                dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
                dropzone.classList.add('highlight-dropzone');
                setTimeout(() => dropzone.classList.remove('highlight-dropzone'), 1200);
              }
            }}
          >
            Get Started Free
          </button>
        </section>

        {/* Dropzone Section - improved markup for visibility */}
        <section style={{ width: '100%', maxWidth: 480, margin: '2.5rem auto 1.5rem auto', display: 'flex', justifyContent: 'center' }}>
          <div id="upload-dropzone" style={{ width: '100%', maxWidth: 420, minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '100%',
              minHeight: 140,
              border: '2.5px dashed #1d4ed8',
              borderRadius: '1.7em',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1d4ed8',
              fontWeight: 700,
              fontSize: '1.25rem',
              letterSpacing: '0.01em',
              position: 'relative',
              boxShadow: '0 2px 8px 0 rgba(37,99,235,0.07)',
              cursor: 'pointer',
              zIndex: 2
            }}>
              <span style={{fontSize: '2.2rem', marginBottom: 8}}>⬇️</span>
              <span>Drag & drop your file here</span>
              <span style={{fontWeight: 400, fontSize: '1rem', color: '#64748b', marginTop: 4}}>or click to browse</span>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="pricing-section">
          <div className="pricing-card">
            <div className="plan">2 Free Transfers</div>
            <div className="price">$0</div>
            <ul className="benefits">
              <li>No signup required</li>
              <li>Full speed transfers</li>
              <li>Secure & private</li>
            </ul>
          </div>
          <div className="pricing-card featured">
            <div className="plan">$0.50 per transfer</div>
            <div className="price">$0.50</div>
            <ul className="benefits">
              <li>Pay as you go</li>
              <li>Instant QR download</li>
              <li>All file types supported</li>
            </ul>
          </div>
          <div className="pricing-card">
            <div className="plan">Unlimited Transfers</div>
            <div className="price">$3.99/mo</div>
            <ul className="benefits">
              <li>Unlimited file transfers</li>
              <li>Priority support</li>
              <li>Cancel anytime</li>
            </ul>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="trust-badges">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Stripe_Logo%2C_revised_2016.svg/160px-Stripe_Logo%2C_revised_2016.svg.png" alt="Stripe" className="badge" style={{ height: 32, background: '#fff', borderRadius: 8, padding: '2px 10px' }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" className="badge" style={{ height: 32, background: '#fff', borderRadius: '50%', padding: 4 }} />
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/48/Windows_logo_-_2021.svg" alt="Windows" className="badge" style={{ height: 32, background: '#fff', borderRadius: 8, padding: '2px 10px' }} />
        </section>

        {/* Testimonials */}
        <section className="testimonials glass-card">
          <h2>What Our Users Say</h2>
          <div className="testimonial-list">
            <div className="testimonial">
              <p>“QuickDrop is a lifesaver! I sent a huge video to my iPhone in seconds.”</p>
              <span>- Alex P.</span>
            </div>
            <div className="testimonial">
              <p>“So much easier than AirDrop or email. The QR code is genius.”</p>
              <span>- Jamie L.</span>
            </div>
            <div className="testimonial">
              <p>“I love the simple pricing and how fast it works. Highly recommend!”</p>
              <span>- Priya S.</span>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq glass-card">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>Is QuickDrop secure?</h3>
              <p>Yes! All transfers are encrypted and files are deleted after download or 15 minutes.</p>
            </div>
            <div className="faq-item">
              <h3>What file types are supported?</h3>
              <p>JPG, PNG, MP4, MOV, and more. Max file size: 500MB.</p>
            </div>
            <div className="faq-item">
              <h3>Do I need an app?</h3>
              <p>No app required. Just use your browser on Windows and iPhone.</p>
            </div>
          </div>
        </section>

        {/* Call to Action / Upload Section */}
        <section className="cta-section glass-card" id="cta">
          <h2>Ready to send your first file?</h2>
        </section>

        <footer>
          <p>© {new Date().getFullYear()} QuickDrop.ai. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}

export default App;
