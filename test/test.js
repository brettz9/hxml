import {expect} from 'chai';
import {xmlToHtml} from '../src/index-node.js';

describe('`xmlToHtml`', () => {
  it('`xmlToHtml`', () => {
    const xml = `<root><ab/></root>`;
    const html = xmlToHtml({xml});
    expect(html.documentElement.outerHTML).to.equal(
      '<html xmlns="http://www.w3.org/1999/xhtml">' +
        '<a data-hxml-element="root"><a data-hxml-element="ab"></a></a></html>'
    );
  });
});
