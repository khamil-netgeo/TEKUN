<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Called by RefreshDatabase in tests via $this->seed() or seeders config.
     */
    public function run(): void
    {
        $this->call([
            CoreRbacSeeder::class,
        ]);
    }
}
