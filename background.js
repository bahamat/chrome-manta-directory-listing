/* global chrome */
var filter = {urls: ['<all_urls>'], types: ['main_frame']};
var extra = ['responseHeaders', 'blocking'];

var dirct = 'application/x-json-stream; type=directory';

chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, filter, extra);

function onHeadersReceived(o) {
  // check if we are on a manta directory;
  // if we are, change the content-type to something
  // the browser can display
  var isdirectory = false;
  for (var i in o.responseHeaders) {
    var name = o.responseHeaders[i].name || '';
    var value = o.responseHeaders[i].value || '';
    //console.log('`%s` => `%s`', name, value);
    if (name.toLowerCase() === 'content-type' &&
        value.toLowerCase() === dirct) {
      isdirectory = true;
      o.responseHeaders[i].value = 'text/plain';
      // we store a custom header if it was a dir, so when chrome pulls the page
      // from its cache, we can determine if it is a dir
      o.responseHeaders.push({name: 'x-old-content-type', value: dirct});
      break;
    } else if (name.toLowerCase() === 'x-old-content-type' &&
        value.toLowerCase() === dirct) {
      // we are viewing a chrome cached directory
      isdirectory = true;
      break;
    }
  }

  // stop here if we are not on a directory listing
  if (!isdirectory)
    return;

  // inject the content script and css file to the current tab
  inject();
  // seriously, there is a race condition with the cache
  // so try to inject it 100ms after the initial injection,
  // the content script can deal with handling multiple injectons
  setTimeout(inject, 250);

  // return the modified response headers
  return {responseHeaders: o.responseHeaders};
}

function inject() {
  chrome.tabs.insertCSS(null, {file: 'style.css', runAt: 'document_end'});
  chrome.tabs.executeScript(null, {file: 'content.js', runAt: 'document_end'});
}
