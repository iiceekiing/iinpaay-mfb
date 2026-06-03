import type { LangCode } from '../types';

export const LANG_OPTIONS = [
  { code: 'en' as LangCode, label: 'English', flag: '🇬🇧', native: 'English' },
  { code: 'ha' as LangCode, label: 'Hausa',   flag: '🇳🇬', native: 'Hausa'   },
  { code: 'yo' as LangCode, label: 'Yoruba',  flag: '🇳🇬', native: 'Yorùbá'  },
  { code: 'ig' as LangCode, label: 'Igbo',    flag: '🇳🇬', native: 'Igbo'    },
];

// Speech synthesis language codes
export const LANG_VOICE_CODE: Record<LangCode, string> = {
  en: 'en-NG',
  ha: 'ha-NG',
  yo: 'yo-NG',
  ig: 'ig-NG',
};

export type LangStrings = {
  // Amira greetings
  welcome: string;
  welcome_sub: string;
  tap_mic: string;

  // Language selection
  choose_lang: string;
  lang_label: string;

  // Account check
  have_account: string;
  say_yes_no: string;

  // Registration
  reg_name: string;
  reg_name_prompt: string;
  reg_day: string;
  reg_day_prompt: string;
  reg_month: string;
  reg_month_prompt: string;
  reg_year: string;
  reg_year_prompt: string;
  reg_gender: string;
  reg_gender_prompt: string;
  reg_phone: string;
  reg_phone_prompt: string;
  reg_pin: string;
  reg_pin_prompt: string;
  reg_pin_security: string;
  reg_confirm: (name: string) => string;
  reg_success: (name: string) => string;

  // Login
  login_phone: string;
  login_phone_prompt: string;
  login_pin: string;
  login_pin_prompt: string;
  login_welcome_back: (name: string) => string;
  login_wrong_pin: string;
  login_not_found: string;

  // Dashboard
  dash_greeting: (name: string) => string;
  dash_guide: string;
  dash_add_guide: string;
  dash_send_guide: string;
  dash_balance: string;
  dash_available: string;

  // Add Money
  add_how_much: string;
  add_account_details: string;
  add_success: (amount: string) => string;

  // Send Money
  send_to_account: string;
  send_confirm_account: (number: string) => string;
  send_how_much: string;
  send_pin_prompt: string;
  send_type_select: string;
  send_success: (amount: string, name: string) => string;
  send_protected_info: string;
  send_insufficient: string;

  // Pay Upfront (projects)
  payupfront_title: string;
  payupfront_new: string;
  payupfront_proj_title: string;
  payupfront_proj_title_prompt: string;
  payupfront_proj_desc: string;
  payupfront_total_amount: string;
  payupfront_upfront_amount: string;
  payupfront_deadline: string;
  payupfront_recipient: string;
  payupfront_recipient_prompt: string;
  payupfront_success: string;
  payupfront_release: string;
  payupfront_released: string;
  payupfront_refunded: string;
  payupfront_deadline_reminder: string;
  payupfront_complaint_hint: string;

  // Complaint
  complaint_title: string;
  complaint_desc_label: string;
  complaint_desc_prompt: string;
  complaint_upload_label: string;
  complaint_submit: string;
  complaint_submitted: string;
  complaint_already: string;

  // Voice Guide
  vguide_label: string;
  vguide_on: string;
  vguide_off: string;

  // General
  confirm: string;
  cancel: string;
  next: string;
  back: string;
  done: string;
  or_type: string;
  listening: string;
  processing: string;
  not_understood: string;
  retry_prompt: string;
  yes: string;
  no: string;
  male: string;
  female: string;
  pin_security: string;
};

