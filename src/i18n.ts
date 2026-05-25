export const languageOptions = ["English", "简体中文", "Tiếng Việt", "Bahasa Indonesia", "Español"] as const;

export type Language = (typeof languageOptions)[number];

type Dictionary = Record<string, string>;

const english: Dictionary = {
  "Exness 欢迎您": "Welcome to Exness",
  "登录": "Sign in",
  "开立账户": "Open account",
  "电子邮箱地址": "Email address",
  "密码": "Password",
  "或使用以下方式登录": "or sign in with",
  "忘记密码": "Forgot password",
  "居住国家/地区": "Country/Region of residence",
  "继续": "Continue",
  "我确认自己不是美国居民，并同意法律文件。": "I confirm that I am not a US resident and agree to the legal documents.",
  "隐私协议": "Privacy agreement",
  "风险披露": "Risk disclosure",
  "防止洗钱": "Anti-money laundering",
  "安全说明": "Security instructions",
  "法律文件": "Legal documents",
  "申诉处理政策": "Complaint handling policy",
  "Exness对于部分司法管辖区域的居民不提供服务，包括美国、伊朗、朝鲜、欧盟、英国和其他国家/地区。本网站内容不可解读为要约邀请。":
    "Exness does not provide services to residents of certain jurisdictions, including the USA, Iran, North Korea, the EU, the UK and other countries. This website content is not an offer.",
  "差价合约 (CFD) 交易和普通杠杆产品存在重大亏损风险，您可能损失所有投入资本。":
    "CFD trading and leveraged products carry a significant risk of loss. You may lose all invested capital.",
  "Exness (SC) Ltd是一家在塞舌尔注册的证券交易商，由金融服务管理局授权，许可证号为SD025。":
    "Exness (SC) Ltd is a securities dealer registered in Seychelles and authorized by the Financial Services Authority under license SD025.",
  "风险提示：我们的服务涉及复杂衍生产品。由于杠杆作用，这些产品具有快速亏损的高风险。":
    "Risk warning: our services involve complex derivative products. Due to leverage, these products carry a high risk of rapid loss.",
};

