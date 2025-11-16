import {JSDOM} from 'jsdom';
import {xmlToHtml as xth} from './index.js';

// eslint-disable-next-line import/export -- Ensure we get all typedefs
export * from './index.js';

/**
 * @param {import('./index.js').XmlToHtmlConfig} cfg
 */
// eslint-disable-next-line import/export -- Ensure we get all typedefs
export const xmlToHtml = (cfg) => {
  return xth({
    ...cfg,
    window: new JSDOM('').window
  });
};
