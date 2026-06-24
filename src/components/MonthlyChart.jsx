export default function MonthlyChart({ data }) {
    const max = Math.max(...data.map(d => d.sales));

    return (
        <div style={{ width: '100%', overflow: 'hidden' }}>
            <svg
                viewBox={`0 0 ${data.length * 24} 100`}
                style={{ width: '100%', height: 120 }}
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a5b4fc" />
                    </linearGradient>
                </defs>
                {data.map((d, i) => {
                    const h = (d.sales / max) * 80;
                    return (
                        <g key={i}>
                            <rect
                                x={i * 24 + 4}
                                y={90 - h}
                                width={16}
                                height={h}
                                rx={4}
                                fill="url(#barGrad)"
                                opacity={0.85}
                                style={{ transition: 'height 0.5s ease, y 0.5s ease' }}
                            />
                            {/* Highlight today */}
                            {d.day === new Date().getDate() && (
                                <rect
                                    x={i * 24 + 4}
                                    y={90 - h}
                                    width={16}
                                    height={h}
                                    rx={4}
                                    fill="#6366f1"
                                    opacity={1}
                                />
                            )}
                        </g>
                    );
                })}
                {/* baseline */}
                <line x1="0" y1="90" x2={data.length * 24} y2="90" stroke="#e5e7eb" strokeWidth="1" />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 4px 0' }}>
                {data.filter((_, i) => i % 5 === 0 || i === data.length - 1).map(d => (
                    <span key={d.day} style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 500 }}>
                        {d.day}
                    </span>
                ))}
            </div>
        </div>
    );
}
