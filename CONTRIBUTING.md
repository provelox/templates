# Contributing

Thanks for adding an app. Each one is two files and a check.

## 1. Write the Compose file

Create `apps/<id>/compose.yml`. The `<id>` is lowercase letters, numbers and dashes, up to 48 characters.

- Use `image:` with a specific tag (not `latest`) so a deploy does not change under people.
- Put anything that differs between two people (a password, a database name, a domain) in a `${NAME}` variable.
- Only the main service carries `x-provelox: { expose: true, port: <port> }`. Every other service stays private.
- Keep data in named `volumes:`, so it survives a redeploy.
- These keys are refused, because they give a service more power over the server than an app has: `privileged`,
  `cap_add`, `devices`, `network_mode`, `pid`, `ipc`, `security_opt`, `sysctls`, `build`, `env_file`.

Check it by pasting the file into **New → Compose project** on a Provelox server first.

## 2. Add the index entry

Add an item to `templates:` in `provelox-templates.yaml`:

```yaml
  - id: my-app
    name: My App
    description: One or two sentences about what it is.
    category: Tools            # Web, Database, Productivity, Development, CMS, Analytics, Tools …
    icon: docker               # a built-in name, or an https:// address of a public square image
    mainService: my-app        # the key under services: that people open
    port: 3000
    publicWeb: true            # true when people open it in a browser
    variables:
      - { key: DB_PASSWORD, label: Database password, kind: secret }   # generated for each deployment
      - { key: APP_NAME, label: Name shown in the app, default: My App }
    composeFile: apps/my-app/compose.yml
```

A `secret` variable is generated when someone deploys and is at least `minLength` characters long if you set one.
Every `${NAME}` the Compose file uses must be listed under `variables`, and every listed variable must be used.

## 3. Check it

```bash
npm ci
npm run validate
```

The same checks run on every pull request. They confirm the index parses, each variable is declared and used, the
main service is the only one exposed, and no refused key is present.

## Rules for an app to be accepted

- It is widely used, or maintained by the people who make it, and has an official or well-known image.
- Its default install does not expose a known login. If the app ships a fixed admin password that the form cannot
  change, leave it out until it can take one from a variable.
- It works with the variables only: no config file needs to be written by hand.

## Pull requests

Open a pull request with the new files and the validator output. A maintainer reviews the image, the variables and
the ports. Changes to an existing app should say why.
