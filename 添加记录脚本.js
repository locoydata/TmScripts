// ==UserScript==
// @name         添加记录
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  选择数据库和表并向 Airtable 添加记录
// @author       [思钱想厚]
// @match        ://erp2.cnfth.com/
// @match        ://*.1688.com/*
// @exclude      ://airtable.com/  // 排除页面
// @grant        none
// @updateURL    https://locoydata.github.io/TmScripts/添加记录脚本.js
// @downloadURL  https://locoydata.github.io/TmScripts/添加记录脚本.js
// ==/UserScript==
(async function() {
    'use strict';

    // Airtable 配置
    const ACCESS_TOKEN = 'patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549'; // Airtable API 访问令牌
    const BASES = {
        'ae sku': 'appWNNByUsenTcJML',
        'ae供应链': 'appg0WaUPMbz68tVM',
        'dd sku': 'appifrPrAvt6VRj8p',
        'dd供应链': 'appbYNmfjlgabA2tO',

        'WebReminder': 'appe3cvzz8IDpyNRq', // Base ID 2
        'Highlighter': 'appfvvlcRZhbJhWA2',

    };

    // 动态获取表名和字段名
    let currentTables = [];
    let currentBaseId = Object.values(BASES)[0]; // 默认选择第一个数据库

    // 创建浮动按钮
    const button = document.createElement('button');
    button.innerText = '添加记录到 Airtable';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '1000';
    button.style.padding = '10px';
    button.style.backgroundColor = '#007BFF';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    document.body.appendChild(button);

    // 创建表单模态框
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'none';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1001';

    const form = document.createElement('form');
    form.style.backgroundColor = '#fff';
    form.style.padding = '20px';
    form.style.borderRadius = '5px';
    form.style.width = '500px';
    form.style.height = '600px'; // 固定高度
    form.style.overflowY = 'auto'; // 允许内容溢出时滚动
    form.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; // 添加阴影
    form.style.display = 'flex';
    form.style.flexDirection = 'column'; // 垂直方向布局
    form.style.position = 'relative'; // 允许子元素绝对定位

    form.innerHTML = `
    <h3>添加记录</h3>
    <label>选择数据库:</label>
    <select id="baseSelect">${createBaseOptions()}</select>
    <br/>
    <label>选择表格:</label>
    <select id="tableSelect">${createTableOptions([])}</select>
    <br/>
    <div id="fieldsContainer" style="flex-grow: 1;"></div> <!-- 允许字段容器占据剩余空间 -->
    <div style="display: flex; justify-content: space-between; margin-top: 10px;">
        <button type="submit">提交</button>
        <button type="button" id="cancelButton">取消</button>
    </div>
`;
    modal.appendChild(form);
    document.body.appendChild(modal);


    // 监听表格选择的变化
    document.getElementById('tableSelect').addEventListener('change', updateFields);

    // 显示表单模态框
    button.addEventListener('click', () => {
        modal.style.display = 'flex';
        updateTables(); // 更新表格列表
    });

    // 关闭模态框
    document.getElementById('cancelButton').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // 处理表单提交
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const tableName = document.getElementById('tableSelect').value;
        const fields = currentTables.find(table => table.name === tableName).fields;

        const recordData = {};
        fields.forEach(field => {
            const input = document.getElementById(field.name);
            if (input) { // 检查输入框是否存在
                let value = input.value;

                // 检查字段类型，处理数字字段
                if (field.type === 'number') {
                    value = Number(value); // 转换为数字类型
                }

                if (value !== '' && value !== null) { // 仅在值不为空时添加字段
                    recordData[field.name] = value;
                }
            }
        });


        // 调用 Airtable API 添加记录
        try {
            const response = await fetch(`https://api.airtable.com/v0/${currentBaseId}/${tableName}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: recordData })
            });

            if (!response.ok) {
                throw new Error(`提交到表 ${tableName} 失败`);
            }

            alert(`记录成功添加到表 ${tableName}`);
            modal.style.display = 'none';
            form.reset(); // 重置表单
        } catch (error) {
            console.error('提交记录失败:', error);
            alert('记录添加失败，请检查控制台错误信息');
        }
    });


    // 从 Airtable 获取表和字段
    async function fetchTables(baseId) {
        const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error('无法获取表格信息');
        }

        const data = await response.json();
        return data.tables; // 返回表信息
    }

    // 生成数据库选择框选项
    function createBaseOptions() {
        return Object.keys(BASES).map(baseName => `<option value="${BASES[baseName]}">${baseName}</option>`).join('');
    }

    // 生成表格选择框选项
    function createTableOptions(tables) {
        return tables.map(table => `<option value="${table.name}">${table.name}</option>`).join('');
    }

    // 更新表格动态显示
    async function updateTables() {
        const baseId = document.getElementById('baseSelect').value;
        currentBaseId = baseId; // 更新当前 Base ID
        currentTables = await fetchTables(baseId); // 获取新的表格
        document.getElementById('tableSelect').innerHTML = createTableOptions(currentTables);
        updateFields(); // 更新字段显示
    }

    // 更新字段动态显示
    function updateFields() {
        const requiredFields = ["SKU", "SKU备注", "SKU供应商", "SKU采购链接", "供应商", "供应商链接"]; // 必填字段名称列表
        const tableName = document.getElementById('tableSelect').value;
        const fieldsContainer = document.getElementById('fieldsContainer');
        const fields = currentTables.find(table => table.name === tableName).fields;

        const sourceUrl = window.location.href;
        const currentTime = new Date().toISOString();

        fieldsContainer.innerHTML = fields.map(field => {
            let inputElement = '';

            // 检查字段是否为必填字段
            const isRequired = requiredFields.includes(field.name); // 直接匹配字段名

            // 根据字段类型创建不同的输入框元素
            if (field.name === '来源') {
                inputElement = `<input type="text" id="${field.name}" value="${sourceUrl}" ${isRequired ? 'required' : ''} style="flex: 1; margin-left: 10px;" />`;
            } else if (field.name === '记录时间') {
                inputElement = `<input type="text" id="${field.name}" value="${currentTime}" ${isRequired ? 'required' : ''} style="flex: 1; margin-left: 10px;" />`;
            } else if (field.type === 'singleSelect' && field.options && field.options.choices) { // <option value="${choice.id}">${choice.name}</option>`)也可以通过api上传数据🚨🚨
                // 为 singleSelect 类型字段生成下拉选择框
                inputElement = `
                <select id="${field.name}" ${isRequired ? 'required' : ''} style="flex: 1; margin-left: 10px;">
                    <option value="">请选择</option>
                    ${field.options.choices.map(choice => `<option value="${choice.name}">${choice.name}</option>`).join('')}
                </select>
            `;
            } else {
                // 其他字段类型使用文本输入框
                inputElement = `<input type="${field.type === 'multilineText' ? 'textarea' : 'text'}" id="${field.name}" ${isRequired ? 'required' : ''} style="flex: 1; margin-left: 10px;" />`;
            }

            // 在必填字段名后添加 "(必填)" 标识
            const label = isRequired ? `${field.name} (必填):` : `${field.name}:`;

            // 修改<label style="flex: 0 0 150px;">调整模态框中字段名的宽度
            return `
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <label style="flex: 0 0 150px;">${label}</label>
                ${inputElement}
            </div>
        `;
        }).join('');
    }



    // 监听数据库选择的变化
    document.getElementById('baseSelect').addEventListener('change', updateTables);
})();
