import { useState, useEffect, useRef } from 'react';
import useMediaQuery from '../hooks/useMediaQuery';
import { formatDate } from '../utils/utility';

const TYPE_OPTIONS = [
    { value: 'Monthly', label: 'Monthly Membership', amount: 2100, color: '#6366f1', bg: '#eef2ff' },
    { value: 'Walk-in', label: 'Walk-in / Day Pass', amount: 500, color: '#0ea5e9', bg: '#f0f9ff' },
    { value: 'Personal Training', label: 'Personal Training', amount: 1200, color: '#a855f7', bg: '#fdf4ff' },
];

function peso(n) {
    return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AddRecordModal({ isOpen, onClose, onAdd }) {
    const [name, setName] = useState('');
    const [type, setType] = useState('Monthly');
    const [amount, setAmount] = useState();
    const [customAmount, setCustomAmount] = useState(false);
    const [orNumber, setOrNumber] = useState('');

    const [recordDate, setRecordDate] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [createdBy, setCreatedBy] = useState('admin');
    const [closing, setClosing] = useState(false);
    const nameRef = useRef(null);
    const isMobile = useMediaQuery('(max-width: 480px)');

    // Auto-fill amount when type changes (unless user overrode it)
    useEffect(() => {
        if (!customAmount) {
            const opt = TYPE_OPTIONS.find(o => o.value === type);
            if (opt) setAmount(opt.amount);
        }
    }, [type, customAmount]);

    // Focus the name input when modal opens
    useEffect(() => {
        if (isOpen) {
            setName('');
            setType('Monthly');
            setAmount(2100);
            setCustomAmount(false);
            setOrNumber('');
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            setRecordDate(`${year}-${month}-${day}`);
            setCreatedBy('admin');
            setClosing(false);
            setTimeout(() => nameRef.current?.focus(), 150);
            document.body.style.overflow = 'hidden';
        }
    }, [isOpen]);

    function handleClose() {
        setClosing(true);
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            setClosing(false);
            onClose();
        }, 250);
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) {
            nameRef.current?.focus();
            return;
        }

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

        let finalDate = '';
        if (recordDate) {
            const parsedDate = new Date(recordDate + 'T00:00:00');
            finalDate = formatDate(parsedDate);
        }

        onAdd({
            member: name.trim(),
            type,
            amount: Number(amount),
            time: timeStr,
            orNumber: orNumber.trim(),
            date: finalDate,
            createdBy: createdBy.trim(),
        });

        handleClose();
    }

    function handleAmountChange(val) {
        setCustomAmount(true);
        setAmount(val);
    }

    function handleTypeChange(newType) {
        setType(newType);
        setCustomAmount(false);
    }

    // Handle Escape key
    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape' && isOpen) handleClose();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    if (!isOpen && !closing) return null;

    const selectedType = TYPE_OPTIONS.find(o => o.value === type);

    return (
        <div
            className={closing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: isMobile ? 'flex-end' : 'center',
                justifyContent: 'center',
                padding: isMobile ? 0 : 16,
            }}
        >
            {/* Overlay */}
            <div
                onClick={handleClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.5)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                }}
            />

            {/* Modal Card */}
            <div
                className={closing ? 'modal-card-exit' : 'modal-card-enter '}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: isMobile ? '100%' : 480,
                    background: 'white',
                    borderRadius: isMobile ? '20px 20px 0 0' : 20,
                    boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                    overflow: 'hidden',
                    maxHeight: isMobile ? '90vh' : '85vh',
                    overflowY: 'auto',
                    scrollbarWidth: 'none',

                }}
            >
                {/* Header gradient bar */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        padding: isMobile ? '18px 16px 14px' : '24px 28px 20px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >

                    <div

                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                        <div>
                            <h2 style={{
                                fontSize: isMobile ? '1.05rem' : '1.15rem',
                                fontWeight: 800,
                                color: 'white',
                                letterSpacing: '-0.02em',
                            }}>
                                Add New Record
                            </h2>
                            <p style={{
                                fontSize: '0.75rem',
                                color: 'rgba(255,255,255,0.7)',
                                fontWeight: 500,
                                marginTop: 2,
                            }}>
                                Log a member check-in or walk-in
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: 'none',
                                background: 'rgba(255,255,255,0.15)',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s',
                                fontSize: '1.1rem',
                                flexShrink: 0,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} style={{ padding: isMobile ? '16px 16px 20px' : '24px 28px 28px' }}>

                    {/* Member Name */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#475569',
                            marginBottom: 8,
                            letterSpacing: '0.02em',
                        }}>
                            Member Name
                        </label>
                        <input
                            ref={nameRef}
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Juan Dela Cruz"
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 12,
                                border: '1.5px solid #e2e8f0',
                                fontSize: '0.88rem',
                                fontWeight: 500,
                                color: '#1e293b',
                                outline: 'none',
                                transition: 'border-color 0.2s, box-shadow 0.2s',
                                background: '#fafbff',
                                fontFamily: 'inherit',
                            }}
                            onFocus={e => {
                                e.target.style.borderColor = '#a5b4fc';
                                e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                            }}
                            onBlur={e => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Type Selector — pill buttons */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#475569',
                            marginBottom: 10,
                            letterSpacing: '0.02em',
                        }}>
                            Record Type
                        </label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
                            {TYPE_OPTIONS.map(opt => {
                                const isActive = type === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleTypeChange(opt.value)}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: 10,
                                            border: `1.5px solid ${isActive ? opt.color : '#e2e8f0'}`,
                                            background: isActive ? opt.bg : 'white',
                                            color: isActive ? opt.color : '#64748b',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontFamily: 'inherit',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}
                                        onMouseEnter={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.borderColor = opt.color + '66';
                                                e.currentTarget.style.background = opt.bg;
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isActive) {
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.background = 'white';
                                            }
                                        }}
                                    >
                                        {/* Indicator dot */}
                                        <span style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: isActive ? opt.color : '#cbd5e1',
                                            transition: 'background 0.2s',
                                            flexShrink: 0,
                                        }} />
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Amount */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#475569',
                            marginBottom: 8,
                            letterSpacing: '0.02em',
                        }}>
                            Amount (₱)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute',
                                left: 16,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                pointerEvents: 'none',
                            }}>₱</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => handleAmountChange(e.target.value)}
                                min="0"
                                step="50"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 16px 12px 36px',
                                    borderRadius: 12,
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: '0.88rem',
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                    background: '#fafbff',
                                    fontFamily: 'inherit',
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = '#a5b4fc';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                        {!customAmount && (
                            <p style={{
                                fontSize: '0.68rem',
                                color: '#94a3b8',
                                marginTop: 6,
                                fontWeight: 500,
                            }}>
                                Auto-filled for {selectedType?.label}. Edit to override.
                            </p>
                        )}
                    </div>

                    {/* OR Number and Date */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexDirection: isMobile ? 'column' : 'row' }}>
                        {/* OR Number */}
                        <div style={{ flex: 1 }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#475569',
                                marginBottom: 8,
                                letterSpacing: '0.02em',
                            }}>
                                OR Number
                            </label>
                            <input
                                type="text"
                                value={orNumber}
                                onChange={e => setOrNumber(e.target.value)}
                                placeholder="e.g. OR-10234"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: 12,
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: '0.88rem',
                                    fontWeight: 500,
                                    color: '#1e293b',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                    background: '#fafbff',
                                    fontFamily: 'inherit',
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = '#a5b4fc';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {/* Date */}
                        <div style={{ flex: 1 }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#475569',
                                marginBottom: 8,
                                letterSpacing: '0.02em',
                            }}>
                                Date
                            </label>
                            <input
                                type="date"
                                value={recordDate}
                                onChange={e => setRecordDate(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: 12,
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: '0.88rem',
                                    fontWeight: 500,
                                    color: '#1e293b',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                    background: '#fafbff',
                                    fontFamily: 'inherit',
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = '#a5b4fc';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>

                    {/* Created By / Receptionist */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#475569',
                            marginBottom: 8,
                            letterSpacing: '0.02em',
                        }}>
                            Created By (Receptionist)
                        </label>
                        <input
                            type="text"
                            value={createdBy}
                            onChange={e => setCreatedBy(e.target.value)}
                            placeholder="e.g. admin"
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 12,
                                border: '1.5px solid #e2e8f0',
                                fontSize: '0.88rem',
                                fontWeight: 500,
                                color: '#1e293b',
                                outline: 'none',
                                transition: 'border-color 0.2s, box-shadow 0.2s',
                                background: '#fafbff',
                                fontFamily: 'inherit',
                            }}
                            onFocus={e => {
                                e.target.style.borderColor = '#a5b4fc';
                                e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                            }}
                            onBlur={e => {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Preview */}
                    <div style={{
                        background: '#f8fafc',
                        borderRadius: 12,
                        padding: '14px 18px',
                        marginBottom: 24,
                        border: '1px solid #f1f5f9',
                    }}>
                        <p style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                            Preview
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                {/* Avatar */}
                                <div style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 9,
                                    background: selectedType ? `linear-gradient(135deg, ${selectedType.color}, ${selectedType.color}99)` : '#e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    flexShrink: 0,
                                }}>
                                    {name.trim() ? name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '??'}
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {name.trim() || 'Member Name'}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '1px 8px',
                                            borderRadius: 5,
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            background: selectedType?.bg || '#f1f5f9',
                                            color: selectedType?.color || '#94a3b8',
                                        }}>
                                            {type}
                                        </span>
                                        {orNumber.trim() && (
                                            <span style={{ fontSize: '0.68rem', color: '#64748b', background: '#e2e8f0', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
                                                OR: {orNumber.trim()}
                                            </span>
                                        )}
                                    </div>
                                    {(recordDate || createdBy.trim()) && (
                                        <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: '0.68rem', color: '#94a3b8' }}>
                                            {recordDate && <span>Date: {recordDate}</span>}
                                            {createdBy.trim() && <span>By: {createdBy.trim()}</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', flexShrink: 0 }}>
                                {peso(amount || 0)}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexDirection: isMobile ? 'column-reverse' : 'row' }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                padding: isMobile ? '12px' : '11px 22px',
                                borderRadius: 11,
                                border: '1.5px solid #e2e8f0',
                                background: 'white',
                                color: '#64748b',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit',
                                width: isMobile ? '100%' : 'auto',
                                textAlign: 'center',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.background = '#f8fafc';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.background = 'white';
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: isMobile ? '12px' : '11px 28px',
                                borderRadius: 11,
                                border: 'none',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: 'white',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                                fontFamily: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                width: isMobile ? '100%' : 'auto',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)';
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
                    </div>
                </form>
            </div>
        </div>
    );
}