const zh: Dictionary = {
  "Static Personal Area loaded with local mock data.": "静态个人专区已载入本地模拟数据。",
  "Signed in locally. No credentials were transmitted.": "已在本地登录，未传输任何凭据。",
  "Personal Area created locally.": "个人专区已在本地创建。",
  "Copied to clipboard.": "已复制到剪贴板。",
  "Language set to": "语言已切换为",
  "Trading account created.": "交易账户已创建。",
  "Deposit completed locally.": "入金已在本地完成。",
  "Withdrawal completed locally.": "出金已在本地完成。",
  "Transfer completed locally.": "内部转账已在本地完成。",
  "Support ticket opened.": "支持工单已创建。",
  "Chat panel opened.": "聊天面板已打开。",
  "Trading terminal preferences saved.": "交易终端设置已保存。",
  "Password change simulated locally.": "密码修改流程已在本地模拟完成。",
  "Account renamed.": "账户已重命名。",
  "Leverage changed.": "杠杆已修改。",
  "Wallet created.": "钱包已创建。",
  "My accounts": "我的账户",
  Trading: "交易",
  Performance: "表现",
  "History of orders": "订单历史",
  "Exness Terminal": "Exness 终端",
  "Payments & wallet": "支付和钱包",
  Deposit: "入金",
  Withdrawal: "出金",
  Withdraw: "出金",
  Transfer: "转账",
  "Transaction history": "交易记录",
  "Crypto wallet": "加密钱包",
  Analytics: "分析",
  "Analyst Views": "分析师观点",
  "Market News": "市场新闻",
  "Economic Calendar": "经济日历",
  "Exness benefits": "Exness 权益",
  "Trading Conditions": "交易条件",
  Savings: "节省",
  "Virtual Private Server": "虚拟专用服务器",
  "Copy Trading": "跟单交易",
  "Support hub": "支持中心",
  New: "新",
  Settings: "设置",
  Profile: "个人资料",
  Security: "安全",
  "Trading Terminal": "交易终端",
  "Refer traders, earn commission": "邀请交易者，赚取佣金",
  "Fill in your account details to make your first deposit": "填写账户详情以完成首次入金",
  "Complete profile, identity and address verification to unlock the full payment flow.": "完成个人资料、身份和地址验证以解锁完整支付流程。",
  "Learn more": "了解更多",
  Complete: "完成",
  "Open account": "开立账户",
  Real: "真实",
  Demo: "模拟",
  "Sort by": "排序方式",
  Newest: "最新",
  Balance: "余额",
  Name: "名称",
  "List view": "列表视图",
  "Grid view": "网格视图",
  Trade: "交易",
  "Account details": "账户详情",
  Server: "服务器",
  Leverage: "杠杆",
  Equity: "净值",
  "Free margin": "可用保证金",
  Margin: "保证金",
  "Account actions": "账户操作",
  "Account information": "账户信息",
  "Change leverage": "修改杠杆",
  "Rename account": "重命名账户",
  "Set read-only access": "设置只读权限",
  "Change trading password": "修改交易密码",
  "Account statement": "账户报表",
  "Archive account": "归档账户",
  "Available balance": "可用余额",
  "Mark all read": "全部标为已读",
  Notifications: "通知",
  "No notifications": "暂无通知",
  "New activity will appear here.": "新的活动会显示在这里。",
  "Clear notifications": "清除通知",
  "Help Center": "帮助中心",
  "Trading tools": "交易工具",
  "Exness blog": "Exness 博客",
  "Contact support": "联系支持",
  "Google sign-in": "Google 登录",
  "Forgot password": "忘记密码",
  "Email address": "电子邮箱地址",
  Password: "密码",
  "Country/Region of residence": "居住国家/地区",
  "or sign in with": "或使用以下方式登录",
  "Welcome to Exness": "Exness 欢迎您",
  "Sign in": "登录",
  Continue: "继续",
  "Summary": "概览",
  Account: "账户",
  Period: "周期",
  "All accounts": "所有账户",
  "Last 7 days": "最近 7 天",
  "Last 30 days": "最近 30 天",
  "All time": "全部时间",
  Profit: "收益",
  Orders: "订单",
  "Net profit": "净收益",
  Volume: "交易量",
  "Profit and loss": "盈亏",
  "Equity curve": "净值曲线",
  "Order activity": "订单活动",
  "Local sample data": "本地模拟数据",
  "Closed orders": "已平仓订单",
  "Open orders": "持仓订单",
  All: "全部",
  Today: "今天",
  "This week": "本周",
  "Download CSV": "下载 CSV",
  "CSV download generated.": "CSV 已生成。",
  Order: "订单",
  Symbol: "品种",
  Type: "类型",
  "Open price": "开仓价",
  Status: "状态",
  "No orders match this filter.": "没有符合筛选条件的订单。",
  "Search transactions": "搜索交易记录",
  Reference: "参考号",
  Amount: "金额",
  Created: "创建时间",
  "No transactions found.": "未找到交易记录。",
  "Create wallet": "创建钱包",
  "Internal transfer": "内部转账",
  "Trading account": "交易账户",
  "Payment method": "支付方式",
  Method: "方式",
  Confirm: "确认",
  Back: "返回",
  Cancel: "取消",
  "From account": "转出账户",
  "To account": "转入账户",
  Subject: "主题",
  Category: "类别",
  Message: "消息",
  Submit: "提交",
  "Open a ticket": "提交工单",
  "Start chat": "开始聊天",
  "How can we help you?": "我们能帮您什么？",
  "Search support topics": "搜索支持主题",
  "Deposits and withdrawals": "入金和出金",
  "Payments, limits and processing time": "支付、限额和处理时间",
  "Account verification": "账户验证",
  "Documents, profile and address checks": "证件、个人资料和地址审核",
  "Trading platforms": "交易平台",
  "MT4, MT5 and Exness Terminal": "MT4、MT5 和 Exness 终端",
  "Password, devices and two-factor verification": "密码、设备和双重验证",
  "My tickets": "我的工单",
  Ticket: "工单",
  Updated: "更新时间",
  "Account Status": "账户状态",
  "Not verified": "未验证",
  Verified: "已验证",
  "Complete your profile": "完成个人资料",
  "Verify your identity": "验证身份",
  "Verify your address": "验证地址",
  Pending: "待处理",
  Completed: "已完成",
  "Complete now": "立即完成",
  "Full name": "姓名",
  "Date of birth": "出生日期",
  "Country of residence": "居住国家/地区",
  "Login details": "登录详情",
  "Two-step verification": "双重验证",
  "Trusted devices": "受信任设备",
  "Log out": "退出",
  "Log out from other devices": "退出其他设备",
  Current: "当前",
  Change: "更改",
  Terminate: "终止",
  "Terminate Exness Personal Area": "终止 Exness 个人专区",
  "Set the default trading terminal": "设置默认交易终端",
  "Trading terminal": "交易终端",
  "Open trades in": "交易打开方式",
  "Current tab": "当前标签页",
  "New tab": "新标签页",
  "Download the Exness mobile app and trade while you're on the go": "下载 Exness 移动应用，随时随地交易",
  "Exness Assistant": "Exness 助手",
  "Hello. How can we help you today?": "您好。今天我们能帮您什么？",
  "Type a message": "输入消息",
};

