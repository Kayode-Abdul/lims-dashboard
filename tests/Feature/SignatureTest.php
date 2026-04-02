<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SignatureTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function signatures_can_be_uploaded_during_staff_creation()
    {
        Storage::fake('public');

        $admin = User::firstWhere('role', 'admin');
        if (!$admin) {
            $admin = User::factory()->create(['role' => 'admin']);
        }

        // Ensure lab has active subscription
        $lab = \App\Models\Lab::first();
        if (!$lab) {
            $lab = \App\Models\Lab::create([
                'name' => 'Test Lab',
                'slug' => 'test-lab',
                'email' => 'lab@example.com',
                'is_active' => true,
                'subscription_status' => 'active',
                'expires_at' => now()->addDays(30),
            ]);
        } else {
            $lab->update([
                'is_active' => true,
                'subscription_status' => 'active',
                'expires_at' => now()->addDays(30)
            ]);
        }

        $admin = User::factory()->create([
            'role' => 'admin',
            'lab_id' => $lab->id
        ]);

        $file = UploadedFile::fake()->image('signature.jpg');

        $email = 'sigtest_' . time() . '@example.com';

        $response = $this->actingAs($admin)
            ->post(route('staff.store'), [
                'first_name' => 'Signature',
                'last_name' => 'Test',
                'email' => $email,
                'role' => 'lab_tech',
                'password' => 'password',
                'password_confirmation' => 'password',
                'is_active' => true,
                'signature' => $file,
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('staff.index'));

        $user = User::where('email', $email)->first();
        $this->assertNotNull($user->signature_path);

        Storage::disk('public')->assertExists($user->signature_path);
    }
}
