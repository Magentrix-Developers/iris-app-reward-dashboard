---
name: magentrix-api
description: Magentrix REST API v3 reference — authentication, MEQL queries, entity CRUD, Document Library, attachments, and Static Assets. Use when making API calls, writing MEQL queries, or working with Magentrix data programmatically.
user-invocable: true
---

# Magentrix REST API v3

## Platform Overview

Magentrix is a multi-tenant portal platform. The frontend is built with **Iris** (Vue.js 3, Tailwind CSS, Flowbite).

Each Magentrix deployment has its own portal URL. Replace `{domain}` throughout this guide with your portal's domain. Example:
| Instance | Domain | Purpose | Token Env Var |
|---|---|---|---|
| Production | `your-portal.magentrixcloud.com` | Live portal | `REFRESH_TOKEN` |
| Sandbox / Dev | `your-sandbox.magentrixcloud.com` | Testing / development | `DEV_REFRESH_TOKEN` |

> The domain is set by whoever deployed Magentrix for your organization (e.g. `partners.acme.com`, `demo3.magentrixcloud.com`). Use the URL you normally log in to.

---

## Authentication

### Get Access Token

```
POST https://{domain}/api/3.0/token
Content-Type: application/json

{
  "grant_type": "refresh_token",
  "refresh_token": "{refresh_token}"
}
```

**Response:**
```json
{
  "token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 14400
}
```

- Access tokens are valid for ~4 hours.
- Reuse the same token across multiple API calls within a session.
- The response key is `token` (not `access_token`).
- Store token for reuse: save to `/tmp/magentrix_token.env` as `TOKEN=<value>`.

### Use Token in Requests

```
Authorization: Bearer {access_token}
```

All API endpoints require this header.

---

## MEQL (Magentrix Entity Query Language)

### Overview

MEQL is a SQL-like query language for retrieving entity data. It is used in:
- **REST API v3**: `POST /api/3.0/query` or `GET /api/3.0/query?q=<url_encoded_query>`
- **Query Console**: In the Magentrix IDE under Tools menu
- **Controllers and Classes**: Via SDK query methods

Maximum 10,000 records per query. Use LIMIT with offset for pagination.

### Query Endpoint

```
POST https://{domain}/api/3.0/query
Content-Type: application/json
Authorization: Bearer {access_token}

SELECT Id, Name, Email, Account.Name
FROM Contact
WHERE BillingCountry = "US"
ORDER BY Name
LIMIT 100
```

The request body is the raw MEQL query string.

**Response:**
```json
{
  "Count": 3,
  "Records": [
    {
      "Id": "001E000000HUJOaIAP",
      "Name": "Sam Smith",
      "Email": "sam.s@uoas.net",
      "Account": {
        "Name": "United Oil & Gas"
      }
    }
  ]
}
```

**Important:** The response key is `Records` (capital R).

### Basic Syntax

```sql
SELECT <field_list>
FROM <entity_name>
[WHERE <condition>]
[GROUP BY <field_name>]
[ORDER BY <field_name> [ASC|DESC]]
[LIMIT <n>]
[LIMIT <take>,<offset>]
```

- **SELECT** is optional. Omit it to return all fields: `FROM Account`
- **FROM** is always required.
- **Keywords** (SELECT, FROM, WHERE, etc.) are case-insensitive.
- **Entity and field names** are case-sensitive and must match the schema exactly.

### String Literals

- **Always use double quotes** for string values. Single quotes are NOT supported.
- Quote escaping within strings is NOT supported. Avoid embedded quotes.

```sql
-- Correct
WHERE Name = "Magentrix"

-- WRONG (single quotes)
WHERE Name = 'Magentrix'
```

### Comparison Operators

| Operator | Description |
|---|---|
| `=` | Equal |
| `!=` | Not equal |
| `<` | Less than |
| `>` | Greater than |
| `<=` | Less than or equal |
| `>=` | Greater than or equal |

### Logical Operators

- `AND` — all conditions must be true
- `OR` — at least one condition must be true
- `NOT(...)` — negates expression
- Use parentheses for grouping

```sql
WHERE (Type = "Partner" AND Status = "Active") OR (Type = "Customer")
```

### Null and Boolean Handling

