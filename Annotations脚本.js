// ==UserScript==
// @name         Annotations
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  在网页中直接显示注释并高亮文本
// @author       [思钱想厚]
// @match        *://erp2.cnfth.com/*
// @match        *://*.1688.com*
// @exclude      *://airtable.com/*  // 排除页面
// @grant        GM_xmlhttpRequest
// @updateURL    https://locoydata.github.io/TmScripts/Annotations脚本.js // 更新你的实际地址
// @downloadURL  https://locoydata.github.io/TmScripts/Annotations脚本.js // 更新你的实际地址
// ==/UserScript==

(async function() {
    'use strict';

    const ACCESS_TOKEN = 'patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549'; // 你的访问令牌
    const BASE_IDS = ['appWNNByUsenTcJML', 'appg0WaUPMbz68tVM']; // 你的数据库 ID
    const annotations = {};

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
            const annotationWithTableName = `[${tableName}]<br>${otherFieldsValues}`; // 在表名后添加 <br>

            if (!annotations[primaryFieldValue]) {
                annotations[primaryFieldValue] = [];
            }
            annotations[primaryFieldValue].push(annotationWithTableName); // 将包含表名的注释内容存入 annotations
        });
    }
}

    // 创建注释div
    function createNote(node) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
            const text = node.nodeValue;
            const annotatedKeys = new Set();

            for (const [key, values] of Object.entries(annotations)) {
                const regex = new RegExp(key, 'g');
                if (regex.test(text) && !annotatedKeys.has(key)) {
                    // 找到匹配项所在 span 的父元素（即 dtl-sku div）
                    const parentDiv = node.parentNode.parentNode;

                    if (parentDiv && parentDiv.closest('[data-annotated="true"]')) {
                        continue;
                    }

                    // 创建包含注释的 div 元素
                    const annotationDiv = document.createElement('div');
                    annotationDiv.classList.add(`annotation-${key}`);
                    annotationDiv.style.color = 'blue';
                    annotationDiv.style.marginTop = '5px'; // 设置注释距离原元素的距离
                    annotationDiv.style.wordWrap = 'break-word';
                    annotationDiv.style.maxWidth = '200px';
                    annotationDiv.style.overflow = 'hidden'; //隐藏任何超出 annotationDiv 边界的元素内容
                    annotationDiv.style.textOverflow = 'ellipsis'; //裁剪的文本末尾添加省略号（...）
                    annotationDiv.style.whiteSpace = 'nowrap'; // 阻止文本在 annotationDiv 内部换行
                    annotationDiv.style.border = '1px solid #ccc';
                    annotationDiv.style.backgroundColor = '#f9f9f9';
                    annotationDiv.style.padding = '5px';
                    annotationDiv.style.borderRadius = '3px';

                    // 存储所有匹配到的注释
                    const allAnnotations = values;

                    // 如果存在匹配的注释
                    if (allAnnotations.length > 0) {
                        // 循环显示所有注释
                        allAnnotations.forEach((annotation, index) => {
                            const annotationSpan = document.createElement('span');
                            annotationSpan.innerHTML = `${annotation}`; //注释内容
                            annotationSpan.title = annotation.replace(/<br>/g, '\n').replace(/<[^>]*>/g, ''); // 更新 title 属性
                            annotationDiv.appendChild(annotationSpan);

                            if (index < allAnnotations.length - 1) {
                                annotationDiv.appendChild(document.createElement('br')); //匹配内容在一个表中有多个注释,用以换行
                            }
                        });

                        // 将 div 元素插入到第一个匹配项所在 div 的下一级
                        parentDiv.parentNode.insertBefore(annotationDiv, parentDiv.nextSibling);

                        // 标记父节点已添加注释
                        parentDiv.dataset.annotated = 'true';
                    }
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
        await Promise.all(BASE_IDS.map(fetchTablesAndAnnotations)); // 并行加载数据
        console.log("所有注释加载完成:", annotations);
        createNote(document.body);
        observeDOMChanges();
    });

})();