const en: LangStrings = {
  welcome: 'Welcome to INPAAY.',
  welcome_sub: 'I am Amira, your voice assistant.',
  tap_mic: 'Tap the microphone to begin, or use the buttons below.',

  choose_lang: 'Which language would you like to use?',
  lang_label: 'Language',

  have_account: 'Do you already have an INPAAY account?',
  say_yes_no: 'Say "Yes" or "No", or tap a button.',

  reg_name: 'Full Name',
  reg_name_prompt: 'Please tell me your full name.',
  reg_day: 'Day of Birth',
  reg_day_prompt: 'Which day were you born? Say a number from 1 to 31.',
  reg_month: 'Month of Birth',
  reg_month_prompt: 'Which month were you born? Say the month name or number.',
  reg_year: 'Year of Birth',
  reg_year_prompt: 'Which year were you born? For example, nineteen ninety.',
  reg_gender: 'Gender',
  reg_gender_prompt: 'Are you male or female?',
  reg_phone: 'Phone Number',
  reg_phone_prompt: 'Please tell me your phone number.',
  reg_pin: 'Transfer PIN',
  reg_pin_prompt: 'Choose a 6-digit transfer PIN.',
  reg_pin_security: 'For your security, please type your PIN. Never say your PIN out loud.',
  reg_confirm: (name) => `Thank you, ${name}. Let me confirm your details.`,
  reg_success: (name) => `Welcome to INPAAY, ${name}! Your account is ready.`,

  login_phone: 'Phone Number',
  login_phone_prompt: 'Please tell me your phone number.',
  login_pin: 'Transfer PIN',
  login_pin_prompt: 'Please enter your 6-digit PIN.',
  login_welcome_back: (name) => `Welcome back, ${name}! You are now logged in.`,
  login_wrong_pin: 'Incorrect PIN. Please try again.',
  login_not_found: 'No account found with that phone number.',

  dash_greeting: (name) => `Welcome back, ${name}.`,
  dash_guide: 'What would you like to do? You can add money, send money, or pay upfront.',
  dash_add_guide: 'To add money to your account, tap the green Add Money button.',
  dash_send_guide: 'To send money, tap the Send Money button.',
  dash_balance: 'Available Balance',
  dash_available: 'Available',

  add_how_much: 'How much would you like to add to your account?',
  add_account_details: 'Here are your account details. You can use these to receive a transfer.',
  add_success: (amount) => `Your account has been credited with ${amount}. Your balance has been updated.`,

  send_to_account: 'Which account number would you like to send money to?',
  send_confirm_account: (number) => `I found account number ${number.split('').join(', ')}. Is that correct?`,
  send_how_much: 'How much would you like to send?',
  send_pin_prompt: 'For your security, please type your PIN to confirm this transfer.',
  send_type_select: 'Would you like to send immediately, or use Protected Payment?',
  send_success: (amount, name) => `You have successfully sent ${amount} to ${name}.`,
  send_protected_info: 'Protected Payment holds the money safely. The recipient gets paid only when you confirm the work is done.',
  send_insufficient: 'You do not have enough balance for this transfer.',

  payupfront_title: 'Pay Upfront',
  payupfront_new: 'New Pay Upfront',
  payupfront_proj_title: 'Project Title',
  payupfront_proj_title_prompt: 'What is the name or title of this project?',
  payupfront_proj_desc: 'Description (optional)',
  payupfront_total_amount: 'Total Project Amount (₦)',
  payupfront_upfront_amount: 'Upfront Amount (₦)',
  payupfront_deadline: 'Project Deadline',
  payupfront_recipient: 'Pay To (Beneficiary)',
  payupfront_recipient_prompt: 'Who are you paying? Enter their name, phone, or account number.',
  payupfront_success: 'Upfront payment sent successfully. Funds are held securely until you release them.',
  payupfront_release: 'Release Payment',
  payupfront_released: 'Payment Released',
  payupfront_refunded: 'Refunded',
  payupfront_deadline_reminder: 'Deadline is today! Please finish the project and ask the project owner to release your payment. If not released in 24 hours, the funds will be refunded.',
  payupfront_complaint_hint: 'Work completed but payment not released? Log a complaint below.',

  complaint_title: 'Log a Complaint',
  complaint_desc_label: 'Describe the work you completed',
  complaint_desc_prompt: 'Provide a clear description of the work done.',
  complaint_upload_label: 'Upload Proof (image or video)',
  complaint_submit: 'Submit Complaint',
  complaint_submitted: 'Complaint submitted successfully. Our team will review your case.',
  complaint_already: 'You have already submitted a complaint for this payment.',

  vguide_label: 'Voice Guide',
  vguide_on: 'Voice Guide is ON. I will narrate the screen for you.',
  vguide_off: 'Voice Guide is OFF.',

  confirm: 'Confirm',
  cancel: 'Cancel',
  next: 'Next',
  back: 'Back',
  done: 'Done',
  or_type: 'Or type here',
  listening: 'Listening…',
  processing: 'Processing…',
  not_understood: 'I did not quite catch that. Please try again.',
  retry_prompt: 'I did not hear a response.',
  yes: 'Yes',
  no: 'No',
  male: 'Male',
  female: 'Female',
  pin_security: 'For your security, please type your PIN. Never say your PIN out loud.',
};

