import {expect} from 'chai';
import {JSDOM} from 'jsdom';
import {xmlToHtml, htmlToXml} from '../src/index-node.js';

describe('`xmlToHtml`', () => {
  it('`xmlToHtml` (simple)', () => {
    const xml = `<root><ab/></root>`;
    const html = xmlToHtml({xml});
    expect(html.documentElement.outerHTML).to.equal(
      '<html xmlns="http://www.w3.org/1999/xhtml">' +
        '<a data-hxml-element="root"><a data-hxml-element="ab"></a></a></html>'
    );
  });

  it('`xmlToHtml` (complex)', () => {
    const xml = `<myXML xmlns="http://brett-zamir.me/namespaces/exampleNamespace">
    <?procinst something="somethingElse" ?>
    <someChild></someChild>
    <!-- A comment -->
    <![CDATA[
        Some <&'" cdata
    ]]>
    <childWithContent>someContent<lb /></childWithContent>
    <anotherChild
      withAnAtt="yes" withAnotherAtt="also"
      ns:att="123" xmlns:ns="aNS">
    </anotherChild>
</myXML>`;
    const html = xmlToHtml({xml});
    expect(html.documentElement.outerHTML).to.equal(
      '<html xmlns="http://www.w3.org/1999/xhtml">' +
        '<a data-hxml-element="myXML" data-hxml-attribute1="xmlns=&quot;http://brett-zamir.me/namespaces/exampleNamespace&quot;">\n' +
        '    <?procinst something="somethingElse" ?>\n' +
        '    <a data-hxml-element="someChild"></a>\n' +
        '    <!-- A comment -->\n' +
        '    <![CDATA[\n' +
        '        Some <&\'" cdata\n' +
        '    ]]>\n' +
        // eslint-disable-next-line @stylistic/max-len -- Long
        '    <a data-hxml-element="childWithContent">someContent<a data-hxml-element="lb"></a></a>\n' +
        // eslint-disable-next-line @stylistic/max-len -- Long
        '    <a data-hxml-element="anotherChild" data-hxml-attribute1="withAnAtt=&quot;yes&quot;" data-hxml-attribute2="withAnotherAtt=&quot;also&quot;" data-hxml-attribute3="ns:att=&quot;123&quot;" data-hxml-attribute4="xmlns:ns=&quot;aNS&quot;">\n' +
        '    </a>\n' +
        '</a></html>'
    );
  });
});

describe('`htmlToXml', () => {
  it('`htmlToXml (simple)', () => {
    const xml = `<root><ab/></root>`;
    const html = xmlToHtml({xml});
    const xmlDoc = htmlToXml({html});
    const {window: {XMLSerializer}} = new JSDOM('');

    expect(new XMLSerializer().serializeToString(
      xmlDoc.documentElement
    )).to.equal(xml);
  });

  it('`htmlToXml (complex)', () => {
    const xml = `<myXML a="b" xmlns="http://brett-zamir.me/namespaces/exampleNamespace">
    <?procinst something="somethingElse" ?>
    <someChild></someChild>
    <!-- A comment -->
    <![CDATA[
        Some <&'" cdata
    ]]>
    <childWithContent>someContent<lb /></childWithContent>
    <anotherChild
      withAnAtt="yes" withAnotherAtt="also"
      ns:att="123" xmlns:ns="aNS">
    </anotherChild>
</myXML>`;
    const html = xmlToHtml({xml});
    const xmlDoc = htmlToXml({html});
    const {window: {XMLSerializer}} = new JSDOM('');
    /* eslint-disable @stylistic/max-len -- Long */
    expect(new XMLSerializer().serializeToString(
      xmlDoc.documentElement
    )).to.equal(`<myXML xmlns="http://brett-zamir.me/namespaces/exampleNamespace" a="b">
    <?procinst something="somethingElse" ?>
    <someChild/>
    <!-- A comment -->
    <![CDATA[
        Some <&'" cdata
    ]]>
    <childWithContent>someContent<lb/></childWithContent>
    <anotherChild withAnAtt="yes" withAnotherAtt="also" ns:att="123" xmlns:ns="aNS">
    </anotherChild>
</myXML>`);
    /* eslint-enable @stylistic/max-len -- Long */
  });
});
