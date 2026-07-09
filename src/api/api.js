const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';


const getDailyData = async () => {
    try {


        const [recordRes, monhtlyRes] = await Promise.all([
            fetch(`${API_BASE_URL}/records`),
            fetch(`${API_BASE_URL}/monthly-data`)
        ])

        if (!recordRes.ok) {
            throw new Error(`HTTP error! status: ${recordRes.status}`);
        }
        if (!monhtlyRes.ok) {
            throw new Error(`HTTP error! status: ${monhtlyRes.status}`);
        }
        const recordData = await recordRes.json();
        const monthlyData = await monhtlyRes.json();

        console.log('recordData', recordData)
        console.log('monthlyData', monthlyData)
        console.log('testing')

        return {
            recordData: Array.isArray(recordData) ? recordData : [],
            monthlyData: Array.isArray(monthlyData) ? monthlyData : []
        }
    } catch (error) {
        console.error(error)
        return {
            recordData: [],
            monthlyData: []
        }

    }

}

export { getDailyData, API_BASE_URL };
