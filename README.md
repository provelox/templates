# Provelox templates

Ready-made apps for [Provelox](https://github.com/provelox/provelox): a database, a CMS or a tool, deployed from the
**Templates** page with the few values it needs asked for in a form. Each app is a Docker Compose file, so you can read
exactly what will run before you deploy it.

## Apps

71 templates: databases and caches, web apps (CMS, wikis, analytics, password managers, AI front ends), and tools. The full
list is on the Templates page of a Provelox server, or in [`provelox-templates.yaml`](provelox-templates.yaml).

Logos are in [`icons/`](icons/) and are served from GitHub Pages at `https://provelox.github.io/templates/icons/`. The
index points there, so the Pages site must be published for logos to show (without it, cards show initials).

## Use it

In the Provelox console, open **Settings → Template registries**, choose **Git repository**, and enter:

- **Repository**: `https://github.com/provelox/templates`
- **Branch**: `main`
- **Index file**: `provelox-templates.yaml`

The apps then appear on the Templates page under this registry's name. A registry can also be added on every server at once
through the API (see the Provelox documentation, *Guide → Template registries*).

## Layout

```
provelox-templates.yaml   the index: one entry per app, with its variables and its Compose file
apps/<id>/compose.yml     the Compose file for that app
icons/                    logos, served from GitHub Pages
scripts/validate.mjs      checks the index and every Compose file (run before you open a pull request)
```

Every password and secret key is a generated variable, so no two deployments share one. Each app's services reach each
other by name (`db`, `redis`, …) on the app's private network, and only the main service is public.

## Add an app

See [CONTRIBUTING.md](CONTRIBUTING.md). In short: add `apps/<id>/compose.yml`, add an entry to `provelox-templates.yaml`,
and run `npm ci && npm run validate`.

## License

[Apache License 2.0](LICENSE). Each app is a third-party project: its image and license are its maintainers'.
