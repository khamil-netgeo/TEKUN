#!/usr/bin/env python3
"""Fix LogsAuditTrail to include module field and use savepoint"""

filepath = '/home/ubuntu/sppt/backend/app/Traits/LogsAuditTrail.php'

with open(filepath, 'r') as f:
    content = f.read()

# Add 'module' field to AuditTrail::create
old_create = """            AuditTrail::create([
                'user_id'        => Auth::id(),
                'action'         => $action,
                'auditable_type' => get_class($this),
                'auditable_id'   => $this->getKey(),
                'old_values'     => empty($oldValues) ? null : $oldValues,
                'new_values'     => empty($newValues) ? null : $newValues,
                'ip_address'     => Request::ip(),
                'user_agent'     => Request::userAgent(),
                'description'    => $description ?? $this->buildDescription($action),
            ]);"""

new_create = """            // Use savepoint to prevent PostgreSQL transaction abort on constraint violations
            \\Illuminate\\Support\\Facades\\DB::statement('SAVEPOINT audit_trail_save');
            try {
                AuditTrail::create([
                    'user_id'        => Auth::id(),
                    'action'         => $action,
                    'module'         => $this->resolveModuleName(),
                    'auditable_type' => get_class($this),
                    'auditable_id'   => $this->getKey(),
                    'old_values'     => empty($oldValues) ? null : $oldValues,
                    'new_values'     => empty($newValues) ? null : $newValues,
                    'ip_address'     => Request::ip(),
                    'user_agent'     => Request::userAgent(),
                    'description'    => $description ?? $this->buildDescription($action),
                ]);
                \\Illuminate\\Support\\Facades\\DB::statement('RELEASE SAVEPOINT audit_trail_save');
            } catch (\\Exception $saveEx) {
                \\Illuminate\\Support\\Facades\\DB::statement('ROLLBACK TO SAVEPOINT audit_trail_save');
                throw $saveEx;
            }"""

if old_create in content:
    content = content.replace(old_create, new_create)
    print("AuditTrail::create updated with savepoint and module field")
else:
    print("ERROR: Could not find AuditTrail::create block")
    # Show what we have
    idx = content.find("AuditTrail::create")
    if idx >= 0:
        print(repr(content[idx:idx+300]))

# Add resolveModuleName() method before buildDescription()
old_method = """    /**
     * Build a human-readable description for the audit event.
     */
    private function buildDescription(string $action): string"""

new_method = """    /**
     * Resolve the module name from the model's namespace.
     */
    private function resolveModuleName(): string
    {
        $map = [
            'PermohonanPembiayaan' => 'module1',
            'PenilaianRisiko'      => 'module2',
            'PenilaianKredit'      => 'module2',
            'Kelulusan'            => 'module3',
            'AkaunPembayaran'      => 'module4',
            'PemulihKutipan'       => 'module5',
            'PengurusanNPL'        => 'module5',
            'Dashboard'            => 'module6',
            'CrmUsahawan'          => 'module7',
            'PengurusanCawangan'   => 'module8',
            'ProdukPembiayaan'     => 'module9',
            'IntegrasiApi'         => 'module10',
            'AuditKawalan'         => 'module11',
            'PentadbiranSistem'    => 'module12',
        ];

        $class = get_class($this);
        foreach ($map as $keyword => $module) {
            if (str_contains($class, $keyword)) {
                return $module;
            }
        }

        if (preg_match('/Modules\\\\\\\\([^\\\\\\\\]+)/', $class, $matches)) {
            return strtolower($matches[1]);
        }

        return 'system';
    }

    /**
     * Build a human-readable description for the audit event.
     */
    private function buildDescription(string $action): string"""

if old_method in content:
    content = content.replace(old_method, new_method)
    print("resolveModuleName() method added")
else:
    print("ERROR: Could not find buildDescription method")

with open(filepath, 'w') as f:
    f.write(content)

# Verify
with open(filepath, 'r') as f:
    verify = f.read()

if 'resolveModuleName' in verify and 'SAVEPOINT' in verify and "'module'" in verify:
    print("SUCCESS: LogsAuditTrail fixed")
else:
    print("ERROR: Fix not applied correctly")
