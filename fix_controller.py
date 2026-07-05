#!/usr/bin/env python3
"""Fix 3 issues in ProductController:
1. Add cross-field validation for min_amount < max_amount
2. Add 409 conflict check in activate()
3. Add IC validation in eligibilityCheck()
"""

filepath = '/home/ubuntu/sppt/backend/app/Modules/ProdukPembiayaan/Controllers/ProductController.php'

with open(filepath, 'r') as f:
    content = f.read()

# Fix 1: Add cross-field validation after the validator
old_update_end = """        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }
        $updated = $this->productService->updateProduct($product, $request->all(), auth()->id());"""

new_update_end = """        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Cross-field validation: min_amount must be less than max_amount
        $minAmount = $request->input('min_amount', $product->min_amount);
        $maxAmount = $request->input('max_amount', $product->max_amount);
        if ((float) $minAmount >= (float) $maxAmount) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => ['min_amount' => ['Amaun minimum mesti lebih kecil daripada amaun maksimum.']],
            ], 422);
        }

        $updated = $this->productService->updateProduct($product, $request->all(), auth()->id());"""

if old_update_end in content:
    content = content.replace(old_update_end, new_update_end)
    print("Fix 1: Cross-field validation added")
else:
    print("ERROR: Could not find update() end block")

# Fix 2: Add 409 conflict check in activate()
old_activate = """        $activate = $request->input('action') === 'activate';
        $updated  = $this->productService->toggleActivation("""

new_activate = """        $activate = $request->input('action') === 'activate';

        // 409 Conflict: product is already in the desired state
        if ($product->is_active === $activate) {
            $state = $activate ? 'aktif' : 'tidak aktif';
            return response()->json([
                'message' => "Produk sudah dalam keadaan {$state}.",
                'data'    => ['id' => $product->id, 'is_active' => $product->is_active],
            ], 409);
        }

        $updated  = $this->productService->toggleActivation("""

if old_activate in content:
    content = content.replace(old_activate, new_activate)
    print("Fix 2: 409 conflict check added")
else:
    print("ERROR: Could not find activate() action block")

# Fix 3: Add IC validation in eligibilityCheck()
old_eligibility = """    public function eligibilityCheck(Request $request, int $id): JsonResponse
    {
        $product = FinancingProduct::with('activeRules')->findOrFail($id);
        $result = $this->eligibilityService->check($product, $request->all());
        return response()->json(['data' => $result]);
    }"""

new_eligibility = """    public function eligibilityCheck(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ic' => 'required|string|min:12|max:12',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $product = FinancingProduct::with('activeRules')->findOrFail($id);
        $result = $this->eligibilityService->check($product, $request->all());
        return response()->json(['data' => $result]);
    }"""

if old_eligibility in content:
    content = content.replace(old_eligibility, new_eligibility)
    print("Fix 3: IC validation added to eligibilityCheck()")
else:
    print("ERROR: Could not find eligibilityCheck() method")

with open(filepath, 'w') as f:
    f.write(content)

print("Done!")
