import {createInstance} from './i18n.js';
import {css, html} from 'lit-element';
import DBPEducredLitElement from "./dbp-educred-lit-element";
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import * as commonUtils from '@dbp-toolkit/common/utils';
import {LoadingButton, Icon, MiniSpinner, InlineNotification} from '@dbp-toolkit/common';
import {classMap} from 'lit-html/directives/class-map.js';
import MicroModal from './micromodal.es';
import * as commonStyles from '@dbp-toolkit/common/styles';
//import {send} from "@dbp-toolkit/common/notification";
import {InfoTooltip} from '@dbp-toolkit/tooltip';
import {Activity} from "./activity";
import metadata from "./dbp-create-vc.metadata.json";


class DbpCreateVc extends ScopedElementsMixin(DBPEducredLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.entryPointUrl = '';
        this.activity = new Activity(metadata);
        this.loading = false;
        this.diplomas = [];
        this.locationName = 'Diploma';
        this.did = 'did:key:z6MkqyYXcBQZ5hZ9BFHBiVnmrZ1C1HCpesgZQoTdgjLdU6Ah';
        this.currentDiploma = {};
        this.loadingDiplomas = true;
        this.showVc = false;
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon,
            'dbp-mini-spinner': MiniSpinner,
            'dbp-loading-button': LoadingButton,
            'dbp-inline-notification': InlineNotification,
            'dbp-info-tooltip': InfoTooltip,
        };
    }

    static get properties() {
        return {
            ...super.properties,
            lang: {type: String},
            entryPointUrl: {type: String, attribute: 'entry-point-url'},
            loading: {type: Boolean, attribute: false},
            locationName: {type: String, attribute: 'preselected-option'},
            did: {type: String, attribute: false},
            diplomas: {type: Array, attribute: false},
            currentDiploma: {type: Object, attribute: false},
            loadingDiplomas: {type: Boolean, attribute: false},
            showVc: {type: Boolean, attribute: false},
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

    loginCallback() {
        super.loginCallback();
        if (this.isLoggedIn() && this.loadingDiplomas) {
            this.getListOfDiplomas();
            this.loadingDiplomas = false;
        }
    }

    /**
     * Parse a diplomas response and return a list
     *
     * @param response
     * @returns {Array} list
     */
    parseDiplomas(response) {
        let list = [];

        let numTypes = parseInt(response['hydra:totalItems']);
        if (isNaN(numTypes)) {
            numTypes = 0;
        }
        for (let i = 0; i < numTypes; i++) {
            list[i] = response['hydra:member'][i];
        }

        return list;
    }

    /**
     * Gets a specific diploma
     *
     * @param diplomaID
     * @returns {object} response
     */
    async getDiplomaRequest(diplomaID) {

        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/ld+json',
                Authorization: "Bearer " + this.auth.token
            },
        };

        return await this.httpGetAsync(this.entryPointUrl + '/educationalcredentials/diplomas/' + diplomaID, options);
    }

    /**
     * Gets a specific vc from diploma
     *
     * @param diplomaID
     * @returns {object} response
     */
    async getVCRequest(diplomaID) {

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/ld+json',
                Authorization: "Bearer " + this.auth.token
            },
            body: '{"did":"'+ this.did + '"}',
        };
        return await this.httpGetAsync(this.entryPointUrl + '/educationalcredentials/diplomas/' + diplomaID + '/verifiable', options);
    }

    async getVC(event) {
        const diplomaID = event.target.attributes.getNamedItem('data-diplomaid').nodeValue;
        if (!this.isLoggedIn()) {
            return;
        }
        const newDID = this._('#did').value;
        console.log('newDID = ' + newDID);

        if (Object.keys(this.currentDiploma).length > 0
            && this.currentDiploma['@id'] === diplomaID
            && newDID === this.did) {
            this.showVc = true;
            this.openDialog();
            return;
        }

        this.did = newDID;
        const id = diplomaID.replace('/educationalcredentials/diplomas/', '');
        const response = await this.getVCRequest(id);
        const diploma = await response.json();
        console.dir(diploma);

        this.currentDiploma = diploma;
        this.showVc = true;
        this.openDialog();
    }

    /**
     * Gets all available diplomas
     *
     * @returns {object} response
     */
    async getAllDiplomasRequest() {
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/ld+json',
                Authorization: "Bearer " + this.auth.token
            },
        };

        return await this.httpGetAsync(this.entryPointUrl + '/educationalcredentials/diplomas', options);
    }

    /**
     * Get a list of active tickets and checks the response of the request
     *
     */
    async getListOfDiplomas() {
        if (!this.isLoggedIn()) {
            return;
        }
        let response = await this.getAllDiplomasRequest();
        await this.checkDiplomasRequest(response);
        console.dir(this.diplomas);
    }

    /**
     * Checks the response from getAllDiplomasRequest
     * updates the diploma list
     * and notify the user if something went wrong
     *
     * @param {object} response
     */
    async checkDiplomasRequest(response) {
        let responseBody = await response.clone().json();
        if (responseBody !== undefined && response.status === 200) {
            this.diplomas = this.parseDiplomas(responseBody);
        } else {
            // else it failed, but we want to fail soft
            console.log("Loading diplomas has failed");
        }
        this.loadingDiplomas = false;
        this.loading = false;
    }

    /**
     * Open modal dialog #show-diploma-modal
     *
     */
    openDialog() {
        if (this._('#show-diploma-modal'))
            MicroModal.show(this._('#show-diploma-modal'), {
            disableScroll: true,
            onClose: modal => {
                this.showVc = false;
            },
        });
    }

    /**
     * Close modal dialog #show-diploma-modal
     *
     */
    closeDialog() {
        if (this._('#show-diploma-modal'))
            MicroModal.close(this._('#show-diploma-modal'));
    }

    copyToClipboard() {
        const text = this.currentDiploma.text;
        navigator.clipboard.writeText(text).then(function() {
            console.log('Async: Copying to clipboard was successful!');
        }, function(err) {
            console.error('Async: Could not copy text: ', err);
        });
    }

    static get styles() {
        // language=css
        return css`
            ${commonStyles.getThemeCSS()}
            ${commonStyles.getGeneralCSS(false)}
            ${commonStyles.getActivityCSS()}
            ${commonStyles.getNotificationCSS()}
            ${commonStyles.getButtonCSS()}
            ${commonStyles.getModalDialogCSS()}
            ${commonStyles.getLinkCss()}
            .diploma {
                display: flex;
                justify-content: space-between;
                column-gap: 15px;
                row-gap: 1.5em;
                align-items: center;
                margin-bottom: 2em;
            }

            .diplomas {
                margin-top: 2.3em;
            }

            .header {
                display: grid;
                align-items: center;
            }

            .btn-box {
                margin-top: 1.5rem;
            }
            .btn-box-label {
                margin-right: 1.5rem;
            }
            .btn {
                display: flex;
                justify-content: space-between;
                column-gap: 0.5em;
            }

            #diploma-modal-box {
                display: flex;
                flex-direction: column;
                padding: 0px;
                min-width: 700px;
                max-width: 880px;
                min-height: unset;
                height: auto;
            }

            .proof-container, .information-container {
                background-color: var(--dbp-info-bg-color);
                color: var(--dbp-info-text-color);
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

            .proof-container .int-link-external, .proof-container .int-link-internal, .information-container .int-link-internal {
                border-bottom: 1px solid white;
            }

            .proof-container .int-link-external::after {
                filter: invert(100%);
                -webkit-filter: invert(100%);
            }

            .foto-container {
                width: 80%;
            }

            .left-container h3, .proof-container h4, .information-container h4 {
                margin: 0px 0px 10px 0px;
                line-height: 30px;
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
                grid-template-columns: 1fr; /* 1fr; */
                grid-gap: 10px;
                grid-auto-rows: 100%;
            }

            .modal-close {
                position: absolute;
                right: 10px;
                top: 5px;
            }

            .red {
                color: var(--dbp-danger-bg-color);
            }

            .green {
                color: var(--dbp-success-bg-color);
            }

            .warning {
                color: var(--dbp-info-bg-color);
            }

            .diploma h3 {
                margin-bottom: 0.2rem;
            }

            .diploma-loading {
                font-size: 1.3rem;
            }

            .flex {
                display: flex;
            }

            .flex-center {
                justify-content: center;
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
                #diploma-modal-box {
                    height: 100%;
                    width: 100%;
                    max-width: unset;
                    max-heigth: unset;
                }

                #diploma-modal-content, #diploma-modal-content > div:first-of-type, .content-wrapper, #qr-code-hash svg {
                    height: 100%;
                }

                .left-container, .proof-container, .information-container {
                    justify-content: space-evenly;
                }
                
                #qr-code-wrapper {
                    width: 80%;
                }
                
            }

            @media only screen
            and (orientation: portrait)
            and (max-width: 768px) {

                .diploma {
                    display: block;
                    margin-bottom: 0;
                }

                .diplomas {
                    display: block;
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

                #diploma-modal-box {
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

        const loading = html`
            <span class="control ${classMap({hidden: !this.loading})}">
                            <span class="loading">
                                <dbp-mini-spinner text=${i18n.t('loading-message')}></dbp-mini-spinner>
                            </span>
                        </span>
        `;

        const noDiplomas = this.diplomas.length === 0 ? html`<p>sorry, you have no diplomas jet</p>` : '';

        return html`

            <div class="notification is-warning ${classMap({hidden: this.isLoggedIn() || this.isLoading()})}">
                ${i18n.t('error-login-message')}
            </div>

            ${!this.isLoggedIn() || !this.hasPermissions() ? 
            html`
                <div class="notification is-danger ${classMap({hidden: !this.hasPermissions() || !this.isLoggedIn() || this.isLoading()})}">
                    ${i18n.t('error-permission-message')}
                </div>` :
            html`
                <div>
                    <h2>${this.activity.getName(this.lang)}</h2>
                    <p class="subheadline">
                        ${this.activity.getDescription(this.lang)}
                    </p>

                    <div>
                        <label for="did">DID:</label>
                        <input type="text" name="did" id="did" size="64" value="${this.did}">
                    </div>
                    <div class="diplomas">
                        <div>
                        ${this.diplomas.map(diploma => html`
                            <div class="diploma">
                                <span class="header">
                                    <h3>${diploma.name}</h3>
                                    <span>
                                        <b>${diploma.educationalLevel}</b> ${i18n.t('from')} ${diploma.validFrom.substr(0, 10)}
                                    </span>
                                    <span>id = ${diploma['@id']}</span>
                                    <button @click="${this.getVC}" data-diplomaID="${diploma['@id']}">export</button>
                                </span>
                            </div>
                        `)}
                        </div>
                        ${noDiplomas}
                        ${loading}
                    </div>
                </div>
                <div class="modal micromodal-slide" id="show-diploma-modal" aria-hidden="true" style="display: ${this.showVc ? 'block' : 'none'}">
                    <div class="modal-overlay" tabindex="-2" data-micromodal-close>
                        <div class="modal-container" id="ticket-modal-box" role="dialog" aria-modal="true"
                            aria-labelledby="ticket-modal-title">
                            <main class="modal-content" id="ticket-modal-content">
                                <span class="control ticket-loading ${classMap({hidden: this.showVc})}">
                                    <span class="loading">
                                        <dbp-mini-spinner text=${i18n.t('show-active-tickets.loading-message-ticket')}></dbp-mini-spinner>
                                    </span>
                                </span>
${Object.keys(this.currentDiploma).length > 0 ? html`
                                <div class="content-wrapper">
                                    <div class="left-container">
                                         <h3 id="ticket-modal-title">
                                            ${this.currentDiploma.name}
                                         </h3>
                                        <textarea style="width:100%;height:500px" readonly wrap="soft">${this.currentDiploma.text}</textarea>
                                        <div class="btn-box">
                                            <span class="btn-box-label">${i18n.t('transfer-your-vc')}</span>
                                            <button @click="${this.copyToClipboard}">${i18n.t('transfer-your-vc-clipboard')}</button>
                                            <button @click="${() => alert('add wallet interaction here!')}">${i18n.t('transfer-your-vc-wallet')}</button>
                                        </div>
                                    </div>
                                    <button title="Close" class="modal-close" aria-label="Close modal" @click="${() => {this.closeDialog();}}">
                                        <dbp-icon title="${i18n.t('file-sink.modal-close')}" name="close" class="close-icon"></dbp-icon>
                                    </button>
                                </div>` : ''}
                            </main>
                        </div>
                    </div>
                </div>
            `}
        `;
    }
}

commonUtils.defineCustomElement('dbp-create-vc', DbpCreateVc);