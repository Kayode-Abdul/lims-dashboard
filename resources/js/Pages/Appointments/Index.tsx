import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    Plus,
    Search,
    Calendar,
    Clock,
    User,
    Phone,
    MapPin,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    AlertCircle,
    FlaskConical,
    UserPlus
} from 'lucide-react';
import { useState, FormEventHandler, useEffect } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { formatDate } from '@/Utils/dateUtils';

interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    patient_id: string;
}

interface Test {
    id: number;
    test_name: string;
    test_code: string;
}

interface Appointment {
    id: number;
    patient_id: number;
    test_id: number | null;
    appointment_type: string;
    doctor_name: string | null;
    department: string | null;
    scheduled_at: string;
    duration: number;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
    notes: string | null;
    patient: Patient;
    test: Test | null;
}

interface PaginatedAppointments {
    data: Appointment[];
    links: any[];
    current_page: number;
    last_page: number;
    total: number;
}

export default function Index({ auth, appointments, patients, tests, filters }: PageProps<{
    appointments: PaginatedAppointments,
    patients: Patient[],
    tests: Test[],
    filters: { search?: string, status?: string, date?: string }
}>) {
    const [viewMode, setViewMode] = useState<'list' | 'split'>('split');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQuickPatientModal, setShowQuickPatientModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [localPatients, setLocalPatients] = useState<Patient[]>(patients);

    useEffect(() => {
        setLocalPatients(patients);
    }, [patients]);

    const { data, setData, post, patch, processing, errors, reset, transform } = useForm({
        id: null as number | null,
        patient_id: '' as string | number,
        test_id: '' as string | number,
        appointment_type: 'Lab Test',
        doctor_name: '',
        department: 'Laboratory',
        scheduled_date: '',
        scheduled_time: '',
        duration: 30,
        status: 'scheduled',
        notes: '',
    });

    const appointmentTypes = ['Lab Test', 'X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Consultation', 'Follow-up'];
    const departments = ['Laboratory', 'Radiology', 'Imaging', 'Cardiology', 'Pathology', 'Emergency'];

    const quickPatientForm = useForm({
        patient_type: 'walk-in',
        first_name: '',
        last_name: '',
        phone: '',
        sex: 'Male',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        transform((data) => ({
            ...data,
            scheduled_at: `${data.scheduled_date} ${data.scheduled_time}`
        }));

        const options = {
            onSuccess: () => {
                setShowAddModal(false);
                setIsEditing(false);
                reset();
            }
        };

        if (isEditing && data.id) {
            patch(route('appointments.update', data.id), options);
        } else {
            post(route('appointments.store'), options);
        }
    };

    const [justRegisteredPatient, setJustRegisteredPatient] = useState(false);

    useEffect(() => {
        if (justRegisteredPatient && localPatients.length > 0) {
            // Find the patient with the highest ID (most likely the new one)
            const latestPatient = [...localPatients].sort((a, b) => b.id - a.id)[0];
            if (latestPatient) {
                setData('patient_id', latestPatient.id);
            }
            setJustRegisteredPatient(false);
        }
    }, [localPatients]);

    const submitQuickPatient: FormEventHandler = (e) => {
        e.preventDefault();
        quickPatientForm.post(route('patients.store'), {
            onSuccess: () => {
                setShowQuickPatientModal(false);
                quickPatientForm.reset();
                setJustRegisteredPatient(true);
            },
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleEdit = (appointment: Appointment) => {
        const scheduledDate = new Date(appointment.scheduled_at);
        setIsEditing(true);
        setData({
            id: appointment.id,
            patient_id: appointment.patient_id,
            test_id: appointment.test_id || '',
            appointment_type: appointment.appointment_type,
            doctor_name: appointment.doctor_name || '',
            department: appointment.department || 'Laboratory',
            scheduled_date: scheduledDate.toISOString().split('T')[0],
            scheduled_time: scheduledDate.toTimeString().split(' ')[0].substring(0, 5),
            duration: appointment.duration,
            status: appointment.status,
            notes: appointment.notes || '',
        });
        setShowAddModal(true);
    };

    const handleUpdateStatus = (appointment: Appointment, newStatus: string) => {
        router.patch(route('appointments.update', appointment.id), {
            status: newStatus,
            patient_id: appointment.patient_id,
            appointment_type: appointment.appointment_type,
            scheduled_at: appointment.scheduled_at,
            duration: appointment.duration,
        }, {
            preserveScroll: true
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to cancel and remove this appointment?')) {
            router.delete(route('appointments.destroy', id));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'no-show': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'completed': return <CheckCircle className="h-4 w-4 text-purple-600" />;
            case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
            case 'no-show': return <AlertCircle className="h-4 w-4 text-orange-600" />;
            default: return <Clock className="h-4 w-4 text-blue-600" />;
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Appointments</h2>}
        >
            <Head title="Appointments" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Header Actions */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="flex rounded-md shadow-sm">
                                <button
                                    onClick={() => setViewMode('split')}
                                    className={`px-3 py-2 text-sm font-medium rounded-l-md border ${viewMode === 'split'
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    Split View
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-2 text-sm font-medium rounded-r-md border-l-0 border ${viewMode === 'list'
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    List View
                                </button>
                            </div>
                        </div>
                        <PrimaryButton onClick={() => { setIsEditing(false); reset(); setShowAddModal(true); }}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Appointment
                        </PrimaryButton>
                    </div>

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex flex-wrap gap-4">
                            <div className="relative flex-1 min-w-[300px]">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <TextInput
                                    placeholder="Search by patient, ID, or test..."
                                    className="pl-10 block w-full"
                                    value={filters.search}
                                    onChange={(e) => router.get(route('appointments.index'), { ...filters, search: e.target.value }, { preserveState: true })}
                                />
                            </div>
                            <select
                                className="border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm text-sm"
                                value={filters.status || 'all'}
                                onChange={(e) => router.get(route('appointments.index'), { ...filters, status: e.target.value }, { preserveState: true })}
                            >
                                <option value="all">All Status</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="no-show">No Show</option>
                            </select>
                            <TextInput
                                type="date"
                                className="w-40"
                                value={filters.date}
                                onChange={(e) => router.get(route('appointments.index'), { ...filters, date: e.target.value }, { preserveState: true })}
                            />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className={viewMode === 'split' ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "space-y-4"}>
                        <div className={viewMode === 'split' ? "lg:col-span-2" : ""}>
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="space-y-4">
                                    {appointments.data.length > 0 ? (
                                        appointments.data.map((appointment) => (
                                            <div
                                                key={appointment.id}
                                                onClick={() => setSelectedAppointment(appointment)}
                                                className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedAppointment?.id === appointment.id
                                                    ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-800'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-800'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`p-2 rounded-full ${getStatusColor(appointment.status)}`}>
                                                            {getStatusIcon(appointment.status)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-gray-900 dark:text-gray-100 italic">
                                                                    {appointment.patient.first_name} {appointment.patient.last_name}
                                                                </span>
                                                                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                                                                    {appointment.patient.patient_id}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                                <FlaskConical className="h-3.5 w-3.5" />
                                                                {appointment.appointment_type}
                                                                {appointment.test && <span className="font-medium"> - {appointment.test.test_name}</span>}
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                                <div className="flex items-center">
                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                    {formatDate(appointment.scheduled_at)}
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    {new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <User className="h-3 w-3 mr-1" />
                                                                    {appointment.doctor_name || 'No doctor assigned'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(appointment.status)}`}>
                                                            {appointment.status}
                                                        </span>
                                                        <div className="flex gap-2 mt-4">
                                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(appointment); }} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(appointment.id); }} className="text-gray-400 hover:text-red-500">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500">No appointments found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {viewMode === 'split' && (
                            <div className="lg:col-span-1">
                                {selectedAppointment ? (
                                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6 sticky top-6">
                                        <div className="space-y-6">
                                            <div className="text-center pb-6 border-b dark:border-gray-700">
                                                <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <User className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                                    {selectedAppointment.patient.first_name} {selectedAppointment.patient.last_name}
                                                </h3>
                                                <p className="text-sm text-indigo-600 font-mono italic">{selectedAppointment.patient.patient_id}</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Appointment Type</label>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedAppointment.appointment_type}</p>
                                                </div>
                                                {selectedAppointment.test && (
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Service/Test</label>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedAppointment.test.test_name}</p>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Doctor</label>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedAppointment.doctor_name || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Department</label>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedAppointment.department || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Scheduled Time</label>
                                                    <div className="flex items-center text-sm font-medium text-gray-800 dark:text-gray-200">
                                                        <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                                                        {new Date(selectedAppointment.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                        <span className="ml-2 text-gray-400">({selectedAppointment.duration} min)</span>
                                                    </div>
                                                </div>
                                                {selectedAppointment.notes && (
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Notes</label>
                                                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded border border-yellow-100 dark:border-yellow-900/30">
                                                            <p className="text-xs text-yellow-800 dark:text-yellow-400 leading-relaxed italic">"{selectedAppointment.notes}"</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-6 border-t dark:border-gray-700 space-y-3">
                                                {selectedAppointment.status === 'scheduled' && (
                                                    <PrimaryButton className="w-full justify-center" onClick={() => handleUpdateStatus(selectedAppointment, 'confirmed')}>
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Confirm Appointment
                                                    </PrimaryButton>
                                                )}
                                                {selectedAppointment.status === 'confirmed' && (
                                                    <PrimaryButton className="w-full justify-center bg-purple-600 hover:bg-purple-700" onClick={() => handleUpdateStatus(selectedAppointment, 'completed')}>
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Mark as Completed
                                                    </PrimaryButton>
                                                )}
                                                <button onClick={() => handleDelete(selectedAppointment.id)} className="w-full py-2 px-4 border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                    Cancel Appointment
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 italic">Select an appointment to see details</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-indigo-600">
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {isEditing ? 'Edit Appointment' : 'Schedule Appointment'}
                                </h3>
                                <p className="text-indigo-100 text-xs mt-1">Fill in the details for the patient's visit</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="patient_id" value="Patient *" />
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <select
                                                id="patient_id"
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                value={data.patient_id}
                                                onChange={(e) => setData('patient_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Patient</option>
                                                {localPatients.map(patient => (
                                                    <option key={patient.id} value={patient.id}>
                                                        {patient.first_name} {patient.last_name} ({patient.patient_id})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowQuickPatientModal(true)}
                                            className="mt-1 p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-md hover:bg-indigo-100 transition-colors"
                                            title="Register New Patient"
                                        >
                                            <UserPlus className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <InputError message={errors.patient_id} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="test_id" value="Service/Test" />
                                    <select
                                        id="test_id"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        value={data.test_id}
                                        onChange={(e) => setData('test_id', e.target.value)}
                                    >
                                        <option value="">Select Service (Optional)</option>
                                        {tests.map(test => (
                                            <option key={test.id} value={test.id}>
                                                {test.test_name} ({test.test_code})
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.test_id} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel htmlFor="appointment_type" value="Appointment Type *" />
                                    <select
                                        id="appointment_type"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        value={data.appointment_type}
                                        onChange={(e) => setData('appointment_type', e.target.value)}
                                        required
                                    >
                                        {appointmentTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.appointment_type} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="department" value="Department" />
                                    <select
                                        id="department"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        value={data.department}
                                        onChange={(e) => setData('department', e.target.value)}
                                    >
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.department} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <InputLabel htmlFor="scheduled_date" value="Date *" />
                                    <TextInput
                                        id="scheduled_date"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={data.scheduled_date}
                                        onChange={(e) => setData('scheduled_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.scheduled_date} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="scheduled_time" value="Time *" />
                                    <TextInput
                                        id="scheduled_time"
                                        type="time"
                                        className="mt-1 block w-full"
                                        value={data.scheduled_time}
                                        onChange={(e) => setData('scheduled_time', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.scheduled_time} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="duration" value="Duration (min)" />
                                    <TextInput
                                        id="duration"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={data.duration}
                                        onChange={(e) => setData('duration', parseInt(e.target.value))}
                                    />
                                    <InputError message={errors.duration} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="doctor_name" value="Doctor Name" />
                                <TextInput
                                    id="doctor_name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.doctor_name}
                                    onChange={(e) => setData('doctor_name', e.target.value)}
                                    placeholder="e.g. Dr. John Smith"
                                />
                                <InputError message={errors.doctor_name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="notes" value="Notes/Special Instructions" />
                                <textarea
                                    id="notes"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                    rows={3}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Add any specific instructions for the patient or provider..."
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500"
                                >
                                    Cancel
                                </button>
                                <PrimaryButton disabled={processing}>
                                    {isEditing ? 'Update Appointment' : 'Schedule Appointment'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick Patient Registration Modal */}
            {showQuickPatientModal && (
                <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-indigo-700">
                            <div>
                                <h3 className="text-lg font-bold text-white">Quick Register Patient</h3>
                                <p className="text-indigo-100 text-[10px] mt-0.5">Basic info needed for appointment</p>
                            </div>
                            <button onClick={() => setShowQuickPatientModal(false)} className="text-white/60 hover:text-white">
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={submitQuickPatient} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="q_first_name" value="First Name *" />
                                    <TextInput
                                        id="q_first_name"
                                        type="text"
                                        className="mt-1 block w-full text-sm"
                                        value={quickPatientForm.data.first_name}
                                        onChange={(e) => quickPatientForm.setData('first_name', e.target.value)}
                                        required
                                        isFocused
                                    />
                                    <InputError message={quickPatientForm.errors.first_name} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="q_last_name" value="Last Name *" />
                                    <TextInput
                                        id="q_last_name"
                                        type="text"
                                        className="mt-1 block w-full text-sm"
                                        value={quickPatientForm.data.last_name}
                                        onChange={(e) => quickPatientForm.setData('last_name', e.target.value)}
                                        required
                                    />
                                    <InputError message={quickPatientForm.errors.last_name} className="mt-1" />
                                </div>
                            </div>
                            <div>
                                <InputLabel htmlFor="q_phone" value="Phone Number" />
                                <TextInput
                                    id="q_phone"
                                    type="text"
                                    className="mt-1 block w-full text-sm"
                                    value={quickPatientForm.data.phone}
                                    onChange={(e) => quickPatientForm.setData('phone', e.target.value)}
                                    placeholder="e.g. 08012345678"
                                />
                                <InputError message={quickPatientForm.errors.phone} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="q_sex" value="Gender" />
                                <select
                                    id="q_sex"
                                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm text-sm"
                                    value={quickPatientForm.data.sex}
                                    onChange={(e) => quickPatientForm.setData('sex', e.target.value)}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                <InputError message={quickPatientForm.errors.sex} className="mt-1" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowQuickPatientModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500"
                                >
                                    Cancel
                                </button>
                                <PrimaryButton disabled={quickPatientForm.processing} className="text-sm">
                                    {quickPatientForm.processing ? 'Registering...' : 'Register & Select'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
