import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import Toast from '@/Components/Toast';
import { PageProps } from '@/types';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    const [toast, setToast] = useState<{ message: string | null; type: 'success' | 'error' | 'info' }>({
        message: null,
        type: 'success',
    });

    useEffect(() => {
        if (flash.success) {
            setToast({ message: flash.success, type: 'success' });
        } else if (flash.error) {
            setToast({ message: flash.error, type: 'error' });
        } else if (flash.message) {
            setToast({ message: flash.message, type: 'info' });
        }
    }, [flash]);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <nav className="border-b border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center gap-4">
                                <Link href="/">
                                    {user.lab?.logo_url ? (
                                        <img src={user.lab.logo_url} alt={user.lab.name} className="block h-8 w-auto object-contain" />
                                    ) : (
                                        <ApplicationLogo className="block h-8 w-auto" />
                                    )}
                                </Link>

                                <div className="hidden sm:flex items-center">
                                    {user.labs && (user.labs.length > 1 || !user.lab) && user.labs.length > 0 ? (
                                        <Dropdown>
                                            <Dropdown.Trigger>
                                                <button className="flex items-center gap-1 px-3 py-1 text-sm font-bold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-indigo-500 transition-colors uppercase tracking-tight">
                                                    {user.lab?.name || 'Select Laboratory'}
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </Dropdown.Trigger>
                                            <Dropdown.Content align="left" width="60">
                                                <div className="p-2 text-xs font-semibold text-gray-400 uppercase">
                                                    {user.labs.length > 0 ? 'Your Laboratories' : 'No Laboratories'}
                                                </div>
                                                {user.labs.map((lab) => (
                                                    <Dropdown.Link
                                                        key={lab.id}
                                                        href={route('lab.switch', lab.id)}
                                                        method="post"
                                                        as="button"
                                                        className={`flex w-full items-center gap-2 text-left ${lab.id === user.lab_id ? 'bg-gray-100 dark:bg-gray-700 font-bold' : ''}`}
                                                    >
                                                        <Building2 className={`w-4 h-4 ${lab.id === user.lab_id ? 'text-indigo-500' : 'text-gray-400'}`} />
                                                        {lab.name}
                                                    </Dropdown.Link>
                                                ))}
                                            </Dropdown.Content>
                                        </Dropdown>
                                    ) : (
                                        <span className="text-gray-800 dark:text-gray-200 font-bold uppercase tracking-tight ml-2">
                                            {user.lab?.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex items-center">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Dashboard
                                </NavLink>

                                {/* Tests Dropdown */}
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className={`inline-flex items-center px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ${route().current('appointments.*') ||
                                            route().current('test-orders.*') ||
                                            route().current('test-results.*') ||
                                            route().current('samples.*') ||
                                            route().current('test-categories.*') ||
                                            route().current('tests.*')
                                            ? 'border-b-2 border-indigo-400 text-gray-900 dark:text-gray-100'
                                            : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-300'
                                            }`}>
                                            Tests
                                            <ChevronDown className="ml-1 h-4 w-4" />
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content align="left" width="56">
                                        <div className="p-2 text-xs font-semibold text-gray-400 uppercase">
                                            Workflow
                                        </div>
                                        <Dropdown.Link href={route('appointments.index')}>
                                            Appointments
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('test-orders.index')}>
                                            Orders
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('test-results.index')}>
                                            Results
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('patients.index')}>
                                            Patients
                                        </Dropdown.Link>
                                        <Dropdown.Link href={route('samples.index')}>
                                            Samples
                                        </Dropdown.Link>
                                        {(user.role === 'admin' || user.role === 'supervisor') && (
                                            <>
                                                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                                                <div className="p-2 text-xs font-semibold text-gray-400 uppercase">
                                                    Configuration
                                                </div>
                                                <Dropdown.Link href={route('test-categories.index')}>
                                                    Test Categories
                                                </Dropdown.Link>
                                                <Dropdown.Link href={route('tests.index')}>
                                                    Test Catalog
                                                </Dropdown.Link>
                                            </>
                                        )}
                                    </Dropdown.Content>
                                </Dropdown>

                                <NavLink
                                    href={route('payments.index')}
                                    active={route().current('payments.*')}
                                >
                                    Billing
                                </NavLink>
                                <NavLink
                                    href={route('accounting.index')}
                                    active={route().current('accounting.*')}
                                >
                                    Accounting
                                </NavLink>
                                {(user.role === 'admin' || user.role === 'supervisor' || user.role === 'lab_admin' || user.is_super_admin) && (
                                    <>
                                        {/* Referrals & HMOs Dropdown */}
                                        <Dropdown>
                                            <Dropdown.Trigger>
                                                <button className={`inline-flex items-center px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ${route().current('hospitals.*') ||
                                                    route().current('doctors.*') ||
                                                    route().current('hmos.*') ||
                                                    route().current('patient-classifications.*')
                                                    ? 'border-b-2 border-indigo-400 text-gray-900 dark:text-gray-100'
                                                    : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-300'
                                                    }`}>
                                                    Referrals & HMOs
                                                    <ChevronDown className="ml-1 h-4 w-4" />
                                                </button>
                                            </Dropdown.Trigger>
                                            <Dropdown.Content align="left" width="56">
                                                <div className="p-2 text-xs font-semibold text-gray-400 uppercase">
                                                    Entities
                                                </div>
                                                <Dropdown.Link href={route('hospitals.index')}>
                                                    Hospitals
                                                </Dropdown.Link>
                                                <Dropdown.Link href={route('doctors.index')}>
                                                    Doctors
                                                </Dropdown.Link>
                                                <Dropdown.Link href={route('hmos.index')}>
                                                    HMOs
                                                </Dropdown.Link>
                                                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                                                <div className="p-2 text-xs font-semibold text-gray-400 uppercase">
                                                    Settings
                                                </div>
                                                <Dropdown.Link href={route('patient-classifications.index')}>
                                                    Patient Classifications
                                                </Dropdown.Link>
                                            </Dropdown.Content>
                                        </Dropdown>

                                        <NavLink
                                            href={route('staff.index')}
                                            active={route().current('staff.*')}
                                        >
                                            Staff
                                        </NavLink>
                                        <NavLink
                                            href={route('audit-logs.index')}
                                            active={route().current('audit-logs.*')}
                                        >
                                            Audit Logs
                                        </NavLink>
                                        <NavLink
                                            href={route('lab.settings.edit')}
                                            active={route().current('lab.settings.*')}
                                        >
                                            Lab settings
                                        </NavLink>
                                    </>
                                )}

                                {user.is_super_admin && (
                                    <>
                                        <NavLink
                                            href={route('super-admin.labs.index')}
                                            active={route().current('super-admin.labs.*')}
                                        >
                                            Manage Labs
                                        </NavLink>
                                        <NavLink
                                            href={route('super-admin.access-keys.index')}
                                            active={route().current('super-admin.access-keys.*')}
                                        >
                                            Access Keys
                                        </NavLink>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                {user.first_name} {user.last_name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                        >
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none dark:text-gray-500 dark:hover:bg-gray-900 dark:hover:text-gray-400 dark:focus:bg-gray-900 dark:focus:text-gray-400"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                        >
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('test-orders.index')}
                            active={route().current('test-orders.*')}
                        >
                            Test Orders
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('patients.index')}
                            active={route().current('patients.*')}
                        >
                            Patients
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('accounting.index')}
                            active={route().current('accounting.*')}
                        >
                            Accounting
                        </ResponsiveNavLink>

                        {(user.role === 'admin' || user.role === 'supervisor' || user.role === 'lab_admin' || user.is_super_admin) && (
                            <>
                                <div className="pt-4 pb-1 border-t border-gray-200 dark:border-gray-600">
                                    <div className="px-4 text-xs font-semibold text-gray-400 uppercase">Management</div>
                                </div>
                                <ResponsiveNavLink href={route('hospitals.index')} active={route().current('hospitals.*')}>Hospitals</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('doctors.index')} active={route().current('doctors.*')}>Doctors</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('hmos.index')} active={route().current('hmos.*')}>HMOs</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('patient-classifications.index')} active={route().current('patient-classifications.*')}>Classifications</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('staff.index')} active={route().current('staff.*')}>Staff</ResponsiveNavLink>
                                <ResponsiveNavLink href={route('lab.settings.edit')} active={route().current('lab.settings.*')}>Lab Settings</ResponsiveNavLink>
                            </>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4 dark:border-gray-600">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                                {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm font-medium text-gray-500">
                                {user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow dark:bg-gray-800">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, message: null })}
            />
        </div>
    );
}
