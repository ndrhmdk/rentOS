<?php

namespace Tests\Unit\Monitoring;

use App\Monitoring\ErrorCode;
use Illuminate\Http\Client\ConnectionException;
use League\Flysystem\UnableToWriteFile;
use RuntimeException;
use Tests\TestCase;

class ErrorCodeTest extends TestCase
{
    public function test_maps_storage_failures(): void
    {
        $this->assertSame(
            ErrorCode::STORAGE_FAILED,
            ErrorCode::fromThrowable(UnableToWriteFile::atLocation('photos/a.jpg', 'timeout')),
        );

        $this->assertSame(
            ErrorCode::STORAGE_FAILED,
            ErrorCode::fromThrowable(new RuntimeException('Supabase Storage rejected upload')),
        );
    }

    public function test_maps_service_unavailable(): void
    {
        $this->assertSame(
            ErrorCode::SERVICE_UNAVAILABLE,
            ErrorCode::fromThrowable(new ConnectionException('cURL error 28')),
        );
    }

    public function test_defaults_to_server_error(): void
    {
        $this->assertSame(
            ErrorCode::SERVER_ERROR,
            ErrorCode::fromThrowable(new RuntimeException('Unexpected boom')),
        );
    }

    public function test_builds_vietnamese_messages_with_reference(): void
    {
        $reference = '7f3c2a18-1b6e-4d0a-9c44-0a6e5b21d8f0';

        $this->assertSame(
            'Không thể tải ảnh lên. Vui lòng thử lại. Mã tham chiếu: '.$reference,
            ErrorCode::message(ErrorCode::STORAGE_FAILED, $reference),
        );
        $this->assertSame(
            'Dịch vụ tạm thời không phản hồi. Vui lòng thử lại. Mã tham chiếu: '.$reference,
            ErrorCode::message(ErrorCode::SERVICE_UNAVAILABLE, $reference),
        );
        $this->assertSame(
            'Đã có lỗi. Vui lòng thử lại. Mã tham chiếu: '.$reference,
            ErrorCode::message(ErrorCode::SERVER_ERROR, $reference),
        );
    }
}
