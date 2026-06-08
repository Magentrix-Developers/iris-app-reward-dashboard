---
name: devmode-systemclass
description: Managing SystemClass changes in the Magentrix development environment with DevMode file-based compilation. Use when working with SystemClasses, the Magentrix IDE, DevMode compilation, or the code build pipeline.
user-invocable: true
---

# SystemClass DevMode Development

## Platform Techstack

- **.NET Framework 4.8** (ASP.NET MVC, Allman-style braces)
- **Custom ORM** based on ServiceStack
- **Web Server**: IIS
- **Frontend**: Iris — Vue.js 3, Tailwind CSS, Flowbite, some SyncFusion components
- **Dynamic compilation**: SystemClasses compile into an in-memory DLL at runtime
- **Source control**: Git (GitHub), branches per issue (e.g., `MAG-008197`)

---

## What Is DevMode?

DevMode (label: "Track in Source Control") is a per-class flag on the SystemClass entity that switches a class from database-only storage to file-based development. When enabled:

1. The class body is written as a `.cs` file to `/App_Data/SystemClasses/`
2. The developer can edit the file in Visual Studio, VS Code, or any IDE
3. Changes are compiled into the runtime via the Build action
4. The database copy stays frozen (for safety), while the file has the latest code

### Enabling DevMode

**Configuration flag** in `web.config`:
```xml
<add key="Opirus.System.DevModeCompilation" value="true" />
```

This is read via `AppSettings.DevModeCompilation` (defined in `Opirus/Base/AppSettings.cs`).

**Per-class flag**: In the Magentrix IDE, open a SystemClass record and check "Track in Source Control" (`IsDevMode` field). This writes the class file to disk.

---

## SystemClass Entity

### Types

| Type | Supports Namespace Scaffolding | Base Class | Namespace |
|---|---|---|---|
| `Controller` | Yes | `BaseController` | `Opirus.Mvc` |
| `Database` | Yes | `StandardDatabase` | `Opirus.Web.Data.V2` |
| `Utility` | Yes | None (plain class) | `Opirus.Mvc` |
| `ActiveClass` | No | — | — |
| `ActivePage` | No | — | — |
| `Translation` | No | — | — |
| `Model` | No | — | — |

### Key Fields

| Field | Description |
|---|---|
| `Name` | Class name (used as filename) |
| `ClassBody` | The C# source code |
| `Type` | One of the types above |
| `IsDevMode` | "Track in Source Control" flag |
| `IsActive` | Whether the class is active |
| `IsDeleted` | Soft-delete flag |
| `PackageId` | Package association (if any) |

---

## File-Based Compilation Flow

### How It Works

```
Developer edits .cs file in IDE/VS
         |
         v
/App_Data/SystemClasses/{ClassName}.cs  <-- file has latest code
         |
         v
Build triggered (/sys/systemclass/build)
         |
         v
EntityBuilder reads file, compiles all SystemClasses into in-memory DLL
         |
         v
Runtime uses new DLL
```

The database copy (`ClassBody` column) stays frozen at the point DevMode was enabled. The file is the source of truth.

### Key Directories

- **SystemClasses folder**: `~/App_Data/SystemClasses/`
- Files are named `{ClassName}.cs`

---

## Database Trigger Behavior (SystemClassDatabase.cs)

Located at: `OpirusData/DataLite/Sys/SystemClassDatabase.cs`

### ValidateInsert / ValidateUpdate

- Validates that `IsDevMode` can only be set to `true` if `AppSettings.DevModeCompilation` is enabled.

### BeforeInsert

- For new classes of type Controller, Database, or Utility:
  - If `ClassBody` is empty, generates a default template with proper namespace, usings, and base class
  - If `ClassBody` has content but no `namespace`, wraps it in the correct namespace

### BeforeUpdate

- **Namespace wrapping**: Same as BeforeInsert — wraps ClassBody in namespace if missing (for Controller, Database, Utility types only)
- **DevMode file write**: If `DevModeCompilation` is on and the class is DevMode:
  1. Ensures `/App_Data/SystemClasses/` directory exists
  2. Writes the new `ClassBody` to the file
  3. Restores the old `ClassBody` to the database record (freeze pattern)
  4. This means: file = latest code, DB = frozen snapshot

### AfterInsert

- If `DevModeCompilation` is on and the new class is DevMode:
  - Creates the `.cs` file in `/App_Data/SystemClasses/`

### AfterUpdate

- Handles file management:
  - If class was renamed: renames the file
  - If DevMode was turned off: deletes the file
  - If DevMode was turned on: creates the file

### AfterDelete

- If the deleted class was DevMode: deletes the `.cs` file

### Restore (Undelete)

- When a DevMode class is restored from the Recycle Bin:
  - Recreates the `.cs` file from the database ClassBody if the file doesn't exist

### CreateDevClasses()

- Bulk method called during initialization
- Iterates all active, non-deleted, DevMode SystemClasses
- Creates `.cs` files for any that are missing
- Deletes orphaned `.cs` files that don't have a matching SystemClass record

---

## Controller Behavior (SystemClassController.cs)

Located at: `OpirusData/Controller/Sys/SystemClassController.cs`

### IDE File-Read Pattern

When DevMode is enabled, three controller actions read from the file instead of the database to show the latest code:

- **IdeEdit** (popup IDE editor) — reads file, sets `model.ClassBody`
- **FullEdit** (full-page editor) — reads file after `base.Edit()` returns
- **Download** — reads file before generating download response

Pattern:
```csharp
if (AppSettings.DevModeCompilation && model != null && model.IsDevMode == true)
{
    var basePath = HttpContext.Current.Server.MapPath("~/App_Data/SystemClasses");
    var filePath = Path.Combine(basePath, model.Name + ".cs");

    if (File.Exists(filePath))
        model.ClassBody = File.ReadAllText(filePath);
}
```

