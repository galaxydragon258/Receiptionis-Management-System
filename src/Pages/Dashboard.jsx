import { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../components/Navbar';
import AddRecordModal from '../components/AddRecordModal';
import useMediaQuery from '../hooks/useMediaQuery';


const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(d) {
    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatTime(d) {
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function peso(n) {
    return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── sample data ─── */
function generateDailyRecords(today) {
    const records = [
        { id: 1, time: '06:15 AM', member: 'Juan Dela Cruz', type: 'Monthly', amount: 1500 },
        { id: 2, time: '07:30 AM', member: 'Maria Santos', type: 'Walk-in', amount: 100 },
        { id: 3, time: '08:00 AM', member: 'Carlos Reyes', type: 'Monthly', amount: 1500 },
        { id: 4, time: '09:45 AM', member: 'Ana Garcia', type: 'Walk-in', amount: 100 },
        { id: 5, time: '10:20 AM', member: 'Pedro Mendoza', type: 'Personal Training', amount: 800 },
        { id: 6, time: '11:00 AM', member: 'Sofia Villanueva', type: 'Monthly', amount: 1500 },
        { id: 7, time: '12:30 PM', member: 'Marco Tan', type: 'Walk-in', amount: 100 },
        { id: 8, time: '01:15 PM', member: 'Isabella Cruz', type: 'Monthly', amount: 1500 },
        { id: 9, time: '02:00 PM', member: 'Rafael Aquino', type: 'Personal Training', amount: 800 },
        { id: 10, time: '03:30 PM', member: 'Camille Lim', type: 'Walk-in', amount: 100 },
    ];
    return records;
}

function generateMonthlyBreakdown() {
    return Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        sales: Math.floor(Math.random() * 6000) + 2000,
        members: Math.floor(Math.random() * 20) + 5,
    }));
}

/* ═══════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════ */
function StatCard({ icon, label, value, sub, accent, delay, isMobile, isSmallMobile }) {
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

/* ═══════════════════════════════════════════
   MINI MONTHLY CHART (SVG bar chart)
   ═══════════════════════════════════════════ */
function MonthlyChart({ data }) {
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

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════ */
export default function Dashboard() {
    const [now, setNow] = useState(new Date());
    const today = useMemo(() => new Date(), []);
    const [modalOpen, setModalOpen] = useState(false);

    const isMobile = useMediaQuery('(max-width: 768px)');
    const isSmallMobile = useMediaQuery('(max-width: 480px)');

    // live clock
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const [dailyRecords, setDailyRecords] = useState(() => generateDailyRecords(today));
    const monthlyData = useMemo(() => generateMonthlyBreakdown(), []);

    const handleAddRecord = useCallback((record) => {
        setDailyRecords(prev => [
            ...prev,
            { ...record, id: prev.length + 1 },
        ]);
    }, []);

    // calculate totals
    const totalSalesToday = dailyRecords.reduce((s, r) => s + r.amount, 0);

    const totalSalesMonth = monthlyData.reduce((s, d) => s + d.sales, 0);
    const totalMembersMonth = monthlyData.reduce((s, d) => s + d.members, 0);
    const walkInCount = dailyRecords.filter(r => r.type === 'Walk-in').length;
    const memberCount = dailyRecords.filter(r => r.type === 'Monthly').length;

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fc' }}>
            <Navbar />

            <main style={{ maxWidth: 1280, margin: '0 auto', padding: isSmallMobile ? '12px 10px 40px' : isMobile ? '16px 12px 48px' : '24px 16px 60px' }}>

                {/* ─── Header ─── */}
                <div
                    className="animate-fade-in"
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        gap: isSmallMobile ? 10 : 16,
                        marginBottom: isSmallMobile ? 16 : isMobile ? 20 : 28,
                    }}
                >
                    <div>
                        <h2 style={{
                            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            color: '#1e293b',
                            marginBottom: 4,
                        }}>
                            Dashboard
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: isSmallMobile ? '0.78rem' : '0.85rem', fontWeight: 400 }}>
                            {formatDate(now)}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: isSmallMobile ? 8 : 10, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                        {/* Add Record Button */}
                        <button
                            id="add-record-btn"
                            onClick={() => setModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                padding: '10px 20px',
                                borderRadius: 12,
                                border: 'none',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: 'white',
                                fontSize: isSmallMobile ? '0.78rem' : '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                                fontFamily: 'inherit',
                                letterSpacing: '-0.01em',
                                flex: isSmallMobile ? 1 : 'none',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 22px rgba(99,102,241,0.4)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.3)';
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Record
                        </button>

                        {/* Live Clock */}
                        <div
                            style={{
                                background: 'white',
                                borderRadius: 12,
                                padding: isSmallMobile ? '8px 12px' : '10px 18px',
                                border: '1px solid #f1f5f9',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: isSmallMobile ? 8 : 10,
                            }}
                        >
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: '#34d399',
                                boxShadow: '0 0 0 3px rgba(52,211,153,0.2)',
                                animation: 'pulseGlow 2s ease-in-out infinite',
                                flexShrink: 0,
                            }} />
                            <span style={{
                                fontSize: isSmallMobile ? '0.85rem' : '1.05rem',
                                fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums',
                                letterSpacing: '0.02em',
                                color: '#1e293b',
                            }}>
                                {formatTime(now)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ─── Stat Cards ─── */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isSmallMobile
                            ? '1fr'
                            : isMobile
                                ? 'repeat(2, 1fr)'
                                : 'repeat(auto-fit, minmax(230px, 1fr))',
                        gap: isSmallMobile ? 8 : isMobile ? 12 : 16,
                        marginBottom: isSmallMobile ? 16 : isMobile ? 20 : 28,
                    }}
                >
                    <StatCard
                        icon={<svg width={isSmallMobile ? 16 : 22} height={isSmallMobile ? 16 : 22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                        label="Total Sales Today"
                        value={peso(totalSalesToday)}
                        sub={`${dailyRecords.length} transactions today`}
                        accent="indigo"
                        delay={1}
                        isMobile={isMobile}
                        isSmallMobile={isSmallMobile}
                    />
                    <StatCard
                        icon={<svg width={isSmallMobile ? 16 : 22} height={isSmallMobile ? 16 : 22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                        label={`Total Sales — ${MONTHS[today.getMonth()]}`}
                        value={peso(totalSalesMonth)}
                        sub={`${totalMembersMonth} total members this month`}
                        accent="emerald"
                        delay={2}
                        isMobile={isMobile}
                        isSmallMobile={isSmallMobile}
                    />
                    <StatCard
                        icon={<svg width={isSmallMobile ? 16 : 22} height={isSmallMobile ? 16 : 22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                        label="Records Today"
                        value={dailyRecords.length}
                        sub={`Walk-ins: ${walkInCount} · Members: ${memberCount}`}
                        accent="sky"
                        delay={3}
                        isMobile={isMobile}
                        isSmallMobile={isSmallMobile}
                    />
                    <StatCard
                        icon={<svg width={isSmallMobile ? 16 : 22} height={isSmallMobile ? 16 : 22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>}
                        label="Avg Daily Sales"
                        value={peso(Math.round(totalSalesMonth / today.getDate()))}
                        sub="Based on current month"
                        accent="amber"
                        delay={4}
                        isMobile={isMobile}
                        isSmallMobile={isSmallMobile}
                    />
                </div>

                {/* ─── Content Grid ─── */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: isSmallMobile ? 14 : 20,
                    }}
                >

                    {/* Monthly Sales Chart */}
                    <div
                        className="animate-fade-in-up delay-5"
                        style={{
                            background: 'white',
                            borderRadius: isSmallMobile ? 12 : 16,
                            padding: isSmallMobile ? 14 : isMobile ? 18 : 24,
                            border: '1px solid #f1f5f9',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            opacity: 0,
                            minWidth: 0,
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                            <div>
                                <h3 style={{ fontSize: isSmallMobile ? '0.9rem' : '1rem', fontWeight: 700, color: '#1e293b' }}>
                                    Monthly Sales Overview
                                </h3>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                                    {MONTHS[today.getMonth()]} {today.getFullYear()} — Daily breakdown
                                </p>
                            </div>
                            <div style={{
                                background: '#eef2ff',
                                padding: '6px 14px',
                                borderRadius: 8,
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#6366f1',
                            }}>
                                {peso(totalSalesMonth)}
                            </div>
                        </div>
                        <MonthlyChart data={monthlyData} />
                    </div>

                    {/* Today's Records Table */}
                    <div
                        className="animate-fade-in-up delay-6"
                        style={{
                            background: 'white',
                            borderRadius: isSmallMobile ? 12 : 16,
                            padding: isSmallMobile ? 14 : isMobile ? 18 : 24,
                            border: '1px solid #f1f5f9',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            opacity: 0,
                            overflowX: 'auto',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                            <div>
                                <h3 style={{ fontSize: isSmallMobile ? '0.9rem' : '1rem', fontWeight: 700, color: '#1e293b' }}>
                                    Records of the Day
                                </h3>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                                    {formatDate(today)}
                                </p>
                            </div>
                            <span style={{
                                background: '#ecfdf5',
                                color: '#059669',
                                padding: '4px 12px',
                                borderRadius: 8,
                                fontSize: '0.72rem',
                                fontWeight: 600,
                            }}>
                                {dailyRecords.length} Records
                            </span>
                        </div>

                        {/* Desktop Table — hidden on mobile */}
                        {!isMobile && (
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                                <thead>
                                    <tr>
                                        {['#', 'Time', 'Member', 'Type', 'Amount'].map(h => (
                                            <th
                                                key={h}
                                                style={{
                                                    textAlign: h === 'Amount' ? 'right' : 'left',
                                                    padding: '8px 14px',
                                                    fontSize: '0.68rem',
                                                    fontWeight: 600,
                                                    color: '#94a3b8',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.06em',
                                                    borderBottom: '1px solid #f1f5f9',
                                                }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailyRecords.map((r) => (
                                        <tr
                                            key={r.id}
                                            style={{
                                                transition: 'background 0.2s',
                                                cursor: 'default',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, borderRadius: '10px 0 0 10px' }}>
                                                {r.id}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                                                {r.time}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                                                {r.member}
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '3px 10px',
                                                    borderRadius: 6,
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    background:
                                                        r.type === 'Monthly' ? '#eef2ff' :
                                                            r.type === 'Walk-in' ? '#f0f9ff' :
                                                                '#fdf4ff',
                                                    color:
                                                        r.type === 'Monthly' ? '#6366f1' :
                                                            r.type === 'Walk-in' ? '#0ea5e9' :
                                                                '#a855f7',
                                                }}>
                                                    {r.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', borderRadius: '0 10px 10px 0' }}>
                                                {peso(r.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ borderTop: '2px solid #f1f5f9' }}>
                                        <td colSpan={3} style={{ padding: '14px', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                                            Total Sales Today
                                        </td>
                                        <td />
                                        <td style={{ padding: '14px', textAlign: 'right', fontSize: '1rem', fontWeight: 800, color: '#6366f1' }}>
                                            {peso(totalSalesToday)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}

                        {/* Mobile Card List — shown on mobile only */}
                        {isMobile && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {dailyRecords.map((r) => (
                                    <div
                                        key={r.id}
                                        style={{
                                            padding: isSmallMobile ? '12px 14px' : '14px 16px',
                                            borderRadius: isSmallMobile ? 10 : 12,
                                            border: '1px solid #f1f5f9',
                                            background: '#fafbff',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: isSmallMobile ? 8 : 12,
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: isSmallMobile ? '0.78rem' : '0.82rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {r.member}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{r.time}</span>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '2px 8px',
                                                    borderRadius: 5,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 600,
                                                    background:
                                                        r.type === 'Monthly' ? '#eef2ff' :
                                                            r.type === 'Walk-in' ? '#f0f9ff' : '#fdf4ff',
                                                    color:
                                                        r.type === 'Monthly' ? '#6366f1' :
                                                            r.type === 'Walk-in' ? '#0ea5e9' : '#a855f7',
                                                }}>
                                                    {r.type}
                                                </span>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: isSmallMobile ? '0.82rem' : '0.9rem', fontWeight: 700, color: '#1e293b', flexShrink: 0 }}>
                                            {peso(r.amount)}
                                        </p>
                                    </div>
                                ))}
                                {/* Mobile Total */}
                                <div style={{
                                    padding: '14px 16px',
                                    borderRadius: 12,
                                    background: '#eef2ff',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Total Sales Today</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#6366f1' }}>{peso(totalSalesToday)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary Cards Row */}
                    <div
                        className="animate-fade-in-up delay-7"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile
                                ? '1fr'
                                : 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: isSmallMobile ? 12 : 16,
                            opacity: 0,
                        }}
                    >
                        {/* Sales by Type - Today */}
                        <div
                            style={{
                                background: 'white',
                                borderRadius: isSmallMobile ? 12 : 16,
                                padding: isSmallMobile ? 18 : isMobile ? 18 : 24,
                                border: '1px solid #f1f5f9',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            }}
                        >
                            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
                                Sales by Type — Today
                            </h3>
                            {[
                                { type: 'Monthly', color: '#6366f1', bg: '#eef2ff' },
                                { type: 'Walk-in', color: '#0ea5e9', bg: '#f0f9ff' },
                                { type: 'Personal Training', color: '#a855f7', bg: '#fdf4ff' },
                            ].map(cat => {
                                const amount = dailyRecords
                                    .filter(r => r.type === cat.type)
                                    .reduce((s, r) => s + r.amount, 0);
                                const count = dailyRecords.filter(r => r.type === cat.type).length;
                                const pct = totalSalesToday > 0 ? (amount / totalSalesToday) * 100 : 0;

                                return (
                                    <div key={cat.type} style={{ marginBottom: 14 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                                                {cat.type}
                                                <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 6 }}>({count})</span>
                                            </span>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: cat.color }}>
                                                {peso(amount)}
                                            </span>
                                        </div>
                                        <div style={{ height: 7, background: '#f1f5f9', borderRadius: 100, overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    height: '100%',
                                                    width: `${pct}%`,
                                                    background: `linear-gradient(90deg, ${cat.color}, ${cat.color}99)`,
                                                    borderRadius: 100,
                                                    transition: 'width 1s ease',
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Quick Stats */}
                        <div
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                borderRadius: isSmallMobile ? 12 : 16,
                                padding: isSmallMobile ? 18 : isMobile ? 22 : 28,
                                color: 'white',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                boxShadow: '0 8px 28px rgba(99,102,241,0.25)',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Decorative circles */}
                            <div style={{
                                position: 'absolute', top: -30, right: -30, width: 100, height: 100,
                                borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
                            }} />
                            <div style={{
                                position: 'absolute', bottom: -20, left: -20, width: 70, height: 70,
                                borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
                            }} />

                            <p style={{ fontSize: '0.78rem', fontWeight: 500, opacity: 0.8, marginBottom: 8, position: 'relative' }}>
                                💰 Today's Revenue Highlight
                            </p>
                            <p style={{ fontSize: isSmallMobile ? '1.45rem' : isMobile ? '1.6rem' : '2rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, position: 'relative' }}>
                                {peso(totalSalesToday)}
                            </p>
                            <div style={{
                                marginTop: 16,
                                display: 'flex',
                                gap: isSmallMobile ? 10 : 20,
                                flexWrap: 'wrap',
                                position: 'relative',
                                justifyContent: isSmallMobile ? 'space-between' : 'flex-start',
                            }}>
                                <div style={{ flex: isSmallMobile ? '1' : 'none', textAlign: isSmallMobile ? 'center' : 'left' }}>
                                    <p style={{ fontSize: isSmallMobile ? '0.95rem' : '1.1rem', fontWeight: 800 }}>{dailyRecords.length}</p>
                                    <p style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 500, whiteSpace: 'nowrap' }}>Transactions</p>
                                </div>
                                {!isSmallMobile && <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />}
                                <div style={{ flex: isSmallMobile ? '1' : 'none', textAlign: isSmallMobile ? 'center' : 'left' }}>
                                    <p style={{ fontSize: isSmallMobile ? '0.95rem' : '1.1rem', fontWeight: 800 }}>{walkInCount}</p>
                                    <p style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 500, whiteSpace: 'nowrap' }}>Walk-ins</p>
                                </div>
                                {!isSmallMobile && <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />}
                                <div style={{ flex: isSmallMobile ? '1' : 'none', textAlign: isSmallMobile ? 'center' : 'left' }}>
                                    <p style={{ fontSize: isSmallMobile ? '0.95rem' : '1.1rem', fontWeight: 800 }}>{memberCount}</p>
                                    <p style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 500, whiteSpace: 'nowrap' }}>Members</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Footer ─── */}
                <div
                    className="animate-fade-in"
                    style={{
                        marginTop: isSmallMobile ? 24 : 40,
                        textAlign: 'center',
                        color: '#cbd5e1',
                        fontSize: isSmallMobile ? '0.65rem' : '0.72rem',
                        fontWeight: 500,
                    }}
                >
                    GymFlow Receptionist System &copy; {today.getFullYear()}
                </div>
            </main>

            {/* Add Record Modal */}
            <AddRecordModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onAdd={handleAddRecord}
            />
        </div>
    );
}
