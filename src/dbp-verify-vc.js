import {createInstance} from './i18n.js';
import {css, html} from 'lit';
import DBPEducredLitElement from './dbp-educred-lit-element';
import DbpDiploma from './dbp-diploma';
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
            'dbp-icon': Icon,
            'dbp-mini-spinner': MiniSpinner,
            'dbp-loading-button': LoadingButton,
            'dbp-diploma': DbpDiploma,
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

    /**
     * Post diploma to backend, return result
     *
     * @param text
     * @return {Promise<*>}
     */
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

    /**
     * Verify diploma by backend and update frontend
     *
     * @return {Promise<void>}
     */
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

    /**
     * Copy diploma from the clipboard (if browsers allows)
     *
     */
    copyFromClipboard() {
        navigator.clipboard.readText().then((text) => {
            this._('#vc-text').value = text;
            console.log('Async: Copying from clipboard was successful!');
        }, (err) => console.error('Async: Could not copy from clipboard. error: ', err));
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
     * Retrieve all diplomas from the wallet
     *
     * @return {Promise<void>}
     */
    async retrieveMyVC() {
        this.diplomas = await this.retrieveVC();
        //console.dir(this.diplomas);
        this.diploma = this.diplomas[0];
        this._('#vc-text').value = JSON.stringify(this.diploma, null, 2);
    }

    /* ------------------------------- */

    /**
     * Select a diploma of the shared diplomas from them wallet
     *
     */
    selectDiploma() {
        const selected = this._('#diplomas').value;
        console.log('selected: ' + selected);
        this.diplomas.forEach((item) => {
            if (selected === item.id || selected === item.credentialSubject.id) {
                this.diploma = item;
                this._('#vc-text').value = JSON.stringify(this.diploma, null, 2);
                this.render();
            }
        });
    }

    paste() {
        this.diploma = JSON.parse(this._('#vc-text').value);
        this.diplomas.push(this.diploma);
        this.render();
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

            .diploma {
                margin-top: 1rem;
                display: flex;
                justify-content: space-between;
                column-gap: 15px;
                row-gap: 1.5em;
                align-items: center;
                margin-bottom: 2em;
                border: black 1px solid;
                padding: 1em;
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
                color: var(--dbp-success);
            }

            .verify-90 {
                color: var(--dbp-danger);
            }

            #vc-modal-box {
                display: flex;
                flex-direction: column;
                padding: 0;
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
                    padding: 0;
                }

                .left-container {
                    padding: 11px 20px 20px 20px;
                }

                .content-wrapper {
                    display: flex;
                    flex-direction: column;
                    padding: 0;
                    grid-gap: inherit;
                    min-height: 100vh;
                }
            }
        `;
    }

    render() {
        const i18n = this._i18n;

        const canPaste = navigator.clipboard['readText'] !== undefined;
        const externDiploma = this.diplomas.length > 0 ? {
            "@id": this.diploma.id,
            name: this.diploma.credentialSubject.studyProgram,
            educationalLevel: this.diploma.credentialSubject.learningAchievement,
            validFrom: this.diploma.credentialSubject.dateOfAchievement,
        } : {};
        // console.log('diploma:');
        // console.dir(externDiploma);

        let statusText = '';
        if (this.status == 0) {
            statusText = i18n.t('response-other-diploma-0-text');
        } else if (this.status == 1) {
            statusText = i18n.t('response-other-diploma-1-text');
        } else if (this.status == 90) {
            statusText = i18n.t('response-other-diploma-90-text');
        }

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
                        <textarea name="text" id="vc-text" rows="12" wrap="soft" @change="${this.paste}"></textarea>
                    </div>
                    <div class="diploma ${classMap({
                        hidden: false //this.diplomas.length < 1,
                    })}">
                        <dbp-diploma diploma="${JSON.stringify(externDiploma)}" lang="${this.lang}"></dbp-diploma>
                    </div>
                    <div class="btn">
                        <dbp-loading-button
                                type="is-primary"
                                id="vc-btn"
                                value="${i18n.t('upload-btn-text')}"
                                @click="${this.verifyVC}"
                                title="${i18n.t('upload-btn-text')}"
                        ></dbp-loading-button>
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
                                          ${statusText}
                                      </span>`}
                    </div>
                </div>`}
        `;
    }
}

commonUtils.defineCustomElement('dbp-verify-vc', DbpVerifyVc);
