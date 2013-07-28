var runMain = function() {
  var s = document.createElement('script');
  s.src = chrome.extension.getURL("main.js");
  (document.head||document.documentElement).appendChild(s);
  s.parentNode.removeChild(s);
}

var s = document.createElement('script');
s.src = chrome.extension.getURL("jquery-2.0.3.min.js");
s.onload = runMain;
(document.head||document.documentElement).appendChild(s);
s.parentNode.removeChild(s);
