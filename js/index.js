/* View Factory */
function createMenuEntryView(number) {
    let template = document.getElementsByTagName("template")[0];
    let item = template.content.querySelector("tr");

    let node = document.importNode(item, true);
    node.id = "menu-" + number

    return node;
}

/* View Logic */
function addMenuEntry(menuName, command) {
    let menuList = document.getElementById("menu-list");
    let menuEntry = menuList.getElementsByTagName("tr");
    let view = createMenuEntryView(menuEntry.length + 1);

    menuList.appendChild(view);
    reArrangeMenuEntry();
}

function removeMenuEntry(number) {
    let target = document.getElementById("menu-" + number);
    target.parentNode.removeChild(target);
    reArrangeMenuEntry();
}

function reArrangeMenuEntry() {
    let menuList = document.getElementById("menu-list");
    let menuEntry = menuList.getElementsByTagName("tr");
    let i = 0;

    for (i = 0; i < menuEntry.length; i++)
    {
        let number = (i + 1);
        let thElements = menuEntry[i].getElementsByTagName("th");

        menuEntry[i].id = "menu-" + number;
        thElements[0].innerHTML = number;

        if (thElements[1] == undefined)
            return;

        let buttons = thElements[1].getElementsByTagName("a");
        buttons[0].onclick = function() {
            removeMenuEntry(number);
        }
    }
}

function sortMenuEntry() {
    let menu = getMenuInfo(false);
    let trimEntry = menu.entryList.filter(obj => (obj.name !== undefined) && (obj.name !== ""));

    trimEntry.sort(
        function compare(a, b) {
            const appNameA = a.name.toUpperCase();
            const appNameB = b.name.toUpperCase();

            let comparision = 0;

            if (appNameA > appNameB) {
                comparision = 1;
            }
            else if (appNameA < appNameB) {
                comparision = -1;
            }

            return comparision;
        }
    );

    setMenuEntryViews(trimEntry);
}

function setMenuEntryViews(entryList) {
    let menuList = document.getElementById("menu-list");
    let menuEntry = menuList.getElementsByTagName("tr");
    let i = 0;

    for (i = 0; i < menuEntry.length; i++)
    {
        let tdElements = menuEntry[i].getElementsByTagName("td");

        if (tdElements[0] == undefined || tdElements[1] == undefined) {
            return;
        }

        let inputsA = tdElements[0].getElementsByTagName("input");
        let inputsB = tdElements[1].getElementsByTagName("input");

        if (entryList[i] == undefined) {
            inputsA[0].value = "";
            inputsB[0].value = "";
        }
        else {
            inputsA[0].value = entryList[i].name;
            inputsB[0].value = entryList[i].command;
        }
    }
}

function onButtonGenerateClick() {
    var info = getMenuInfo();

    if (info.entryList.length == 0) {
        let title = document.getElementById("warning-modal-title");
        let body = document.getElementById("warning-modal-body");
        let button = document.getElementById("warning-modal-close-button");

        title.innerHTML = "Warning";
        body.innerHTML = "Please enter atleast 1 menu entry...";

        button.innerHTML = "Add a menu entry";
        button.onclick = function() {
            addMenuEntry('', '');
        }

        $('#warning-modal').modal('toggle');
        return;
    }

    var result = generateBashScript(info);

    let title = document.getElementById("result-modal-title");
    let body = document.getElementById("result-text");
    let button = document.getElementById("result-modal-button");
    let tempInput = document.getElementById("temp-input");

    title.innerHTML = "Complete"

    body.innerHTML = result;
    tempInput.value = result;

    $('#result-modal').modal('toggle');
}

/* View Model */
function getMenuInfo(isAutoSubstitute = true) {
    let menu = new Object();

    menu.title = document.getElementById("menuTitle").value;
    menu.fontName = document.getElementById("menuFont").value;
    menu.fontSize = document.getElementById("menuFontSize").value;
    menu.isHideScrollbar = document.getElementById("hideScrollbarCheck").checked;
    menu.entryList = [];

    let menuList = document.getElementById("menu-list");
    let menuEntry = menuList.getElementsByTagName("tr");
    let i = 0;

    for (i = 0; i < menuEntry.length; i++)
    {
        let tdElements = menuEntry[i].getElementsByTagName("td");

        if (tdElements[0] == undefined || tdElements[1] == undefined) {
            return;
        }

        let inputsA = tdElements[0].getElementsByTagName("input");
        let inputsB = tdElements[1].getElementsByTagName("input");

        if (inputsA[0].value == undefined || inputsB[0].value == undefined) {
            continue;
        }

        let entryName = inputsA[0].value;
        let entryCommand = inputsB[0].value;

        let entry = new Object();

        if (isAutoSubstitute) {
            entry.name = (entryName == "") ? "Entry" + (i + 1) : entryName;
            entry.command = (entryCommand == "") ? "command" : entryCommand;
        }
        else {
            entry.name = entryName;
            entry.command = entryCommand;
        }

        menu.entryList.push(entry);
    }

    return menu;
}

/* App Logic */
function intialize() {
    addMenuEntry('', '');

    var clipboard = new ClipboardJS('.btn');

    clipboard.on('success', function(e) {
        console.log(e);
    });

    clipboard.on('error', function(e) {
        console.log(e);
    });
}

function generateBashScript(menu) {
    //Shebang bash script
    let source = ""
    source += "#!/bin/sh\n\n";

    //Menu list
    source += "MENU=\""
    let i;

    for (i = 0; i < menu.entryList.length; i++) {
        source += menu.entryList[i].name;
        if (i + 1 < menu.entryList.length) {
            source += "|";
        }
    }

    source += "\"\n";

    //Font
    source += "FONT_NAME=" + "\"" + menu.fontName + "\"\n";
    source += "FONT_SIZE=" + menu.fontSize + "\n";

    source += "\n";

    //Dialog result
    source += "DIALOG_RESULT=$(echo $MENU | rofi -sep \"|\" -dmenu -i -p " + '\"' + menu.title + '\"' + ((menu.isHideScrollbar) ? " -hide-scrollbar" : "") + " -tokenize -lines " + ((menu.entryList.length > 5 ? 5 : menu.entryList.length)) + " -width 50 -padding 50 -disable-history -font \"$FONT_NAME $FONT_SIZE\")\n";

    source += "\n";

    //Log
    source += "echo \"This result is : $DIALOG_RESULT\"\n";
    source += "sleep 1;\n"

    source += "\n";

    //Run command by dialog result
    for (i = 0; i < menu.entryList.length; i++) {
        source += ((i == 0) ? "if" : "elif") + " [ \"$DIALOG_RESULT\" = \"" + menu.entryList[i].name + "\" ];\n";
        source += "then\n";
        source += "\texec " + menu.entryList[i].command + "\n";

        if (i < (menu.entryList.length - 1)) {
            source += "\n";
        }
    }

    source += "fi\n\n";
    console.log(source);
    return source;
}

