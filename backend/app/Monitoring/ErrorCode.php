<?php

namespace App\Monitoring;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use League\Flysystem\UnableToCopyFile;
use League\Flysystem\UnableToDeleteFile;
use League\Flysystem\UnableToMoveFile;
use League\Flysystem\UnableToReadFile;
use League\Flysystem\UnableToRetrieveMetadata;
use League\Flysystem\UnableToWriteFile;
use Throwable;

final class ErrorCode
{
    public const STORAGE_FAILED = 'storage_failed';

    public const SERVICE_UNAVAILABLE = 'service_unavailable';

    public const SERVER_ERROR = 'server_error';

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [
            self::STORAGE_FAILED,
            self::SERVICE_UNAVAILABLE,
            self::SERVER_ERROR,
        ];
    }

    public static function isKnown(string $code): bool
    {
        return in_array($code, self::all(), true);
    }

    public static function fromThrowable(Throwable $throwable): string
    {
        if (self::isStorageFailure($throwable)) {
            return self::STORAGE_FAILED;
        }

        if (self::isServiceUnavailable($throwable)) {
            return self::SERVICE_UNAVAILABLE;
        }

        return self::SERVER_ERROR;
    }

    public static function message(string $code, string $reference): string
    {
        $base = match ($code) {
            self::STORAGE_FAILED => 'Không thể tải ảnh lên. Vui lòng thử lại.',
            self::SERVICE_UNAVAILABLE => 'Dịch vụ tạm thời không phản hồi. Vui lòng thử lại.',
            default => 'Đã có lỗi. Vui lòng thử lại.',
        };

        return $base.' Mã tham chiếu: '.$reference;
    }

    private static function isStorageFailure(Throwable $throwable): bool
    {
        if ($throwable instanceof UnableToWriteFile
            || $throwable instanceof UnableToRetrieveMetadata
            || $throwable instanceof UnableToReadFile
            || $throwable instanceof UnableToDeleteFile
            || $throwable instanceof UnableToCopyFile
            || $throwable instanceof UnableToMoveFile) {
            return true;
        }

        $haystack = strtolower($throwable::class.' '.$throwable->getMessage());

        return str_contains($haystack, 'supabase')
            || str_contains($haystack, 'storage')
            || str_contains($haystack, 'flysystem');
    }

    private static function isServiceUnavailable(Throwable $throwable): bool
    {
        if ($throwable instanceof ConnectionException) {
            return true;
        }

        if ($throwable instanceof RequestException && $throwable->response->status() === 503) {
            return true;
        }

        $haystack = strtolower($throwable->getMessage());

        return str_contains($haystack, 'service unavailable')
            || str_contains($haystack, 'temporarily unavailable');
    }
}
