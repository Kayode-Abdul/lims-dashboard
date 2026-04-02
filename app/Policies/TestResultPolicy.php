<?php

namespace App\Policies;

use App\Models\TestResult;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TestResultPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, TestResult $testResult): bool
    {
        return $user->lab_id === $testResult->lab_id;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, TestResult $testResult): bool
    {
        return in_array($user->role, ['admin', 'pathologist', 'supervisor']) && $user->lab_id === $testResult->lab_id;
    }

    /**
     * Determine whether the user can verify the test result.
     */
    public function verify(User $user, TestResult $testResult): bool
    {
        return $user->hasPermission('results.verify') && $user->lab_id === $testResult->lab_id;
    }
}