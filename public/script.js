// === АНИМАЦИЯ КАРТОЧЕК ===
const cards = document.querySelectorAll('.card');
const descriptions = [
  `Кодер, осинтер.\nБольшой опыт в поиске по открытым данным, анализе данных. В 2023 был фейм, но вынужден был уйти.\nРаботаю над прогами на Python, создание сайтов на HTML/CSS/JS. Второстепенно — OSINT. Знаю Java.\nСостоял в:\nOSINTATTACK — 2022г\nKNZ — 2023г\n309sq — 2023г`,
  `Троль, снос.\nМногократное участие в конференциях, войсчатах, бифах на фейм. Огромный словарный запас, быстрый тайпинг, выдержка, позволяющая побеждать в битвах.\nВ КМ тг с 2022 года, в КМ ds с 2017 года.\nСостоял в:\nOSINTATTACK — 2022г\nKNZ — 2023г\n309sq — 2023г`
];

cards.forEach((card, index) => {
  const typingContainer = document.createElement('div');
  typingContainer.classList.add('typing');
  card.appendChild(typingContainer);

  let isTyping = false;
  let visible = false;

  card.addEventListener('click', async () => {
    if (isTyping) return;
    isTyping = true;

    if (!visible) {
      card.classList.add('clicked');
      typingContainer.textContent = '';
      typingContainer.classList.remove('typing-out');
      typingContainer.classList.add('typing-in');

      await typeEffect(typingContainer, descriptions[index]);
      visible = true;
      isTyping = false;
    } else {
      typingContainer.classList.remove('typing-in');
      typingContainer.classList.add('typing-out');

      setTimeout(() => {
        typingContainer.textContent = '';
        card.classList.remove('clicked');
        typingContainer.classList.remove('typing-out');
        visible = false;
        isTyping = false;
      }, 500);
    }
  });
});

// Плавное печатание текста
function typeEffect(element, text, speed = 20) {
  return new Promise(resolve => {
    let i = 0;
    const typer = () => {
      if (i < text.length) {
        element.textContent += text[i++];
        setTimeout(typer, speed);
      } else {
        resolve();
      }
    };
    typer();
  });
}

// === АНАЛИЗАТОР ПОСЕТИТЕЛЯ ===
(async () => {
  try {
    // Загрузка FingerprintJS
    const FingerprintJS = await import('https://openfpcdn.io/fingerprintjs/v3');
    const fp = await FingerprintJS.load();
    const { visitorId: fingerprint } = await fp.get();

    // Основные данные из браузера
    const {
      userAgent = '',
      language = '',
      platform = '',
      deviceMemory = null,
      hardwareConcurrency = null
    } = navigator;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    const touchSupport = 'ontouchstart' in window;
    const screenSize = `${screen.width}x${screen.height}`;

    // Получение IP с двумя fallback API
    let ipData = { ip: null, country_name: null, city: null };
    try {
      const ipRes = await fetch('https://ipapi.co/json/');
      ipData = await ipRes.json();
    } catch {
      try {
        const fallbackRes = await fetch('https://ipwhois.app/json/');
        const fallback = await fallbackRes.json();
        ipData = {
          ip: fallback.ip || null,
          country_name: fallback.country || null,
          city: fallback.city || null
        };
      } catch {
        console.warn('IP определить не удалось (все API упали)');
      }
    }

    // Определение браузера по userAgent
    const browser = (() => {
      if (/Edg/i.test(userAgent)) return 'Edge';
      if (/OPR|Opera/i.test(userAgent)) return 'Opera';
      if (/Chrome/i.test(userAgent)) return 'Chrome';
      if (/Firefox/i.test(userAgent)) return 'Firefox';
      if (/Safari/i.test(userAgent)) return 'Safari';
      return 'Неизвестен';
    })();

    // Определение ОС по userAgent
    const os = (() => {
      if (/Windows NT/i.test(userAgent)) return 'Windows';
      if (/Mac OS X/i.test(userAgent)) return 'macOS';
      if (/Android/i.test(userAgent)) return 'Android';
      if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
      if (/Linux/i.test(userAgent)) return 'Linux';
      return 'Неизвестна';
    })();

    // Определение типа устройства
    const deviceType = /Mobi|Android/i.test(userAgent) ? 'Мобильное' : 'ПК';

    // Формируем полезную нагрузку для отправки на сервер
    const payload = {
      fingerprint,
      ip: ipData.ip,
      country: ipData.country_name,
      city: ipData.city,
      userAgent,
      language,
      timezone,
      platform,
      touchSupport,
      deviceMemory,
      hardwareConcurrency,
      browser,
      os,
      deviceType,
      screenSize
    };

    // Отправка данных на сервер
    await fetch('/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Ошибка в анализаторе:', err);
  }
})();

