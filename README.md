# Gusto Restaurant Platform

A responsive restaurant ordering and operations prototype built with vanilla JavaScript and Supabase. It includes a customer-facing menu and cart, reservations, an authenticated admin dashboard, and customer-to-admin messaging.

## Current capabilities

- Responsive restaurant landing page and menu
- Browser-based shopping cart with quantity controls and order totals
- Dine-in and takeout order submission
- Table reservation form
- Supabase-backed menu, order, order-item, and reservation data
- Admin authentication through Supabase Auth
- Admin views for order and reservation status management
- Customer support conversations with an admin chat interface
- SQL schema, row-level security policies, and seed menu data

## Technology

- HTML5
- CSS3
- JavaScript
- Supabase Auth
- Supabase Postgres and REST API
- Supabase CLI configuration for local development

## Project structure

```text
.
├── index.html              # Customer-facing restaurant site
├── order.html              # Cart and checkout experience
├── admin-login.html        # Admin sign-in
├── admin.html              # Operations dashboard
├── script.js               # Main-site interactions
├── order.js                # Cart and order submission
├── chatbot.js              # Customer messaging
├── admin.js                # Admin data and chat workflows
├── supabase-client.js      # Supabase REST wrapper
├── config.example.js       # Public configuration template
└── supabase/
    ├── config.toml         # Local Supabase configuration
    └── schema.sql          # Database schema and seed data
```

## Local setup

1. Create a Supabase project or start Supabase locally.
2. Apply `supabase/schema.sql` through the Supabase SQL editor or your local migration workflow.
3. Copy `config.example.js` to `config.js`.
4. Add your Supabase project URL and public anonymous key to `config.js`.
5. Serve the repository through a local HTTP server and open `index.html`.

Do not commit service-role keys, database passwords, access tokens, or other secrets. A Supabase anonymous key is intended for client use, but access must still be protected through appropriate row-level security policies.

## Important security note

The included policies are suitable for a portfolio prototype, not a production deployment. Some read and insert policies are intentionally broad and should be tightened around authenticated users, ownership, and admin roles before production use.

## Status

This repository is a functional portfolio prototype. It does not currently include an automated test suite or a production deployment configuration.
