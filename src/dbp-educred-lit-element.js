import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import {getStackTrace} from '@dbp-toolkit/common/error';
//import {send} from "@dbp-toolkit/common/notification";

export default class DBPEducredLitElement extends DBPLitElement {
    constructor() {
        super();
        this.isSessionRefreshed = false;
        this.auth = {};
        this.person = {};
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
}
