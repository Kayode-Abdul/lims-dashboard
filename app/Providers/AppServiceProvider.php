<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Gate::before(function ($user, string $ability) {
            if ($user->is_super_admin) {
                return true;
            }
            
            if ($user->hasPermission($ability)) {
                return true;
            }
        });

        Gate::define('access-super-admin', function ($user) {
            return (bool) $user->is_super_admin;
        });
    }
}
