export default function generateMonthlyBreakdown() {
    return Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        sales: Math.floor(Math.random() * 6000) + 2000,
        members: Math.floor(Math.random() * 20) + 5,
    }));
}