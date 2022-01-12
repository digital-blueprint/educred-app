import {createInstance} from './i18n.js';
import {css, html} from 'lit-element';
import DBPEducredLitElement from "./dbp-educred-lit-element";
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import * as commonUtils from '@dbp-toolkit/common/utils';
import {Activity} from './activity.js';
import metadata from './dbp-create-vc.metadata.json';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {classMap} from 'lit-html/directives/class-map.js';
import {Icon, LoadingButton, MiniSpinner} from "@dbp-toolkit/common";
import * as polyfill from "credential-handler-polyfill";
// import {send} from "@dbp-toolkit/common/notification";

class DbpVerifyVc extends ScopedElementsMixin(DBPEducredLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.entryPointUrl = '';
        this.activity = new Activity(metadata);
        this.loading = false;
        this.diploma = {};
        this.status = 0;

        polyfill.loadOnce().then(x => console.log('Ready to work with credentials!'));
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon,
            'dbp-mini-spinner': MiniSpinner,
            'dbp-loading-button': LoadingButton,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            lang: {type: String},
            entryPointUrl: {type: String, attribute: 'entry-point-url'},
            loading: {type: Boolean, attribute: false},
            id: {type: String, attribute: false},
            diploma: {type: Object, attribute: false},
            status: {type: Number, attribute: false}
        };
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case "lang":
                    this._i18n.changeLanguage(this.lang);
                    break;
            }
        });
        super.update(changedProperties);
    }

    async postVCRequest(text) {
        let formData = new FormData();
        formData.append('text', text);

        const options = {
            method: 'POST',
            headers: {
                //'Content-Type': 'application/ld+json',
                Authorization: "Bearer " + this.auth.token
            },
            body: formData
        };

        return await this.httpGetAsync(this.entryPointUrl + '/educationalcredentials/diplomas', options);
    }

    async verifyVC() {
        //this._('#vc-btn').disabled = true;
        const text = this._('#vc-text').value;
        console.log(text);

        this.loading = true;
        const response = await this.postVCRequest(text);
        const diploma = await response.json();
        console.dir(diploma);
        if (response.ok) {
            this.status = 1;
        } else if (response.status === 400) {
            this.status = 90;
        }
        this.loading = false;
    }

    copyFromClipboard() {
        navigator.clipboard.readText().then(
            text => {
                this._('#vc-text').value = text;
                console.log('Async: Copying from clipboard was successful!');
            },
            err => console.error('Async: Could not copy from clipboard. error: ', err)
        );
    }

    /* experimental wallet integration */
    uuidv4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    getDID() {
        const credentialQuery = {
            "web": {
                "VerifiablePresentation": {
                    "challenge": this.uuidv4(),
                    "domain": window.location.hostname,
                    "query": {
                        "type": "DIDAuth"
                    }
                }
            }
        };
        console.log("Requesting DID...");
        navigator.credentials.get(credentialQuery).then(result => {
            console.log("Result of get() request:");
            console.dir(result);
            this.did = result.data.holder ?? '';
        });
    }

    saveVC() {
        const chapiVerifiableCredential = JSON.parse(this.currentDiploma.text);
        const chapiVerifiablePresentation = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1"
            ],
            "type": [
                "VerifiablePresentation"
            ],
            "holder": chapiVerifiableCredential.credentialSubject.id,
            "verifiableCredential": [ chapiVerifiableCredential ]
        };
        const webCredentialWrapper = new polyfill.WebCredential('VerifiablePresentation',
            chapiVerifiablePresentation);
        console.log("Storing credential...");
        navigator.credentials.store(webCredentialWrapper).then(result => {
            console.log('Result of store() request:');
            console.dir(result);
        });
    }

    retrieveVC() {
        const credentialQuery = {
            "web": {
                "VerifiablePresentation": {
                    "challenge": this.uuidv4(),
                    "domain": window.location.hostname,
                    "query": [{
                        "type": "QueryByExample",
                        "credentialQuery": {
                            "reason": "Please present a Verifiable Credential.",
                            "example": {
                                "@context": [
                                    "https://www.w3.org/2018/credentials/v1"
                                ],
                                "type": ["VerifiableCredential"]
                            }
                        },
                    }]
                }
            }
        };
        console.log("Requesting credential...");
        navigator.credentials.get(credentialQuery).then(result => {
            console.log("Result of get() request:");
            console.dir(result);
            this._('#vc-text').value =  JSON.stringify(result.data.verifiableCredential[0], null,2);
        });
    }
    /* ------------------------------- */

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getActivityCSS()}
            ${commonStyles.getNotificationCSS()}
            ${commonStyles.getButtonCSS()}
            ${commonStyles.getLinkCss()}
            .vc {
            /*  
                display: flex;
                justify-content: space-between;
                column-gap: 15px;
                row-gap: 1.5em;
                align-items: center;
             */
                margin-bottom: 1rem;
            }

            .header {
            /*
                display: grid;
                align-items: center;
             */
            }

            .vc-text {
                width: 100%;
                margin-top: 1rem;
                margin-bottom: 1rem;
            }
            .vc-text textarea {
                width: 100%;
            }

            .btn-box {
                margin-top: 1.5rem;
            }
            .btn-box-label {
                margin-right: 1.5rem;
            }
            .btn {
                margin-bottom: 1rem;
            }

            .verify-0 {
                
            }
            .verify-1 {
                color: var(--dbp-success-bg-color);
                
            }
            .verify-90 {
                color: var(--dbp-danger-bg-color);
            }
            
            .border {
                margin-top: 2rem;
                padding-top: 2rem;
                border-top: 1px solid black;
            }

            #vc-modal-box {
                display: flex;
                flex-direction: column;
                padding: 0px;
                min-width: 700px;
                max-width: 880px;
                min-height: unset;
                height: auto;
            }

            .proof-container, .information-container {
                background-color: #245b78;
                color: white;
                padding: 40px 10px;
                display: flex;
                flex-direction: column;
                justify-content: space-evenly;
                align-items: center;
                text-align: center;
            }

            .proof-container {
                text-align: center;
            }

            .proof-container .int-link-external, .information-container .int-link-external, .proof-container .int-link-internal, .information-container .int-link-internal {
                border-bottom: 1px solid white;
            }

            .proof-container .int-link-external::after, .information-container .int-link-external::after {
                filter: invert(100%);
                -webkit-filter: invert(100%);
            }

            .left-container h3, .proof-container h4, .information-container h4 {
                margin: 0px 0px 10px 0px;
            }

            .left-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 40px 10px;
                justify-content: space-evenly;
            }

            .content-wrapper {
                padding-right: 44px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-gap: 10px;
                grid-auto-rows: 100%;
            }

            .modal-close {
                position: absolute;
                right: 10px;
                top: 5px;
            }

            .tooltip {
                margin-left: 5px;
            }

            .vc h3 {
                margin-bottom: 0.2rem;
            }

            .vc-loading {
                font-size: 1.3rem;
            }

            .reload-failed {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 1em;
            }

            .reload-failed p {
                color: var(--dbp-danger-bg-color);
                margin-top: 0px;
                margin-bottom: 0px;
            }

            #reload-btn {
                margin-left: 10px;
            }

            .hidden {
                display: none;
            }

            @media only screen
            and (orientation: landscape)
            and (max-width: 768px) {
                #vc-modal-box {
                    height: 100%;
                    width: 100%;
                    max-width: unset;
                    max-height: unset;
                }

                #vc-modal-content, #ticket-modal-content > div:first-of-type, .content-wrapper {
                    height: 100%;
                }

                .left-container, .proof-container, .information-container {
                    justify-content: space-evenly;
                }
            }

            @media only screen
            and (orientation: portrait)
            and (max-width: 768px) {

                .vc {
                    display: block;
                    margin-bottom: 0;
                }

                .header {
                    margin-bottom: 0.5rem;
                }

                .btn {
                    flex-direction: column;
                    row-gap: 0.5em;
                }

                .loading {
                    justify-content: center;
                }

                #vc-modal-box {
                    width: 100%;
                    height: 100%;
                    min-width: 100%;
                    min-height: 100%;
                    padding: 0px;
                }

                .left-container {
                    padding: 11px 20px 20px 20px;
                }

                .content-wrapper {
                    display: flex;
                    flex-direction: column;
                    padding: 0px;
                    grid-gap: inherit;
                    min-height: 100vh;
                }

                .proof-container, .information-container {
                    padding: 12px 20px 20px 20px;
                    flex-grow: 1;
                }

                .reload-failed {
                    width: 90%;
                }
            }
        `;
    }

    render() {
        const i18n = this._i18n;

        const canPaste = navigator.clipboard['readText'] !== undefined;

        const loading = html`
            <span class="control ${classMap({hidden: !this.loading})}">
                        <span class="loading">
                            <dbp-mini-spinner text=${i18n.t('loading-message')}></dbp-mini-spinner>
                        </span>
                    </span>
        `;

        return html`

            <div class="notification is-warning ${classMap({hidden: this.isLoggedIn() || this.isLoading()})}">
                ${i18n.t('error-login-message')}
            </div>

            <div class="control ${classMap({hidden: this.isLoggedIn() || !this.isLoading()})}">
                <span class="loading">
                    <dbp-mini-spinner text=${i18n.t('loading-message')}></dbp-mini-spinner>
                </span>
            </div>
            ${!this.isLoggedIn() || !this.hasPermissions() ?
            html`
                <div class="notification is-danger ${classMap({hidden: !this.hasPermissions() || !this.isLoggedIn() || this.isLoading()})}">
                    ${i18n.t('error-permission-message')}
                </div>` :
            html`
                <div class="vc">
                    <div class="header">
                        <h3>${i18n.t('upload-other-diploma')}</h3>
                        <span>${i18n.t('upload-other-diploma-text')}</span>
                    </div>
                    <div class="btn-box">
                        <span class="btn-box-label">${i18n.t('fetch-your-vc')}</span>
                        <button @click="${this.copyFromClipboard}" ?disabled="${!canPaste}">${i18n.t('fetch-your-vc-clipboard')}</button>
                        <button @click="${this.retrieveVC}">wallet</button>
                    </div>
                    <div class="vc-text">
                        <textarea name="text" id="vc-text" rows="12" wrap="soft"></textarea>
                    </div>
                    <div class="btn">
                        <dbp-loading-button type="is-primary" id="vc-btn" value="${i18n.t('upload-btn-text')}"
                                            @click="${() => {this.verifyVC();}}"
                                            title="${i18n.t('upload-btn-text')}"></dbp-loading-button>
                    </div>
                    <div class="response">
                        <span>${i18n.t('response-other-diploma')}</span>
                        ${this.loading ? loading : html`
                        <span class="verify-${this.status}">${i18n.t('response-other-diploma-' + this.status + '-text')}</span>
                        `}
                    </div>
                </div>
            </div>

        `}
        `;
    }
}

commonUtils.defineCustomElement('dbp-verify-vc', DbpVerifyVc);