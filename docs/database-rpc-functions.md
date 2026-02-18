# Database RPC Functions Guide

## Overview

This project uses **PostgreSQL Functions (RPC - Remote Procedure Calls)** for improved security and performance.

## Benefits

### Security
- **SQL Injection Protection**: All queries are parameterized at the database level
- **Centralized Logic**: Business rules are enforced in the database
- **Row-Level Security**: RLS policies are applied automatically

### Performance
- **Query Plan Caching**: PostgreSQL caches execution plans
- **Reduced Network Overhead**: Complex queries execute entirely in the database
- **Optimized Execution**: Database can optimize multi-step operations

### Maintainability
- **Single Source of Truth**: Query logic lives in one place
- **Version Control**: Database migrations track all changes
- **Easy Updates**: Change query logic without redeploying the app

## Available Functions

### Restaurant Functions

#### `get_restaurant_by_slug(slug TEXT)`
Retrieves a restaurant by its slug.

```typescript
import { getRestaurantBySlug } from "@/lib/db-queries"

const restaurant = await getRestaurantBySlug("doctordoener")
```

#### `get_restaurant_by_id(restaurant_id INTEGER)`
Retrieves a restaurant by its ID.

```typescript
import { getRestaurantById } from "@/lib/db-queries"

const restaurant = await getRestaurantById(1)
```

### Menu Functions

#### `get_menu_items(restaurant_id INTEGER)`
Gets all menu items for a restaurant.

```typescript
import { getMenuItems } from "@/lib/db-queries"

const items = await getMenuItems(restaurantId)
```

#### `get_menu_item_by_slug(restaurant_id INTEGER, dish_slug TEXT)`
Gets a specific menu item by slug.

```typescript
import { getMenuItemBySlug } from "@/lib/db-queries"

const dish = await getMenuItemBySlug(restaurantId, "doener-kebap")
```

### Category Functions

#### `get_categories(restaurant_id INTEGER)`
Gets all categories for a restaurant.

```typescript
import { getCategories } from "@/lib/db-queries"

const categories = await getCategories(restaurantId)
```

#### `get_category_by_slug(restaurant_id INTEGER, category_slug TEXT)`
Gets a specific category by slug.

```typescript
import { getCategoryBySlug } from "@/lib/db-queries"

const category = await getCategoryBySlug(restaurantId, "pizza")
```

### Delivery Zone Functions

#### `get_delivery_zones(restaurant_id INTEGER)`
Gets all delivery zones for a restaurant.

```typescript
import { getDeliveryZones } from "@/lib/db-queries"

const zones = await getDeliveryZones(restaurantId)
```

#### `get_delivery_zone_by_slug(restaurant_id INTEGER, zone_slug TEXT)`
Gets a specific delivery zone by slug.

```typescript
import { getDeliveryZoneBySlug } from "@/lib/db-queries"

const zone = await getDeliveryZoneBySlug(restaurantId, "heidelberg")
```

### Order Functions

#### `get_order_by_id(order_id TEXT)`
Gets an order by ID.

```typescript
import { getOrderById } from "@/lib/db-queries"

const order = await getOrderById("order_123")
```

#### `get_order_items(order_id TEXT)`
Gets all items in an order.

```typescript
import { getOrderItems } from "@/lib/db-queries"

const items = await getOrderItems("order_123")
```

#### `get_restaurant_orders(restaurant_id INTEGER, limit INTEGER)`
Gets recent orders for a restaurant.

```typescript
import { getRestaurantOrders } from "@/lib/db-queries"

const orders = await getRestaurantOrders(restaurantId, 50)
```

### Opening Hours Functions

#### `get_opening_hours(restaurant_id INTEGER)`
Gets opening hours for a restaurant.

```typescript
import { getOpeningHours } from "@/lib/db-queries"

const hours = await getOpeningHours(restaurantId)
```

#### `is_restaurant_open(restaurant_id INTEGER)`
Checks if a restaurant is currently open.

```typescript
import { isRestaurantOpen } from "@/lib/db-queries"

const isOpen = await isRestaurantOpen(restaurantId)
```

### Review Functions

#### `get_reviews(restaurant_id INTEGER, limit INTEGER)`
Gets reviews for a restaurant.

```typescript
import { getReviews } from "@/lib/db-queries"

const reviews = await getReviews(restaurantId, 20)
```

#### `get_average_rating(restaurant_id INTEGER)`
Gets average rating for a restaurant.

```typescript
import { getAverageRating } from "@/lib/db-queries"

const avgRating = await getAverageRating(restaurantId)
```

### Statistics Functions

#### `get_restaurant_stats(restaurant_id INTEGER, days INTEGER)`
Gets statistics for a restaurant over a time period.

```typescript
import { getRestaurantStats } from "@/lib/db-queries"

const stats = await getRestaurantStats(restaurantId, 30)
```

## Migration from Direct SQL

### Before (Direct SQL)
```typescript
import { sql } from "@/lib/db"

const restaurantResult = await sql`SELECT * FROM restaurants WHERE slug = ${slug}`
const restaurant = restaurantResult.rows[0]
```

### After (RPC Function)
```typescript
import { getRestaurantBySlug } from "@/lib/db-queries"

const restaurant = await getRestaurantBySlug(slug)
```

## Creating New Functions

1. Create SQL function in a new migration file:

```sql
-- scripts/044-my-new-function.sql
CREATE OR REPLACE FUNCTION my_function(param1 TEXT)
RETURNS TABLE (id INT, name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT id, name FROM my_table WHERE column = param1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. Execute the migration:

```bash
# The script will be executed automatically
```

3. Add helper function to `lib/db-queries.ts`:

```typescript
export async function myFunction(param: string) {
  return await sql`SELECT * FROM my_function(${param})`
}
```

4. Use in your code:

```typescript
import { myFunction } from "@/lib/db-queries"

const result = await myFunction("value")
```

## Best Practices

1. **Always use RPC functions for repeated queries**
2. **Keep functions focused** - One function, one purpose
3. **Add comments in SQL** - Document what the function does
4. **Test thoroughly** - Verify edge cases and performance
5. **Use SECURITY DEFINER carefully** - Only when necessary

## SQL Injection Protection

RPC functions protect against SQL injection because:

1. **Parameterized queries**: All inputs are parameters, not concatenated strings
2. **Type checking**: PostgreSQL validates input types
3. **No dynamic SQL**: Query structure is fixed in the function

### Unsafe (Direct SQL)
```typescript
// DON'T DO THIS
const slug = req.query.slug
await sql`SELECT * FROM restaurants WHERE slug = '${slug}'`
```

### Safe (RPC Function)
```typescript
// DO THIS
const slug = req.query.slug
await getRestaurantBySlug(slug)
```

## Performance Tips

1. **Index frequently queried columns**
2. **Use EXPLAIN ANALYZE** to check query performance
3. **Consider materialized views** for complex aggregations
4. **Cache function results** with SWR when appropriate

## Troubleshooting

### Function not found
```
ERROR: function get_restaurant_by_slug(text) does not exist
```

**Solution**: Run the migration script to create the function.

### Wrong number of parameters
```
ERROR: function get_restaurant_by_slug() does not exist
```

**Solution**: Check that you're passing all required parameters.

### Type mismatch
```
ERROR: function get_restaurant_by_slug(integer) does not exist
```

**Solution**: Ensure parameter types match the function signature.

## Resources

- [PostgreSQL Functions Documentation](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Query Optimization Guide](https://www.postgresql.org/docs/current/performance-tips.html)
