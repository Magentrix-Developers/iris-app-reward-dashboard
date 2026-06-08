# AI Development Guide for Iris App Template

This guide provides comprehensive information for AI coding agents working on Magentrix Iris applications built with this template.

## Table of Contents

1. [Project Overview](#project-overview)
2. [API Metadata Discovery for AI Coding Tools](#api-metadata-discovery-for-ai-coding-tools)
3. [Magentrix SDK Integration](#magentrix-sdk-integration)
4. [MEQL Database Query Language](#meql-database-query-language)
5. [Development Guidelines for AI Agents](#development-guidelines-for-ai-agents)

---

## Project Overview

### What is This Project?

This is a **Vue 3 + TypeScript template** for building custom Iris applications that integrate with the Magentrix ecosystem. Iris apps are microfrontend applications that run within the Magentrix portal using module federation architecture.

### Module Federation Architecture

The template uses **Module Federation** to enable microfrontend integration:

- **Host Application**: The main Magentrix portal acts as the host
- **Remote Application**: Your Iris app is a remote module that can be dynamically loaded
- **Shared Dependencies**: Vue and Vue Router are shared as singletons to avoid duplication
- **Dynamic Loading**: Apps are loaded on-demand when users navigate to them

### Dual Entry Point System

The template provides two entry points for different environments:

#### 1. `src/main.ts` - Local Development Entry Point

Used for standalone local development with hot module replacement (HMR).

```typescript
import { createApp } from 'vue';
import { createAppRouter } from './router';
import { config } from './config';
import App from './App.vue';

let app: ReturnType<typeof createApp> | null = null;

export function mount(container: string | Element, basePath: string) {
  const router = createAppRouter(basePath)

  app = createApp(App);
  app.use(router);
  app.mount(container);

  console.log(`${config.appSlug} mounted with base: ${basePath}`);
}

export function unmount() {
    if (app) {
        app.unmount();
        app = null;
    }
}

const appElement = document.getElementById('app');

if (appElement && !appElement.hasChildNodes())
  mount('#app', import.meta.env.PROD ? `/iris-app/${config.appSlug}/` : '/');
```

**Key Features:**
- Uses `createAppRouter(basePath)` factory which includes built-in access control via a `beforeEach` guard
- Accepts dynamic `basePath` for flexible routing
- Auto-mounts when running locally (`npm run dev`) or in production
- Exports `mount()` and `unmount()` functions for module federation

#### 2. `src/AppEntry.ts` - Production Entry Point

Used when the app is deployed to Magentrix and loaded via module federation.

```typescript
import { createApp, h, type App } from 'vue';
import { config } from './config';
import AppRoot from './App.vue';
import router from './router';

let appInstance: App | null = null;

export function mount(elementOrId: string | Element) {
  if (appInstance)
    return;

  appInstance = createApp({
    render: () => h(AppRoot)
  });

  appInstance.use(router);

  // The host app may pass either a string ID or an actual DOM element
  if (typeof elementOrId === 'string')
    appInstance.mount(`#${elementOrId}`);
  else
    appInstance.mount(elementOrId);

  console.log(`${config.appSlug} mounted successfully!`);
}

export function unmount() {
  if (appInstance) {
    appInstance.unmount();
    appInstance = null;
    console.log(`${config.appSlug} unmounted.`);
  }
}
```

**Key Features:**
- Singleton pattern prevents multiple instances
- Accepts either a string ID or a DOM element for flexible mounting
- Clean unmount for proper lifecycle management

### Configuration System

#### Environment Variables

The template uses a single `.env.development` file for local development configuration:

- **`.env.development`** - Local development configuration (gitignored, contains sensitive data)
  - **Required** for local development
  - **Never commit** to version control (already in `.gitignore`)

**Environment Variables:**

```env
# .env.development
VITE_SITE_URL=https://your-portal.magentrix.com
VITE_REFRESH_TOKEN=your-refresh-token-here
```

**Required Variables:**
- `VITE_SITE_URL` - Your complete Magentrix portal URL (must include `https://`)
- `VITE_REFRESH_TOKEN` - Your authentication token for local development

**Accessing Environment Variables:**

Use the `src/env-helper.ts` helper for pre-configured SDK settings:

```typescript
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'

// magentrixConfig is automatically populated from environment variables
const dataService = useMagentrixSdk().getInstance(magentrixConfig)

// Available properties:
// - magentrixConfig.baseUrl (from VITE_SITE_URL)
// - magentrixConfig.refreshToken (from VITE_REFRESH_TOKEN)
// - magentrixConfig.isDevMode (automatically set based on MODE)
```

#### Application Configuration

The `src/config.ts` file contains critical application metadata:

```typescript
export const config = {
  appSlug: '',           // REQUIRED: URL-friendly identifier (e.g., 'sales-dashboard')
  appName: '',           // REQUIRED: Display name (e.g., 'Sales Dashboard')
  appDescription: '',    // OPTIONAL: Brief description of the app
  appIconId: ''          // OPTIONAL: Icon identifier for the app
}
```

**Required Properties:**
- `appSlug` - URL-friendly identifier for your app (no spaces or special characters)
  - Must match the `name` property in `package.json`
  - Used in the deployment path: `/contents/iris-app/{appSlug}/`
- `appName` - Display name shown to users in the Magentrix portal navigation menu

**Optional Properties:**
- `appDescription` - Brief description of what your app does
- `appIconId` - Icon identifier for your app in the Magentrix portal

**Important Notes:**
- All configuration properties are accessible throughout the application via `import { config } from '@/config'`
- Configuration must be set before deployment
- These values are used by the build system and module federation setup

---

## API Metadata Discovery for AI Coding Tools

### Overview

During development, AI coding tools can use the Magentrix API to discover entity metadata, field information, and available entities. This helps generate accurate code with correct field names, types, and relationships.

**Prerequisites:**
- Access to `.env.development` file with `VITE_SITE_URL` and `VITE_REFRESH_TOKEN`
- CURL or HTTP client capability

### Authentication: Getting an Access Token

Before calling any API endpoints, you need to obtain an access token using the refresh token from `.env.development`.

**Endpoint:**
```
POST https://{domain}/api/3.0/token
```

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Request Body:**
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "{refresh_token}"
}
```

**CURL Example:**
```bash
curl -X POST 'https://portal.company.com/api/3.0/token' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "your-refresh-token-here"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "dateIssued": "2026-11-22T18:34:50.4506867Z",
  "validUntil": "2026-11-22T19:35:50.45896867Z",
  "success": true,
  "errors": []
}
```

**Using Values from .env.development:**

If the `.env.development` file contains:
```env
VITE_SITE_URL=https://portal.company.com
VITE_REFRESH_TOKEN=abc123xyz789
```

Then the CURL command would be:
```bash
curl -X POST 'https://portal.company.com/api/3.0/token' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "abc123xyz789"
  }'
```

### Discovering Available Entities

Get a list of all available entities in the portal.

**Endpoint:**
```
GET https://{domain}/api/3.0/entity
```

**Headers:**
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {access_token}
```

**CURL Example:**
```bash
curl -X GET 'https://portal.company.com/api/3.0/entity' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response Example:**
```json
{
  "entities": [
    "Account",
    "Contact",
    "Opportunity",
    "Case",
    "Lead",
    "CustomObject__c"
  ]
}
```

### Getting Entity Metadata

Retrieve detailed metadata for one or more entities, including field names, types, labels, and relationships.

**Endpoint:**
```
GET https://{domain}/api/3.0/entity/metadata?entities={entity_names}
```

**Headers:**
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {access_token}
```

**Parameters:**
- `entities` - Comma-separated list of entity names (e.g., `Account` or `Account,Contact,Opportunity`)

**CURL Example (Single Entity):**
```bash
curl -X GET 'https://portal.company.com/api/3.0/entity/metadata?entities=Account' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**CURL Example (Multiple Entities):**
```bash
curl -X GET 'https://portal.company.com/api/3.0/entity/metadata?entities=Account,Contact,Opportunity' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response Example:**
```json
[
  {
    "Id": "7NS00000000008t0000",
    "Name": "Account",
    "Label": "Account",
    "PluralLabel": "Accounts",
    "StartsWithVowel": false,
    "KeyPrefix": "006",
    "DbSchema": "standard",
    "AreaPath": "",
    "EntityType": "Object",
    "TrackFeeds": true,
    "AllowReports": true,
    "TrackActivities": true,
    "Triggerable": true,
    "Automationable": true,
    "IsHidden": false,
    "IsCustom": false,
    "IsPermissionable": true,
    "Fields": [
      {
        "Id": "7NX0000000003H90000",
        "Name": "AccountRoles__c",
        "Label": "Account Roles",
        "FieldType": "PicklistMultiSelect",
        "IsKey": false,
        "IsSearchable": false,
        "IsReadable": true,
        "IsReference": false,
        "IsAuditField": false,
        "IsReadOnly": false,
        "IsRequired": false,
        "IsExternalId": false,
        "IsCalculated": false,
        "IsNameField": false,
        "IsSystemField": false,
        "IsCustomField": true,
        "ReferenceType": "None",
        "IsFilterable": true,
        "IsAuditable": false,
        "IsAudited": false,
        "IsSortable": true,
        "IsUnique": false,
        "IsHtml": false,
        "Length": 0,
        "Precision": 0,
        "IsMapped": true,
        "IsFileSize": false,
        "TimeDisplayOption": "Minutes",
        "IsDepedentPicklist": false,
        "PicklistEntries": [
          {
            "Id": "7O00000000003Ag0000",
            "IsDefaultValue": true,
            "Label": "Primary",
            "Value": "Primary",
            "IsDecision": false,
            "IsDecision2": false
          },
          {
            "Id": "7O00000000003Ah0000",
            "IsDefaultValue": false,
            "Label": "Partner",
            "Value": "Partner",
            "Color": "#268044",
            "IsDecision": false,
            "IsDecision2": false
          },
          {
            "Id": "7O00000000003Ai0000",
            "IsDefaultValue": false,
            "Label": "Supplier",
            "Value": "Supplier",
            "IsDecision": false,
            "IsDecision2": false
          },
          {
            "Id": "7O00000000003Aj0000",
            "IsDefaultValue": false,
            "Label": "Customer",
            "Value": "Customer",
            "IsDecision": false,
            "IsDecision2": false
          },
          {
            "Id": "7O0000000002qUx0000",
            "IsDefaultValue": false,
            "Label": "Arbitrator",
            "Value": "Arbitrator",
            "IsDecision": false,
            "IsDecision2": false
          }
        ],
        "DependentPicklists": {},
        "Validations": []
      }
      // ... other fields
    ]
  }
  // ... other entities
]
```

### Workflow for AI Coding Tools

When an AI coding tool needs to generate code that interacts with Magentrix entities, follow this workflow:

#### Step 1: Read Environment Configuration

Read the `.env.development` file to get:
- `VITE_SITE_URL` - The portal domain
- `VITE_REFRESH_TOKEN` - The refresh token for authentication

#### Step 2: Obtain Access Token

Call the token endpoint to get an access token:

```bash
curl -X POST '{VITE_SITE_URL}/api/3.0/token' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "{VITE_REFRESH_TOKEN}"
  }'
```

Extract the `access_token` from the response.

#### Step 3: Discover Available Entities (Optional)

If you need to know what entities are available:

```bash
curl -X GET '{VITE_SITE_URL}/api/3.0/entity' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer {access_token}'
```

#### Step 4: Get Entity Metadata

For the entities you need to work with, get their metadata:

```bash
curl -X GET '{VITE_SITE_URL}/api/3.0/entity/metadata?entities={entity_names}' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Authorization: Bearer {access_token}'
```

#### Step 5: Generate Accurate Code

Use the metadata to generate code with:
- Correct field names
- Proper TypeScript types
- Valid picklist values
- Accurate MEQL queries

### Example: Using Metadata to Generate TypeScript Interfaces

Based on the metadata response, an AI coding tool can generate accurate TypeScript interfaces:

```typescript
// Generated from Account metadata
interface Account {
  Id: string
  Name: string
  Type?: 'Customer' | 'Partner' | 'Prospect'
  Industry?: 'Technology' | 'Finance' | 'Healthcare'
  AnnualRevenue?: number
  NumberOfEmployees?: number
  Website?: string
  CreatedDate?: string
}

// Generated from Contact metadata
interface Contact {
  Id: string
  FirstName?: string
  LastName: string
  Email?: string
  Phone?: string
  AccountId?: string
  CreatedDate?: string
}
```

### Example: Using Metadata to Generate MEQL Queries

Based on the metadata, generate valid MEQL queries:

```typescript
// Query with correct field names from metadata
const accountQuery = 'SELECT Id, Name, Type, Industry, AnnualRevenue FROM Account WHERE Type = "Customer" LIMIT 10'

// Query with relationship fields
const contactQuery = 'SELECT Id, FirstName, LastName, Email, Account.Name FROM Contact WHERE AccountId != null LIMIT 20'
```

### Example: Using Metadata to Generate Form Components

Based on the metadata, generate form components with proper field types:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'

const dataService = useMagentrixSdk().getInstance(magentrixConfig)

// Generated from metadata
const accountName = ref('')
const accountType = ref<'Customer' | 'Partner' | 'Prospect'>()
const industry = ref<'Technology' | 'Finance' | 'Healthcare'>()
const annualRevenue = ref<number>()
const numberOfEmployees = ref<number>()
const website = ref('')

async function createAccount() {
  await dataService.create({
    objectType: 'Account',
    fields: {
      Name: accountName.value,
      Type: accountType.value,
      Industry: industry.value,
      AnnualRevenue: annualRevenue.value,
      NumberOfEmployees: numberOfEmployees.value,
      Website: website.value
    }
  })
}
</script>

<template>
  <form @submit.prevent="createAccount">
    <!-- Text field (required) -->
    <div class="form-group">
      <label for="name" class="iris-label">Account Name *</label>
      <input
        id="name"
        type="text"
        class="iris-textbox"
        v-model="accountName"
        required
      />
    </div>

    <!-- Picklist field -->
    <div class="form-group">
      <label for="type" class="iris-label">Account Type</label>
      <select id="type" class="iris-textbox" v-model="accountType">
        <option value="">-- Select Type --</option>
        <option value="Customer">Customer</option>
        <option value="Partner">Partner</option>
        <option value="Prospect">Prospect</option>
      </select>
    </div>

    <!-- Picklist field -->
    <div class="form-group">
      <label for="industry" class="iris-label">Industry</label>
      <select id="industry" class="iris-textbox" v-model="industry">
        <option value="">-- Select Industry --</option>
        <option value="Technology">Technology</option>
        <option value="Finance">Finance</option>
        <option value="Healthcare">Healthcare</option>
      </select>
    </div>

    <!-- Currency field -->
    <div class="form-group">
      <label for="revenue" class="iris-label">Annual Revenue</label>
      <input
        id="revenue"
        type="number"
        class="iris-textbox"
        v-model.number="annualRevenue"
      />
    </div>

    <!-- Integer field -->
    <div class="form-group">
      <label for="employees" class="iris-label">Number of Employees</label>
      <input
        id="employees"
        type="number"
        class="iris-textbox"
        v-model.number="numberOfEmployees"
      />
    </div>

    <!-- URL field -->
    <div class="form-group">
      <label for="website" class="iris-label">Website</label>
      <input
        id="website"
        type="url"
        class="iris-textbox"
        v-model="website"
        placeholder="https://example.com"
      />
    </div>

    <button type="submit" class="btn-primary">Create Account</button>
  </form>
</template>
```

### Field Type Mapping

Use this mapping to convert metadata field types to TypeScript types and HTML input types:

| Metadata Type | TypeScript Type | HTML Input Type | Notes |
|---------------|----------------|-----------------|-------|
| `id` | `string` | `text` | Read-only, auto-generated |
| `string` | `string` | `text` | Text input |
| `textarea` | `string` | `textarea` | Multi-line text |
| `email` | `string` | `email` | Email validation |
| `url` | `string` | `url` | URL validation |
| `phone` | `string` | `tel` | Phone number |
| `picklist` | `union type` | `select` | Use picklistValues for options |
| `multipicklist` | `string[]` | `select multiple` | Multiple selection |
| `boolean` | `boolean` | `checkbox` | True/false |
| `int` | `number` | `number` | Integer |
| `double` | `number` | `number` | Decimal |
| `currency` | `number` | `number` | Currency amount |
| `percent` | `number` | `number` | Percentage |
| `date` | `string` | `date` | ISO date format |
| `datetime` | `string` | `datetime-local` | ISO datetime format |
| `reference` | `string` | `text` | Foreign key (ID) |

### Best Practices for AI Coding Tools

1. **Always fetch fresh metadata** - Entity schemas can change, so fetch metadata when generating code
2. **Cache access tokens** - Access tokens are valid for 1 hour, cache and reuse them
3. **Handle required fields** - Mark required fields in generated forms and validation
4. **Use picklist values** - Generate dropdowns with exact picklist values from metadata
5. **Respect field permissions** - Check `createable` and `updateable` flags
6. **Generate TypeScript types** - Create interfaces from metadata for type safety
7. **Include field labels** - Use the `label` property for user-friendly form labels
8. **Handle relationships** - Use relationship metadata to generate related queries
9. **Validate field lengths** - Respect `length` property for string fields
10. **Document generated code** - Add comments indicating the code was generated from metadata

### Common Use Cases

#### Use Case 1: Generate a List View Component

```typescript
// AI Tool: Fetch Account metadata, then generate:
const result = await dataService.query('SELECT Id, Name, Type, Industry FROM Account LIMIT 20')
```

#### Use Case 2: Generate a Create Form

```typescript
// AI Tool: Fetch Account metadata, identify createable fields, generate form with proper types
```

#### Use Case 3: Generate a Detail View

```typescript
// AI Tool: Fetch Account metadata, generate component showing all fields with proper formatting
```

#### Use Case 4: Generate Validation Logic

```typescript
// AI Tool: Use required, length, and type metadata to generate validation rules
```

## Magentrix SDK Integration

### Overview

The `@magentrix-corp/magentrix-sdk` package provides JavaScript/TypeScript APIs for interacting with the Magentrix platform.

**Official Documentation:** https://www.npmjs.com/package/@magentrix-corp/magentrix-sdk

**Current Version in Template:** `^1.0.6`

### Installation

The SDK is already included in the template's dependencies. If you need to add it to an existing project:

```bash
npm install @magentrix-corp/magentrix-sdk
```

### SDK Initialization

The SDK requires configuration before use. In local development, you'll use the refresh token from your environment configuration. The SDK automatically manages sessions - it will create a session if one doesn't exist or refresh it if expired.


### Common SDK Usage Patterns

#### Executing MEQL Queries

```typescript
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'

// magentrixConfig is automatically populated from environment variables
const dataService = useMagentrixSdk().getInstance(magentrixConfig)

// Execute a MEQL query
async function fetchAccounts() {
  try {
    const result = await dataService.query('SELECT Id, Name, Type FROM Account WHERE Status = "Active" LIMIT 10')

    return result.data
  } catch (error) {
    console.error('Query failed:', error)
    throw error
  }
}
```

#### Retrieving a Single Record

```typescript
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'

// magentrixConfig is automatically populated from environment variables
const dataService = useMagentrixSdk().getInstance(magentrixConfig)

async function getAccountById(accountId: string) {
  try {
    const result = await dataService.retrieve(accountId)
    return result.record
  } catch (error) {
    console.error('Failed to retrieve account:', error)
    throw error
  }
}
```

#### Getting Current User Information

```typescript
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'
import { MagentrixError, type UserInfo } from '@magentrix-corp/magentrix-sdk'

// magentrixConfig is automatically populated from environment variables
const dataService = useMagentrixSdk().getInstance(magentrixConfig)

async function getCurrentUser() {
  try {
    const userInfo: UserInfo = await dataService.getUserInfo()
    console.log('User Name:', userInfo.name)
    console.log('Username:', userInfo.userName)
    console.log('User ID:', userInfo.id)
    console.log('Role Type:', userInfo.roleType)
    console.log('Locale:', userInfo.locale)
    console.log('Preferred Currency:', userInfo.preferred_currency)
    console.log('Currency Symbol:', userInfo.userCurrencySymbol)
    console.log('Timezone Offset:', userInfo.user_timezone)
    console.log('Is Guest:', userInfo.guest)
    console.log('Is Impersonating:', userInfo.impr)
    return userInfo
  } catch (error) {
    if (error instanceof MagentrixError) {
      console.error('Failed to get user info:', error.message)
    }
    throw error
  }
}
```

**UserInfo Response Properties:**
- `name` - Full name of the current user
- `userName` - Username of the current user
- `id` - Unique identifier for the user
- `roleType` - User's role type in the portal
- `locale` - User's locale setting
- `preferred_currency` - User's preferred currency code
- `userCurrencySymbol` - Currency symbol for the user's preferred currency
- `user_timezone` - User's timezone offset
- `guest` - Boolean indicating if the user is a guest
- `impr` - Boolean indicating if the current session is impersonating another user

#### Creating Records

```typescript
async function createContact(contactData: any) {
  try {
    const result = await dataService.create({
      objectType: 'Contact',
      fields: {
        FirstName: contactData.firstName,
        LastName: contactData.lastName,
        Email: contactData.email,
        Phone: contactData.phone
      }
    })

    return result.id
  } catch (error) {
    console.error('Failed to create contact:', error)
    throw error
  }
}
```

#### Updating Records

```typescript
async function updateAccount(accountId: string, updates: any) {
  try {
    await dataService.update({
      id: accountId,
      fields: updates
    })

    console.log('Account updated successfully')
  } catch (error) {
    console.error('Failed to update account:', error)
    throw error
  }
}
```

#### Deleting Records

```typescript
async function deleteRecord(recordId: string) {
  try {
    await dataService.delete(recordId)

    console.log('Record deleted successfully')
  } catch (error) {
    console.error('Failed to delete record:', error)
    throw error
  }
}
```

#### Calling Custom Controller Actions with Execute

The `execute` method allows you to call custom controller actions on the server to get data or perform operations that aren't covered by standard CRUD operations.

**Method Signature:**
```typescript
async execute(path: string, model: any = null, method = RequestMethod.post): Promise<any>
```

**Parameters:**
- `path` (required) - The endpoint path for your custom controller action
- `model` (optional) - Data to send with the request (for POST requests)
- `method` (optional) - HTTP method: `RequestMethod.get` or `RequestMethod.post` (defaults to POST)

**Important Rules:**
- GET requests cannot have a request body (model parameter is ignored)
- POST requests can include a model/data object
- Data is automatically converted to form-encoded format

**Example 1: GET Request to Fetch Custom Data**

```typescript
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk, RequestMethod } from '@magentrix-corp/magentrix-sdk/vue'

