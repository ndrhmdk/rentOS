<?php

namespace Tests\Feature;

use App\Logging\ApplyCredentialRedaction;
use App\Models\User;
use Illuminate\Foundation\Http\Events\RequestHandled;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Telescope\Contracts\EntriesRepository;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\Watchers\RequestWatcher;
use RuntimeException;
use Tests\Support\IdentityTestCase;

class IdentityDiagnosticsTest extends IdentityTestCase
{
    public function test_logging_redacts_nested_credentials_tokens_reset_links_and_exception_arguments(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'rentos-log-');
        try {
            config(['logging.channels.identity-test' => ['driver' => 'single', 'path' => $path, 'tap' => [ApplyCredentialRedaction::class]]]);
            $logger = Log::channel('identity-test');
            $logger->error('Bearer 1|'.str_repeat('a', 40).' reset /reset-password?token='.str_repeat('b', 64), [
                'password' => 'PrivatePassword123', 'nested' => ['Authorization' => 'Bearer secret', 'cookie' => 'session-secret'],
                'exception' => new RuntimeException('sensitive exception password'),
            ]);
            $contents = file_get_contents($path);
            foreach (['PrivatePassword123', 'Bearer secret', 'session-secret', str_repeat('a', 40), str_repeat('b', 64), 'sensitive exception password'] as $secret) {
                $this->assertStringNotContainsString($secret, $contents);
            }
            $this->assertStringContainsString('[REDACTED]', $contents);
        } finally {
            unlink($path);
        }
    }

    public function test_token_secret_and_request_credentials_are_not_persisted_by_telescope(): void
    {
        $user = User::factory()->create();
        $this->login($user)->assertOk();
        $this->confirmPassword();
        Telescope::flushEntries();
        Telescope::startRecording(false);
        $watcher = new RequestWatcher([]);
        $this->app['events']->listen(RequestHandled::class, [$watcher, 'recordRequest']);
        try {
            $created = $this->browser('POST', '/api/v1/account/api-tokens', ['name' => 'private', 'abilities' => ['account:read']])->assertCreated();
            $this->browser('GET', '/api/health')->assertOk();
            Telescope::store(app(EntriesRepository::class));
            $this->assertDatabaseCount('telescope_entries', 1);
            $contents = json_encode(DB::table('telescope_entries')->get());
            $this->assertStringNotContainsString($created->json('plain_text_token'), $contents);
            $this->assertStringNotContainsString($user->tokens()->sole()->token, $contents);
            $this->assertStringNotContainsString($this->jar[config('session.cookie')], $contents);
            $this->assertStringNotContainsString($this->jar['XSRF-TOKEN'], $contents);
        } finally {
            Telescope::stopRecording();
            Telescope::flushEntries();
        }
    }

    public function test_audit_failure_rolls_back_token_issuance(): void
    {
        $user = User::factory()->create();
        $this->login($user)->assertOk();
        $this->confirmPassword();
        DB::statement("CREATE FUNCTION public.rnt03_reject_audit() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''audit unavailable''; END'");
        DB::statement('CREATE TRIGGER rnt03_reject_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION public.rnt03_reject_audit()');
        $this->browser('POST', '/api/v1/account/api-tokens', ['name' => 'rolled back', 'abilities' => ['account:read']])->assertServerError()->assertExactJson(['message' => 'Unable to complete the request.']);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseCount('audit_logs', 0);
    }
}
