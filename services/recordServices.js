import { getDailyData } from '../src/api/api.js';
import { useQuery } from '@tanstack/react-query';



export default function useRecordServices() {
    return useQuery({
        queryKey: ['daily-records'],
        queryFn: getDailyData,
    })
}

