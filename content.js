var NAME_PAD = 55;
var MTIME_PAD = 30;

if (document.readyState === 'complete')
  onload();
else
  window.addEventListener('load', onload);

function onload() {
  // force trailing slash for directory listing
  if (!/\/$/.test(window.location.href))
    return window.location.replace(window.location.href + '/');

  var body = document.body;
  var data = document.querySelector('pre').textContent.trim().split('\n');

  // clear the body
  body.innerHTML = '';

  // make the header and title
  var title = 'Index of ' + window.location.pathname.substr(0, window.location.pathname.length - 1);
  document.title = title;
  var h1 = document.createElement('h1');
  h1.textContent = title;
  body.appendChild(h1);

  // begin body, we start with a hr
  body.appendChild(document.createElement('hr'));

  var pre = document.createElement('pre');

  // turn json strings into javascript objects
  data = data.map(function(line) {
    return JSON.parse(line);
  });

  // sort the files found
  data = data.sort(function(a, b) {
    if (a.type === 'directory' && b.type !== 'directory')
      return -1;
    if (a.type !== 'directory' && b.type === 'directory')
      return 1;
    return a.name.toLowerCase() < b.name.toLowerCase();
  });

  // make the html entries for each file found
  var ul = document.createElement('ul');
  data.splice(0, 0, {name: '..', type: 'directory'});
  data.forEach(function(entry) {
    var li = document.createElement('li');
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

  // close up the list
  pre.appendChild(ul);
  body.appendChild(pre);

  body.appendChild(document.createElement('hr'));
}

function pad(s, i) {
  while ((s || '').length < i)
    s += ' ';
  return s;
}
