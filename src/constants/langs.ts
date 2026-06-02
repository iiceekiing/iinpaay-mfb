import type { LangCode } from '../types';

export const LANG_OPTIONS = [
  { code: 'en' as LangCode, label: 'English',   flag: '🇬🇧', native: 'English' },
  { code: 'ha' as LangCode, label: 'Hausa',     flag: '🇳🇬', native: 'Hausa' },
  { code: 'yo' as LangCode, label: 'Yoruba',    flag: '🇳🇬', native: 'Yorùbá' },
  { code: 'ig' as LangCode, label: 'Igbo',      flag: '🇳🇬', native: 'Igbo' },
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

  // Projects
  proj_title: string;
  proj_title_prompt: string;
  proj_desc: string;
  proj_budget: string;
  proj_deadline: string;
  proj_success: string;

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
  yes: string;
  no: string;
  male: string;
  female: string;
  pin_security: string;
};

const en: LangStrings = {
  welcome: 'Welcome to iinpaay.',
  welcome_sub: 'I am Amira, your voice assistant.',
  tap_mic: 'Tap the microphone to begin, or use the buttons below.',

  choose_lang: 'Which language would you like to use today?',

  have_account: 'Do you already have an iinpaay account?',
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
  reg_success: (name) => `Welcome to iinpaay, ${name}! Your account is ready.`,

  login_phone: 'Phone Number',
  login_phone_prompt: 'Please tell me your phone number.',
  login_pin: 'Transfer PIN',
  login_pin_prompt: 'Please enter your 6-digit PIN.',
  login_welcome_back: (name) => `Welcome back, ${name}! You are now logged in.`,
  login_wrong_pin: 'Incorrect PIN. Please try again.',
  login_not_found: 'No account found with that phone number.',

  dash_greeting: (name) => `Welcome back, ${name}.`,
  dash_guide: 'What would you like to do today? You can add money, send money, or create a project.',
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

  proj_title: 'Project Title',
  proj_title_prompt: 'What is the name of your project?',
  proj_desc: 'Description',
  proj_budget: 'Budget',
  proj_deadline: 'Deadline',
  proj_success: 'Your project has been created successfully.',

  confirm: 'Confirm',
  cancel: 'Cancel',
  next: 'Next',
  back: 'Back',
  done: 'Done',
  or_type: 'Or type here',
  listening: 'Listening…',
  processing: 'Processing…',
  not_understood: 'I did not quite catch that. Please try again.',
  yes: 'Yes',
  no: 'No',
  male: 'Male',
  female: 'Female',
  pin_security: 'For your security, please type your PIN. Never say your PIN out loud.',
};

const ha: LangStrings = {
  welcome: 'Barka da zuwa iinpaay.',
  welcome_sub: 'Ni ne Amira, mataimakiyarku ta muryar.',
  tap_mic: 'Taɓa makirofon don fara, ko yi amfani da maɓalli.',

  choose_lang: 'Wane harshe kake son amfani da shi yau?',

  have_account: 'Shin kana da asusun iinpaay?',
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
  reg_success: (name) => `Barka da zuwa iinpaay, ${name}! Asusunka ya shirya.`,

  login_phone: 'Lambar Waya',
  login_phone_prompt: 'Don Allah ka faɗa mini lambar wayarka.',
  login_pin: 'PIN na Canja Kuɗi',
  login_pin_prompt: 'Don Allah shigar da PIN ɗin ka na lambobi shida.',
  login_welcome_back: (name) => `Barka da dawowar, ${name}! Ka shiga yanzu.`,
  login_wrong_pin: 'PIN ba daidai ba. Don Allah gwada kuma.',
  login_not_found: 'Ba a samu asusun da wannan lambar waya ba.',

  dash_greeting: (name) => `Barka da dawowar, ${name}.`,
  dash_guide: 'Me kake son yi yau? Zaka iya ƙara kuɗi, aika kuɗi, ko ƙirƙirar aiki.',
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

  proj_title: 'Sunan Aiki',
  proj_title_prompt: 'Menene sunan aikinku?',
  proj_desc: 'Bayani',
  proj_budget: 'Kasafin Kuɗi',
  proj_deadline: 'Ƙarshen Lokaci',
  proj_success: 'An ƙirƙirar aikinku cikin nasara.',

  confirm: 'Tabbatar',
  cancel: 'Soke',
  next: 'Gaba',
  back: 'Baya',
  done: 'Kammala',
  or_type: 'Ko rubuta a nan',
  listening: 'Ina sauraro…',
  processing: 'Ana sarrafa…',
  not_understood: 'Ban ji daidai ba. Don Allah sake gwadawa.',
  yes: 'Eh',
  no: "A'a",
  male: 'Namiji',
  female: 'Mace',
  pin_security: 'Don amincin ka, rubuta PIN. Kada ka faɗa PIN a bayyane.',
};

