// LP翻译稿处理工具
// 该脚本用于处理LP翻译稿，将文本插入到InDesign文档中，并根据分组应用样式
// 作者：几千块
// 日期：20250404
var version = "2.0";
// 声明全局变量
var totalPages = 0;
var doc = app.activeDocument;
var selectedPages =[];// 保存选中的页面
var startPage = 1;// 设置起始页码
var singleLineMode = false; // 默认单行断句模式
var multiLineRadio = true; // 默认多行断句模式
var matchByNumber = false; // 按页码匹配选择的文本
var fromStartoEnd = true; // 默认从头导入所有文本
var replacements = {
    "！？": "?!",
    "！": "!",
    "？": "?",
    "——": "—",
    "—？": "—?",
    "…？": "…?",
    "~": "～",
    "诶": "欸",
    "干嘛": "干吗",
    "混蛋": "浑蛋",
    "叮": "丁",
    "啰嗦": "啰唆",
    "喀":"咔",
    "哒":"嗒",


};//替换文本

var objectStyleMatchText = [
    { label: "默认匹配", checked: true },
    { label: "*", checked: false },
    { label: "※", checked: false },
    { label: "＊", checked: false },
    { label: "", checked: false },
    { label: "", checked: false },
    { label: "", checked: false },
    { label: "", checked: false },
    { label: "", checked: false },
    { label: "", checked: false },
    { label: "", checked: false },
];//匹配对象样式
var styleRules = [];      // 样式匹配规则

