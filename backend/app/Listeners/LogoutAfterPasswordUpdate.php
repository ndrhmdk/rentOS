<?php

namespace App\Listeners;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Events\PasswordUpdatedViaController;

class LogoutAfterPasswordUpdate
{
    public function __construct(private Request $request) {}

    public function handle(PasswordUpdatedViaController $event): void
    {
        Auth::guard('web')->logout();
        $this->request->session()->invalidate();
        $this->request->session()->regenerateToken();
    }
}