const dataService = useMagentrixSdk().getInstance(magentrixConfig)

// Call a invoicebuilder controller action to get all the data needed for the invoice component
async function getAllInvoiceData() {
  try {
    const result = await dataService.execute(
      '/invoicebuilder/getalldata/',
      null,
      RequestMethod.get
    )

    return result
  } catch (error) {
    console.error('Failed to fetch invoice data:', error)
    throw error
  }
}
```

**Example 2: POST Request to Perform an Action**

```typescript
// Call a invoicebuilder controller action to process a bulk operation
async function processBulkUpdate(accountIds: string[], status: string) {
  try {
    const result = await dataService.execute(
      '/invoicebuilder/bulkupdatestatus',
      {
        accountIds: accountIds.join(','),
        newStatus: status,
        updatedBy: '{current-user-id}'
      },
      RequestMethod.post
    )

    return result
  } catch (error) {
    console.error('Failed to process bulk update:', error)
    throw error
  }
}
```

**Example 3: POST Request with Complex Data**

```typescript
// Call a custom controller action to generate a report
async function generateCustomReport(filters: any) {
  try {
    const result = await dataService.execute(
      '/invoicebuilder/generatereport',
      {
        reportType: filters.type,
        startDate: filters.startDate,
        endDate: filters.endDate,
        includeDetails: filters.detailed ? 'true' : 'false'
      }
    )

    return result
  } catch (error) {
    console.error('Failed to generate report:', error)
    throw error
  }
}
```

**Example 4: Using Execute in a Vue Component**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk, RequestMethod } from '@magentrix-corp/magentrix-sdk/vue'

interface SalesData {
  totalRevenue: number
  totalDeals: number
  conversionRate: number
}

const salesData = ref<SalesData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const dataService = useMagentrixSdk().getInstance(magentrixConfig)

async function loadSalesData() {
  loading.value = true
  error.value = null

  try {
    const result = await dataService.execute(
      '/invoicebuilder/getsalesdashboard',
      null,
      RequestMethod.get
    )

    salesData.value = result
  } catch (err) {
    error.value = 'Failed to load sales data'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSalesData()
})
</script>

<template>
  <div class="sales-dashboard">
    <div v-if="loading" class="loading">Loading sales data...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="salesData" class="data">
      <p>Total Revenue: ${{ salesData.totalRevenue }}</p>
      <p>Total Deals: {{ salesData.totalDeals }}</p>
      <p>Conversion Rate: {{ salesData.conversionRate }}%</p>
    </div>
  </div>
</template>
```

