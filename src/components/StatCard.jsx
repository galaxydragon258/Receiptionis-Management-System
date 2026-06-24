export default function StatCard({ icon, label, value, sub, accent, delay, isMobile, isSmallMobile }) {
    const colors = {
        indigo: { bg: '#eef2ff', iconBg: 'linear-gradient(135deg, #6366f1, #818cf8)', shadow: 'rgba(99,102,241,0.18)' },
        emerald: { bg: '#ecfdf5', iconBg: 'linear-gradient(135deg, #10b981, #34d399)', shadow: 'rgba(16,185,129,0.18)' },
        amber: { bg: '#fffbeb', iconBg: 'linear-gradient(135deg, #f59e0b, #fbbf24)', shadow: 'rgba(245,158,11,0.18)' },
        rose: { bg: '#fff1f2', iconBg: 'linear-gradient(135deg, #f43f5e, #fb7185)', shadow: 'rgba(244,63,94,0.18)' },
        sky: { bg: '#f0f9ff', iconBg: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', shadow: 'rgba(14,165,233,0.18)' },
    };
    const c = colors[accent] || colors.indigo;

    const iconSize = isSmallMobile ? 32 : isMobile ? 38 : 46;

    return (
        <div
            className={`animate-fade-in-up delay-${delay}`}
            style={{
                background: 'white',
                borderRadius: isSmallMobile ? 12 : 16,
                padding: isSmallMobile ? '14px 14px' : isMobile ? '16px 18px' : '22px 24px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.03)',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                cursor: 'default',
                opacity: 0,
                minWidth: 0,
                overflow: 'hidden',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 8px 28px ${c.shadow}`;
                e.currentTarget.style.borderColor = '#e0e7ff';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.03)';
                e.currentTarget.style.borderColor = '#f1f5f9';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: isSmallMobile ? 8 : 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: isSmallMobile ? '0.68rem' : '0.78rem', fontWeight: 500, color: '#94a3b8', marginBottom: isSmallMobile ? 4 : 8, letterSpacing: '0.01em' }}>
                        {label}
                    </p>
                    <p style={{
                        fontSize: isSmallMobile ? '1.15rem' : isMobile ? '1.3rem' : '1.6rem',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        color: '#1e293b',
                        lineHeight: 1.1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {value}
                    </p>
                    {sub && (
                        <p style={{ fontSize: isSmallMobile ? '0.62rem' : '0.72rem', color: '#94a3b8', marginTop: isSmallMobile ? 4 : 8, fontWeight: 500 }}>
                            {sub}
                        </p>
                    )}
                </div>
                <div
                    style={{
                        width: iconSize,
                        height: iconSize,
                        borderRadius: isSmallMobile ? 8 : 13,
                        background: c.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 12px ${c.shadow}`,
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}