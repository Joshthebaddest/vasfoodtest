import { useEffect, useState } from "react";

export function useUserOrderHistory(userId: number | null, fromDate: string, toDate: string) {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) {
            setData([]);
            setIsLoading(false);
            return;
        }

        const baseUrl = import.meta.env.VITE_API_URL;
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const apiBaseUrl = isLocalhost
            ? "http://localhost/vasfood/api/order"
            : `https://${baseUrl}/api/order`;

        // Add date range as query params if needed
        const url = `${apiBaseUrl}/order-history/${userId}`;

        setIsLoading(true);
        fetch(url)
            .then(async (res) => {
                if (!res.ok) throw new Error("Failed to fetch order history");
                const apiResponse = await res.json();
                setData(apiResponse.data || []);
            })
            .catch((err) => setError(err))
            .finally(() => setIsLoading(false));
    }, [userId, fromDate, toDate]);

    return { data, isLoading, error };
}