const vi: Dictionary = {
  "My accounts": "Tài khoản của tôi",
  Trading: "Giao dịch",
  Performance: "Hiệu suất",
  "History of orders": "Lịch sử lệnh",
  "Payments & wallet": "Thanh toán & ví",
  Deposit: "Nạp tiền",
  Withdrawal: "Rút tiền",
  Withdraw: "Rút tiền",
  Transfer: "Chuyển tiền",
  "Transaction history": "Lịch sử giao dịch",
  Analytics: "Phân tích",
  "Market News": "Tin thị trường",
  Settings: "Cài đặt",
  Profile: "Hồ sơ",
  Security: "Bảo mật",
  "Support hub": "Trung tâm hỗ trợ",
  "Open account": "Mở tài khoản",
  "Fill in your account details to make your first deposit": "Hoàn tất thông tin tài khoản để nạp tiền lần đầu",
  "Complete profile, identity and address verification to unlock the full payment flow.": "Hoàn tất hồ sơ, xác minh danh tính và địa chỉ để mở toàn bộ luồng thanh toán.",
  "Learn more": "Tìm hiểu thêm",
  Complete: "Hoàn tất",
  Real: "Thực",
  Demo: "Demo",
  "Sort by": "Sắp xếp theo",
  Newest: "Mới nhất",
  Trade: "Giao dịch",
  "Account details": "Chi tiết tài khoản",
  "Account actions": "Thao tác tài khoản",
  "List view": "Chế độ danh sách",
  "Grid view": "Chế độ lưới",
  "Legal documents": "Tài liệu pháp lý",
  "Risk disclosure": "Công bố rủi ro",
  "Privacy agreement": "Thỏa thuận quyền riêng tư",
  "法律文件": "Tài liệu pháp lý",
  "风险披露": "Công bố rủi ro",
  "隐私协议": "Thỏa thuận quyền riêng tư",
  "账户操作": "Thao tác tài khoản",
  "列表视图": "Chế độ danh sách",
  "网格视图": "Chế độ lưới",
  "Available balance": "Số dư khả dụng",
  Notifications: "Thông báo",
  "Help Center": "Trung tâm trợ giúp",
  "Sign in": "Đăng nhập",
  Continue: "Tiếp tục",
  "Welcome to Exness": "Chào mừng đến với Exness",
  "Email address": "Địa chỉ email",
  Password: "Mật khẩu",
  "Forgot password": "Quên mật khẩu",
  "or sign in with": "hoặc đăng nhập bằng",
  "Support ticket opened.": "Đã tạo phiếu hỗ trợ.",
  "Signed in locally. No credentials were transmitted.": "Đã đăng nhập cục bộ. Không có thông tin đăng nhập nào được truyền đi.",
  Close: "Đóng",
  "Chat panel opened.": "Đã mở khung trò chuyện.",
  "How can we help you?": "Chúng tôi có thể giúp gì?",
  "Open a ticket": "Mở phiếu hỗ trợ",
  "Start chat": "Bắt đầu chat",
  "Search support topics": "Tìm chủ đề hỗ trợ",
  "Account verification": "Xác minh tài khoản",
  "Not verified": "Chưa xác minh",
  Verified: "Đã xác minh",
  Pending: "Đang chờ",
  Completed: "Hoàn tất",
  "Complete now": "Hoàn tất ngay",
  "Download CSV": "Tải CSV",
  "Download the Exness mobile app and trade while you're on the go": "Tải ứng dụng Exness và giao dịch mọi lúc",
  "Exness Assistant": "Trợ lý Exness",
  "Type a message": "Nhập tin nhắn",
  "Hello. How can we help you today?": "Xin chào. Hôm nay chúng tôi có thể giúp gì?",
  Chat: "Chat",
  Language: "Ngôn ngữ",
  Help: "Trợ giúp",
  Apps: "Ứng dụng",
  "Dismiss install prompt": "Đóng lời nhắc cài đặt",
  "Collapse sidebar": "Thu gọn thanh bên",
};