const ha: LangStrings = {
  welcome: 'Barka da zuwa INPAAY.',
  welcome_sub: 'Ni ne Amira, mataimakiyarku ta muryar.',
  tap_mic: 'Taɓa makirofon don fara, ko yi amfani da maɓalli.',

  choose_lang: 'Wane harshe kake son amfani da shi?',
  lang_label: 'Harshe',

  have_account: 'Shin kana da asusun INPAAY?',
  say_yes_no: 'Ce "Eh" ko "A\'a", ko taɓa maɓalli.',

  reg_name: 'Cikakken Suna',
  reg_name_prompt: 'Don Allah ka faɗa mini sunanka cikakke.',
  reg_day: 'Rana ta Haihuwa',
  reg_day_prompt: 'Wane rana aka haife ka? Ce lamba daga 1 zuwa 31.',
  reg_month: 'Wata na Haihuwa',
  reg_month_prompt: 'Wane wata aka haife ka? Ce sunan watan ko lambarsa.',
  reg_year: 'Shekara ta Haihuwa',
  reg_year_prompt: 'Wane shekara aka haife ka? Misali, dubu daya da dari tara da tamanin.',
  reg_gender: 'Jinsi',
  reg_gender_prompt: 'Namiji ne ko mace?',
  reg_phone: 'Lambar Waya',
  reg_phone_prompt: 'Don Allah ka faɗa mini lambar wayarka.',
  reg_pin: 'PIN na Canja Kuɗi',
  reg_pin_prompt: 'Zaɓi PIN na lambobi shida.',
  reg_pin_security: 'Don amincin ka, don Allah rubuta PIN. Kada ka faɗa PIN a bayyane.',
  reg_confirm: (name) => `Na gode, ${name}. Bari mu tabbatar da bayananku.`,
  reg_success: (name) => `Barka da zuwa INPAAY, ${name}! Asusunka ya shirya.`,

  login_phone: 'Lambar Waya',
  login_phone_prompt: 'Don Allah ka faɗa mini lambar wayarka.',
  login_pin: 'PIN na Canja Kuɗi',
  login_pin_prompt: 'Don Allah shigar da PIN ɗin ka na lambobi shida.',
  login_welcome_back: (name) => `Barka da dawowar, ${name}! Ka shiga yanzu.`,
  login_wrong_pin: 'PIN ba daidai ba. Don Allah gwada kuma.',
  login_not_found: 'Ba a samu asusun da wannan lambar waya ba.',

  dash_greeting: (name) => `Barka da dawowar, ${name}.`,
  dash_guide: 'Me kake son yi? Zaka iya ƙara kuɗi, aika kuɗi, ko biya kuɗin gaba.',
  dash_add_guide: 'Don ƙara kuɗi, taɓa maɓallin kore "Ƙara Kuɗi".',
  dash_send_guide: 'Don aika kuɗi, taɓa maɓallin "Aika Kuɗi".',
  dash_balance: 'Kuɗin da Ake da shi',
  dash_available: 'Akwai',

  add_how_much: 'Nawa kake son ƙara zuwa asusunka?',
  add_account_details: 'Ga bayanan asusunka. Zaka iya amfani da su don karɓar canja.',
  add_success: (amount) => `An ƙara ${amount} zuwa asusunka. An sabunta ma\'aunin ku.`,

  send_to_account: 'Wane lambar asusun kake son aika kuɗi zuwa?',
  send_confirm_account: (number) => `Na samu lambar asusun ${number}. Shin daidai ne?`,
  send_how_much: 'Nawa kake son aika?',
  send_pin_prompt: 'Don amincin ka, rubuta PIN ɗinka don tabbatar da wannan canja.',
  send_type_select: 'Kana son aika nan take ko amfani da Biya Mai Tsaro?',
  send_success: (amount, name) => `Ka aika ${amount} zuwa ${name} cikin nasara.`,
  send_protected_info: 'Biya Mai Tsaro yana riƙe kuɗin lafiya. Mai karɓa zai samu kuɗi ne kawai lokacin da ka tabbatar aikin ya kammalu.',
  send_insufficient: 'Ba ka da isasshen kuɗi don wannan canja.',

  payupfront_title: 'Biya Kuɗin Gaba',
  payupfront_new: 'Sabon Biyar Gaba',
  payupfront_proj_title: 'Sunan Aiki',
  payupfront_proj_title_prompt: 'Menene sunan wannan aikin?',
  payupfront_proj_desc: 'Bayani (zaɓi ne)',
  payupfront_total_amount: 'Jimlar Kuɗin Aiki (₦)',
  payupfront_upfront_amount: 'Adadin da za a Biya Yanzu (₦)',
  payupfront_deadline: 'Ƙarshen Lokaci',
  payupfront_recipient: 'Biya Wa (Mai Karɓa)',
  payupfront_recipient_prompt: 'Wa kake son biya? Shigar da sunansa, wayarsa, ko lambar asusunsa.',
  payupfront_success: 'An aika kuɗin gaba cikin nasara. An riƙe kuɗin lafiya har sai ka sake shi.',
  payupfront_release: 'Sakin Kuɗi',
  payupfront_released: 'An Sake Kuɗin',
  payupfront_refunded: 'An Mayar da Kuɗi',
  payupfront_deadline_reminder: 'Yau shi ne ƙarshen lokaci! Don Allah ka kammala aikin ka nemi mai aikin ya sake kuɗinka. Idan ba a saki ba cikin awanni 24, za a mayar da kuɗin.',
  payupfront_complaint_hint: 'Ka kammala aiki amma ba a sake kuɗinka ba? Shigar da korafi a ƙasa.',

  complaint_title: 'Shigar da Korafi',
  complaint_desc_label: 'Bayyana aikin da ka kammala',
  complaint_desc_prompt: 'Bayar da cikakken bayanin aikin da aka yi.',
  complaint_upload_label: 'Loda Hujja (hoto ko bidiyo)',
  complaint_submit: 'Aika Korafi',
  complaint_submitted: 'An aika korafi cikin nasara. Tawagarmu za ta duba korafin ku.',
  complaint_already: 'Ka riga ka aika korafi game da wannan biyar.',

  vguide_label: 'Jagoran Muryar',
  vguide_on: 'Jagoran Muryar yana aiki. Zan yi bayanin allon dominka.',
  vguide_off: 'Jagoran Muryar ya kashe.',

  confirm: 'Tabbatar',
  cancel: 'Soke',
  next: 'Gaba',
  back: 'Baya',
  done: 'Kammala',
  or_type: 'Ko rubuta a nan',
  listening: 'Ina sauraro…',
  processing: 'Ana sarrafa…',
  not_understood: 'Ban ji daidai ba. Don Allah sake gwadawa.',
  retry_prompt: 'Ban ji amsa ba.',
  yes: 'Eh',
  no: "A'a",
  male: 'Namiji',
  female: 'Mace',
  pin_security: 'Don amincin ka, rubuta PIN. Kada ka faɗa PIN a bayyane.',
};

