import {JSDOM} from 'jsdom';
import {xmlToHtml as xth, htmlToXml as htx} from './index.js';

// eslint-disable-next-line import/export -- Ensure we get all typedefs
export * from './index.js';

const {window} = new JSDOM('');

/**
 * @param {import('./index.js').XmlToHtmlConfig} cfg
 */
// eslint-disable-next-line import/export -- Ensure we get all typedefs
export const xmlToHtml = (cfg) => {
  return xth({
    ...cfg,
    window
  });
};

/**
 * @param {import('./index.js').HtmlToXmlConfig} cfg
 */
// eslint-disable-next-line import/export -- Ensure we get all typedefs
export const htmlToXml = (cfg) => {
  return htx({
    ...cfg,
    window
  });
};
