# LIMS (Laboratory Information Management System) - Desktop & Cloud

This is a modern Laboratory Information Management System built with Laravel, Inertia.js, and NativePHP. It features a seamless synchronization flow between local desktop installations and a central cloud server.

## Key Features

- **Dual-Mode Operation**: Works offline on the desktop and synchronizes with the cloud when online.
- **Fast & Full Patient Registration**: Support for quick registrations with optional last names.
- **Enhanced Search**: Find patients by Name, Patient ID, or Phone Number.
- **Order Management**: Batch status updates and batch deletion for test orders.
- **Payment Tracking**: Real-time payment status (Paid, Partial, Pending) based on balance.
- **Cloud Provisioning**: New desktop installations can provision local users and labs directly from the central server.
- **Automated Sync**: Background synchronization of patients, orders, and results.

## Application Flow

### 1. Installation & Initial Setup
- The desktop app (.dmg or .exe) is installed on a local device.
- Upon first launch, if no local lab is configured, the user is prompted to log in.
- **Provisioning**: login attempts fall back to the central server. If successful, the app downloads the user and lab metadata to create a local environment.

### 2. Data Synchronization
- **Push**: Local changes (new patients, orders) are pushed to the central server.
- **Pull**: The app periodically polls the server for updates made elsewhere.
- **Conflicts**: The system uses `sync_id` and timestamps to manage record versions.

### 3. Build & Deployment
- The desktop app is packaged using `php artisan native:build`.
- Updates can be distributed via the configured update provider in `config/nativephp.php`.

## Technical Configuration

- **Sync URL**: Configured in `.env` (passed to the frontend).
- **Date Format**: Standardized to `dd/mm/yyyy` across the application.
- **Persistence**: Local SQLite database for desktop operations.

## Development

```bash
# Start the dev server
npm run dev

# Start NativePHP in dev mode
php artisan native:serve

# Build for production
php artisan native:build
```

---
Built for visual excellence and premium laboratory management.
