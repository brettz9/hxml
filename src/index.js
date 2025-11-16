const xhtmlNS = 'http://www.w3.org/1999/xhtml';

// Note that "xml" in any case is prohibited at the beginning of
//   `data-*` attributes.
const prefix = 'hxml';

/**
 * @typedef {object} XmlToHtmlConfig The configuration object
 * @property {import('jsdom').DOMWindow|
 *   typeof globalThis} window The window object
 * @property {string|string[]} [xml] Array of XML to convert. Defaults to all
 *  script tags of type application/xml or text/xml
 * @property {boolean} [firstResultOnly] Whether to only return the first
 *   result of an array (if an array was obtained or supplied)
 * @property {string} [elementName] Element name to create for XML-as-HTML
 *   elements. Defaults to <a>, but <span> or <div> may also make reasonable
 *   candidates (<a> was chosen as the default as it can support block or
 *   inline content).
 * @property {boolean} [convertXHTML] Whether to convert XHTML in addition
 *   to all non-ignored namespaces. Defaults to false.
 * @property {string[]|string} [ignoredNamespaces] Namespaces to avoid
 *   converting. Defaults to XHTML only.
 */

/**
 * @param {XmlToHtmlConfig} config The configuration object
 * @returns {HTMLDocument[]|HTMLDocument} Array of HTML elements or a single
 *   HTML element
 * @todo Could accept DOM or array of DOM (or NodeList) as argument for XML,
 *   with option to convert in place
 */
function xmlToHtml (config) {
  const {
    window,
    elementName = 'a',
    convertXHTML = false
  } = config;

  // Todo: Allow map of XML element/namespace to output element name?
  const ignoredNamespaces = [xhtmlNS, ...config.ignoredNamespaces ?? []];

  const {document, DOMParser} = window;

  let {xml: xmls, firstResultOnly} = config;

  xmls = xmls || [
    ...document.querySelectorAll(
      'script[type="application/xml"],script[type="text/xml"]'
    )
  ].map(function (script) {
    return script.textContent;
  });
  if (!Array.isArray(xmls)) {
    firstResultOnly = true;
    xmls = [xmls];
  }

  const ret = xmls.map(function (xmlStr) {
    // Dummy needed for insertBefore and any root-level
    //   comments/processing instructions
    const xml = new DOMParser().parseFromString(
      '<html:html xmlns:html="' + xhtmlNS + '">' +
        xmlStr + '</html:html>', 'text/xml'
    );

    /** @type {HTMLElement} */
    let iteratingElement;
    /**
     * @param {Attr} att
     * @param {number} i
     * @returns {void}
     */
    function setAttribute (att, i) {
      iteratingElement.dataset[prefix + 'Attribute' + (i + 1)] =
        att.name + '="' + att.value + '"';
    }

    const doc = document.implementation.createDocument(xhtmlNS, 'html', null);

    /**
     * @param {Node} currentNode
     * @returns {Node}
     */
    function replaceNodes (currentNode) {
      /** @type {HTMLElement|undefined} */
      let newElement;

      const currentElement = /** @type {HTMLElement} */ (currentNode);
      if ('localName' in currentElement && currentElement.localName &&
        ((convertXHTML && 'namespaceURI' in currentElement &&
          currentElement.namespaceURI === xhtmlNS) ||
        !ignoredNamespaces.includes(String(currentElement.namespaceURI)))
      ) {
        newElement = document.createElementNS(xhtmlNS, elementName);
        newElement.dataset[prefix + 'Element'] = currentElement.localName;
        iteratingElement = newElement;
        [...currentElement.attributes].forEach((att, idx) => {
          setAttribute(att, idx);
        });
        currentElement.before(newElement);

        [...currentNode.childNodes].forEach(function (node) {
          newElement?.append(replaceNodes(node));
        });
        currentElement.remove();
      }
      return newElement || currentNode;
    }
    return [...xml.documentElement.childNodes].reduce((docum, childNode) => {
      docum.documentElement.append(replaceNodes(childNode));
      return docum;
    }, doc);
  });
  return firstResultOnly ? ret[0] : ret;
}

/**
 * @typedef {object} HtmlToXmlConfig The configuration object
 * @property {import('jsdom').DOMWindow|
 *   typeof globalThis} window The window object
 * @property {HTMLDocument} html
 */

/**
 * @param {HTMLElement} htmlElem
 * @throws {TypeError}
 * @returns {{
 *   elem: string,
 *   xmlNs: string|undefined,
 *   attValues: {name: string, value: string}[]
 * }}
 */
function getAttributes (htmlElem) {
  const elem = htmlElem.dataset.hxmlElement;
  if (!elem) {
    throw new TypeError('Missing valid hxml element');
  }
  const colonPos = elem.indexOf(':');
  let attribute;
  let xmlNs;
  let attNum = 1;

  /** @type {{name: string, value: string}[]} */
  const attValues = [];
  do {
    attribute = htmlElem.dataset['hxmlAttribute' + attNum];
    if (attribute) {
      attNum++;
      const pos = attribute.indexOf('=');
      if (pos === -1) {
        throw new TypeError('Invalid hxml attribute');
      }
      const name = attribute.slice(0, pos);
      // Skip quotes
      const value = attribute.slice(pos + 2, -1);

      if (
        // Default namespace
        (name === 'xmlns' && colonPos === -1) ||
        // Prefixed namespace
        (name.startsWith('xmlns:') && colonPos !== -1 &&
        name.slice(6) === elem.slice(0, colonPos))
      ) {
        xmlNs = value;
      } else {
        attValues.push({name, value});
      }
    }
  } while (attribute);

  return {
    elem,
    xmlNs,
    attValues
  };
}

/**
 * @param {HtmlToXmlConfig} config The configuration object
 * @throws {TypeError}
 * @returns {XMLDocument}
 */
function htmlToXml ({html, window}) {
  const {document} = window;
  // eslint-disable-next-line prefer-destructuring -- TS
  const firstElementChild = /** @type {HTMLElement} */ (
    html.documentElement.firstElementChild
  );
  const {
    xmlNs, elem: root, attValues
  } = getAttributes(firstElementChild);

  const xmlDoc = document.implementation.createDocument(
    xmlNs ?? '', root, null
  );
  attValues.forEach(({name, value}) => {
    xmlDoc.documentElement.setAttribute(name, value);
  });

  /**
   * @param {Element} xmlElement
   * @returns {(childNode: Node) => void}
   */
  function getProcessChildNode (xmlElement) {
    return function processChildNode (childNode) {
      if (childNode.nodeType !== 1) {
        xmlElement.append(childNode.cloneNode(true));
        return;
      }
      const elem = /** @type {HTMLElement} */ (childNode);

      const {
        xmlNs: childXmlNs, elem: xmlElemStr, attValues: attVals
      } = getAttributes(elem);

      const xmlEl = document.createElementNS(
        childXmlNs ?? xmlElement.namespaceURI ?? '',
        xmlElemStr
      );

      attVals.forEach(({name, value}) => {
        xmlEl.setAttribute(name, value);
      });

      xmlElement.append(xmlEl);

      [...elem.childNodes].forEach((node) => {
        getProcessChildNode(xmlEl)(node);
      });
    };
  }
  [...firstElementChild.childNodes].forEach(
    getProcessChildNode(xmlDoc.documentElement)
  );
  return xmlDoc;
}

export {xmlToHtml, htmlToXml};
