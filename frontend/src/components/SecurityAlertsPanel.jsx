import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { AlertTriangle, ShieldX, TrendingUp, Loader2 } from 'lucide-react';

const SecurityAlertsPanel = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndAnalyzeLogs = async () => {
            try {
                const res = await api.get('/admin/audit-logs');
                const logs = res.data.data.logs || [];

                const newAlerts = [];
                const now = new Date().getTime();
                const oneHourAgo = now - 60 * 60 * 1000;

                // 1. Repeated Denied Attempts
                const recentLogs = logs.filter(l => new Date(l.timestamp).getTime() > oneHourAgo);

                const deniedByUser = {};
                recentLogs.forEach(log => {
                    if (log.result !== 'SUCCESS') {
                        const email = log.user?.email || 'Unknown';
                        deniedByUser[email] = (deniedByUser[email] || 0) + 1;
                    }
                });

                Object.entries(deniedByUser).forEach(([email, count]) => {
                    if (count >= 5) {
                        newAlerts.push({
                            id: `denied-${email}`,
                            type: 'CRITICAL',
                            title: 'Velocity Alert: Bruteforce/Denied Access',
                            description: `User ${email} has accumulated ${count} denied attempts in the last hour.`,
                            icon: ShieldX
                        });
                    }
                });

                // 2. Multiple Emergency Accesses by same doctor
                const emergencyLogs = recentLogs.filter(l => l.emergency === true && l.action.includes('REQUEST_EMERGENCY'));
                const emergencyByDoctor = {};
                emergencyLogs.forEach(log => {
                    const email = log.user?.email || 'Unknown';
                    emergencyByDoctor[email] = (emergencyByDoctor[email] || 0) + 1;
                });

                Object.entries(emergencyByDoctor).forEach(([email, count]) => {
                    if (count >= 3) {
                        newAlerts.push({
                            id: `emerg-${email}`,
                            type: 'WARNING',
                            title: 'Pattern Alert: High Emergency Usage',
                            description: `Dr. ${email} has triggered ${count} break-glass overrides in the last hour.`,
                            icon: AlertTriangle
                        });
                    }
                });

                // 3. Access to many patients in short time (Data Exfiltration Risk)
                const readLogs = recentLogs.filter(l => l.action.includes('READ_ONE') && l.resource === 'Patient' && l.result === 'SUCCESS');
                const recordsReadByUser = {};

                readLogs.forEach(log => {
                    const email = log.user?.email || 'Unknown';
                    recordsReadByUser[email] = (recordsReadByUser[email] || new Set([]));
                    // Extract patient ID from URL or just count total distinct lines 
                    // Since URL isn't easily parsed here without schema, we'll just count total reads
                    recordsReadByUser[email].add(log.id);
                });

                Object.entries(recordsReadByUser).forEach(([email, set]) => {
                    if (set.size > 20) {
                        newAlerts.push({
                            id: `exfil-${email}`,
                            type: 'WARNING',
                            title: 'Volume Alert: Mass Data Access',
                            description: `User ${email} has queried ${set.size} individual patient records in the last hour.`,
                            icon: TrendingUp
                        });
                    }
                });

                setAlerts(newAlerts);
            } catch (error) {
                console.error('Failed to fetch logs for security alerting', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndAnalyzeLogs();
        const interval = setInterval(fetchAndAnalyzeLogs, 15000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-dark-card border border-dark-border p-5 rounded-2xl flex items-center gap-3 text-dark-textMuted">
                <Loader2 size={18} className="animate-spin" /> Analyzing security patterns...
            </div>
        );
    }

    if (alerts.length === 0) {
        return null; // Don't show if all clear, or show a green banner. Let's just show green banner.
    }

    return (
        <div className="bg-dark-card border border-rose-500/30 p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-rose-400">
                <AlertTriangle size={20} /> Zero-Trust Security Alerts
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map(alert => (
                    <div key={alert.id} className={`p-4 rounded-xl border flex gap-4 ${alert.type === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                        <div className={`mt-0.5 ${alert.type === 'CRITICAL' ? 'text-rose-500' : 'text-amber-500'}`}>
                            <alert.icon size={20} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-sm ${alert.type === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`}>
                                {alert.title}
                            </h3>
                            <p className="text-xs text-dark-textMuted mt-1">
                                {alert.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SecurityAlertsPanel;
