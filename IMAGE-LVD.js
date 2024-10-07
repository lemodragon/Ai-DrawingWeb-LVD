import indexHtml from './index.html';
import galleryHtml from './gallery.html';

const DALLE_API_URL = 'https://cloudflare.lolita.pp.ua/v1/images/generations';
const DALLE_API_KEY = 'CF-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

const FLUX_API_URL = 'https://siliconflow.cute.pp.ua/v1/chat/completions';
const FLUX_API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

const IMAGE_HOST_API_URL = 'https://www.picgo.net/api/1/upload';  // 这里为你的图床API URL
const IMAGE_HOST_API_KEY = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
        status: 204
      });
    }
    
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(indexHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }
    
    if (url.pathname === '/gallery' && request.method === 'GET') {
      return new Response(galleryHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }
    
    if (url.pathname === '/generate-image' && request.method === 'POST') {
      try {
        const { model, prompt, size } = await request.json();
        console.log(`Generating image with model: ${model}, prompt: ${prompt}, size: ${size}`);

        let imageUrl;

        if (['DALL-E 3', 'DALL-E 2', 'DALL-E 1', 'FLUX-CF'].includes(model)) {
          imageUrl = await generateDalleImage(model, prompt, size);
        } else {
          imageUrl = await generateFluxImage(model, prompt, size);
        }

        console.log(`Image generated successfully: ${imageUrl}`);

        let uploadedImageUrl;
        try {
          uploadedImageUrl = await uploadToImageHost(imageUrl);
          console.log(`Image uploaded to host: ${uploadedImageUrl}`);
        } catch (uploadError) {
          console.error('Failed to upload to image host:', uploadError);
          uploadedImageUrl = imageUrl; // 使用原始图片URL
        }

        // Store the image URL in KV with 30 days expiration
        const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await env.GALLERY_IMAGES.put(Date.now().toString(), JSON.stringify({
          url: uploadedImageUrl,
          expiration: expirationDate.toISOString()
        }), {expirationTtl: 30 * 24 * 60 * 60});

        return new Response(JSON.stringify({ imageUrl: uploadedImageUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error generating image:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (url.pathname === '/gallery-images' && request.method === 'GET') {
      const images = await env.GALLERY_IMAGES.list();
      const currentDate = new Date();
      const imageUrls = await Promise.all(images.keys.map(async key => {
        const value = await env.GALLERY_IMAGES.get(key.name);
        const { url, expiration } = JSON.parse(value);
        if (new Date(expiration) > currentDate) {
          return url;
        } else {
          await env.GALLERY_IMAGES.delete(key.name);
          return null;
        }
      }));
      const validImageUrls = imageUrls.filter(url => url !== null);
      return new Response(JSON.stringify(validImageUrls), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/cleanup' && request.method === 'POST') {
      await cleanupExpiredImages(env);
      return new Response('Cleanup completed', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function generateDalleImage(model, prompt, size) {
  const dalleModel = model === 'DALL-E 3' ? 'dall-e-3' : 
                     model === 'DALL-E 2' ? 'dall-e-2' : 
                     model === 'DALL-E 1' ? 'dall-e-1' :
                     model === 'FLUX-CF' ? 'cf-flux' : 'dall-e-3';
  const response = await fetch(DALLE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DALLE_API_KEY}`,
    },
    body: JSON.stringify({ model: dalleModel, prompt, size }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate image with DALL-E: ${errorText}`);
  }

  const data = await response.json();
  return data.data[0].url;
}

async function generateFluxImage(model, prompt, size) {
  const fluxModel = model === 'FLUX' ? 'flux' :
                    model === 'SD 3' ? 'sd3' :
                    model === 'SD XL' ? 'sdxl' :
                    model === 'SD 2' ? 'sd2' :
                    model === 'SD Turbo' ? 'sdt' :
                    model === 'SD XL Turbo' ? 'sdxlt' :
                    model === 'SD XL Lightning' ? 'sdxll' : 'flux';
  
  console.log(`Selected model for FLUX: ${fluxModel}`);

  const response = await fetch(FLUX_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FLUX_API_KEY}`,
    },
    body: JSON.stringify({
      messages: [{
        model: fluxModel,
        role: 'user',
        content: prompt,
        size: size
      }]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate image with FLUX: ${errorText}`);
  }

  const data = await response.json();
  console.log('FLUX API response:', JSON.stringify(data));

  // Extract image URL from the response
  const assistantMessage = data.choices[0].message.content;
  const imageUrlMatch = assistantMessage.match(/!\[.*?\]\((.*?)\)/);
  if (!imageUrlMatch) {
    throw new Error('FLUX API response does not contain image URL');
  }
  return imageUrlMatch[1];
}

async function uploadToImageHost(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('source', blob, 'image.png');
    formData.append('key', IMAGE_HOST_API_KEY);
    formData.append('format', 'json');
    formData.append('expiration', 'P1M');  // Set expiration to 1 month

    const uploadResponse = await fetch(IMAGE_HOST_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    const data = await uploadResponse.json();
    if (!data.image || !data.image.url) {
      throw new Error('Image host response does not contain image URL');
    }
    return data.image.url;
  } catch (error) {
    console.error('Error in uploadToImageHost:', error);
    throw error;
  }
}

async function cleanupExpiredImages(env) {
  const images = await env.GALLERY_IMAGES.list();
  const currentDate = new Date();
  
  for (const key of images.keys) {
    const value = await env.GALLERY_IMAGES.get(key.name);
    const { expiration } = JSON.parse(value);
    if (new Date(expiration) <= currentDate) {
      await env.GALLERY_IMAGES.delete(key.name);
    }
  }
}