const yo: LangStrings = {
  welcome: 'Ẹ káàbọ̀ sí INPAAY.',
  welcome_sub: 'Èmi ni Amira, olùrànlọ́wọ́ ohùn rẹ.',
  tap_mic: 'Tẹ maikirofonu láti bẹ̀rẹ̀, tàbí lo àwọn bọ́tìnnì.',

  choose_lang: 'Èdè wo ni o fẹ́ lò?',
  lang_label: 'Èdè',

  have_account: 'Ṣé o ti ní àkọọ́lẹ̀ INPAAY?',
  say_yes_no: 'Sọ "Bẹ́ẹ̀ ni" tàbí "Bẹ́ẹ̀ kọ", tàbí tẹ bọ́tìnnì.',

  reg_name: 'Orúkọ Kíkún',
  reg_name_prompt: 'Jọ̀wọ́ sọ orúkọ rẹ kíkún fún mi.',
  reg_day: 'Ọjọ́ Ìbí',
  reg_day_prompt: 'Ọjọ́ wo ni a bí ọ? Sọ nọ́mbà kan láti 1 sí 31.',
  reg_month: 'Oṣù Ìbí',
  reg_month_prompt: 'Oṣù wo ni a bí ọ? Sọ orúkọ oṣù tàbí nọ́mbà rẹ.',
  reg_year: 'Ọdún Ìbí',
  reg_year_prompt: 'Ọdún wo ni a bí ọ? Fún àpẹẹrẹ, ẹgbẹ̀rún ọgbọ̀.',
  reg_gender: 'Ìdásílẹ̀',
  reg_gender_prompt: 'Ṣé akùnlẹ̀bọ tàbí obìnrin ni o?',
  reg_phone: 'Nọ́mbà Fóònù',
  reg_phone_prompt: 'Jọ̀wọ́ sọ nọ́mbà fóònù rẹ fún mi.',
  reg_pin: 'PIN Gbígbé Owó',
  reg_pin_prompt: 'Yan PIN nọ́mbà mẹ́fà.',
  reg_pin_security: 'Fún ààbò rẹ, jọ̀wọ́ tẹ PIN rẹ. Má sọ PIN rẹ lóhùn.',
  reg_confirm: (name) => `E dúpẹ́, ${name}. Jẹ́ ká fi ìdánimọ̀ rẹ hàn.`,
  reg_success: (name) => `Ẹ káàbọ̀ sí INPAAY, ${name}! Àkọọ́lẹ̀ rẹ ti ṣetán.`,

  login_phone: 'Nọ́mbà Fóònù',
  login_phone_prompt: 'Jọ̀wọ́ sọ nọ́mbà fóònù rẹ.',
  login_pin: 'PIN Gbígbé Owó',
  login_pin_prompt: 'Jọ̀wọ́ tẹ PIN nọ́mbà mẹ́fà rẹ.',
  login_welcome_back: (name) => `Ẹ káàbọ̀ padà, ${name}! O ti wọlé báyìí.`,
  login_wrong_pin: 'PIN kò tọ́. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kansí.',
  login_not_found: 'A kò rí àkọọ́lẹ̀ pẹ̀lú nọ́mbà fóònù yẹn.',

  dash_greeting: (name) => `Ẹ káàbọ̀ padà, ${name}.`,
  dash_guide: 'Kí ni o fẹ́ ṣe? O lè fi owó kún, rán owó, tàbí san owó ní ìwájú.',
  dash_add_guide: 'Láti fi owó kún àkọọ́lẹ̀ rẹ, tẹ bọ́tìnnì alawọ̀ ewe "Fi Owó Kún".',
  dash_send_guide: 'Láti rán owó, tẹ bọ́tìnnì "Rán Owó".',
  dash_balance: 'Owó Tó Wà',
  dash_available: 'Wà',

  add_how_much: 'Iye owo melo ni o fẹ́ fikún?',
  add_account_details: 'Ìwọ̀nba àkọọ́lẹ̀ rẹ wà níhìn. O lè lo wọn láti gbà ìdókòwò.',
  add_success: (amount) => `Wọ́n ti fikún ${amount} sí àkọọ́lẹ̀ rẹ. Àwọn ìpele rẹ ti jẹ́ mímúdójúìwọ̀n.`,

  send_to_account: 'Iye nọ́mbà àkọọ́lẹ̀ wo ni o fẹ́ rán owó sí?',
  send_confirm_account: (number) => `Mo rí nọ́mbà àkọọ́lẹ̀ ${number}. Ṣé ó dára?`,
  send_how_much: 'Iye owo melo ni o fẹ́ rán?',
  send_pin_prompt: 'Fún ààbò rẹ, tẹ PIN rẹ láti jẹ́rìísí ìdókòwò yii.',
  send_type_select: 'Ṣé o fẹ́ ránṣẹ́ lẹ́ẹ̀kansí, tàbí lo Ìsanwó Tó Ní Ààbò?',
  send_success: (amount, name) => `O ti rán ${amount} sí ${name} pẹ̀lú àṣeyọrí.`,
  send_protected_info: 'Ìsanwó Tó Ní Ààbò ń ṣọ owó lái sí ewu. Olùgbà máa gba owó nìkan nígbà tí o bá fẹ́rìísí pé iṣẹ́ náà ti parí.',
  send_insufficient: 'O kò ní owó tó fún ìdókòwò yii.',

  payupfront_title: 'San Owó Ní Ìwájú',
  payupfront_new: 'Ìsanwó Ní Ìwájú Tuntun',
  payupfront_proj_title: 'Orúkọ Iṣẹ́',
  payupfront_proj_title_prompt: 'Kí ni orúkọ iṣẹ́ yii?',
  payupfront_proj_desc: 'Àpèjúwe (àṣàyàn)',
  payupfront_total_amount: 'Iye Owó Iṣẹ́ Lapapọ (₦)',
  payupfront_upfront_amount: 'Iye Owó Tí Yóò San Ní Ìwájú (₦)',
  payupfront_deadline: 'Ọjọ́ Àpéjọpọ',
  payupfront_recipient: 'San Fún (Olùgbà)',
  payupfront_recipient_prompt: 'Ta ni o fẹ́ san? Tẹ orúkọ rẹ, fóònù, tàbí nọ́mbà àkọọ́lẹ̀.',
  payupfront_success: 'Ìsanwó ní ìwájú ti rán pẹ̀lú àṣeyọrí. A ń ṣọ owó lái sí ewu títí o fi dá a sílẹ̀.',
  payupfront_release: 'Dá Owó Sílẹ̀',
  payupfront_released: 'Wọ́n Dá Owó Sílẹ̀',
  payupfront_refunded: 'Wọ́n Dá Owó Padà',
  payupfront_deadline_reminder: 'Ọjọ́ yii ni àkókò tó kẹ́yìn! Jọ̀wọ́ parí iṣẹ́ náà kí o sì béèrè lọ́wọ́ ẹni tó ní iṣẹ́ láti dá owó rẹ sílẹ̀.',
  payupfront_complaint_hint: 'O parí iṣẹ́ ṣùgbọ́n wọn kò dá owó rẹ sílẹ̀? Ṣe àròkọ ẹ̀sùn ní ísàlẹ̀.',

  complaint_title: 'Ṣe Àròkọ Ẹ̀sùn',
  complaint_desc_label: 'Ṣàpèjúwe iṣẹ́ tí o parí',
  complaint_desc_prompt: 'Fún àpèjúwe tó ṣe kedere nípa iṣẹ́ tí a ṣe.',
  complaint_upload_label: 'Gbé Ẹrí Sí Ẹ̀rọ (àwòrán tàbí fídíò)',
  complaint_submit: 'Fi Àròkọ Ẹ̀sùn Sílẹ̀',
  complaint_submitted: 'Àròkọ ẹ̀sùn ti fi sílẹ̀ pẹ̀lú àṣeyọrí. Ẹgbẹ́ wa máa ṣàtúnyẹ̀wò ọ̀ràn rẹ.',
  complaint_already: 'O ti fi àròkọ ẹ̀sùn sílẹ̀ tẹ́lẹ̀ fún ìsanwó yii.',

  vguide_label: 'Ìtọ́sọ́nà Ohùn',
  vguide_on: 'Ìtọ́sọ́nà Ohùn wà ní iṣẹ́. Màá ṣàlàyé ojú-àwòrán fún ọ.',
  vguide_off: 'Ìtọ́sọ́nà Ohùn ti pa.',

  confirm: 'Jẹ́rìísí',
  cancel: 'Fagilé',
  next: 'Tẹ̀síwájú',
  back: 'Padà',
  done: 'Parí',
  or_type: 'Tàbí tẹ níhìn',
  listening: 'Ń gbọ́…',
  processing: 'Ń ṣe àgbékalẹ̀…',
  not_understood: 'Mi ò gbọ́ dédé. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kansí.',
  retry_prompt: 'Mi ò gbọ́ ìdáhùn.',
  yes: 'Bẹ́ẹ̀ ni',
  no: 'Bẹ́ẹ̀ kọ',
  male: 'Akùnlẹ̀bọ',
  female: 'Obìnrin',
  pin_security: 'Fún ààbò rẹ, tẹ PIN rẹ. Má sọ PIN rẹ lóhùn.',
};

