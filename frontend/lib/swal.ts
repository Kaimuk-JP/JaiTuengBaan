

const mobileDefaults = {
  width: '90%',
  customClass: {
    popup: 'swal-mobile-popup',
    title: 'swal-mobile-title',
    htmlContainer: 'swal-mobile-text',
    confirmButton: 'swal-mobile-button',
    cancelButton: 'swal-mobile-button',
  },
};

if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .swal2-container {
      z-index: 99999 !important;
    }
    .swal-mobile-popup {
      max-width: 400px !important;
      padding: 1.5rem !important;
      border-radius: 12px !important;
      z-index: 99999 !important;
    }
    .swal-mobile-title {
      font-size: 1.25rem !important;
      padding: 0.5rem 0 !important;
      line-height: 1.4 !important;
    }
    .swal-mobile-text {
      font-size: 0.95rem !important;
      padding: 0.75rem 0 !important;
      line-height: 1.5 !important;
    }
    .swal-mobile-button {
      font-size: 0.9rem !important;
      padding: 0.6rem 1.5rem !important;
      border-radius: 8px !important;
      min-width: 80px !important;
    }
    @media (max-width: 640px) {
      .swal-mobile-popup {
        max-width: 340px !important;
        padding: 1.25rem !important;
      }
      .swal-mobile-title {
        font-size: 1.1rem !important;
      }
      .swal-mobile-text {
        font-size: 0.875rem !important;
      }
    }
  `;
  if (!document.querySelector('#swal-mobile-styles')) {
    style.id = 'swal-mobile-styles';
    document.head.appendChild(style);
  }
}

let SwalInstance: any = null;

async function getSwalInstance() {
  if (!SwalInstance) {
    const module = await import('sweetalert2');
    SwalInstance = module.default;
  }
  return SwalInstance;
}

const Swal = {
  fire: async (options: any) => {
    const swal = await getSwalInstance();

    let finalOptions = { ...options };
    const content = finalOptions.text || finalOptions.html || '';

    if (typeof content === 'string' && (
      content.includes('<!DOCTYPE html>') ||
      content.includes('Invalid `prisma.') ||
      content.includes('Worker exceeded resource limits') ||
      content.includes('Cloudflare')
    )) {
      console.error('Raw Error intercepted by Swal:', content);

      finalOptions.title = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      finalOptions.text = null;
      finalOptions.html = `
                <div style="text-align: center;">
                    <p style="margin-bottom: 8px;">ระบบไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ในขณะนี้</p>
                    <p style="font-size: 0.85em; color: #666;">(Server Resource Limit Exceeded)</p>
                    <p style="font-size: 0.85em; color: #999; margin-top: 8px;">กรุณาลองใหม่อีกครั้งในภายหลัง</p>
                </div>
            `;
      finalOptions.icon = 'error';
    }

    const mergedOptions = {
      ...mobileDefaults,
      ...finalOptions,
      customClass: {
        ...mobileDefaults.customClass,
        ...(finalOptions?.customClass || {}),
      },
    };
    return swal.fire(mergedOptions);
  },

  mixin: async (options: any) => {
    const swal = await getSwalInstance();
    return swal.mixin(options);
  },

  isVisible: async () => {
    const swal = await getSwalInstance();
    return swal.isVisible();
  },

  close: async () => {
    const swal = await getSwalInstance();
    return swal.close();
  },

  getContainer: async () => {
    const swal = await getSwalInstance();
    return swal.getContainer();
  },

  showLoading: async () => {
    const swal = await getSwalInstance();
    return swal.showLoading();
  },

  showValidationMessage: async (message: string) => {
    const swal = await getSwalInstance();
    return swal.showValidationMessage(message);
  },
};

export default Swal;

export { Swal, getSwalInstance as getSwal };
