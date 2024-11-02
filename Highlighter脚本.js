// ==UserScript==
// @name         Highlighter
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Highlights text on pages matching Airtable data
// @match        *://*/*
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

    const ACCESS_TOKEN = 'patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549'; // Replace with your personal access token
    const BASE_ID = 'appfvvlcRZhbJhWA2'; // 在此替换为你的Base ID
    const TABLE_NAME = '文本字符'; // 替换为你的 Airtable 表名

    const highlights = [];
    const highlightColors = ['yellow', 'lightblue', 'lightgreen', 'pink', 'orange', 'lavender', 'lightcoral', 'lightgoldenrodyellow', 'lightgrey', 'beige', 'lightcyan', 'thistle', 'peachpuff', 'palegreen', 'plum'];// 添加更多颜色

    // 加载高亮文本
    async function loadHighlights() {
        try {
            const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`, // 使用个人访问令牌
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`网络响应失败，表格：${TABLE_NAME}`);
            }

            const data = await response.json();
            data.records.forEach(record => {
                const highlightText = record.fields['高亮文本']; // 假设字段名为“高亮文本”
                if (highlightText) {
                    highlights.push(highlightText.trim()); // 存储高亮文本
                }
            });

            console.log(`高亮文本加载成功`, highlights);
        } catch (error) {
            console.error(`加载高亮文本失败:`, error);
        }
    }

    // 创建高亮
function highlightText(node) {
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
        const text = node.nodeValue;
        const parentNode = node.parentNode;

        highlights.forEach((highlight, index) => {
            const regex = new RegExp(`(${highlight})`, 'gi');
            if (regex.test(text)) {
                // 找到匹配的高亮文本
                let match = regex.exec(text);
                while (match) {
                    // 创建一个新的 Range 对象
                    const range = document.createRange();
                    // 设置 Range 的起始位置
                    range.setStart(node, match.index);
                    // 设置 Range 的结束位置
                    range.setEnd(node, match.index + match[0].length);

                    // 创建一个新的 <span> 元素
                    const span = document.createElement('span');
                    span.style.backgroundColor = highlightColors[index % highlightColors.length];
                    span.style.fontWeight = 'bold';
                    // 设置 <span> 元素的文本内容
                    span.textContent = match[0];

                    // 使用 Range 对象将匹配到的文本替换为 <span> 元素
                    range.surroundContents(span);

                    // 继续寻找下一个匹配项
                    match = regex.exec(text);
                }
            }
        });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'DIV' || node.tagName === 'SPAN') {
            // 如果当前节点是 <div> 或 <span> 元素，且包含高亮文本
            const text = node.textContent;
            highlights.forEach((highlight, index) => {
                if (text.includes(highlight)) {
                    // 遍历子节点，找到包含高亮文本的子节点，并对其进行高亮
                    for (let i = 0; i < node.childNodes.length; i++) {
                        const child = node.childNodes[i];
                        if (child.nodeType === Node.TEXT_NODE && child.nodeValue.includes(highlight)) {
                            // 找到包含高亮文本的子节点，对其进行高亮
                            child.parentElement.style.backgroundColor = highlightColors[index % highlightColors.length];
                            break; // 找到一个子节点后，停止循环
                        }
                    }
                }
            });
        }
        // 遍历所有子节点
        for (const child of node.childNodes) {
            highlightText(child);
        }
    }
}

    // 观察 DOM 的变化并高亮新内容
    function observeDOMChanges() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                            highlightText(node);
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
        await loadHighlights();
        highlightText(document.body);
        observeDOMChanges();
    });
})();