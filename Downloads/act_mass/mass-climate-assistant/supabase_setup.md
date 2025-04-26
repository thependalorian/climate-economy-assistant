# Database Setup Documentation

This document outlines the observed schemas for the databases used in the Climate Ecosystem Assistant project, based on API introspection.

## AstraDB Schema (Vector/Knowledge Base)

The following table structures were observed in the `default_keyspace` of the AstraDB instance, likely managed via DataStax JSON API conventions. The primary key `key` (a tuple) and the various `query_*` columns suggest indexing for efficient JSON document querying alongside vector search.

**Command Used for Introspection:**

```bash
curl --request GET \
  --url 'YOUR_ASTRA_DB_URL/api/rest/v2/schemas/keyspaces/default_keyspace/tables' \
  --header 'accept: application/json' \
  --header 'x-cassandra-token: YOUR_ASTRA_DB_TOKEN'
```
*(Replace `YOUR_ASTRA_DB_URL` and `YOUR_ASTRA_DB_TOKEN` with actual values)*

**Observed Tables & Columns:**

*(Common columns across many tables)*
*   `key` (tuple<tinyint, text>, partition key): Primary identifier, likely managed by the JSON API.
*   `doc_json` (text): Stores the main JSON payload of the document.
*   `array_contains` (set<text>): Indexed values for `CONTAINS` queries on arrays.
*   `array_size` (map<text, int>): Indexed sizes of arrays within the JSON.
*   `exist_keys` (set<text>): Indexed keys present in the JSON document.
*   `query_bool_values` (map<text, tinyint>): Indexed boolean values.
*   `query_dbl_values` (map<text, decimal>): Indexed numerical (double/decimal) values.
*   `query_null_values` (set<text>): Indexed keys with null values.
*   `query_text_values` (map<text, text>): Indexed string values.
*   `query_timestamp_values` (map<text, timestamp>): Indexed timestamp values.
*   `tx_id` (timeuuid): Transaction ID, likely related to JSON API operations.

*(Table-specific columns)*
*   **`climate_economy`**: Vector search enabled.
    *   Includes common columns.
    *   `query_vector_value` (vector<float, 1536>)
*   **`user_profiles`**: No vector search column observed.
    *   Includes common columns.
*   **`tracking_events`**: No vector search column observed.
    *   Includes common columns.
*   **`jobs`**: Vector search enabled.
    *   Includes common columns.
    *   `query_vector_value` (vector<float, 1536>)
*   **`education`**: Vector search enabled.
    *   Includes common columns.
    *   `query_vector_value` (vector<float, 1536>)
*   **`documents`**: Vector search enabled.
    *   Includes common columns.
    *   `query_vector_value` (vector<float, 1536>)

**Example Table Creation (Illustrative CQL):**

*Note: These are simplified examples. The actual creation might involve specific compaction strategies, default TTLs, or other options set via the JSON API or direct CQL.* 

```cql
// Example for a table with vector search (like 'jobs')
CREATE TABLE IF NOT EXISTS default_keyspace.jobs (
    key tuple<tinyint, text> PRIMARY KEY,
    array_contains set<text>,
    array_size map<text, int>,
    doc_json text,
    exist_keys set<text>,
    query_bool_values map<text, tinyint>,
    query_dbl_values map<text, decimal>,
    query_null_values set<text>,
    query_text_values map<text, text>,
    query_timestamp_values map<text, timestamp>,
    query_vector_value vector<float, 1536>,
    tx_id timeuuid
);

// Create a Search Ann Index on the vector column
CREATE CUSTOM INDEX IF NOT EXISTS jobs_vector_idx ON default_keyspace.jobs (query_vector_value)
USING 'org.apache.cassandra.index.sai.StorageAttachedIndex';

// Example for a table without vector search (like 'user_profiles')
CREATE TABLE IF NOT EXISTS default_keyspace.user_profiles (
    key tuple<tinyint, text> PRIMARY KEY,
    array_contains set<text>,
    array_size map<text, int>,
    doc_json text,
    exist_keys set<text>,
    query_bool_values map<text, tinyint>,
    query_dbl_values map<text, decimal>,
    query_null_values set<text>,
    query_text_values map<text, text>,
    query_timestamp_values map<text, timestamp>,
    tx_id timeuuid
);
```

**API Interaction Logic:**

The logic for querying and manipulating data in these AstraDB tables (e.g., performing vector searches, filtering based on JSON fields) resides within the Python backend code, primarily in the `DatabaseService` class and its helper methods located in `mass-climate-assistant/app/services/database.py`.

## Supabase Schema (Relational Data)

The following table structures and relationships were observed via the Supabase dashboard diagram.

**Tables & Columns:**

*   **`partner_organizations`**
    *   `id` (uuid, primary key)
    *   `name` (text)
    *   `description` (text, nullable)
    *   `partner_type` (text, nullable)
    *   `website_url` (text, nullable)
    *   `logo_url` (text, nullable)
    *   `contact_info` (jsonb, nullable)
    *   `metadata` (jsonb, nullable)
    *   `created_at` (timestamptz, default now())
    *   `updated_at` (timestamptz, default now())

