# Educational Credentials Application

[GitHub Repository](https://github.com/digital-blueprint/educred-app) |
[Educred Bundle](https://gitlab.tugraz.at/dbp/educational-credentials/relay-educationalcredentials-bundle) |

Export and import your educational credentials to/from the clipboard or a CHAPI wallet.

## Prerequisites

- You need the [API server](https://github.com/digital-blueprint/relay-server-template) running
- You need the [DbpRelayEducredBundle](https://gitlab.tugraz.at/dbp/educational-credentials/relay-educationalcredentials-bundle) for creating verifiable credentials for your users

## Local development

```bash
# get the source
git clone https://github.com/digital-blueprint/educred-app
cd educred
git submodule update --init

# install dependencies
npm install

# constantly build dist/bundle.js and run a local web-server on port 8001 
npm run watch

# run tests
npm test
```

Jump to <https://localhost:8001> and you get the app, for any further interaction you need to log in.

## Using this app as pre-built package

### Install app

If you want to install the dbp educred app in a new folder `educred-app` you can call:

```bash
npx @digital-blueprint/cli install-app educred educred-app
```

Afterwards you can point your Apache web-server to `educred-app/public`.

You can also use this app directly from the [Unpkg CDN](https://unpkg.com/browse/@dbp-topics/educred/)
for example like this: [dbp-educred/index.html](https://github.com/digital-blueprint/educred-app/tree/main/examples/dbp-educred/index.html)

Note that you will need a Keycloak server along with a client id for the domain you are running this html on.

### Update app

If you want to update the dbp educred App in the current folder you can call:

```bash
npx @digital-blueprint/cli update-app educred
```

**Warning:** There may be issues when you run these commands as root user, best use a non-root user, like `www-data`.
To do this you can for example open a shell with `runuser -u www-data -- bash`.

## Activities
This app has the following activities:
- `dbp-create-vc`
- `dbp-verify-vc`

You can find the documentation of these activities in the [educred activities documentation](https://github.com/digital-blueprint/educred-app/tree/main/src).

## Adapt app

### Functionality
You can add multiple attributes to the `<dbp-educred>` tag.

| attribute name          | value   | Link to description                                                                                                                   |
|-------------------------|---------|---------------------------------------------------------------------------------------------------------------------------------------|
| `provider-root`         | Boolean | [app-shell](https://github.com/digital-blueprint/toolkit/tree/main/packages/app-shell#attributes)                          |
| `lang`                  | String  | [language-select](https://github.com/digital-blueprint/toolkit/tree/main/packages/language-select#attributes)              | 
| `entry-point-url`       | String  | [app-shell](https://github.com/digital-blueprint/toolkit/tree/main/packages/app-shell#attributes)                          |
| `keycloak-config`       | Object  | [app-shell](https://github.com/digital-blueprint/toolkit/tree/main/packages/app-shell#attributes)                          |
| `base-path`             | String  | [app-shell](https://github.com/digital-blueprint/toolkit/tree/main/packages/app-shell#attributes)                          |
| `src`                   | String  | [app-shell](https://github.com/digital-blueprint/toolkit/tree/main/packages//app-shell#attributes)                          |
| `html-overrides`        | String  | [common](https://github.com/digital-blueprint/toolkit/tree/main/packages/common#overriding-slots-in-nested-web-components) |
| `themes`                | Array   | [theme-switcher](https://github.com/digital-blueprint/toolkit/tree/main/packages/theme-switcher#themes-attribute)          |
| `darkModeThemeOverride` | String  | [theme-switcher](https://github.com/digital-blueprint/toolkit/tree/main/packages/theme-switcher#themes-attribute)          |


#### Mandatory attributes

If you are not using the `provider-root` attribute to "terminate" all provider attributes
you need to manually add these attributes so that the topic will work properly:

```html
<dbp-educred
    auth
    requested-login-status
    analytics-event
>
</dbp-educred>
```

### Design

For frontend design customizations, such as logo, colors, font, favicon, and more, take a look at the [theming documentation](https://dbp-demo.tugraz.at/dev-guide/frontend/theming/).


## "dbp-educred" slots

These are common slots for the app-shell. You can find the documentation of these slots in the [app-shell documentation](https://github.com/digital-blueprint/toolkit/tree/main/packages/app-shell).
For the app specific slots take a look at the [educred activities](https://github.com/digital-blueprint/educred-app/tree/main/src).
