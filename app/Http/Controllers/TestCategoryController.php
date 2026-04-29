<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTestCategoryRequest;
use App\Http\Requests\UpdateTestCategoryRequest;
use App\Models\TestCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TestCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $this->authorize('catalog.manage');
        $query = TestCategory::query();

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        }

        $categories = $query->latest()->get();

        return Inertia::render('TestCategories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTestCategoryRequest $request)
    {
        $this->authorize('catalog.manage');

        $category = TestCategory::create($request->validated());

        if ($request->wantsJson()) {
            return response()->json($category);
        }

        return redirect()->route('test-categories.index')
            ->with('message', 'Category created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTestCategoryRequest $request, TestCategory $testCategory)
    {
        $this->authorize('catalog.manage');

        $testCategory->update($request->validated());

        return redirect()->route('test-categories.index')
            ->with('message', 'Category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TestCategory $testCategory)
    {
        $this->authorize('catalog.manage');

        // Add check for dependent tests here later
        $testCategory->delete();

        return redirect()->route('test-categories.index')
            ->with('message', 'Category deleted successfully.');
    }
}
