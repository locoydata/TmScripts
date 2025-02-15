// ==UserScript==
// @name         Highlighter
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Highlights text on pages matching Airtable data
// @author       [思钱想厚]
// @match        *://erp2.cnfth.com/*
// @match        *://*.1688.com*
// @exclude      *://airtable.com/*  // 排除页面
// @grant        none
// @updateURL    https://locoydata.github.io/TmScripts/Highlighter脚本.js
// @downloadURL  https://locoydata.github.io/TmScripts/Highlighter脚本.js
// ==/UserScript==
// 油猴浏览器扩展自动更新逻辑为  比对版本号确认是否更新, 修改脚本后需修改版本号

//功能概述：
//从 Airtable 加载高亮文本:
//脚本使用 fetch 函数从您的 Airtable 表格中获取数据，并提取 "高亮文本" 字段的值。
//将获取到的高亮文本存储在一个数组 highlights 中。
//高亮网页文本:
//脚本遍历网页中的所有文本节点和 <span> 元素。
//使用正则表达式匹配包含高亮文本的文本节点。
//使用 Range 对象将匹配到的文本替换为包含背景色的 <span> 元素，实现高亮效果。
//对于 <span> 元素，如果其文本内容包含高亮文本，则直接设置 <span> 元素的背景色。
//处理动态内容:
//脚本使用 MutationObserver 监听网页 DOM 的变化。
//当 DOM 发生变化（例如新内容加载）时，脚本会重新扫描网页，并高亮新添加的文本。
//自定义颜色:
//脚本提供了一个 highlightColors 数组，用于存储不同的高亮颜色。
//脚本会循环使用 highlightColors 数组中的颜色，为不同的高亮文本分配不同的颜色。
//优势：
//自动高亮: 脚本可以自动从您的 Airtable 表格中获取高亮文本数据，并进行高亮操作，无需手动配置。
//动态高亮: 脚本能够识别动态加载的内容，并及时进行高亮。
//自定义颜色: 您可以根据自己的需求调整 highlightColors 数组，使用不同的颜色进行高亮。
//用途：

//您可以使用这个脚本在网页中高亮重要信息，例如关键词、产品名称、特殊标识等。

//您也可以使用它在网页中高亮从 Airtable 表格中获取的笔记或数据。


