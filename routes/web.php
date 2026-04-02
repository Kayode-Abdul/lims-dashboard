<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class , 'index'])
    ->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class , 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class , 'update'])->name('profile.update');
    Route::post('/profile/lab-logo', [ProfileController::class , 'updateLabLogo'])->name('profile.lab-logo.update');
    Route::delete('/profile', [ProfileController::class , 'destroy'])->name('profile.destroy');

    // Lab Settings & Switcher
    Route::get('/lab-settings', [\App\Http\Controllers\Lab\LabSettingsController::class , 'edit'])->name('lab.settings.edit');
    Route::patch('/lab-settings', [\App\Http\Controllers\Lab\LabSettingsController::class , 'update'])->name('lab.settings.update');
    Route::post('/lab-switch/{lab}', [\App\Http\Controllers\Lab\LabSwitcherController::class , 'switch'])->name('lab.switch');

    // Super Admin Routes
    Route::middleware('can:access-super-admin')->prefix('super-admin')->name('super-admin.')->group(function () {
            Route::get('/dashboard', [\App\Http\Controllers\SuperAdmin\DashboardController::class , 'index'])->name('dashboard');
            Route::resource('labs', \App\Http\Controllers\SuperAdmin\LabController::class);
            Route::resource('access-keys', \App\Http\Controllers\SuperAdmin\AccessKeyController::class);
            Route::post('labs/{lab}/verify-payment', [\App\Http\Controllers\SuperAdmin\DashboardController::class , 'verifyPayment'])->name('labs.verify-payment');
        }
        );

        // Laboratory Routes (Subscription Protected)
        Route::middleware('lab.subscription')->group(function () {
            Route::resource('patients', \App\Http\Controllers\PatientController::class);
            Route::resource('appointments', \App\Http\Controllers\AppointmentController::class);
            Route::resource('test-orders', \App\Http\Controllers\TestOrderController::class);
            Route::resource('test-results', \App\Http\Controllers\TestResultController::class);
            Route::resource('samples', \App\Http\Controllers\SpecimenController::class);
            Route::resource('payments', \App\Http\Controllers\PaymentController::class);
            Route::post('payments/batch', [\App\Http\Controllers\PaymentController::class , 'storeBatch'])->name('payments.store-batch');
            Route::post('test-results/{test_result}/verify', [\App\Http\Controllers\TestResultController::class , 'verify'])->name('test-results.verify');
            Route::get('test-results/{test_result}/pdf', [\App\Http\Controllers\TestResultController::class , 'downloadPdf'])->name('test-results.pdf');
            Route::get('test-results/{test_result}/zip', [\App\Http\Controllers\TestResultController::class , 'generateZip'])->name('test-results.zip');
            Route::post('test-results/{test_result}/email', [\App\Http\Controllers\TestResultController::class , 'email'])->name('test-results.email');
            Route::post('test-results/log-print', [\App\Http\Controllers\TestResultController::class , 'logPrint'])->name('test-results.log-print');

            // Staff Signature Upload (accessible by pathologists & admins)
            Route::post('staff/{staff}/signature', [\App\Http\Controllers\StaffController::class , 'updateSignature'])->name('staff.update-signature');

            // Test Order Status Updates
            Route::patch('test-orders/{testOrder}/status', [\App\Http\Controllers\TestOrderController::class , 'updateStatus'])->name('test-orders.update-status');
            Route::patch('test-orders/batch/{orderNumber}/status', [\App\Http\Controllers\TestOrderController::class , 'updateBatchStatus'])
                ->name('test-orders.update-batch-status');
            Route::get('test-orders/batch/{orderNumber}', [\App\Http\Controllers\TestOrderController::class , 'show'])
                ->name('test-orders.show-batch');
            Route::delete('test-orders/batch/{orderNumber}', [\App\Http\Controllers\TestOrderController::class , 'destroyBatch'])
                ->name('test-orders.destroy-batch');
            Route::get('test-orders/batch/{orderNumber}/edit', [\App\Http\Controllers\TestOrderController::class , 'edit'])
                ->name('test-orders.edit-batch');
            Route::put('test-orders/batch/{orderNumber}', [\App\Http\Controllers\TestOrderController::class , 'updateBatch'])
                ->name('test-orders.update-batch');

            Route::group([], function () {
                    Route::get('staff/check-email', [\App\Http\Controllers\StaffController::class , 'checkEmail'])->name('staff.check-email');
                    Route::resource('staff', \App\Http\Controllers\StaffController::class);
                    Route::resource('test-categories', \App\Http\Controllers\TestCategoryController::class)->except(['create', 'edit', 'show']);
                    Route::resource('tests', \App\Http\Controllers\TestController::class)->except(['create', 'edit', 'show']);
                    Route::post('tests/{test}/toggle-group', [\App\Http\Controllers\TestController::class , 'toggleGroup'])->name('tests.toggle-group');
                    Route::get('audit-logs', [\App\Http\Controllers\AuditLogController::class , 'index'])->name('audit-logs.index');

                    // Departments
                    Route::get('departments', [\App\Http\Controllers\DepartmentController::class , 'index'])->name('departments.index');
                    Route::post('departments', [\App\Http\Controllers\DepartmentController::class , 'store'])->name('departments.store');
                    Route::delete('departments/{department}', [\App\Http\Controllers\DepartmentController::class , 'destroy'])->name('departments.destroy');

                    // Hospitals & Doctors
                    Route::get('hospitals/{hospital}/account', [\App\Http\Controllers\HospitalController::class , 'account'])->name('hospitals.account');
                    Route::resource('hospitals', \App\Http\Controllers\HospitalController::class);
                    Route::resource('doctors', \App\Http\Controllers\DoctorController::class);
                    Route::resource('patient-classifications', \App\Http\Controllers\PatientClassificationController::class);
                    Route::resource('hmos', \App\Http\Controllers\HmoController::class);
                    Route::resource('test-hmo-prices', \App\Http\Controllers\TestHmoPriceController::class);

                    // Accounting
                    Route::get('accounting', [\App\Http\Controllers\AccountingController::class , 'index'])->name('accounting.index');
                    Route::get('accounting/source-patients', [\App\Http\Controllers\AccountingController::class , 'getSourcePatients'])->name('accounting.source-patients');
                    Route::post('accounting/batch-pay', [\App\Http\Controllers\AccountingController::class , 'batchPaySource'])->name('accounting.batch-pay');
                    Route::post('expenses', [\App\Http\Controllers\AccountingController::class , 'storeExpense'])->name('expenses.store');
                    Route::delete('expenses/{expense}', [\App\Http\Controllers\AccountingController::class , 'destroyExpense'])->name('expenses.destroy');
                }
                );
            }
            );

            // Subscription Activation (Accessible even if expired)
            Route::get('/subscription', [\App\Http\Controllers\Lab\SubscriptionController::class , 'show'])->name('subscription.show');
            Route::post('/subscription/activate', [\App\Http\Controllers\Lab\SubscriptionController::class , 'activate'])->name('subscription.activate');
        });

require __DIR__ . '/auth.php';