<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Syncable;

use App\Traits\Auditable;
use App\Traits\HasLab;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Syncable, SoftDeletes;

    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, Auditable, HasApiTokens, HasLab;

    protected static function booted()
    {
        static::creating(function ($user) {
            if (!$user->staff_no) {
                // Generate a random 6-digit number and check for uniqueness
                do {
                    $no = 'STF-' . rand(100000, 999999);
                } while (static::where('staff_no', $no)->exists());

                $user->staff_no = $no;
            }
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'staff_no',
        'email',
        'password',
        'role',
        'department',
        'first_name',
        'last_name',
        'other_names',
        'title',
        'sex',
        'phone',
        'address',
        'city',
        'state',
        'nationality',
        'marital_status',
        'employment_type',
        'position',
        'signature_path',
        'birth_date',
        'account_number',
        'hired_date',
        'bank_name',
        'spouse_name',
        'referee_address',
        'next_of_kin_name',
        'next_of_kin_address',
        'next_of_kin_phone',
        'is_active',
        'lab_id',
        'is_super_admin',
        'permissions',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the user's full name.
     */
    public function getNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birth_date' => 'date',
            'hired_date' => 'date',
            'is_active' => 'boolean',
            'is_super_admin' => 'boolean',
            'permissions' => 'array',
        ];
    }

    public function labs()
    {
        return $this->belongsToMany(Lab::class)->withPivot('is_active')->withTimestamps();
    }

    public function lab()
    {
        return $this->belongsTo(Lab::class);
    }

    /**
     * Check if user has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->is_super_admin) {
            return true;
        }

        // Match frontend logic in AuthenticatedLayout.tsx
        if (in_array($this->role, ['admin', 'lab_admin', 'supervisor'])) {
            return true;
        }

        return in_array($permission, $this->permissions ?? []);
    }
}