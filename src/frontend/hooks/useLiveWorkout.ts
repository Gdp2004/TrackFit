import { useState, useEffect, useCallback } from 'react';

// UC4: Live Tracking
// UC14: Offline Syncing
export type LiveWorkoutState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'SYNCING' | 'OFFLINE_PENDING' | 'COMPLETED';

export interface WorkoutMetrics {
    distance: number;
    duration: number; // in seconds
    heartRate: number;
}

export function useLiveWorkout(allenamentoId: string | null) {
    const [targetAllenamentoId, setTargetAllenamentoId] = useState<string | null>(allenamentoId);
    const [state, setState] = useState<LiveWorkoutState>('IDLE');
    const [metrics, setMetrics] = useState<WorkoutMetrics>({ distance: 0, duration: 0, heartRate: 0 });
    const [error, setError] = useState<string | null>(null);

    // Load from local storage on mount (UC14 Recovery)
    useEffect(() => {
        const savedState = localStorage.getItem('trackfit_live_workout');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            setTargetAllenamentoId(parsed.allenamentoId);
            setMetrics(parsed.metrics);
            setState(parsed.state === 'RUNNING' ? 'PAUSED' : parsed.state);
        }
    }, []);

    // Save to local storage on tick (UC4 Persistence)
    useEffect(() => {
        if (state !== 'IDLE' && state !== 'COMPLETED') {
            localStorage.setItem('trackfit_live_workout', JSON.stringify({ allenamentoId: targetAllenamentoId, state, metrics }));
        } else if (state === 'COMPLETED') {
            localStorage.removeItem('trackfit_live_workout');
        }
    }, [state, metrics, targetAllenamentoId]);

    // Tick logic for running state
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (state === 'RUNNING') {
            interval = setInterval(() => {
                setMetrics(prev => ({
                    ...prev,
                    duration: prev.duration + 1,
                    distance: prev.distance + (Math.random() * 0.01), // mock distance
                    heartRate: 120 + Math.floor(Math.random() * 20) // mock HR
                }));
            }, 1000); // Poll every second
        }
        return () => clearInterval(interval);
    }, [state]);

    const start = useCallback((id: string) => {
        setTargetAllenamentoId(id);
        setState('RUNNING');
        setMetrics({ distance: 0, duration: 0, heartRate: 0 });
    }, []);

    const pause = useCallback(() => setState('PAUSED'), []);
    const resume = useCallback(() => setState('RUNNING'), []);

    // Synchro Logic (UC4 End / UC14 Recovery Sync)
    const finishAndSync = useCallback(async () => {
        setState('SYNCING');

        // Check if offline
        if (!navigator.onLine) {
            setState('OFFLINE_PENDING');
            return;
        }

        try {
            // API call to backend (mocked for UC completeness)
            const res = await fetch('/api/workouts/live-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    allenamentoId: targetAllenamentoId,
                    metrics,
                    timestamp: new Date().toISOString()
                })
            });

            if (!res.ok) throw new Error("Sync fallito");

            setState('COMPLETED');
        } catch (err: any) {
            console.error(err);
            setState('OFFLINE_PENDING'); // If API fails, treat as offline
        }
    }, [targetAllenamentoId, metrics]);

    // Network listener for UC14 (sync when back online)
    useEffect(() => {
        const handleOnline = () => {
            if (state === 'OFFLINE_PENDING') {
                finishAndSync();
            }
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [state, finishAndSync]);


    return { state, metrics, error, start, pause, resume, finishAndSync };
}
