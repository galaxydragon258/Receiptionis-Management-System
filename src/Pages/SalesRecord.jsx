import { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '../components/Navbar';
import useMediaQuery from '../hooks/useMediaQuery';
import { MONTHS } from '../assets/Data/DatesData';
import { formatDate, peso, getISODateString } from '../utils/utility';
import todaySales from '../../SaleComputation/sales';
import { API_BASE_URL } from '../api/api.js';


export default function SalesRecord() {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isSmallMobile = useMediaQuery('(max-width: 480px)');

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('All');
    const [type, setType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    const [hoveredPoint, setHoveredPoint] = useState(null);


    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/records`);
            if (!res.ok) {
                throw new Error('Failed to retrieve sales records');
            }
            const data = await res.json();
            setRecords(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching records:', err);
            setError('Could not connect to the server database. Ensure backend server is running.');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Helper functions for date matching

    // Calculate Today & Month boundaries for static stats
    const todayStr = useMemo(() => getISODateString(new Date()), []);
    const currentMonthNum = useMemo(() => new Date().getMonth(), []);
    const currentYearNum = useMemo(() => new Date().getFullYear(), []);

    // Filtered & Sorted Records
    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const rDate = r.createdAt ? new Date(r.createdAt) : new Date(r.date || new Date());
            const rDateStr = getISODateString(rDate);

            // Date Range Filter
            if (startDate && rDateStr < startDate) return false;
            if (endDate && rDateStr > endDate) return false;

            // Payment Method Filter
            if (paymentMethod !== 'All') {
                const methodStr = (r.paymentMethod || 'Cash').toLowerCase();
                const targetMethod = paymentMethod.toLowerCase().replace(/[^a-z0-9]/g, '');

                // Split by '&' to support hybrid payment methods
                const parts = methodStr.split('&').map(p => p.trim());
                const hasMatch = parts.some(part => {
                    let normalizedPart = '';
                    const match = part.match(/^([a-z\s\-]+)/);
                    if (match) {
                        normalizedPart = match[1].trim().replace(/[^a-z0-9]/g, '');
                    } else {
                        normalizedPart = part.replace(/[^a-z0-9]/g, '');
                    }

                    if (targetMethod === 'cash') {
                        return normalizedPart.includes('cash') && !normalizedPart.includes('gcash');
                    } else if (targetMethod === 'gcash') {
                        return normalizedPart.includes('gcash');
                    } else if (targetMethod === 'bpi') {
                        return normalizedPart.includes('bpi') || normalizedPart.includes('bank');
                    } else {
                        return normalizedPart.includes(targetMethod);
                    }
                });

                if (!hasMatch) return false;
            }

            // Receptionist Filter
            if (type !== 'All' && r.type !== type) return false;

            // Search query (member name or OR number)
            if (searchQuery) {
                const query = searchQuery.toLowerCase().trim();
                const memberMatch = r.member?.toLowerCase().includes(query);
                const orMatch = r.orNumber?.toLowerCase().includes(query);
                if (!memberMatch && !orMatch) return false;
            }

            return true;
        }).sort((a, b) => {
            let valA, valB;
            if (sortField === 'createdAt') {
                valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            } else if (sortField === 'amount') {
                valA = Number(a.amount) || 0;
                valB = Number(b.amount) || 0;
            } else if (sortField === 'member') {
                valA = (a.member || '').toLowerCase();
                valB = (b.member || '').toLowerCase();
            } else if (sortField === 'orNumber') {
                valA = (a.orNumber || '').toLowerCase();
                valB = (b.orNumber || '').toLowerCase();
            } else {
                valA = a[sortField];
                valB = b[sortField];
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [records, startDate, endDate, paymentMethod, type, searchQuery, sortField, sortOrder]);

    // Unique receptionists for filter dropdown
    const receptionistsList = useMemo(() => {
        const list = new Set();
        records.forEach(r => {
            if (r.createdBy) list.add(r.createdBy);
        });
        return Array.from(list).sort();
    }, [records]);

    // Static stats (overall metrics)
    const { todaySales: totalTodaySales, totalMonthlySales: monthlySales } = todaySales();

    // Filtered stats (changes based on filters)
    const filteredTotalSales = useMemo(() => {
        return filteredRecords.reduce((sum, r) => sum + r.amount, 0);
    }, [filteredRecords]);

    const filteredTransactionsCount = filteredRecords.length;

    // Payment breakdown metrics (on filtered records)
    const paymentBreakdown = useMemo(() => {
        let cashAmt = 0, gcashAmt = 0, bpiAmt = 0;
        let cashCount = 0, gcashCount = 0, bpiCount = 0;

        filteredRecords.forEach(r => {
            const methodStr = r.paymentMethod || 'Cash';
            const amount = Number(r.amount) || 0;

            // Check if it's a hybrid payment method
            const parts = methodStr.split('&').map(p => p.trim());
            let matched = false;

            parts.forEach(part => {
                const match = part.match(/^([a-zA-Z\s\-]+)(?:\s*\([₱\d\.\,\s]+\))?/);
                if (match) {
                    const method = match[1].trim();
                    const normalized = method.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const amtMatch = part.match(/\([₱\s]*([\d\.\,]+)\)/);
                    const amt = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : amount / parts.length;

                    if (normalized.includes('cash') && !normalized.includes('gcash')) {
                        cashAmt += amt;
                        cashCount++;
                        matched = true;
                    } else if (normalized.includes('gcash')) {
                        gcashAmt += amt;
                        gcashCount++;
                        matched = true;
                    } else if (normalized.includes('bpi') || normalized.includes('bank')) {
                        bpiAmt += amt;
                        bpiCount++;
                        matched = true;
                    }
                }
            });

            if (!matched) {
                // Fallback for legacy entries
                const normalizedStr = methodStr.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (normalizedStr.includes('gcash')) {
                    gcashAmt += amount;
                    gcashCount++;
                } else if (normalizedStr.includes('bpi') || normalizedStr.includes('bank')) {
                    bpiAmt += amount;
                    bpiCount++;
                } else {
                    cashAmt += amount;
                    cashCount++;
                }
            }
        });

        const total = cashAmt + gcashAmt + bpiAmt || 1; // avoid division by zero
        return {
            cash: { amount: cashAmt, count: cashCount, percent: (cashAmt / total) * 100 },
            gcash: { amount: gcashAmt, count: gcashCount, percent: (gcashAmt / total) * 100 },
            bpi: { amount: bpiAmt, count: bpiCount, percent: (bpiAmt / total) * 100 }
        };
    }, [filteredRecords]);

    // Dynamic Date presets helper
    const applyDatePreset = (preset) => {
        const today = new Date();
        setCurrentPage(1);

        if (preset === 'today') {
            const iso = getISODateString(today);
            setStartDate(iso);
            setEndDate(iso);
        } else if (preset === 'yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const iso = getISODateString(yesterday);
            setStartDate(iso);
            setEndDate(iso);
        } else if (preset === 'week') {
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            setStartDate(getISODateString(lastWeek));
            setEndDate(getISODateString(today));
        } else if (preset === 'month') {
            const lastMonth = new Date(today);
            lastMonth.setDate(today.getDate() - 30);
            setStartDate(getISODateString(lastMonth));
            setEndDate(getISODateString(today));
        } else if (preset === 'this-month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            setStartDate(getISODateString(firstDay));
            setEndDate(getISODateString(today));
        } else if (preset === 'reset') {
            setStartDate('');
            setEndDate('');
            setPaymentMethod('All');
            setType('All');
            setSearchQuery('');
        }
    };

    // Pagination math
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredRecords.slice(start, start + itemsPerPage);
    }, [filteredRecords, currentPage]);

    // Sorting handler
    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc'); // default to desc for new sorting field
        }
        setCurrentPage(1);
    };

    // CSV Exporter
    const handleExportCSV = () => {
        const headers = ['Date', 'Time', 'OR Number', 'Member', 'Type', 'Payment Method', 'Amount', 'Receptionist'];
        const csvRows = filteredRecords.map(r => {
            const rDate = r.createdAt ? new Date(r.createdAt) : new Date(r.date || new Date());
            return [
                rDate.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' }),
                r.time || '—',
                r.orNumber ? `"${r.orNumber}"` : '—',
                `"${r.member}"`,
                `"${r.type}"`,
                r.paymentMethod || 'Cash',
                r.amount,
                r.createdBy || '—'
            ];
        });

        const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Sales_Report_${getISODateString(new Date())}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ─── Trend Chart Computation ───
    const trendData = useMemo(() => {
        // If range is selected, plot all days in the range.
        // Otherwise, default to the last 30 days of active records or general calendar dates.
        let start = startDate;
        let end = endDate;

        if (!start) {
            // Default: 30 days ago
            const d = new Date();
            d.setDate(d.getDate() - 29);
            start = getISODateString(d);
        }
        if (!end) {
            end = todayStr;
        }

        // Generate full chronological dates in range
        const datesMap = {};
        const dStart = new Date(start);
        const dEnd = new Date(end);
        let currentIter = new Date(dStart);

        let safetyCounter = 0;
        while (currentIter <= dEnd && safetyCounter < 100) {
            const keyStr = getISODateString(currentIter);
            datesMap[keyStr] = { dateStr: keyStr, sales: 0, count: 0 };
            currentIter.setDate(currentIter.getDate() + 1);
            safetyCounter++;
        }

        // Aggregate matching filtered records
        filteredRecords.forEach(r => {
            const rDate = r.createdAt ? new Date(r.createdAt) : new Date(r.date || new Date());
            const key = getISODateString(rDate);
            if (datesMap[key] !== undefined) {
                datesMap[key].sales += r.amount;
                datesMap[key].count += 1;
            }
        });

        // Convert map to sorted list
        return Object.keys(datesMap)
            .sort()
            .map(k => datesMap[k]);
    }, [filteredRecords, startDate, endDate, todayStr]);

    // SVG plotting variables
    const chartWidth = 800;
    const chartHeight = 220;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const maxChartSales = useMemo(() => {
        const peak = Math.max(...trendData.map(d => d.sales));
        return peak > 0 ? peak : 5000; // default ceiling if zero
    }, [trendData]);

    const chartPoints = useMemo(() => {
        const usableWidth = chartWidth - paddingLeft - paddingRight;
        const usableHeight = chartHeight - paddingTop - paddingBottom;
        const totalPoints = trendData.length;

        return trendData.map((d, i) => {
            const x = totalPoints > 1
                ? paddingLeft + (i / (totalPoints - 1)) * usableWidth
                : paddingLeft + usableWidth / 2;
            const y = chartHeight - paddingBottom - (d.sales / maxChartSales) * usableHeight;
            return { x, y, data: d };
        });
    }, [trendData, maxChartSales]);

    // Path definitions
    const { linePath, areaPath } = useMemo(() => {
        if (chartPoints.length === 0) return { linePath: '', areaPath: '' };

        // Standard straight/slightly-curved path joints
        let lPath = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
        for (let i = 1; i < chartPoints.length; i++) {
            lPath += ` L ${chartPoints[i].x} ${chartPoints[i].y}`;
        }

        // Close the area for filled gradient
        const aPath = `${lPath} L ${chartPoints[chartPoints.length - 1].x} ${chartHeight - paddingBottom} L ${chartPoints[0].x} ${chartHeight - paddingBottom} Z`;

        return { linePath: lPath, areaPath: aPath };
    }, [chartPoints]);

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fc' }}>
            <Navbar />

            <main style={{ maxWidth: 1280, margin: '0 auto', padding: isSmallMobile ? '12px 10px 40px' : isMobile ? '16px 12px 48px' : '24px 16px 60px' }}>

                {/* Header Section */}
                <div
                    className="animate-fade-in"
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
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
                            Sales Records & Audits
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: isSmallMobile ? '0.78rem' : '0.85rem', fontWeight: 500 }}>
                            Track payment streams, type summaries, and transaction history
                        </p>
                    </div>

                    <button
                        onClick={handleExportCSV}
                        disabled={filteredRecords.length === 0}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 18px',
                            borderRadius: 12,
                            border: '1px solid #e2e8f0',
                            background: filteredRecords.length === 0 ? '#f1f5f9' : 'white',
                            color: filteredRecords.length === 0 ? '#94a3b8' : '#334155',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: filteredRecords.length === 0 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                        onMouseEnter={e => {
                            if (filteredRecords.length > 0) {
                                e.currentTarget.style.background = '#f8fafc';
                                e.currentTarget.style.borderColor = '#cbd5e1';
                            }
                        }}
                        onMouseLeave={e => {
                            if (filteredRecords.length > 0) {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.borderColor = '#e2e8f0';
                            }
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export CSV ({filteredRecords.length})
                    </button>
                </div>

                {/* ─── Static & Filtered Metrics ─── */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isSmallMobile
                            ? '1fr'
                            : isMobile
                                ? 'repeat(2, 1fr)'
                                : 'repeat(4, 1fr)',
                        gap: isSmallMobile ? 10 : 16,
                        marginBottom: isSmallMobile ? 16 : isMobile ? 20 : 28,
                    }}
                >
                    {/* Today's Sales */}
                    <div style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: '18px 20px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Today's Sales (Total)
                        </span>
                        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#4f46e5', margin: '8px 0 2px' }}>
                            {peso(totalTodaySales)}
                        </h3>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            Aggregated revenue stream today
                        </span>
                    </div>

                    {/* Monthly Sales */}
                    <div style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: '18px 20px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Monthly Sales For {MONTHS[currentMonthNum]}
                        </span>
                        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', margin: '8px 0 2px' }}>
                            {peso(monthlySales)}
                        </h3>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            Current month revenue audit
                        </span>
                    </div>

                    {/* Filtered Total Sales */}
                    <div style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: '18px 20px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Filtered revenue
                        </span>
                        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#3b82f6', margin: '8px 0 2px' }}>
                            {peso(filteredTotalSales)}
                        </h3>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            Sum of active query amounts
                        </span>
                    </div>

                    {/* Filtered Transactions Count */}
                    <div style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: '18px 20px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Filtered Transactions
                        </span>
                        <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f59e0b', margin: '8px 0 2px' }}>
                            {filteredTransactionsCount}
                        </h3>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            Matching logs in current view
                        </span>
                    </div>
                </div>

                {/* ─── Advanced Filters Panel ─── */}
                <div
                    className="animate-fade-in-up delay-1"
                    style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: isSmallMobile ? '16px' : '22px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                        marginBottom: 20,
                    }}
                >
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        Filters
                    </h3>

                    {/* Inner filter layout */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 14 }}>
                            {/* Start Date */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: 10,
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.82rem',
                                        fontFamily: 'inherit',
                                        color: '#334155',
                                        outline: 'none',
                                    }}
                                />
                            </div>

                            {/* End Date */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: 10,
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.82rem',
                                        fontFamily: 'inherit',
                                        color: '#334155',
                                        outline: 'none',
                                    }}
                                />
                            </div>

                            {/* Payment Method */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={e => { setPaymentMethod(e.target.value); setCurrentPage(1); }}
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: 10,
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.82rem',
                                        fontFamily: 'inherit',
                                        color: '#334155',
                                        background: 'white',
                                        outline: 'none',
                                    }}
                                >
                                    <option value="All">All Payment Methods</option>
                                    <option value="Cash">Cash</option>
                                    <option value="GCash">GCash</option>
                                    <option value="BPI">BPI</option>
                                </select>
                            </div>

                            {/* Receptionist */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>Type</label>
                                <select
                                    value={type}
                                    onChange={e => { setType(e.target.value); setCurrentPage(1); }}
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: 10,
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.82rem',
                                        fontFamily: 'inherit',
                                        color: '#334155',
                                        background: 'white',
                                        outline: 'none',
                                    }}
                                >
                                    <option value="All">All Types</option>
                                    <option value="Walk-in">Walk-in</option>
                                    <option value="Monthly">Basic Membership</option>
                                    <option value="Premium">Premium Membership</option>
                                    <option value="Personal Training">Personal Training</option>
                                </select>
                            </div>
                        </div>

                        {/* Presets and Reset row */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            paddingTop: 12,
                            borderTop: '1px dashed #f1f5f9',
                        }}>
                            {/* Preset Buttons */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                <button
                                    onClick={() => applyDatePreset('today')}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 8,
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        background: '#f1f5f9',
                                        color: '#475569',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => applyDatePreset('yesterday')}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 8,
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        background: '#f1f5f9',
                                        color: '#475569',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Yesterday
                                </button>
                                <button
                                    onClick={() => applyDatePreset('week')}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 8,
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        background: '#f1f5f9',
                                        color: '#475569',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Last 7 Days
                                </button>
                                <button
                                    onClick={() => applyDatePreset('month')}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 8,
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        background: '#f1f5f9',
                                        color: '#475569',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Last 30 Days
                                </button>
                                <button
                                    onClick={() => applyDatePreset('this-month')}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 8,
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        background: '#f1f5f9',
                                        color: '#475569',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    This Month
                                </button>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={() => applyDatePreset('reset')}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: 8,
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    background: 'transparent',
                                    color: '#ef4444',
                                    border: '1.5px solid #fecaca',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* ─── SVG Sales Trend Chart ─── */}
                <div
                    className="animate-fade-in-up delay-2"
                    style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: isSmallMobile ? '16px' : '22px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                        marginBottom: 20,
                        position: 'relative'
                    }}
                >
                    <div style={{ marginBottom: 16 }}>
                        <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                            Sales Trend Line
                        </h3>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>
                            Daily revenue performance breakdown in current active period
                        </p>
                    </div>

                    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <div style={{ minWidth: 680, position: 'relative', height: chartHeight }}>
                            <svg
                                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                style={{ width: '100%', height: '100%', display: 'block' }}
                            >
                                <defs>
                                    {/* Area Gradient */}
                                    <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>

                                {/* Y-axis gridlines & labels */}
                                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                                    const yPos = chartHeight - paddingBottom - ratio * (chartHeight - paddingTop - paddingBottom);
                                    const valueLabel = Math.round(ratio * maxChartSales);
                                    return (
                                        <g key={index}>
                                            <line
                                                x1={paddingLeft}
                                                y1={yPos}
                                                x2={chartWidth - paddingRight}
                                                y2={yPos}
                                                stroke="#f1f5f9"
                                                strokeDasharray="4 4"
                                                strokeWidth="1.5"
                                            />
                                            <text
                                                x={paddingLeft - 8}
                                                y={yPos + 4}
                                                textAnchor="end"
                                                fontSize="9px"
                                                fontWeight="600"
                                                fill="#94a3b8"
                                            >
                                                {valueLabel >= 1000 ? `₱${(valueLabel / 1000).toFixed(1)}k` : `₱${valueLabel}`}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Bottom Baseline */}
                                <line
                                    x1={paddingLeft}
                                    y1={chartHeight - paddingBottom}
                                    x2={chartWidth - paddingRight}
                                    y2={chartHeight - paddingBottom}
                                    stroke="#cbd5e1"
                                    strokeWidth="1.5"
                                />

                                {/* Area Fill */}
                                {chartPoints.length > 0 && (
                                    <path
                                        d={areaPath}
                                        fill="url(#chartAreaGrad)"
                                    />
                                )}

                                {/* Line Path */}
                                {chartPoints.length > 0 && (
                                    <path
                                        d={linePath}
                                        fill="none"
                                        stroke="#4f46e5"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                )}

                                {/* Interactive Circle Nodes */}
                                {chartPoints.map((pt, i) => {
                                    // Highlight if hovered
                                    const isHovered = hoveredPoint && hoveredPoint.index === i;
                                    return (
                                        <g key={i}>
                                            <circle
                                                cx={pt.x}
                                                cy={pt.y}
                                                r={isHovered ? 6 : 4}
                                                fill={isHovered ? '#4f46e5' : 'white'}
                                                stroke="#4f46e5"
                                                strokeWidth={isHovered ? 2.5 : 2}
                                                style={{ transition: 'all 0.15s ease-out' }}
                                            />

                                            {/* Larger invisible hover capture target */}
                                            <circle
                                                cx={pt.x}
                                                cy={pt.y}
                                                r={15}
                                                fill="transparent"
                                                cursor="pointer"
                                                onMouseEnter={() => setHoveredPoint({
                                                    index: i,
                                                    x: pt.x,
                                                    y: pt.y,
                                                    date: pt.data.dateStr,
                                                    sales: pt.data.sales,
                                                    count: pt.data.count
                                                })}
                                                onMouseLeave={() => setHoveredPoint(null)}
                                            />
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Chart Tooltip Overlay */}
                            {hoveredPoint && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: hoveredPoint.x - 70, // center horizontally relative to point
                                        top: hoveredPoint.y - 65, // display above point
                                        width: 140,
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(4px)',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: 8,
                                        padding: '6px 10px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        pointerEvents: 'none',
                                        zIndex: 10,
                                        textAlign: 'center',
                                        animation: 'fadeIn 0.15s ease-out both'
                                    }}
                                >
                                    <p style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                        {new Date(hoveredPoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                    <p style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', margin: '2px 0 1px' }}>
                                        {peso(hoveredPoint.sales)}
                                    </p>
                                    <p style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 500 }}>
                                        {hoveredPoint.count} transaction{hoveredPoint.count !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* X-axis date tags (Responsive Layout below SVG) */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingLeft: paddingLeft,
                        paddingRight: paddingRight,
                        paddingTop: 8,
                    }}>
                        {trendData.filter((_, idx) => {
                            // Display logic based on number of days to prevent overlap
                            const length = trendData.length;
                            if (length <= 7) return true;
                            if (length <= 15) return idx % 2 === 0 || idx === length - 1;
                            if (length <= 31) return idx % 5 === 0 || idx === length - 1;
                            return idx % 10 === 0 || idx === length - 1;
                        }).map(d => (
                            <span key={d.dateStr} style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>
                                {new Date(d.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ─── Payment Methods Breakdown ─── */}
                <div
                    className="animate-fade-in-up delay-3"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                        gap: 16,
                        marginBottom: 20,
                    }}
                >
                    {/* Cash */}
                    <div style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: '18px 22px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8, background: '#ecfdf5',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#10b981', fontWeight: 'bold'
                                }}>
                                    💵
                                </div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Cash Receipts</span>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8' }}>
                                {paymentBreakdown.cash.count} transactions
                            </span>
                        </div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginBottom: 8 }}>
                            {peso(paymentBreakdown.cash.amount)}
                        </h4>
                        {/* Progress Bar */}
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 10 }}>
                            <div style={{
                                height: '100%',
                                background: '#10b981',
                                borderRadius: 10,
                                width: `${paymentBreakdown.cash.percent}%`,
                                transition: 'width 0.8s ease'
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>
                                {paymentBreakdown.cash.percent.toFixed(1)}% of total
                            </span>
                        </div>
                    </div>

                    {/* GCash */}
                    <div style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: '18px 22px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #eef2ff'
                                }}>
                                    <img src="/GCash.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="GCash" />
                                </div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>GCash Receipts</span>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8' }}>
                                {paymentBreakdown.gcash.count} transactions
                            </span>
                        </div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6', marginBottom: 8 }}>
                            {peso(paymentBreakdown.gcash.amount)}
                        </h4>
                        {/* Progress Bar */}
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 10 }}>
                            <div style={{
                                height: '100%',
                                background: '#3b82f6',
                                borderRadius: 10,
                                width: `${paymentBreakdown.gcash.percent}%`,
                                transition: 'width 0.8s ease'
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>
                                {paymentBreakdown.gcash.percent.toFixed(1)}% of total
                            </span>
                        </div>
                    </div>

                    {/* BPI Receipts */}
                    <div style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: '18px 22px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #fef3c7'
                                }}>
                                    <img src="/Bpi.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="BPI" />
                                </div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>BPI Receipts</span>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8' }}>
                                {paymentBreakdown.bpi.count} transactions
                            </span>
                        </div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', marginBottom: 8 }}>
                            {peso(paymentBreakdown.bpi.amount)}
                        </h4>
                        {/* Progress Bar */}
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 10 }}>
                            <div style={{
                                height: '100%',
                                background: '#dc2626',
                                borderRadius: 10,
                                width: `${paymentBreakdown.bpi.percent}%`,
                                transition: 'width 0.8s ease'
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>
                                {paymentBreakdown.bpi.percent.toFixed(1)}% of total
                            </span>
                        </div>
                    </div>
                </div>

                {/* ─── Transaction History Table Card ─── */}
                <div
                    className="animate-fade-in-up delay-4"
                    style={{
                        background: 'white',
                        borderRadius: 16,
                        padding: isSmallMobile ? '14px' : '22px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                        overflowX: 'auto',
                    }}
                >
                    {/* Header + Search */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 18,
                    }}>
                        <div>
                            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                                Transaction Audit Logs
                            </h3>
                            <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>
                                Database values are strictly retained for a maximum of 2 months
                            </p>
                        </div>

                        {/* Search Input */}
                        <div style={{ position: 'relative', width: isMobile ? '100%' : 260 }}>
                            <input
                                type="text"
                                placeholder="Search member name or OR #..."
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px 8px 34px',
                                    borderRadius: 10,
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.8rem',
                                    fontFamily: 'inherit',
                                    color: '#334155',
                                    outline: 'none',
                                }}
                            />
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#94a3b8"
                                strokeWidth="2.5"
                                style={{ position: 'absolute', left: 12, top: 12 }}
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                    </div>

                    {/* Table View (Desktop) */}
                    {!isMobile && (
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 2px' }}>
                            <thead>
                                <tr>
                                    <th
                                        onClick={() => handleSort('createdAt')}
                                        style={{
                                            padding: '10px 14px', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9',
                                            textAlign: 'left', cursor: 'pointer', userSelect: 'none'
                                        }}
                                    >
                                        Date {sortField === 'createdAt' && (sortOrder === 'asc' ? '▲' : '▼')}
                                    </th>
                                    <th
                                        style={{
                                            padding: '10px 14px', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9',
                                            textAlign: 'left'
                                        }}
                                    >
                                        Time
                                    </th>
                                    <th
                                        onClick={() => handleSort('orNumber')}
                                        style={{
                                            padding: '10px 14px', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9',
                                            textAlign: 'left', cursor: 'pointer', userSelect: 'none'
                                        }}
                                    >
                                        OR # {sortField === 'orNumber' && (sortOrder === 'asc' ? '▲' : '▼')}
                                    </th>
                                    <th
                                        onClick={() => handleSort('member')}
                                        style={{
                                            padding: '10px 14px', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9',
                                            textAlign: 'left', cursor: 'pointer', userSelect: 'none'
                                        }}
                                    >
                                        Member {sortField === 'member' && (sortOrder === 'asc' ? '▲' : '▼')}
                                    </th>
                                    <th
                                        style={{
                                            padding: '10px 14px', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9',
                                            textAlign: 'left'
                                        }}
                                    >
                                        Type
                                    </th>
                                    <th
                                        style={{
                                            padding: '10px 14px', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9',
                                            textAlign: 'left'
                                        }}
                                    >
                                        Method
                                    </th>
                                    <th
                                        onClick={() => handleSort('amount')}
                                        style={{
                                            padding: '10px 14px', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9',
                                            textAlign: 'right', cursor: 'pointer', userSelect: 'none'
                                        }}
                                    >
                                        Amount {sortField === 'amount' && (sortOrder === 'asc' ? '▲' : '▼')}
                                    </th>
                                    <th
                                        style={{
                                            padding: '10px 14px', fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f1f5f9',
                                            textAlign: 'left'
                                        }}
                                    >
                                        Receptionist
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRecords.map((r, index) => {
                                    const rDate = r.createdAt ? new Date(r.createdAt) : new Date(r.date || new Date());
                                    return (
                                        <tr
                                            key={r.id || index}
                                            style={{ cursor: 'default', transition: 'background 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#1e293b', fontWeight: 600 }}>
                                                {rDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#64748b' }}>
                                                {r.time || '—'}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                                                {r.orNumber || '—'}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#1e293b', fontWeight: 600 }}>
                                                {r.member}
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600,
                                                    background: r.type === 'Monthly' ? '#eef2ff' : r.type === 'Premium' ? '#ecfdf5' : r.type === 'Walk-in' ? '#f0f9ff' : '#fdf4ff',
                                                    color: r.type === 'Monthly' ? '#6366f1' : r.type === 'Premium' ? '#10b981' : r.type === 'Walk-in' ? '#0ea5e9' : '#a855f7'
                                                }}>
                                                    {r.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px' }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600,
                                                    background:
                                                        r.paymentMethod?.includes('Cash') && !r.paymentMethod?.includes('&') ? '#ecfdf5' :
                                                            r.paymentMethod?.includes('GCash') && !r.paymentMethod?.includes('&') ? '#eff6ff' : '#fef3c7',
                                                    color:
                                                        r.paymentMethod?.includes('Cash') && !r.paymentMethod?.includes('&') ? '#10b981' :
                                                            r.paymentMethod?.includes('GCash') && !r.paymentMethod?.includes('&') ? '#2563eb' : '#d97706'
                                                }}>
                                                    {r.paymentMethod || 'Cash'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.82rem', color: '#1e293b', fontWeight: 700 }}>
                                                {peso(r.amount)}
                                            </td>
                                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                                                {r.createdBy || '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {paginatedRecords.length === 0 && (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '40px 14px', textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                                            No transaction records found matching active query.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* Mobile Card List (Mobile responsive view) */}
                    {isMobile && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {paginatedRecords.map((r, index) => {
                                const rDate = r.createdAt ? new Date(r.createdAt) : new Date(r.date || new Date());
                                return (
                                    <div
                                        key={r.id || index}
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: 12,
                                            border: '1px solid #f1f5f9',
                                            background: '#fafbff',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                                                {r.member}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>
                                                {peso(r.amount)}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                                                {r.time || '—'}
                                            </span>
                                            <span style={{
                                                display: 'inline-block', padding: '2px 6px', borderRadius: 4, fontSize: '0.62rem', fontWeight: 600,
                                                background: r.type === 'Monthly' ? '#eef2ff' : r.type === 'Premium' ? '#ecfdf5' : r.type === 'Walk-in' ? '#f0f9ff' : '#fdf4ff',
                                                color: r.type === 'Monthly' ? '#6366f1' : r.type === 'Premium' ? '#10b981' : r.type === 'Walk-in' ? '#0ea5e9' : '#a855f7'
                                            }}>
                                                {r.type}
                                            </span>
                                            <span style={{
                                                display: 'inline-block', padding: '2px 6px', borderRadius: 4, fontSize: '0.62rem', fontWeight: 600,
                                                background:
                                                    r.paymentMethod?.includes('Cash') && !r.paymentMethod?.includes('&') ? '#ecfdf5' :
                                                        r.paymentMethod?.includes('GCash') && !r.paymentMethod?.includes('&') ? '#eff6ff' : '#fef3c7',
                                                color:
                                                    r.paymentMethod?.includes('Cash') && !r.paymentMethod?.includes('&') ? '#10b981' :
                                                        r.paymentMethod?.includes('GCash') && !r.paymentMethod?.includes('&') ? '#2563eb' : '#d97706'
                                            }}>
                                                {r.paymentMethod || 'Cash'}
                                            </span>
                                            {r.orNumber && (
                                                <span style={{ fontSize: '0.65rem', color: '#64748b', background: '#e2e8f0', padding: '1px 5px', borderRadius: 3 }}>
                                                    OR: {r.orNumber}
                                                </span>
                                            )}
                                        </div>

                                        <div style={{
                                            borderTop: '1px solid #f1f5f9', paddingTop: 6, marginTop: 2,
                                            display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8'
                                        }}>
                                            <span>📅 {rDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span>👤 {r.createdBy || '—'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {paginatedRecords.length === 0 && (
                                <div style={{ padding: '30px 10px', textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                                    No records found matching query.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {filteredRecords.length > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: 18,
                            paddingTop: 14,
                            borderTop: '1px solid #f1f5f9',
                            flexWrap: 'wrap',
                            gap: 12,
                        }}>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                                Showing {Math.min(filteredRecords.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredRecords.length, currentPage * itemsPerPage)} of {filteredRecords.length} records
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {/* Prev Button */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        border: '1px solid #e2e8f0',
                                        background: currentPage === 1 ? '#f8fafc' : 'white',
                                        color: currentPage === 1 ? '#cbd5e1' : '#475569',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                </button>

                                {/* Page Number Display */}
                                <span style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 700, padding: '0 8px' }}>
                                    Page {currentPage} of {totalPages}
                                </span>

                                {/* Next Button */}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        border: '1px solid #e2e8f0',
                                        background: currentPage === totalPages ? '#f8fafc' : 'white',
                                        color: currentPage === totalPages ? '#cbd5e1' : '#475569',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