**Best Practices:**

1. **Always handle errors** - Wrap execute calls in try-catch blocks
2. **Use appropriate HTTP methods** - Use GET for retrieving data, POST for actions
3. **Validate input** - Ensure required parameters are provided before calling execute
4. **Type your responses** - Define interfaces for expected response data
5. **Show loading states** - Provide user feedback while requests are in progress
6. **Document your endpoints** - Keep track of custom controller paths and their parameters

### Using SDK in Vue Components

#### Composition API Example - Query Records

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'

interface Account {
  Id: string
  Name: string
  Type: string
}

const accounts = ref<Account[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const dataService = useMagentrixSdk().getInstance(magentrixConfig)

async function loadAccounts() {
  loading.value = true
  error.value = null

  try {
    const result = await dataService.query('SELECT Id, Name, Type FROM Account LIMIT 20')

    accounts.value = result.data
  } catch (err) {
    error.value = 'Failed to load accounts'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAccounts()
})
</script>

<template>
  <div>
    <h2>Accounts</h2>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <ul v-else>
      <li v-for="account in accounts" :key="account.Id">
        {{ account.Name }} ({{ account.Type }})
      </li>
    </ul>
  </div>
</template>
```

#### Composition API Example - Retrieve Single Record

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'

interface Props {
  accountId: string
}

const props = defineProps<Props>()
const account = ref<any>(null)
const loading = ref(false)
const dataService = useMagentrixSdk().getInstance(magentrixConfig)

onMounted(async () => {
  loading.value = true

  try {
    account.value = (await dataService.retrieve(props.accountId)).record
    console.log(account.value)
  } catch (error) {
    console.error('Failed to load account:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="account">
    <h2>{{ account.Name }}</h2>
    <p>Type: {{ account.Type }}</p>
    <p>Industry: {{ account.Industry }}</p>
  </div>
</template>
```

### SDK Best Practices

1. **Session Management**: The SDK automatically manages sessions - no need to call `createSession()` manually. The SDK will create a session if one doesn't exist or refresh it if expired.
2. **Error Handling**: Always wrap SDK calls in try-catch blocks
3. **Loading States**: Show loading indicators during async operations
4. **Type Safety**: Define TypeScript interfaces for query results
5. **Composables**: Create reusable composables for common SDK operations
6. **Caching**: Consider caching frequently accessed data to reduce API calls
7. **Configuration**: Configure the SDK once and reuse the dataService instance across your application

---

## MEQL Database Query Language

### Overview

**MEQL (Magentrix SQL)** is a SQL-like query language for querying the Magentrix database. It provides a familiar syntax for developers with SQL experience while being optimized for the Magentrix data model.

### Official Documentation

- **MEQL Reference:** https://help.magentrix.com/wikis/devguide/magentrix-sql-reference
- **Advanced Functions:** https://help.magentrix.com/wikis/devguide/magentrix-sql-advanced-functions

### Basic MEQL Syntax

#### SELECT Statement

```sql
SELECT field1, field2, field3
FROM ObjectType
WHERE condition
ORDER BY field1 ASC
LIMIT take, skip
```

#### Common Query Examples

**1. Simple SELECT with WHERE clause:**

```sql
SELECT Id, Name, Email, CreatedDate
FROM Contact
WHERE Status = 'Active'
LIMIT 50
```

**2. Using AND/OR operators:**

```sql
SELECT Id, Name, Industry, AnnualRevenue
FROM Account
WHERE Industry = 'Technology' AND AnnualRevenue > 1000000
ORDER BY AnnualRevenue DESC
```

**3. Using functions to check for null or empty values:**

```sql
SELECT Id, Name, Type
FROM Account
WHERE String.IsNullOrEmpty(Industry)
```

**4. Using functions to match patterns:**

```sql
SELECT Id, FirstName, LastName, Email
FROM Contact
WHERE Email.Contains("@example.com")
```

**5. Date comparisons:**

```sql
SELECT Id, Name, CreatedDate
FROM Opportunity
WHERE CreatedDate >= '2024-01-01' AND CreatedDate < '2024-12-31'
```

### Advanced MEQL Features

#### Aggregate Functions

```sql
-- COUNT
SELECT COUNT(Id) as TotalAccounts
FROM Account

-- SUM
SELECT SUM(Amount) as TotalRevenue
FROM Opportunity
WHERE Stage = 'Closed Won'

-- AVG
SELECT AVG(AnnualRevenue) as AverageRevenue
FROM Account
WHERE Industry = 'Technology'

-- MIN and MAX
SELECT MIN(CreatedDate) as FirstCreated, MAX(CreatedDate) as LastCreated
FROM Contact
```

#### GROUP BY

```sql
SELECT Industry, COUNT(Id) as AccountCount
FROM Account
GROUP BY Industry
ORDER BY AccountCount DESC
```

#### Relationship Queries

```sql
-- Query related records
SELECT Id, Name, Account.Name, Account.Industry
FROM Contact
WHERE Account.Industry = 'Healthcare'
```

### MEQL in Iris Applications

#### Executing MEQL via SDK

```typescript
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'

const dataService = useMagentrixSdk().getInstance(magentrixConfig)

async function executeCustomQuery(objectType: string, filters: any) {
  const whereClause = Object.entries(filters)
    .map(([key, value]) => `${key} = '${value}'`)
    .join(' AND ')

  const query = `SELECT Id, Name FROM ${objectType} WHERE ${whereClause}`

  const result = await dataService.query(query)
  return result.data
}
```

#### Dynamic Query Building

```typescript
interface QueryBuilder {
  select: string[]
  from: string
  where: string[]
  orderBy?: string
  limit?: number,
  offset?: number
}

function buildMEQLQuery(builder: QueryBuilder): string {
  let query = `SELECT ${builder.select.join(', ')} FROM ${builder.from}`

  if (builder.where.length > 0)
    query += ` WHERE ${builder.where.join(' AND ')}`

  if (builder.orderBy)
    query += ` ORDER BY ${builder.orderBy}`

  if (builder.limit) {

    if (builder.offset) 
      query += ` LIMIT ${builder.limit},${builder.offset}`
    
    query += ` LIMIT ${builder.limit}`
  }

  return query
}

// Usage with SDK
async function queryWithBuilder() {
  const query = buildMEQLQuery({
    select: ['Id', 'Name', 'Email'],
    from: 'Contact',
    where: ['Status = \'Active\'', 'Email IS NOT NULL'],
    orderBy: 'Name ASC',
    limit: 100
  })

  const result = await dataService.query(query)
  return result.data
}
```

### MEQL Best Practices

1. **Always use LIMIT**: Prevent accidentally fetching too many records, Max 10,000 records can be returned if no limit is specified.
2. **Index-aware queries**: Filter on indexed fields for better performance
3. **Avoid SELECT ***: Only select the fields you need
4. **Parameterize values**: Escape single quotes in string values
5. **Use appropriate operators**: Use `IN` for multiple values instead of multiple `OR` conditions
6. **Date formats**: Use ISO 8601 format (YYYY-MM-DD) for dates

---

## Development Guidelines for AI Agents

### Key Architectural Patterns

#### 1. Component Organization

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (buttons, inputs, etc.)
│   └── features/       # Feature-specific components
├── views/              # Page-level components (routes)
├── composables/        # Reusable composition functions
├── services/           # Business logic and API calls
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

#### 2. Composables Pattern

Create reusable composables for SDK interactions:

```typescript
// src/composables/useAccounts.ts
import { ref, type Ref } from 'vue'
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'

export interface Account {
  Id: string
  Name: string
  Type: string
  Industry: string
}

const dataService = useMagentrixSdk().getInstance(magentrixConfig)

export function useAccounts() {
  const accounts: Ref<Account[]> = ref([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAccounts(filters?: Record<string, any>) {
    loading.value = true
    error.value = null

    try {
      let query = 'SELECT Id, Name, Type, Industry FROM Account'

      if (filters) {
        const whereClause = Object.entries(filters)
          .map(([key, value]) => `${key} = '${value}'`)
          .join(' AND ')
        query += ` WHERE ${whereClause}`
      }

      query += ' LIMIT 100'

      const result = await dataService.query(query)
      accounts.value = result.data
    } catch (err) {
      error.value = 'Failed to fetch accounts'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  return {
    accounts,
    loading,
    error,
    fetchAccounts
  }
}
```

Usage in component:

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useAccounts } from '@/composables/useAccounts'

