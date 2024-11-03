// ==UserScript==
// @name         采集商品信息并上传到 Airtable (通用版)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  一键采集商品信息（标题、拿货价和图片 URL）并上传到 Airtable（通用版）
// @author       [你的名字]
// @match        *://*/*
// @grant        none
// ==/UserScript==

// 获取 Airtable API 密钥和表格 ID
const ACCESS_TOKEN = 'patbkrCcuDhqSEPik.f9945b399f40ab7dbeff15e8b436b8fa47de166bab355e6209c51c86106b4549'; // Airtable API 访问令牌
const BASE_ID = 'appuciOCDpoyVJCHB'; // Base ID
const TABLE_NAME = '开新有'; // Airtable 表格名称

// 创建浮动按钮
const button = document.createElement('button');
button.innerText = '采集商品';
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
button.style.transition = 'background-color 0.3s';

// 按钮鼠标悬停效果
button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#0056b3';
});
button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '#007BFF';
});

// 将按钮添加到页面中
document.body.appendChild(button);

button.addEventListener('click', async () => {
    // 获取商品信息
    let title = '';
    let price = 0;
    let sourceUrl = '';
    let seller = ''; // 商家字段
    let pickupPoint = ''; // 拿货点字段
    let imageUrls = []; // 图片 URL 数组
    const now = new Date();

    // 尝试从常见的元素中获取信息
    const titleElement = document.querySelector('.product_title .huohao');
    if (titleElement) {
        title = titleElement.textContent.trim().replace('货号：', '');
    } else {
        alert('未能找到商品标题，请检查页面结构。');
        return;
    }

    // 尝试从 price_box 中获取拿货价
    const priceElement = document.querySelector('.price_box .sku-price');
    if (priceElement) {
        price = parseFloat(priceElement.textContent.replace(/[^0-9\.]/g, ''));
    } else {
        alert('未能找到拿货价，请检查页面结构。');
        return;
    }

    // 尝试获取商家名称
    const sellerElement = document.querySelector('.name_left .name');
    if (sellerElement) {
        seller = sellerElement.textContent.trim();
    } else {
        alert('未能找到商家名称，请检查页面结构。');
        return;
    }

    // 尝试获取拿货点信息
    const pickupPointElement = Array.from(document.querySelectorAll('.site_right div')).find(div => div.textContent.includes('拿货点'));
    if (pickupPointElement) {
        pickupPoint = pickupPointElement.textContent.trim().replace('拿货点：', '');
    } else {
        alert('未能找到拿货点，请检查页面结构。');
        return;
    }

    // 提取图片 URL
    const imgElements = document.querySelectorAll('.tb-thumb img');
    imgElements.forEach(img => {
        imageUrls.push(img.src);
    });

    // 将 imageUrls 转换为逗号分隔的字符串
    const imageUrlsString = imageUrls.join(', ');

    sourceUrl = window.location.href; // 获取当前页面的网址
    const recordTime = now.toISOString().split('T')[0]; // 记录当前日期

    // 构建数据对象
    const productData = {
        '商品标题': title,
        '拿货价': price,
        '来源': sourceUrl,
        '记录时间': recordTime,
        '商家': seller,
        '拿货点': pickupPoint,
        'url': imageUrlsString // 添加图片 URL 列
    };

    // 上传数据到 Airtable
    const uploadSuccess = await uploadDataToAirtable(productData);

    if (uploadSuccess) {
        alert('商品信息成功上传到 Airtable！');
    } else {
        alert('上传到 Airtable 失败，请查看控制台了解更多信息。');
    }
});

// 上传数据到 Airtable
async function uploadDataToAirtable(productData) {
    try {
        const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: productData })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Data uploaded to Airtable:', data);
            return true; // 上传成功
        } else {
            console.error('Error uploading data to Airtable:', response.status, await response.text());
            return false; // 上传失败
        }
    } catch (error) {
        console.error('Error uploading data to Airtable:', error);
        return false;
    }
}
