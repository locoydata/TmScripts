// ==UserScript==
// @name         图片上传Sm.ms
// @namespace    https://github.com/your-username
// @version      1.1
// @description  图片上传到Sm.ms图床
// @author       [思钱想厚]
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';
  
    // 你的有效 API Token
    const apiToken = 'JW5zs1p3Fqee4ieIiZBB6ylU5mnMU02l';
  
    // 创建悬浮按钮
    const button = document.createElement('button');
    button.textContent = '上传到Sm.ms';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '9999';
    document.body.appendChild(button);
  
    // 监听按钮点击事件
    button.addEventListener('click', function() {
      const imageUrl = 'http://img03.k3cdn.com/k/3776966/2024090321181289786967w1280h1707_750x750.jpg';
      const smmsApi = 'https://sm.ms/api/v2/upload';
  
      // 获取图片数据
      GM_xmlhttpRequest({
        method: 'GET',
        url: imageUrl,
        responseType: 'blob',
        onload: function(response) {
          if (response.status === 200) {
            const file = new File([response.response], 'image.png', { type: response.response.type || 'image/png' });
            const formData = new FormData();
            formData.append('smfile', file);
            formData.append('token', apiToken); // 添加 API Token
  
            GM_xmlhttpRequest({
              method: 'POST',
              url: smmsApi,
              data: formData,
              onload: function(uploadResponse) {
                const data = JSON.parse(uploadResponse.responseText);
                if (data.success) {
                  const uploadedImageUrl = data.data.url;
                  console.log('Sm.ms 图片 URL:', uploadedImageUrl);
                } else {
                  console.error('上传失败:', data.message);
                }
              },
              onerror: function(error) {
                console.error('上传失败:', error);
              }
            });
          } else {
            console.error('获取图片失败:', response.statusText);
          }
        },
        onerror: function(error) {
          console.error('获取图片失败:', error);
        }
      });
    });
  })();
  