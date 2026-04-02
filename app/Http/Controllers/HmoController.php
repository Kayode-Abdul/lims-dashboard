<?php

namespace App\Http\Controllers;

use App\Models\Hmo;
use Illuminate\Http\Request;

class HmoController extends Controller
{
    public function index(Request $request)
    {
        $hmos = Hmo::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return \Inertia\Inertia::render('Hmos/Index', [
            'hmos' => $hmos,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        if (!auth()->user()->hasPermission('hmos.manage')) {
            return back()->with('error', 'You do not have permission to manage HMOs.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
        ]);

        $hmo = Hmo::create($validated);

        if ($request->wantsJson()) {
            return response()->json($hmo);
        }

        return redirect()->back()->with('message', 'HMO created successfully.');
    }

    public function update(Request $request, Hmo $hmo)
    {
        if (!auth()->user()->hasPermission('hmos.manage')) {
            return back()->with('error', 'You do not have permission to manage HMOs.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
        ]);

        $hmo->update($validated);

        return redirect()->back()->with('message', 'HMO updated successfully.');
    }

    public function destroy(Hmo $hmo)
    {
        if (!auth()->user()->hasPermission('hmos.manage')) {
            return back()->with('error', 'You do not have permission to delete HMOs.');
        }

        $hmo->delete();

        return redirect()->back()->with('message', 'HMO deleted successfully.');
    }
}
