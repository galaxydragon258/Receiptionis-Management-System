import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/Navbar';
import AddRecordModal from '../components/AddRecordModal';
import useMediaQuery from '../hooks/useMediaQuery';
import MonthlyChart from '../components/MonthlyChart';
import { MONTHS, DAYS_SHORT } from '../assets/Data/DatesData';
import { formatDate, formatTime, peso } from '../utils/utility';
import StatCard from '../components/StatCard';
import useRecordServices from '../../services/recordServices';
import saleStats from '../../SaleComputation/sales';
import { API_BASE_URL } from '../api/api';



export default function Dashboard() {
    const queryClient = useQueryClient();
    const [now, setNow] = useState(new Date());
    const today = useMemo(() => new Date(), []);
    const [modalOpen, setModalOpen] = useState(false);


    const isMobile = useMediaQuery('(max-width: 768px)');
    const isSmallMobile = useMediaQuery('(max-width: 480px)');

    // ─── Compute today's sales ───
    const { todaySales: totalSalesToday, totalMonthlySales: totalSalesMonth } = saleStats();
    const { data, isLoading, error } = useRecordServices();


    // live clock
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const [dailyRecords, setDailyRecords] = useState([]);
    const handleAddRecord = useCallback(async (record) => {
        try {
            console.log(record)
            const res = await fetch(`${API_BASE_URL}/records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });

            if (!res.ok) {
                const errorsData = await res.json();
                throw new Error(errorsData.errors || 'Failed to save record to database');
            }

            const responseData = await res.json();



            console.log(responseData)
            const savedRecordObj = responseData.data || responseData;
            setDailyRecords(prev => [...prev, savedRecordObj]);

            // Invalidate query to refresh data (including monthly sales breakdown) from backend
            queryClient.invalidateQueries({ queryKey: ['daily-records'] });
        } catch (err) {
            console.error('Error saving record:', err);
            alert(`Error saving record: ${err.message}`);
        }
    }, [queryClient]);


    // Filter records for today's date
    const todayString = useMemo(() => formatDate(today), [today]);
    const todayRecords = useMemo(() => {
        return dailyRecords.filter(r => {
            const rDateStr = r.date || (r.createdAt ? formatDate(new Date(r.createdAt)) : '');
            return rDateStr === todayString;
        });
    }, [dailyRecords, todayString]);


    const monthlyData = data?.monthlyData || [];
    const recordData = data?.recordData || [];

    // Sync React Query's recordData into local dailyRecords state


    // calculate totals based on today's filtered records
    const walkInCount = useMemo(() => todayRecords.filter(r => r.type === 'Walk-in').length, [todayRecords]);
    const memberCount = useMemo(() => todayRecords.filter(r => r.type === 'Monthly' || r.type === 'Premium').length, [todayRecords]);

    const totalMembersMonth = data?.monthlyData?.reduce((s, d) => s + d.members, 0);

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
                        value={peso(totalSalesToday || 0)}
                        sub={`${todayRecords.length} transactions today`}
                        accent="indigo"
                        delay={1}
                        isMobile={isMobile}
                        isSmallMobile={isSmallMobile}
                    />
                    <StatCard
                        icon={<svg width={isSmallMobile ? 16 : 22} height={isSmallMobile ? 16 : 22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
                        label={`Total Sales — ${MONTHS[today.getMonth()]}`}
                        value={peso(totalSalesMonth || 0)}
                        sub={`${totalMembersMonth || 0} total members this month`}
                        accent="emerald"
                        delay={2}
                        isMobile={isMobile}
                        isSmallMobile={isSmallMobile}
                    />
                    <StatCard
                        icon={<svg width={isSmallMobile ? 16 : 22} height={isSmallMobile ? 16 : 22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                        label="Records Today"
                        value={todayRecords.length}
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
                                {todayRecords.length} Records
                            </span>
                        </div>

                        {/* Desktop Table — hidden on mobile */}
                        {!isMobile && (
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                                <thead>
                                    <tr>
                                        {['#', 'OR #', 'Date', 'Time', 'Member', 'Type', 'Payment', 'Amount', 'Created By'].map(h => (
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
                                    {todayRecords.map((r, idx) => (
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
                                                {idx + 1}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#1e293b', fontWeight: 600 }}>
                                                {r.orNumber || '—'}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                                                {r.date || '—'}
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
                                                            r.type === 'Premium' ? '#ecfdf5' :
                                                                r.type === 'Walk-in' ? '#f0f9ff' :
                                                                    '#fdf4ff',
                                                    color:
                                                        r.type === 'Monthly' ? '#6366f1' :
                                                            r.type === 'Premium' ? '#10b981' :
                                                                r.type === 'Walk-in' ? '#0ea5e9' :
                                                                    '#a855f7',
                                                }}>
                                                    {r.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '3px 10px',
                                                    borderRadius: 6,
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    background:
                                                        r.paymentMethod === 'Cash' ? '#ecfdf5' :
                                                            r.paymentMethod === 'GCash' ? '#eff6ff' : '#fef3c7',
                                                    color:
                                                        r.paymentMethod === 'Cash' ? '#10b981' :
                                                            r.paymentMethod === 'GCash' ? '#2563eb' : '#d97706',
                                                }}>
                                                    {r.paymentMethod || 'Cash'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                                                {peso(r.amount)}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#64748b', fontWeight: 500, borderRadius: '0 10px 10px 0' }}>
                                                {r.createdBy || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ borderTop: '2px solid #f1f5f9' }}>
                                        <td colSpan={6} style={{ padding: '14px', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                                            Total Sales Today
                                        </td>
                                        <td />
                                        <td style={{ padding: '14px', textAlign: 'right', fontSize: '1rem', fontWeight: 800, color: '#6366f1' }}>
                                            {peso(totalSalesToday)}
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        )}

                        {/* Mobile Card List — shown on mobile only */}
                        {isMobile && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {todayRecords.map((r) => (
                                    <div
                                        key={r.id}
                                        style={{
                                            padding: isSmallMobile ? '12px 14px' : '14px 16px',
                                            borderRadius: isSmallMobile ? 10 : 12,
                                            border: '1px solid #f1f5f9',
                                            background: '#fafbff',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: isSmallMobile ? 8 : 12 }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: isSmallMobile ? '0.78rem' : '0.82rem', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {r.member}
                                                </p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{r.time}</span>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '2px 8px',
                                                        borderRadius: 5,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 600,
                                                        background:
                                                            r.type === 'Monthly' ? '#eef2ff' :
                                                                r.type === 'Premium' ? '#ecfdf5' :
                                                                    r.type === 'Walk-in' ? '#f0f9ff' : '#fdf4ff',
                                                        color:
                                                            r.type === 'Monthly' ? '#6366f1' :
                                                                r.type === 'Premium' ? '#10b981' :
                                                                    r.type === 'Walk-in' ? '#0ea5e9' : '#a855f7',
                                                    }}>
                                                        {r.type}
                                                    </span>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '2px 8px',
                                                        borderRadius: 5,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 600,
                                                        background:
                                                            r.paymentMethod === 'Cash' ? '#ecfdf5' :
                                                                r.paymentMethod === 'GCash' ? '#eff6ff' : '#fef3c7',
                                                        color:
                                                            r.paymentMethod === 'Cash' ? '#10b981' :
                                                                r.paymentMethod === 'GCash' ? '#2563eb' : '#d97706',
                                                    }}>
                                                        {r.paymentMethod || 'Cash'}
                                                    </span>
                                                    {r.orNumber && (
                                                        <span style={{
                                                            fontSize: '0.68rem',
                                                            color: '#64748b',
                                                            background: '#e2e8f0',
                                                            padding: '2px 6px',
                                                            borderRadius: 4,
                                                            fontWeight: 500,
                                                        }}>
                                                            OR: {r.orNumber}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p style={{ fontSize: isSmallMobile ? '0.82rem' : '0.9rem', fontWeight: 700, color: '#1e293b', flexShrink: 0 }}>
                                                {peso(r.amount)}
                                            </p>
                                        </div>

                                        {(r.date || r.createdBy) && (
                                            <div style={{
                                                display: 'flex',
                                                gap: 12,
                                                fontSize: '0.7rem',
                                                color: '#94a3b8',
                                                borderTop: '1px solid #f1f5f9',
                                                paddingTop: 6,
                                                flexWrap: 'wrap',
                                            }}>
                                                {r.date && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        📅 {r.date}
                                                    </span>
                                                )}
                                                {r.createdBy && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        👤 {r.createdBy}
                                                    </span>
                                                )}
                                            </div>
                                        )}
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
                                { type: 'Premium', color: '#10b981', bg: '#ecfdf5' },
                                { type: 'Walk-in', color: '#0ea5e9', bg: '#f0f9ff' },
                                { type: 'Personal Training', color: '#a855f7', bg: '#fdf4ff' },
                            ].map(cat => {
                                const amount = todayRecords
                                    .filter(r => r.type === cat.type)
                                    .reduce((s, r) => s + r.amount, 0);
                                const count = todayRecords.filter(r => r.type === cat.type).length;
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
                                background: '#3b9929ff',
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
                                    <p style={{ fontSize: isSmallMobile ? '0.95rem' : '1.1rem', fontWeight: 800 }}>{todayRecords.length}</p>
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