const yo: LangStrings = {
  welcome: 'Ẹ káàbọ̀ sí iinpaay.',
  welcome_sub: 'Èmi ni Amira, olùrànlọ́wọ́ ohùn rẹ.',
  tap_mic: 'Tẹ maikirofonu láti bẹ̀rẹ̀, tàbí lo àwọn bọ́tìnnì.',

  choose_lang: 'Èdè wo ni o fẹ́ lò lónìí?',

  have_account: 'Ṣé o ti ní àkọọ́lẹ̀ iinpaay?',
  say_yes_no: 'Sọ "Bẹ́ẹ̀ ni" tàbí "Bẹ́ẹ̀ kọ", tàbí tẹ bọ́tìnnì.',

  reg_name: 'Orúkọ Kíkún',
  reg_name_prompt: 'Jọ̀wọ́ sọ orúkọ rẹ kíkún fún mi.',
  reg_day: 'Ọjọ́ Ìbí',
  reg_day_prompt: 'Ọjọ́ wo ni a bí ọ? Sọ nọ́mbà kan láti 1 sí 31.',
  reg_month: 'Oṣù Ìbí',
  reg_month_prompt: 'Oṣù wo ni a bí ọ? Sọ orúkọ oṣù tàbí nọ́mbà rẹ.',
  reg_year: 'Ọdún Ìbí',
  reg_year_prompt: 'Ọdún wo ni a bí ọ? Fún àpẹẹrẹ, ẹgbẹ̀rún ọgbọ̀n.',
  reg_gender: 'Ìdásílẹ̀',
  reg_gender_prompt: 'Ṣé akùnlẹ̀bọ tàbí obìnrin ni o?',
  reg_phone: 'Nọ́mbà Fóònù',
  reg_phone_prompt: 'Jọ̀wọ́ sọ nọ́mbà fóònù rẹ fún mi.',
  reg_pin: 'PIN Gbígbé Owó',
  reg_pin_prompt: 'Yan PIN nọ́mbà mẹ́fà.',
  reg_pin_security: 'Fún ààbò rẹ, jọ̀wọ́ tẹ PIN rẹ. Má sọ PIN rẹ lóhùn.',
  reg_confirm: (name) => `E dúpẹ́, ${name}. Jẹ́ ká fi ìdánimọ̀ rẹ hàn.`,
  reg_success: (name) => `Ẹ káàbọ̀ sí iinpaay, ${name}! Àkọọ́lẹ̀ rẹ ti ṣetán.`,

  login_phone: 'Nọ́mbà Fóònù',
  login_phone_prompt: 'Jọ̀wọ́ sọ nọ́mbà fóònù rẹ.',
  login_pin: 'PIN Gbígbé Owó',
  login_pin_prompt: 'Jọ̀wọ́ tẹ PIN nọ́mbà mẹ́fà rẹ.',
  login_welcome_back: (name) => `Ẹ káàbọ̀ padà, ${name}! O ti wọlé báyìí.`,
  login_wrong_pin: 'PIN kò tọ́. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kansí.',
  login_not_found: 'A kò rí àkọọ́lẹ̀ pẹ̀lú nọ́mbà fóònù yẹn.',

  dash_greeting: (name) => `Ẹ káàbọ̀ padà, ${name}.`,
  dash_guide: 'Kí ni o fẹ́ ṣe lónìí? O lè fi owó kún, rán owó, tàbí ṣẹ̀dá iṣẹ́ àgbàdo.',
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

  proj_title: 'Orúkọ Iṣẹ́',
  proj_title_prompt: 'Kí ni orúkọ iṣẹ́ rẹ?',
  proj_desc: 'Àpèjúwe',
  proj_budget: 'Ìwọ̀n Owó',
  proj_deadline: 'Àkókò Tó Kẹ́yìn',
  proj_success: 'A ṣẹ̀dá iṣẹ́ rẹ pẹ̀lú àṣeyọrí.',

  confirm: 'Jẹ́rìísí',
  cancel: 'Fagilé',
  next: 'Tẹ̀síwájú',
  back: 'Padà',
  done: 'Parí',
  or_type: 'Tàbí tẹ níhìn',
  listening: 'Ń gbọ́…',
  processing: 'Ń ṣe àgbékalẹ̀…',
  not_understood: 'Mi ò gbọ́ dédé. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kansí.',
  yes: 'Bẹ́ẹ̀ ni',
  no: 'Bẹ́ẹ̀ kọ',
  male: 'Akùnlẹ̀bọ',
  female: 'Obìnrin',
  pin_security: 'Fún ààbò rẹ, tẹ PIN rẹ. Má sọ PIN rẹ lóhùn.',
};

