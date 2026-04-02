import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    Search,
    History,
    User,
    Shield,
    AlertCircle,
    Eye,
    Globe,
    Cpu
} from 'lucide-react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import { XCircle } from 'lucide-react';

interface AuditLog {
    id: number;
    user_id: number | null;
    action: 'created' | 'updated' | 'deleted';
    table_name: string;
    record_id: number;
    old_values: any;
    new_values: any;
    ip_address: string;
    user_agent: string;
    created_at: string;
    user: {
        first_name: string;
        last_name: string;
        email: string;
    } | null;
}

interface PaginatedLogs {
    data: AuditLog[];
    links: any[];
    total: number;
}

export default function Index({ auth, logs, filters }: PageProps<{
    logs: PaginatedLogs;
    filters: { table?: string; action?: string };
}>) {
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const handleFilter = (key: string, value: string) => {
        router.get(route('audit-logs.index'), { ...filters, [key]: value }, { preserveState: true });
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'created': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
            case 'updated': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
            case 'deleted': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
            default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight border-l-4 border-indigo-500 pl-4">Audit Trail & Traceability</h2>}
        >
            <Head title="Audit Logs" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700 flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Filter by Model</label>
                            <select
                                className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md text-sm"
                                value={filters.table || ''}
                                onChange={(e) => handleFilter('table', e.target.value)}
                            >
                                <option value="">All Models</option>
                                <option value="patients">Patients</option>
                                <option value="tests">Tests</option>
                                <option value="test_orders">Test Orders</option>
                                <option value="test_results">Test Results</option>
                                <option value="users">Users</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Filter by Action</label>
                            <select
                                className="w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-md text-sm"
                                value={filters.action || ''}
                                onChange={(e) => handleFilter('action', e.target.value)}
                            >
                                <option value="">All Actions</option>
                                <option value="created">Created</option>
                                <option value="updated">Updated</option>
                                <option value="deleted">Deleted</option>
                            </select>
                        </div>
                    </div>

                    {/* Logs Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp / ID</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actor</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Resource</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Network Info</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-mono">#{log.id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.user ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                            {log.user.first_name} {log.user.last_name}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500">{log.user.email}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">System Auto</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">
                                                {log.table_name.replace('_', ' ')}
                                            </div>
                                            <div className="text-xs text-indigo-500 font-mono">ID: {log.record_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-xs text-gray-500 mb-1">
                                                <Globe className="h-3 w-3 mr-1" /> {log.ip_address}
                                            </div>
                                            <div className="flex items-center text-[10px] text-gray-400 max-w-[150px] truncate">
                                                <Cpu className="h-3 w-3 mr-1 flex-shrink-0" /> {log.user_agent}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => setSelectedLog(log)} className="text-indigo-600 hover:text-indigo-500 p-2">
                                                <Eye className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {logs.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                                            No audit trail records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Log Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-900 text-white">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <History className="h-5 w-5 text-indigo-400" />
                                    Log Detail #{selectedLog.id}
                                </h3>
                                <p className="text-gray-400 text-xs mt-1">Full audit trace for record #{selectedLog.record_id} in {selectedLog.table_name}</p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="text-white/60 hover:text-white">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-6">
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border dark:border-gray-700">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Previous State</h4>
                                    <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 overflow-x-auto p-4 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                                        {JSON.stringify(selectedLog.old_values, null, 2) || '// No previous data'}
                                    </pre>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3">New/Updated State</h4>
                                    <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 overflow-x-auto p-4 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                                        {JSON.stringify(selectedLog.new_values, null, 2) || '// No data change'}
                                    </pre>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t dark:border-gray-700 flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 font-mono italic">
                            <span>Captured from {selectedLog.ip_address}</span>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
