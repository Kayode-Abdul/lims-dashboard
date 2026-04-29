<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Sensitivity;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class SensitivityController extends Controller
{
    public function index()
    {
        $this->authorize('catalog.manage');
        return Inertia::render('Sensitivities/Index', [
            'sensitivities' => Sensitivity::where('lab_id', Auth::user()->lab_id)->get()
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('catalog.manage');
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:number,text',
            'value' => 'nullable|string|max:255',
        ]);

        Sensitivity::create([
            ...$validated,
            'lab_id' => Auth::user()->lab_id,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Sensitivity created successfully.');
    }

    public function update(Request $request, Sensitivity $sensitivity)
    {
        $this->authorize('catalog.manage');
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:number,text',
            'value' => 'nullable|string|max:255',
            'is_active' => 'required|boolean',
        ]);

        $sensitivity->update($validated);

        return redirect()->back()->with('success', 'Sensitivity updated successfully.');
    }

    public function destroy(Sensitivity $sensitivity)
    {
        $this->authorize('catalog.manage');
        $sensitivity->delete();

        return redirect()->back()->with('success', 'Sensitivity deleted successfully.');
    }
}
