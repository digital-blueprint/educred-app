# Educational Credentials Application

[GitLab Repository](https://gitlab.tugraz.at/dbp/educred/educred) |
[npmjs package](https://www.npmjs.com/package/@dbp-topics/educred) |
[Unpkg CDN](https://unpkg.com/browse/@dbp-topics/educred/)

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

If you want to install the DBP educred App in a new folder `educred-app` you can call:

```bash
npx @digital-blueprint/cli install-app educred educred-app
```

Afterwards you can point your Apache web-server to `educred-app/public`.

You can also use this app directly from the [Unpkg CDN](https://unpkg.com/browse/@dbp-topics/educred/)
for example like this: [dbp-educred/index.html](https://gitlab.tugraz.at/dbp/educred/educred/-/tree/main/examples/dbp-educred/index.html)

Note that you will need a Keycloak server along with a client id for the domain you are running this html on.

### Update app

If you want to update the DBP educred App in the current folder you can call:

```bash
npx @digital-blueprint/cli update-app educred
```

## Activities

### dbp-create-vc

Export any rewarded diploma from your local university as a verifiable credential.

Note that you will need a Keycloak server along with a client id for the domain you are running this html on.

#### Attributes

- `lang` (optional, default: `de`): set to `de` or `en` for German or English
    - example `lang="de"`
- `entry-point-url` (optional, default is the TU Graz entry point url): entry point url to access the api
    - example `entry-point-url="https://api-dev.tugraz.at"`
- `auth` object: you need to set that object property for the auth token
    - example auth property: `{token: "THE_BEARER_TOKEN"}`
    - note: most often this should be an attribute that is not set directly, but subscribed at a provider

### dbp-verify-vc

Import any rewarded diploma from another university at the local university and verify it.

Note that you will need a Keycloak server along with a client id for the domain you are running this html on.

#### Attributes

- `lang` (optional, default: `de`): set to `de` or `en` for German or English
    - example `lang="de"`
- `entry-point-url` (optional, default is the TU Graz entry point url): entry point url to access the api
    - example `entry-point-url="https://api-dev.tugraz.at"`
- `auth` object: you need to set that object property for the auth token
    - example auth property: `{token: "THE_BEARER_TOKEN"}`
    - note: most often this should be an attribute that is not set directly, but subscribed at a provider
