import path from 'path';
import url from 'url';
import glob from 'glob';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import replace from 'rollup-plugin-replace';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import serve from 'rollup-plugin-serve';
import urlPlugin from '@rollup/plugin-url';
import license from 'rollup-plugin-license';
import del from 'rollup-plugin-delete';
import emitEJS from 'rollup-plugin-emit-ejs';
import {getBabelOutputPlugin} from '@rollup/plugin-babel';
import appConfig from './app.config.js';
import cp from 'child_process';
//import util from 'util';
import {
    getPackagePath,
    getBuildInfo,
    generateTLSConfig,
    getDistPath,
} from './vendor/toolkit/rollup.utils.js';

const pkg = require('./package.json');
const appEnv = typeof process.env.APP_ENV !== 'undefined' ? process.env.APP_ENV : 'local';
const watch = process.env.ROLLUP_WATCH === 'true';
const buildFull = (!watch && appEnv !== 'test') || process.env.FORCE_FULL !== undefined;
let useTerser = buildFull;
let useBabel = buildFull;
let checkLicenses = buildFull;
let useHTTPS = true;

let config;
if (appEnv in appConfig) {
    config = appConfig[appEnv];
} else if (appEnv === 'test') {
    config = {
        basePath: '/',
        entryPointURL: 'https://test',
        keyCloakBaseURL: 'https://test',
        keyCloakRealm: '',
        keyCloakClientId: '',
        matomoUrl: '',
        matomoSiteId: -1,
        nextcloudBaseURL: 'https://test',
        nextcloudName: '',
        preselectedOption: '',
    };
} else {
    console.error(`Unknown build environment: '${appEnv}', use one of '${Object.keys(appConfig)}'`);
    process.exit(1);
}

if (config.nextcloudBaseURL) {
    config.nextcloudFileURL = config.nextcloudBaseURL + '/index.php/apps/files/?dir=';
    config.nextcloudWebAppPasswordURL = config.nextcloudBaseURL + '/index.php/apps/webapppassword';
    config.nextcloudWebDavURL = config.nextcloudBaseURL + '/remote.php/dav/files';
} else {
    config.nextcloudFileURL = '';
    config.nextcloudWebAppPasswordURL = '';
    config.nextcloudWebDavURL = '';
}

if (watch) {
    config.basePath = '/dist/';
}

function getOrigin(url) {
    return url ? new URL(url).origin : '';
}

config.CSP = `default-src 'self' 'unsafe-eval' 'unsafe-inline' \
    ${getOrigin(config.matomoUrl)} ${getOrigin(config.keyCloakBaseURL)} ${getOrigin(
    config.entryPointURL
)} \
    httpbin.org ${getOrigin(config.nextcloudBaseURL)} \
    https://authn.io https://wallet.interop.digitalbazaar.com \
    ${getOrigin(config.contentUrl)}; \
    img-src * blob: data:; font-src 'self' data:`;