const id: Dictionary = {
  "My accounts": "Akun saya",
  Trading: "Trading",
  Performance: "Performa",
  "History of orders": "Riwayat order",
  "Payments & wallet": "Pembayaran & dompet",
  Deposit: "Deposit",
  Withdrawal: "Penarikan",
  Withdraw: "Tarik",
  Transfer: "Transfer",
  "Transaction history": "Riwayat transaksi",
  Analytics: "Analitik",
  "Market News": "Berita pasar",
  Settings: "Pengaturan",
  Profile: "Profil",
  Security: "Keamanan",
  "Support hub": "Pusat dukungan",
  "Open account": "Buka akun",
  "Fill in your account details to make your first deposit": "Lengkapi detail akun untuk melakukan deposit pertama",
  "Complete profile, identity and address verification to unlock the full payment flow.": "Lengkapi profil, identitas, dan verifikasi alamat untuk membuka seluruh alur pembayaran.",
  "Learn more": "Pelajari lebih lanjut",
  Complete: "Selesaikan",
  Real: "Riil",
  Demo: "Demo",
  "Sort by": "Urutkan",
  Newest: "Terbaru",
  Trade: "Trading",
  "Account details": "Detail akun",
  "Account actions": "Tindakan akun",
  "List view": "Tampilan daftar",
  "Grid view": "Tampilan grid",
  "Legal documents": "Dokumen hukum",
  "Risk disclosure": "Pengungkapan risiko",
  "Privacy agreement": "Perjanjian privasi",
  "法律文件": "Dokumen hukum",
  "风险披露": "Pengungkapan risiko",
  "隐私协议": "Perjanjian privasi",
  "账户操作": "Tindakan akun",
  "列表视图": "Tampilan daftar",
  "网格视图": "Tampilan grid",
  "Available balance": "Saldo tersedia",
  Notifications: "Notifikasi",
  "Help Center": "Pusat bantuan",
  "Sign in": "Masuk",
  Continue: "Lanjutkan",
  "Welcome to Exness": "Selamat datang di Exness",
  "Email address": "Alamat email",
  Password: "Kata sandi",
  "Forgot password": "Lupa kata sandi",
  "or sign in with": "atau masuk dengan",
  "Support ticket opened.": "Tiket dukungan dibuat.",
  "Signed in locally. No credentials were transmitted.": "Masuk secara lokal. Tidak ada kredensial yang dikirim.",
  Close: "Tutup",
  "Chat panel opened.": "Panel chat dibuka.",
  "How can we help you?": "Apa yang bisa kami bantu?",
  "Open a ticket": "Buka tiket",
  "Start chat": "Mulai chat",
  "Search support topics": "Cari topik dukungan",
  "Account verification": "Verifikasi akun",
  "Not verified": "Belum diverifikasi",
  Verified: "Terverifikasi",
  Pending: "Tertunda",
  Completed: "Selesai",
  "Complete now": "Selesaikan sekarang",
  "Download CSV": "Unduh CSV",
  "Download the Exness mobile app and trade while you're on the go": "Unduh aplikasi Exness dan trading di mana saja",
  "Exness Assistant": "Asisten Exness",
  "Type a message": "Ketik pesan",
  "Hello. How can we help you today?": "Halo. Apa yang bisa kami bantu hari ini?",
  Chat: "Chat",
  Language: "Bahasa",
  Help: "Bantuan",
  Apps: "Aplikasi",
  "Dismiss install prompt": "Tutup prompt instalasi",
  "Collapse sidebar": "Ciutkan sidebar",
};

