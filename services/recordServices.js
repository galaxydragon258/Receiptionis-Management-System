import getDailyData from '../api/api.js';
import { useQuery } from '@tanstack/react-query';



export default function useRecordServices() {
    return useQuery({
        queryKey: ['daily-records'],
        queryFn: getDailyData,
    })
}

