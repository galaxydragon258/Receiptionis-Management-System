import useMediaQuery from '../hooks/useMediaQuery';

export default function Navbar() {
    const isMobile = useMediaQuery('(max-width: 480px)');

    return (
        <nav
            id="main-navbar"
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid #e5e7eb',
                padding: isMobile ? '0 12px' : '0 24px',
            }}
        >
            <div
                style={{
                    maxWidth: 1280,
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: isMobile ? 52 : 64,
                }}
            >
                {/* Logo + Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
                    {/* Logo icon */}
                    <div
                        style={{
                            width: isMobile ? 34 : 40,
                            height: isMobile ? 34 : 40,
                            borderRadius: isMobile ? 10 : 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
                            flexShrink: 0,
                        
                        }}
                    >
                        {/* dumbbell icon */}
                        <img src='/Logo.jpg'
                        style={{
                            width:'100%',
                            height:'100%',
                            objectFit:'cover',
                            borderRadius:'12px'
                        }}
                        />
                        
                    </div>
                    <div>
                        <h1 style={{ fontSize: isMobile ? '0.88rem' : '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#1e293b', lineHeight: 1.2 }}>
                            Reyes Gym
                        </h1>
                        <p style={{ fontSize: isMobile ? '0.58rem' : '0.65rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            Receptionist System
                        </p>
                    </div>
                </div>

                {/* Right side — Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
                    {/* Notification dot */}
                    <button
                        style={{
                            position: 'relative',
                            width: isMobile ? 34 : 38,
                            height: isMobile ? 34 : 38,
                            borderRadius: isMobile ? 8 : 10,
                            border: '1px solid #e5e7eb',
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#64748b',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.color = '#6366f1'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#64748b'; }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span style={{
                            position: 'absolute', top: 7, right: 7, width: 7, height: 7,
                            borderRadius: '50%', background: '#ef4444', border: '2px solid white',
                        }} />
                    </button>

                    {/* Avatar */}
                    <div
                        style={{
                            width: isMobile ? 34 : 38,
                            height: isMobile ? 34 : 38,
                            borderRadius: isMobile ? 8 : 10,
                            background: 'linear-gradient(135deg, #34d399, #06b6d4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: isMobile ? '0.7rem' : '0.8rem',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(52,211,153,0.2)',
                            flexShrink: 0,
                        }}
                    >
                        AD
                    </div>
                </div>
            </div>
        </nav>
    );
}
