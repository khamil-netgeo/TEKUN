<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Artisan;
use Spatie\Permission\PermissionRegistrar;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Reset Spatie permission cache so hasRole() works correctly in tests
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->runModuleMigrations();
    }

    /**
     * Run all module-specific migrations after the main migrate:fresh.
     * This is needed because RefreshDatabase only runs main migrations.
     */
    protected function runModuleMigrations(): void
    {
        $modulesPath = base_path('app/Modules');
        if (!is_dir($modulesPath)) return;

        foreach (scandir($modulesPath) as $module) {
            if (in_array($module, ['.', '..'])) continue;
            $migPath = "app/Modules/{$module}/Database/Migrations";
            if (is_dir(base_path($migPath))) {
                Artisan::call('migrate', [
                    '--path'  => $migPath,
                    '--force' => true,
                ]);
            }
        }
    }
}
