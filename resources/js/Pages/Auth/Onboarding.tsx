import { useEffect, FormEventHandler, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, UserCircle, ShieldCheck, Mail, Phone, MapPin, Eye, EyeOff } from 'lucide-react';

export default function Onboarding() {
    const { data, setData, post, processing, errors, reset } = useForm({
        lab_name: '',
        lab_email: '',
        lab_phone: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation');
        };
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('onboarding'));
    };

    return (
        <GuestLayout>
            <Head title="Laboratory Onboarding" />

            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 italic">Welcome to LIMS</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Register your laboratory and create your administrator account.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-8">
                {/* Laboratory Details */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                        <Building2 className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Laboratory Information</h2>
                    </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="lab_email" value="Official Lab Email" />
                            <TextInput
                                id="lab_email"
                                type="email"
                                name="lab_email"
                                value={data.lab_email}
                                className="mt-1 block w-full"
                                autoComplete="email"
                                onChange={(e) => setData('lab_email', e.target.value)}
                                required
                            />
                            <InputError message={errors.lab_email} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="lab_phone" value="Official Lab Phone" />
                            <TextInput
                                id="lab_phone"
                                type="text"
                                name="lab_phone"
                                value={data.lab_phone}
                                className="mt-1 block w-full"
                                autoComplete="tel"
                                onChange={(e) => setData('lab_phone', e.target.value)}
                            />
                            <InputError message={errors.lab_phone} className="mt-2" />
                        </div>
                    </div>
                </div>

                {/* Admin Details */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                        <UserCircle className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Administrator Account</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Personal Email" />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="flex items-center justify-between pt-4">
                    <Link
                        href={route('login')}
                        className="text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton disabled={processing}>
                        Complete Onboarding
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
