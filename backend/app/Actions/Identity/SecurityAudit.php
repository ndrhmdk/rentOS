<?php

namespace App\Actions\Identity;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SecurityAudit
{
    /** @param array<string, mixed> $metadata */
    public function record(User $user, string $action, array $metadata = [], ?string $actorId = null): void
    {
        // Q&A-03 (Khai): confirm entity convention. PAT bigint is metadata, users UUID remains entity_id.
        DB::table('audit_logs')->insert([
            'id' => (string) Str::uuid(),
            'actor_id' => $actorId ?? $user->id,
            'entity_type' => 'users',
            'entity_id' => $user->id,
            'action' => $action,
            'after_values' => json_encode($metadata + ['outcome' => 'success'], JSON_THROW_ON_ERROR),
            'correlation_id' => (string) Str::uuid(), 'created_at' => now(),
        ]);
    }
}
