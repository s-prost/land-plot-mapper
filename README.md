🗺️ Land Plot Mapper

Професійний додаток для управління земельними ділянками з інтеграцією Google Drive та аналізом дохідності.

✨ Основні можливості





📊 Інтеграція з Google Drive - завантаження файлів GeoJSON та CSV



📈 Google Sheets підтримка - прямий імпорт даних з таблиць



💰 Аналіз дохідності - розрахунок економічних показників



🗺️ Інтерактивні карти - візуалізація земельних ділянок



📱 Адаптивний дизайн - підтримка всіх пристроїв



🚀 Експорт в HTML - створення професійних звітів



🔍 Розширений пошук - фільтрація по різних критеріях

🚀 Швидкий старт

Передумови





Node.js 18+



npm або yarn



Google Cloud проект з активованими API

Встановлення





Клонуйте репозиторій

git clone https://github.com/s-prost/land-plot-mapper.git
cd land-plot-mapper






Встановіть залежності

npm install
# або
yarn install






Налаштуйте змінні середовища

cp .env.example .env.local


Відредагуйте .env.local та додайте ваші Google API ключі:

NEXT_PUBLIC_GOOGLE_API_KEY=your_actual_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_actual_client_id






Запустіть в режимі розробки

npm run dev
# або
yarn dev






Відкрийте браузер Перейдіть на http://localhost:3000

🔧 Налаштування Google API

Крок 1: Створення проекту





Перейдіть на Google Cloud Console



Створіть новий проект або виберіть існуючий



Активуйте необхідні API:





Google Drive API



Google Sheets API

Крок 2: Створення облікових даних





Перейдіть в розділ "APIs & Services" → "Credentials"



Створіть API Key:





Натисніть "Create Credentials" → "API key"



Скопіюйте ключ в NEXT_PUBLIC_GOOGLE_API_KEY



Створіть OAuth 2.0 Client ID:





Натисніть "Create Credentials" → "OAuth client ID"



Тип: "Web application"



Додайте домени в "Authorized JavaScript origins"

Крок 3: Налаштування доменів

Для локальної розробки:

http://localhost:3000


Для production:

https://your-domain.vercel.app


📊 Формати файлів

GeoJSON

{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[30.5234, 50.4501], ...]]
      },
      "properties": {
        "cadastralNumber": "8000000000:001:0001",
        "address": "м. Київ, вул. Хрещатик, 1",
        "area": 1.2505,
        "purpose": "Комерційна забудова",
        "value": 2500000,
        "rentIncome": 15000
      }
    }
  ]
}


CSV

cadastral_number,address,area,purpose,coordinates,value,rent_income
8000000000:001:0001,"м. Київ, вул. Хрещатик, 1",1.2505,"Комерційна забудова","[[30.5234,50.4501],...]",2500000,15000


🏗️ Структура проекту

land-plot-mapper/
├── components/
│   └── LandPlotMapper.js     # Основний компонент
├── pages/
│   ├── _app.js               # Next.js App компонент
│   └── index.js              # Головна сторінка
├── styles/
│   └── globals.css           # Глобальні стилі
├── public/                   # Статичні файли
├── .env.example              # Приклад змінних середовища
├── .env.local                # Ваші змінні (не в git!)
├── next.config.js            # Конфігурація Next.js
├── tailwind.config.js        # Конфігурація Tailwind
└── package.json              # Залежності проекту


🌐 Деплой на Vercel

Автоматичний деплой





Підключіть GitHub репозиторій до Vercel



Додайте змінні середовища в Vercel Dashboard



Кожен push в main гілку автоматично деплоїться

Ручний деплой

npm install -g vercel
vercel --prod


📋 Скрипти

npm run dev          # Запуск в режимі розробки
npm run build        # Збірка для production
npm run start        # Запуск production сервера
npm run lint         # Перевірка коду
npm run export       # Експорт статичного сайту


🛠️ Технології





Frontend: Next.js 14, React 18, Tailwind CSS



Карти: Leaflet (планується)



Іконки: Lucide React



API: Google Drive API, Google Sheets API



Деплой: Vercel



Мова: TypeScript/JavaScript

📈 Можливості аналізу

Економічні показники





Дохідність = (Оренда × 12) / Вартість × 100%



ROI = Річний прибуток / Інвестиції × 100%



Загальна статистика по портфелю ділянок

Фільтри та пошук





Пошук за адресою



Фільтр за кадастровим номером



Сортування за площею



Групування за джерелами даних

🤝 Внесок у проект





Fork репозиторію



Створіть feature branch (git checkout -b feature/amazing-feature)



Commit ваші зміни (git commit -m 'Add amazing feature')



Push в branch (git push origin feature/amazing-feature)



Створіть Pull Request

📝 Ліцензія

Цей проект ліцензований під MIT License - дивіться файл LICENSE для деталей.

🆘 Підтримка

Якщо у вас виникли проблеми:





Перевірте Issues



Створіть нове Issue з детальним описом



Контакт: serzzhhh@gmail.com

🔮 Планується





Повна інтеграція з Leaflet картами



Підтримка KML файлів



Автоматичний розрахунок ринкової вартості



Інтеграція з державними реєстрами



Мобільний додаток



API для третіх сторін



Створено з ❤️ для спрощення роботи з земельними ділянками в Україні# land-plot-mapper
