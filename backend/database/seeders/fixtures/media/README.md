# Baseline media fixtures

These are real 32×24 RGB PNG images generated specifically for rentOS. They are project-authored test fixtures, contain no third-party content, and are covered by the repository license.

The seeder reuses these two images for every published property. Paths follow `properties/{property_uuid}/gallery-01.png` and `properties/{property_uuid}/unit-01.png`.

- `published-property-gallery-01.png`
  - SHA-256: `709e629a13ad48a08e4299023879077b3836b49428b7dd2d1efec815a5a42029`
- `published-property-unit-01.png`
  - SHA-256: `0b7a96dc052bf841dc8d21f3f765a6d67abcdedf96a0bdffbc57d43eb3cdca20`

`BaselineSeeder` calculates each row's MIME type, byte size, and SHA-256 digest from these committed bytes. `fixtures:media-upload` validates the file and matching `property_media` row before uploading.
