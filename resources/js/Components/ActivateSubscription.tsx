import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Key, ShieldCheck } from 'lucide-react';

export default function ActivateSubscription() {
    const { data, setData, post, processing, errors, reset } = useForm({
        access_key: '',
    });

    const [showForm, setShowForm] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('subscription.activate'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
            }
        });
    };

    return (
        <div className="mt-4">
            {!showForm ? (
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                >
                    <Key className="w-4 h-4" />
                    Activate Subscription / Extend License
                </button>
            ) : (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Subscription Activation
                    </h4>
                    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <TextInput
                                className="w-full text-sm font-mono"
                                placeholder="LAB-XXXX-XXXX-XXXX"
                                value={data.access_key}
                                onChange={(e) => setData('access_key', e.target.value)}
                                required
                            />
                            <InputError message={errors.access_key} className="mt-1" />
                        </div>
                        <div className="flex gap-2">
                            <PrimaryButton disabled={processing} className="whitespace-nowrap">
                                Activate Key
                            </PrimaryButton>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="text-gray-500 hover:text-gray-700 text-sm px-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                    <p className="mt-2 text-[10px] text-indigo-600 dark:text-indigo-400">
                        Enter a valid access key to extend your laboratory's license duration.
                    </p>
                </div>
            )}
        </div>
    );
}
