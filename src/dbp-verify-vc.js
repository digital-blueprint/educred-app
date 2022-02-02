import {createInstance} from './i18n.js';
import {css, html} from 'lit';
import DBPEducredLitElement from './dbp-educred-lit-element';
import {ScopedElementsMixin} from '@open-wc/scoped-elements';
import * as commonUtils from '@dbp-toolkit/common/utils';
import {Activity} from './activity.js';
import metadata from './dbp-create-vc.metadata.json';
import * as commonStyles from '@dbp-toolkit/common/styles';
import {classMap} from 'lit/directives/class-map.js';
import {Icon, LoadingButton, MiniSpinner} from '@dbp-toolkit/common';

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
        this.diplomas = [];
    }

    static get scopedElements() {
        return {
            'dbp-icon': Icon, 'dbp-mini-spinner': MiniSpinner, 'dbp-loading-button': LoadingButton,
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
            status: {type: Number, attribute: false},
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

    async postVCRequest(text) {
        let formData = new FormData();
        formData.append('text', text);

        const options = {
            method: 'POST', headers: {
                //'Content-Type': 'application/ld+json',
                Authorization: 'Bearer ' + this.auth.token,
            }, body: formData,
        };

        return await this.httpGetAsync(this.entryPointUrl + '/educationalcredentials/diplomas', options);
    }

    async verifyVC() {
        //this._('#vc-btn').disabled = true;
        const text = this._('#vc-text').value;
        //console.log(text);

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
        navigator.clipboard.readText().then((text) => {
            this._('#vc-text').value = text;
            console.log('Async: Copying from clipboard was successful!');
        }, (err) => console.error('Async: Could not copy from clipboard. error: ', err));
    }

    /* experimental wallet integration */
    async getMyDID() {
        this.did = await this.getDID();
    }

    async retrieveMyVC() {
        this.diplomas = await this.retrieveVC();
        //console.dir(this.diplomas);
        this.diploma = this.diplomas[0];
        this._('#vc-text').value = JSON.stringify(this.diploma, null, 2);
    }

    /* ------------------------------- */

    selectDiploma() {
        const selected = this._('#diplomas').value;
        console.log('selected: ' + selected);
        this.diplomas.forEach((item) => {
            if (selected === item.id || selected === item.credentialSubject.id) {
                this.diploma = item;
                this._('#vc-text').value = JSON.stringify(this.diploma, null, 2);
            }
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
            ${commonStyles.getLinkCss()}
            .vc {
                margin-bottom: 1rem;
            }

            .vc-text {
                width: 100%;
                margin-top: 1rem;
                margin-bottom: 1rem;
            }

            .vc-text textarea {
                width: 100%;
            }

            .vc-select {
                width: 100%;
                margin-top: 1rem;
            }

            select:not(.select) {
                background-size: 16px;
                background-position-x: calc(100% - 0.4rem);
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

            #vc-modal-box {
                display: flex;
                flex-direction: column;
                padding: 0px;
                min-width: 700px;
                max-width: 880px;
                min-height: unset;
                height: auto;
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

            .hidden {
                display: none;
            }

            @media only screen and (orientation: landscape) and (max-width: 768px) {
                #vc-modal-box {
                    height: 100%;
                    width: 100%;
                    max-width: unset;
                    max-height: unset;
                }

                #vc-modal-content > div:first-of-type,
                .content-wrapper {
                    height: 100%;
                }

                .left-container,
                .proof-container,
                .information-container {
                    justify-content: space-evenly;
                }
            }

            @media only screen and (orientation: portrait) and (max-width: 768px) {
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
            }
        `;
    }

    render() {
        const i18n = this._i18n;

        const canPaste = navigator.clipboard['readText'] !== undefined;

        return html`
            <div class="notification is-warning ${classMap({
                hidden: this.isLoggedIn() || this.isLoading(),
            })}">${i18n.t('error-login-message')}
            </div>

            <div class="control ${classMap({hidden: this.isLoggedIn() || !this.isLoading()})}">
                <span class="loading">
                    <dbp-mini-spinner text=${i18n.t('loading-message')}></dbp-mini-spinner>
                </span>
            </div>
            ${!this.isLoggedIn() || !this.hasPermissions() ? html`
                <div class="notification is-danger ${classMap({
                    hidden: !this.hasPermissions() || !this.isLoggedIn() || this.isLoading(),
                })}">${i18n.t('error-permission-message')}
                </div>` : html`
                <div class="vc">
                    <div class="header">
                        <h3>${i18n.t('upload-other-diploma')}</h3>
                        <span>${i18n.t('upload-other-diploma-text')}</span>
                    </div>
                    <div class="btn-box">
                        <span class="btn-box-label">${i18n.t('fetch-your-vc')}</span>
                        <button class="button is-secondary"
                                @click="${this.copyFromClipboard}"
                                ?disabled="${!canPaste}">
                            ${i18n.t('fetch-your-vc-clipboard')}
                        </button>
                        <button class="button is-secondary"
                                @click="${this.retrieveMyVC}">
                            wallet
                        </button>
                    </div>
                    <div class="control vc-select ${classMap({
                        hidden: this.diplomas.length < 2,
                    })}">
                        <select name="diploma_index"
                                id="diplomas"
                                @change="${this.selectDiploma}"
                                style="width:100%">
                            ${this.diplomas.map((item) => html`
                                <option value="${item.id}">
                                    ${item.credentialSubject.studyProgram}
                                </option>`)}
                        </select>
                    </div>
                    <div class="vc-text">
                        <textarea name="text" id="vc-text" rows="12" wrap="soft"></textarea>
                    </div>
                    <div class="btn">
                        <dbp-loading-button
                                type="is-primary"
                                id="vc-btn"
                                value="${i18n.t('upload-btn-text')}"
                                @click="${this.verifyVC}"
                                title="${i18n.t('upload-btn-text')}">
                        </dbp-loading-button>
                    </div>
                    <div class="response">
                        <span>${i18n.t('response-other-diploma')}</span>
                        ${this.loading ? html`<span
                                class="control ${classMap({hidden: !this.loading})}">
                                          <span class="loading">
                                              <dbp-mini-spinner
                                                      text=${i18n.t('loading-message')}></dbp-mini-spinner>
                                          </span>
                                      </span>` : html`<span class="verify-${this.status}">
                                          ${i18n.t('response-other-diploma-' + this.status + '-text')}
                                      </span>`}
                    </div>
                </div>`}
        `;
    }
}

commonUtils.defineCustomElement('dbp-verify-vc', DbpVerifyVc);