(async function() {
    'use strict';

    // 你的 Airtable 个人访问令牌
    const ACCESS_TOKEN = 'patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549'; 
    // 替换为你自己的 Base ID
    const BASE_ID = 'appfvvlcRZhbJhWA2'; 
    // 用于存储不同高亮颜色的数组
    const highlightColors = ['yellow', 'lightblue', 'lightgreen', 'pink', 'orange', 'lavender', 'lightcoral', 'lightgoldenrodyellow', 'lightgrey', 'beige', 'lightcyan', 'thistle', 'peachpuff', 'palegreen', 'plum'];
    // 用于存储高亮文本
    const highlights = [];

    // 获取 Airtable 表格和字段信息
    async function fetchTablesAndAnnotations(baseId) {
        try {
            // 向 Airtable API 发送请求，获取 Base 中的所有表格信息
            const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('获取 Airtable 表格信息失败');
            }

            // 解析返回的表格数据
            const tablesData = await response.json();
            for (const table of tablesData.tables) {
                const tableName = table.name; // 表格的名称
                const fields = table.fields;  // 表格中的字段信息
                // 查找名为 "高亮文本" 的字段
                const highlightField = fields.find(field => field.name === '高亮文本');

                if (highlightField) {  // 如果有 "高亮文本" 字段
                    // 获取该表格中的记录，并提取 "高亮文本"
                    await fetchTableData(baseId, tableName);
                }
            }
        } catch (error) {
            console.error('获取表格信息或注释失败:', error);
        }
    }

    // 获取指定表格的数据，并提取 "高亮文本" 字段
    async function fetchTableData(baseId, tableName) {
        try {
            // 向 Airtable API 发送请求，获取该表格的所有记录
            const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`获取表格 ${tableName} 数据失败`);
            }

            // 解析返回的数据
            const data = await response.json();
            // 遍历记录，并将 "高亮文本" 存入 highlights 数组
            data.records.forEach(record => {
                const highlightText = record.fields['高亮文本']; // 获取 "高亮文本" 字段
                if (highlightText) {
                    highlights.push({text: highlightText.trim(), tableName});
                }
            });

            console.log(`已从表格 ${tableName} 加载高亮文本`, highlights);
        } catch (error) {
            console.error(`获取表格 ${tableName} 数据失败:`, error);
        }
    }

    // 遍历页面中的文本节点，对匹配的文本进行高亮并添加红色边框
    function highlightText(node) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
            const text = node.nodeValue;
            const parentNode = node.parentNode;

            // 遍历所有高亮文本，查找匹配的文本
            highlights.forEach(({text: highlight, tableName}, index) => {
                const regex = new RegExp(`(${highlight})`, 'gi');
                if (regex.test(text)) {
                    let match = regex.exec(text);
                    while (match) {
                        // 创建 Range 对象，用于高亮显示匹配的文本
                        const range = document.createRange();
                        range.setStart(node, match.index);
                        range.setEnd(node, match.index + match[0].length);

                        // 创建一个新的 <span> 元素
                        const span = document.createElement('span');
                        span.style.backgroundColor = highlightColors[index % highlightColors.length];
                        span.style.fontWeight = 'bold'; // 加粗文本

                        // 如果当前表格是 "到货"，添加红色边框
                        if (tableName === "到货") {
                            span.style.border = '2px solid red';  // 添加红色边框
                            span.style.padding = '0 2px';  // 可选：为边框添加一些内边距
                        }
                        // 如果当前表格是 "仓库"，添加红色边框
                        if (tableName === "仓库") {
                            span.style.border = '3px solid blue';  // 添加红色边框
                            span.style.padding = '0 2px';  // 可选：为边框添加一些内边距
                        }
                        span.textContent = match[0];

                        // 用 Range 对象包裹匹配的文本
                        range.surroundContents(span);
                        match = regex.exec(text); // 继续查找下一个匹配项
                    }
                }
            });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // 如果当前节点是 <div> 或 <span> 元素，检查其文本是否包含高亮文本
            if (node.tagName === 'DIV' || node.tagName === 'SPAN') {
                const text = node.textContent;
                highlights.forEach(({text: highlight, tableName}, index) => {
                    if (text.includes(highlight)) {
                        // 如果文本中包含高亮文本，遍历其子节点进行高亮处理
                        for (let i = 0; i < node.childNodes.length; i++) {
                            const child = node.childNodes[i];
                            if (child.nodeType === Node.TEXT_NODE && child.nodeValue.includes(highlight)) {
                                child.parentElement.style.backgroundColor = highlightColors[index % highlightColors.length];
                                
                                // 如果当前表格是 "到货"，添加红色边框
                                if (tableName === "到货") {
                                    child.parentElement.style.border = '2px solid red';  // 添加红色边框
                                }
                                break; // 找到第一个匹配项后停止遍历
                            }
                        }
                    }
                });
            }

            // 遍历所有子节点，递归处理
            for (const child of node.childNodes) {
                highlightText(child);
            }
        }
    }

    // 观察 DOM 变化，处理动态加载的内容
    function observeDOMChanges() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                            highlightText(node);  // 高亮新添加的节点
                        }
                    });
                }
            });
        });

        // 观察整个文档的变化，子节点的添加或删除
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 页面加载时执行：加载高亮文本并开始高亮操作
    window.addEventListener('load', async () => {
        await fetchTablesAndAnnotations(BASE_ID);  // 获取并加载所有表格的高亮文本
        highlightText(document.body);  // 对整个页面进行初始高亮
        observeDOMChanges();  // 开始观察 DOM 变化并高亮动态加载的内容
    });
})();