import {createInstance} from './i18n.js';
import {css, html} from 'lit';
import DBPLitElement from '@dbp-toolkit/common/dbp-lit-element';
import * as commonUtils from '@dbp-toolkit/common/utils';
import * as commonStyles from '@dbp-toolkit/common/styles';

export default class DbpDiploma extends DBPLitElement {
    constructor() {
        super();
        this._i18n = createInstance();
        this.lang = this._i18n.language;
        this.diploma = {};
    }

    static get properties() {
        return {
            ...super.properties,
            lang: {type: String},
            diploma: {type: Object},
        };
    }

    update(changedProperties) {
        changedProperties.forEach((oldValue, propName) => {
            switch (propName) {
                case 'lang':
                    this._i18n.changeLanguage(this.lang);
                    break;
                // case 'diploma':
                //     console.dir(this.diploma.id);
                //     break;
            }
        });
        super.update(changedProperties);
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
            
            .diploma {
                display: flex;
                justify-content: space-between;
                column-gap: 15px;
                row-gap: 1.5em;
                align-items: center;
            }
            
            .header {
                display: grid;
                align-items: center;
            }
        `;
    }

    render() {
        const i18n = this._i18n;

        const name = this.diploma.name ?? '';
        const educationalLevel = this.diploma.educationalLevel ?? '';
        const validFrom = this.diploma.validFrom ?? '';
        const id = this.diploma['@id'] ?? '';

        // if (id === '') {
        //     return '';
        // }

        return html`
            <div class="diploma">
                <span class="header">
                  <h3>${name}</h3>
                  <span>
                      <b>${educationalLevel}</b>
                      ${i18n.t('from')}
                      ${validFrom.substr(0, 10)}
                  </span>
                  <span>id = ${id}</span>
                </span>
            </div>`;
    }
}

commonUtils.defineCustomElement('dbp-diploma', DbpDiploma);
