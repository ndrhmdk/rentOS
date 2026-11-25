<?php

namespace App\Http\Resources;

use App\Models\PropertyMedia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PropertyMedia
 */
class PropertyMediaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'unit_id' => $this->unit_id,
            'caption' => $this->caption,
            'sort_order' => $this->sort_order,
            'is_selected_for_listing' => $this->is_selected_for_listing,
            'revision' => $this->revision,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            /** Signed preview URL, present only when the controller attached one. */
            'preview_url' => $this->resource->hasAttribute('preview_url') ? $this->resource->getAttribute('preview_url') : null,
            /** Unit ids sharing this photo, present only when the controller attached them. */
            'assigned_unit_ids' => array_values($this->resource->hasAttribute('assigned_unit_ids') ? ($this->resource->getAttribute('assigned_unit_ids') ?? []) : []),
            'created_at' => $this->created_at,
        ];
    }
}
