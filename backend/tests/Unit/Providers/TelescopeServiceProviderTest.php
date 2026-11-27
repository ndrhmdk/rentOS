<?php

namespace Tests\Unit\Providers;

use App\Providers\TelescopeServiceProvider;
use Laravel\Telescope\EntryType;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Tests\TestCase;

class TelescopeServiceProviderTest extends TestCase
{
    public function test_telescope_filters_sensitive_entries_and_strips_sql_string_literals(): void
    {
        $originalFilters = Telescope::$filterUsing;
        $originalAfter = Telescope::$afterRecordingHook;

        try {
            Telescope::$filterUsing = [];
            Telescope::$afterRecordingHook = null;

            $provider = new TelescopeServiceProvider($this->app);
            $provider->register();

            $filter = end(Telescope::$filterUsing);
            $this->assertIsCallable($filter);

            // 1. Sensitive query on users table is filtered out
            $sensitiveQuery = IncomingEntry::make(['sql' => 'select * from users where id = 1'])->type(EntryType::QUERY);
            $this->assertFalse($filter($sensitiveQuery));

            // 2. Non-local mail entry is filtered out
            $mailEntry = IncomingEntry::make(['mailable' => 'TestMail'])->type(EntryType::MAIL);
            $this->assertFalse($filter($mailEntry));

            // 3. Non-local auth request is filtered out
            $authRequest = IncomingEntry::make(['uri' => '/login'])->type(EntryType::REQUEST);
            $this->assertFalse($filter($authRequest));

            // 4. Non-local User model event is filtered out
            $userModel = IncomingEntry::make(['model' => 'App\\Models\\User:123'])->type(EntryType::MODEL);
            $this->assertFalse($filter($userModel));

            // 5. Normal query passes filter when tagged/monitored or reportable
            $normalQuery = IncomingEntry::make(['sql' => "select * from listings where title = 'secret'"])->type(EntryType::QUERY);
            $normalQuery->tags(['monitored']);
            $this->assertFalse($filter($normalQuery)); // not monitored in Telescope::monitoredTags

            // 6. afterRecording strips string literals and clears bindings
            $after = Telescope::$afterRecordingHook;
            $this->assertIsCallable($after);

            $queryToClean = IncomingEntry::make([
                'sql' => "select * from listings where title = 'secret value'",
                'bindings' => ['secret value'],
            ])->type(EntryType::QUERY);
            $after(new Telescope, $queryToClean);
            $this->assertSame("select * from listings where title = '?'", $queryToClean->content['sql']);
            $this->assertSame([], $queryToClean->content['bindings']);

            // Non-query entry is untouched by afterRecording
            $nonQuery = IncomingEntry::make(['uri' => '/api/v1/listings'])->type(EntryType::REQUEST);
            $after(new Telescope, $nonQuery);
            $this->assertSame('/api/v1/listings', $nonQuery->content['uri']);
        } finally {
            Telescope::$filterUsing = $originalFilters;
            Telescope::$afterRecordingHook = $originalAfter;
        }
    }
}
