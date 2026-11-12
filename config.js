export const CONFIG = {
  SUPABASE_URL: 'https://fgbjglpdoirsdnkrgsqk.supabase.co',
  SUPABASE_KEY: 'sb_publishable_VmMN054vVhhz-JCeEW4LJg_Tcp6w9zc',
  MASTER_EMAIL: 'rinat@mail.ru',
  WHATSAPP_PHONE: '79280003899',
  COMPANY_NAME: 'RL technology • ЧПУ цех',
  DEFAULT_SHEET: {
    width: 1525,
    height: 1525,
    kerf: 6,
    margin: 15
  }
};

export const supabase = window.supabase
  ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY)
  : null;
