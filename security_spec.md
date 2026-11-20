# Security Specification — Folio (Firestore Rules)

## 1. Data Invariants
1. **Identity Ownership**: Every document in `/folders/{folderId}` and `/notes/{noteId}` MUST carry `userId == request.auth.uid`, and only verified authenticated users (`request.auth != null && request.auth.token.email_verified == true`) may read or write.
2. **Relational Referential Integrity**: A note with a non-null `folderId` MUST reference an existing document in `/folders/{folderId}` whose `userId` equals `request.auth.uid`.
3. **Immutable Ownership & Creation Time**: `id`, `userId`, and `createdAt` MUST remain immutable after document creation.
4. **Server-Authoritative Timestamps**: `createdAt` (on create) and `updatedAt` (on create and update) MUST equal `request.time`.
5. **Path & Size Boundaries**: All document IDs (`folderId`, `noteId`) MUST match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters. All string and array fields enforce strict upper size bounds.
6. **Strict Field Allowlisting**: Document creation requires exact key match (`hasAll` + `hasOnly`), and updates restrict modified fields with `affectedKeys().hasOnly(...)`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Read/Write**: Creating or listing `/folders` or `/notes` with `request.auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: Writing with `request.auth != null` and `email_verified == false` -> `PERMISSION_DENIED`.
3. **Identity Spoofing on Create**: Creating a folder or note with `userId: "victim-uid"` while authenticated as `"attacker-uid"` -> `PERMISSION_DENIED`.
4. **Cross-Tenant Read/List**: Reading or querying `/folders` or `/notes` belonging to another `userId` -> `PERMISSION_DENIED`.
5. **Orphaned / Foreign Folder Assignment**: Creating or updating a note with `folderId` pointing to a nonexistent folder or another user's folder -> `PERMISSION_DENIED`.
6. **Shadow Field Injection (Ghost Field)**: Sending an extra unexpected key (e.g. `isAdmin: true` or `role: "owner"`) during create or update -> `PERMISSION_DENIED`.
7. **ID Poisoning / Path Traversal**: Using a document ID longer than 128 chars or containing invalid characters (`../admin`, spaces, `$`) -> `PERMISSION_DENIED`.
8. **Ownership Hijack on Update**: Attempting to mutate `userId` or `id` during an update -> `PERMISSION_DENIED`.
9. **Timestamp Forgery**: Providing a client timestamp instead of `request.time` for `createdAt` or `updatedAt`, or mutating `createdAt` on update -> `PERMISSION_DENIED`.
10. **Invalid Enum / Stage Injection**: Creating or updating a note with `stage: "PUBLISHED_BYPASS"` instead of `['SEED', 'DRAFT', 'REVISION', 'POLISHED']` -> `PERMISSION_DENIED`.
11. **Unbounded Array / Payload Exhaustion**: Submitting `tags` with more than 20 items, a non-string first element, or `content` exceeding 500,000 characters -> `PERMISSION_DENIED`.
12. **Cross-Tenant Delete**: Deleting a folder or note owned by another user -> `PERMISSION_DENIED`.