const { accounts, loading, error, fetchAccounts } = useAccounts()

onMounted(() => {
  fetchAccounts({ Type: 'Customer' })
})
</script>
```

#### 3. Service Layer Pattern

Separate business logic from components:

```typescript
// src/services/accountService.ts
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'

const dataService = useMagentrixSdk().getInstance(magentrixConfig)

export class AccountService {
  static async getAccountById(id: string) {
    const result = await dataService.retrieve(id)
    return result.record
  }

  static async createAccount(data: any) {
    return await dataService.create({
      objectType: 'Account',
      fields: data
    })
  }

  static async updateAccount(id: string, data: any) {
    return await dataService.update({
      id,
      fields: data
    })
  }

  static async deleteAccount(id: string) {
    return await dataService.delete(id)
  }
}
```

### Important Configuration Files

#### 1. Environment Files

**`.env.development`** - Local development configuration (gitignored)

**Purpose**: Contains sensitive development credentials

**Required Variables:**
- `VITE_SITE_URL` - Your Magentrix portal URL
- `VITE_REFRESH_TOKEN` - Authentication token for local development

**Security:** Never commit this file to version control

#### 1.5. `src/env-helper.ts`

**Purpose**: Pre-configured SDK settings from environment variables

**Usage:**
```typescript
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'

