function buildShortReport({ status, fp, userAgent, timezone, type, ip, geoStr, uaData }) {
  let shortMsg = '';
  if (status.status === 'new') {
    shortMsg += '🆕 НОВЫЙ ЗАХОД\n';
  } else if (status.status === 'repeat') {
    shortMsg += '♻️ ПОВТОРНЫЙ ЗАХОД\n';
    shortMsg += `Шанс совпадения: ${status.score}% (${status.reason})\n`;
    shortMsg += `Последний визит: ${formatDate(status.lastSeen, timezone)}\n`;
  } else {
    shortMsg += '❓ НЕИЗВЕСТНЫЙ ЗАХОД\n';
    if (!fp) shortMsg += 'Причина: отсутствует fingerprint\n';
    if (!userAgent) shortMsg += 'Причина: отсутствует User-Agent\n';
    if (status.lastSeen) shortMsg += `Возможный визит: ${formatDate(status.lastSeen, timezone)}\n`;
  }
  shortMsg += `Тип: ${type}\n`;
  shortMsg += `IP: ${ip} — ${geoStr}\n`;
  shortMsg += `Устройство: ${uaData.device || 'неизвестно'}\n`;
  shortMsg += `Браузер: ${uaData.browser || 'неизвестно'}, ОС: ${uaData.os || 'неизвестно'}\n`;
  shortMsg += `Время: ${new Date().toLocaleTimeString('ru-RU', { timeZone: timezone || 'UTC' })}`;
  return shortMsg;
}

function buildDetailsReport({ geoData, userAgent, fp, webrtcIps, ip, screenSize, width, height, platform, language, timezone, clientTime, uaParsed, hardwareConcurrency, deviceMemory, touchSupport }) {
  let detailsMsg = '';
  detailsMsg += `🆔 Fingerprint: ${fp || 'неизвестно'}\n`;
  detailsMsg += `🕸️ User-Agent: ${userAgent || 'неизвестно'}\n`;
  detailsMsg += `\n`;
  detailsMsg += `🌍 IP: ${ip || 'неизвестно'}\n`;
  detailsMsg += `🏢 Провайдер: ${geoData?.org || 'неизвестно'}\n`;
  detailsMsg += `🛡️ VPN/Proxy/Tor: ${(geoData?.proxy || geoData?.hosting) ? 'Да' : 'Нет'}\n`;
  if (Array.isArray(webrtcIps) && webrtcIps.length) {
    let webrtcNote = '';
    if (ip && webrtcIps.some(wip => wip !== ip)) {
      webrtcNote = ' (отличаются от внешнего IP)';
    }
    detailsMsg += `🌐 WebRTC IPs: ${webrtcIps.join(', ')}${webrtcNote}\n`;
  } else {
    detailsMsg += '🌐 WebRTC IPs: нет данных\n';
  }
  detailsMsg += `\n`;
  let screenStr = screenSize ? screenSize : (width && height ? `${width}x${height}` : 'неизвестно');
  detailsMsg += `🖥️ Экран: ${screenStr}`;
  if (platform) detailsMsg += ` | Платформа: ${platform}`;
  detailsMsg += `\n`;
  if (uaParsed && typeof uaParsed === 'object') {
    detailsMsg += `📱 Устройство: ${uaParsed.device || 'неизвестно'} | Браузер: ${uaParsed.browser || 'неизвестно'} | ОС: ${uaParsed.os || 'неизвестно'}\n`;
  }
  detailsMsg += `🗣️ Язык: ${language || 'неизвестно'} | Часовой пояс: ${timezone || 'неизвестно'}\n`;
  detailsMsg += `⏰ Время на ПК: ${clientTime || 'неизвестно'}\n`;
  let cpuStr = typeof hardwareConcurrency !== 'undefined' ? hardwareConcurrency : 'неизвестно';
  let ramStr = typeof deviceMemory !== 'undefined' ? deviceMemory : 'неизвестно';
  let touchStr = typeof touchSupport !== 'undefined' ? (touchSupport ? 'да' : 'нет') : 'неизвестно';
  detailsMsg += `🧠 CPU: ${cpuStr} | ОЗУ: ${ramStr} ГБ | Touch: ${touchStr}\n`;
  return detailsMsg;
}

function buildInlineKeyboard(visitId) {
  return [[{ text: 'Детали', callback_data: `details_${visitId}` }]];
}

async function sendLocationWithReport(bot, chatId, geoData, shortMsg, inlineKeyboard) {
  await bot.sendLocation(chatId, geoData.lat, geoData.lon, {
    caption: shortMsg
  });
  await bot.sendMessage(chatId, '👇', {
    reply_markup: { inline_keyboard: inlineKeyboard }
  });
}

async function sendShortReport(bot, chatId, shortMsg, inlineKeyboard) {
  await bot.sendMessage(chatId, shortMsg, {
    reply_markup: { inline_keyboard: inlineKeyboard }
  });
}

function formatDate(date, tz) {
  try {
    return new Date(date).toLocaleString('ru-RU', { timeZone: tz || 'UTC' });
  } catch {
    return date;
  }
}

module.exports = {
  buildShortReport,
  buildDetailsReport,
  buildInlineKeyboard,
  sendLocationWithReport,
  sendShortReport
};
