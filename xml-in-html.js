/*global DOMParser, NodeFilter*/
/*jslint vars:true*/
(function () {'use strict';

if (![].includes) {
  Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
    if (this === undefined || this === null) {
      throw new TypeError('Cannot convert this value to object');
    }
    var O = Object(this);
    var len = parseInt(O.length, 10) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1], 10) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) {
        return true;
      }
      k++;
    }
    return false;
  };
}


/**
* @param {object} [config={}] The configuration object
* @param {string|array} [config.xmls] Array of XML to convert. Defaults to all script tags of type application/xml or text/xml
* @param {boolean} [config.firstResultOnly=false] Whether to only return the first result of an array (if an array was obtained or supplied)
* @param {string} [config.elementName=a] Element name to create for XML-as-HTML elements. Defaults to <a>, but <span> or <div> may also make reasonable candidates (<a> was chosen as the default as it can support block or inline content).
* @param {boolean} [config.convertXHTML=false] Whether to convert XHTML in addition to all non-ignored namespaces. Defaults to false.
* @param {array|string} [config.ignoredNamespaces=['http://www.w3.org/1999/xhtml']] Namespaces to avoid converting. Defaults to XHTML only.
* @returns {array|HTMLElement} Array of HTML elements or a single HTML element
* @todo Could accept DOM or array of DOM (or NodeList) as argument for XML, with option to convert in place
*/
var xhtmlNS = 'http://www.w3.org/1999/xhtml';
function XMLToHTML (config) {
    config = config || {};
    var xmls = config.xml;
    var firstResultOnly = config.firstResultOnly;
    var elementName = config.elementName || 'a'; // Todo: Allow map of XML element/namespace to output element name?
    var convertXHTML = config.convertXHTML || false;
    var ignoredNamespaces = [xhtmlNS].concat(config.ignoredNamespaces);
    
    
    xmls = xmls || Array.from(document.querySelectorAll('script[type="application/xml"],script[type="text/xml"]')).map(function (script) {return script.innerHTML;});
    if (!Array.isArray(xmls)) {
        firstResultOnly = true;
        xmls = [xmls];
    }

    var ret = xmls.map(function (xml) {
        xml = new DOMParser().parseFromString('<html xmlns="' + xhtmlNS + '">' + xml + '</html>', 'text/xml'); // Dummy needed for insertBefore and any root-level comments/processing instructions

        var currentNode, iteratingNode;
        function setAttribute (att, i) {
            iteratingNode.dataset['hxmlAttribute' + (i + 1)] = att.name + '="' + att.value + '"';
        }
        
        var doc = document.implementation.createDocument(xhtmlNS, 'html', null);
        function replaceNodes (currentNode) {
            var newNode;
            if (currentNode.localName && ((convertXHTML && currentNode.namespaceURI === xhtmlNS) || !ignoredNamespaces.includes(currentNode.namespaceURI))) {
                newNode = document.createElementNS(xhtmlNS, elementName);
                newNode.dataset.hxmlElement = currentNode.localName;
                iteratingNode = newNode;
                Array.from(currentNode.attributes || []).forEach(setAttribute);
                currentNode.parentNode.insertBefore(newNode, currentNode);
                
                Array.from(currentNode.childNodes).forEach(function (node) {
                    newNode.appendChild(replaceNodes(node));
                });
                currentNode.parentNode.removeChild(currentNode);
            }
            return newNode || currentNode;
        }
        return Array.from(xml.documentElement.childNodes).reduce(function (doc, childNode) {
            doc.documentElement.appendChild(replaceNodes(childNode));
            return doc;
        }, doc);
    });
    return firstResultOnly ? ret[0] : ret;
}

/**
* @param {object} [config={}] The configuration object
* @todo Implement (and export)!
*/
/*
function HTMLToXML (config) {
    
}
*/


window.XMLToHTML = XMLToHTML;
// window.HTMLToXML = HTMLToXML;

}());