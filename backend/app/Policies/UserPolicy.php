<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function update(User $actor, User $target): bool
    {
        return $actor->id === $target->id && $actor->account_status === 'ACTIVE' && $actor->hasVerifiedEmail();
    }

    public function manageTokens(User $actor, User $target): bool
    {
        return $this->update($actor, $target);
    }
}
