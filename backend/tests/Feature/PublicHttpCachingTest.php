<?php

namespace Tests\Feature;

use App\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\Support\PublicListingFixture;
use Tests\TestCase;

class PublicHttpCachingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_public_search_is_briefly_cacheable_and_revalidates_with_a_weak_etag(): void
    {
        PublicListingFixture::published();

        $first = $this->getJson('/api/v1/listings')->assertOk();
        $this->assertSame('max-age=30, public, stale-while-revalidate=60', $first->headers->get('Cache-Control'));
        $etag = (string) $first->headers->get('ETag');
        $this->assertStringStartsWith('W/"', $etag);
        $this->assertContains('Origin', $first->getVary());

        $notModified = $this->withHeaders(['If-None-Match' => $etag])->getJson('/api/v1/listings');
        $notModified->assertStatus(304);
        $this->assertSame('', $notModified->getContent());
        $this->assertSame($etag, $notModified->headers->get('ETag'));
        $this->assertTrue($notModified->headers->hasCacheControlDirective('public'));
    }

    public function test_listing_edit_changes_the_etag_so_an_old_copy_is_not_revalidated(): void
    {
        $listing = PublicListingFixture::published();
        $etag = (string) $this->getJson('/api/v1/listings')->headers->get('ETag');

        $property = Property::query()->findOrFail($listing->propertyId);
        $this->actingAs($listing->owner, 'web')
            ->patchJson('/api/v1/owner/properties/'.$listing->propertyId.'/listing', [
                'expected_content_revision' => $property->content_revision,
                'title' => 'Tiêu đề mới sau khi chỉnh sửa',
            ])
            ->assertOk();

        $fresh = $this->withHeaders(['If-None-Match' => $etag])->getJson('/api/v1/listings');
        $fresh->assertOk()
            ->assertHeader('X-Cache', 'MISS')
            ->assertJsonPath('data.0.title', 'Tiêu đề mới sau khi chỉnh sửa');
        $this->assertNotSame($etag, $fresh->headers->get('ETag'));
    }

    public function test_listing_detail_must_revalidate_and_a_hidden_listing_is_never_served_from_an_old_etag(): void
    {
        $listing = PublicListingFixture::published();
        $detailUrl = '/api/v1/listings/'.$listing->listingId;

        $first = $this->getJson($detailUrl)->assertOk();
        $this->assertSame('no-cache, public', $first->headers->get('Cache-Control'));
        $etag = (string) $first->headers->get('ETag');
        $this->withHeaders(['If-None-Match' => $etag])->getJson($detailUrl)->assertStatus(304);

        $property = Property::query()->findOrFail($listing->propertyId);
        $this->actingAs($listing->owner, 'web')
            ->postJson('/api/v1/owner/properties/'.$listing->propertyId.'/listing/hide', [
                'expected_content_revision' => $property->content_revision,
            ])
            ->assertOk();

        $this->withHeaders(['If-None-Match' => $etag])->getJson($detailUrl)
            ->assertNotFound()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeaderMissing('ETag');
    }

    public function test_public_validation_errors_are_never_cacheable(): void
    {
        $this->getJson('/api/v1/listings?per_page=1000')
            ->assertUnprocessable()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeaderMissing('ETag');
    }

    public function test_reference_data_is_cacheable_for_an_hour(): void
    {
        $response = $this->getJson('/api/v1/amenities')->assertOk();

        $this->assertSame('max-age=3600, public, stale-while-revalidate=86400', $response->headers->get('Cache-Control'));
        $this->assertNotNull($response->headers->get('ETag'));
    }

    public function test_public_reads_from_the_spa_origin_do_not_start_a_session(): void
    {
        PublicListingFixture::published();

        $response = $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000/listings',
        ])->getJson('/api/v1/listings');

        $response->assertOk()
            ->assertCookieMissing((string) config('session.cookie'))
            ->assertCookieMissing('XSRF-TOKEN');
        $this->assertTrue($response->headers->hasCacheControlDirective('public'));
    }

    public function test_private_routes_from_the_spa_origin_still_get_a_session(): void
    {
        $this->withHeaders([
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000/profile',
        ])->getJson('/api/v1/me')
            ->assertUnauthorized()
            ->assertCookie('XSRF-TOKEN')
            ->assertHeader('Cache-Control', 'no-store, private');
    }
}
