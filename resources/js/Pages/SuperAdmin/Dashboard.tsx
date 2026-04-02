import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import { Building2, Users, Clock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Microscope } from 'lucide-react';
import { formatDate } from '@/Utils/dateUtils';

interface Lab {
    id: number;
    name: string;
    email: string;
    subscription_status: string;
    created_at: string;
    users_count?: number;
}

interface Stats {
    total_labs: number;
    active_labs: number;
    pending_labs: number;
    total_users: number;
}

export default function Dashboard({ auth, stats, pendingLabs, recentLabs }: PageProps<{ stats: Stats; pendingLabs: Lab[]; recentLabs: Lab[] }>) {
    const [verifyingLab, setVerifyingLab] = useState<Lab | null>(null);
    const { data, setData, post, processing, reset } = useForm({
        duration_months: 12,
    });

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifyingLab) return;

        post(route('super-admin.labs.verify-payment', verifyingLab.id), {
            onSuccess: () => {
                setVerifyingLab(null);
                reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-indigo-500" />
                Super Admin Dashboard
            </h2>}
        >
            <Head title="Super Admin Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={<Building2 />} label="Total Laboratories" value={stats.total_labs} color="indigo" />
                        <StatCard icon={<CheckCircle2 />} label="Active Labs" value={stats.active_labs} color="emerald" />
                        <StatCard icon={<Clock />} label="Pending Verification" value={stats.pending_labs} color="amber" />
                        <StatCard icon={<Users />} label="Total Platform Users" value={stats.total_users} color="blue" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Pending Approvals */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden border-t-4 border-amber-500">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-amber-500" />
                                            Pending Onboarding Payments
                                        </h3>
                                        <span className="bg-amber-100 text-amber-600 text-xs font-bold px-2 py-1 rounded-full">
                                            {pendingLabs.length} Action Required
                                        </span>
                                    </div>

                                    {pendingLabs.length > 0 ? (
                                        <div className="divide-y dark:divide-gray-700">
                                            {pendingLabs.map(lab => (
                                                <div key={lab.id} className="py-4 flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">{lab.name}</h4>
                                                        <p className="text-sm text-gray-500">{lab.email} • Registered {formatDate(lab.created_at)}</p>
                                                    </div>
                                                    <PrimaryButton onClick={() => setVerifyingLab(lab)} className="text-xs">
                                                        Verify Cash Payment
                                                    </PrimaryButton>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 py-4 italic">No pending payment verifications.</p>
                                    )}
                                </div>
                            </div>

                            {/* Recent Labs */}
                            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                                        <Microscope className="w-5 h-5 text-indigo-500" />
                                        Recently Added Laboratories
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b dark:border-gray-700">
                                                    <th className="py-3 px-2">Lab Name</th>
                                                    <th className="py-3 px-2">Status</th>
                                                    <th className="py-3 px-2 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recentLabs.map(lab => (
                                                    <tr key={lab.id} className="border-b dark:border-gray-700 last:border-0">
                                                        <td className="py-3 px-2 font-medium">{lab.name}</td>
                                                        <td className="py-3 px-2">
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${lab.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                                                                {lab.subscription_status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-2 text-right">
                                                            <Link href={route('super-admin.labs.index')} className="text-indigo-500 hover:text-indigo-600">
                                                                Manage
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links / Resource Access */}
                        <div className="space-y-6">
                            <div className="bg-indigo-600 rounded-lg p-6 text-white shadow-lg overflow-hidden relative">
                                <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
                                <h3 className="text-lg font-bold mb-2">Management Tools</h3>
                                <div className="space-y-2 relative z-10">
                                    <Link href={route('super-admin.labs.index')} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded transition group">
                                        <span>Manage All Labs</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                                    </Link>
                                    <Link href={route('super-admin.access-keys.index')} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded transition group">
                                        <span>Generate Access Keys</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Modal */}
            <Modal show={!!verifyingLab} onClose={() => setVerifyingLab(null)}>
                <form onSubmit={handleVerify} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Verify Cash Payment for {verifyingLab?.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Please specify the duration of the subscription once payment is confirmed.
                    </p>

                    <div className="mt-6">
                        <InputLabel htmlFor="duration_months" value="Subscription Duration (Months)" />
                        <select
                            id="duration_months"
                            value={data.duration_months}
                            onChange={(e) => setData('duration_months', parseInt(e.target.value))}
                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                        >
                            <option value={1}>1 Month</option>
                            <option value={3}>3 Months</option>
                            <option value={6}>6 Months</option>
                            <option value={12}>1 Year</option>
                            <option value={24}>2 Years</option>
                        </select>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={() => setVerifyingLab(null)}>
                            Cancel
                        </SecondaryButton>

                        <PrimaryButton className="ml-3" disabled={processing}>
                            Confirm Payment & Activate
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    const colorClasses: Record<string, string> = {
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                </div>
            </div>
        </div>
    );
}