```sql
-- Null checks (lowercase null)
WHERE Name = null
WHERE Name != null

-- Boolean (lowercase true/false only)
WHERE IsActive = true
WHERE IsDeleted = false

-- String empty check
WHERE String.IsNullOrEmpty(Name)
WHERE NOT(String.IsNullOrEmpty(Email))
```

### String Functions

| Function | Example |
|---|---|
| `.Contains("value")` | `WHERE Name.Contains("ABC")` |
| `.StartsWith("value")` | `WHERE Name.StartsWith("Mag")` |
| `.EndsWith("value")` | `WHERE Email.EndsWith("@magentrix.com")` |
| `.ToLower()` | `WHERE Name.ToLower() = "magentrix"` |
| `.ToUpper()` | `WHERE Email.ToUpper().Contains("ADMIN")` |
| `String.IsNullOrEmpty(field)` | `WHERE String.IsNullOrEmpty(Name)` |

String functions work on: Text, Long Text, Phone, Email, Picklist, Global Picklist fields.

### Relationship Traversal (Dot Notation)

**SELECT**: One level only.
```sql
SELECT Id, Name, Account.Name, Owner.Email FROM Contact
```

**WHERE**: Multiple levels supported.
```sql
WHERE Account.Owner.Email = "manager@magentrix.com"
WHERE Account.Parent.Industry = "Technology"
```

Records with null relationship values are excluded from results.

### Date and DateTime

All dates stored in UTC. Use ISO 8601 format in double quotes.

```sql
WHERE CreatedOn = "2024-02-13"
WHERE CreatedOn = "2024-02-13T18:14:34"
WHERE CreatedOn >= "2024-01-01" AND CreatedOn <= "2024-12-31"
```

#### DateTime Constants

| Constant | Description |
|---|---|
| `DateTime.Today` | Current date at 00:00:00 (no timezone) |
| `DateTime.UtcNow` | Current UTC date and time |

#### Date Arithmetic on Constants

```sql
WHERE CreatedOn > DateTime.Today.AddYears(-1)
WHERE CreatedOn >= DateTime.Today.AddMonths(-3)
WHERE CreatedOn = DateTime.Today.AddDays(-10)
WHERE CreatedOn >= DateTime.UtcNow.AddHours(-2)
WHERE CreatedOn >= DateTime.UtcNow.AddMinutes(-30)
WHERE StartDateTime <= DateTime.UtcNow.AddSeconds(300)
```

Methods can be chained: `DateTime.Today.AddYears(-1).AddMonths(3).AddDays(-15)`

#### Date Arithmetic on Fields (Fn.Add*)

```sql
WHERE Fn.AddYears(ContractEndDate, -1) > DateTime.Today
WHERE Fn.AddMonths(CreatedOn, 6) < DateTime.Today
WHERE Fn.AddDays(DueDate, 7) < DateTime.Today
WHERE Fn.AddHours(StartDateTime, 2) > DateTime.UtcNow
WHERE Fn.AddMinutes(CreatedOn, 15) < DateTime.UtcNow
WHERE Fn.AddSeconds(ResponseDateTime, 30) <= DateTime.UtcNow
```

#### Date Part Extraction

```sql
Fn.DatePart("<part>", <field>) <operator> <value>
```

Supported parts: `year`, `quarter`, `month`, `day`, `hour`, `minute`, `second`

```sql
WHERE Fn.DatePart("year", CreatedOn) = 2024
WHERE Fn.DatePart("quarter", CloseDate) = 1
WHERE Fn.DatePart("month", Birthdate) = 12
WHERE Fn.DatePart("hour", CreatedOn) >= 9 AND Fn.DatePart("hour", CreatedOn) <= 17
```

#### Timezone Conversion

```sql
WHERE Fn.ToLocalTime(CreatedOn) >= DateTime.Today
WHERE Fn.DatePart("hour", Fn.ToLocalTime(CreatedOn)) >= 9
```

### Multi-Select Field Functions

Multi-select fields store semicolon-separated values (e.g., `"US;CA;MX"`).

#### Fn.Includes

Tests if field contains specified values. Within a value set: AND logic. Between sets: OR logic.

```sql
-- Field must contain US
WHERE Fn.Includes(TargetedCountry__c, "US")

-- Field must contain both US AND CA
WHERE Fn.Includes(TargetedCountry__c, "US;CA")

-- Field must contain (US AND CA) OR UK
WHERE Fn.Includes(TargetedCountry__c, "US;CA", "UK")
```

