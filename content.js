/* global document,window,encodeURIComponent,XMLHttpRequest */

// amounts of spaces to use to pad the name and mtime
var NAME_PAD = 55;
var MTIME_PAD = 30;

// various manta limits
var MANTA_DEFAULT_LIMIT = 256;
var MANTA_MAX_LIMIT = 1000;

// global HTML elements
var ul;                // the unorded lists where entries are stored
var button_loadmore;   // load more links button
var button_loadall;    // load all links button

// last element received
var marker;

if (document.readyState === 'complete')
  windowload();
else
  window.addEventListener('load', windowload);

// window has loaded
function windowload() {
  // force trailing slash for directory listing
  if (!/\/$/.test(window.location.pathname))
    return window.location.replace(window.location.pathname + '/' + window.location.search);

  var body = document.body;

  // get the data from the pre block
  var pre = document.querySelector('pre') || {};
  var data = pre.textContent;

  // clear the body
  body.innerHTML = '';

  // make the header and title
  var title = 'Index of ' + window.location.pathname.substr(0, window.location.pathname.length - 1);
  document.title = title;
  var h1 = document.createElement('h1');
  h1.textContent = title;
  body.appendChild(h1);

  // make the body
  body.appendChild(document.createElement('hr'));

  pre = document.createElement('pre');
  ul = document.createElement('ul');
  button_loadmore = document.createElement('button');
  button_loadmore.textContent = 'Load more...';
  button_loadmore.onclick = loadmore;
  button_loadall = document.createElement('button');
  button_loadall.textContent = 'Load all...';
  button_loadall.onclick = loadall;

  pre.appendChild(ul);
  body.appendChild(pre);
  body.appendChild(button_loadmore);
  body.appendChild(button_loadall);

  body.appendChild(document.createElement('hr'));

  // extract the data from the body on the page
  // and place it in the `ul`
  placedata(data);
}

// loadmore button has been clicked
function loadmore(skipsort, cb) {
  cb = cb || function() {};

  var limit = MANTA_MAX_LIMIT;

  // sanity
  if (!marker)
    return;

  var url = window.location.pathname + '?';
  url += 'limit=' + encodeURIComponent(limit);
  url += '&';
  url += 'marker=' + encodeURIComponent(marker);

  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    placedata(this.responseText, skipsort);
    cb();
  };
  xhr.open('GET', url, true);
  xhr.send();

  button_loadmore.style.display = 'none';
  button_loadall.style.display = 'none';
}

// loadall button has been clicked
function loadall() {
  function go() {
    if (button_loadmore.style.display === 'inline' &&
        button_loadall.style.display === 'inline')
      loadmore(true, go);
    else
      sortlist();
  }
  go();
}

// given a string a JSON entries separated by `\n` characters,
// add each entry to the global `ul` object and sort it
function placedata(data, skipsort) {
  // if this is the first time running
  var firsttime = !ul.firstChild;

  data = (data || '').toString().trim().split('\n');

  // filter out empty values
  data = data.filter(function(line) {
    return line;
  });

  // turn json strings into javascript objects
  data = data.map(function(line) {
    return JSON.parse(line);
  });

  // ensure .. is present
  if (firsttime)
    data.splice(0, 0, {name: '..', type: 'directory'});

  // make the html entries for each file found
  data.forEach(function(entry) {
    if (entry.name === marker)
      return;

    var li = document.createElement('li');
    li.setAttribute('data-type', entry.type);
    li.setAttribute('data-name', entry.name);
    var a = document.createElement('a');

    switch (entry.type) {
      case 'directory':
        entry.name += '/';
        break;
      default:
        break;
    }

    a.href = entry.name;
    a.textContent = entry.name.length > (NAME_PAD - 4)
                  ? (entry.name.substr(0, NAME_PAD - 4) + '..>')
                  : entry.name;
    li.appendChild(a);

    var span = document.createElement('span');
    span.textContent = pad('', NAME_PAD - a.textContent.length);
    span.textContent += pad(entry.mtime || '-', MTIME_PAD);
    span.textContent += entry.size || '-';
    li.appendChild(span);

    ul.appendChild(li);
  });

  // store the last element
  marker = data[data.length - 1].name;

  // sort the list
  if (!skipsort)
    sortlist();

  // check if there could be another page
  if ((firsttime && data.length === (MANTA_DEFAULT_LIMIT + 1)) ||
      (!firsttime && data.length === MANTA_MAX_LIMIT)) {
    button_loadmore.style.display = 'inline';
    button_loadall.style.display = 'inline';
  }
}

// sort the global `ul`
function sortlist() {
  var arr = [];
  for (var i = 0; i < ul.children.length; i++) {
    arr.push(ul.children[i]);
  }

  arr = arr.sort(function(a, b) {
    var a_name = a.getAttribute('data-name');
    var b_name = b.getAttribute('data-name');
    var a_type = a.getAttribute('data-type');
    var b_type = b.getAttribute('data-type');
    if (a_type === 'directory' && b_type !== 'directory')
      return -1;
    if (a_type !== 'directory' && b_type === 'directory')
      return 1;
    return a_name > b_name ? 1 : -1;
  });

  ul.innerHTML = '';
  arr.forEach(function(a) {
    ul.appendChild(a);
  });
}

function pad(s, i) {
  while ((s || '').length < i)
    s += ' ';
  return s;
}
