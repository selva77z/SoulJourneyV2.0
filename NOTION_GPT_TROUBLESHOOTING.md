# Notion GPT Actions Troubleshooting Guide

## Common Errors and Solutions

### 1. `UnrecognizedKwargsError: properties`

**Problem**: ChatGPT Actions doesn't recognize the `properties` field in requests.

**Solution**: 
- Ensure `properties` is properly defined in the OpenAPI schema under `requestBody.content.application/json.schema.properties`
- Add `required: ["properties"]` to the schema
- Use explicit schema definitions instead of generic `type: object`

### 2. `UnrecognizedKwargsError: parent`

**Problem**: The `parent` field structure is not recognized.

**Solution**:
- Define explicit schema for parent object with `database_id` or `page_id`
- Use `oneOf` or separate schemas for different parent types
- Ensure parent is in the required fields array

### 3. Task Creation Failing

**Your Database Info**:
- Tasks Database ID: `1ab90974f52481cb8a4ced86a9b547d8`
- Growth & Mastery Category ID: `1ac90974-f524-8137-9c1c-e0b55df6fa8b`
- Daily Foundations Category ID: `1ac90974-f524-8108-b891-f57b9cbb0c41`

**Working Example**:
```json
{
  "parent": {
    "database_id": "1ab90974f52481cb8a4ced86a9b547d8"
  },
  "properties": {
    "Task Name": {
      "title": [
        {
          "text": {
            "content": "Buy Watch"
          }
        }
      ]
    },
    "Category": {
      "relation": [
        {
          "id": "1ac90974-f524-8108-b891-f57b9cbb0c41"
        }
      ]
    },
    "Impact": {
      "select": {
        "name": "Medium"
      }
    },
    "Effort": {
      "select": {
        "name": "Medium"
      }
    }
  }
}
```

## Schema Files Created

1. **`notion-gpt-actions-fixed.json`** - Complete schema with all Notion operations
2. **`notion-task-creator-simple.json`** - Simplified schema focused on task creation

## Testing Steps

1. Upload the schema to ChatGPT Actions
2. Test with simple task creation first
3. Verify category assignment works
4. Test Impact/Effort property updates

## Common Property Types

- **Title**: `{"title": [{"text": {"content": "text"}}]}`
- **Select**: `{"select": {"name": "option"}}`
- **Relation**: `{"relation": [{"id": "page_id"}]}`
- **Status**: `{"status": {"name": "status_name"}}`

## Debugging Tips

- Always include `Notion-Version: "2022-06-28"` header
- Use exact property names from your Notion database
- Check that relation IDs exist and are accessible to your integration
- Test with minimal payloads first, then add complexity