// magentrixConfig is automatically populated from environment variables
const dataService = useMagentrixSdk().getInstance(magentrixConfig)
```

**Available Properties:**
- `magentrixConfig.baseUrl` - From VITE_SITE_URL
- `magentrixConfig.refreshToken` - From VITE_REFRESH_TOKEN
- `magentrixConfig.isDevMode` - Automatically set based on MODE

#### 2. `src/config.ts`

**Purpose**: Application metadata and configuration

**Required Configuration:**
```typescript
export const config = {
  appSlug: 'your-app-slug',          // REQUIRED: URL-friendly slug
  appName: 'Your App Name',          // REQUIRED: Display name
  appDescription: 'Description',     // OPTIONAL: Brief description
  appIconId: 'icon-id',             // OPTIONAL: Icon identifier for the app (should be valid TabStyle ID)
}
```

**Critical Rules:**
- `appSlug` and `appName` are REQUIRED and must be configured before deployment
- `appSlug` must match `package.json` name
- `appSlug` is used in the deployment path: `<portal-url>/iris-app/{appSlug}/`
- `appDescription` and `appIconId` are optional

#### 3. `vite.config.ts`

**Purpose**: Build configuration and module federation setup

**Key Sections:**
- **Base Path**: Automatically set based on environment
  - Development: `/`
  - Production: `/contents/iris-app/{appSlug}/`
- **Module Federation**: Exposes `./AppEntry` pointing to `./src/main.ts`
- **Shared Dependencies**: Vue and Vue Router are singletons
- **HTTPS**: Development server uses HTTPS (required for module federation)

**When to Modify:**
- Adding new shared dependencies
- Changing exposed modules
- Adjusting build output configuration
- Adding Vite plugins

#### 4. `package.json`

**Purpose**: Project metadata and dependencies

**Critical Rules:**
- `name` must match `config.appPath`
- Keep `type: "module"` for ES modules
- Maintain Node.js engine requirements: `^20.19.0 || >=22.12.0`

#### 5. `tsconfig.json` / `env.d.ts`

**Purpose**: TypeScript compiler configuration and type definitions

**Key Settings:**
- Path alias `@` points to `./src`
- Strict mode enabled for type safety
- Vue 3 JSX support
- `env.d.ts` contains environment variable type definitions

### TypeScript Best Practices

#### 1. Define Interfaces for Data Models

```typescript
// src/types/models.ts
export interface Account {
  Id: string;
  Name: string;
  Type: 'Customer' | 'Partner' | 'Prospect';
  Industry: string;
  AnnualRevenue?: number;
  CreatedDate: string;
}

export interface Contact {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  AccountId?: string;
  Account?: Account;
}

export interface QueryResult<T> {
  records: T[];
  totalSize: number;
  done: boolean;
}
```

#### 2. Type SDK Responses

```typescript
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'

interface Account {
  Id: string
  Name: string
  Type: string
  Industry: string
}

const dataService = useMagentrixSdk().getInstance(magentrixConfig)

async function fetchAccounts(): Promise<Account[]> {
  const result = await dataService.query('SELECT Id, Name, Type, Industry FROM Account LIMIT 10')
  return result.data as Account[]
}
```

#### 3. Use Enums for Constants

```typescript
// src/types/enums.ts
export enum AccountType {
  Customer = 'Customer',
  Partner = 'Partner',
  Prospect = 'Prospect'
}

export enum OpportunityStage {
  Prospecting = 'Prospecting',
  Qualification = 'Qualification',
  Proposal = 'Proposal',
  ClosedWon = 'Closed Won',
  ClosedLost = 'Closed Lost'
}
```

### Vue 3 Composition API Conventions

#### 1. Use `<script setup>` Syntax

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// Props
interface Props {
  accountId: string;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});

// Emits
interface Emits {
  (e: 'save', data: any): void;
  (e: 'cancel'): void;
}

const emit = defineEmits<Emits>();

// Reactive state
const account = ref<Account | null>(null);
const loading = ref(false);

// Computed
const displayName = computed(() => {
  return account.value?.Name || 'Unknown';
});

// Methods
async function loadAccount() {
  loading.value = true;
  // ... load logic
  loading.value = false;
}

// Lifecycle
onMounted(() => {
  loadAccount();
});
</script>
```

#### 2. Reactive State Management

```typescript
import { ref, reactive, toRefs } from 'vue';

// Use ref for primitives
const count = ref(0);
const message = ref('Hello');

// Use reactive for objects
const state = reactive({
  user: null,
  isAuthenticated: false,
  permissions: []
});

// Convert reactive to refs when returning from composable
function useAuth() {
  const state = reactive({
    user: null,
    isAuthenticated: false
  });

  return {
    ...toRefs(state)
  };
}
```

#### 3. Proper Prop Validation

```vue
<script setup lang="ts">
interface Props {
  // Required prop
  id: string;

  // Optional prop with default
  title?: string;

  // Prop with validator
  status?: 'active' | 'inactive' | 'pending';

  // Complex object prop
  config?: {
    showHeader: boolean;
    maxItems: number;
  };
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Default Title',
  status: 'active',
  config: () => ({
    showHeader: true,
    maxItems: 10
  })
});
</script>
```

### Routing Best Practices

#### 1. Define Routes with TypeScript

```typescript
// src/router/index.ts
import type { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/accounts',
    name: 'accounts',
    component: () => import('@/views/AccountsView.vue')
  },
  {
    path: '/accounts/:id',
    name: 'account-detail',
    component: () => import('@/views/AccountDetailView.vue'),
    props: true
  }
];
```

#### 2. Use Route Guards

The template includes a built-in `beforeEach` navigation guard inside the `createAppRouter()` factory function (`src/router/index.ts`). This guard automatically checks app access permissions via `sdk.getIrisAppAccessInfo(config.appSlug)` and redirects unauthorized users using `sdk.forwardToUnauthorizedPath()`.

`getIrisAppAccessInfo` accepts an optional second parameter `checkAppAccess` (boolean, defaults to `true`). Pass `false` to skip the permission check for better performance when menu item security is not needed.

To customize security behavior (e.g., per-route access control or disabling security), modify the `beforeEach` guard inside `createAppRouter()`. See the **App Security** section in the project README for examples.