const es: Dictionary = {
  "My accounts": "Mis cuentas",
  Trading: "Operaciones",
  Performance: "Rendimiento",
  "History of orders": "Historial de órdenes",
  "Payments & wallet": "Pagos y billetera",
  Deposit: "Depósito",
  Withdrawal: "Retiro",
  Withdraw: "Retirar",
  Transfer: "Transferir",
  "Transaction history": "Historial de transacciones",
  Analytics: "Análisis",
  "Market News": "Noticias del mercado",
  Settings: "Configuración",
  Profile: "Perfil",
  Security: "Seguridad",
  "Support hub": "Centro de soporte",
  "Open account": "Abrir cuenta",
  "Fill in your account details to make your first deposit": "Complete los datos de su cuenta para hacer su primer depósito",
  "Complete profile, identity and address verification to unlock the full payment flow.": "Complete el perfil y la verificación de identidad y dirección para desbloquear todos los pagos.",
  "Learn more": "Más información",
  Complete: "Completar",
  Real: "Real",
  Demo: "Demo",
  "Sort by": "Ordenar por",
  Newest: "Más reciente",
  Trade: "Operar",
  "Account details": "Detalles de la cuenta",
  "Account actions": "Acciones de la cuenta",
  "List view": "Vista de lista",
  "Grid view": "Vista de cuadrícula",
  "Legal documents": "Documentos legales",
  "Risk disclosure": "Divulgación de riesgos",
  "Privacy agreement": "Acuerdo de privacidad",
  "法律文件": "Documentos legales",
  "风险披露": "Divulgación de riesgos",
  "隐私协议": "Acuerdo de privacidad",
  "账户操作": "Acciones de la cuenta",
  "列表视图": "Vista de lista",
  "网格视图": "Vista de cuadrícula",
  "Available balance": "Saldo disponible",
  Notifications: "Notificaciones",
  "Help Center": "Centro de ayuda",
  "Sign in": "Iniciar sesión",
  Continue: "Continuar",
  "Welcome to Exness": "Bienvenido a Exness",
  "Email address": "Correo electrónico",
  Password: "Contraseña",
  "Forgot password": "Olvidé mi contraseña",
  "or sign in with": "o inicie sesión con",
  "Support ticket opened.": "Ticket de soporte creado.",
  "Signed in locally. No credentials were transmitted.": "Sesión iniciada localmente. No se transmitieron credenciales.",
  Close: "Cerrar",
  "Chat panel opened.": "Panel de chat abierto.",
  "How can we help you?": "¿Cómo podemos ayudarle?",
  "Open a ticket": "Abrir ticket",
  "Start chat": "Iniciar chat",
  "Search support topics": "Buscar temas de soporte",
  "Account verification": "Verificación de cuenta",
  "Not verified": "No verificado",
  Verified: "Verificado",
  Pending: "Pendiente",
  Completed: "Completado",
  "Complete now": "Completar ahora",
  "Download CSV": "Descargar CSV",
  "Download the Exness mobile app and trade while you're on the go": "Descargue la app de Exness y opere donde quiera",
  "Exness Assistant": "Asistente de Exness",
  "Type a message": "Escriba un mensaje",
  "Hello. How can we help you today?": "Hola. ¿Cómo podemos ayudarle hoy?",
  Chat: "Chat",
  Language: "Idioma",
  Help: "Ayuda",
  Apps: "Aplicaciones",
  "Dismiss install prompt": "Descartar aviso de instalación",
  "Collapse sidebar": "Contraer barra lateral",
};

