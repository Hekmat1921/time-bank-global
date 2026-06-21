const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const app = express();

// ===== تنظیمات اولیه =====
const TOKEN = '8957628859:AAGd1ExDTAIYAbF9tpHXUs4NqKpzdd9C7io';  
const DATA_FILE = path.join(__dirname, 'data.json');

// ===== راه‌اندازی ربات =====
const bot = new TelegramBot(TOKEN, { polling: true });

// ===== توابع کمکی برای دیتابیس =====
function loadData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { users: {}, stats: { totalLearns: 0, totalUsers: 0 } };
    }
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== دستور /start =====
bot.onText(/\/start/, (msg) => {
    const userId = msg.chat.id;
    const name = msg.from.first_name || 'کاربر';
    const data = loadData();

    if (!data.users[userId]) {
        data.users[userId] = {
            name: name,
            balance: 0,
            lastLearn: null,
            joinDate: new Date().toISOString(),
            totalLearns: 0
        };
        data.stats.totalUsers += 1;
        saveData(data);
        
        bot.sendMessage(userId, `🌍 به بانک زمان جهانی خوش اومدی ${name}!\n\nهر روز ۱ دقیقه وقت بذار و یاد بگیر تا زمان‌کوین جمع کنی.\n\n📚 با دستور /learn شروع کن!`);
    } else {
        bot.sendMessage(userId, `👋 خوش برگشتی ${data.users[userId].name}!\n💰 موجودی: ${data.users[userId].balance} TimeCoin`);
    }
});

// ===== دستور /learn =====
bot.onText(/\/learn/, (msg) => {
    const userId = msg.chat.id;
    const data = loadData();
    const today = new Date().toDateString();

    if (!data.users[userId]) {
        bot.sendMessage(userId, '❌ اول /start رو بزن!');
        return;
    }

    if (data.users[userId].lastLearn === today) {
        bot.sendMessage(userId, '⏳ امروز که یاد گرفتی! فردا بیا.', {
            reply_markup: {
                inline_keyboard: [[{ text: '💰 موجودی', callback_data: 'balance' }]]
            }
        });
        return;
    }

    const skills = [
        '📚 کلمه‌ی امروز: "Serendipity" به معنی "خوش‌شانسی و اتفاق خوب"',
        '🔬 علم: آب در ۱۰۰ درجه سانتی‌گراد می‌جوشه.',
        '🌍 جغرافیا: طولانی‌ترین رود جهان، نیل با ۶,۶۵۰ کیلومتره.',
        '🧠 روانشناسی: مغز انسان ۱۰۰ میلیارد نورون داره.',
        '📜 تاریخ: اولین خط نوشتاری متعلق به سومری‌هاست.',
        '🎨 هنر: مونالیزا توسط لئوناردو داوینچی کشیده شده.',
        '💡 فلسفه: "تنها چیز ثابت، تغییر است." - هراکلیتوس',
        '🔢 ریاضی: عدد پی (π) حدود ۳.۱۴۱۵۹ است.',
        '🌿 محیط‌زیست: درختان اکسیژن تولید می‌کنند و CO2 جذب می‌کنند.',
        '💻 کامپیوتر: اولین کامپیوتر الکترونیکی ENIAC در ۱۹۴۵ ساخته شد.'
    ];

    const randomSkill = skills[Math.floor(Math.random() * skills.length)];
    bot.sendMessage(userId, `🧠 مهارت امروز:\n\n${randomSkill}\n\n✅ بعد از خوندن، روی دکمه‌ی پایین کلیک کن:`, {
        reply_markup: {
            inline_keyboard: [[{ text: '✅ یاد گرفتم!', callback_data: 'learned' }]]
        }
    });
});

// ===== دکمه‌های شیشه‌ای =====
bot.on('callback_query', (query) => {
    const userId = query.from.id;
    const data = loadData();
    const today = new Date().toDateString();

    if (query.data === 'learned') {
        if (!data.users[userId] || data.users[userId].lastLearn === today) {
            bot.answerCallbackQuery(query.id, { text: '⏳ امروز قبلاً ثبت کردی!' });
            return;
        }

        data.users[userId].balance += 1;
        data.users[userId].totalLearns += 1;
        data.users[userId].lastLearn = today;
        data.stats.totalLearns += 1;
        saveData(data);

        bot.sendMessage(userId, `🎉 آفرین! ۱ TimeCoin دریافت کردی.\n💰 موجودی: ${data.users[userId].balance} TimeCoin\n\n📚 فردا دوباره /learn رو بزن.`);
        bot.answerCallbackQuery(query.id, { text: '✅ ثبت شد!' });
    }

    if (query.data === 'balance') {
        const balance = data.users[userId]?.balance || 0;
        bot.answerCallbackQuery(query.id, { text: `💰 موجودی: ${balance} TimeCoin` });
    }
});

// ===== دستور /balance =====
bot.onText(/\/balance/, (msg) => {
    const userId = msg.chat.id;
    const data = loadData();
    const balance = data.users[userId]?.balance || 0;
    bot.sendMessage(userId, `💰 موجودی شما: ${balance} TimeCoin`);
});

// ===== دستور /stats =====
bot.onText(/\/stats/, (msg) => {
    const data = loadData();
    const stats = data.stats || { totalUsers: 0, totalLearns: 0 };
    bot.sendMessage(msg.chat.id, 
        `📊 آمار جهانی بانک زمان:\n\n` +
        `👥 کاربران: ${stats.totalUsers}\n` +
        `🧠 یادگیری‌ها: ${stats.totalLearns}\n` +
        `⏳ کل زمان‌کوین‌های اهداشده: ${Object.values(data.users).reduce((sum, u) => sum + u.balance, 0)}`
    );
});

// ===== سرور برای نگهداری ربات (اختیاری) =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 بانک زمان جهانی روی پورت ${PORT} راه‌اندازی شد!`);
});

app.get('/', (req, res) => {
    res.send('🌍 بانک زمان جهانی - سرور فعال است!');
});

// ===== نمایش وضعیت در کنسول =====
console.log('🤖 ربات بانک زمان جهانی راه‌اندازی شد!');
