var currentDBUrls;

async function getCurrentDBUrls() {
    currentDBUrls = await callCurrentDBUrls();
};

let editableDiv = document.querySelector('div[contenteditable="true"]');

let allEditableDivs = document.querySelectorAll('div[contenteditable="true"]');

[].forEach.call(allEditableDivs, function (el) {
    el.addEventListener('paste', function(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        document.execCommand("insertHTML", false, text);
    }, false);
});

getCurrentDBUrls();
function callCurrentDBUrls() {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: "GET",
            url: "/admin",
            data: {"request_type": "getCurrentUrls"},
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data) {
                resolve(data);
            },
            error: function(error) {
                reject(error);
            }
        });
    });
};

const downloadzip = (data, datetime) => {
    var zip = new JSZip();
    data.forEach(function(dataObject) {
        zip.file(`${dataObject.url}.json`, JSON.stringify(dataObject, null, 4));
    });
    zip.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, `CamelliaDB ${datetime}.zip`);
    });
};

$(document).on('click', '#export-json', function() {
    $.ajax({
        method: "GET",
        url: "/export-json",
        data: {
            'Export-JSON': true
        },
        success: function(returnData) {
            downloadzip(JSON.parse(returnData.dbdata), returnData.time)
        }
    });
});

$(document).on('submit', '#modify-rows-form', function(event) {
    event.preventDefault();
    var mode;
    if ($('#add-song').is(':checked')) {
        mode = 'add';
    } else if ($('#remove-song').is(':checked')) {
        mode = 'remove';
    } else {
        return alert('Select a mode before submitting');
    }
    var SongName = $('#song-name').val();
    var SongUrl = urlGenerator(SongName);
    if (SongName == '' || SongUrl == '') {
        return window.alert('Please enter a valid name');
    };
    if (Array.isArray(currentDBUrls)) {
        if (currentDBUrls.includes(SongUrl) && mode == 'add') {
            return window.alert("The url for the inputted name already exists");
        } else if (!currentDBUrls.includes(SongUrl) && mode == 'remove') {
            return window.alert("The url for the inputted name does not exist");
        };
    } else {
        return window.alert("Awaiting List of Urls, try again in a second");
    };
    $.ajax({
        type: "POST",
        url: "/edit_rows",
        data: {
            'function': mode,
            'ObjectName': SongName,
            'ObjectUrl': SongUrl
        },
        success: function(message) {
            if (message == 'Success') {
                location.reload();
            } else {
                window.alert(message)
            }
        },
    });
});

$(document).on('change', "#img-input", function() {
    if ($('#img-input').val() != '') {
        var file = this.files[0];
        var reader = new FileReader();
        $('#img-input-label').text(file.name);
    
        reader.onload = function(e) {
            var img = new Image();
            img.src = e.target.result;
            
            img.onload = function() {
                var width = img.width;
                var height = img.height;
                if (width >= 300 && height >= 300) {
                    $("#img-upload-button").prop("disabled", false);
                } else {
                    $("#img-upload-button").prop("disabled", true);
                    alert("Image must be at least 300x300 pixels");
                };
            };
        };
        reader.readAsDataURL(file);
    };
});

$(document).on('submit', '#img-upload-form', function(event) {
    event.preventDefault();
    let formData = new FormData();
    formData.append("file", $('#img-input')[0].files[0]);
    $.ajax({
        type: 'POST',
        url: '/img_upload',
        data: formData,
        processData: false,
        contentType: false,
        success: function(message) {
            window.alert(message);
        }
    });
    $('#img-input').val('');
    $('#img-input-label').text('Select Image');
});

function getGridData(grid) {
    var gridData = [];
    let gridRows = $(grid).children();
    for (let i = 1; i < gridRows.length; i++) {
        let gridRow = $(gridRows[i]).children();
        let gridRowData = [];
        for (let c = 0; c < gridRow.length; c++) {
            let gridCell = $(gridRow[c]);
            if (!gridCell.is("button")) {
                let gridCellData = "";
                if (gridCell.is("div")) {
                    gridCellData = $(gridCell).text();
                } else if (gridCell.is("input")) {
                    gridCellData = $(gridCell).is(":checked");
                };
                gridRowData.push(gridCellData);
            };
        };
        gridData.push(gridRowData);
    };
    return gridData;
};

function getVariationData(variationsParent) {
    var variationData = [];
    let variations = $(variationsParent).children();
    for (let i = 1; i < variations.length; i++) {
        let variationUrl = $(variations[i]).attr('name');
        let variationDict = {};
        variationDict["name"] = $(`#${variationUrl}-name`).text();
        variationDict["url"] = $(`#${variationUrl}-url`).text();
        variationDict["altNames"] = $(`#${variationUrl}-altNames`).text();
        variationDict["artists"] = $(`#${variationUrl}-artists`).text();
        variationDict["songType"] = $(`#${variationUrl}-songType`).text();
        variationDict["touhouOrigin"] = getGridData($(`#${variationUrl}-touhouOrigin`));
        variationDict["originalSong"] = getGridData($(`#${variationUrl}-originalSong`));
        variationDict["duration"] = $(`#${variationUrl}-duration`).text();
        variationDict["albums"] = getGridData($(`#${variationUrl}-albums`));
        variationDict["gameAppearances"] = getGridData($(`#${variationUrl}-gameAppearances`));
        variationDict["links"] = getGridData($(`#${variationUrl}-links`));
        variationDict["imgs"] = getGridData($(`#${variationUrl}-imgs`));
        variationDict["description"] = $(`#${variationUrl}-description`).text();
        variationData.push(variationDict);
    }
    return variationData;
};