const dictionaries: Record<Language, Dictionary> = {
  English: english,
  "简体中文": zh,
  "Tiếng Việt": vi,
  "Bahasa Indonesia": id,
  Español: es,
};

const reverseEntries = Object.values(dictionaries).flatMap((dictionary) => Object.entries(dictionary));

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function preserveWhitespace(original: string, translated: string) {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function translateDynamic(text: string, language: Language): string | null {
  const langName = language;
  const messages: Record<Language, Record<string, string>> = {
    English: {
      language: `Language set to ${langName}.`,
      accountReady: "Trading account created.",
      amountRecorded: "The amount has been recorded locally.",
      verificationDone: "Verification step completed locally.",
    },
    "简体中文": {
      language: `语言已切换为 ${langName}。`,
      accountReady: "交易账户已创建。",
      amountRecorded: "金额已记录到本地。",
      verificationDone: "验证步骤已在本地完成。",
    },
    "Tiếng Việt": {
      language: `Ngôn ngữ đã đổi sang ${langName}.`,
      accountReady: "Tài khoản giao dịch đã được tạo.",
      amountRecorded: "Số tiền đã được ghi nhận cục bộ.",
      verificationDone: "Bước xác minh đã hoàn tất cục bộ.",
    },
    "Bahasa Indonesia": {
      language: `Bahasa diubah ke ${langName}.`,
      accountReady: "Akun trading telah dibuat.",
      amountRecorded: "Jumlah telah dicatat secara lokal.",
      verificationDone: "Langkah verifikasi selesai secara lokal.",
    },
    Español: {
      language: `Idioma cambiado a ${langName}.`,
      accountReady: "Cuenta de trading creada.",
      amountRecorded: "El importe se registró localmente.",
      verificationDone: "Paso de verificación completado localmente.",
    },
  };

  if (/^Language set to .+\.$/.test(text)) return messages[language].language;
  if (/^MT5 .+ #\d+ is ready\.$/.test(text)) return messages[language].accountReady;
  if (/^\d+(?:\.\d{2})? [A-Z]{3,4} has been recorded locally\.$/.test(text)) return messages[language].amountRecorded;
  if (/^.+ completed locally\.$/.test(text) && text.includes("profile")) return messages[language].verificationDone;
  return null;
}

export const languageStorageKey = "exness-pa-language";

export function coerceLanguage(language: string): Language {
  return languageOptions.includes(language as Language) ? (language as Language) : "English";
}

export function readStoredLanguage(): Language {
  try {
    return coerceLanguage(localStorage.getItem(languageStorageKey) ?? "");
  } catch {
    return "English";
  }
}

export function writeStoredLanguage(language: string) {
  try {
    localStorage.setItem(languageStorageKey, coerceLanguage(language));
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function translateText(value: string, languageValue: string): string {
  const language = coerceLanguage(languageValue);
  const normalized = normalizeText(value);
  if (!normalized || normalized === "exness") return value;

  const direct = dictionaries[language][normalized];
  if (direct) return preserveWhitespace(value, direct);

  const dynamic = translateDynamic(normalized, language);
  if (dynamic) return preserveWhitespace(value, dynamic);

  for (const [source, translated] of reverseEntries) {
    if (normalizeText(translated) === normalized) {
      const next = language === "English" ? english[source] || source : dictionaries[language][source] || source;
      if (next) return preserveWhitespace(value, next);
    }
  }

  if (language === "English") return value;

  return value;
}

export function localizeTree(root: ParentNode, languageValue: string) {
  const translateNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      node.textContent = translateText(node.textContent, languageValue);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as HTMLElement;
    if (["SCRIPT", "STYLE", "CODE", "PRE", "SVG", "PATH"].includes(element.tagName)) return;
    if (element.closest("[data-no-i18n]")) return;

    for (const attr of ["aria-label", "placeholder", "title"]) {
      const current = element.getAttribute(attr);
      if (current) element.setAttribute(attr, translateText(current, languageValue));
    }
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  translateNode(root as unknown as Node);
  let current = walker.nextNode();
  while (current) {
    translateNode(current);
    current = walker.nextNode();
  }
}
