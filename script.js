(function() {
var MINI = require('minified');
var $ = MINI.$, $$ = MINI.$$, EE = MINI.EE;

// Some nice colors to use a defaults
var colors = [
    '#1abc9c', '#16a085', '#2ecc71', '#27ae60', '#3498db', '#2980b9', '#9b59b6',
    '#8e44ad', '#f1c40f', '#f39c12', '#e67e22', '#d35400', '#e74c3c', '#c0392b'
];

// This contains the tiles
var container = document.querySelector('#grid');

// Function to generate a UUID from https://gist.github.com/jed/982883
function uuid(a){return a?(0|Math.random()*16).toString(16):(""+1e7+-1e3+-4e3+-8e3+-1e11).replace(/1|0/g,uuid)}

function getTiles(callback) {
    chrome.storage.sync.get('new-tab-tiles', function(data) {
        callback(data['new-tab-tiles']);
    });
}

function saveTiles(data, callback) {
    chrome.storage.sync.set({'new-tab-tiles': data}, function() {
        callback();
    });
}

function __(msgid, replaces) {
    var out;

    if (typeof replaces == 'array') {
        out = chrome.i18n.getMessage(msgid, replaces);
    }

    out = chrome.i18n.getMessage(msgid);

    if (!out) {
        return msgid;
    }

    return out;
}

function refreshTiles() {
    getTiles(function(data) {
        data.push({
            "name": __('add_link_button'),
            "url": "#add-link",
            "colorBg": "#ecf0f1",
            "colorText": "#000"
        });

        var tiles = data.map(function(tile) {
            var html = '<div class="item" data-url="' + tile.url + '" style="';

            if (tile.image) {
                html += 'background-image:url(\'' + tile.image + '\');';
            }

            if (tile.colorBg) {
                html += 'background-color:' + tile.colorBg + ';';
            }

            if (tile.colorText) {
                html += 'color:' + tile.colorText + ';';
            }

            html += '">';

            if (tile.url != '#add-link') {
                html += '<span class="edit-link" data-uuid="' + tile.uuid + '">' + __('edit_link_button') + '</span>';
                html += '<span class="remove-link" data-uuid="' + tile.uuid + '">X</span>';
            }

            if (!tile.image) {
                html += tile.name;
            }

            html += '</div>';

            return html;
        }).join('');

        container.innerHTML = tiles;

        // init
        var pckry = new Packery(container, {
            // options
            itemSelector: '.item',
            gutter: 9
        });

        $('.item').on('click', function() {
            var url = $(this).get('%url');

            if (url == '#add-link') {
                $('#grid').hide();
                $('#add-link').show();
            } else {
                location.href = url;
            }
        });

        $('.remove-link').on('click', function() {
            var uuid = $(this).get('%uuid');

            getTiles(function(data) {
                data = data.filter(function(tile) {
                    return tile.uuid != uuid;
                });

                saveTiles(data, function() {
                    refreshTiles();
                });
            });
        });

        $('.edit-link').on('click', function() {
            var uuid = $(this).get('%uuid');
            var tile;

            getTiles(function(data) {
                data.forEach(function(t) {
                    if (t.uuid == uuid) {
                        tile = t;
                    }
                });

                $('#formInputUuid').set('value', tile.uuid);
                $('#formInputName').set('value', tile.name);
                $('#formInputUrl').set('value', tile.url);
                $('#formInputColorText').set('value', tile.colorText);
                $('#formInputColorBg').set('value', tile.colorBg);

                $('#grid').hide();
                $('#add-link').show();
            });
        });

        $('.item').onOver(function(isOver) {
            if (isOver) {
                $(this).trav('firstChild').show();
                $(this).trav('firstChild').next().show();
            } else {
                $(this).trav('firstChild').hide();
                $(this).trav('firstChild').next().hide();
            }
        });
    });
}

refreshTiles();

$('#cancel-add').on('click', function() {
    $('#grid').show();
    $('#add-link').hide();
});

$('#save-link').on('click', function() {
    var tile = $('#add-link-form').values();
    var isNewTile = true;

    if (!tile.uuid.length) {
        tile.uuid = uuid();
    } else {
        isNewTile = false;
    }

    if (tile.colorBg.length == 0) {
        tile.colorBg = colors[Math.floor(Math.random() * colors.length)];
    }

    if (tile.colorText.length == 0) {
        tile.colorText = '#fff';
    }

    getTiles(function(data) {
        if (isNewTile) {
            data.push(tile);
        } else {
            data = data.map(function(t) {
                if (t.uuid == tile.uuid) {
                    return tile;
                }

                return t;
            });
        }

        saveTiles(data, function() {
            // Notify that we saved.
            console.log('Settings saved');

            refreshTiles();

            document.getElementById('add-link-form').reset();

            $('#grid').show();
            $('#add-link').hide();
        });
    });
});

$(['#formInputName', '#formInputUrl', '#formInputColorText', '#formInputColorBg']).each(function(elm) {
    $(elm).set('@placeholder', __($(elm).get('@placeholder')));
});

$('.translate').each(function(elm) {
    elm.innerHTML = __(elm.innerHTML);
});

moment.locale(chrome.i18n.getUILanguage());

var refreshTimeInterval;

function refreshTime() {
    document.getElementById('time').innerHTML = moment().format('LLL');
}

refreshTime();

refreshTimeInterval = setInterval(refreshTime, 1000);

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        clearInterval(refreshTimeInterval);
    } else {
        refreshTimeInterval = setInterval(refreshTime, 1000);
    }
});
})();
