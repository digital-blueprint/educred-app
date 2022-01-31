import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {getStackTrace} from '@dbp-toolkit/common/error';
//import {send} from "@dbp-toolkit/common/notification";
import * as polyfill from 'credential-handler-polyfill';

export default class DBPEducredLitElement extends DBPLitElement {
    constructor() {
        super();
        this.isSessionRefreshed = false;
        this.auth = {};
        this.person = {};

        polyfill.loadOnce().then((x) => console.log('Ready to work with credentials!'));
    }

    static get properties() {
        return {
            ...super.properties,
            auth: {type: Object},
        };
    }

    connectedCallback() {
        super.connectedCallback();

        this._loginStatus = '';
        this._loginState = [];
        this._loginCalled = false;
    }

    /**
     *  Request a re-render every time isLoggedIn()/isLoading() changes
     */
    async _updateAuth() {
        this._loginStatus = this.auth['login-status'];

        if (this._loginStatus === 'logged-out') {
            this.person = {};
        }
        if (this._loginStatus === 'logged-in' && Object.keys(this.person).length === 0) {
            // Fetch the currently logged in person
            const personId = this.auth['person-id'];
            const options = {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + this.auth.token,
                },
            };
            let response = await this.httpGetAsync(
                this.entryPointUrl + '/base/people/' + encodeURIComponent(personId),
                options
            );
            this.person = await response.json();
            //console.dir(this.person);
        }
        let newLoginState = [this.isLoggedIn(), this.isLoading()];

        if (this._loginState.toString() !== newLoginState.toString()) {
            this.requestUpdate();
        }

        this._loginState = newLoginState;

        if (this.isLoggedIn() && !this._loginCalled && this.hasPermissions()) {
            this._loginCalled = true;
            this.loginCallback();
        }
    }

    loginCallback() {
        // Implement in subclass
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case 'auth':
                    this._updateAuth();
                    break;
            }
        });

        super.update(changedProperties);
    }

    /**
     * Returns if a person is set in or not
     *
     * @returns {boolean} true or false
     */
    isLoggedIn() {
        return Object.keys(this.person).length > 0;
    }

    /**
     * Returns true if a person has successfully logged in
     *
     * @returns {boolean} true or false
     */
    isLoading() {
        if (this._loginStatus === 'logged-out') return false;

        return !this.isLoggedIn() && this.auth.token !== undefined;
    }

    hasPermissions() {
        return !!this.person; // TODO

        // if (!this.auth.person || !Array.isArray(this.auth.person.roles))
        //     return false;
        //
        // // TODO: define a new role scope or remove it
        // if (this.auth.person.roles.includes('ROLE_SCOPE_GREENLIGHT')) {
        //     return true;
        // }
        //
        // return false;
    }

    /**
     * Send a fetch to given url with given options
     *
     * @param url
     * @param options
     * @returns {object} response (error or result)
     */
    async httpGetAsync(url, options) {
        return await fetch(url, options)
            .then((result) => {
                if (!result.ok) throw result;

                return result;
            })
            .catch((error) => {
                return error;
            });
    }

    /**
     * Sends an analytics error event for a failed request
     *
     * @param category
     * @param action
     * @param information
     * @param responseData
     */
    async sendErrorAnalyticsEvent(category, action, information, responseData = {}) {
        const responseBody = await responseData.clone().json();
        const data = {
            status: responseData.status || '',
            url: responseData.url || '',
            description: responseBody['hydra:description'] || '',
            errorDetails: responseBody['relay:errorDetails'] || '',
            information: information,
            // get 5 items from the stack trace
            stack: getStackTrace().slice(1, 6),
        };

        this.sendSetPropertyEvent('analytics-event', {
            category: category,
            action: action,
            name: JSON.stringify(data),
        });
    }

    // experimental CHAPI wallet interaction

    /**
     * create an uuid v4 number
     *
     * @return string
     */
    uuidv4() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
            (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
        );
    }

    /**
     * get DID from CHAPI wallet
     */
    async getDID() {
        const credentialQuery = {
            web: {
                VerifiablePresentation: {
                    challenge: this.uuidv4(),
                    domain: window.location.hostname,
                    query: {
                        type: 'DIDAuth',
                    },
                },
            },
        };
        return await navigator.credentials.get(credentialQuery).then((result) => {
            return result.data.holder ?? '';
        });
    }

    /**
     * save verifiable credential to CHAPI wallet
     *
     * @param chapiVerifiableCredential
     */
    async saveVC(chapiVerifiableCredential) {
        const chapiVerifiablePresentation = {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://wicket1001.github.io/ebsi4austria-examples/context/essif-schemas-vc-2020-v2.jsonld',
            ],
            type: ['VerifiablePresentation'],
            holder: chapiVerifiableCredential.credentialSubject.id,
            verifiableCredential: [chapiVerifiableCredential],
        };
        const webCredentialWrapper = new polyfill.WebCredential(
            'VerifiablePresentation',
            chapiVerifiablePresentation
        );
        return await navigator.credentials.store(webCredentialWrapper).then((result) => {
            return result;
        });
    }

    /**
     * retrieve all available verifiable credentials from CHAPI wallet
     *
     */
    async retrieveVC() {
        const credentialQuery = {
            web: {
                VerifiablePresentation: {
                    challenge: this.uuidv4(),
                    domain: window.location.hostname,
                    query: [
                        {
                            type: 'QueryByExample',
                            credentialQuery: {
                                reason: 'Please present a Verifiable Credential.',
                                example: {
                                    '@context': [
                                        'https://www.w3.org/2018/credentials/v1',
                                        'https://wicket1001.github.io/ebsi4austria-examples/context/essif-schemas-vc-2020-v2.jsonld',
                                    ],
                                    type: ['VerifiableCredential'],
                                },
                            },
                        },
                    ],
                },
            },
        };
        return await navigator.credentials.get(credentialQuery).then((result) => {
            return result.data.verifiableCredential;
        });
    }
}
