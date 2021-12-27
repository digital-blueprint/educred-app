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
import metadata from "./dbp-list-diplomas.metadata.json";


class DbpListDiplomas extends ScopedElementsMixin(DBPEducredLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.entryPointUrl = '';
        this.activity = new Activity(metadata);
        this.loading = false;
        this.diplomas = [];
        this.locationName = 'Diploma';
        this.currentDiploma = {};
        this.loadingDiplomas = true;
        this.setTimeoutIsSet = false;
        this.timer = '';

        this.boundUpdateTicketwrapper = this.updateTicketWrapper.bind(this);
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
            currentDiploma: {type: Object, attribute: false},
            loadingDiplomas: {type: Boolean, attribute: false},
        };
    }

    disconnectedCallback() {
        clearTimeout(this.timer);
        window.removeEventListener('focus', this.boundUpdateTicketwrapper);
        super.disconnectedCallback();
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('focus', this.boundUpdateTicketwrapper);
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
        this.getListOfDiplomas();
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

        let response = await this.getAllDiplomasRequest();
        await this.checkDiplomasRequest(response);
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
            console.log("Update diplomas failed");
        }
        this.loadingDiplomas = false;
    }

    /**
     * Close modal dialog #show-diploma-modal
     *
     */
    closeDialog() {
        if (this._('#show-diploma-modal'))
            MicroModal.close(this._('#show-diploma-modal'));
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
                background-color: var(--dbp-info-bg-color);;
                color: var(--dbp-info-text-color);;
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
                border-bottom: 1px solid white;;
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
                grid-template-columns: 1fr 1fr;
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

        const ticketTitle = html`
            ${i18n.t('show-active-tickets.show-ticket-title')}
            <strong>${this.locationName}</strong>
           `;


        const loading = html`
            <span class="control ${classMap({hidden: !this.loading && !this.loadingTickets})}">
                            <span class="loading">
                                <dbp-mini-spinner text=${i18n.t('loading-message')}></dbp-mini-spinner>
                            </span>
                        </span>
        `;

        const noDiplomas = this.diplomas.count() === 0 ? html`no diplomas` : '';

        return html`

            <div class="notification is-warning ${classMap({hidden: this.isLoggedIn() || this.isLoading()})}">
                ${i18n.t('error-login-message')}
            </div>

            <div class="control ${classMap({hidden: this.isLoggedIn() || !this.isLoading()})}">
                <span class="loading">
                    <dbp-mini-spinner text=${i18n.t('loading-message')}></dbp-mini-spinner>
                </span>
            </div>

            ${!this.hasPermissions() ? 
            html` 
                <div class="notification is-danger ${classMap({hidden: this.hasPermissions() || !this.isLoggedIn() || this.isLoading()})}">
                    ${i18n.t('error-permission-message')}
                </div>` :
            html`
                <div class="${classMap({hidden: !this.isLoggedIn() || this.isLoading()})}">

                    <h2>${this.activity.getName(this.lang)}</h2>
                    <p class="subheadline">
                        ${this.activity.getDescription(this.lang)}
                    </p>

                    <div class="diplomas ${classMap({hidden: !this.isLoggedIn() || this.isLoading()})}">
                        <div class="${classMap({hidden: this.loading})}">
                        ${this.diplomas.map(diploma => html`
                            <div class="diploma">
                                <span class="header">
                                    <h3>${i18n.t('list-diplomas.entry-diploma')}: ${this.locationName}</h3>
                                    <span class="header">
                                        <span>
                                            <b>Spalte 1</b>
                                        </span>
                                    </span>
                                </span>
                            </div>
                        `)}
                        </div>
                        ${noDiplomas}
                        ${loading}
                    </div>
                </div>
                <div class="modal micromodal-slide" id="show-ticket-modal" aria-hidden="true">
                    <div class="modal-overlay" tabindex="-2" data-micromodal-close>
                        <div class="modal-container" id="ticket-modal-box" role="dialog" aria-modal="true"
                            aria-labelledby="ticket-modal-title">
                            <main class="modal-content" id="ticket-modal-content">
                                <span class="control ticket-loading ${classMap({hidden: !this.ticketLoading})}">
                                    <span class="loading">
                                        <dbp-mini-spinner text=${i18n.t('show-active-tickets.loading-message-ticket')}></dbp-mini-spinner>
                                    </span>
                                </span>

                                <div class="content-wrapper">
                                    <div class="left-container ${classMap({hidden: this.ticketLoading})}">
                                         <h3 id="ticket-modal-title">
                                            ${ticketTitle}
                                        </h3>
                                        <div class="reload-failed ${classMap({hidden: !this.showReloadButton})}">
                                            <p> ${i18n.t('reload-failed')}</p>
                                            <button id="reload-btn" 
                                                    class="button" 
                                                    @click="${() => {this.updateTicketAndNotify();}}"
                                                    title="${i18n.t('reload')}">
                                                <dbp-icon title="${i18n.t('reload')}" 
                                                      name="reload" class="reload-icon"></dbp-icon>
                                            </button>
                                        </div>
                                        <div class="foto-container">
                                            <img src="${this.ticketImage || ''}" 
                                                 alt="${i18n.t('image-alt-text')}" />
                                        </div>
                                    </div>
                                    <button title="Close" class="modal-close" aria-label="Close modal" @click="${() => {this.closeDialog();}}">
                                        <dbp-icon title="${i18n.t('file-sink.modal-close')}" name="close" class="close-icon"></dbp-icon>
                                    </button>
                                </div>
                            </main>
                        </div>
                    </div>
                </div>
            `}
        `;
    }
}

commonUtils.defineCustomElement('dbp-list-diplomas', DbpListDiplomas);