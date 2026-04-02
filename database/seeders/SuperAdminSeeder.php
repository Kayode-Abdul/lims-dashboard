<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Lab;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Default Lab
        $lab = Lab::firstOrCreate(['slug' => 'main-lab'], [
            'name' => 'Main Diagnostics Lab',
            'email' => 'admin@mainlab.com',
            'is_active' => true,
            'expires_at' => now()->addYears(1),
        ]);

        // 2. Create Super Admin
        User::firstOrCreate(['email' => 'super@admin.com'], [
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'password' => Hash::make('password'),
            'is_super_admin' => true,
            'role' => 'admin',
            'is_active' => true,
        ]);

        // 3. Create Lab Admin
        User::firstOrCreate(['email' => 'lab@admin.com'], [
            'first_name' => 'Lab',
            'last_name' => 'Admin',
            'password' => Hash::make('password'),
            'lab_id' => $lab->id,
            'role' => 'admin',
            'is_active' => true,
        ]);
    }
}
