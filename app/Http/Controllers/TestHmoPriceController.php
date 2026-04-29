<?php

namespace App\Http\Controllers;

use App\Models\TestHmoPrice;
use Illuminate\Http\Request;

class TestHmoPriceController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('hmos.manage');
        $prices = TestHmoPrice::with(['test', 'hmo'])
            ->when($request->test_id, function ($query, $testId) {
                $query->where('test_id', $testId);
            })
            ->when($request->hmo_id, function ($query, $hmoId) {
                $query->where('hmo_id', $hmoId);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return response()->json($prices);
    }

    public function store(Request $request)
    {
        $this->authorize('hmos.manage');
        $validated = $request->validate([
            'test_id' => 'required|exists:tests,id',
            'hmo_id' => 'required|exists:hmos,id',
            'price' => 'required|numeric|min:0',
        ]);

        $price = TestHmoPrice::updateOrCreate(
            ['test_id' => $validated['test_id'], 'hmo_id' => $validated['hmo_id']],
            ['price' => $validated['price'], 'lab_id' => auth()->user()->lab_id]
        );

        return response()->json([
            'success' => true,
            'price' => $price->load([
                'test',
                'hmo' => function ($q) {
                    $q->withoutGlobalScope('lab'); // Logic check if needed, but normally within lab
                }
            ]),
        ]);
    }

    public function destroy(TestHmoPrice $testHmoPrice)
    {
        $this->authorize('hmos.manage');
        $testHmoPrice->delete();

        return response()->json(['success' => true]);
    }
}
