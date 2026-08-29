# Warehouse SaaS Domain Model

## Goal

The application allows organizations to manage products, warehouses,
inventory levels and inventory movements.

---

## Organization

Represents a company using the SaaS platform.

Examples:

- ACME Logistics
- Example Store

An organization owns its warehouses, products and categories.

---

## User

Represents a person who can sign in to the application.

A user may belong to one or more organizations.

---

## Membership

Connects a User with an Organization.

It also defines the user's role inside that organization.

Roles:

- OWNER
- ADMIN
- MANAGER
- WORKER

Example:

Victor
→ ACME Logistics
→ ADMIN

---

## Warehouse

Represents a physical warehouse belonging to an organization.

Example:

Name: Kraków Main Warehouse
Code: KRK-01

An organization may have many warehouses.

---

## Category

Groups products within an organization.

Examples:

- Electronics
- Laptops
- Phones
- Accessories

---

## Product

Represents an item managed by the organization.

Example:

Name: iPhone 17
SKU: IPHONE-17-BLK-256

SKU must be unique within an organization.

---

## Inventory

Represents the current quantity of one Product in one Warehouse.

Example:

Product: iPhone 17
Warehouse: Kraków
Quantity: 50
Reorder point: 10

The combination:

warehouseId + productId

must be unique.

---

## Stock Movement

Represents an immutable record of a stock change.

Examples:

RECEIPT +100
ISSUE -20
ADJUSTMENT -2
TRANSFER_IN +10
TRANSFER_OUT -10

A stock movement records:

- product
- warehouse
- user who performed the operation
- type
- quantity change
- optional note
- creation time

---

## Main relationships

Organization 1 -> N Warehouse

Organization 1 -> N Product

Organization 1 -> N Category

User N -> N Organization through Membership

Warehouse N -> N Product through Inventory

Product 1 -> N StockMovement

Warehouse 1 -> N StockMovement

User 1 -> N StockMovement