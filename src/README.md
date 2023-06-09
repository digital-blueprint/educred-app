# Educred activities

Here you can find the individual activities of the `educred` app. 
If you want to use the whole app look at [educred](https://github.com/digital-blueprint/educred-app).

<--! ## Usage of an activity

You can use every activity alone. Take a look at our examples [here](https://github.com/digital-blueprint/educred-app/tree/main/examples).
-->

## Activities

### Shared Attributes

These attributes are available for all activities listed here:

- `lang` (optional, default: `de`): set to `de` or `en` for German or English
  - example `lang="de"`
- `entry-point-url` (optional, default is the TU Graz entry point url): entry point url to access the api
  - example `entry-point-url="https://api-dev.tugraz.at"`
- `auth` object: you need to set that object property for the auth token
  - example auth property: `{token: "THE_BEARER_TOKEN"}`
  - note: most often this should be an attribute that is not set directly, but subscribed at a provider


### dbp-create-vc

Export any rewarded diploma from your local university as a verifiable credential.

Note that you will need a Keycloak server along with a client id for the domain you are running this html on.

#### Attributes
See [shared attributes](#shared-attributes).


### dbp-verify-vc

Import any rewarded diploma from another university at the local university and verify it.

Note that you will need a Keycloak server along with a client id for the domain you are running this html on.

#### Attributes

See [shared attributes](#shared-attributes).


## Design Note

To ensure a uniform and responsive design these activities should occupy 100% width of the window when the activities' width are under 768 px.


## Mandatory attributes

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
