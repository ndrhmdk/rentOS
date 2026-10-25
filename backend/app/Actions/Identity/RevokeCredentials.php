<?php

namespace App\Actions\Identity;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RevokeCredentials
{
    public function __construct(private SecurityAudit $audit) {}

    public function handle(User $user, string $action, ?string $password = null, ?string $status = null, ?string $actorId = null): User
    {
        return DB::transaction(function () use ($user, $action, $password, $status, $actorId): User {
            $current = User::query()->lockForUpdate()->findOrFail($user->id);
            $current->credential_version++;
            $current->remember_token = Str::random(60);
            if ($password !== null) {
                $current->password = $password;
            }
            if ($status !== null) {
                $current->account_status = $status;
            }
            $current->save();
            DB::connection(config('session.connection'))
                ->table(config('session.table', 'sessions'))
                ->where('user_id', $current->id)->delete();
            $current->tokens()->delete();
            DB::table('password_reset_tokens')->where('email', $current->email)->delete();
            $this->audit->record($current, $action, [], $actorId);

            return $current;
        });
    }
}
