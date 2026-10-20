# Adminer Modern Blue

A plugin restyling Adminer after `ui/adminer_database_dashboard_mockup.png`: navy sidebar with the database switcher and a filterable table list, a top bar with the breadcrumb and the main actions, card-style tables and forms, a login card and entrance animations.

Everything still goes through Adminer's own pages and forms – logins, queries, CSRF tokens, confirmations, exports and imports are untouched. Without JavaScript the page stays fully usable, only the enhancements below are missing.

## Files

| File | Purpose |
|---|---|
| `plugins/modern-blue.php` | Plugin: links the assets, adds body classes, the login heading, the sidebar *Server* link and table search, and a detailed column grid on the table structure page |
| `plugins/modern-blue/modern-blue.css` | The whole design (tokens in `:root`, change `--brand-primary` etc. to retheme) |
| `plugins/modern-blue/modern-blue.js` | ES2015 enhancements: top bar actions, *Create* button next to the heading, list search boxes, *Select / Structure / Alter* row links, structure tabs, page number chips, SQL line numbers, animations |
| `plugins/modern-blue/motion.min.js` | [Motion](https://motion.dev) 11.18.2 (the framework-independent build of Framer Motion), MIT, see `motion-LICENSE.md` |

No CDN, font or other external request is made.

## Animations

Motion drives the entrance of the page (staggered blocks and the first 24 table rows), the login card spring, the sliding tab indicator, the drawer items on small screens, AJAX messages and a press feedback on buttons. The sidebar animates only once per browser session. Visitors with *reduce motion* in their system settings get no animations. Disable them by `new AdminerModernBlue("", false)`.

## Development

Browse to `adminer/modern-blue.php` (uses the sources directly).

A database server without a password (e.g. a fresh XAMPP) is refused by Adminer. For local testing, create `adminer/modern-blue-password.php` containing `<?php return password_hash("some-password", PASSWORD_DEFAULT);` and log in with that password. Never deploy this file.

`tests/modern-blue-fixture.sql` creates a disposable `mb_shop` database for trying the screens.

## Deployment

1. Build or download `adminer.php`.
2. Next to it, create `adminer-plugins/` and copy into it `plugins/modern-blue.php` and the directory `plugins/modern-blue/`:

```
adminer.php
adminer-plugins/
	modern-blue.php
	modern-blue/
		modern-blue.css
		modern-blue.js
		motion.min.js
		motion-LICENSE.md
```

The plugin finds its assets relative to its own file. If the web server cannot serve `adminer-plugins/modern-blue/` (some setups deny the directory), copy the assets elsewhere and configure the URL in `adminer-plugins.php`:

```php
<?php
return array(
	new AdminerModernBlue("/static/modern-blue/"),
);
```

The asset URLs carry a version parameter derived from the file time and size, so an update is picked up without clearing the browser cache.

## Rollback

Delete `adminer-plugins/modern-blue.php` (and the `modern-blue/` directory). Adminer immediately renders with its default design; nothing is stored in the database or the session.