// 读取文本基础，输出行和内容
function readAndParseTxtFileBase(filePath,replacements) {
    var file = new File(filePath);
    if (!file.exists) {
        return { lines: [], content: "" };
    }
    file.open("r");
    var content = file.read();
    replacements = $.global['replacements']
    content = replaceMultipleWords(content, replacements);
    file.close();

    var lines = content.split("\n");
    return { lines: lines, content: content };
}
// 解析文本行，收集台词
function parseLines(lines, isSingleLineMode) {
    var entries = [];
    totalPages = 0; // 重置页面总数

    for (var i = 0; i < lines.length; i++) {
        // 匹配页面名
        var pageMatch = lines[i].match(/>>>>>>>>\[(.*)\]<<<<<<<<$/);
        if (pageMatch) {
            totalPages++; // 每遇到一个新页面时，页面总数增加
            continue;
        }

        // 匹配台词编号、位置和分组信息
        var textMatch = lines[i].match(/----------------\[(\d+)\]----------------\[(.*?)\,(.*?)\,(.*?)\]/);
        if (textMatch) {
            var pageNumber = parseInt(textMatch[1]);
            var baseX = parseFloat(textMatch[2]);
            var baseY = parseFloat(textMatch[3]);
            var group = parseInt(textMatch[4]);

            // 收集文本内容，直到遇到下一个编号或下一页
            var textContent = [];
            for (var j = i + 1; j < lines.length; j++) {
                if (lines[j].match(/----------------\[\d+\]----------------/) || lines[j].match(/>>>>>>>>\[(.*)\]<<<<<<<<$/)) {
                    break;
                }
                var line = lines[j];
                if (line) {
                    textContent.push(line);
                }
            }

            // 根据模式处理文本内容
            if (isSingleLineMode || textContent.length === 1) {
                // 单行模式或单行文本
                var entry = {
                    pageImage: totalPages,
                    pageNumber: pageNumber,
                    position: [baseX, baseY],
                    group: group,
                    text: textContent.join("\n")
                };
                entries.push(entry);
            } else {
                // 多行模式
                for (var k = 0; k < textContent.length; k++) {
                    var entry = {
                        pageImage: totalPages,
                        pageNumber: pageNumber,
                        position: [baseX - k * 0.03, baseY + k * 0.03],
                        group: group,
                        text: textContent[k]
                    };
                    entries.push(entry);
                }
            }

            i += textContent.length; // 更新索引以跳过已处理的文本行
        }
    }

    return entries;
}
// 读取和解析文本文件
function readAndParseTxtFilelines(filePath) {
    var result = readAndParseTxtFileBase(filePath);
    var lines = result.lines;
    return parseLines(lines, false);
}
// 读取和解析文本文件（单行模式）
function readAndParseTxtFileoneline(filePath) {
    var result = readAndParseTxtFileBase(filePath);
    var lines = result.lines;
    return parseLines(lines, true); 
}
// 从文件名提取页码
function extractPageNumbers(pageNames) {
    var pageNumbers = [];
    var pageNumberPattern = /(\d+)(?=[^\d]*$)/; // 匹配末尾数字的正则

    for (var i = 0; i < pageNames.length; i++) {
        var name = pageNames[i];
        var matches = name.match(pageNumberPattern);
        var num = 0;

        // 优先取末尾数字
        if (matches) {
            num = parseInt(matches[0], 10);
        } 
        // 如果没有末尾数字，寻找最长数字段
        else {
            var allNumbers = name.match(/\d+/g) || [];
            if (allNumbers.length > 0) {
                // 按数字长度降序排序
                allNumbers.sort(function(a, b) {
                    return b.length - a.length;
                });
                num = parseInt(allNumbers[0], 10);
            }
        }

        if (!isNaN(num)) {
            pageNumbers.push(num);
        }
    }

    return pageNumbers;
}
// 根据列表替换多个词
function replaceMultipleWords(text, replacements) {
    // 遍历替换字典中的每个键值对，并替换对应的词
    for (var key in replacements) {
        if (replacements.hasOwnProperty(key)) {
            var regex = new RegExp(key, 'g'); // 使用正则表达式全局替换
            text = text.replace(regex, replacements[key]);
        }
    }

    // 删除末尾的换行符（包括多个换行符）
    while (text.length > 0 && (text.substr(text.length - 1) === "\n" || text.substr(text.length - 1) === "\r")) {
        text = text.substr(0, text.length - 1);
    }

    // 检测文本最后一个字符是否为双引号，如果是则删除
    if (text.length > 0 && text.substr(text.length - 1) === "\"") {
        text = text.substr(0, text.length - 1);
    }

    return text;
}
// 确保页面数足够
function ensureEnoughPages(requiredPageCount) {
    var currentPageCount = doc.pages.length;
    
    if (currentPageCount < requiredPageCount) {
        var pagesToAdd = requiredPageCount - currentPageCount;
        for (var i = 0; i < pagesToAdd; i++) {
            doc.pages.add();
        }
    }
}
// 将百分比坐标转换为绝对坐标
function convertPercentToAbsoluteCoordinates(page, xPercent, yPercent) {
    var pageWidth = page.bounds[3] - page.bounds[1]; // 页面宽度
    var pageHeight = page.bounds[2] - page.bounds[0]; // 页面高度
    var x = pageWidth * parseFloat(xPercent);
    var y = pageHeight * parseFloat(yPercent);
    return [x, y];
}
// 根据分组应用样式
function applyStylesBasedOnGroup(textFrame, group) {
    var paragraphStyleName = "";
    var characterStyleName = "";
    var objectStyleName = "";

    // 根据不同分组设置样式名称
    switch (group) {
        case 1:
            paragraphStyleName = "框内";
            characterStyleName = "字符样式1";
            objectStyleName = "文本框居中-垂直-自动缩框";
            break;
        case 2:
            paragraphStyleName = "框外";
            characterStyleName = "字符样式2";
            objectStyleName = "文本框居中-垂直-自动缩框";
            break;
        // 根据需求添加更多分组和样式
        default:
            paragraphStyleName = "[基本段落]";
            characterStyleName = "[无]";
            objectStyleName = "文本框居中-垂直-自动缩框";
    }

    // 应用段落样式
    try {
        var paragraphStyle = doc.paragraphStyles.item(paragraphStyleName);
        if (paragraphStyle.isValid) {
            textFrame.paragraphs[0].appliedParagraphStyle = paragraphStyle;
        }
    } catch (e) {
        alert("Paragraph style not found: " + paragraphStyleName);
    }

    // 应用字符样式
    try {
        var characterStyle = doc.characterStyles.item(characterStyleName);
        if (characterStyle.isValid) {
            for (var i = 0; i < textFrame.characters.length; i++) {
                textFrame.characters[i].appliedCharacterStyle = characterStyle;
            }
        }
    } catch (e) {
        alert("Character style not found: " + characterStyleName);
    }

    // 应用对象样式
    try {
        var objectStyle = doc.objectStyles.item(objectStyleName);
        if (objectStyle.isValid) {
            textFrame.appliedObjectStyle = objectStyle;
        }
    } catch (e) {
        alert("Object style not found: " + objectStyleName);
    }
}

