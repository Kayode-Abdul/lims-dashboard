import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { Building2, Save } from 'lucide-react';

interface Lab {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    header_url?: string;
    footer_url?: string;
    sync_url: string | null;
    currency: string | null;
    pdf_margin_top: string;
    web_margin_top: string;
}

export default function Settings({ auth, lab, status }: PageProps<{ lab: Lab; status?: string }>) {
    if (!lab) {
        return (
            <AuthenticatedLayout
                header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Laboratory Profile</h2>}
            >
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white dark:bg-gray-800 p-6 shadow sm:rounded-lg text-center">
                            <p className="text-gray-600 dark:text-gray-400 font-medium">No laboratory settings found for your account.</p>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        _method: 'patch',
        name: lab.name,
        email: lab.email || '',
        phone: lab.phone || '',
        address: lab.address || '',
        currency: lab.currency || '₦',
        sync_url: lab.sync_url || '',
        pdf_margin_top: lab.pdf_margin_top || '1.20',
        web_margin_top: lab.web_margin_top || '1.80',
        header_image: null as File | null,
        footer_image: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        // Use post with _method: 'patch' for file uploads in Inertia
        post(route('lab.settings.update'), {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Laboratory Profile</h2>}
        >
            <Head title="Lab Settings" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <section className="max-w-xl">
                            <header>
                                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-indigo-500" />
                                    Laboratory Information
                                </h2>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Update your laboratory's public identity and contact details.
                                </p>
                            </header>

                            <form onSubmit={submit} className="mt-6 space-y-6">
                                <div>
                                    <InputLabel htmlFor="name" value="Laboratory Name" />
                                    <TextInput
                                        id="name"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        isFocused
                                        autoComplete="name"
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value="Official Email" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        autoComplete="email"
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="phone" value="Contact Phone" />
                                    <TextInput
                                        id="phone"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        autoComplete="tel"
                                    />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="address" value="Physical Address" />
                                    <textarea
                                        id="address"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        rows={3}
                                    />
                                    <InputError message={errors.address} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="currency" value="Lab Currency" />
                                    <select
                                        id="currency"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        value={data.currency}
                                        onChange={(e) => setData('currency', e.target.value)}
                                    >
                                        <option value="₦">Naira (₦)</option>
                                        <option value="$">US Dollar ($)</option>
                                        <option value="£">British Pound (£)</option>
                                        <option value="€">Euro (€)</option>
                                        <option value="GHS">Ghanaian Cedi (GHS)</option>
                                        <option value="KES">Kenyan Shilling (KES)</option>
                                        <option value="ZAR">South African Rand (ZAR)</option>
                                        <option value="CFA">CFA Franc (CFA)</option>
                                        <option value="RWF">Rwandan Franc (RWF)</option>
                                        <option value="UGX">Ugandan Shilling (UGX)</option>
                                        <option value="TZS">Tanzanian Shilling (TZS)</option>
                                        <option value="₹">Indian Rupee (₹)</option>
                                        <option value="CAD">Canadian Dollar (CAD)</option>
                                        <option value="AUD">Australian Dollar (AUD)</option>
                                    </select>
                                    <InputError message={errors.currency} className="mt-2" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="header_image" value="Result PDF Header Image" />
                                        <p className="text-xs text-gray-500 mb-2">Upload an image to appear at the top of test results (e.g., Logo & Info).</p>
                                        <input
                                            type="file"
                                            id="header_image"
                                            className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-indigo-50 file:text-indigo-700
                                                hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300"
                                            onChange={(e) => setData('header_image', e.target.files ? e.target.files[0] : null)}
                                            accept="image/*"
                                        />
                                        <InputError message={errors.header_image} className="mt-2" />
                                        {lab.header_url && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-400 mb-1">Current Header:</p>
                                                <img src={lab.header_url} alt="Header" className="h-16 object-contain border rounded" />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="footer_image" value="Result PDF Footer Image" />
                                        <p className="text-xs text-gray-500 mb-2">Upload an image to appear at the bottom of test results.</p>
                                        <input
                                            type="file"
                                            id="footer_image"
                                            className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-indigo-50 file:text-indigo-700
                                                hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300"
                                            onChange={(e) => setData('footer_image', e.target.files ? e.target.files[0] : null)}
                                            accept="image/*"
                                        />
                                        <InputError message={errors.footer_image} className="mt-2" />
                                        {lab.footer_url && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-400 mb-1">Current Footer:</p>
                                                <img src={lab.footer_url} alt="Footer" className="h-16 object-contain border rounded" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="col-span-full">
                                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest mb-1">Header Spacing (Adjustment)</h3>
                                        <p className="text-xs text-gray-500 mb-3">Adjust the space at the top of results if your pre-printed header is taller or shorter than average.</p>
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="pdf_margin_top" value="PDF Margin Top (Inches)" />
                                        <TextInput
                                            id="pdf_margin_top"
                                            type="number"
                                            step="0.05"
                                            className="mt-1 block w-full"
                                            value={data.pdf_margin_top}
                                            onChange={(e) => setData('pdf_margin_top', e.target.value)}
                                        />
                                        <p className="mt-1 text-[10px] text-gray-500 italic">Default: 1.20 | Recommended: 1.0 - 1.5</p>
                                        <InputError message={errors.pdf_margin_top} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="web_margin_top" value="Web Print Top (CM)" />
                                        <TextInput
                                            id="web_margin_top"
                                            type="number"
                                            step="0.05"
                                            className="mt-1 block w-full"
                                            value={data.web_margin_top}
                                            onChange={(e) => setData('web_margin_top', e.target.value)}
                                        />
                                        <p className="mt-1 text-[10px] text-gray-500 italic">Default: 1.80 | Recommended: 1.5 - 2.5</p>
                                        <InputError message={errors.web_margin_top} className="mt-2" />
                                    </div>
                                </div>

                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                    <InputLabel htmlFor="sync_url" value="Live Server Sync URL" />
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
                                        The cloud server address where your offline data is backed up.
                                        Format: <code>https://your-domain.com/api/sync</code>
                                    </p>
                                    <TextInput
                                        id="sync_url"
                                        type="url"
                                        className="mt-1 block w-full"
                                        value={data.sync_url}
                                        onChange={(e) => setData('sync_url', e.target.value)}
                                        placeholder="https://example.com/api/sync"
                                    />
                                    <InputError message={errors.sync_url} className="mt-2" />
                                </div>

                                <div className="flex items-center gap-4">
                                    <PrimaryButton disabled={processing}>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </PrimaryButton>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Saved Successfully.</p>
                                    </Transition>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
