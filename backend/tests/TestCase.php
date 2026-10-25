<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();
        $connection = $app['config']->get('database.default');
        $resolved = $app['db']->connection();
        $database = $resolved->getDatabaseName();
        $host = $resolved->getConfig('host');
        if ($connection !== 'pgsql' || $database !== 'rentos_test' || ! in_array($host, ['localhost', '127.0.0.1', 'postgres'], true)) {
            throw new \RuntimeException('Tests require isolated local PostgreSQL rentos_test; hosted/shared databases are refused.');
        }

        return $app;
    }
}
