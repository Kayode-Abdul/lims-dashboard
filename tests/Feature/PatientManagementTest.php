<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Lab;
use App\Models\Hmo;
use App\Models\Hospital;
use App\Models\Doctor;
use App\Models\PatientClassification;
use App\Models\Test;
use App\Models\TestHmoPrice;
use App\Models\Patient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PatientManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $lab;

    protected function setUp(): void
    {
        parent::setUp();

        $this->lab = Lab::create([
            'name' => 'Test Lab',
            'slug' => 'test-lab',
            'is_active' => true,
        ]);

        $this->user = User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'lab_id' => $this->lab->id,
        ]);

        $this->actingAs($this->user);

        // Ensure a category exists
        \App\Models\TestCategory::create(['name' => 'General', 'is_active' => true]);
    }

    public function test_can_create_patient_classification()
    {
        $response = $this->post(route('patient-classifications.store'), [
            'name' => 'Corporate Client',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('patient_classifications', [
            'name' => 'Corporate Client',
        ]);
    }

    public function test_can_create_hospital_and_doctor()
    {
        $hospitalResponse = $this->post(route('hospitals.store'), [
            'name' => 'St. Jude Hospital',
            'address' => '123 Health St',
        ]);

        $hospital = Hospital::first();

        $doctorResponse = $this->post(route('doctors.store'), [
            'name' => 'Dr. Gregory House',
            'hospital_id' => $hospital->id,
            'email' => 'house@stjude.com',
        ]);

        $this->assertDatabaseHas('doctors', [
            'name' => 'Dr. Gregory House',
            'hospital_id' => $hospital->id,
        ]);
    }

    public function test_can_register_hmo_patient()
    {
        $hmo = Hmo::create(['name' => 'NHIS']);
        $classification = PatientClassification::create(['name' => 'HMO']);

        $response = $this->post(route('patients.store'), [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'sex' => 'Female',
            'patient_type' => 'hmo',
            'patient_classification_id' => $classification->id,
            'hmo_id' => $hmo->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('patients', [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'hmo_id' => $hmo->id,
        ]);
    }

    public function test_hmo_specific_pricing_in_orders()
    {
        $hmo = Hmo::create(['name' => 'Premium Health']);
        $patient = Patient::create([
            'patient_id' => 'P-001',
            'first_name' => 'Alex',
            'last_name' => 'HMO',
            'sex' => 'Male',
            'patient_type' => 'hmo',
            'hmo_id' => $hmo->id,
            'is_active' => true,
        ]);

        $test = Test::create([
            'test_code' => 'T001',
            'test_name' => 'Blood Test',
            'price_walk_in' => 5000,
            'price_hmo' => 4500,
            'price_doctor_referred' => 4800,
            'category_id' => 1, // Assume category 1 exists or use a factory
            'turnaround_time' => 24,
            'is_active' => true,
        ]);

        // Define specific price for this HMO
        TestHmoPrice::create([
            'test_id' => $test->id,
            'hmo_id' => $hmo->id,
            'price' => 3000,
        ]);

        $response = $this->post(route('test-orders.store'), [
            'patient_id' => $patient->id,
            'test_ids' => [$test->id],
            'price' => 3000,
            'amount_paid' => 3000,
            'payment_method' => 'Insurance',
            'discount' => 0,
        ]);

        $response->assertRedirect();

        // Verify the order was created with the specific HMO price (3000)
        // instead of the default HMO price (4500)
        $this->assertDatabaseHas('test_orders', [
            'patient_id' => $patient->id,
            'test_id' => $test->id,
            'price' => 3000,
        ]);
    }
}
