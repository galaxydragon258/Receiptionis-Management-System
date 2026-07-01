// Static stats (overall metrics)
import { getISODateString } from "../src/utils/utility";
import useRecordServices from "../services/recordServices";


export default function saleStats() {
    const todayStr = getISODateString(new Date())
    const { data } = useRecordServices();


    const monthlySales = data?.monthlyData || [];

    const record = data?.recordData || [];

    const todaySales = record
        .filter(r => {
            const rDate = r?.createdAt ? new Date(r.createdAt) : new Date(r?.date || new Date());
            return getISODateString(rDate) === todayStr;
        })
        .reduce((sum, r) => sum + (r?.amount || 0), 0);


    const totalMonthlySales = monthlySales.reduce((sum, r) => {
        return sum + (r.sales || 0);
    }, 0)

    return { todaySales, totalMonthlySales };
}

