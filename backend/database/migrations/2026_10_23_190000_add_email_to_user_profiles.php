<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->text('email')->nullable()->after('full_name');
        });

        DB::statement(
            'UPDATE user_profiles AS profile
             SET email = account.email
             FROM users AS account
             WHERE profile.id = account.id
               AND profile.email IS NULL',
        );

        DB::statement(
            'ALTER TABLE user_profiles
                ALTER COLUMN email SET NOT NULL,
                ADD CONSTRAINT user_profiles_email_not_blank CHECK (btrim(email) <> \'\'),
                ADD CONSTRAINT user_profiles_email_unique UNIQUE (email)',
        );

        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION public.create_user_profile()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                INSERT INTO user_profiles (id, full_name, email)
                VALUES (NEW.id, NEW.name, NEW.email);
                RETURN NEW;
            END;
            $$;

            CREATE OR REPLACE FUNCTION public.sync_user_profile_name()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                UPDATE user_profiles
                SET full_name = NEW.name,
                    email = NEW.email,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.id;
                RETURN NEW;
            END;
            $$;

            DROP TRIGGER IF EXISTS users_sync_profile_name ON users;
            CREATE TRIGGER users_sync_profile_name
                AFTER UPDATE OF name, email ON users
                FOR EACH ROW
                WHEN (OLD.name IS DISTINCT FROM NEW.name OR OLD.email IS DISTINCT FROM NEW.email)
                EXECUTE FUNCTION public.sync_user_profile_name();
            SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION public.create_user_profile()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                INSERT INTO user_profiles (id, full_name)
                VALUES (NEW.id, NEW.name);
                RETURN NEW;
            END;
            $$;

            CREATE OR REPLACE FUNCTION public.sync_user_profile_name()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                UPDATE user_profiles
                SET full_name = NEW.name, updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.id;
                RETURN NEW;
            END;
            $$;

            DROP TRIGGER IF EXISTS users_sync_profile_name ON users;
            CREATE TRIGGER users_sync_profile_name
                AFTER UPDATE OF name ON users
                FOR EACH ROW
                WHEN (OLD.name IS DISTINCT FROM NEW.name)
                EXECUTE FUNCTION public.sync_user_profile_name();
            SQL);

        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropColumn('email');
        });
    }
};
