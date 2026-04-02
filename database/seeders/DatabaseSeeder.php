<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'first_name' => 'Admin',
            'last_name' => 'GD',
            'email' => 'admin@lims.com',
            'role' => 'admin',
        ]);

        User::factory()->create([
            'first_name' => 'Pathologist',
            'last_name' => 'User',
            'email' => 'pathologist@lims.com',
            'role' => 'pathologist',
        ]);

        User::factory()->create([
            'first_name' => 'LabTech',
            'last_name' => 'GD',
            'email' => 'tech@lims.com',
            'role' => 'lab_tech',
        ]);

        User::factory(10)->create();
    }
}
