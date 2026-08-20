import { useWelcomeViewModel } from "@/core/viewmodels/useOnboardingViewModel";

export function WelcomeScreen() {
  const { start, signIn } = useWelcomeViewModel();

  return (
    <div className="onboarding-page welcome-page">
      {/* 1. Brand Header (Left-aligned) */}
      <header className="welcome-header">
        <div className="welcome-brand" aria-label="FIN-A, Financial Assistant App">
          <div className="welcome-brand-name">
            <span className="brand-letter">F</span>
            <span className="brand-letter-i">
              <span className="brand-dot" />
              <span className="brand-stem">ı</span>
            </span>
            <span className="brand-letter">N-A</span>
          </div>
          <span className="welcome-brand-sub">FINANCIAL ASSISTANT APP</span>
        </div>
      </header>

      {/* 2. Hero Headline & Subtitle */}
      <section className="welcome-hero">
        <h1 className="welcome-title">
          <span className="title-row">
            Money
            <svg className="money-sparkles" viewBox="0 0 32 30" fill="none" aria-hidden="true">
              {/* Top spark ray */}
              <line x1="5" y1="18" x2="12" y2="4" stroke="#2563eb" strokeWidth="3.4" strokeLinecap="round" />
              {/* Middle spark ray */}
              <line x1="14" y1="13" x2="27" y2="8" stroke="#2563eb" strokeWidth="3.4" strokeLinecap="round" />
              {/* Bottom spark ray */}
              <line x1="13" y1="21" x2="27" y2="22" stroke="#2563eb" strokeWidth="3.4" strokeLinecap="round" />
            </svg>
          </span>
          <span className="title-row">that follows</span>
          <span className="title-row">
            <span className="highlight-blue">your</span>
            <span>life</span>
          </span>
        </h1>
        <p className="welcome-subtitle">
          Turn meals, rides, savings,
          <br />
          and transfers into rewards.
        </p>
      </section>

      {/* 3. Static 3D Floating Shapes & Indigo Freeform Canvas */}
      <div className="welcome-canvas" aria-hidden="true">
        <svg className="canvas-svg" viewBox="0 0 375 320" fill="none" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* 3D Yellow Sphere Shading */}
            <radialGradient id="yellow-sphere" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#fff7b2" />
              <stop offset="45%" stopColor="#facc15" />
              <stop offset="85%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </radialGradient>
            <filter id="yellow-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#ca8a04" floodOpacity="0.4" />
            </filter>

            {/* 3D Mint/Teal Semicircle Shading */}
            <linearGradient id="teal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="teal-shadow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#059669" floodOpacity="0.32" />
            </filter>

            {/* 3D Coral Cube Shading */}
            <linearGradient id="coral-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="55%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            <filter id="coral-shadow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#e11d48" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Left subtle soft periwinkle arc */}
          <circle cx="-20" cy="230" r="95" fill="#f4f7fe" className="canvas-left-arc" />

          {/* Distinct Indigo / Periwinkle Freeform Curved Element */}
          <circle cx="330" cy="290" r="215" fill="#edf1fc" className="canvas-indigo-blob" />

          {/* 1. Golden Yellow 3D Sphere (Top Right, above the indigo curve) */}
          <g transform="translate(308, 62)">
            <circle cx="0" cy="0" r="7.5" fill="url(#yellow-sphere)" filter="url(#yellow-shadow)" />
          </g>

          {/* 2. Teal Mint 3D Semi-Circle Wedge (Mid Right, inside the indigo element) */}
          <g transform="translate(296, 148) rotate(-35)">
            <path d="M -17,0 A 17,17 0 0,0 17,0 Z" fill="url(#teal-gradient)" filter="url(#teal-shadow)" />
          </g>

          {/* 3. Coral 3D Rounded Cube (Bottom Left, above buttons) */}
          <g transform="translate(82, 214) rotate(16)">
            <rect
              x="-14"
              y="-14"
              width="28"
              height="28"
              rx="8"
              fill="url(#coral-gradient)"
              filter="url(#coral-shadow)"
            />
          </g>
        </svg>
      </div>

      {/* 4. Action Buttons & Pagination */}
      <div className="welcome-actions">
        <button className="primary-button welcome-primary" type="button" onClick={start}>
          <span>Start my journey</span>
          <svg
            className="btn-arrow-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
        <button className="secondary-button welcome-secondary" type="button" onClick={signIn}>
          I already have an account
        </button>
        <div className="welcome-dots" aria-label="Welcome step 1 of 3">
          <span className="is-active" />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