// 单页操作，插入文本到页面
function insertTextOnPageByTxtEntry(entry) {
    var pageIndex = parseInt(entry.pageImage,10) - 1; // 假设pageImage类似001.tif
    var page = doc.pages[pageIndex];
    
    // 如果页面不存在，则新建页面
    if (!page) {
        page = doc.pages.add();
    }

    // 将坐标百分比转换为绝对坐标
    var coordinates = convertPercentToAbsoluteCoordinates(page, entry.position[0], entry.position[1]);
    var textFrame = page.textFrames.add();
    textFrame_x = 10;//设置文本框大小
    textFrame_y = 25;
    textFrame.geometricBounds = [coordinates[1], coordinates[0]-textFrame_x/2, coordinates[1] + textFrame_y, coordinates[0] + textFrame_x];
    textFrame.contents = entry.text;
    textFrame.parentStory.storyPreferences.storyOrientation = StoryHorizontalOrVertical["VERTICAL"];


    // 根据分组应用样式
    // applyStylesBasedOnGroup(textFrame, entry.group);
    // 应用对象样式
    applySelectedObjectStyles(textFrame, styleRules)
    
}
// 遍历每一页
function processTxtEntries(txtEntries) {
    // 确保页面数足够
    ensureEnoughPages(totalPages);
    // 遍历每个条目并插入到页面中
    for (var i = 0; i < txtEntries.length; i++) {
        insertTextOnPageByTxtEntry(txtEntries[i], doc);
    }
}
// 创建用户界面一，选择文件
function createUserInterface() {
    var dialog = new Window("dialog", "LP翻译稿处理工具"+version);

    // 单行断句和多行断句选项
    var groupMode = dialog.add("group");
    groupMode.orientation = "row";
    
    // 调整单选按钮的高度
    var singleLineRadio = groupMode.add("radiobutton", undefined, "单行不断句\n文本一行为一个气泡");
    singleLineRadio.preferredSize = [200, 40]; 
    
    var multiLineRadio = groupMode.add("radiobutton", undefined, "多行断句\n文本多行为一个气泡");
    multiLineRadio.preferredSize = [200, 40]; 
    
    singleLineRadio.value = true; // 默认选中单行断句

    // 文件选择部分
    var fileGroup = dialog.add("group");
    fileGroup.orientation = "row";
    fileGroup.add("statictext", undefined, "打开lptxt:");
    var filePathInput = fileGroup.add("edittext", undefined, "");
    filePathInput.characters = 30;
    var browseButton = fileGroup.add("button", undefined, "浏览");

    // 按钮组
    var buttonGroup = dialog.add("group");
    buttonGroup.orientation = "row";
    var cancelButton = buttonGroup.add("button", undefined, "取消");
    var confirmButton = buttonGroup.add("button", undefined, "确定");

    // 浏览按钮点击事件
    browseButton.onClick = function () {
        var txtFile = File.openDialog("请选择一个LP翻译稿", "*.txt");
        if (txtFile) {
            filePathInput.text = txtFile.fsName;
        }
    };

    // 取消按钮点击事件
    cancelButton.onClick = function () {
        dialog.close();
    };

    // 确定按钮点击事件
    confirmButton.onClick = function () {
        singleLineMode = singleLineRadio.value; // 获取用户选择的模式
        multiLineRadio = multiLineRadio.value;
        if (filePathInput.text === "") {
            alert("请选择一个文件！");
            return;
        }
        dialog.close();
        showSecondInterface(filePathInput.text);
    };
    dialog.show(); 
    return filePathInput.text; 
}
// 创建第二个用户界面匹配模式
function showSecondInterface(filePathInput) {
    var dialog = new Window("dialog", "页面匹配设置");

    // 左侧选项部分
    var leftGroup = dialog.add("group");
    leftGroup.orientation = "column";
    
    var matchOptionGroup = leftGroup.add("panel", undefined, "匹配方式");
    matchOptionGroup.orientation = "column";
    matchOptionGroup.alignChildren = "left";
    var fromStartoEndCheckbox = matchOptionGroup.add("radiobutton", undefined, "从头导入所有文本");
    fromStartoEndCheckbox.value = true; // 默认选中
    var matchByNumberCheckbox = matchOptionGroup.add("radiobutton", undefined, "匹配页码导入选定文本");
    
    var startFromPageCheckbox = matchOptionGroup.add("radiobutton", undefined, "从文档的第X页导入选定文本");;
    var startPageInput = matchOptionGroup.add("edittext", undefined, "1");
    startPageInput.characters = 3;
    startPageInput.enabled = false;
    startPageInput.enabled = startFromPageCheckbox.value;
    startFromPageCheckbox.onClick = function () {
        startPageInput.enabled = startFromPageCheckbox.value;
    };

    // 右侧文件列表部分
    var rightGroup = dialog.add("group");
    rightGroup.orientation = "column";

    rightGroup.add("statictext", undefined, "LPtxt翻译稿对应页码");
    var pageNames = [];
    var result = readAndParseTxtFileBase(filePathInput,replacements);
    var lines = result.lines;
    for (var i = 0; i < lines.length; i++) {
        var pageMatch = lines[i].match(/>>>>>>>>\[(.*)\]<<<<<<<<$/);
        if (pageMatch) {
            pageNames.push(pageMatch[1]);
        }
    }
    // 创建listbox
    var fileList = rightGroup.add("listbox", undefined,undefined, {
        numberOfColumns: 2,
        showHeaders: true,
        columnTitles: ["文件名", "页码"],
        multiselect: true
    });
    fileList.maximumSize = [500, 500];
    fileList.alignment = "fill";

    var pageNumbers = extractPageNumbers(pageNames);

    function fillFileList(array) {
        fileList.removeAll();
        for (var i = 0; i < array.length; i++) {
            with(fileList.add("item", array[i])) {
                subItems[0].text = pageNumbers[i];
            }
        }
    }
    fillFileList(pageNames);
    // 默认选中所有文件
    for (var j = 0; j < fileList.items.length; j++) {
        fileList.items[j].selected = true;
    }

    // 选中的文件列表
    dialog.selectedPages = [];

    // 更新选中的文件列表
    fileList.onChange = function() {
        dialog.selectedPages = [];
        for (var i = 0; i < fileList.items.length; i++) {
            if (fileList.items[i].selected) {
                dialog.selectedPages.push(pageNames[i]);
            }
        }
    };

    // 按钮组
    var buttonGroup = dialog.add("group");
    buttonGroup.orientation = "row";
    var cancelButton = buttonGroup.add("button", undefined, "取消");
    var confirmButton = buttonGroup.add("button", undefined, "确定");

    // 取消按钮点击事件
    cancelButton.onClick = function () {
        dialog.close();
    };

    // 确定按钮点击事件
    confirmButton.onClick = function () {
        if (fromStartoEndCheckbox.value) {
            fromStartoEnd = true;
            matchByNumber = false;
            startFromPage = false;
        } else if(matchByNumberCheckbox.value){
            fromStartoEnd = false;
            matchByNumber = true;
            startFromPage = false;
        } else if(startFromPageCheckbox.value){
            fromStartoEnd = false;
            matchByNumber = false;
            startFromPage = true;
        }

        // 获取用户选择的页码列表,纯数字
        for (var i = 0; i < fileList.items.length; i++) {
            if (fileList.items[i].selected) {
                selectedPages.push(pageNumbers[i]);
            }
        }

        // 获取用户输入的起始页码
        startPage = parseInt(startPageInput.text, 10);
        if (isNaN(startPage) || startPage < 1) {
            alert("请输入有效的起始页码！");
            return;
        }

        dialog.close();
        // 调用第三界面
        showThirdInterface(filePathInput);
    };
    dialog.show();
}

