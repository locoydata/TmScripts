// ==UserScript==
// @name         WebReminder
// @namespace    http://tampermonkey.net/
// @version      2.7
// @description  根据 Airtable 数据在指定网站上显示浮动提醒，支持按钮点击显示信息框
// @match        *://*/*
// @exclude      *://airtable.com/*  // 排除页面
// @grant        GM_xmlhttpRequest
// @updateURL    https://locoydata.github.io/TmScripts/WebReminder脚本.js
// @downloadURL  https://locoydata.github.io/TmScripts/WebReminder脚本.js
// ==/UserScript==
// 油猴浏览器扩展自动更新逻辑为  比对版本号确认是否更新, 修改脚本后需修改版本号
(function () {
    'use strict';

    const ACCESS_TOKEN = 'patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549';
    const BASE_ID = 'appe3cvzz8IDpyNRq';
    const TABLE_NAME = 'Reminder';

    // 1. 从 Airtable 获取数据
    function fetchData() {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                onload: function (response) {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);
                        resolve(data.records);
                    } else {
                        reject("Failed to fetch data from Airtable");
                    }
                },
                onerror: function () {
                    reject("Request error");
                }
            });
        });
    }

    // 2. 创建按钮和信息框
    function createFloatingButton(content, hasAlert) { // 创建一个固定位置的 div 元素，作为浮动按钮
        const buttonDiv = document.createElement("button");; // 设置按钮的位置为固定定位，距离页面顶部 20 像素，左侧对齐
        buttonDiv.style.position = "fixed";
        buttonDiv.style.top = "20px";
        buttonDiv.style.left = "0";
        buttonDiv.style.backgroundColor = hasAlert ? "#F03E17" : "#007BFF"; // 根据是否有提醒内容设置背景色
        buttonDiv.style.color = "#fff"; // 设置按钮文本颜色
        buttonDiv.style.border = "0px solid #333"; // 设置边框样式，颜色为黑色
        buttonDiv.style.borderRadius = "0 5px 5px 0"; // 设置圆角边框
        buttonDiv.style.width = "30px"; // 初始宽度 // 设置按钮的初始宽度为 30 像素
        buttonDiv.style.height = "100px"; // 这里设置为你希望的高度，例如 50px
        buttonDiv.style.cursor = "pointer"; // 设置鼠标悬停时的指针样式为手型，表示该元素可点击
        buttonDiv.style.zIndex = "9999"; // 设置 z-index，确保该按钮在页面的最上层
        buttonDiv.style.display = "flex"; // 设置按钮为 flex 布局，便于内容居中
        buttonDiv.style.alignItems = "center"; // 设置 flex 布局的子元素在垂直方向上居中对齐
        buttonDiv.style.justifyContent = "center"; // 设置 flex 布局的子元素在水平方向上居中对齐
        buttonDiv.style.writingMode = "vertical-rl"; // 设置按钮的文字书写模式为垂直从右到左
        buttonDiv.style.textOrientation = "upright"; // 设置文字方向为直立
        buttonDiv.innerText = hasAlert ? "有提醒" : "无提醒"; // 根据是否有提醒内容设置按钮的显示文本

        // 创建信息框
        const alertBox = document.createElement("div");
        alertBox.style.position = "fixed";
        alertBox.style.top = "50%"; // 中间位置
        alertBox.style.left = "50%"; // 中间位置
        alertBox.style.transform = "translate(-50%, -50%)"; // 重新设置居中
        alertBox.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
        alertBox.style.color = "#333";
        alertBox.style.border = "1px solid #333";
        alertBox.style.borderRadius = "5px";
        alertBox.style.width = "500px"; // 固定宽度
        alertBox.style.maxHeight = "400px"; // 最大高度
        alertBox.style.height = "300px"; // 固定高度 ****这里设置信息框高度****,  需在以下***2***处也修改像素为当前固定高度, 例如 改为 contentArea.style.height = "calc(400px - 40px)";
        alertBox.style.zIndex = "10000";
        alertBox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)"; // 添加阴影效果

        // 创建标题栏
        const titleBar = document.createElement("div");
        titleBar.style.display = "flex";
        titleBar.style.justifyContent = "space-between"; // 左右对齐
        titleBar.style.alignItems = "center"; // 垂直居中
        titleBar.style.padding = "5px"; // 内边距
        titleBar.style.borderBottom = "1px solid #333"; // 底部边框
        titleBar.style.backgroundColor = "rgba(240, 240, 240, 0.8)"; // 背景色

        // 添加最大化按钮 - 新标签页显示内容
        const maximizeButton = document.createElement("button");
        maximizeButton.innerText = "🗖"; // 最大化符号
        maximizeButton.style.cursor = "pointer";
        maximizeButton.style.fontSize = "20px";
        maximizeButton.style.border = "none"; // 移除边框
        maximizeButton.style.backgroundColor = "transparent"; // 背景透明
        maximizeButton.style.color = "#333"; // 最大化按钮颜色
        maximizeButton.style.padding = "0"; // 不添加内边距
        maximizeButton.onclick = function () {
            // 在新标签页中显示内容
            const newTab = window.open();
            newTab.document.body.innerHTML = `
                <html>
                <head>
                    <title>提醒内容</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: rgba(255, 255, 255, 0.9);
                            color: #333;
                            margin: 0;
                            padding: 20px;
                        }
                        h1 {
                            text-align: center;
                        }
                    </style>
                </head>
                <body>
                    <h1>提醒内容</h1>
                    <div>${content.split('\n').map((line, index) => `${index + 1}. ${line}`).join('<br><br>')}</div>
                </body>
                </html>
            `;
        };

        // 添加关闭按钮
        const closeButton = document.createElement("button");
        closeButton.innerText = "×"; // 关闭符号
        closeButton.style.cursor = "pointer";
        closeButton.style.fontSize = "20px";
        closeButton.style.border = "none"; // 移除边框
        closeButton.style.backgroundColor = "transparent"; // 背景透明
        closeButton.style.color = "#333"; // 关闭按钮颜色
        closeButton.style.padding = "0"; // 不添加内边距
        closeButton.onclick = function () {
            alertBox.style.display = "none"; // 点击关闭时隐藏信息框
        };

        titleBar.appendChild(maximizeButton);
        titleBar.appendChild(closeButton);
        alertBox.appendChild(titleBar);

        // 内容区域
        const contentArea = document.createElement("div");
        contentArea.style.padding = "10px"; // 内容内边距
        contentArea.style.overflowY = "auto"; // 超出部分允许滚动
        contentArea.style.height = "calc(300px - 40px)"; // 固定高度，减去标题栏高度  ***2***
        alertBox.appendChild(contentArea);

        // 初始时隐藏信息框
        alertBox.style.display = "none";

        // 点击按钮时显示/隐藏信息框
        buttonDiv.onclick = function () {
            if (alertBox.style.display === "block") {
                alertBox.style.display = "none"; // 如果信息框已经显示，则隐藏
            } else {
                contentArea.innerHTML = ""; // 清空内容
                const contentLines = content.split('\n'); // 分割成行
                contentLines.forEach((line, index) => {
                    const lineElement = document.createElement("div");
                    lineElement.innerText = `${index + 1}. ${line}`; // 添加序号
                    contentArea.appendChild(lineElement); // 添加到内容区域中

                    const spaceDiv = document.createElement("div"); // 创建一个空的 div
                    //spaceDiv.innerHTML = "&nbsp;"; // 设置空白内容, 为一行高度, 可使用下面像素精细控制
                    spaceDiv.style.height = "10px"; // 设置空行的高度
                    contentArea.appendChild(spaceDiv); // 添加到内容区域中，作为空行
                });
                alertBox.style.display = "block"; // 显示信息框
            }
        };

        document.body.appendChild(buttonDiv);
        document.body.appendChild(alertBox);
    }

    // 3. 检查当前网址并显示所有匹配的提醒内容
    function checkAndDisplayAlerts(records) {
        const currentUrl = window.location.href;
        let alertsToShow = [];

        records.forEach(record => {
            const matchUrl = record.fields["匹配网址"];
            const alertContent = record.fields["提醒内容"];

            // 检查当前网址是否包含表中的“匹配网址”
            if (matchUrl && currentUrl.includes(matchUrl)) {
                alertsToShow.push(alertContent);  // 收集所有匹配的提醒内容
            }
        });

        // 如果有多个提醒内容，拼接在一起显示；否则显示“无提醒”
        const content = alertsToShow.length > 0 ? alertsToShow.join('\n') : "";
        createFloatingButton(content, alertsToShow.length > 0);
    }

    // 4. 主流程 - 获取数据并执行匹配检查
    fetchData()
        .then(records => {
            checkAndDisplayAlerts(records);
        })
        .catch(error => {
            console.error(error);
        });
})();
