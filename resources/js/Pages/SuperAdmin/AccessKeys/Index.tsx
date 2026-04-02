import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Key, Copy, Check, Clock, ShieldCheck } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface AccessKey {
    id: number;
    key: string;
    duration_days: number;
    is_activated: boolean;
    activated_at: string | null;
    expires_at: string | null;
    lab?: { name: string };
}

interface PaginatedKeys {
    data: AccessKey[];
    links: any[];
    total: number;
}

export default function Index({ auth, keys }: PageProps<{ keys: PaginatedKeys }>) {
    const { data, setData, post, processing, errors, reset } = useForm({
        duration_days: 30,
        count: 1,
    });

    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('super-admin.access-keys.store'), {
            onSuccess: () => reset()
        });
    };

    const copyToClipboard = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Access Key Management</h2>}
        >
            <Head title="Access Keys" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 mb-6 border-l-4 border-indigo-500">
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Key className="w-5 h-5 text-indigo-500" />
                            Generate Bulk Access Keys
                        </h3>
                        <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
                            <div>
                                <InputLabel htmlFor="duration_days" value="Duration (Days)" />
                                <TextInput id="duration_days" type="number" className="mt-1 block w-40" value={data.duration_days} onChange={(e) => setData('duration_days', parseInt(e.target.value))} required />
                                <InputError message={errors.duration_days} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="count" value="Quantity" />
                                <TextInput id="count" type="number" className="mt-1 block w-32" value={data.count} onChange={(e) => setData('count', parseInt(e.target.value))} required />
                                <InputError message={errors.count} className="mt-2" />
                            </div>
                            <PrimaryButton disabled={processing} className="h-10">
                                Generate Keys
                            </PrimaryButton>
                        </form>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                            Available & Activated Keys
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Key</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Lab</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {keys.data.map((key) => (
                                        <tr key={key.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className={key.is_activated ? 'text-gray-400' : 'text-indigo-600 font-bold'}>{key.key}</span>
                                                    <button onClick={() => copyToClipboard(key.key)} className="text-gray-400 hover:text-gray-600">
                                                        {copiedKey === key.key ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    {key.duration_days} Days
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {key.is_activated ? (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center w-fit gap-1">
                                                        <ShieldCheck className="w-3 h-3" /> Activated
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Available</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {key.lab?.name || '---'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