For general route guard patterns beyond security, refer to the [Vue Router documentation](https://router.vuejs.org/guide/advanced/navigation-guards.html).

### Error Handling Patterns

#### 1. Global Error Handler

```typescript
// src/utils/errorHandler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError('An unknown error occurred');
}
```

#### 2. Component Error Handling

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { handleError } from '@/utils/errorHandler';

const error = ref<string | null>(null);

async function performAction() {
  error.value = null;

  try {
    // ... SDK call
  } catch (err) {
    const appError = handleError(err);
    error.value = appError.message;
    console.error('Action failed:', appError);
  }
}
</script>

<template>
  <div v-if="error" class="error-message">
    {{ error }}
  </div>
</template>
```

### Magentrix Portal CSS Classes

The Magentrix portal provides pre-defined CSS classes that ensure your Iris app's UI components match the portal's design system. Using these classes ensures visual consistency and proper theming.

#### Button Classes

**Primary Button (`btn-primary`)**

Use for primary actions and main call-to-action buttons:

```vue
<template>
  <button class="btn-primary">
    Save Changes
  </button>

  <button class="btn-primary" @click="handleSubmit">
    Submit Form
  </button>
</template>
```

**Other Button Classes:**

```vue
<template>
  <!-- Secondary button -->
  <button class="btn-secondary">
    Cancel
  </button>

  <!-- Light button (outlined style) -->
  <button class="btn-light">
    View Details
  </button>

  <!-- Danger/Delete button -->
  <button class="btn-danger">
    Delete
  </button>

  <!-- Success button -->
  <button class="btn-success">
    Approve
  </button>

  <!-- Info button -->
  <button class="btn-info">
    Learn More
  </button>

  <!-- Warning button -->
  <button class="btn-warning">
    Proceed with Caution
  </button>
</template>
```

#### Form Label Classes

**Form Label (`iris-label`)**

Use for form labels to match the portal's label styling:

```vue
<template>
  <div>
    <label for="account-name" class="iris-label">Account Name</label>
    <input
      id="account-name"
      type="text"
      class="iris-textbox"
      v-model="accountName"
    />
  </div>

  <div>
    <label for="email" class="iris-label">Email Address</label>
    <input
      id="email"
      type="email"
      class="iris-textbox"
      v-model="email"
    />
  </div>
</template>
```

#### Input Classes

**Text Input (`iris-textbox`)**

Use for all text input fields to match the portal's input styling:

```vue
<template>
  <div>
    <label for="account-name" class="iris-label">Account Name</label>
    <input
      id="account-name"
      type="text"
      class="iris-textbox"
      v-model="accountName"
      placeholder="Enter account name"
    />
  </div>

  <div>
    <label for="email" class="iris-label">Email Address</label>
    <input
      id="email"
      type="email"
      class="iris-textbox"
      v-model="email"
      placeholder="user@example.com"
    />
  </div>

  <div>
    <label for="description" class="iris-label">Description</label>
    <textarea
      id="description"
      class="iris-textbox"
      v-model="description"
      rows="4"
      placeholder="Enter description"
    ></textarea>
  </div>
</template>
```

#### Alert Classes

Use alert classes to display important messages to users:

```vue
<template>
  <!-- Success alert -->
  <div class="alert alert-success">
    Account created successfully!
  </div>

  <!-- Info alert -->
  <div class="alert alert-info">
    Please review the information before submitting.
  </div>

  <!-- Warning alert -->
  <div class="alert alert-warning">
    This action cannot be undone.
  </div>

  <!-- Danger/Error alert -->
  <div class="alert alert-danger">
    Failed to save changes. Please try again.
  </div>
</template>
```

**Alert with Dynamic Content:**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const message = ref<string | null>(null)
const messageType = ref<'success' | 'info' | 'warning' | 'danger'>('info')

function showSuccess(msg: string) {
  message.value = msg
  messageType.value = 'success'
}

function showError(msg: string) {
  message.value = msg
  messageType.value = 'danger'
}
</script>

<template>
  <div v-if="message" :class="['alert', `alert-${messageType}`]">
    {{ message }}
  </div>
</template>
```

#### Complete Form Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'

const dataService = useMagentrixSdk().getInstance(magentrixConfig)

const accountName = ref('')
const email = ref('')
const phone = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  if (!accountName.value || !email.value) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true
  error.value = null

  try {
    await dataService.create({
      objectType: 'Account',
      fields: {
        Name: accountName.value,
        Email: email.value,
        Phone: phone.value
      }
    })

    // Reset form
    accountName.value = ''
    email.value = ''
    phone.value = ''

    alert('Account created successfully!')
  } catch (err) {
    error.value = 'Failed to create account'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  accountName.value = ''
  email.value = ''
  phone.value = ''
  error.value = null
}
</script>

<template>
  <div class="form-container">
    <h2>Create New Account</h2>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="account-name" class="iris-label">Account Name *</label>
        <input
          id="account-name"
          type="text"
          class="iris-textbox"
          v-model="accountName"
          placeholder="Enter account name"
          required
        />
      </div>

      <div class="form-group">
        <label for="email" class="iris-label">Email *</label>
        <input
          id="email"
          type="email"
          class="iris-textbox"
          v-model="email"
          placeholder="user@example.com"
          required
        />
      </div>

      <div class="form-group">
        <label for="phone" class="iris-label">Phone</label>
        <input
          id="phone"
          type="tel"
          class="iris-textbox"
          v-model="phone"
          placeholder="(555) 123-4567"
        />
      </div>

      <div class="form-actions">
        <button
          type="submit"
          class="btn-primary"
          :disabled="loading"
        >
          {{ loading ? 'Creating...' : 'Create Account' }}
        </button>

        <button
          type="button"
          class="btn-secondary"
          @click="handleCancel"
          :disabled="loading"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.error-message {
  padding: 12px;
  margin-bottom: 16px;
  background-color: var(--error-bg, #fee);
  color: var(--error-text, #c00);
  border-radius: 4px;
}
</style>
```

#### Best Practices for Portal CSS Classes

1. **Always use portal classes for form elements** - Use `iris-textbox` for inputs and `btn-primary` for buttons
2. **Combine with Tailwind utilities** - Portal classes handle theming, Tailwind handles layout
3. **Don't override portal class styles** - These classes ensure consistency with the portal theme
4. **Use semantic button classes** - Choose the appropriate button class based on the action type
5. **Test in the portal** - Always verify your UI looks correct when deployed to the portal

#### Critical CSS Scoping Rules

**⚠️ NEVER apply CSS to `<html>`, `<head>`, or `<body>` elements!**

Your Iris app runs inside the Magentrix portal as a microfrontend. Applying global styles to `<html>`, `<head>`, or `<body>` will break the entire portal's styling and affect other applications.

**✅ DO:**
- Always use `scoped` styles in Vue components
- Scope custom CSS to your app's root element or specific components
- Use component-specific class names

**❌ DON'T:**
- Never add global styles that target `html`, `head`, or `body`
- Never use unscoped styles that could leak to the portal
- Never override portal-level CSS variables or global styles

**Correct Example - Scoped Styles:**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref(['Item 1', 'Item 2', 'Item 3'])
</script>

<template>
  <div class="my-app-container">
    <h1 class="my-app-title">My Application</h1>
    <ul class="my-app-list">
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
  </div>
</template>

<style scoped>
/* ✅ CORRECT: Scoped to this component only */
.my-app-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.my-app-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
}

.my-app-list {
  list-style: none;
  padding: 0;
}

.my-app-list li {
  padding: 8px;
  border-bottom: 1px solid #eee;
}
</style>
```

**Incorrect Example - Global Styles:**

```vue
<template>
  <div class="my-app">
    <h1>My Application</h1>
  </div>
</template>

<style>
/* ❌ WRONG: This will break the entire portal! */
body {
  font-family: 'Custom Font', sans-serif;
  background-color: #f0f0f0;
}

html {
  font-size: 16px;
}

/* ❌ WRONG: Unscoped styles can leak to other apps */
h1 {
  color: red;
}
</style>
```

**Using CSS Modules (Alternative to Scoped):**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const items = ref(['Item 1', 'Item 2', 'Item 3'])
</script>

<template>
  <div :class="$style.container">
    <h1 :class="$style.title">My Application</h1>
    <ul :class="$style.list">
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
  </div>
</template>

<style module>
/* ✅ CORRECT: CSS Modules automatically scope styles */
.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
}

.list {
  list-style: none;
  padding: 0;
}

.list li {
  padding: 8px;
  border-bottom: 1px solid #eee;
}
</style>
```

**Key Takeaways:**
1. **Always use `<style scoped>`** or CSS Modules in your Vue components
2. **Never target global elements** like `html`, `head`, `body`, or unqualified tag selectors
3. **Use specific class names** to avoid conflicts with the portal or other apps
4. **Test in the portal** to ensure your styles don't leak or break the portal's UI

### Magentrix Theming and CSS Variables

The Magentrix portal provides a comprehensive theming system using CSS variables. These variables are **dynamically calculated at runtime** via the theme designer, allowing portal administrators to customize branding colors and fonts.

**⚠️ Important Notes:**
- CSS variable values are **NOT fixed** - they change based on the portal's theme configuration
- Most text fonts, headings, and link colors are **already globally applied**
- Use these CSS variables **only when building custom Vue.js components** that need to match the portal's look and feel
- **Never hardcode colors** - always use CSS variables to ensure your app adapts to theme changes

#### Text Color Variables

The portal provides a main text color and five shades for different scenarios:

```css
--mag-page-text-color: #333;  /* Main text color used throughout the portal */
--mag-base: #000;              /* Base color for creating shades */
--mag-base-100: #222;          /* Darker shade 1 */
--mag-base-200: #333;          /* Selected text color (same as --mag-page-text-color) */
--mag-base-300: #555;          /* Lighter shade 1 - used for inputs */
--mag-base-400: #777;          /* Lighter shade 2 - used for muted text, labels, badges */
--mag-base-500: #eee;          /* Lighter shade 3 - used for disabled backgrounds */
```

**Usage Examples:**

```vue
<template>
  <div class="my-component">
    <h2 class="title">Account Details</h2>
    <p class="description">View and manage account information</p>
    <input type="text" class="custom-input" placeholder="Enter name" />
    <span class="muted-text">Last updated: 2 hours ago</span>
  </div>
</template>

<style scoped>
.my-component {
  color: var(--mag-page-text-color);
}

.title {
  color: var(--mag-base-200);
  font-weight: bold;
}

.description {
  color: var(--mag-base-300);
}

.custom-input::placeholder {
  color: var(--mag-base-400);
}

.muted-text {
  color: var(--mag-base-400);
  font-size: 0.875rem;
}
</style>
```

#### Background and Border Color Variables

The portal provides background colors and border colors that adapt to the theme:

```css
/* Background Colors */
--mag-page-bg-color: #fff;     /* Main portal background */
--mag-page-bg-100: #fff;       /* Lighter shade (always lighter than bg) */
--mag-page-bg-200: #f9f9f9;    /* Used for buttons, sidebars */
--mag-page-bg-300: #f5f5f5;    /* Used for panel footers, hover states */

/* Border Colors */
--mag-element-border-color: #ddd;           /* Distinct border color */
--mag-element-border-focus-color: #66afe9;  /* Focus state borders */
--mag-border-muted-color: #e6e6e6;          /* Main border color (subtle) */
```

**Usage Examples:**

```vue
<template>
  <div class="card">
    <div class="card-header">
      <h3>Account Information</h3>
    </div>
    <div class="card-body">
      <p>Account details go here</p>
    </div>
    <div class="card-footer">
      <button class="action-btn">Save Changes</button>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--mag-page-bg-color);
  border: 1px solid var(--mag-border-muted-color);
  border-radius: 4px;
}