const ig: LangStrings = {
  welcome: 'Nnọọ na INPAAY.',
  welcome_sub: 'Abụ m Amira, onye enyemaka olu gị.',
  tap_mic: 'Kpọọ maikirofonu iji malite, ma ọ bụ jiri bọtụm.',

  choose_lang: 'Asụsụ ole ka ị chọọ iji?',
  lang_label: 'Asụsụ',

  have_account: 'Ị nwere akaụntụ INPAAY?',
  say_yes_no: 'Sị "Ee" ma ọ bụ "Mba", ma ọ bụ kpọọ bọtụm.',

  reg_name: 'Aha Nke Ọha',
  reg_name_prompt: 'Biko gwa m aha gị nke ọha.',
  reg_day: 'Ụbọchị Ọmụmụ',
  reg_day_prompt: 'Ọ bụ ụbọchị ole ka a mụtara gị? Sị nọmba sitere na 1 ruo 31.',
  reg_month: 'Ọnwa Ọmụmụ',
  reg_month_prompt: 'Ọ bụ ọnwa ole ka a mụtara gị? Sị aha ọnwa ma ọ bụ nọmba ya.',
  reg_year: 'Afọ Ọmụmụ',
  reg_year_prompt: 'Ọ bụ afọ ole ka a mụtara gị? Dịka ọmụmaatụ, otu puku na narị itoolu.',
  reg_gender: 'Okike',
  reg_gender_prompt: 'Ị bụ nwoke ma ọ bụ nwanyị?',
  reg_phone: 'Nọmba Ekwentị',
  reg_phone_prompt: 'Biko gwa m nọmba ekwentị gị.',
  reg_pin: 'PIN Mbufọ Ego',
  reg_pin_prompt: 'Họọ PIN nọmba isii.',
  reg_pin_security: 'Maka nchekwa gị, biko pịa PIN gị. Asụghị PIN gị n\'olu.',
  reg_confirm: (name) => `Daalụ, ${name}. Ka anyị nwetuo nkwenye nke ihe gị.`,
  reg_success: (name) => `Nnọọ na INPAAY, ${name}! Akaụntụ gị dị njikere.`,

  login_phone: 'Nọmba Ekwentị',
  login_phone_prompt: 'Biko gwa m nọmba ekwentị gị.',
  login_pin: 'PIN Mbufọ Ego',
  login_pin_prompt: 'Biko tinye PIN nọmba isii gị.',
  login_welcome_back: (name) => `Nnọọ nọ ọzọ, ${name}! Ị banye ugbu a.`,
  login_wrong_pin: 'PIN ezighị ezi. Biko nwaa ọzọ.',
  login_not_found: 'Achọtaghị akaụntụ na nọmba ekwentị ahụ.',

  dash_greeting: (name) => `Nnọọ nọ ọzọ, ${name}.`,
  dash_guide: 'Gịnị ka ị chọọ ime? Ị nwere ike itinye ego, zipu ego, ma ọ bụ kwuo ụgwọ n\'ihu.',
  dash_add_guide: 'Iji tinye ego n\'akaụntụ gị, kpọọ bọtụm ọcha "Tinye Ego".',
  dash_send_guide: 'Iji zipu ego, kpọọ bọtụm "Zipu Ego".',
  dash_balance: 'Ego Dị Nọ',
  dash_available: 'Dị',

  add_how_much: 'Ego ole ka ị chọọ itinye n\'akaụntụ gị?',
  add_account_details: 'Nke a bụ nkọwa akaụntụ gị. Ị nwere ike iji ha nabata ndụta.',
  add_success: (amount) => `Akaụntụ gị enwetara ${amount}. Ehizie ikike gị.`,

  send_to_account: 'Nọmba akaụntụ ole ka ị chọọ izipu ego?',
  send_confirm_account: (number) => `Achọtara m nọmba akaụntụ ${number}. Ọ dị mma?`,
  send_how_much: 'Ego ole ka ị chọọ izipu?',
  send_pin_prompt: 'Maka nchekwa gị, pịa PIN gị iji kwenye mbufọ a.',
  send_type_select: 'Ị chọọ izipu ozugbo, ma ọ bụ jiri Ụgwọ Nchebe?',
  send_success: (amount, name) => `Isipu ${amount} gaa ${name} nke ọma.`,
  send_protected_info: 'Ụgwọ Nchebe na-echebe ego nke ọma. Onye ọ bụla na-ata ụgwọ naanị mgbe ị kwenyere na ọrụ ahụ mechara.',
  send_insufficient: 'Ego gị ezughi okè maka mbufọ a.',

  payupfront_title: 'Kwuo Ụgwọ N\'Ihu',
  payupfront_new: 'Ụgwọ N\'Ihu Ọhụrụ',
  payupfront_proj_title: 'Aha Ọrụ',
  payupfront_proj_title_prompt: 'Gịnị bụ aha ọrụ a?',
  payupfront_proj_desc: 'Nkọwa (ọ bụghị mkpa)',
  payupfront_total_amount: 'Ego Ọrụ Niile (₦)',
  payupfront_upfront_amount: 'Ego A Ga-akwụ N\'Ihu (₦)',
  payupfront_deadline: 'Oge Njedebe',
  payupfront_recipient: 'Kwuo Nye (Onye Nnata)',
  payupfront_recipient_prompt: 'Onye ka ị na-akwụ ụgwọ? Tinye aha ya, ekwentị, ma ọ bụ nọmba akaụntụ.',
  payupfront_success: 'Ezipụrụ ụgwọ n\'ihu nke ọma. A na-echebe ego nke ọma ruo mgbe ị tọhapụọ ya.',
  payupfront_release: 'Tọhapụ Ụgwọ',
  payupfront_released: 'Atọhapụrụ Ụgwọ',
  payupfront_refunded: 'Eweghachi Ego',
  payupfront_deadline_reminder: 'Taa bụ oge njedebe! Biko mechaa ọrụ ahụ wee rịọ onye nwe ọrụ ka ọ tọhapụ ụgwọ gị.',
  payupfront_complaint_hint: 'Mechara ọrụ mana atọhapụghị ụgwọ gị? Depụta mkpesa n\'okpuru.',

  complaint_title: 'Depụta Mkpesa',
  complaint_desc_label: 'Kọwaa ọrụ i mechara',
  complaint_desc_prompt: 'Nye nkọwa doro anya banyere ọrụ e mere.',
  complaint_upload_label: 'Bulite Ihe Àmà (onyonyo ma ọ bụ vidiyo)',
  complaint_submit: 'Zipu Mkpesa',
  complaint_submitted: 'Ezipụrụ mkpesa nke ọma. Ndị otu anyị ga-enyocha okwu gị.',
  complaint_already: 'Edepụtara m mkpesa maka ụgwọ a.',

  vguide_label: 'Nduzi Olu',
  vguide_on: 'Nduzi Olu dị na ọrụ. M ga-akọwa ihuenyo maka gị.',
  vguide_off: 'Nduzi Olu anọghị na ọrụ.',

  confirm: 'Kwenye',
  cancel: 'Kagbuo',
  next: 'Nke Ọzọ',
  back: 'Laghachi',
  done: 'Mechaa',
  or_type: 'Ma ọ bụ dee ebe a',
  listening: 'Na-anụ olu…',
  processing: 'Na-atụgharị…',
  not_understood: 'Anụghị m nke ọma. Biko nwaa ọzọ.',
  retry_prompt: 'Anụghị m ọzaazị.',
  yes: 'Ee',
  no: 'Mba',
  male: 'Nwoke',
  female: 'Nwanyị',
  pin_security: 'Maka nchekwa gị, pịa PIN gị. Asụghị PIN gị n\'olu.',
};

export const LANGS: Record<LangCode, LangStrings> = { en, ha, yo, ig };