#### Fn.Excludes

Tests if field does NOT contain a value.

```sql
WHERE Fn.Excludes(TargetedCountry__c, "UK")

-- Exclude multiple (combine with AND)
WHERE Fn.Excludes(TargetedCountry__c, "UK") AND Fn.Excludes(TargetedCountry__c, "FR")
```

Semicolons separate values with no spaces. Values are case-sensitive.

### ORDER BY

Single field only. ASC is default.

```sql
ORDER BY CreatedOn DESC
ORDER BY Name ASC
```

Multiple-column sorting is NOT supported.

### LIMIT and Pagination

```sql
LIMIT 100              -- First 100 records
LIMIT 100, 10          -- Skip 10, return 100 (requires ORDER BY)
```

Pagination formula: `LIMIT <page_size>, <(page - 1) * page_size>`

```sql
-- Page 1
SELECT Id, Name FROM Contact ORDER BY CreatedOn DESC LIMIT 10, 0
-- Page 2
SELECT Id, Name FROM Contact ORDER BY CreatedOn DESC LIMIT 10, 10
```

### GROUP BY and Aggregates

Supported functions: `COUNT(Id)`, `SUM(field)`, `AVG(field)`, `MAX(field)`, `MIN(field)`

Aliases with `as` are **required** for aggregate functions.

```sql
SELECT Type, COUNT(Id) as RowCount, SUM(AnnualRevenue) as TotalRevenue
FROM Account
GROUP BY Type
ORDER BY Type
```

Aliases are NOT supported for non-aggregate fields.

Multi-currency: SUM, AVG, MAX, MIN auto-convert to user's preferred currency.

### Unsupported Features

| Feature | Workaround |
|---|---|
| `DISTINCT` | None |
| `IN / NOT IN` | Use multiple OR conditions |
| Subqueries | Execute separate queries |
| `JOIN` | Use dot notation traversal |
| `HAVING` | Filter aggregates in code |
| `UNION / INTERSECT / EXCEPT` | None |
| Window functions | None |
| `CASE` statements | None |
| Multiple ORDER BY columns | None |
| Field aliases on non-aggregates | None |
| Quote escaping in strings | Avoid embedded quotes |

### MEQL Feature Summary

| Feature | Status |
|---|---|
| SELECT / FROM | Supported (SELECT optional for all fields) |
| WHERE | Supported with comprehensive functions |
| GROUP BY + Aggregates | Supported (COUNT, SUM, AVG, MAX, MIN) |
| ORDER BY | Single-field only (ASC/DESC) |
| LIMIT | Single value or take,offset |
| Dot notation (relationships) | SELECT: 1 level; WHERE: multi-level |
| Field aliases (AS) | Required for aggregates; not for regular fields |
| Max rows per query | 10,000 |

---

## Entity CRUD Operations

### Retrieve (GET)

```
GET https://{domain}/api/3.0/entity/{entityName}/{id}
Authorization: Bearer {access_token}
```

Returns all fields for a single record.

**Important:** The entity GET endpoint does NOT support filtering (`$filter`, `$skip`, `$page`, `$search` are all ignored). Always use MEQL for queries.

### Create (POST)

```
POST https://{domain}/api/3.0/entity/{entityName}
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "Name": "New Record",
  "FieldName__c": "value"
}
```

- Supports single object or array of objects (batch create).
- Returns HTTP 201 Created on success.
- Max payload: 20MB.

**Response:**
```json
{
  "id": "record-id",
  "errors": [],
  "success": true
}
```

### Update (PATCH)

```
PATCH https://{domain}/api/3.0/entity/{entityName}/{id}
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "FieldToUpdate": "new value"
}
```

- Only include changed fields (partial update).
- Returns HTTP 200 OK.

### Delete (DELETE)

```
DELETE https://{domain}/api/3.0/entity/{entityName}/{id}
Authorization: Bearer {access_token}
```

- Soft delete by default (sets IsDeleted = true).
- Permanent delete: add `?isPermanent=true`.
- Batch delete: send array of IDs in body (max 200 per request).

### Upsert (PUT)

```
PUT https://{domain}/api/3.0/entity/{entityName}/{id}?uniqueField=ExternalId
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "ExternalId": "ext-123",
  "Name": "Record Name"
}
```

