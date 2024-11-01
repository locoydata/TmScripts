// ==UserScript==
// @name         Annotations
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在网页中直接显示注释并高亮文本
// @match        *://*/*
// @exclude      *://*.example.com/login*  // 排除所有 login 页面
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    const ACCESS_TOKEN = 'patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549'; // 在此替换为你的个人访问令牌
    const BASE_ID = 'appWNNByUsenTcJML'; // 在此替换为你的Base ID
    const TABLE_NAMES = ['ae订单','供应商备注', 'SKU供应商', 'SKU采购链接', 'SKU备注', '1688订单物流', '多多订单物流', 'Warn']; // 所有表格的名称

    const annotations = {};

    // 加载多个表的注释内容
    async function loadAnnotations() {
        for (const tableName of TABLE_NAMES) {
            try {
                const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableName}`, {
                    headers: {
                        Authorization: `Bearer ${ACCESS_TOKEN}`, // 使用个人访问令牌
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`网络响应失败，表格：${tableName}`);
                }

                const data = await response.json();

                data.records.forEach(record => {
                    const key = record.fields['匹配文本'];  // 假设每个表格都有“匹配文本”和“注释内容”列
                    const value = record.fields['注释内容'];
                    if (!annotations[key]) {
                        annotations[key] = [];
                    }
                    annotations[key].push(value);
                });

                console.log(`表 ${tableName} 的注释加载成功`, annotations);
            } catch (error) {
                console.error(`加载表 ${tableName} 的注释失败:`, error);
            }
        }
    }

    // 创建注释div
    function createNote(node) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim()) {
            const text = node.nodeValue;
            const annotatedKeys = new Set();

            for (const [key, value] of Object.entries(annotations)) {
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
                    annotationDiv.style.maxWidth = '300px';
                    annotationDiv.style.whiteSpace = 'normal';
                    annotationDiv.style.border = '1px solid #ccc';
                    annotationDiv.style.backgroundColor = '#f9f9f9';
                    annotationDiv.style.padding = '5px';
                    annotationDiv.style.borderRadius = '3px';

                    // 存储所有匹配到的注释
                    const allAnnotations = [];

                    for (const [key, value] of Object.entries(annotations)) {
                        const regex = new RegExp(key, 'g');
                        if (regex.test(text) && !annotatedKeys.has(key)) {
                            // 收集所有匹配到的注释
                            allAnnotations.push(...value);
                            annotatedKeys.add(key);
                        }
                    }

                    // 如果存在匹配的注释
                    if (allAnnotations.length > 0) {
                        // 循环显示所有注释
                        allAnnotations.forEach((annotation, index) => {
                            const annotationSpan = document.createElement('span');
                            annotationSpan.textContent = `${annotation}`;  //注释内容为 `${annotation}` , 可以为内容加括号`(${annotation})`等操作
                            annotationSpan.title = annotation;
                            annotationDiv.appendChild(annotationSpan);

                            if (index < allAnnotations.length - 1) {
                                annotationDiv.appendChild(document.createElement('br'));
                            }
                        });

                        // 将 div 元素插入到第一个匹配项所在 div 的下一级
                        parentDiv.parentNode.insertBefore(annotationDiv, parentDiv.nextSibling);

                        // 修改为插入到父元素的最后
                        //parentDiv.parentNode.appendChild(annotationDiv);
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
        await loadAnnotations();
        createNote(document.body);
        observeDOMChanges();
    });
})();
