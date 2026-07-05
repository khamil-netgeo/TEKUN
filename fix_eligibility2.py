#!/usr/bin/env python3
"""Fix eligibilityCheck method - complete rewrite"""

filepath = '/home/ubuntu/sppt/backend/app/Modules/ProdukPembiayaan/Controllers/ProductController.php'

with open(filepath, 'r') as f:
    lines = f.readlines()

# Find the start of eligibilityCheck
start_idx = None
for i, line in enumerate(lines):
    if 'public function eligibilityCheck(Request $request, int $id): JsonResponse' in line:
        start_idx = i
        break

if start_idx is None:
    print("ERROR: Could not find eligibilityCheck method")
    exit(1)

# Find the end of eligibilityCheck (the next method or comment)
end_idx = None
for i in range(start_idx + 1, len(lines)):
    if '// ── GET /api/products/eligibility-check-all' in lines[i]:
        end_idx = i
        break

if end_idx is None:
    print("ERROR: Could not find end of eligibilityCheck method")
    exit(1)

print(f"Found eligibilityCheck from line {start_idx + 1} to {end_idx}")
print("Old block:")
for i in range(start_idx, end_idx):
    print(f"  {i+1}: {repr(lines[i])}")

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
    "\n",
]

new_content = lines[:start_idx] + new_block + lines[end_idx:]

with open(filepath, 'w') as f:
    f.writelines(new_content)

print(f"\nReplaced {end_idx - start_idx} lines with {len(new_block)} lines")

# Verify syntax
import subprocess
result = subprocess.run(['php', '-l', filepath], capture_output=True, text=True)
print(f"PHP syntax check: {result.stdout.strip()}")
if result.returncode != 0:
    print(f"STDERR: {result.stderr}")
