<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AccessKey;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AccessKeyController extends Controller
{
    public function index()
    {
        $keys = AccessKey::with(['lab', 'creator'])->latest()->paginate(20);
        return Inertia::render('SuperAdmin/AccessKeys/Index', [
            'keys' => $keys
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'duration_days' => 'required|integer|min:1',
            'count' => 'integer|min:1|max:50'
        ]);

        $count = $request->get('count', 1);

        for ($i = 0; $i < $count; $i++) {
            AccessKey::create([
                'key' => 'LAB-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4)),
                'duration_days' => $request->duration_days,
                'created_by' => auth()->id(),
                'is_activated' => false,
            ]);
        }

        return redirect()->back()->with('message', "$count access keys generated successfully.");
    }

    public function destroy(AccessKey $accessKey)
    {
        if ($accessKey->is_activated) {
            return redirect()->back()->with('error', 'Cannot delete an activated key.');
        }

        $accessKey->delete();
        return redirect()->back()->with('message', 'Access key deleted.');
    }
}
