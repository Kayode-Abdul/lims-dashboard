<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTestRequest;
use App\Http\Requests\UpdateTestRequest;
use App\Models\Test;
use App\Models\TestCategory;
use App\Models\Hmo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $this->authorize('catalog.manage');
        $query = Test::with(['category', 'hmoPrices.hmo', 'hospitalPrices.hospital', 'subTests', 'parent']);

        if ($request->filled('search')) {
            $search = $request->get('search');
            $searchTerms = preg_split('/\s+/', trim($search));
            $query->where(function ($q) use ($search, $searchTerms) {
                // Try exact match with full string first
                $q->where('test_name', 'like', "%{$search}%")
                    ->orWhere('test_code', 'like', "%{$search}%");
                // Also match each word individually against test_name
                $q->orWhere(function ($wordGroup) use ($searchTerms) {
                    foreach ($searchTerms as $term) {
                        if (!empty($term)) {
                            $wordGroup->where('test_name', 'like', "%{$term}%");
                        }
                    }
                });
            });
        }

        if ($request->filled('category')) {
            $query->where('category_id', $request->get('category'));
        }

        $tests = $query->latest()->paginate(15)->withQueryString();
        $categories = TestCategory::where('is_active', true)->orderBy('name')->get();
        $hmos = Hmo::all();
        $hospitals = \App\Models\Hospital::all();
        $groupTests = Test::where('is_group', true)->orderBy('test_name')->get(['id', 'test_name', 'test_code', 'is_group', 'has_subtests', 'subtest_definitions', 'parent_id']);
        $allTests = Test::where('is_group', false)->orderBy('test_name')->get(['id', 'test_name', 'test_code', 'is_group', 'has_subtests', 'subtest_definitions', 'parent_id']);

        return Inertia::render('Tests/Index', [
            'tests' => $tests,
            'categories' => $categories,
            'hmos' => $hmos,
            'hospitals' => $hospitals,
            'groupTests' => $groupTests,
            'allTests' => $allTests,
            'filters' => $request->only(['search', 'category']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTestRequest $request)
    {
        $this->authorize('catalog.manage');

        $test = Test::create($request->validated());

        if ($request->has('hmo_prices')) {
            foreach ($request->hmo_prices as $hmoId => $price) {
                if ($price !== null && $price !== '') {
                    $test->hmoPrices()->create([
                        'lab_id' => $test->lab_id,
                        'hmo_id' => $hmoId,
                        'price' => $price,
                    ]);
                }
            }
        }

        if ($request->has('hospital_prices')) {
            foreach ($request->hospital_prices as $hospitalId => $price) {
                if ($price !== null && $price !== '') {
                    $test->hospitalPrices()->create([
                        'lab_id' => $test->lab_id,
                        'hospital_id' => $hospitalId,
                        'price' => $price,
                    ]);
                }
            }
        }

        return redirect()->route('tests.index')
            ->with('message', 'Test created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTestRequest $request, Test $test)
    {
        $this->authorize('catalog.manage');

        $test->update($request->validated());

        if ($request->has('hmo_prices')) {
            foreach ($request->hmo_prices as $hmoId => $price) {
                if ($price === null || $price === '') {
                    $test->hmoPrices()->where('hmo_id', $hmoId)->delete();
                }
                else {
                    $test->hmoPrices()->updateOrCreate(
                    ['hmo_id' => $hmoId],
                    ['price' => $price, 'lab_id' => $test->lab_id]
                    );
                }
            }
        }

        if ($request->has('hospital_prices')) {
            foreach ($request->hospital_prices as $hospitalId => $price) {
                if ($price === null || $price === '') {
                    $test->hospitalPrices()->where('hospital_id', $hospitalId)->delete();
                }
                else {
                    $test->hospitalPrices()->updateOrCreate(
                    ['hospital_id' => $hospitalId],
                    ['price' => $price, 'lab_id' => $test->lab_id]
                    );
                }
            }
        }

        return redirect()->route('tests.index')
            ->with('message', 'Test updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Test $test)
    {
        $this->authorize('catalog.manage');

        $test->delete();

        return redirect()->route('tests.index')
            ->with('message', 'Test deleted successfully.');
    }

    public function toggleGroup(Request $request, Test $test)
    {
        $this->authorize('catalog.manage');

        $validated = $request->validate([
            'parent_id' => 'nullable|exists:tests,id',
        ]);

        $test->update(['parent_id' => $validated['parent_id']]);

        return back()->with('message', 'Test group assignment updated.');
    }
}