const ig: LangStrings = {
  welcome: 'Nnọọ na iinpaay.',
  welcome_sub: 'Abụ m Amira, onye enyemaka olu gị.',
  tap_mic: 'Kpọọ maikirofonu iji malite, ma ọ bụ jiri bọtụm.',

  choose_lang: 'Asụsụ ole ka ị chọọ iji taa?',

  have_account: 'Ị nwere akaụntụ iinpaay?',
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
  reg_success: (name) => `Nnọọ na iinpaay, ${name}! Akaụntụ gị dị njikere.`,

  login_phone: 'Nọmba Ekwentị',
  login_phone_prompt: 'Biko gwa m nọmba ekwentị gị.',
  login_pin: 'PIN Mbufọ Ego',
  login_pin_prompt: 'Biko tinye PIN nọmba isii gị.',
  login_welcome_back: (name) => `Nnọọ nọ ọzọ, ${name}! Ị banye ugbu a.`,
  login_wrong_pin: 'PIN ezighị ezi. Biko nwaa ọzọ.',
  login_not_found: 'Achọtaghị akaụntụ na nọmba ekwentị ahụ.',

  dash_greeting: (name) => `Nnọọ nọ ọzọ, ${name}.`,
  dash_guide: 'Gịnị ka ị chọọ ime taa? Ị nwere ike itinye ego, zipu ego, ma ọ bụ mepụta ọrụ.',
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

  proj_title: 'Aha Ọrụ',
  proj_title_prompt: 'Gịnị bụ aha ọrụ gị?',
  proj_desc: 'Nkọwa',
  proj_budget: 'Ego Ọrụ',
  proj_deadline: 'Oge Njedebe',
  proj_success: 'Emepụtara ọrụ gị nke ọma.',

  confirm: 'Kwenye',
  cancel: 'Kagbuo',
  next: 'Nke Ọzọ',
  back: 'Laghachi',
  done: 'Mechaa',
  or_type: 'Ma ọ bụ dee ebe a',
  listening: 'Na-anụ olu…',
  processing: 'Na-atụgharị…',
  not_understood: 'Anụghị m nke ọma. Biko nwaa ọzọ.',
  yes: 'Ee',
  no: 'Mba',
  male: 'Nwoke',
  female: 'Nwanyị',
  pin_security: 'Maka nchekwa gị, pịa PIN gị. Asụghị PIN gị n\'olu.',
};

export const LANGS: Record<LangCode, LangStrings> = { en, ha, yo, ig };
