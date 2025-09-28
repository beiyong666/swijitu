// 假设你的 KV 命名空间在 EdgeOne 控制台中绑定时的变量名是 IMAGE_LINKS
// 你需要确保你的 Edge Function 已经关联了这个 KV 存储
const KV_NAMESPACE = 'IMAGE_LINKS';

/**
 * 随机返回目录中的一张图片链接并进行重定向。
 * 目录名即为 KV 的 Key。
 * @param {string} path - 请求路径 (例如: /cats, /)
 * @param {object} env - 环境变量，包含绑定的 KV
 * @returns {Response} - 302 重定向响应 或 404 响应
 */
async function handleRandomImage(path, env) {
    // 移除路径开头和结尾的斜杠，作为 KV 的 Key
    const key = path.startsWith('/') ? path.substring(1) : path;
    const directory = key || 'default'; // 默认目录名为 'default'

    const imageListStr = await env[KV_NAMESPACE].get(directory);

    if (!imageListStr) {
        return new Response(`Error: Directory '${directory}' not found or is empty.`, {
            status: 404
        });
    }

    try {
        // KV 中存储的是 JSON 格式的图片链接数组
        const imageList = JSON.parse(imageListStr);

        if (!Array.isArray(imageList) || imageList.length === 0) {
             return new Response(`Error: Directory '${directory}' is empty or contains invalid data.`, {
                status: 404
            });
        }

        // 随机选择一个图片链接
        const randomIndex = Math.floor(Math.random() * imageList.length);
        const randomImageUrl = imageList[randomIndex];

        // 302 重定向到图片链接
        return Response.redirect(randomImageUrl, 302);

    } catch (e) {
        console.error("Parsing error:", e);
        return new Response('Internal Server Error: Failed to process image list.', {
            status: 500
        });
    }
}

/**
 * 处理管理端的图片链接上传请求。
 * @param {Request} request - 请求对象
 * @param {object} env - 环境变量，包含绑定的 KV
 * @returns {Response} - 操作结果响应
 */
async function handleAdminUpload(request, env) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed. Use POST.', { status: 405 });
    }

    let data;
    try {
        data = await request.json();
    } catch (e) {
        return new Response('Invalid JSON payload.', { status: 400 });
    }

    const { directory, imageUrl } = data;

    if (!directory || !imageUrl) {
        return new Response('Missing required fields: "directory" and "imageUrl".', { status: 400 });
    }

    const kvStore = env[KV_NAMESPACE];

    try {
        // 1. 获取现有列表
        let imageListStr = await kvStore.get(directory);
        let imageList = [];
        
        if (imageListStr) {
            try {
                imageList = JSON.parse(imageListStr);
                if (!Array.isArray(imageList)) {
                    // 如果不是数组，可能数据损坏，尝试初始化为空数组
                    imageList = []; 
                }
            } catch (e) {
                // 解析失败，初始化为空数组
                imageList = [];
            }
        }
        
        // 2. 检查是否已存在
        if (imageList.includes(imageUrl)) {
            return new Response(JSON.stringify({ 
                success: true, 
                message: `Image URL already exists in directory: ${directory}.`,
                count: imageList.length 
            }), { 
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. 添加新的链接
        imageList.push(imageUrl);

        // 4. 更新 KV 存储
        await kvStore.put(directory, JSON.stringify(imageList));

        return new Response(JSON.stringify({ 
            success: true, 
            message: `Successfully added image to directory: ${directory}.`,
            count: imageList.length
        }), { 
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error("KV operation error:", e);
        return new Response('Internal Server Error during KV operation.', { status: 500 });
    }
}


// EdgeOne Pages Function 入口
export async function onRequest({ request, params, env }) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 管理接口路径
    if (path.startsWith('/admin/upload')) {
        return handleAdminUpload(request, env);
    }
    
    // 随机图片接口路径
    return handleRandomImage(path, env);
}
