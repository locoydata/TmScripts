// ==UserScript==
// @name         Annotations
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  在网页中直接显示注释并高亮文本，添加折叠/展开功能
// @author       [思钱想厚]
// @match        *://erp2.cnfth.com/*
// @match        *://*.1688.com/*
// @exclude      *://airtable.com/*  // 排除页面
// @grant        GM_xmlhttpRequest
// @updateURL    https://locoydata.github.io/TmScripts/Annotations脚本.js // 更新你的实际地址
// @downloadURL  https://locoydata.github.io/TmScripts/Annotations脚本.js // 更新你的实际地址
// ==/UserScript==

(async function() {
    'use strict';

    const ACCESS_TOKEN = 'patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549'; // 你的访问令牌
    const BASE_IDS = ['appWNNByUsenTcJML', 'appg0WaUPMbz68tVM', 'appifFEoL0qEA9944']; // 你的数据库 ID
    const annotations = {};
    const baseNames = {}; // 用于存储数据库ID和名称的映射

    async function fetchData(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                },
                onload: response => resolve(JSON.parse(response.responseText)),
                onerror: reject
            });
        });
    }

    // 获取所有数据库的名称, 并只获取 BASE_IDS 中指定的数据库名称
    async function fetchBaseNames() {
        try {
            const basesData = await fetchData(`https://api.airtable.com/v0/meta/bases`);
            basesData.bases.forEach(base => {
                if (BASE_IDS.includes(base.id)) { // 只处理 BASE_IDS 中指定的数据库
                    baseNames[base.id] = base.name;
                }
            });
        } catch (error) {
            console.error("获取数据库名称失败:", error);
        }
    }

    // 获取表格及注释信息
    async function fetchTablesAndAnnotations(baseId) {
        const tablesData = await fetchData(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`);

        for (const table of tablesData.tables) {
            const tableName = table.name;
            const primaryFieldId = table.primaryFieldId;
            const primaryFieldName = table.fields.find(field => field.id === primaryFieldId).name;
            const recordsData = await fetchData(`https://api.airtable.com/v0/${baseId}/${tableName}`);

            recordsData.records.forEach(record => {
                const primaryFieldValue = record.fields[primaryFieldName];
                const otherFieldsValues = Object.keys(record.fields)
                    .filter(field => field !== primaryFieldName && field !== "来源" && field !== "记录时间") //排除名为 "来源" 和 "记录时间" 的字段
                    .map(field => {
                        let fieldValue = record.fields[field];
                        let fieldContent = fieldValue; // 用于存储最终显示的内容
                        // 检查 fieldValue 是否包含 URL，无需检查类型
                        if (fieldValue && String(fieldValue).startsWith('http')) {
                            const url = String(fieldValue).split('?')[0]; // 去除 URL 参数
                            fieldContent = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="text-decoration: underline; color: black;">${url}</a>`; // 创建超链接
                        }
                        return fieldValue ? `${field}: ${fieldContent}<br>` : null; // 在每个字段后添加 <br>
                    })
                    .filter(Boolean)
                    .join(' ');

                // 添加表名到注释内容
                const annotationWithTableName = `[${tableName}]<br>${otherFieldsValues}`; // 控制注释内容显示的具体内容,`[${baseNames[baseId]}/${tableName}]<br>${otherFieldsValues}`可显示数据库名

                if (!annotations[primaryFieldValue]) {
                    annotations[primaryFieldValue] = [];
                }
                annotations[primaryFieldValue].push({baseId: baseId, annotation: annotationWithTableName}); // 将包含表名的注释内容存入 annotations
            });
        }
    }

    // 创建注释div，并为注释内容添加折叠/展开按钮
    function createNote(node) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
            const text = node.nodeValue;
            const annotatedKeys = new Set();

            for (const [key, values] of Object.entries(annotations)) {
                const regex = new RegExp(key, 'g');
                if (regex.test(text) && !annotatedKeys.has(key)) {
                    const parentDiv = node.parentNode.parentNode;
                    const annotatedParent = parentDiv && parentDiv.closest('[data-annotated="true"]');
                    if (annotatedParent) {
                        continue;
                    }

                    const firstAnnotation = values[0];
                    const baseId = firstAnnotation?.baseId;

                    if (!baseId) {
                        continue;
                    }

                    const baseName = baseNames[baseId] || '未知数据库';

                    const annotationDiv = document.createElement('div');
                    annotationDiv.classList.add('annotation-container');

                    // 创建一个容器来存放所有注释内容
                    const annotationsContainer = document.createElement('div');
                    annotationsContainer.style.display = 'none'; // 默认隐藏注释内容

                    if (values.length > 0) {
                        values.forEach(({ annotation }, index) => {
                            const annotationSpan = document.createElement('span');
                            annotationSpan.innerHTML = annotation;
                            annotationSpan.title = annotation.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '');
                            annotationsContainer.appendChild(annotationSpan);

                            if (index < values.length - 0) { //每个注释后面都添加空行, 在除了最后一个注释之外的所有注释后面添加空行应该使用 if (index < values.length - 1)
                                annotationsContainer.appendChild(document.createElement('br'));

                            }
                        });
                    }

                    // 创建展开/收起按钮
                    const toggleButton = document.createElement('button');
                    toggleButton.textContent = baseName + "(展开)";
                    toggleButton.style.marginBottom = '5px';
                    toggleButton.style.padding = '5px 10px';
                    toggleButton.style.cursor = 'pointer';
                    toggleButton.style.color = 'red'; // 设置字体颜色为红色

                    toggleButton.addEventListener('click', () => {
                        if (annotationsContainer.style.display === 'none') {
                            annotationsContainer.style.display = 'block';
                            toggleButton.textContent = baseName + "(收起)";
                        } else {
                            annotationsContainer.style.display = 'none';
                            toggleButton.textContent = baseName + "(展开)";
                        }
                    });

                    annotationDiv.appendChild(toggleButton);
                    annotationDiv.appendChild(annotationsContainer);


                    parentDiv.parentNode.insertBefore(annotationDiv, parentDiv.nextSibling);
                    parentDiv.dataset.annotated = 'true';
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (const child of node.childNodes) {
                createNote(child);
            }
        }
    }

    // 观察 DOM 的变化并高亮新内容
    function observeDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                            createNote(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 页面加载时高亮并观察动态内容
    window.addEventListener('load', async () => {
        await fetchBaseNames(); // 获取所有数据库名称
        await Promise.all(BASE_IDS.map(fetchTablesAndAnnotations));
        console.log("所有注释加载完成:", annotations);
        console.log("数据库名称:", baseNames); //  打印数据库名称，方便调试
        createNote(document.body);
        observeDOMChanges();
    });

})();