*   **`job_opportunities`**
    *   `id` (uuid, primary key)
    *   `partner_organization_id` (uuid, foreign key -> `partner_organizations.id`)
    *   `job_title` (text)
    *   `location` (text, nullable)
    *   `job_description` (text, nullable)
    *   `required_skills` (text[], nullable) - *Array of text*
    *   `preferred_skills` (text[], nullable) - *Array of text*
    *   `education_level` (text, nullable)
    *   `experience_level` (text, nullable)
    *   `salary_range` (text, nullable) - *Considered storing as numeric/range types*
    *   `job_type` (text, nullable) - *e.g., Full-time, Part-time*
    *   `industry_sector` (text, nullable)
    *   `application_url` (text, nullable)
    *   `posting_date` (date, nullable)
    *   `expiry_date` (date, nullable)
    *   `source_url` (text, nullable)
    *   `created_at` (timestamptz, default now())
    *   `updated_at` (timestamptz, default now())

*   **`education_programs`**
    *   `id` (uuid, primary key)
    *   `partner_organization_id` (uuid, foreign key -> `partner_organizations.id`)
    *   `program_name` (text)
    *   `provider_name` (text, nullable)
    *   `description` (text, nullable)
    *   `program_type` (text, nullable)
    *   `focus_area` (text, nullable)
    *   `target_audience` (text[], nullable) - *Array of text*
    *   `duration` (text, nullable)
    *   `format` (text, nullable) - *e.g., Online, In-person*
    *   `location` (text, nullable)
    *   `cost` (text, nullable) - *Considered storing as numeric*
    *   `financial_aid_available` (boolean, nullable)
    *   `application_url` (text, nullable)
    *   `start_dates` (text, nullable)
    *   `source_url` (text, nullable)
    *   `created_at` (timestamptz, default now())
    *   `updated_at` (timestamptz, default now())

*   **`resources`**
    *   `id` (uuid, primary key)
    *   `name` (text)
    *   `description` (text, nullable)
    *   `url` (text, nullable)
    *   `resource_type` (text, nullable)
    *   `tags` (text[], nullable) - *Array of text*
    *   `target_audience` (text[], nullable) - *Array of text*
    *   `provider_organization_id` (uuid, nullable, foreign key -> `partner_organizations.id`) - *Relationship inferred*
    *   `fts_document` (tsvector, nullable) - *For Full-Text Search*
    *   `created_at` (timestamptz, default now())
    *   `updated_at` (timestamptz, default now())

*   **`ej_resources`** (Environmental Justice Resources)
    *   `id` (uuid, primary key)
    *   `name` (text)
    *   `description` (text, nullable)
    *   `community_served` (text, nullable)
    *   `resource_type` (text, nullable)
    *   `url` (text, nullable)
    *   `contact_info` (text, nullable)
    *   `partner_organization_id` (uuid, nullable, foreign key -> `partner_organizations.id`) - *Relationship inferred*
    *   `created_at` (timestamptz, default now())
    *   `updated_at` (timestamptz, default now())

*   **`career_pathways`**
    *   `id` (uuid, primary key)
    *   `pathway_name` (text)
    *   `description` (text, nullable)
    *   `industry_sector` (text, nullable)
    *   `entry_roles` (text[], nullable) - *Array of text*
    *   `mid_level_roles` (text[], nullable) - *Array of text*
    *   `senior_roles` (text[], nullable) - *Array of text*
    *   `required_skills_entry` (text[], nullable) - *Array of text*
    *   `common_skills_gained` (text[], nullable) - *Array of text*
    *   `salary_range_ma_entry` (jsonb, nullable)
    *   `salary_range_ma_mid` (jsonb, nullable)
    *   `salary_range_ma_senior` (jsonb, nullable)
    *   `related_resource_ids` (uuid[], nullable) - *Array of uuid, likely FK to `resources.id`*
    *   `created_at` (timestamptz, default now())
    *   `updated_at` (timestamptz, default now())
    *   `auth_users_id` (uuid, nullable) - *Unclear relationship*

*   **`military_translations`**
    *   `id` (uuid, primary key)
    *   `mos_code` (text, unique)
    *   `branch` (text) - *e.g., Army, Navy*
    *   `mos_title` (text, nullable)
    *   `civilian_equivalent_titles` (text[], nullable) - *Array of text*
    *   `translated_skills` (text[], nullable) - *Array of text*
    *   `certifications_related` (text[], nullable) - *Array of text*
    *   `notes` (text, nullable)
    *   `created_at` (timestamptz, default now())
    *   `updated_at` (timestamptz, default now())


*Note: This schema is based on visual inspection of the provided diagram. Exact constraints (e.g., `ON DELETE` behavior for Foreign Keys), default values, indexes, and RLS policies are not fully captured here. Use SQL introspection or the Supabase dashboard for complete details. The original `CREATE TABLE` SQL statements are the definitive source.* 

**API Interaction Logic:**

The logic for interacting with Supabase tables is handled through the Supabase client libraries within the application code (both frontend API routes like `app/api/...` and backend services like `DatabaseService`). 