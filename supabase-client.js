// Единый клиент Supabase и общие утилиты данных
window.RL_DB = (function() {
  let client = null;
  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      client = window.supabase.createClient(window.RL_CONFIG.SUPABASE_URL, window.RL_CONFIG.SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
  } catch (e) {
    console.error('Supabase init error:', e);
  }

  function getFallbackProducts() {
    return [
      {
        id: 101,
        title: '3D Потолочные панели "Ромб"',
        category: 'Потолочные Панели',
        material: 'МДФ 16мм под эмаль',
        price: 7000,
        unit: 'м²',
        description: 'Фрезерованные панели с глубоким рельефом для стильного оформления потолка и ниш.',
        image: 'https://placehold.co/400x400/ea580c/ffffff?text=RL+Панели'
      },
      {
        id: 102,
        title: 'Резная подставка для Корана (Лаух)',
        category: 'Подставки для Корана',
        material: 'Берёзовая фанера 8мм',
        price: 1500,
        unit: 'шт.',
        description: 'Традиционная раскладная подставка из цельного листа фанеры без единого гвоздя.',
        image: 'https://placehold.co/400x400/ea580c/ffffff?text=RL+Лаух'
      }
    ];
  }

  async function fetchProducts(useFallbackOnError = true) {
    try {
      if (!client) throw new Error('Supabase клиент недоступен');
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      console.warn('Ошибка загрузки из Supabase:', err.message);
      return {
        data: useFallbackOnError ? getFallbackProducts() : [],
        error: err
      };
    }
  }

  function getProductMaterial(product) {
    if (!product) return '';
    if (product.material && typeof product.material === 'string' && product.material.trim()) {
      return product.material.trim();
    }
    const desc = product.description || '';
    const match1 = desc.match(/\[Материал:\s*([^\]]+)\]/i);
    if (match1 && match1[1]) return match1[1].trim();
    const match2 = desc.match(/Материал:\s*([^\n\r,]+)/i);
    if (match2 && match2[1]) return match2[1].trim();
    return '';
  }

  function getCleanDescription(rawDesc) {
    if (!rawDesc) return '';
    return rawDesc
      .replace(/\[Материал:\s*[^\]]+\]/gi, '')
      .replace(/Материал:\s*[^\n\r]+/gi, '')
      .trim();
  }

  async function getMasterWhatsapp() {
    // Сначала пробуем получить номер из таблицы settings в Supabase, иначе из localStorage
    try {
      if (client) {
        const { data, error } = await client
          .from('settings')
          .select('value')
          .eq('key', 'whatsapp_phone')
          .maybeSingle();
        if (!error && data && data.value) {
          localStorage.setItem('rl_master_whatsapp', data.value);
          return data.value;
        }
      }
    } catch (e) {}
    return localStorage.getItem('rl_master_whatsapp') || window.RL_CONFIG.DEFAULT_WHATSAPP;
  }

  async function saveMasterWhatsapp(phone) {
    localStorage.setItem('rl_master_whatsapp', phone);
    try {
      if (client) {
        await client.from('settings').upsert({ key: 'whatsapp_phone', value: phone }, { onConflict: 'key' });
      }
    } catch (e) {}
  }

  return {
    client,
    fetchProducts,
    getProductMaterial,
    getCleanDescription,
    getMasterWhatsapp,
    saveMasterWhatsapp
  };
})();
