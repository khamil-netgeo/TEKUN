<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function afterRefreshingDatabase(): void
    {
        // Run all module migrations after RefreshDatabase recreates the schema
        $modulesPath = base_path('app/Modules');
        if (is_dir($modulesPath)) {
            foreach (glob($modulesPath . '/*/Database/Migrations') as $migPath) {
                if (is_dir($migPath)) {
                    Artisan::call('migrate', [
                        '--path' => str_replace(base_path() . '/', '', $migPath),
                        '--force' => true,
                    ]);
                }
            }
        }
        // Seed core roles
        Artisan::call('db:seed', ['--class' => 'CoreRolesOnlySeeder', '--force' => true]);
    }
}
