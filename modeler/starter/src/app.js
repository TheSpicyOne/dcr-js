import $ from 'jquery';

import './assets/odm.css';
import 'diagram-js/assets/diagram-js.css';
import 'bpmn-font/dist/css/bpmn.css';

import DCRModeler from 'dcr-graph-diagram-modeler';

import emptyBoardXML from './resources/emptyBoard.xml?raw';
import sampleBoardXML from './resources/sampleBoard.xml?raw';

// modeler instance
var modeler = new DCRModeler({
  container: '#canvas',
  keyboard: {
    bindTo: window,
  },
});

/* screen interaction */
function enterFullscreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

const state = {
  fullScreen: false,
  keyboardHelp: false,
  examples: false,
};
document
  .getElementById('js-open-examples')
  .addEventListener('click', function () {
    state.examples = !state.examples;
    let displayProp = 'none';
    if (state.examples) {
      displayProp = 'block';
    }
    document.getElementById('io-dialog-examples').style.display = displayProp;
    
  });
document
  .getElementById('io-dialog-examples')
  .addEventListener('click', function () {
    state.examples = !state.examples;
    let displayProp = 'none';
    if (!state.examples) {
      document.getElementById('io-dialog-examples').style.display = displayProp;
    }
  });
document
  .getElementById('js-toggle-fullscreen')
  .addEventListener('click', function () {
    state.fullScreen = !state.fullScreen;
    if (state.fullScreen) {
      enterFullscreen(document.documentElement);
    } else {
      exitFullscreen();
    }
  });
document
  .getElementById('js-toggle-keyboard-help')
  .addEventListener('click', function () {
    state.keyboardHelp = !state.keyboardHelp;
    let displayProp = 'none';
    if (state.keyboardHelp) {
      displayProp = 'block';
    }
    document.getElementById('io-dialog-main').style.display = displayProp;
  });
document
  .getElementById('io-dialog-main')
  .addEventListener('click', function () {
    state.keyboardHelp = !state.keyboardHelp;
    let displayProp = 'none';
    if (!state.keyboardHelp) {
      document.getElementById('io-dialog-main').style.display = displayProp;
    }
  });

/* file functions */
function openFile(file, callback) {
  // check file api availability
  if (!window.FileReader) {
    return window.alert(
      'Looks like you use an older browser that does not support drag and drop. ' +
      'Try using a modern browser such as Chrome, Firefox or Internet Explorer > 10.'
    );
  }

  // no file chosen
  if (!file) {
    return;
  }

  var reader = new FileReader();

  reader.onload = function (e) {
    var xml = e.target.result;

    callback(xml);
  };

  reader.readAsText(file);
}

var fileInput = $('<input type="file" />')
  .appendTo(document.body)
  .css({
    width: 1,
    height: 1,
    display: 'none',
    overflow: 'hidden',
  })
  .on('change', function (e) {
    openFile(e.target.files[0], openDCRPortalBoard);
  });

var customFileInput = $('<input type="file" />')
  .appendTo(document.body)
  .css({
    width: 1,
    height: 1,
    display: 'none',
    overflow: 'hidden',
  })
  .on('change', function (e) {
    openFile(e.target.files[0], openCustomBoard);
  });

function openBoard(xml) {
  // import board
  modeler.importXML(xml).catch(function (err) {
    if (err) {
      return console.error('could not import dcr board', err);
    }
  });
}

function openDCRPortalBoard(xml) {
  // import board
  modeler.importDCRPortalXML(xml).catch(function (err) {
    if (err) {
      return console.error('could not import dcr board', err);
    }
  });
}

function openCustomBoard(xml) {
  // import board
  modeler.importCustomXML(xml).catch(function (err) {
    if (err) {
      return console.error('could not import dcr board', err);
    }
  });
}

function saveSVG() {
  return modeler.saveSVG();
}

function saveBoard() {
  return modeler.saveXML({ format: true });
}

function saveDCR() {
  return modeler.saveDCRXML();
}

// bootstrap board functions
$(function () {
  var downloadLink = $('#js-download-board');
  var downloadDCRLink = $('#js-download-dcr');
  var downloadSvgLink = $('#js-download-svg');

  var openNew = $('#js-open-new');
  var openCustomBoard = $('#js-open-custom-board');
  var openExistingBoard = $('#js-open-board');

  $('.buttons a').click(function (e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass('active').attr({
        href: 'data:application/xml;charset=UTF-8,' + encodedData,
        download: name,
      });
    } else {
      link.removeClass('active');
    }
  }

  var exportArtifacts = debounce(function () {
    saveSVG().then(function (result) {
      setEncoded(downloadSvgLink, 'dcr-graph.svg', result.svg);
    });

    saveBoard().then(function (result) {
      setEncoded(downloadLink, 'dcr-board.xml', result.xml);
    });

    saveDCR().then(function (result) {
      setEncoded(downloadDCRLink, 'dcr-graph-XML-format.xml', result.xml);
    });
  }, 500);

  modeler.on('commandStack.changed', exportArtifacts);

  openNew.on('click', function () {
    openBoard(emptyBoardXML);
  });

  openCustomBoard.on('click', function () {
    var input = $(customFileInput);

    // clear input so that previously selected file can be reopened
    input.val('');
    input.trigger('click');
  });

  openExistingBoard.on('click', function () {
    var input = $(fileInput);

    // clear input so that previously selected file can be reopened
    input.val('');
    input.trigger('click');
  });
});

//openBoard(sampleBoardXML);
openBoard(emptyBoardXML);

// helpers //////////////////////

function debounce(fn, timeout) {
  var timer;

  return function () {
    if (timer) {
      clearTimeout(timer); 
    } 

    timer = setTimeout(fn, timeout);
  };
}

function generateExamples() {
  const files = ["example_1.xml", "example_2.xml", "example_3.xml"];
  // Create and append element for each file
  const wrapper = document.getElementById("generated-examples");
  for (var i = 0; i < files.length ; i++) {
    var example = document.createElement('div');
    example.className = "example"
    var title = document.createElement('h2');
    title.innerHTML = files[i];
    example.append(title);
    wrapper.append(example);
  };
}
generateExamples();