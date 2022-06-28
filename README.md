# Educational Credentials Application

[GitLab Repository](https://gitlab.tugraz.at/dbp/educred/educred) |
<!-- [npmjs package](https://www.npmjs.com/package/@dbp-topics/educred) |
[Unpkg CDN](https://unpkg.com/browse/@dbp-topics/educred/) -->
[Educred Bundle](https://gitlab.tugraz.at/dbp/educational-credentials/relay-educationalcredentials-bundle) |

## Prerequisites

- You need the [API server](https://gitlab.tugraz.at/dbp/relay/dbp-relay-server-template) running
- You need the [DbpRelayEducredBundle](https://gitlab.tugraz.at/dbp/educational-credentials/relay-educationalcredentials-bundle) for creating verifiable credentials for your users

## Local development

```bash
# get the source
git clone git@gitlab.tugraz.at:dbp/educational-credentials/educred.git
cd educred
git submodule update --init

# install dependencies
yarn install

# constantly build dist/bundle.js and run a local web-server on port 8001 
yarn run watch

# run tests
yarn test
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
for example like this: [dbp-educred/index.html](https://gitlab.tugraz.at/dbp/educred/educred/-/tree/main/examples/dbp-educred/index.html)

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

You can find the documentation of these activities in the [educred activities documentation](https://gitlab.tugraz.at/dbp/educational-credentials/educred/-/tree/main/src).

## Adapt app

### Functionality
You can add multiple attributes to the `<dbp-educred>` tag.

| attribute name | value | Link to description |
|----------------|-------| ------------|
| `provider-root` | Boolean | [app-shell](https://gitlab.tugraz.at/dbp/web-components/toolkit/-/tree/master/packages/app-shell#attributes) |
| `lang`         | String | [language-select](https://gitlab.tugraz.at/dbp/web-components/toolkit/-/tree/master/packages/language-select#attributes) | 
| `entry-point-url` | String | [app-shell](https://gitlab.tugraz.at/dbp/web-components/toolkit/-/tree/master/packages/app-shell#attributes) |
| `keycloak-config` | Object | [app-shell](https://gitlab.tugraz.at/dbp/web-components/toolkit/-/tree/master/packages/app-shell#attributes) |
| `base-path` | String | [app-shell](https://gitlab.tugraz.at/dbp/web-components/toolkit/-/tree/master/packages/app-shell#attributes) |
| `src` | String | [app-shell](https://gitlab.tugraz.at/dbp/web-components/toolkit/-/tree/master/packages/app-shell#attributes) |
| `html-overrides` | String | [common](https://gitlab.tugraz.at/dbp/web-components/toolkit/-/tree/master/packages/common#overriding-slots-in-nested-web-components) |
| `themes` | Array | [theme-switcher](https://gitlab.tugraz.at/dbp/web-components/toolkit/-/tree/master/packages/theme-switcher#themes-attribute) |
| `darkModeThemeOverride` | String | [theme-switcher](https://gitlab.tugraz.at/dbp/web-components/toolkit/-/tree/master/packages/theme-switcher#themes-attribute) |


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

These are common slots for the app-shell. You can find the documentation of these slots in the [app-shell documentation](https://gitlab.tugraz.at/dbp/web-components/toolkit/-/tree/master/packages/app-shell).
For the app specific slots take a look at the [educred activities](https://gitlab.tugraz.at/dbp/educational-credentials/educred/-/tree/main/src).

