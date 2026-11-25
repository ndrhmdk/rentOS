<?php

namespace Tests\Unit\Http\Responses;

use App\Http\Responses\PasswordResetLinkRequestResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PasswordResetLinkRequestResponseTest extends TestCase
{
    public function test_throttled_json_request_throws_429_validation_exception(): void
    {
        $request = Request::create('/forgot-password', 'POST', [], [], [], ['HTTP_ACCEPT' => 'application/json']);
        $response = new PasswordResetLinkRequestResponse(Password::RESET_THROTTLED);

        try {
            $response->toResponse($request);
            $this->fail('Expected ValidationException');
        } catch (ValidationException $e) {
            $this->assertSame(429, $e->status);
            $this->assertArrayHasKey('email', $e->errors());
        }
    }

    public function test_web_requests_return_redirect_with_errors_or_status(): void
    {
        $webRequest = Request::create('/forgot-password', 'POST');

        $throttled = (new PasswordResetLinkRequestResponse(Password::RESET_THROTTLED))->toResponse($webRequest);
        $this->assertInstanceOf(RedirectResponse::class, $throttled);

        $invalidUser = (new PasswordResetLinkRequestResponse(Password::INVALID_USER))->toResponse($webRequest);
        $this->assertInstanceOf(RedirectResponse::class, $invalidUser);

        $sent = (new PasswordResetLinkRequestResponse(Password::RESET_LINK_SENT))->toResponse($webRequest);
        $this->assertInstanceOf(RedirectResponse::class, $sent);
        $this->assertNotNull($sent->getSession()?->get('status'));
    }
}