- Inserts or updates based on unique field value.
- `uniqueField` defaults to `Id` if not specified.
- Field must be marked as unique in entity metadata.

### Common Field Naming Rules

- Standard fields: `Name`, `Status`, `Priority`, `Description` (no `__c` suffix)
- Custom fields: `Sprint__c`, `Epic__c`, `QA_Assignee__c`
- Relationship traversal: `AssignedTo_r.Name` (use `_r.` not `_r__`)

---

## NoteAndAttachment (Record Attachments)

Attach files, notes, bookmarks, or code snippets to any record.

### Type Values

| Type | Content | Body Contains | Use Case |
|---|---|---|---|
| `0` | Note | Note text content | Meeting notes, comments |
| `1` | File Attachment | File description | Documents, images, PDFs |
| `2` | Bookmark | URL | Links to external resources |
| `3` | Snippet | Code/config text | JavaScript, C#, CSS, JSON, XML, SQL |

### Query Attachments

```sql
SELECT Id, Name, ContentType, Size, CreatedOn, Type
FROM NoteAndAttachment
WHERE ReferenceId = "{parentRecordId}"
```

### Create Attachment (File with base64 Body)

```
POST https://{domain}/api/3.0/entity/NoteAndAttachment
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "Name": "report.pdf",
  "ReferenceId": "{parentRecordId}",
  "ContentType": "application/pdf",
  "Type": 1,
  "Body": "<base64-encoded-content>"
}
```

### Create Note

```json
{
  "Name": "Meeting Notes",
  "ReferenceId": "{parentRecordId}",
  "Type": 0,
  "Body": "Notes from the meeting..."
}
```

### Create Bookmark

```json
{
  "Name": "API Documentation",
  "ReferenceId": "{parentRecordId}",
  "Type": 2,
  "Body": "https://docs.example.com/api"
}
```

### Create Code Snippet

```json
{
  "Name": "Helper Function",
  "ReferenceId": "{parentRecordId}",
  "Type": 3,
  "Body": "function helper() { return true; }"
}
```

### Download Attachment File

```
GET https://{domain}/api/3.0/file/{attachmentId}
Authorization: Bearer {access_token}
```

Returns binary file data. Save with: `curl -o "{filename}" ...`

---

## Document Library

Manage documents, folders, and file sharing.

### Document Entity Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `Name` | string | Yes | Document name (max 120 chars) |
| `FolderId` | string | Yes | Parent folder ID |
| `Type` | picklist | Yes | See Document Types below |
| `Body` | string | No | Base64-encoded file content (for File type) |
| `URL` | string | No | External URL (for URL, Video types) |
| `Extension` | string | No | File extension (max 8 chars) |
| `ContentType` | string | No | MIME type (max 80 chars) |
| `Description` | string | No | Description (max 2048 chars) |
| `Keywords` | string | No | Searchable keywords (max 3200 chars) |
| `Published` | bool | No | Whether publicly accessible |
| `OwnerId` | string | No | Document owner |
| `AuthorId` | string | No | Document author |
| `DisableSharing` | bool | No | Disable sharing controls |
| `EnableCoBranding` | bool | No | Enable co-branding |
| `TileImageName` | string | No | Tile image filename (max 50 chars) |
| `UniqueName` | string | Auto | Sanitized unique identifier |
| `Size` | decimal | ReadOnly | File size in bytes |
| `Version` | decimal | ReadOnly | Auto-generated version number |
| `DownloadCount` | decimal | ReadOnly | Download statistics |
| `ViewCount` | decimal | ReadOnly | View statistics |

### Document Types

| Type | Description | Key Fields |
|---|---|---|
| `File` | Uploaded file (PDF, image, etc.) | `Body` (base64), `Extension`, `ContentType` |
| `URL` | External bookmark/link | `URL` |
| `Video` | Embedded video (YouTube, Vimeo) | `URL` (embed URL) |
| `Note` | Text note | `Body` (text content) |
| `Snippet` | Code/config snippet | `Body` (code content) |
| `Html` | HTML content | `Body` (HTML content) |
| `Email Template` | Email template | `Body` (HTML template) |
| `Marketing Link` | Marketing tracking link | `URL` |

### Query Documents

