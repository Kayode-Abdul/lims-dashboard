import { useRef } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { PageProps } from '@/types';

export default function UpdateLabLogoForm({ className = '' }: { className?: string }) {
    const user = usePage<PageProps>().props.auth.user;
    const lab = user.lab;
    const logoInput = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        logo: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Inertia's useForm post supports file uploads
        // We use post here, but we can also use 'patch' if we mock it with _method
        post(route('profile.lab-logo.update'), {
            forceFormData: true,
            onSuccess: () => {
                if (logoInput.current) {
                    logoInput.current.value = '';
                }
            },
        });
    };

    if (user.role !== 'admin' && !user.is_super_admin) {
        return null;
    }

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Laboratory Branding</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Update your laboratory's logo. This will be displayed across the application for all your staff.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="logo" value="Laboratory Logo" />

                    {lab?.logo_url && (
                        <div className="mt-2 mb-4">
                            <p className="text-xs text-gray-500 mb-2">Current Logo:</p>
                            <img src={lab.logo_url} alt="Lab Logo" className="h-16 w-auto object-contain border rounded p-1 bg-white" />
                        </div>
                    )}

                    <input
                        type="file"
                        id="logo"
                        ref={logoInput}
                        className="mt-1 block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100"
                        onChange={(e) => setData('logo', e.target.files?.[0] || null)}
                        accept="image/*"
                    />

                    <InputError message={errors.logo} className="mt-2" />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save Logo</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