### Build Action

**Endpoint**: `POST /sys/systemclass/build`

Triggers `EntityBuilder.BuildEntity()` which:
1. Reads all active SystemClasses
2. For DevMode classes: reads ClassBody from file (not DB)
3. Compiles everything into an in-memory DLL
4. Applies to runtime

**Important:** If the build fails, the web application will likely crash. The next visitor to the site will trigger a recompile. Fix the code error first, then the system auto-recovers on next request.

The Build action has `[ContentNegotiationExceptionFilter]` for proper error handling and `[ConcurrencyLock]` to prevent concurrent builds.

---

## Default Class Templates

### Controller

```csharp
namespace Opirus.Mvc
{
    using System;
    using Opirus.Web;

    public sealed class {Name} : BaseController
    {
    }
}
```

- `BaseController` is in `Opirus.Web` namespace (NOT `AspxController`)
- Must include `using Opirus.Web;` or it won't compile

### Database

```csharp
namespace Opirus.Web.Data.V2
{
    using Opirus.Data;

    public class {Name} : StandardDatabase
    {
    }
}
```

### Utility

```csharp
namespace Opirus.Mvc
{
    public class {Name}
    {
    }
}
```

- No base class, no special usings needed
- Plain class in `Opirus.Mvc` namespace

---

## IDE JavaScript Templates (index.js)

Located at: `Web/Areas/Sys/IDE/index.js`

The "New System Class" dialog in the IDE generates templates in JavaScript that bypass BeforeInsert. These templates must match the C# defaults above:

- Controller template includes `using System;` and `using Opirus.Web;`
- Database template includes `using Opirus.Data;`
- Utility template is a plain class

The `index.js` file is loaded via `Html.Script()` which uses assembly version for cache busting. Changes to this file require a code rebuild to take effect.

---

## Namespace Scaffolding Rules

Only these types get automatic namespace wrapping:
- **Controller** → `namespace Opirus.Mvc { using System; using Opirus.Web; ... }`
- **Database** → `namespace Opirus.Web.Data.V2 { using Opirus.Data; ... }`
- **Utility** → `namespace Opirus.Mvc { ... }`

ActiveClass, ActivePage, Translation, and Model types are **NOT** wrapped — they manage their own namespace or don't need one.

The helper method `SupportsNamespaceScaffolding(type)` returns `true` only for Controller, Database, and Utility.

---

## EntityBuilder Compilation Pipeline

Located at: `OpirusData/Management/EntityBuilder.cs`

### GetSystemClassesDevMode()

- Queries all active, non-deleted SystemClasses (with valid package status)
- Excludes page types (ActivePage, Translation, etc.) from compilation
- Uses chained `.Where()` for filtering

### GetClassBody()

- For DevMode classes: reads from file in `/App_Data/SystemClasses/`
- Falls back to database ClassBody if file doesn't exist
- Logs a warning via `SystemInfo.Warning()` if file is missing

### BuildEntity()

- Compiles all SystemClasses into a single in-memory assembly
- Returns list of compilation errors (if any)
- Called by the Build controller action

---

## Development Workflow

### Typical Flow

1. Create or open a SystemClass in the Magentrix IDE
2. Check "Track in Source Control" to enable DevMode
3. The `.cs` file appears in `/App_Data/SystemClasses/`
4. Edit in Visual Studio, VS Code, or the Magentrix IDE
5. Call Build (`POST /sys/systemclass/build`) to compile changes
6. If using Magentrix IDE: save triggers Build automatically via AjaxSaveAndBuild

### Backward Compatibility

DevMode supports developers who prefer either workflow:
- **Visual Studio/VS Code**: Edit files directly, trigger Build
- **Magentrix IDE**: Edit in browser, IDE reads latest from file, save writes to file + builds

### Common Issues

1. **IDE shows stale code**: If the controller doesn't read from file, the IDE shows the frozen DB copy. Fixed by the file-read pattern in IdeEdit/FullEdit.

2. **Build failure crashes site**: A compilation error in any SystemClass brings down the site. Fix the code, then the next request triggers auto-recovery.

3. **Missing namespace on new class**: If a class is created without a namespace (e.g., via IDE template that bypasses BeforeInsert), the build fails. Namespace scaffolding in BeforeInsert/BeforeUpdate catches most cases.

4. **Deleted class file not restored**: When restoring from Recycle Bin, the Restore override recreates the file.

5. **Cache busting for JS changes**: `Html.Script()` uses assembly version, not file modification time. JS file changes (like `index.js`) require a code rebuild to bust the browser cache.

6. **Orphaned files**: `CreateDevClasses()` cleans up `.cs` files that don't have a matching SystemClass record.

---

## Key Code Locations

| File | Purpose |
|---|---|
| `OpirusData/DataLite/Sys/SystemClassDatabase.cs` | Database triggers (BeforeInsert, BeforeUpdate, AfterInsert, AfterUpdate, AfterDelete, Restore) |
| `OpirusData/Controller/Sys/SystemClassController.cs` | IDE views (IdeEdit, FullEdit, Download, Build) |
| `OpirusData/Management/EntityBuilder.cs` | Compilation pipeline (GetSystemClassesDevMode, GetClassBody, BuildEntity) |
| `Web/Areas/Sys/IDE/index.js` | IDE JavaScript templates for "New System Class" dialog |
| `Opirus/Base/AppSettings.cs` | `DevModeCompilation` property |
| `Web/web.config` | `Opirus.System.DevModeCompilation` setting |
