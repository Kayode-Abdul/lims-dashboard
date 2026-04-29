import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { FormEventHandler, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm({
        // Lab Details
        lab_name: '',
        lab_email: '',
        lab_address: '',
        lab_phone: '',

        // Admin User Details
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('super-admin.labs.store'));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Create New Laboratory</h2>}
        >
            <Head title="Create Laboratory" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <form onSubmit={submit} className="space-y-6">

                                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Laboratory Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel htmlFor="lab_name" value="Laboratory Name" />
                                            <TextInput
                                                id="lab_name"
                                                name="lab_name"
                                                value={data.lab_name}
                                                className="mt-1 block w-full"
                                                autoComplete="organization"
                                                isFocused={true}
                                                onChange={(e) => setData('lab_name', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.lab_name} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="lab_email" value="Laboratory Email" />
                                            <TextInput
                                                id="lab_email"
                                                type="email"
                                                name="lab_email"
                                                value={data.lab_email}
                                                className="mt-1 block w-full"
                                                onChange={(e) => setData('lab_email', e.target.value)}
                                            />
                                            <InputError message={errors.lab_email} className="mt-2" />
                                        </div>

                                        <div className="md:col-span-2">
                                            <InputLabel htmlFor="lab_address" value="Address" />
                                            <TextInput
                                                id="lab_address"
                                                name="lab_address"
                                                value={data.lab_address}
                                                className="mt-1 block w-full"
                                                onChange={(e) => setData('lab_address', e.target.value)}
                                            />
                                            <InputError message={errors.lab_address} className="mt-2" />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Administrator Account</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel htmlFor="first_name" value="First Name" />
                                            <TextInput
                                                id="first_name"
                                                name="first_name"
                                                value={data.first_name}
                                                className="mt-1 block w-full"
                                                autoComplete="given-name"
                                                onChange={(e) => setData('first_name', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.first_name} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="last_name" value="Last Name" />
                                            <TextInput
                                                id="last_name"
                                                name="last_name"
                                                value={data.last_name}
                                                className="mt-1 block w-full"
                                                autoComplete="family-name"
                                                onChange={(e) => setData('last_name', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.last_name} className="mt-2" />
                                        </div>

                                        <div className="md:col-span-2">
                                            <InputLabel htmlFor="email" value="Email Address (Login)" />
                                            <TextInput
                                                id="email"
                                                type="email"
                                                name="email"
                                                value={data.email}
                                                className="mt-1 block w-full"
                                                autoComplete="username"
                                                onChange={(e) => setData('email', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.email} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="password" value="Password" />
                                            <div className="relative">
                                                <TextInput
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    name="password"
                                                    value={data.password}
                                                    className="mt-1 block w-full pr-10"
                                                    autoComplete="new-password"
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                            <InputError message={errors.password} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                                            <div className="relative">
                                                <TextInput
                                                    id="password_confirmation"
                                                    type={showPassword ? "text" : "password"}
                                                    name="password_confirmation"
                                                    value={data.password_confirmation}
                                                    className="mt-1 block w-full pr-10"
                                                    autoComplete="new-password"
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                            <InputError message={errors.password_confirmation} className="mt-2" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-4">
                                    <Link
                                        href={route('super-admin.labs.index')}
                                        className="underline text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                                    >
                                        Cancel
                                    </Link>
                                    <PrimaryButton className="ml-4" disabled={processing}>
                                        Create Laboratory
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