```sql
SELECT Id, Name, Type, FolderId, Extension, ContentType, Size, Published
FROM Document
WHERE FolderId = "{folderId}"
ORDER BY Name
```

### Create a File Document

```
POST https://{domain}/api/3.0/entity/Document
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "Name": "quarterly-report.pdf",
  "FolderId": "{folderId}",
  "Type": "File",
  "Extension": "pdf",
  "ContentType": "application/pdf",
  "Body": "<base64-encoded-content>",
  "Description": "Q1 2026 quarterly report",
  "Published": false
}
```

### Create a URL Bookmark

```json
{
  "Name": "API Documentation",
  "FolderId": "{folderId}",
  "Type": "URL",
  "URL": "https://docs.example.com/api",
  "Description": "Link to API docs"
}
```

### Create a Video

```json
{
  "Name": "Product Demo",
  "FolderId": "{folderId}",
  "Type": "Video",
  "URL": "https://www.youtube.com/embed/VIDEO_ID",
  "Description": "Product demonstration video"
}
```

### Download Document File

```
GET https://{domain}/api/3.0/file/{documentId}
Authorization: Bearer {access_token}
```

### Update Document

```
PATCH https://{domain}/api/3.0/entity/Document/{documentId}
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "Description": "Updated description",
  "Published": true
}
```

### Delete Document

```
DELETE https://{domain}/api/3.0/entity/Document/{documentId}
Authorization: Bearer {access_token}
```

### Folder Entity Fields

| Field | Type | Description |
|---|---|---|
| `Name` | string | Folder name |
| `ParentId` | string | Parent folder ID (empty for root) |
| `OwnerId` | string | Folder owner |
| `Type` | string | Always `"Document"` |
| `SecurityType` | string | `"Private"`, `"Limited Access"` |
| `Description` | string | Folder description |
| `Keywords` | string | Searchable keywords |
| `DocumentCount` | decimal | Number of documents (read-only) |
| `TotalFolderSize` | decimal | Total size in bytes (read-only) |
| `EnableRating` | bool | Enable document ratings |
| `DisableCollaboration` | bool | Disable collaboration features |
| `SortByFieldName` | string | Default sort field |
| `SortDirection` | string | `"Ascending"` or `"Descending"` |

### Folder Sharing

**Share with all users:**
```csharp
var folder = Database.Retrieve<Folder>(folderId);
folder.ShareWithAllUsers();
```

**Share with specific users/groups:**
```csharp
var permissions = new List<FolderSharingOption>
{
    new FolderSharingOption { RecordId = userId, AccessLevel = "FullControl" },
    new FolderSharingOption { RecordId = groupId, AccessLevel = "CanUpload" },
    new FolderSharingOption { RecordId = roleId, AccessLevel = "CanView" }
};
folder.ShareWithSpecificUsers(permissions);
```

**Permission levels:**
| Level | View | Upload | Edit/Delete | Manage Sharing |
|---|---|---|---|---|
| `CanView` | Yes | No | No | No |
| `CanUpload` | Yes | Yes | Own files only | No |
| `FullControl` | Yes | Yes | Yes | Yes |

`RecordId` can be a User ID, UserGroup ID, or SecurityRole ID.

**Public access** requires: (1) folder shared with all users, (2) Guest Security Role has Read on Folder entity, (3) individual files have `Published = true`.

---

## Static Assets API

Manage files and folders in `/Contents/Assets/` directory.

**Requires:** Administrator privileges OR "Asset Manager" permission.

**Base URL:** `https://{domain}/api/3.0/staticassets`

### Supported File Types

| Category | Extensions |
|---|---|
| Images | `.gif`, `.png`, `.bmp`, `.jpg`, `.jpeg`, `.ico`, `.svg`, `.webp` |
| Text/Script | `.xml`, `.css`, `.js`, `.txt`, `.json`, `.md` |
| Advanced Editable | `.json`, `.xml`, `.css`, `.js`, `.txt`, `.ascx`, `.htm`, `.html` |
| Fonts | `.woff2`, `.woff`, `.eot`, `.ttf` |

### List Assets

```
GET /api/3.0/staticassets?path=/contents/assets/images&fileTypes=jpg,png,gif
Authorization: Bearer {access_token}
```

