# GetShopItems Endpoint

## Overview
The `GetShopItems` endpoint retrieves all shop items from the Shop table in Airtable.

## Endpoint
```
GET /api/GetShopItems
```

## Request
No request body or parameters required.

## Response
Returns an array of shop items with the following structure:

```json
[
  {
    "id": "string",
    "Name": "string",
    "Cost": "number",
    "Description": "string", 
    "SoldItems": "number",
    "InitialStock": "number",
    "InStock": "number"
  }
]
```

## Field Descriptions
- `id`: Unique identifier for the shop item
- `Name`: Name/title of the shop item
- `Cost`: Price of the item in SSS currency
- `Description`: Description of the shop item
- `SoldItems`: Number of items sold
- `InitialStock`: Original stock quantity when item was added
- `InStock`: Current available stock

## Example Usage

### JavaScript/Fetch
```javascript
const response = await fetch('/api/GetShopItems', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

const shopItems = await response.json();
console.log(shopItems);
```

### cURL
```bash
curl -X GET http://localhost:3000/api/GetShopItems
```

## Error Responses
- `405 Method Not Allowed`: If any method other than GET is used
- `500 Server configuration error`: If AIRTABLE_API_KEY is not configured
- `500 An unexpected error occurred`: For other server errors

## Environment Variables
The endpoint uses the following environment variables:
- `AIRTABLE_API_KEY`: Required Airtable API key
- `AIRTABLE_BASE_ID`: Airtable base ID (defaults to 'appg245A41MWc6Rej')
- `AIRTABLE_SHOP_TABLE`: Shop table name (defaults to 'Shop')

