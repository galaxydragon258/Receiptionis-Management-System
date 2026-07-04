import { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../components/Navbar';
import AddRecordModal from '../components/AddRecordModal';
import useMediaQuery from '../hooks/useMediaQuery';
import { formatDate, peso } from '../utils/utility';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export default function MembershipRecords() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All'); // 'All', 'Active', 'Expiring Soon', 'Expired', 'New'

    // Renewal Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [renewName, setRenewName] = useState('');
    const [renewType, setRenewType] = useState('Monthly');

    // History Drawer State
    const [selectedMember, setSelectedMember] = useState(null);

    const isMobile = useMediaQuery('(max-width: 480px)');
    const isTablet = useMediaQuery('(max-width: 768px)');

    // Fetch records
    const fetchRecords = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/records`);
            if (!res.ok) {
                throw new Error('Failed to fetch records from database');
            }
            const data = await res.json();
            setRecords(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching records:', err);
            setError('Unable to load database records. Please verify that your Backend server is running.');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    // Handle adding a record (e.g. renewal)
    const handleAddRecord = useCallback(async (record) => {
        try {
            const res = await fetch(`${API_BASE_URL}/records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save record');
            }
            // Refetch to get updated list
            fetchRecords();
        } catch (err) {
            console.error('Error saving record:', err);
            alert(`Error renewing: ${err.message}`);
        }
    }, [fetchRecords]);

    // Helper to parse dates robustly
    const parseRecordDate = (r) => {
        if (r.createdAt) return new Date(r.createdAt);
        if (r.date) return new Date(r.date);
        return new Date();
    };

    // Calculate members and status
    const computedMembers = useMemo(() => {
        if (!records.length) return [];

        const memberMap = {};
        records.forEach(r => {
            const name = r.member?.trim();
            if (!name) return;
            if (!memberMap[name]) memberMap[name] = [];
            memberMap[name].push(r);
        });

        const today = new Date();
        const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const resultList = [];

        Object.keys(memberMap).forEach(name => {
            const mRecords = memberMap[name].sort((a, b) => parseRecordDate(b) - parseRecordDate(a));

            // Separate Monthly/Premium/PT membership records from Walk-in records
            const membershipRecords = mRecords.filter(r => r.type === 'Monthly' || r.type === 'Premium' || r.type === 'Personal Training');
            const walkinRecords = mRecords.filter(r => r.type === 'Walk-in');

            const hasMembership = membershipRecords.length > 0;

            if (hasMembership) {
                const latestMembership = membershipRecords[0];
                const firstMembership = membershipRecords[membershipRecords.length - 1];

                const joinDate = parseRecordDate(firstMembership);
                const lastPaidDate = parseRecordDate(latestMembership);

                const expiryDate = new Date(lastPaidDate);
                const durationStr = latestMembership.duration || '1 Month';
                let months = 1;
                if (durationStr.includes('3')) months = 3;
                else if (durationStr.includes('6')) months = 6;
                else if (durationStr.includes('12')) months = 12;
                expiryDate.setMonth(expiryDate.getMonth() + months);
                const expiryReset = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());

                const diffTime = expiryReset - todayReset;
                const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let status = 'Expired';
                if (remainingDays > 7) {
                    status = 'Active';
                } else if (remainingDays >= 0) {
                    status = 'Expiring Soon';
                }

                const daysSinceJoined = Math.ceil((todayReset - new Date(joinDate.getFullYear(), joinDate.getMonth(), joinDate.getDate())) / (1000 * 60 * 60 * 24));
                const isNew = daysSinceJoined <= 30;

                resultList.push({
                    name,
                    isWalkInOnly: false,
                    latestRecord: latestMembership,
                    firstRecord: firstMembership,
                    joinDate,
                    lastPaidDate,
                    expiryDate,
                    remainingDays,
                    status,
                    isNew,
                    recordsCount: mRecords.length,
                    history: mRecords,
                    totalAmountPaid: mRecords.reduce((sum, rec) => sum + rec.amount, 0)
                });
            } else if (walkinRecords.length > 0) {
                // Day pass guest
                const latestWalkin = walkinRecords[0];
                const firstWalkin = walkinRecords[walkinRecords.length - 1];

                const joinDate = parseRecordDate(firstWalkin);
                const lastPaidDate = parseRecordDate(latestWalkin);

                const expiryDate = new Date(lastPaidDate);
                const expiryReset = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());

                const diffTime = expiryReset - todayReset;
                const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // A walkin is active only on the check-in day itself
                const status = remainingDays >= 0 ? 'Active' : 'Expired';

                resultList.push({
                    name,
                    isWalkInOnly: true,
                    latestRecord: latestWalkin,
                    firstRecord: firstWalkin,
                    joinDate,
                    lastPaidDate,
                    expiryDate,
                    remainingDays,
                    status,
                    isNew: false,
                    recordsCount: mRecords.length,
                    history: mRecords,
                    totalAmountPaid: mRecords.reduce((sum, rec) => sum + rec.amount, 0)
                });
            }
        });

        return resultList;
    }, [records]);

    // Statistics computation
    const stats = useMemo(() => {
        const membersOnly = computedMembers.filter(m => !m.isWalkInOnly);

        const total = membersOnly.length;
        const active = membersOnly.filter(m => m.status === 'Active').length;
        const expiring = membersOnly.filter(m => m.status === 'Expiring Soon').length;
        const expired = membersOnly.filter(m => m.status === 'Expired').length;
        const newCount = membersOnly.filter(m => m.isNew).length;
        const walkins = computedMembers.filter(m => m.isWalkInOnly).length;

        return { total, active, expiring, expired, newCount, walkins };
    }, [computedMembers]);

    // Filter members list based on query and active tab
    const filteredMembers = useMemo(() => {
        return computedMembers.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesTab = true;
            if (activeTab === 'All') matchesTab = !m.isWalkInOnly;
            else if (activeTab === 'Active') matchesTab = !m.isWalkInOnly && m.status === 'Active';
            else if (activeTab === 'Expiring Soon') matchesTab = !m.isWalkInOnly && m.status === 'Expiring Soon';
            else if (activeTab === 'Expired') matchesTab = !m.isWalkInOnly && m.status === 'Expired';
            else if (activeTab === 'New') matchesTab = !m.isWalkInOnly && m.isNew;
            else if (activeTab === 'Walk-ins') matchesTab = m.isWalkInOnly;

            return matchesSearch && matchesTab;
        });
    }, [computedMembers, searchQuery, activeTab]);

    // Trigger renewal
    const handleRenew = (member) => {
        setRenewName(member.name);
        setRenewType(member.latestRecord?.type === 'Walk-in' ? 'Monthly' : (member.latestRecord?.type || 'Monthly'));
        setModalOpen(true);
    };

    // Calculate validity progress percentage
    const getProgressPercent = (member) => {
        if (member.status === 'Expired') return 0;
        if (member.latestRecord?.type === 'Walk-in') return 100;

        const durationStr = member.latestRecord?.duration || '1 Month';
        let months = 1;
        if (durationStr.includes('3')) months = 3;
        else if (durationStr.includes('6')) months = 6;
        else if (durationStr.includes('12')) months = 12;

        const totalDuration = months * 30; // approx total days
        const remaining = Math.max(0, Math.min(totalDuration, member.remainingDays));
        return Math.round((remaining / totalDuration) * 100);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fc' }}>
            <Navbar />

            <main style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '12px 10px 40px' : isTablet ? '16px 12px 48px' : '24px 16px 60px' }}>

                {/* ─── Error Alert Banner ─── */}
                {error && (
                    <div style={{
                        background: '#fef2f2',
                        border: '1.5px solid #fca5a5',
                        borderRadius: 12,
                        padding: '16px 20px',
                        marginBottom: 20,
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#991b1b' }}>{error}</span>
                        </div>
                        <button
                            onClick={fetchRecords}
                            style={{
                                padding: '6px 14px',
                                background: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* ─── Loading Banner ─── */}
                {loading && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '50px 20px',
                        background: 'white',
                        borderRadius: 16,
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        marginBottom: 20,
                        gap: 14,
                    }}>
                        <div style={{
                            width: 28,
                            height: 28,
                            border: '3.5px solid #eef2ff',
                            borderTop: '3.5px solid #6366f1',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>
                            Computing memberships database...
                        </span>
                    </div>
                )}

                {/* ─── Header ─── */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: 16,
                    marginBottom: 28,
                }}>
                    <div>
                        <h2 style={{
                            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            color: '#1e293b',
                            marginBottom: 4,
                        }}>
                            Membership Directory
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 400 }}>
                            Review member statuses, analyze check-in history, and process subscription renewals.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setRenewName('');
                            setRenewType('Monthly');
                            setModalOpen(true);
                        }}
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
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.25s',
                            boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                            fontFamily: 'inherit',
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Member Check-in
                    </button>
                </div>

                {/* ─── Metric Cards ─── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
                    gap: 16,
                    marginBottom: 28,
                }}>
                    {/* Total Members */}
                    <div
                        onClick={() => setActiveTab('All')}
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            borderRadius: 16,
                            padding: '20px',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'All' ? '0 10px 25px rgba(59,130,246,0.35)' : '0 4px 12px rgba(0,0,0,0.03)',
                            border: activeTab === 'All' ? '2.5px solid #2563eb' : '2.5px solid transparent',
                            transform: activeTab === 'All' ? 'scale(1.03)' : 'scale(1)',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        <p style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Total Members
                        </p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 900, marginTop: 10, letterSpacing: '-0.02em' }}>{stats.total}</h3>
                        <p style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: 4 }}>Registered gym members</p>
                    </div>

                    {/* Active Members */}
                    <div
                        onClick={() => setActiveTab('Active')}
                        style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            borderRadius: 16,
                            padding: '20px',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'Active' ? '0 10px 25px rgba(16,185,129,0.35)' : '0 4px 12px rgba(0,0,0,0.03)',
                            border: activeTab === 'Active' ? '2.5px solid #059669' : '2.5px solid transparent',
                            transform: activeTab === 'Active' ? 'scale(1.03)' : 'scale(1)',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        <p style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Active Members
                        </p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 900, marginTop: 10, letterSpacing: '-0.02em' }}>{stats.active}</h3>
                        <p style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: 4 }}>Valid subscriptions</p>
                    </div>

                    {/* Expiring Soon */}
                    <div
                        onClick={() => setActiveTab('Expiring Soon')}
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            borderRadius: 16,
                            padding: '20px',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'Expiring Soon' ? '0 10px 25px rgba(245,158,11,0.35)' : '0 4px 12px rgba(0,0,0,0.03)',
                            border: activeTab === 'Expiring Soon' ? '2.5px solid #d97706' : '2.5px solid transparent',
                            transform: activeTab === 'Expiring Soon' ? 'scale(1.03)' : 'scale(1)',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        <p style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Expiring Soon
                        </p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 900, marginTop: 10, letterSpacing: '-0.02em' }}>{stats.expiring}</h3>
                        <p style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: 4 }}>Expires within 7 days</p>
                    </div>

                    {/* Expired Members */}
                    <div
                        onClick={() => setActiveTab('Expired')}
                        style={{
                            background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                            borderRadius: 16,
                            padding: '20px',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'Expired' ? '0 10px 25px rgba(244,63,94,0.35)' : '0 4px 12px rgba(0,0,0,0.03)',
                            border: activeTab === 'Expired' ? '2.5px solid #e11d48' : '2.5px solid transparent',
                            transform: activeTab === 'Expired' ? 'scale(1.03)' : 'scale(1)',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        <p style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Expired
                        </p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 900, marginTop: 10, letterSpacing: '-0.02em' }}>{stats.expired}</h3>
                        <p style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: 4 }}>Requires renewal</p>
                    </div>

                    {/* New Members (Full Month) */}
                    <div
                        onClick={() => setActiveTab('New')}
                        style={{
                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            borderRadius: 16,
                            padding: '20px',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'New' ? '0 10px 25px rgba(139,92,246,0.35)' : '0 4px 12px rgba(0,0,0,0.03)',
                            border: activeTab === 'New' ? '2.5px solid #7c3aed' : '2.5px solid transparent',
                            transform: activeTab === 'New' ? 'scale(1.03)' : 'scale(1)',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    >
                        <p style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            New Members
                        </p>
                        <h3 style={{ fontSize: '2rem', fontWeight: 900, marginTop: 10, letterSpacing: '-0.02em' }}>{stats.newCount}</h3>
                        <p style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: 4 }}>Joined this month</p>
                    </div>
                </div>

                {/* ─── Search and Navigation Tab Filters ─── */}
                <div style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: '16px 20px',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: isTablet ? 'column' : 'row',
                    alignItems: isTablet ? 'stretch' : 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    marginBottom: 24,
                }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', flex: 1, maxWidth: isTablet ? '100%' : 400 }}>
                        <svg
                            style={{
                                position: 'absolute',
                                left: 16,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8',
                                pointerEvents: 'none',
                            }}
                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search members by name..."
                            style={{
                                width: '100%',
                                padding: '12px 16px 12px 42px',
                                borderRadius: 12,
                                border: '1.5px solid #e2e8f0',
                                fontSize: '0.88rem',
                                fontWeight: 500,
                                color: '#1e293b',
                                outline: 'none',
                                transition: 'all 0.2s',
                                background: '#fafbff',
                                fontFamily: 'inherit',
                            }}
                            onFocus={e => {
                                e.target.style.borderColor = '#a5b4fc';
                                e.target.style.background = 'white';
                                e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                            }}
                            onBlur={e => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.background = '#fafbff';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Tab Navigation Menu */}
                    <div style={{
                        display: 'flex',
                        background: '#f1f5f9',
                        padding: 4,
                        borderRadius: 12,
                        gap: 2,
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                    }}>
                        {['All', 'Active', 'Expiring Soon', 'Expired', 'New', 'Walk-ins'].map(tab => {
                            const isCurrent = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: 8,
                                        border: 'none',
                                        background: isCurrent ? 'white' : 'transparent',
                                        color: isCurrent ? '#6366f1' : '#64748b',
                                        fontWeight: 600,
                                        fontSize: '0.78rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap',
                                        boxShadow: isCurrent ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    {tab} {tab === 'Walk-ins' ? `(${stats.walkins})` : ''}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ─── Members Grid ─── */}
                {filteredMembers.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: 'white',
                        borderRadius: 20,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: '50%', background: '#f1f5f9',
                            display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                            color: '#94a3b8', fontSize: '1.5rem', marginBottom: 16
                        }}>
                            🔍
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                            No members found
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 6, maxWidth: 350, marginInline: 'auto' }}>
                            Try adjusting your search criteria, selecting another tab, or logging a new member record.
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                        gap: 20,
                    }}>
                        {filteredMembers.map(member => {
                            const progress = getProgressPercent(member);
                            const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

                            let badgeBg = '#ecfdf5';
                            let badgeColor = '#10b981';
                            if (member.status === 'Expiring Soon') {
                                badgeBg = '#fffbeb';
                                badgeColor = '#d97706';
                            } else if (member.status === 'Expired') {
                                badgeBg = '#fef2f2';
                                badgeColor = '#f43f5e';
                            }

                            return (
                                <div
                                    key={member.name}
                                    style={{
                                        background: 'white',
                                        borderRadius: 20,
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                                        padding: 24,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(99,102,241,0.06)';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
                                        e.currentTarget.style.borderColor = '#f1f5f9';
                                    }}
                                >
                                    {/* Top Metadata Row */}
                                    <div>
                                        <div style={{ display: 'flex', justifySelf: 'flex-start', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: 16 }}>
                                            {/* Avatar + Title */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 14,
                                                    background: member.status === 'Active' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' :
                                                        member.status === 'Expiring Soon' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                                            'linear-gradient(135deg, #ef4444, #b91c1c)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: 800,
                                                    fontSize: '0.9rem',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                                                }}>
                                                    {initials}
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
                                                        {member.name}
                                                    </h4>
                                                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
                                                        Joined {formatDate(member.joinDate)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 8,
                                                    fontSize: '0.68rem',
                                                    fontWeight: 700,
                                                    background: badgeBg,
                                                    color: badgeColor,
                                                    letterSpacing: '0.01em',
                                                    textTransform: 'uppercase',
                                                }}>
                                                    {member.status}
                                                </span>
                                                {member.isNew && (
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: 6,
                                                        fontSize: '0.6rem',
                                                        fontWeight: 800,
                                                        background: '#f5f3ff',
                                                        color: '#7c3aed',
                                                        textTransform: 'uppercase',
                                                    }}>
                                                        NEW MEMBER
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div style={{ height: 1, background: '#f1f5f9', marginBlock: '14px' }} />

                                        {/* Membership Info Details */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                <span style={{ color: '#64748b', fontWeight: 500 }}>Membership Type</span>
                                                <span style={{ color: '#1e293b', fontWeight: 600 }}>
                                                    {member.latestRecord?.type || '—'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                <span style={{ color: '#64748b', fontWeight: 500 }}>Last Paid Amount</span>
                                                <span style={{ color: '#1e293b', fontWeight: 700 }}>
                                                    {peso(member.latestRecord?.amount || 0)}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                <span style={{ color: '#64748b', fontWeight: 500 }}>Expiry Date</span>
                                                <span style={{ color: member.status === 'Expired' ? '#f43f5e' : '#1e293b', fontWeight: 600 }}>
                                                    {formatDate(member.expiryDate)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Validity Progress bar (Monthly only) */}
                                        {member.latestRecord?.type !== 'Walk-in' && (
                                            <div style={{ marginBottom: 20 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.72rem' }}>
                                                    <span style={{ color: '#64748b', fontWeight: 500 }}>Time Period Progress</span>
                                                    <span style={{
                                                        color: member.status === 'Expired' ? '#f43f5e' :
                                                            member.status === 'Expiring Soon' ? '#d97706' : '#10b981',
                                                        fontWeight: 700
                                                    }}>
                                                        {member.status === 'Expired' ? 'Expired' : `${member.remainingDays} days remaining`}
                                                    </span>
                                                </div>
                                                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 100, overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${progress}%`,
                                                        background: member.status === 'Expiring Soon' ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                                                            'linear-gradient(90deg, #10b981, #059669)',
                                                        borderRadius: 100,
                                                        transition: 'width 0.5s ease',
                                                    }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                                        <button
                                            onClick={() => setSelectedMember(member)}
                                            style={{
                                                flex: 1,
                                                padding: '10px 14px',
                                                borderRadius: 10,
                                                border: '1.5px solid #e2e8f0',
                                                background: 'white',
                                                color: '#475569',
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontFamily: 'inherit',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = '#f8fafc';
                                                e.currentTarget.style.borderColor = '#cbd5e1';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = 'white';
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                            }}
                                        >
                                            View Logs ({member.recordsCount})
                                        </button>
                                        <button
                                            onClick={() => handleRenew(member)}
                                            style={{
                                                flex: 1,
                                                padding: '10px 14px',
                                                borderRadius: 10,
                                                border: 'none',
                                                background: member.status === 'Expired' ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                color: 'white',
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                boxShadow: member.status === 'Expired' ? '0 4px 12px rgba(244,63,94,0.2)' : '0 4px 12px rgba(99,102,241,0.2)',
                                                fontFamily: 'inherit',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            {member.status === 'Expired' ? 'Renew Plan' : 'Check-in / Pay'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ─── Detail History Drawer ─── */}
            {selectedMember && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    display: 'flex',
                    justifyContent: 'flex-end',
                }}>
                    {/* Backdrop */}
                    <div
                        onClick={() => setSelectedMember(null)}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.4)',
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                        }}
                    />

                    {/* Drawer Content */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 460,
                        background: 'white',
                        height: '100%',
                        boxShadow: '-10px 0 40px rgba(0,0,0,0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 101,
                    }}>
                        {/* Drawer Header */}
                        <div style={{
                            padding: '24px 28px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
                                    Member Account Summary
                                </h3>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2, fontWeight: 500 }}>
                                    Full transaction history and check-ins for {selectedMember.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedMember(null)}
                                style={{
                                    width: 32, height: 32, borderRadius: 8, border: 'none',
                                    background: '#f1f5f9', color: '#64748b', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1rem', fontWeight: 'bold'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Drawer Body Scroll */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '24px 28px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 20,
                            scrollbarWidth: 'none',
                        }}>
                            {/* Member profile summary box */}
                            <div style={{
                                background: '#f8fafc',
                                borderRadius: 16,
                                padding: 20,
                                border: '1px solid #f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16
                            }}>
                                <div style={{
                                    width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.1rem'
                                }}>
                                    {selectedMember.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                                        {selectedMember.name}
                                    </h4>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: 700, background: '#eef2ff', color: '#6366f1',
                                            padding: '2px 8px', borderRadius: 4
                                        }}>
                                            Total Paid: {peso(selectedMember.totalAmountPaid)}
                                        </span>
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: 700, background: '#f0fdf4', color: '#16a34a',
                                            padding: '2px 8px', borderRadius: 4
                                        }}>
                                            Logs: {selectedMember.recordsCount}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline section */}
                            <div>
                                <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                                    Record logs (Newest to Oldest)
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', paddingLeft: 16, borderLeft: '2px dashed #e2e8f0' }}>
                                    {selectedMember.history.map((log, index) => (
                                        <div key={log.id || index} style={{ position: 'relative', marginBottom: 4 }}>
                                            {/* Timeline node dot */}
                                            <div style={{
                                                position: 'absolute',
                                                left: -22,
                                                top: 14,
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                background: log.type === 'Monthly' ? '#6366f1' : log.type === 'Walk-in' ? '#0ea5e9' : '#a855f7',
                                                border: '2px solid white',
                                                boxShadow: '0 0 0 2px rgba(99,102,241,0.1)',
                                            }} />

                                            {/* Log Content Card */}
                                            <div style={{
                                                background: 'white',
                                                borderRadius: 12,
                                                padding: '14px 16px',
                                                border: '1.5px solid #f1f5f9',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                    <span style={{
                                                        fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                                                        background: log.type === 'Monthly' ? '#eef2ff' : log.type === 'Walk-in' ? '#f0f9ff' : '#fdf4ff',
                                                        color: log.type === 'Monthly' ? '#6366f1' : log.type === 'Walk-in' ? '#0ea5e9' : '#a855f7',
                                                    }}>
                                                        {log.type}
                                                    </span>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                                                        {peso(log.amount)}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: 8 }}>
                                                    <span>📅 {log.date || '—'}</span>
                                                    <span>⏰ {log.time}</span>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginTop: 6, borderTop: '1px solid #f8fafc', paddingTop: 6 }}>
                                                    <span>OR: {log.orNumber || '—'}</span>
                                                    <span>Method: {log.paymentMethod || 'Cash'}</span>
                                                </div>

                                                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>
                                                    Logged by: {log.createdBy || 'admin'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer Actions */}
                        <div style={{
                            padding: '20px 28px',
                            borderTop: '1px solid #f1f5f9',
                            background: '#fafbff',
                            display: 'flex',
                            gap: 12
                        }}>
                            <button
                                onClick={() => setSelectedMember(null)}
                                style={{
                                    flex: 1,
                                    padding: '11px',
                                    borderRadius: 10,
                                    border: '1.5px solid #e2e8f0',
                                    background: 'white',
                                    color: '#64748b',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Close Summary
                            </button>
                            <button
                                onClick={() => {
                                    handleRenew(selectedMember);
                                    setSelectedMember(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '11px',
                                    borderRadius: 10,
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: 'white',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Register Check-in
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Add Record Modal Integration ─── */}
            <AddRecordModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onAdd={handleAddRecord}
                initialName={renewName}
                initialType={renewType}
            />
        </div>
    );
}