**Parameters:** `path` (default: `/Contents/Assets/`), `includeFiles` (default: true), `includeFolders` (default: true), `fileTypes` (comma-separated filter)

**Response:**
```json
{
  "CurrentPath": "/contents/assets/images",
  "Assets": [
    { "Name": "thumbnails", "Type": "Folder", "Path": "/contents/assets/images/thumbnails", "Extention": null },
    { "Name": "logo.png", "Type": "File", "Path": "/contents/assets/images/logo.png", "Extention": "png", "Size": 15420 }
  ]
}
```

### Upload Files

```
POST /api/3.0/staticassets?path=/contents/assets/images
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

-F 'file=@image1.jpg'
-F 'file=@image2.png'
```

Supports multiple files in one request. Returns uploaded file list and errors.

### Download Files

```
GET /api/3.0/staticassets/download?path=/contents/assets/images&names=logo.png
Authorization: Bearer {access_token}
```

Single file: returns the file directly. Multiple files (comma-separated names): returns ZIP archive.

### Create Folder

```
POST /api/3.0/staticassets/folder?path=/contents/assets&name=new-folder
Authorization: Bearer {access_token}
```

### Rename Asset

```
PUT /api/3.0/staticassets/rename?path=/contents/assets/images&oldName=old.png&newName=new.png
Authorization: Bearer {access_token}
```

### Delete Assets

```
DELETE /api/3.0/staticassets?path=/contents/assets/temp&names=old-file.txt,unused-folder
Authorization: Bearer {access_token}
```

### Copy Assets

```
POST /api/3.0/staticassets/copy?path=/contents/assets/images&targetPath=/contents/assets/backup&names=logo.png,banner.jpg
Authorization: Bearer {access_token}
```

### Move Assets

```
POST /api/3.0/staticassets/move?path=/contents/assets/temp&targetPath=/contents/assets/archive&names=old-styles.css
Authorization: Bearer {access_token}
```

### Static Assets Key Points

- All paths must be within `/Contents/Assets/` (security enforced).
- Paths are case-insensitive and auto-normalized.
- Folder operations (copy/move/delete) are recursive.
- Destination directories are created automatically on move.
- Unsupported file types are rejected on upload.
- ZIP downloads auto-generated for multiple files.

---

## File Download Endpoint

A general-purpose endpoint for downloading file content from Document, NoteAndAttachment, or PhotoGallery entities.

```
GET https://{domain}/api/3.0/file/{recordId}
Authorization: Bearer {access_token}
```

Returns binary file data with appropriate Content-Type header. Works for:
- Document records (document files)
- NoteAndAttachment records (attachment files)

**File Upload via URL:**
```
POST https://{domain}/api/3.0/file/{id}
Content-Type: application/json
Authorization: Bearer {access_token}

{
  "FileName": "report.pdf",
  "ParentId": "{folderId}",
  "Type": "Document",
  "File": "https://example.com/report.pdf",
  "ContentType": "application/pdf"
}
```

`Type` must be `"Document"`, `"Attachment"`, or `"Salesforce File"`. The `File` field is a URL from which the system downloads the content.

---

## Common Gotchas

1. **Double quotes in MEQL** — Always use double quotes for string values. Single quotes cause errors.
2. **Case-sensitive entity/field names** — `CreatedOn` not `createdon`. Use Entity Browser to verify.
3. **Response key casing** — Query responses use `Records` (capital R).
4. **No $filter on entity endpoint** — GET `/api/3.0/entity/{name}` ignores `$filter`, `$skip`, `$page`. Always use MEQL for queries.
5. **Custom field suffix** — Custom fields end with `__c`. Standard fields (Name, Status, Priority, Description) do not.
6. **Relationship suffix** — Use `_r.` for traversal: `AssignedTo_r.Name`, `Sprint_r.Name`.
7. **Token field name** — Auth response uses `token` not `access_token`.
8. **20MB payload limit** — All POST/PATCH/PUT requests.
9. **200 ID limit on batch delete** — Max 200 IDs per DELETE request.
10. **MEQL LIKE syntax** — Use `.Contains("value")` not SQL `LIKE '%value%'`.
11. **Sprint__c is a lookup** — Pass the Sprint record ID, not the sprint name string.
12. **Dates stored in UTC** — Use `DateTime.UtcNow` for precise comparisons, `Fn.ToLocalTime()` for local timezone.
