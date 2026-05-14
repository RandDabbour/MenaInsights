
# MenaInsight

## Local setup

1. Install dependencies:
`npm i`
2. Copy env template:
`cp .env.example .env`
3. Fill DB and app values in `.env`.
4. Run migrations:
`npm run db:migrate`
5. Optional one-time import from old `server/data/db.json`:
`npm run db:import`
6. Start backend:
`npm run server`
7. Start frontend:
`npm run dev`

Frontend runs on `http://localhost:5173`, backend on `http://localhost:8787`.

## Database

Initial schema migration:
- `server/db/migrations/001_initial_schema.sql`
- `server/db/migrations/002_uploads_and_attachments.sql`

Core tables:
- `users`
- `service_requests`
- `request_messages`
- `payments`
- `site_content`
- `media_files`
- `audit_logs`

Additional operational tables:
- `user_sessions`
- `email_outbox`
- `schema_migrations`

## NPM scripts

- `npm run db:migrate` - apply SQL migrations
- `npm run db:import` - import legacy JSON data into relational tables
- `npm run db:backup` - backup DB using `mysqldump` into `server/backups`
- `npm run server` - start backend API
- `npm run dev` - start frontend

## Security

- Admin passwords are hashed with `bcrypt`.
- Admin sessions store hashed tokens only.
- Input validation is enforced for public request and admin mutation endpoints.
- Production errors return safe messages (no stack traces exposed to clients).
- Admin-only upload endpoints require valid admin bearer token.

## Required environment variables

See `.env.example` for full list. Required in production:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `PUBLIC_BASE_URL`, `CORS_ALLOW_ORIGIN`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`
- `PAYPAL_MODE` (`sandbox` or `live`)
- `PAYPAL_WEBHOOK_ID`
- `PAYMENT_CURRENCY` (e.g. `USD`)

Optional:
- `RESEND_API_KEY`, `RESEND_FROM`

## File uploads

- Upload middleware: `multer`
- Upload directory: `/uploads` (served statically by backend)
- Allowed types (validated by MIME + extension):
  - `jpg`, `jpeg`, `png`, `webp`, `pdf`
- Max upload size:
  - controlled by `UPLOAD_MAX_SIZE_MB` (default `10`)
- Files are stored on disk with unique safe names; DB stores only file paths/URLs.

Admin upload routes:
- `POST /api/admin/uploads/site-image` (images only)
- `POST /api/admin/uploads/article-image` (images only)
- `POST /api/admin/requests/:requestId/attachments/upload` (image/pdf for delivered reports/insights)

Public file access:
- `GET /uploads/:filename`

## PayPal sandbox setup

1. Go to PayPal Developer Dashboard:
`https://developer.paypal.com/`
2. Create a REST app (Sandbox).
3. Copy Sandbox `Client ID` and `Client Secret` into:
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
4. Keep `PAYPAL_MODE=sandbox`.
5. Create webhook URL in PayPal app:
- `https://your-domain.com/api/webhooks/paypal`
- for local testing, use tunnel URL (for example ngrok) to forward to your local backend.
6. Subscribe webhook events:
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `PAYMENT.CAPTURE.REFUNDED`
7. Copy webhook ID into:
- `PAYPAL_WEBHOOK_ID`

## PayPal sandbox test flow

1. Submit a service request from frontend.
2. In admin portal, set proposal price.
3. In request portal, user accepts proposal.
4. Click `Pay with PayPal`.
5. Complete payment with PayPal Sandbox buyer account.
6. Backend captures order and marks request paid only after verified capture.
7. Verify status in request portal and admin portal.

## Switch to PayPal live later

1. Replace sandbox app credentials with live app credentials:
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
2. Set:
- `PAYPAL_MODE=live`
3. Create live webhook in PayPal and update:
- `PAYPAL_WEBHOOK_ID`
4. Keep the same backend routes and flow.