.card-header {
  background: var(--mag-page-bg-200);
  border-bottom: 1px solid var(--mag-border-muted-color);
  padding: 16px;
}

.card-body {
  padding: 16px;
}

.card-footer {
  background: var(--mag-page-bg-300);
  border-top: 1px solid var(--mag-border-muted-color);
  padding: 12px 16px;
}

.action-btn:focus {
  border-color: var(--mag-element-border-focus-color);
  outline: none;
}
</style>
```

#### Primary Color Variables

Primary colors are used for links, primary buttons, and primary backgrounds:

```css
--mag-primary-color: #3884c7;        /* Primary brand color */
--mag-primary-text-color: #fff;      /* Text color on primary backgrounds */
--mag-primary-hover-color: #337ab7;  /* Hover state for primary elements */
```

**Usage Examples:**

```vue
<template>
  <div class="actions">
    <a href="#" class="primary-link">View Details</a>
    <button class="custom-primary-btn">Submit</button>
  </div>
</template>

<style scoped>
.primary-link {
  color: var(--mag-primary-color);
  text-decoration: none;
}

.primary-link:hover {
  color: var(--mag-primary-hover-color);
  text-decoration: underline;
}

.custom-primary-btn {
  background: var(--mag-primary-color);
  color: var(--mag-primary-text-color);
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.custom-primary-btn:hover {
  background: var(--mag-primary-hover-color);
}
</style>
```

#### Secondary Color Variables

Secondary colors are mainly used for secondary buttons and alternative UI elements:

```css
--mag-secondary-color: #fff;              /* Secondary background color */
--mag-secondary-text-color: #333;         /* Text color on secondary backgrounds */
--mag-secondary-border-color: #ccc;       /* Border color for secondary elements */
```

**Usage Examples:**

```vue
<template>
  <button class="custom-secondary-btn">Cancel</button>
  <span class="tag">Published</span>
</template>

<style scoped>
.custom-secondary-btn {
  background: var(--mag-secondary-color);
  color: var(--mag-secondary-text-color);
  border: 1px solid var(--mag-secondary-border-color);
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.tag {
  background: var(--mag-secondary-color);
  color: var(--mag-secondary-text-color);
  border: 1px solid var(--mag-secondary-border-color);
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 0.875rem;
}
</style>
```

#### Navigation Color Variables

Navigation colors are used for navigation menus and sidebars:

```css
--mag-nav-bg-color: #f8f8f8;         /* Navigation background */
--mag-nav-hover-bg-color: #f8f8f8;   /* Navigation hover state */
--mag-nav-active-bg-color: #f8f8f8;  /* Active navigation item */
--mag-nav-text-color: #777;          /* Navigation text color */
```

#### Header Color Variables

Header colors are used for the top header bar:

```css
--mag-header-bg-color: #222;    /* Header background color */
--mag-header-text-color: #fff;  /* Header text color */
```

**Usage Example:**

```vue
<template>
  <div class="app-header">
    <h1>My Application</h1>
    <nav class="app-nav">
      <a href="#" class="nav-item">Dashboard</a>
      <a href="#" class="nav-item active">Accounts</a>
    </nav>
  </div>
</template>

<style scoped>
.app-header {
  background: var(--mag-header-bg-color);
  color: var(--mag-header-text-color);
  padding: 12px 20px;
}

.app-nav {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.nav-item {
  color: var(--mag-header-text-color);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 4px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
}
</style>
```

#### Font Variables

Font variables ensure your text matches the portal's typography:

```css
--mag-primary-font: Arial;   /* Main font family */
--mag-heading-font: Arial;   /* Heading font family */
```

**Usage Example:**

```vue
<template>
  <div class="content">
    <h1 class="heading">Welcome</h1>
    <p class="body-text">This is the main content area.</p>
  </div>
</template>

<style scoped>
.heading {
  font-family: var(--mag-heading-font);
  font-size: 2rem;
  font-weight: bold;
}

.body-text {
  font-family: var(--mag-primary-font);
  line-height: 1.6;
}
</style>
```

#### Layout Variables

```css
--mag-page-width: 1320px;  /* Maximum page width */
```

**Usage Example:**

```vue
<template>
  <div class="container">
    <div class="content">
      <!-- Your content here -->
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: var(--mag-page-width);
  margin: 0 auto;
  padding: 0 20px;
}
</style>
```

#### Complete CSS Variables Reference

```css
/* Text Colors */
--mag-page-text-color: #333;
--mag-base: #000;
--mag-base-100: #222;
--mag-base-200: #333;
--mag-base-300: #555;
--mag-base-400: #777;
--mag-base-500: #eee;

/* Background Colors */
--mag-page-bg-color: #fff;
--mag-page-bg-100: #fff;
--mag-page-bg-200: #f9f9f9;
--mag-page-bg-300: #f5f5f5;

/* Border Colors */
--mag-element-border-color: #ddd;
--mag-element-border-focus-color: #66afe9;
--mag-border-muted-color: #e6e6e6;

/* Primary Colors */
--mag-primary-color: #3884c7;
--mag-primary-text-color: #fff;
--mag-primary-hover-color: #337ab7;

/* Secondary Colors */
--mag-secondary-color: #fff;
--mag-secondary-text-color: #333;
--mag-secondary-border-color: #ccc;

/* Navigation Colors */
--mag-nav-bg-color: #f8f8f8;
--mag-nav-hover-bg-color: #f8f8f8;
--mag-nav-active-bg-color: #f8f8f8;
--mag-nav-text-color: #777;

/* Header Colors */
--mag-header-bg-color: #222;
--mag-header-text-color: #fff;

/* Fonts */
--mag-primary-font: Arial;
--mag-heading-font: Arial;

/* Layout */
--mag-page-width: 1320px;
```

#### Best Practices for Using CSS Variables

1. **Always use CSS variables for colors** - Never hardcode color values
2. **Prefer portal CSS classes first** - Use `btn-primary`, `iris-textbox`, etc. before creating custom styles
3. **Use CSS variables for custom components** - When portal classes don't fit your needs
4. **Test with different themes** - Verify your app looks good with different theme configurations
5. **Use semantic variable names** - Choose the variable that matches the semantic purpose (e.g., `--mag-primary-color` for primary actions)
6. **Combine with Tailwind utilities** - Use CSS variables for colors, Tailwind for layout and spacing
7. **Respect the theme system** - Don't override CSS variables; use them as-is

#### Example: Complete Themed Component

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'

const dataService = useMagentrixSdk().getInstance(magentrixConfig)
const accounts = ref<any[]>([])
const loading = ref(false)

async function loadAccounts() {
  loading.value = true
  try {
    const result = await dataService.query('SELECT Id, Name, Type FROM Account LIMIT 10')
    accounts.value = result.data
  } catch (error) {
    console.error('Failed to load accounts:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="themed-component">
    <div class="header">
      <h2>Accounts</h2>
      <button class="btn-primary" @click="loadAccounts">
        Refresh
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      Loading accounts...
    </div>

    <div v-else class="account-list">
      <div
        v-for="account in accounts"
        :key="account.Id"
        class="account-item"
      >
        <h3 class="account-name">{{ account.Name }}</h3>
        <span class="account-type">{{ account.Type }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.themed-component {
  background: var(--mag-page-bg-color);
  border: 1px solid var(--mag-border-muted-color);
  border-radius: 8px;
  padding: 20px;
  max-width: var(--mag-page-width);
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--mag-border-muted-color);
}

.header h2 {
  font-family: var(--mag-heading-font);
  color: var(--mag-page-text-color);
  margin: 0;
}

.loading-state {
  color: var(--mag-base-400);
  text-align: center;
  padding: 40px;
  font-family: var(--mag-primary-font);
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-item {
  background: var(--mag-page-bg-200);
  border: 1px solid var(--mag-border-muted-color);
  border-radius: 4px;
  padding: 16px;
  transition: all 0.2s;
}

.account-item:hover {
  background: var(--mag-page-bg-300);
  border-color: var(--mag-element-border-color);
}

.account-name {
  font-family: var(--mag-heading-font);
  color: var(--mag-page-text-color);
  font-size: 1.125rem;
  margin: 0 0 8px 0;
}

.account-type {
  color: var(--mag-base-400);
  font-family: var(--mag-primary-font);
  font-size: 0.875rem;
}
</style>
```

#### Available Portal CSS Classes Reference

**Buttons:**
- `btn-primary` - Primary action buttons
- `btn-secondary` - Secondary action buttons
- `btn-light` - Light/outlined style buttons
- `btn-success` - Success/confirmation buttons
- `btn-danger` - Destructive action buttons
- `btn-warning` - Warning action buttons
- `btn-info` - Informational buttons

**Form Elements:**
- `iris-label` - Form labels
- `iris-textbox` - Text inputs, textareas, and select elements

**Alerts:**
- `alert` - Base alert class (must be combined with a type class)
- `alert-success` - Success messages
- `alert-info` - Informational messages
- `alert-warning` - Warning messages
- `alert-danger` - Error/danger messages

**Note:** For a complete list of available portal CSS classes and their usage, refer to the Magentrix portal documentation or inspect the portal's stylesheet.

### Code Generation Guidelines for AI Agents

When generating code for this project:

1. **Always use TypeScript**: Never generate plain JavaScript
2. **Use Composition API**: Prefer `<script setup>` over Options API
3. **Type everything**: Define interfaces for all data structures
4. **Follow naming conventions**:
   - Components: PascalCase (e.g., `AccountList.vue`)
   - Composables: camelCase with `use` prefix (e.g., `useAccounts.ts`)
   - Services: PascalCase with `Service` suffix (e.g., `AccountService.ts`)
   - Types/Interfaces: PascalCase (e.g., `Account`, `QueryResult`)
5. **Import paths**: Use `@/` alias for src imports
6. **Environment access**: Use `env` helper from `@/env` for environment variables
7. **Configuration access**: Import from `@/config` for app configuration
8. **Error handling**: Always wrap SDK calls in try-catch
9. **Loading states**: Implement loading indicators for async operations
10. **Responsive design**: Consider mobile-first approach
11. **Accessibility**: Include ARIA labels and semantic HTML
12. **Performance**: Use lazy loading for routes and heavy components
13. **⚠️ CSS Scoping**: ALWAYS use `<style scoped>` or CSS modules - NEVER apply styles to `html`, `head`, or `body` elements
14. **Portal CSS Classes**: Use Magentrix portal classes (`btn-primary`, `iris-textbox`, `iris-label`, etc.) for consistent theming

### Common Pitfalls to Avoid

1. **Don't commit `.env.development`**: Contains sensitive tokens - always gitignored
2. **Don't modify `config.assets`**: This is managed by MagentrixCLI
3. **Don't hardcode sensitive values**: Use environment variables for tokens and URLs
4. **Don't access `import.meta.env` directly**: Use the `env` helper from `@/env`
5. **Don't hardcode URLs**: Use `config.siteUrl` or `env.siteUrl` for base URLs
6. **Don't forget LIMIT**: Always limit MEQL queries to prevent performance issues
7. **Don't use `any` type**: Define proper TypeScript interfaces
8. **Don't skip error handling**: Always handle SDK call failures
9. **Don't create multiple app instances**: Use the singleton pattern in AppEntry.ts
10. **Don't modify shared dependencies**: Vue and Vue Router must remain singletons
11. **Don't forget to unmount**: Implement proper cleanup in unmount functions
12. **⚠️ NEVER apply CSS to `html`, `head`, or `body`**: Always use scoped styles or CSS modules - your app runs inside the portal and global styles will break the entire portal
13. **Don't use unscoped styles**: Always use `<style scoped>` or CSS modules to prevent style leakage

### Testing Considerations

When writing tests for Iris apps:

1. **Mock the SDK**: Create mock implementations of MagentrixSDK
2. **Test composables**: Unit test composables independently
3. **Test components**: Use Vue Test Utils for component testing
4. **Test routing**: Verify route guards and navigation
5. **Test error scenarios**: Ensure proper error handling

### Development Workflow

#### Local Development

Start the development server using MagentrixCLI:

```bash
magentrix vue-run-dev
```

This command:
1. Validates assets reference in `.env.development` based on your site URL
2. Starts the Vite development server with HTTPS
3. Makes your app available at `https://localhost:5173`

#### Building and Deployment

Build and deploy your application using MagentrixCLI:

```bash
magentrix vue-run-build
```

This command:
1. Confirms the location of your Magentrix CLI project
2. Builds your application for production
3. Asks if you want to publish to the Magentrix server
4. Guides you through the publishing process

**Deployment Path:**
Your app will be accessible at: `<portal-url>/iris-app/{appPath}/`

### Deployment Checklist

Before deploying an Iris app:

- [ ] `.env.development` is created and configured (not committed)
- [ ] `config.ts` is fully configured (appSlug, appName)
- [ ] `package.json` name matches `config.appSlug`
- [ ] All TypeScript errors are resolved (`npm run type-check`)
- [ ] Build succeeds without errors (`magentrix vue-run-build`)
- [ ] Routes are tested in local development
- [ ] SDK integration is tested
- [ ] Error handling is implemented
- [ ] Loading states are implemented
- [ ] Responsive design is verified
- [ ] No sensitive data (tokens, passwords) in source code
- [ ] Magentrix CLI project is set up locally
- [ ] MagentrixCLI is installed globally (`npm install -g @magentrix-corp/magentrix-cli`)

---

## Additional Resources

### Project Documentation

- **Project README**: [README.md](./README.md)

### External Documentation

- **Vue 3 Documentation**: https://vuejs.org/
- **TypeScript with Vue**: https://vuejs.org/guide/typescript/overview.html
- **Vite Documentation**: https://vitejs.dev/
- **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html
- **Vue Router**: https://router.vuejs.org/
- **Magentrix SDK**: https://www.npmjs.com/package/@magentrix-corp/magentrix-sdk
- **MagentrixCLI**: https://www.npmjs.com/package/@magentrix-corp/magentrix-cli
- **MEQL Reference**: https://help.magentrix.com/wikis/devguide/magentrix-sql-reference
- **MEQL Advanced Functions**: https://help.magentrix.com/wikis/devguide/magentrix-sql-advanced-functions

---

**Last Updated**: 2025-12-20
**Template Version**: 1.1.2
```