export default (async () => {
    let privatePath = await getDistPath(pkg.name);
    return {
        input:
            appEnv != 'test'
                ? [
                      'src/' + pkg.internalName + '.js',
                      'src/dbp-create-vc.js',
                      'src/dbp-verify-vc.js',
                  ]
                : glob.sync('test/**/*.js'),
        output: {
            dir: 'dist',
            entryFileNames: '[name].js',
            chunkFileNames: 'shared/[name].[hash].[format].js',
            format: 'esm',
            sourcemap: true,
        },
        preserveEntrySignatures: false,
        onwarn: function (warning, warn) {
            // ignore "suggestions" warning re "use strict"
            if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
                return;
            }
            // ignore chai warnings
            if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('chai')) {
                return;
            }
            // keycloak bundled code uses eval
            if (warning.code === 'EVAL' && warning.id.includes('sha256.js')) {
                return;
            }
            warn(warning);
        },
        plugins: [
            del({
                targets: 'dist/*',
            }),
            emitEJS({
                src: 'assets',
                include: ['**/*.ejs', '**/.*.ejs'],
                data: {
                    getUrl: (p) => {
                        return url.resolve(config.basePath, p);
                    },
                    getPrivateUrl: (p) => {
                        return url.resolve(`${config.basePath}${privatePath}/`, p);
                    },
                    name: pkg.internalName,
                    entryPointURL: config.entryPointURL,
                    basePath: config.basePath,
                    nextcloudBaseURL: config.nextcloudBaseURL,
                    nextcloudWebAppPasswordURL: config.nextcloudWebAppPasswordURL,
                    nextcloudWebDavURL: config.nextcloudWebDavURL,
                    nextcloudFileURL: config.nextcloudFileURL,
                    nextcloudName: config.nextcloudName,
                    keyCloakBaseURL: config.keyCloakBaseURL,
                    keyCloakRealm: config.keyCloakRealm,
                    keyCloakClientId: config.keyCloakClientId,
                    CSP: config.CSP,
                    showPreselected: config.showPreselected,
                    preselectedOption: config.preselectedOption,
                    matomoUrl: config.matomoUrl,
                    matomoSiteId: config.matomoSiteId,
                    buildInfo: getBuildInfo(appEnv),
                },
            }),
            replace({
                // If you would like DEV messages, specify 'development'
                // Otherwise use 'production'
                'process.env.NODE_ENV': JSON.stringify('production'),
            }),
            resolve({
                browser: true,
                preferBuiltins: true,
            }),
            checkLicenses &&
                license({
                    banner: {
                        commentStyle: 'ignored',
                        content: `
    License: <%= pkg.license %>
    Dependencies:
    <% _.forEach(dependencies, function (dependency) { if (dependency.name) { %>
    <%= dependency.name %>: <%= dependency.license %><% }}) %>
    `,
                    },
                    thirdParty: {
                        allow: {
                            test: '(MIT OR BSD-3-Clause OR Apache-2.0 OR LGPL-2.1-or-later OR 0BSD OR ISC OR WTFPL)',
                            failOnUnlicensed: true,
                            failOnViolation: true,
                        },
                    },
                }),
            commonjs({
                include: 'node_modules/**',
            }),
            json(),
            urlPlugin({
                limit: 0,
                include: [
                    'node_modules/suggestions/**/*.css',
                    'node_modules/select2/**/*.css',
                    await getPackagePath('tippy.js', '**/*.css'),
                ],
                emitFiles: true,
                fileName: 'shared/[name].[hash][extname]',
            }),
            copy({
                targets: [
                    {src: 'assets/*.css', dest: 'dist/' + (await getDistPath(pkg.name))},
                    {src: 'src/*.metadata.json', dest: 'dist'},
                    {src: 'assets/*.svg', dest: 'dist/' + (await getDistPath(pkg.name))},
                    {src: 'assets/htaccess-shared', dest: 'dist/shared/', rename: '.htaccess'},
                    {src: 'assets/icon/*', dest: 'dist/' + (await getDistPath(pkg.name, 'icon'))},
                    {src: 'assets/images/*', dest: 'dist/images'},
                    {src: 'assets/site.webmanifest', dest: 'dist', rename: pkg.internalName + '.webmanifest'},
                    {src: 'assets/silent-check-sso.html', dest: 'dist'},
                    {
                        src: await getPackagePath('@tugraz/font-source-sans-pro', 'files/*'),
                        dest: 'dist/' + (await getDistPath(pkg.name, 'fonts/source-sans-pro')),
                    },
                    {
                        src: await getPackagePath('@tugraz/web-components', 'src/spinner.js'),
                        dest: 'dist/' + (await getDistPath(pkg.name)), rename: 'tug_spinner.js'
                    },
                    {
                        src: await getPackagePath('@dbp-toolkit/common', 'src/spinner.js'),
                        dest: 'dist/' + (await getDistPath(pkg.name)),
                    },
                    {
                        src: await getPackagePath('@dbp-toolkit/common', 'misc/browser-check.js'),
                        dest: 'dist/' + (await getDistPath(pkg.name)),
                    },
                    {
                        src: await getPackagePath('@dbp-toolkit/common', 'assets/icons/*.svg'),
                        dest: 'dist/' + (await getDistPath('@dbp-toolkit/common', 'icons')),
                    },

                    {
                        src: await getPackagePath('tabulator-tables', 'dist/css'),
                        dest:
                            'dist/' +
                            (await getDistPath('@dbp-toolkit/file-handling', 'tabulator-tables')),
                    },
                ],
            }),
            useBabel &&
                getBabelOutputPlugin({
                    compact: false,
                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                loose: true,
                                modules: false,
                                shippedProposals: true,
                                bugfixes: true,
                                targets: {
                                    esmodules: true,
                                },
                            },
                        ],
                    ],
                }),
            useTerser ? terser() : false,
            watch
                ? serve({
                      contentBase: '.',
                      host: '127.0.0.1',
                      port: 8001,
                      historyApiFallback: config.basePath + pkg.internalName + '.html',
                      https: useHTTPS ? await generateTLSConfig() : false,
                      headers: {
                          'Content-Security-Policy': config.CSP,
                      },
                  })
                : false,
        ],
    };
})();
