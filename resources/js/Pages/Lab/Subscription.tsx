import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { ShieldCheck, CreditCard, Banknote, Calendar, AlertCircle } from 'lucide-react';
import ActivateSubscription from '@/Components/ActivateSubscription';
import { formatDate } from '@/Utils/dateUtils';

interface Lab {
    id: number;
    name: string;
    subscription_status: 'pending' | 'active' | 'expired';
    is_active: boolean;
    expires_at: string | null;
}

export default function Subscription({ auth, lab }: PageProps<{ lab: Lab }>) {
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        payment_method: 'cash',
    });

    const requestVerification = (e: React.FormEvent) => {
        e.preventDefault();
        // Placeholder for cash verification request
        // post(route('subscription.request-verification'));
    };

    const isPending = lab.subscription_status === 'pending';
    const isActive = lab.is_active && lab.subscription_status === 'active';
    const isExpired = !lab.is_active && lab.expires_at;

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Laboratory Subscription</h2>}
        >
            <Head title="Subscription" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Status Card */}
                    <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden border-t-4 border-indigo-500">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                        <ShieldCheck className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                                            {lab.name}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Status: <span className={`font-semibold ${isActive ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {isActive ? 'Active' : (isPending ? 'Pending Verification' : 'Expired')}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Calendar className="w-5 h-5" />
                                        <span>Expiry Date</span>
                                    </div>
                                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                        {lab.expires_at ? formatDate(lab.expires_at) : 'No Active Plan'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Option 1: Access Key */}
                        <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                                <CreditCard className="w-5 h-5 text-indigo-500" />
                                Activate with License Key
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                If you have purchased a license key from an authorized distributor, enter it below to activate your account instantly.
                            </p>
                            <ActivateSubscription />
                        </div>

                        {/* Option 2: Cash Payment */}
                        <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                                    <Banknote className="w-5 h-5 text-emerald-500" />
                                    Request Cash Verification
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    Paid in cash? Request a super administrator to verify your payment and activate your laboratory account manually.
                                </p>
                            </div>

                            {isPending ? (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-md">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-amber-700 dark:text-amber-400">
                                            Your request for verification is currently <strong>Pending</strong>. You will be notified once a super admin approves your account.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <PrimaryButton
                                    onClick={() => {/* Logic for requesting verification */ }}
                                    className="w-full justify-center bg-emerald-600 hover:bg-emerald-700"
                                >
                                    Request Verification
                                </PrimaryButton>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
