import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useRouteLoading = () => {
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 500); // Simulate loading state

        return () => clearTimeout(timer); // Ensure the cleanup function is a function
    }, [location]);

    return loading;
};

export default useRouteLoading;