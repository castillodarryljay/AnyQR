# Security Specification

## 1. Data Invariants
1. `qr_items` documents must have a valid `userId` matching the creator's `request.auth.uid`.
2. Public scans can `get` individual `qr_items` if `resource.data.isPublic == true`, allowing QR code scanners anywhere to watch the pure video.
3. Listing `qr_items` is strictly restricted to authenticated users matching `resource.data.userId == request.auth.uid`. Blanket reads without filter are forbidden.
4. Anonymous viewers may increment `viewsCount` by 1 via a dedicated action branch, but cannot alter any other fields (`title`, `url`, `userId`).
5. Only the owning user can edit metadata or delete their QR items.
6. User profiles under `/users/{userId}` are strictly isolated to the authenticated user whose `request.auth.uid == userId`.
7. `createdAt` is immutable after document creation.

## 2. The Dirty Dozen Payloads
1. **Orphan Item Injection**: Creating a QR item without authentication -> Rejected (auth required).
2. **Identity Spoofing**: User A creating a QR item with `userId` = "User B" -> Rejected (owner check).
3. **Ghost Field Mutation**: Updating an item with injected admin flag `{ isAdmin: true }` -> Rejected.
4. **Blanket Query Scraping**: Listing all QR items without filtering `userId == auth.uid` -> Rejected.
5. **Malicious URL Poisoning**: Saving a title with > 300 characters or invalid type -> Rejected by schema.
6. **Cross-User Deletion**: User B attempting to delete User A's QR code -> Rejected.
7. **Cross-User Update**: User B attempting to change User A's video destination -> Rejected.
8. **View Count Jump Hack**: Viewer attempting to increment `viewsCount` by 10,000 -> Rejected (single increment check).
9. **Creation Timestamp Tampering**: Modifying `createdAt` on an existing item -> Rejected.
10. **Foreign Profile Read**: User A attempting to read `/users/UserB` -> Rejected (PII isolation).
11. **Foreign Profile Write**: User A attempting to write `/users/UserB` -> Rejected.
12. **Id Path Poisoning**: Attempting to read/write using invalid characters like `../../hack` -> Rejected by `isValidId`.