// 创建第三个用户界面替换选项
function showThirdInterface(filePathInput) {
    var dialog = new Window("dialog", "文本替换与样式匹配");

    // 创建一个水平排列的主组
    var mainGroup = dialog.add("group");
    mainGroup.orientation = "row";
    mainGroup.alignChildren = "fill";
    mainGroup.scrolling = true;

    // 左侧选项部分：文字替换
    var leftGroup = mainGroup.add("group");
    leftGroup.orientation = "column";
    leftGroup.alignChildren = "fill";
    leftGroup.scrolling = true;
    var leftPanel = leftGroup.add("group"); 
    leftPanel.orientation = "column";
    var scrollContainer = leftPanel.add("group"); // 添加滚动容器
    scrollContainer.preferredSize = [300, 300];
    scrollContainer.scrolling = true; 
    var contentGroup = scrollContainer.add("group"); 
    contentGroup.orientation = "column";

    for (var key in replacements) {
        if (replacements.hasOwnProperty(key)) {
            var panel = contentGroup.add("panel", undefined, ""); // 将面板添加到滚动组中
            panel.orientation = "row";

            var checkbox = panel.add("checkbox", undefined, "");
                if (key === ""|| key === "？") {
                    checkbox.value = false;
                } else {
                    checkbox.value = true;
                }

            var fromInput = panel.add("edittext", undefined, key);
            fromInput.characters = 10;

            var replaceLabel = panel.add("statictext", undefined, " 替换成 ");
            replaceLabel.preferredSize = [50, 20];

            var toInput = panel.add("edittext", undefined, replacements[key]);
            toInput.characters = 10;
        }
    }

    // 右侧选项部分：文本匹配对象样式
    var rightGroup = mainGroup.add("group");
    rightGroup.orientation = "column";
    rightGroup.alignChildren = "fill";
    rightGroup.scrolling = true;

    var rightScroll = rightGroup.add("group"); 
    rightScroll.preferredSize = [300, 300];
    rightScroll.scrolling = true;
    var styleContent = rightScroll.add("group"); 
    styleContent.orientation = "column";

    for (var i = 0; i < objectStyleMatchText.length; i++) {
        var option = objectStyleMatchText[i];
        var panel = styleContent.add("panel", undefined, "");
        panel.orientation = "row";

        var checkbox = panel.add("checkbox", undefined, "");
        checkbox.value = option.checked;

        if (i === 0){
                var includeLabel = panel.add("statictext", undefined, " 所有文本 ");
                includeLabel.preferredSize = [80, 20]; 
        }else{
                var includeLabel = panel.add("statictext", undefined, " 包含 ");
                includeLabel.preferredSize = [40, 20]; 
        }
        
        if (i === 0) {
            var includeInput = panel.add("statictext", undefined, option.label);
            includeInput.preferredSize = [60, 20]; 
        } else {
            var includeInput = panel.add("edittext", undefined, option.label);
            includeInput.characters = 6;
            includeInput.active = true; 
        }
        if (i === 0){
            var replaceLabel = panel.add("statictext", undefined, " 对象样式 ");
            replaceLabel.preferredSize = [60, 20];
        }else{
            var replaceLabel = panel.add("statictext", undefined, " 应用样式 ");
            replaceLabel.preferredSize = [60, 20];
        }



        var docObjectstyles = getDocumentObjectStyles();
        var styleNames = [];
        for (var j = 0; j < docObjectstyles.length; j++) {
            styleNames.push(docObjectstyles[j].name);
        }
        var styleDropdown = panel.add("dropdownlist", undefined, styleNames);
        if (includeInput.text=="*"||includeInput.text=="※"||includeInput.text=="＊") {
            if(styleDropdown.children.length > 5){
                styleDropdown.selection = 4;
            }else {
                styleDropdown.selection = 3;
            }
        }else if(styleDropdown.children.length > 5){
            styleDropdown.selection = 5;
            }else {
                styleDropdown.selection = 3;
            }
        styleDropdown.preferredSize = [120, 20];
    }

    // 底部按钮组
    var buttonGroup = dialog.add("group");
    buttonGroup.orientation = "row";
    var cancelButton = buttonGroup.add("button", undefined, "取消");
    var confirmButton = buttonGroup.add("button", undefined, "确定");

    // 取消按钮点击事件
    cancelButton.onClick = function () {
        dialog.close();
    };

    // 确定按钮点击事件
    confirmButton.onClick = function () {
        replacements = {}; // 文字替换规则

        // 获取左侧文字替换内容
        var leftContentGroup = dialog.children[0].children[0].children[0].children[0].children[0];
        for (var i = 0; i < leftContentGroup.children.length; i++) {
            var panel = leftContentGroup.children[i];
            if (panel.constructor.name === "Panel") {                
                var checkbox = panel.children[0];
                var fromInput = panel.children[1];
                var toInput = panel.children[3];
                
                if (checkbox.value) {
                    if (fromInput.text) {
                        replacements[fromInput.text] = toInput.text;
                    }
                }
            }
        }

        // 获取右侧样式匹配内容
        var rightStyleGroup = dialog.children[0].children[1].children[0].children[0];
        for (var j = 0; j < rightStyleGroup.children.length; j++) {
            var stylePanel = rightStyleGroup.children[j];
            if (stylePanel.constructor.name === "Panel") {
                var styleControls = stylePanel.children;
                
                var styleCheckbox = styleControls[0];
                var matchInput = styleControls[2];
                var styleList = styleControls[4];
                
                if (styleCheckbox.value) {
                    styleRules.push({
                        match: matchInput.text,
                        style: styleList.selection.text
                    });
                }
            }
        }

        dialog.close();
        processStart(filePathInput);
    };
    dialog.show();
};
// 根据放置选项开始放入台词
function processStart(filePathInput) {
    //获取台词文本，获取的同时已经替换掉替换列表中匹配的文本
    var txtEntries = processFile(filePathInput);
        if (fromStartoEnd){
            processTxtEntries(txtEntries);
        }else if (matchByNumber) {
            //选择列表里的最大值
            var maxOFselectedPageNumber = selectedPages[selectedPages.length - 1];
            totalPages = parseInt(maxOFselectedPageNumber,10);
            //获取选定的台词文本
            var filteredEntries = txtEntriesSelected(selectedPages, txtEntries);
            processTxtEntries(filteredEntries);
        }else if (startPage) {
            totalPages = startPage + selectedPages.length;
            var filteredEntries = txtEntriesSelected(selectedPages, txtEntries);
            filteredEntries = assignPageNumbers(filteredEntries, startPage);
            processTxtEntries(filteredEntries);
        }

    }

