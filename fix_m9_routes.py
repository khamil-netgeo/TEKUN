#!/usr/bin/env python3
"""Fix M9 routes in routes/api.php"""

filepath = '/home/ubuntu/sppt/backend/routes/api.php'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the start of the old block
start_idx = None
for i, line in enumerate(lines):
    if "module:module9', 'role:system_admin'])->group" in line:
        start_idx = i
        break

if start_idx is None:
    print("ERROR: Could not find module9 routes block")
    exit(1)

print(f"Found module9 routes at line {start_idx + 1}")

old_block_size = 5  # 5 lines to replace

new_lines = [
    "    Route::middleware(['module:module9'])->group(function () {\n",
    "        Route::get('/products',                        [ProductController::class, 'index']);\n",
    "        Route::get('/products/{id}',                   [ProductController::class, 'show']);\n",
    "        Route::get('/products/{id}/eligibility-check', [ProductController::class, 'eligibilityCheck']);\n",
    "        Route::get('/products/{id}/audit-logs',        [ProductController::class, 'auditLogs']);\n",
    "    });\n",
    "    Route::middleware(['module:module9', 'role:system_admin'])->group(function () {\n",
    "        Route::put('/products/{id}',           [ProductController::class, 'update']);\n",
    "        Route::post('/products/{id}/activate', [ProductController::class, 'activate']);\n",
    "    });\n",
]

new_content = lines[:start_idx] + new_lines + lines[start_idx + old_block_size:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print("SUCCESS: Routes updated")

# Verify
with open(filepath, 'r', encoding='utf-8') as f:
    verify = f.read()

if "module:module9'])->group" in verify and "eligibility-check" in verify:
    print("VERIFIED: New routes present")
else:
    print("ERROR: Verification failed")
