<?php

namespace App\Modules\ProdukPembiayaan\Tests;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

/**
 * Custom TestCase for M9 ProdukPembiayaan module.
 * Runs only core + M9 migrations to avoid conflicts with other modules.
 */
abstract class ProductTestCase extends TestCase
{
    use RefreshDatabase;

    protected function defineDatabaseMigrations(): void
    {
        // Run core migrations
        $this->artisan('migrate', [
            '--path'     => 'database/migrations',
            '--realpath' => false,
        ]);

        // Run M9 module migrations
        $this->artisan('migrate', [
            '--path'     => 'app/Modules/ProdukPembiayaan/Database/Migrations',
            '--realpath' => false,
        ]);

        // Create the required Spatie roles for tests (matching CoreRbacSeeder Malay names)
        app()['cache']->forget('spatie.permission.cache');
        Role::firstOrCreate(['name' => 'Pegawai Cawangan',  'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Pengurus Cawangan', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Pegawai Kredit',    'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Eksekutif',         'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Pentadbir Sistem',  'guard_name' => 'web']);
    }
}
