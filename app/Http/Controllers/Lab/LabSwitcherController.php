<?php

namespace App\Http\Controllers\Lab;

use App\Http\Controllers\Controller;
use App\Models\Lab;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class LabSwitcherController extends Controller
{
    /**
     * Switch the current active laboratory.
     */
    public function switch(Request $request, Lab $lab)
    {
        $user = $request->user();

        // Check if user is associated with this lab (Super Admin bypass)
        if (!$user->is_super_admin && !$user->labs()->where('labs.id', $lab->id)->exists()) {
            return back()->withErrors(['error' => 'You are not associated with this laboratory.']);
        }

        // Update the current lab_id
        $user->update(['lab_id' => $lab->id]);

        return Redirect::back()->with('status', "Switched to {$lab->name}");
    }
}
