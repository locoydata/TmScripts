// ==UserScript==
// @name         整合油猴脚本框架
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  整合多个油猴脚本的框架，包含浮动按钮和弹出菜单
// @author       [思钱想厚]
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // 创建浮动按钮
    const button = document.createElement('div');
    button.id = 'floatButton';
    button.innerText = '功能菜单';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.padding = '10px';
    button.style.backgroundColor = '#4285F4';
    button.style.color = '#fff';
    button.style.cursor = 'pointer';
    button.style.borderRadius = '5px';
    button.style.zIndex = '1000';
    document.body.appendChild(button);

    // 创建弹出菜单
    const menu = document.createElement('div');
    menu.id = 'menu';
    menu.style.display = 'none'; // 默认隐藏
    menu.style.position = 'fixed';
    menu.style.bottom = '60px';
    menu.style.right = '20px';
    menu.style.backgroundColor = '#fff';
    menu.style.border = '1px solid #ddd';
    menu.style.padding = '10px';
    menu.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    menu.style.zIndex = '1001';
    document.body.appendChild(menu);

    // 鼠标悬停在按钮上时显示菜单
    button.addEventListener('mouseenter', () => {
        menu.style.display = 'block';
    });

    // 鼠标移开按钮和菜单区域后隐藏菜单
    button.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!menu.matches(':hover') && !button.matches(':hover')) {
                menu.style.display = 'none';
            }
        }, 200);
    });
    menu.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!menu.matches(':hover') && !button.matches(':hover')) {
                menu.style.display = 'none';
            }
        }, 200);
    });

    // 功能列表数组，用于菜单和功能模块的注册
    const features = [
        { name: '功能1', action: feature1 },
        { name: '功能2', action: feature2 },
        // 在这里添加更多功能
    ];

    // 动态创建菜单选项
    features.forEach(feature => {
        const item = document.createElement('div');
        item.innerText = feature.name;
        item.style.cursor = 'pointer';
        item.style.marginBottom = '5px';
        item.addEventListener('click', () => {
            feature.action();
            menu.style.display = 'none'; // 点击后隐藏菜单
        });
        menu.appendChild(item);
    });

    // 功能1的实现（在此处粘贴第一个脚本的代码）
    function feature1() {
        console.log("执行功能1");
        // 粘贴你的第一个脚本的代码（原代码内容直接粘贴到这里）
    }

    // 功能2的实现（在此处粘贴第二个脚本的代码）
    function feature2() {
        console.log("执行功能2");
        // 粘贴你的第二个脚本的代码（原代码内容直接粘贴到这里）
    }

    // 如果需要，可以在这里继续添加更多功能函数
    // function feature3() {
    //     console.log("执行功能3");
    //     // 粘贴你的第三个脚本的代码
    // }
})();
