import {createInstance} from './i18n.js';
import {css, html} from 'lit';
import DBPEducredLitElement from './dbp-educred-lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import * as commonUtils from '@dbp-toolkit/common/utils';
import {Icon, InlineNotification, LoadingButton, MiniSpinner} from '@dbp-toolkit/common';
import {classMap} from 'lit/directives/class-map.js';
import MicroModal from './micromodal.es';
import * as commonStyles from '@dbp-toolkit/common/styles';
//import {send} from "@dbp-toolkit/common/notification";
import {InfoTooltip} from '@dbp-toolkit/tooltip';
import {Activity} from './activity';
import metadata from './dbp-create-vc.metadata.json';

class DbpCreateVc extends ScopedElementsMixin(DBPEducredLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.entryPointUrl = '';
        this.activity = new Activity(metadata);
        this.loading = false;
        this.diplomas = [];
        this.did = '';
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
                case 'lang':
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
            method: 'GET', headers: {
                'Content-Type': 'application/ld+json', Authorization: 'Bearer ' + this.auth.token,
            },
        };

        return await this.httpGetAsync(this.entryPointUrl + '/educationalcredentials/diplomas/' + diplomaID, options);
    }

    /**
     * Gets a specific vc from diploma
     *
     * @param diplomaID
     * @param format
     * @returns {object} response
     */
    async getVCRequest(diplomaID, format) {
        const vars = {
            did: this.did, format: format ? 'jsonldjwt' : '',
        };
        const options = {
            method: 'POST', headers: {
                'Content-Type': 'application/ld+json', Authorization: 'Bearer ' + this.auth.token,
            }, body: JSON.stringify(vars),
        };
        return await this.httpGetAsync(this.entryPointUrl + '/educationalcredentials/diplomas/' + diplomaID + '/verifiable', options);
    }

    async getVC(event) {
        const diplomaID = event.target.attributes.getNamedItem('data-diplomaid').nodeValue;
        if (!this.isLoggedIn()) {
            return;
        }
        const newDID = this._('#did').value;
        const asJWT = this._('#format').checked;

        this.did = newDID;
        const id = diplomaID.replace('/educationalcredentials/diplomas/', '');
        const response = await this.getVCRequest(id, asJWT);
        this.currentDiploma = await response.json();
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
            method: 'GET', headers: {
                'Content-Type': 'application/ld+json', Authorization: 'Bearer ' + this.auth.token,
            },
        };

        return await this.httpGetAsync(this.entryPointUrl + '/educationalcredentials/diplomas', options);
    }

    /**
     * Get a list of active diplomas and checks the response of the request
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
            console.log('Loading diplomas has failed');
        }
        this.loadingDiplomas = false;
        this.loading = false;
    }

    /**
     * Open modal dialog #show-diploma-modal
     *
     */
    openDialog() {
        if (this._('#show-diploma-modal')) MicroModal.show(this._('#show-diploma-modal'), {
            disableScroll: true, onClose: (modal) => {
                this.showVc = false;
            },
        });
    }

    /**
     * Close modal dialog #show-diploma-modal
     *
     */
    closeDialog() {
        if (this._('#show-diploma-modal')) MicroModal.close(this._('#show-diploma-modal'));
    }

    /**
     * Copy the current diploma to the clipboard
     *
     */
    copyToClipboard() {
        const text = this.currentDiploma.text;
        navigator.clipboard.writeText(text).then(
            () => console.log('Async: Copying to clipboard was successful!'),
            (err) => console.error('Async: Could not copy text: ', err));
    }

    /* experimental wallet integration */

    /**
     * Get the user's DID from the wallet
     *
     * @return {Promise<void>}
     */
    async getMyDID() {
        this.did = await this.getDID();
    }

    /**
     * Save the current diploma to the wallet
     *
     * @return {Promise<void>}
     */
    async saveMyVC() {
        const chapiVerifiableCredential = JSON.parse(this.currentDiploma.text);
        const result = await this.saveVC(chapiVerifiableCredential);
        console.dir(result);
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

            .diploma h3 {
                margin-bottom: 0.2rem;
            }

            .flex {
                display: flex;
            }

            .flex-center {
                justify-content: center;
            }

            .hidden {
                display: none;
            }

            @media only screen and (orientation: landscape) and (max-width: 768px) {
                #diploma-modal-content,
                #diploma-modal-content > div:first-of-type,
                .content-wrapper,
                #qr-code-hash svg {
                    height: 100%;
                }

                .left-container,
                .proof-container,
                .information-container {
                    justify-content: space-evenly;
                }
            }

            @media only screen and (orientation: portrait) and (max-width: 768px) {
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
            }
        `;
    }

    render() {
        const i18n = this._i18n;

        return html`
            <div class="notification is-warning ${classMap({
                hidden: this.isLoggedIn() || this.isLoading(),
            })}">
                ${i18n.t('error-login-message')}
            </div>

            ${!this.isLoggedIn() || !this.hasPermissions() ? html`
                <div class="notification is-danger ${classMap({
                    hidden: !this.hasPermissions() || !this.isLoggedIn() || this.isLoading(),
                })}">
                    ${i18n.t('error-permission-message')}
                </div>` : html`
                <div>
                    <h2>${this.activity.getName(this.lang)}</h2>
                    <p class="subheadline">${this.activity.getDescription(this.lang)}</p>

                    <div>
                        <label for="did">DID:</label>
                        <input type="text"
                               name="did"
                               id="did"
                               size="64"
                               value="${this.did}"/>
                        <button class="button is-secondary" @click="${this.getMyDID}">
                            get from wallet
                        </button>
                    </div>
                    <div>
                        <label for="format">JWT:</label>
                        <input type="checkbox" name="format" id="format" value="1"/>
                    </div>
                    <div class="diplomas">
                        <div>${this.diplomas.map((diploma) => html`
                            <div class="diploma">
                                <span class="header">
                                  <h3>${diploma.name}</h3>
                                  <span>
                                      <b>${diploma.educationalLevel}</b>
                                      ${i18n.t('from')}
                                      ${diploma.validFrom.substr(0, 10)}
                                  </span>
                                  <span>id = ${diploma['@id']}</span>
                                  <button class="button is-secondary"
                                          @click="${this.getVC}"
                                          data-diplomaID="${diploma['@id']}">
                                      export
                                  </button>
                                </span>
                            </div>
                        `)}
                        </div>
                        ${this.diplomas.length === 0 ? html`<p>sorry, you have no diplomas jet</p>` : ''}
                    </div>
                </div>
                <div class="modal micromodal-slide"
                     id="show-diploma-modal"
                     aria-hidden="true"
                     style="display: ${this.showVc ? 'block' : 'none'}">
                    <div class="modal-overlay" tabindex="-2" data-micromodal-close>
                        <div class="modal-container"
                             id="diploma-modal-box"
                             role="dialog"
                             aria-modal="true"
                             aria-labelledby="diploma-modal-title">
                            <main class="modal-content" id="diploma-modal-content">
                                <span class="control diploma-loading ${classMap({
                                    hidden: this.showVc,
                                })}">
                                    <span class="loading">
                                        <dbp-mini-spinner text=${i18n.t('loading-message')}
                                        ></dbp-mini-spinner>
                                    </span>
                                </span>
                                ${Object.keys(this.currentDiploma).length > 0 ? html`
                                    <div class="content-wrapper">
                                        <div class="left-container">
                                            <h3 id="diploma-modal-title">${this.currentDiploma.name}</h3>
                                            <textarea
                                                    style="width:100%"
                                                    rows="12"
                                                    readonly
                                                    wrap="soft"
                                            >${this.currentDiploma.text}</textarea>
                                            <div class="btn-box">
                                                <span class="btn-box-label">${i18n.t('transfer-your-vc')}</span>
                                                <button class="button is-secondary"
                                                        @click="${this.copyToClipboard}">
                                                    ${i18n.t('transfer-your-vc-clipboard')}
                                                </button>
                                                <button class="button is-secondary"
                                                        @click="${this.saveMyVC}"
                                                        ?disabled="${this._('#format').checked}">
                                                    ${i18n.t('transfer-your-vc-wallet')}
                                                </button>
                                            </div>
                                        </div>
                                        <button title="Close"
                                                class="modal-close"
                                                aria-label="Close modal"
                                                @click="${this.closeDialog}">
                                            <dbp-icon
                                                    name="close"
                                                    title="${i18n.t('file-sink.modal-close')}"
                                                    class="close-icon"></dbp-icon>
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
