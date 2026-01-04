import { useState, useCallback, useEffect } from 'react';

export interface UseSyncReturn {
    isSyncing: boolean;
    lastSync: Date | null;
    isOnline: boolean;
    syncWithCloud: () => Promise<void>;
}

export function useSync(loadUserData: () => Promise<void>): UseSyncReturn {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const syncWithCloud = useCallback(async () => {
        if (isSyncing) return;

        setIsSyncing(true);
        try {
            await loadUserData();
            setLastSync(new Date());
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, loadUserData]);

    // Online status listeners
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return {
        isSyncing,
        lastSync,
        isOnline,
        syncWithCloud
    };
}
