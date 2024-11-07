// ==UserScript==
// @name         WebReminder
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  根据 Airtable 数据在指定网站上显示浮动提醒，支持按钮点击显示信息框，并提供删除提醒功能
// @author       [思钱想厚]
// @match        *://*/*
// @exclude      *://*.airtable.com/*  // 排除页面
// @grant        GM_xmlhttpRequest
// @updateURL    https://locoydata.github.io/TmScripts/WebReminder脚本.js
// @downloadURL  https://locoydata.github.io/TmScripts/WebReminder脚本.js
// ==/UserScript==

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
    function createFloatingButton(records) {
        const hasAlert = records.length > 0; // 判断是否有提醒内容
        const buttonDiv = document.createElement("button");
        buttonDiv.style.position = "fixed";
        buttonDiv.style.top = "20px";
        buttonDiv.style.left = "0";
        buttonDiv.style.backgroundColor = hasAlert ? "#F03E17" : "#007BFF";
        buttonDiv.style.color = "#fff";
        buttonDiv.style.border = "0";
        buttonDiv.style.borderRadius = "0 5px 5px 0";
        buttonDiv.style.width = "30px";
        buttonDiv.style.height = "100px";
        buttonDiv.style.cursor = "pointer";
        buttonDiv.style.zIndex = "9999";
        buttonDiv.style.display = "flex";
        buttonDiv.style.alignItems = "center";
        buttonDiv.style.justifyContent = "center";
        buttonDiv.style.writingMode = "vertical-rl";
        buttonDiv.style.textOrientation = "upright";
        buttonDiv.innerText = hasAlert ? "有提醒" : "无提醒";

        // 创建信息框
        const alertBox = document.createElement("div");
        alertBox.style.position = "fixed";
        alertBox.style.top = "50%";
        alertBox.style.left = "50%";
        alertBox.style.transform = "translate(-50%, -50%)";
        alertBox.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
        alertBox.style.color = "#333";
        alertBox.style.border = "1px solid #333";
        alertBox.style.borderRadius = "5px";
        alertBox.style.width = "500px";
        alertBox.style.maxHeight = "400px";
        alertBox.style.height = "300px";
        alertBox.style.zIndex = "10000";
        alertBox.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
        alertBox.style.display = "none"; // 初始时隐藏信息框

        // 创建标题栏
        const titleBar = document.createElement("div");
        titleBar.style.display = "flex";
        titleBar.style.justifyContent = "space-between";
        titleBar.style.alignItems = "center";
        titleBar.style.padding = "5px";
        titleBar.style.borderBottom = "1px solid #333";
        titleBar.style.backgroundColor = "rgba(240, 240, 240, 0.8)";

        // 添加最大化按钮
        const maximizeButton = document.createElement("button");
        maximizeButton.innerText = "🗖";
        maximizeButton.style.cursor = "pointer";
        maximizeButton.style.fontSize = "20px";
        maximizeButton.style.border = "none";
        maximizeButton.style.backgroundColor = "transparent";
        maximizeButton.style.color = "#333";
        maximizeButton.style.padding = "0";
        maximizeButton.onclick = function () {
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
                    <div>${records.map(record => `${record.fields["提醒内容"]}`).join('<br><br>')}</div>
                </body>
                </html>
            `;
        };

        // 添加关闭按钮
        const closeButton = document.createElement("button");
        closeButton.innerText = "×";
        closeButton.style.cursor = "pointer";
        closeButton.style.fontSize = "20px";
        closeButton.style.border = "none";
        closeButton.style.backgroundColor = "transparent";
        closeButton.style.color = "#333";
        closeButton.style.padding = "0";
        closeButton.onclick = function () {
            alertBox.style.display = "none";
        };

        titleBar.appendChild(maximizeButton);
        titleBar.appendChild(closeButton);
        alertBox.appendChild(titleBar);

        // 内容区域
        const contentArea = document.createElement("div");
        contentArea.style.padding = "10px";
        contentArea.style.overflowY = "auto";
        contentArea.style.height = "calc(300px - 40px)"; // 高度减去标题栏高度
        alertBox.appendChild(contentArea);

        // 点击按钮时显示/隐藏信息框
        buttonDiv.onclick = function () {
            if (alertBox.style.display === "block") {
                alertBox.style.display = "none"; // 如果信息框已经显示，则隐藏
            } else {
                contentArea.innerHTML = ""; // 清空内容
                records.forEach((record) => {
                    const lineElement = document.createElement("div");
                    lineElement.innerText = `${record.fields["提醒内容"]}`; // 直接显示提醒内容

                    // 创建删除按钮
                    const deleteButton = document.createElement("button");
                    deleteButton.innerText = "删除"; // 删除按钮文字
                    deleteButton.style.marginLeft = "10px"; // 按钮间隔
                    deleteButton.style.cursor = "pointer";
                    deleteButton.onclick = function (event) {
                        event.stopPropagation(); // 防止触发点击事件
                        deleteRecord(record.id); // 删除记录
                        lineElement.remove(); // 从信息框中移除该行
                    };

                    lineElement.appendChild(deleteButton); // 将删除按钮添加到行内容中
                    contentArea.appendChild(lineElement); // 添加到内容区域中
                });
                alertBox.style.display = "block"; // 显示信息框
            }
        };

        // 将信息框添加到页面（初始时不显示）
        document.body.appendChild(alertBox);
        document.body.appendChild(buttonDiv); // 始终添加按钮
    }

    // 3. 删除 Airtable 中的记录
    function deleteRecord(recordId) {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}/${recordId}`;

        GM_xmlhttpRequest({
            method: "DELETE",
            url: url,
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            onload: function (response) {
                if (response.status === 200) {
                    console.log(`Record ${recordId} deleted successfully.`);
                } else {
                    console.error("Failed to delete record:", response.statusText);
                }
            },
            onerror: function () {
                console.error("Request error while deleting record");
            }
        });
    }

    // 4. 检查当前网址并显示所有匹配的提醒内容
    function checkAndDisplayAlerts(records) {
        const currentUrl = window.location.href;

        const matchingRecords = records.filter(record => {
            const matchUrl = record.fields["匹配网址"];
            return matchUrl && currentUrl.includes(matchUrl); // 只返回匹配的记录
        });

        createFloatingButton(matchingRecords); // 创建按钮和信息框
    }

    // 启动脚本
    fetchData()
        .then(checkAndDisplayAlerts)
        .catch(error => console.error("Error:", error));
})();
