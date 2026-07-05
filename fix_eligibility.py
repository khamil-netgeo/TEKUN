#!/usr/bin/env python3
"""Fix eligibilityCheck method to add IC validation and closing brace"""

filepath = '/home/ubuntu/sppt/backend/app/Modules/ProdukPembiayaan/Controllers/ProductController.php'

with open(filepath, 'r') as f:
    lines = f.readlines()

# Find eligibilityCheck method
start_idx = None
for i, line in enumerate(lines):
    if 'public function eligibilityCheck(Request $request, int $id): JsonResponse' in line:
        start_idx = i
        break

if start_idx is None:
    print("ERROR: Could not find eligibilityCheck method")
    exit(1)

print(f"Found eligibilityCheck at line {start_idx + 1}")

# Print lines around it
for i in range(start_idx, min(start_idx + 10, len(lines))):
    print(f"  {i+1}: {repr(lines[i])}")

# The method body is lines start_idx to start_idx+4 (missing closing brace)
# Replace with proper implementation
old_block_size = 5  # lines start_idx through start_idx+4

new_block = [
    "    public function eligibilityCheck(Request $request, int $id): JsonResponse\n",
    "    {\n",
    "        $validator = Validator::make($request->all(), [\n",
    "            'ic' => 'required|string|min:12|max:12',\n",
    "        ]);\n",
    "        if ($validator->fails()) {\n",
    "            return response()->json([\n",
    "                'message' => 'Validation failed.',\n",
    "                'errors'  => $validator->errors(),\n",
    "            ], 422);\n",
    "        }\n",
    "\n",
    "        $product = FinancingProduct::with('activeRules')->findOrFail($id);\n",
    "        $result = $this->eligibilityService->check($product, $request->all());\n",
    "        return response()->json(['data' => $result]);\n",
    "    }\n",
]

new_content = lines[:start_idx] + new_block + lines[start_idx + old_block_size:]

with open(filepath, 'w') as f:
    f.writelines(new_content)

print(f"\nReplaced {old_block_size} lines with {len(new_block)} lines")

# Verify
with open(filepath, 'r') as f:
    verify = f.read()

if "'ic' => 'required|string|min:12|max:12'" in verify:
    print("SUCCESS: IC validation added to eligibilityCheck()")
else:
    print("ERROR: Fix not applied")
