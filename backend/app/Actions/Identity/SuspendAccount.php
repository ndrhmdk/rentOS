<?php

namespace App\Actions\Identity;

use App\Models\User;
use Illuminate\Support\Facades\Gate;

class SuspendAccount
{
    public function __construct(private RevokeCredentials $revoke) {}

    public function handle(User $actor, User $target): User
    {
        Gate::forUser($actor)->authorize('access-admin');

        // Q&A-02 (Khai): admin feature must call this action in its moderation transaction;
        // no suspension HTTP endpoint is enabled here until owner/reason/audit contract is agreed.
        return $this->revoke->handle($target, 'account.suspended', status: 'SUSPENDED', actorId: $actor->id);
    }
}
