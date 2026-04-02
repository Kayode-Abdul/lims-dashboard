import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Building2, User } from 'lucide-react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        lab_name: '',
        lab_email: '',
        lab_address: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register New Laboratory" />

            <form onSubmit={submit}>
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center mb-4">
                        <Building2 className="w-5 h-5 mr-2 text-indigo-500" />
                        Laboratory Details
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="lab_name" value="Laboratory Name *" />
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
                            <InputLabel htmlFor="lab_email" value="Laboratory Email (Optional)" />
                            <TextInput
                                id="lab_email"
                                name="lab_email"
                                type="email"
                                value={data.lab_email}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('lab_email', e.target.value)}
                            />
                            <InputError message={errors.lab_email} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="lab_address" value="Laboratory Address (Optional)" />
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

                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center mb-4">
                        <User className="w-5 h-5 mr-2 text-green-500" />
                        Administrator Account
                    </h3>

                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <InputLabel htmlFor="first_name" value="First Name *" />
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
                        <div className="flex-1">
                            <InputLabel htmlFor="last_name" value="Last Name" />
                            <TextInput
                                id="last_name"
                                name="last_name"
                                value={data.last_name}
                                className="mt-1 block w-full"
                                autoComplete="family-name"
                                onChange={(e) => setData('last_name', e.target.value)}
                            />
                            <InputError message={errors.last_name} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="email" value="Email Address *" />
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

                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Password *" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="Confirm Password *"
                        />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            required
                        />
                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Register Lab
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
