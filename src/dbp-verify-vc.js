import {createInstance} from './i18n.js';
import {css, html} from 'lit-element';
import DBPEducredLitElement from "./dbp-educred-lit-element";
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import * as commonUtils from '@dbp-toolkit/common/utils';
import {Activity} from './activity.js';
import metadata from './dbp-create-vc.metadata.json';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {classMap} from 'lit-html/directives/class-map.js';
import MicroModal from "./micromodal.es";
import {Icon, LoadingButton, MiniSpinner} from "@dbp-toolkit/common";
// import {send} from "@dbp-toolkit/common/notification";

class DbpVerifyVc extends ScopedElementsMixin(DBPEducredLitElement) {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.entryPointUrl = '';
        this.activity = new Activity(metadata);
        this.loading = false;
        this.id = false;
        this.did = '';
        this.diploma = {};
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
        };
    }

    disconnectedCallback() {
        clearTimeout(this.timer);
        window.removeEventListener('focus', this.boundUpdateTicket);
        super.disconnectedCallback();
    }

    async connectedCallback() {
        super.connectedCallback();
        window.addEventListener('focus', this.boundUpdateTicket);
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

    async getVCRequest(diplomaID) {
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/ld+json',
            },
        };

        return await this.httpGetAsync(this.entryPointUrl + '//educationalcredentials/diplomas/' + diplomaID + '/verifiable', options);
    }

    /**
     * Generate a QR Code if a hash is available and valid,
     * updates the ticket and shows it in modal view
     *
     * @param {object} ticket
     */
    async showVC(ticket) {
        this.loading = true;

        if (this._('#show-vc-modal')) {
            MicroModal.show(this._('#show-vc-modal'), {
                disableScroll: true,
                onClose: modal => {
                    this.loading = false;
                    this.ticketOpen = false;
                },
            });
        }
        await this.getVCRequest(this.id);
        this.loading = false;
    }

    /**
     * Close modal dialog #show-ticket-modal
     *
     */
    closeDialog() {
        if (this._('#show-vc-modal'))
            MicroModal.close(this._('#show-vc-modal'));
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
            .vc {
                display: flex;
                justify-content: space-between;
                column-gap: 15px;
                row-gap: 1.5em;
                align-items: center;
                margin-bottom: 2em;
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

            .ticket h3 {
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

        const ticketTitle = html`
            <slot name="ticket-place">
                ${i18n.t('show-active-tickets.show-ticket-title')}<strong>${i18n.t('show-reference-ticket.place-name')}</strong>
            </slot>
        `;


        const loading = html`
            <span class="control ${classMap({hidden: !this.loading})}">
                        <span class="loading">
                            <dbp-mini-spinner text=${i18n.t('loading-message')}></dbp-mini-spinner>
                        </span>
                    </span>
        `;

        return html`

            <div class="control ${classMap({hidden: !this.isLoading()})}">
                <span class="loading">
                    <dbp-mini-spinner text=${i18n.t('loading-message')}></dbp-mini-spinner>
                </span>
            </div>

            <div class="${classMap({hidden: this.isLoading()})}">

                <h2>${this.activity.getName(this.lang)}</h2>
                <p class="subheadline">
                    <slot name="description">
                        ${this.activity.getDescription(this.lang)}
                    </slot>
                </p>

                <div class="tickets ${classMap({hidden: this.isLoading()})}">
                    <div class="${classMap({hidden: this.loading})}">
                        <div class="ticket">
                            <span class="header">
                                <h3>
                                    <slot name="place">
                                        ${i18n.t('show-active-tickets.entry-ticket')}: ${i18n.t('show-reference-ticket.place-name')}
                                    </slot>
                                </h3>
                                <span class="header">
                                    <slot name="ticket-description">
                                        <span>${i18n.t('show-reference-ticket.description')}</span>
                                    </slot>
                                </span>
                            </span>
                            <div class="btn">
                                <dbp-loading-button type="is-primary"
                                                    value="${i18n.t('show-active-tickets.show-btn-text')}"
                                                    @click="${() => {
                                                        this.showVC();
                                                    }}"
                                                    title="${i18n.t('show-active-tickets.show-btn-text')}"></dbp-loading-button>
                            </div>
                        </div>
                    </div>
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
                                </div>
                                
                                <button title="Close" class="modal-close" aria-label="Close modal" @click="${() => {
                                    this.closeDialog();
                                }}">
                                    <dbp-icon title="${i18n.t('file-sink.modal-close')}" name="close"
                                              class="close-icon"></dbp-icon>
                                </button>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        `;
    }
}

commonUtils.defineCustomElement('dbp-verify-vc', DbpVerifyVc);