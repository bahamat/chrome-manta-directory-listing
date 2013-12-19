var filter = {urls: ['<all_urls>']};
var extra = ['responseHeaders', 'blocking'];

chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, filter, extra);

function onHeadersReceived(o) {
  // filter out any asset requests
  if (o.type !== 'main_frame')
    return;

  // filter out requests with a search query marker
  var search = o.url.split('?')[1];
  if (search && search.indexOf('marker=') > -1)
    return;

  // check if we are on a manta directory;
  // if we are, change the content-type to something
  // the browser can display
  var isdirectory = false;
  for (var i in o.responseHeaders) {
    var name = o.responseHeaders[i].name || '';
    var value = o.responseHeaders[i].value || '';
    //console.log('`%s` => `%s`', name, value);
    if (name.toLowerCase() === 'content-type' &&
        value.toLowerCase() === 'application/x-json-stream; type=directory') {
      isdirectory = true;
      o.responseHeaders[i].value = 'text/plain';
      break;
    }
  }

  // stop here if we are not on a directory listing
  if (!isdirectory)
    return;

  // inject the content script and css file to the current tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var tab = tabs[0];
    chrome.tabs.insertCSS(tab.id, {file: 'style.css'});
    chrome.tabs.executeScript(tab.id, {file: 'content.js'});
  });

  // return the modified response headers
  return {responseHeaders: o.responseHeaders};
}