$(document).on('submit','.data-form',function(e) {
    e.preventDefault();
    var formName = $(this).attr('name');
    if ($(`#${formName}-url`).text() == '' || $(`#${formName}-url`).text() == 'None') {
        return alert("Form Failed to Submit: The item does not have an adequate url");
    };
    let variations = $(`#${formName}-variations`).children();
    for (i = 1; i < variations.length; i++) {
        let variationParentUrl = $(variations[i]).attr('name');
        let variationUrl = $(`#${variationParentUrl}-url`).text();
        if (variationUrl == '' || variationUrl == 'None') {
            return alert("Form Failed to Submit: A variation does not have an adequate url");
        }
    }
    $.ajax({
        type:'POST',
        url:'/admin',
        data: JSON.stringify({
            name: $(`#${formName}-name`).text(),
            url: $(`#${formName}-url`).text(),
            altNames: $(`#${formName}-altNames`).text(),
            artists: $(`#${formName}-artists`).text(),
            songType: $(`#${formName}-songType`).text(),
            touhouOrigin: getGridData(`#${formName}-touhouOrigin`),
            originalSong: getGridData(`#${formName}-originalSong`),
            duration: $(`#${formName}-duration`).text(),
            albums: getGridData(`#${formName}-albums`),
            gameAppearances: getGridData(`#${formName}-gameAppearances`),
            links: getGridData(`#${formName}-links`),
            imgs: getGridData(`#${formName}-imgs`),
            description: $(`#${formName}-description`).text(),
            variations: getVariationData(`#${formName}-variations`)
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(updatedObjectMessage) {
            window.alert(updatedObjectMessage);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            window.alert("The request failed: " + textStatus + " - " + errorThrown);
        }
    });
});

$(".object-wrapper").on('click', '.collapsible', function() {
    $(this).siblings(".content").slideToggle();
});

$(".object-wrapper").on('click', '.remove-var', function() {
    $(this).parent().parent().remove();
});

function urlGenerator(name) {
    const bad_characters = [';', ',', '/', '\\', '|', '?', ':', '@', '&', '=', '+', '$', '_', '.', '!', '~', '*', '"', '\'', '(', ')', '[', ']', '{', '}', '#', '<', '>', '%', '^', '`', '-'];
    var newUrl = name;
    for(let i = 0; i < bad_characters.length; i++) {
        let re = new RegExp('\\' + bad_characters[i], 'g');
        newUrl = newUrl.replace(re, ' ');
    };
    newUrl = newUrl.trim().replace(/\s\s+/g, ' ').replace(/ /g, '-');
    return newUrl;
};

$(".object-wrapper").on('click', '.delete-row', function() {
    $(this).parent().remove();
});

function addrow(button, inputs, gridLayout) {
    var grid = $(button).parent().parent();
    var newRow = jQuery('<div>', {
        class: "data-row",
        style: "grid-template-columns: ".concat(gridLayout)
    });
    for (let i = 0; i < inputs.length; i++) {
        if (inputs[i] == 'div') {
            newRow.append('<div contenteditable="true"></div>');
        } else if (inputs[i] == 'checkbox') {
            newRow.append('<input type="checkbox">');
        };
    };
    var removeButton = jQuery('<button>', {
        type: "button",
        class: "delete-row",
        text: "-"
    });
    newRow.append(removeButton);
    grid.append(newRow);
};

function addvar(button) {
    var variationParent = $(button).parent().parent();
    var variationInput = $(button).siblings(".variation-input").val();
    $(button).siblings(".variation-input").val('');
    if (variationInput == '') {
        return window.alert('Enter a name for the Variation');
    }
    var variationURL = urlGenerator(variationInput);
    var existingURLs = [$(variationParent).parent().parent().parent().attr('name')];
    for (let i = 1; i < variationParent.children().length; i++) {
        let child = variationParent.children()[i];
        existingURLs.push($(child).attr('name'));
    }
    var testUrl = variationURL;
    for (let c = 2; existingURLs.includes(testUrl); c++) {
        testUrl = variationURL.concat(`-${c}`);
    }
    if (testUrl != variationURL) {
        variationURL = testUrl;
        window.alert(`${variationInput} had url identical to either the main song or another existing variation, url is now ${variationURL}`);
    }
    $.ajax({
        type: "POST",
        url: "/render_macro",
        data: { varName: variationInput, varUrl: variationURL },
        success: function(result) {

        var contentDiv = document.createElement("div");
        contentDiv.className = "content";
        contentDiv.innerHTML = result;

        var removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-var";
        removeButton.style = "float: right;";
        removeButton.innerText = "-";
        contentDiv.prepend(removeButton);

        var newVariation = jQuery("<div>", {
            class: "variation",
            name: variationURL
        });
        var collapsible = jQuery("<button>", {
            class: "collapsible",
            type: "button",
            text: variationInput
        });
        newVariation.append(collapsible);
        newVariation.append(contentDiv);
        variationParent.append(newVariation);
        }
    });
};