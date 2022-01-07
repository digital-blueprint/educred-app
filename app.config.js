export default {
    local: {
        basePath: '/dist/',
        entryPointURL: 'http://127.0.0.1:8000',
        keyCloakBaseURL: 'https://auth-dev.tugraz.at/auth',
        keyCloakRealm: 'tugraz-vpu',
        keyCloakClientId: 'auth-dev-mw-frontend-local',
        matomoUrl: '', //'https://analytics.tugraz.at/',
        matomoSiteId: -1, //131,
        nextcloudBaseURL: 'http://localhost:8081',
        nextcloudName: 'TU Graz cloud',
        preselectedOption: 'TU Graz',
    },
    bs: {
        basePath: '/dist/',
        entryPointURL: 'http://bs-local.com:8000',
        keyCloakBaseURL: 'https://auth-dev.tugraz.at/auth',
        keyCloakRealm: 'tugraz-vpu',
        keyCloakClientId: 'auth-dev-mw-frontend-local',
        matomoUrl: 'https://analytics.tugraz.at/',
        matomoSiteId: 131,
        nextcloudBaseURL: 'http://bs-local.com:8081',
        nextcloudName: 'TU Graz cloud',
        preselectedOption: 'TU Graz',
    },
    development: {
        basePath: '/apps/educred/',
        entryPointURL: 'https://api-dev.tugraz.at',
        keyCloakBaseURL: 'https://auth-dev.tugraz.at/auth',
        keyCloakRealm: 'tugraz-vpu',
        keyCloakClientId: 'dbp-educred',
        matomoUrl: 'https://analytics.tugraz.at/',
        matomoSiteId: 131,
        nextcloudBaseURL: 'https://nc-dev.tugraz.at/pers',
        nextcloudName: 'TU Graz cloud',
        preselectedOption: 'TU Graz',
    },
    demo: {
        basePath: '/apps/educred/',
        entryPointURL: 'https://api-demo.tugraz.at',
        keyCloakBaseURL: 'https://auth-demo.tugraz.at/auth',
        keyCloakRealm: 'tugraz-vpu',
        keyCloakClientId: 'dbp-educred',
        matomoUrl: 'https://analytics.tugraz.at/',
        matomoSiteId: 131,
        nextcloudBaseURL: 'https://cloud.tugraz.at',
        nextcloudName: 'TU Graz cloud',
        preselectedOption: 'TU Graz',
    },
    production: {
        basePath: '/',
        entryPointURL: 'https://api.tugraz.at',
        keyCloakBaseURL: 'https://auth.tugraz.at/auth',
        keyCloakRealm: 'tugraz',
        keyCloakClientId: 'educred_tugraz_at-EDUCRED',
        matomoUrl: 'https://analytics.tugraz.at/',
        matomoSiteId: 167,
        nextcloudBaseURL: 'https://cloud.tugraz.at',
        nextcloudName: 'TU Graz cloud',
        preselectedOption: 'TU Graz',
    },
};