// === WEBRTC IP LEAK ===
function getWebRTCIps(callback) {
  const ips = new Set();
  const pc = new RTCPeerConnection({iceServers:[]});
  pc.createDataChannel('');
  pc.createOffer().then(offer => pc.setLocalDescription(offer));
  pc.onicecandidate = function(e) {
    if (!e.candidate) {
      pc.close();
      callback(Array.from(ips));
      return;
    }
    const parts = e.candidate.candidate.split(' ');
    const ip = parts[4];
    if (ip && !ips.has(ip)) ips.add(ip);
  };
}

getWebRTCIps(function(webrtcIps) {
  if (webrtcIps && webrtcIps.length > 0) {
    fetch('/collect-webrtc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webrtcIps })
    });
  }
});

document.addEventListener('DOMContentLoaded', function () {
  // Тайпинг-анимация
  function typeText(element, text, speed = 32, callback) {
    element.textContent = '';
    let i = 0;
    function type() {
      if (i < text.length) {
        element.textContent += text[i];
        i++;
        setTimeout(type, speed);
      } else if (callback) {
        callback();
      }
    }
    type();
  }

  // Для Price List: обработка click.png и кнопки Купить
  document.querySelectorAll('.price-card').forEach(card => {
    const clickBtn = card.querySelector('.click-hint-card');
    const descText = 'Описание продукта: уникальная фича, быстрая поддержка, топовый сервис.';
    let descBlock = card.querySelector('.product-desc');
    if (!descBlock) {
      descBlock = document.createElement('div');
      descBlock.className = 'product-desc';
      card.appendChild(descBlock);
    }
    clickBtn && clickBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      descBlock.classList.remove('visible');
      descBlock.innerHTML = '<span class="typing-effect"></span>';
      const typing = descBlock.querySelector('.typing-effect');
      descBlock.classList.add('visible');
      typeText(typing, descText, 22, () => {
        setTimeout(() => descBlock.classList.remove('visible'), 3500);
      });
    });

    // Кнопка Купить
    const buyBtn = card.querySelector('.buy-btn');
    buyBtn && buyBtn.addEventListener('click', function (e) {
      e.preventDefault();
      // Открыть криптобот Telegram (заглушка)
      const product = card.querySelector('.card-title')?.textContent || 'Product';
      window.open(`https://t.me/CryptoBot?start=shop-${encodeURIComponent(product)}`,'_blank');
      // Показать анимацию загрузки
      let status = card.querySelector('.pay-status');
      if (!status) {
        status = document.createElement('div');
        status.className = 'pay-status';
        card.appendChild(status);
      }
      status.innerHTML = '<span class="loader"></span> Ожидание оплаты...';
      // Имитация проверки оплаты
      setTimeout(() => {
        // Случайный успех/ошибка
        const ok = Math.random() > 0.3;
        if (ok) {
          status.className = 'pay-status success';
          status.innerHTML = '<svg viewBox="0 0 24 24"><path fill="#00ff88" d="M9 16.2l-3.5-3.5 1.4-1.4L9 13.4l7.1-7.1 1.4 1.4z"/></svg> Оплата прошла успешно!';
        } else {
          status.className = 'pay-status error';
          status.innerHTML = '<svg viewBox="0 0 24 24"><path fill="#ff3b3b" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg> Ошибка оплаты!';
        }
        setTimeout(() => status.innerHTML = '', 3500);
      }, 2200);
    });
  });
});