// 页码分配函数
function assignPageNumbers(filteredEntries, startPage) {
    // 创建页码分组映射表
    var pageGroups = {};
    for (var i = 0; i < filteredEntries.length; i++) {
        var entry = filteredEntries[i];
        var originalPage = entry.pageImage;
        if (!pageGroups[originalPage]) {
            pageGroups[originalPage] = [];
        }
        pageGroups[originalPage].push(entry);
    }

    // 按分组更新页码
    var groupIndex = 0;
    for (var pageKey in pageGroups) {
        if (pageGroups.hasOwnProperty(pageKey)) {
            var group = pageGroups[pageKey];
            var newPage = startPage + groupIndex;
            
            // 更新整组页码
            for (var j = 0; j < group.length; j++) {
                group[j].pageImage = newPage;
            }
            
            groupIndex++;
        }
    }
    return filteredEntries;
}

// 从文章中筛选选中的页码
function txtEntriesSelected(selectedPages, txtEntries) {
    // 过滤匹配的条目
    var filteredEntries = [];
    for (var j = 0; j < txtEntries.length; j++) {
        var entry = txtEntries[j];
        // 检查当前条目的页码是否在选中页码中
        var isValid = false;
        for (var k = 0; k < selectedPages.length; k++) {
            if (entry.pageImage === selectedPages[k]) {
                isValid = true;
                break;
            }
        }
        if (isValid) {
            filteredEntries.push(entry);
        }
    }
    
    return filteredEntries;
}

