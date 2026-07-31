# Changelog

## 2026-07-14

### Schema
- Standardized FOIHK organization schema naming across the site to use `Family Office Institute Hong Kong` with the Traditional Chinese institution name `香港家族辦公室學會` as the canonical Chinese alternate name.
- Consolidated shared organization schema constants in `src/lib/schema.ts` so English name, Traditional Chinese name, address, and contact metadata stay aligned across homepage, about, contact, philanthropy, article, and press schema blocks.
- Updated the root `index.html` organization schema to keep the same English legal name while pairing it with the Traditional Chinese institution name for consistent cross-field referencing.

### Validation
- Added `scripts/validate-schema.cjs` and the `npm run validate:schema` command to validate built JSON-LD output for:
  - English and Traditional Chinese institution name pairing
  - Consistent address and contact metadata in NAP-relevant schema blocks
  - Absence of the legacy Simplified Chinese institution name in generated schema output

### Notes
- The repository currently exposes no authoritative public telephone number. To avoid introducing unverified NAP data, this update standardizes organization name, address, and existing contact metadata without fabricating a `telephone` field.