// 应用对象样式（根据文本内容匹配规则）
function applySelectedObjectStyles(textFrame, styleRules) {
    var defaultStyleName = $.global['styleRules']['0']['style']; // 默认样式名称
    var applied = false; // 标记是否已应用样式
    
    try {
        // 遍历所有样式规则
        for (var i = 1; i < styleRules.length; i++) {
            var rule = styleRules[i];
            
            // 检查文本内容是否包含匹配字符
            if (textFrame.contents.indexOf(rule.match) !== -1) {
                var style = doc.objectStyles.item(rule.style);
                if (style.isValid) {
                    textFrame.appliedObjectStyle = style;
                    applied = true;
                    break; // 匹配到第一条规则后立即退出循环
                }
            }
        }
        
        // 未匹配任何规则时应用默认样式
        if (!applied) {
            var defaultStyle = doc.objectStyles.item(defaultStyleName);
            if (defaultStyle.isValid) {
                textFrame.appliedObjectStyle = defaultStyle;
            }
        }
    } catch (e) {
        alert("样式应用错误: " + e);
    }
}

// 获取当前文档的对象样式
function getDocumentObjectStyles() {
    var styles = [];
    for (var i = 0; i < doc.objectStyles.length; i++) {
        styles.push({ name: doc.objectStyles[i].name });
    }
    return styles;
}


// 处理文件+改单位原点
function processFile(filePath) {
    if (singleLineMode) {
        var txtEntries = readAndParseTxtFileoneline(filePath);
    }else if (multiLineRadio) {
        var txtEntries = readAndParseTxtFilelines(filePath);
    }

    // 设置标尺原点和单位
    doc.viewPreferences.rulerOrigin = RulerOrigin.pageOrigin;
    doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.millimeters;
    doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.millimeters;
    doc.zeroPoint = [0, 0];

return txtEntries;
}

// 调用第一界面
var filePathInput = createUserInterface();
//调试用
// var filePathInput = "M:\\汉化\\PS_PNG\\output_数据.txt"
// // 调用第二界面
// var SecondInterface = showSecondInterface(filePathInput);