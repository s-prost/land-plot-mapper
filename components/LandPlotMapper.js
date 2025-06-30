import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, MapPin, Layers, FileDown, Map, Upload, FolderOpen, AlertCircle, CheckCircle } from 'lucide-react';

// Конфігурація Google API
const GOOGLE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'YOUR_API_KEY_HERE',
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
  discoveryDocs: [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    'https://sheets.googleapis.com/$discovery/rest?version=v4'
  ],
  scopes: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly'
};

// Google Drive Service
class GoogleDriveService {
  constructor() {
    this.isInitialized = false;
    this.isSignedIn = false;
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      // Завантажуємо Google API
      await new Promise((resolve, reject) => {
        if (window.gapi) {
          resolve();
        } else {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        }
      });

      // Ініціалізуємо gapi
      await new Promise((resolve) => {
        window.gapi.load('client:auth2', resolve);
      });

      // Ініціалізуємо клієнт
      await window.gapi.client.init({
        apiKey: GOOGLE_CONFIG.apiKey,
        clientId: GOOGLE_CONFIG.clientId,
        discoveryDocs: GOOGLE_CONFIG.discoveryDocs,
        scope: GOOGLE_CONFIG.scopes
      });

      this.isInitialized = true;
      this.authInstance = window.gapi.auth2.getAuthInstance();
      this.isSignedIn = this.authInstance.isSignedIn.get();
      
      return true;
    } catch (error) {
      console.error('Помилка ініціалізації Google API:', error);
      return false;
    }
  }

  async signIn() {
    if (!this.isInitialized) {
      throw new Error('Google API не ініціалізовано');
    }

    try {
      if (!this.isSignedIn) {
        await this.authInstance.signIn();
        this.isSignedIn = this.authInstance.isSignedIn.get();
      }
      return this.isSignedIn;
    } catch (error) {
      console.error('Помилка авторизації:', error);
      throw error;
    }
  }

  async signOut() {
    if (this.authInstance && this.isSignedIn) {
      await this.authInstance.signOut();
      this.isSignedIn = false;
    }
  }

  async findFiles(query = '') {
    if (!this.isSignedIn) {
      throw new Error('Потрібна авторизація');
    }

    try {
      // Пошук GeoJSON та CSV файлів
      let searchQuery = "(mimeType='application/json' or name contains '.geojson' or name contains '.csv' or mimeType='text/csv')";
      
      if (query) {
        searchQuery += ` and name contains '${query}'`;
      }

      const response = await window.gapi.client.drive.files.list({
        q: searchQuery,
        fields: 'files(id, name, size, modifiedTime, mimeType)',
        orderBy: 'modifiedTime desc',
        pageSize: 50
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Помилка пошуку файлів:', error);
      throw error;
    }
  }

  async downloadFile(fileId) {
    if (!this.isSignedIn) {
      throw new Error('Потрібна авторизація');
    }

    try {
      const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      return response.body;
    } catch (error) {
      console.error('Помилка завантаження файлу:', error);
      throw error;
    }
  }

  async getSheetData(spreadsheetId, range = 'Sheet1!A:Z') {
    if (!this.isSignedIn) {
      throw new Error('Потрібна авторизація');
    }

    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range,
      });

      return response.result.values || [];
    } catch (error) {
      console.error('Помилка читання Google Sheets:', error);
      throw error;
    }
  }

  getCurrentUser() {
    if (this.authInstance && this.isSignedIn) {
      const profile = this.authInstance.currentUser.get().getBasicProfile();
      return {
        email: profile.getEmail(),
        name: profile.getName(),
        imageUrl: profile.getImageUrl()
      };
    }
    return null;
  }
}

const LandPlotMapper = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlots, setSelectedPlots] = useState([]);
  const [mapCenter, setMapCenter] = useState([50.4501, 30.5234]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [googleSheetsId, setGoogleSheetsId] = useState('');
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  
  // Google Drive стан
  const [driveService] = useState(() => new GoogleDriveService());
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [driveFiles, setDriveFiles] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [errorMessage, setErrorMessage] = useState('');

  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const plotLayersRef = useRef([]);

  // Тестові дані
  const testPlots = [
    {
      id: 'plot_001',
      cadastralNumber: '8000000000:001:0001',
      address: 'м. Київ, вул. Хрещатик, 1',
      area: 1.2505,
      purpose: 'Комерційна забудова',
      coordinates: [
        [[50.4501, 30.5234], [50.4505, 30.5234], [50.4505, 30.5240], [50.4501, 30.5240], [50.4501, 30.5234]]
      ],
      color: '#407E6D',
      source: 'test',
      value: 2500000,
      rentIncome: 15000,
      profitability: 0
    },
    {
      id: 'plot_002',
      cadastralNumber: '8000000000:001:0002',
      address: 'м. Київ, вул. Володимирська, 15',
      area: 0.8902,
      purpose: 'Житлова забудова',
      coordinates: [
        [[50.4490, 30.5250], [50.4495, 30.5250], [50.4495, 30.5258], [50.4490, 30.5258], [50.4490, 30.5250]]
      ],
      color: '#407E6D',
      source: 'test',
      value: 1800000,
      rentIncome: 12000,
      profitability: 0
    },
    {
      id: 'plot_003',
      cadastralNumber: '8000000000:001:0003',
      address: 'м. Київ, просп. Перемоги, 50',
      area: 2.1234,
      purpose: 'Офісна забудова',
      coordinates: [
        [[50.4480, 30.5260], [50.4485, 30.5260], [50.4485, 30.5270], [50.4480, 30.5270], [50.4480, 30.5260]]
      ],
      color: '#407E6D',
      source: 'test',
      value: 4200000,
      rentIncome: 25000,
      profitability: 0
    }
  ];

  const [allPlots, setAllPlots] = useState(testPlots);
  const [filteredPlots, setFilteredPlots] = useState(testPlots);
  const [loadedRegions, setLoadedRegions] = useState(new Set(['80']));

  // Коди областей України
  const regionCodes = {
    '05': 'Вінницька область',
    '07': 'Волинська область', 
    '12': 'Дніпропетровська область',
    '14': 'Донецька область',
    '18': 'Житомирська область',
    '21': 'Закарпатська область',
    '23': 'Запорізька область',
    '26': 'Івано-Франківська область',
    '32': 'Київська область',
    '35': 'Кіровоградська область',
    '44': 'Луганська область',
    '46': 'Львівська область',
    '48': 'Миколаївська область',
    '51': 'Одеська область',
    '53': 'Полтавська область',
    '56': 'Рівненська область',
    '59': 'Сумська область',
    '61': 'Тернопільська область',
    '63': 'Харківська область',
    '65': 'Херсонська область',
    '68': 'Хмельницька область',
    '71': 'Черкаська область',
    '73': 'Чернівецька область',
    '74': 'Чернігівська область',
    '80': 'м. Київ',
    '85': 'АР Крим'
  };

  // Утилітарні функції
  const getRandomColor = () => {
    const colors = ['#407E6D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getSourceIcon = (source) => {
    switch(source) {
      case 'test': return '🧪';
      case 'local_file': return '📁';
      case 'google_drive': return '☁️';
      case 'google_sheets': return '📊';
      default: return '📄';
    }
  };

  const getSourceName = (source) => {
    switch(source) {
      case 'test': return 'Тестові дані';
      case 'local_file': return 'Локальні файли';
      case 'google_drive': return 'Google Drive';
      case 'google_sheets': return 'Google Sheets';
      default: return source;
    }
  };

  // Перевірка налаштувань Google API
  const isGoogleConfigValid = () => {
    return GOOGLE_CONFIG.apiKey !== 'YOUR_API_KEY_HERE' && 
           GOOGLE_CONFIG.clientId !== 'YOUR_CLIENT_ID_HERE';
  };

  // CSV Parser
  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const plots = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length === 0) continue;

      const plot = {};
      headers.forEach((header, index) => {
        plot[header.toLowerCase().replace(/\s/g, '_')] = values[index] || '';
      });

      try {
        const coordinates = JSON.parse(plot.coordinates || '[]');
        if (coordinates.length > 0) {
          plots.push({
            id: `csv_${Date.now()}_${i}`,
            cadastralNumber: plot.cadastral_number || `CSV_${i}`,
            address: plot.address || 'Адреса не вказана',
            area: parseFloat(plot.area || '0'),
            purpose: plot.purpose || 'Не визначено',
            coordinates: [coordinates],
            color: getRandomColor(),
            value: parseFloat(plot.value || plot.вартість || '0'),
            rentIncome: parseFloat(plot.rent_income || plot.орендна_плата || '0'),
            profitability: 0
          });
        }
      } catch (error) {
        console.warn('Помилка парсингу координат для рядка', i);
      }
    }

    return plots;
  };

  // Обробка контенту файлу
  const processFileContent = async (content, fileName, source) => {
    const newPlots = [];

    try {
      if (fileName.toLowerCase().includes('.csv') || source === 'google_sheets') {
        const csvPlots = parseCSV(content);
        newPlots.push(...csvPlots.map(plot => ({ ...plot, source })));
      } else if (fileName.toLowerCase().includes('.geojson') || fileName.toLowerCase().includes('.json')) {
        const geoData = JSON.parse(content);
        if (geoData.type === 'FeatureCollection') {
          geoData.features.forEach((feature, index) => {
            if (feature.geometry && feature.geometry.type === 'Polygon') {
              const props = feature.properties || {};
              newPlots.push({
                id: `${source}_${Date.now()}_${index}`,
                cadastralNumber: props.cadastralNumber || props.cadastral_number || `${fileName}_${index}`,
                address: props.address || props.ADDRESS || 'Адреса не вказана',
                area: parseFloat(props.area || props.AREA || '0'),
                purpose: props.purpose || props.PURPOSE || 'Не визначено',
                coordinates: feature.geometry.coordinates,
                color: getRandomColor(),
                source,
                fileName,
                value: parseFloat(props.value || props.вартість || '0'),
                rentIncome: parseFloat(props.rentIncome || props.rent_income || props.орендна_плата || '0'),
                profitability: 0
              });
            }
          });
        }
      }

      if (newPlots.length > 0) {
        setAllPlots(prev => [...prev, ...newPlots]);
        setErrorMessage('');
      } else {
        setErrorMessage(`Не знайдено валідних ділянок у файлі ${fileName}`);
      }
    } catch (error) {
      setErrorMessage(`Помилка обробки файлу ${fileName}: ${error.message}`);
    }
  };

  // Підключення до Google Drive
  const connectToGoogleDrive = async () => {
    if (!isGoogleConfigValid()) {
      setErrorMessage('Потрібно налаштувати Google API ключі в коді');
      setConnectionStatus('error');
      return;
    }

    setConnectionStatus('connecting');
    setErrorMessage('');
    
    try {
      const initialized = await driveService.initialize();
      if (!initialized) {
        throw new Error('Не вдалося ініціалізувати Google API');
      }

      const signedIn = await driveService.signIn();
      if (signedIn) {
        const user = driveService.getCurrentUser();
        setGoogleUser(user);
        setIsGoogleDriveConnected(true);
        setConnectionStatus('connected');
        
        // Автоматично завантажуємо список файлів
        await loadDriveFiles();
      } else {
        throw new Error('Не вдалося авторизуватися');
      }
    } catch (error) {
      setErrorMessage(`Помилка підключення: ${error.message}`);
      setConnectionStatus('error');
      setIsGoogleDriveConnected(false);
    }
  };

  // Відключення від Google Drive
  const disconnectFromGoogleDrive = async () => {
    try {
      await driveService.signOut();
      setIsGoogleDriveConnected(false);
      setGoogleUser(null);
      setDriveFiles([]);
      setConnectionStatus('disconnected');
    } catch (error) {
      console.error('Помилка відключення:', error);
    }
  };

  // Завантаження списку файлів
  const loadDriveFiles = async () => {
    if (!isGoogleDriveConnected) return;

    setIsLoadingFiles(true);
    try {
      const files = await driveService.findFiles(fileSearchTerm);
      setDriveFiles(files);
    } catch (error) {
      setErrorMessage(`Помилка завантаження файлів: ${error.message}`);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Завантаження файлу з Drive
  const loadFileFromDrive = async (file) => {
    setIsLoadingFiles(true);
    try {
      const content = await driveService.downloadFile(file.id);
      await processFileContent(content, file.name, 'google_drive');
    } catch (error) {
      setErrorMessage(`Помилка завантаження файлу ${file.name}: ${error.message}`);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Завантаження з Google Sheets
  const loadFromGoogleSheets = async () => {
    if (!googleSheetsId.trim()) {
      setErrorMessage('Будь ласка, введіть ID Google Sheets');
      return;
    }

    setIsLoadingFiles(true);
    try {
      const rows = await driveService.getSheetData(googleSheetsId);
      if (rows.length === 0) {
        setErrorMessage('Google Sheets порожній або недоступний');
        return;
      }

      const csvContent = rows.map(row => 
        row.map(cell => `"${cell || ''}"`).join(',')
      ).join('\n');

      await processFileContent(csvContent, 'Google Sheets', 'google_sheets');
    } catch (error) {
      setErrorMessage(`Помилка завантаження з Google Sheets: ${error.message}`);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Локальні файли
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsLoadingFiles(true);
    
    for (const file of files) {
      try {
        const text = await file.text();
        await processFileContent(text, file.name, 'local_file');
      } catch (error) {
        setErrorMessage(`Помилка обробки файлу ${file.name}: ${error.message}`);
      }
    }

    setIsLoadingFiles(false);
    event.target.value = '';
  };

  const handleSearch = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSelectedPlots(filteredPlots);
    setIsLoading(false);
  };

  // Розрахунок дохідності
  const calculateProfitability = (value, rentIncome) => {
    if (!value || value === 0) return 0;
    return ((rentIncome * 12) / value * 100);
  };

  // Оновлення економічних показників ділянки
  const updatePlotFinancials = (plotId, field, value) => {
    const updatedPlots = allPlots.map(plot => {
      if (plot.id === plotId) {
        const updatedPlot = { ...plot, [field]: parseFloat(value) || 0 };
        updatedPlot.profitability = calculateProfitability(updatedPlot.value, updatedPlot.rentIncome);
        return updatedPlot;
      }
      return plot;
    });
    setAllPlots(updatedPlots);

    // Оновлюємо також вибрані ділянки
    setSelectedPlots(prev => prev.map(plot => {
      if (plot.id === plotId) {
        const updatedPlot = { ...plot, [field]: parseFloat(value) || 0 };
        updatedPlot.profitability = calculateProfitability(updatedPlot.value, updatedPlot.rentIncome);
        return updatedPlot;
      }
      return plot;
    }));
  };

  // Форматування валюти
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Форматування відсотків
  const formatPercentage = (percentage) => {
    return `${(percentage || 0).toFixed(2)}%`;
  };

  const addPlotToMap = (plot) => {
    if (!selectedPlots.find(p => p.id === plot.id)) {
      // Розраховуємо дохідність перед додаванням
      const plotWithProfitability = {
        ...plot,
        profitability: calculateProfitability(plot.value, plot.rentIncome)
      };
      setSelectedPlots([...selectedPlots, plotWithProfitability]);
    }
  };

  const removePlotFromMap = (plotId) => {
    setSelectedPlots(selectedPlots.filter(p => p.id !== plotId));
  };

  // Експорт в HTML
  const exportToHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Земельні ділянки - Звіт</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #407E6D 0%, #2d5a4f 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .stat-number {
            font-size: 1.8em;
            font-weight: bold;
            color: #407E6D;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .content {
            padding: 30px;
        }
        .map-container {
            margin: 20px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        #map {
            height: 500px;
            width: 100%;
        }
        .leaflet-popup-content-wrapper {
            border-radius: 8px;
        }
        .plot-popup {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-width: 200px;
        }
        .plot-popup h4 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 1.1em;
        }
        .plot-popup p {
            margin: 5px 0;
            font-size: 0.9em;
            color: #666;
        }
        .plot-popup .area {
            font-weight: bold;
            color: #407E6D;
        }
        .plots-grid {
            display: grid;
            gap: 20px;
            margin-top: 20px;
        }
        .plot-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            background: white;
            transition: box-shadow 0.3s ease;
        }
        .plot-card:hover {
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .plot-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .plot-id {
            font-weight: bold;
            font-size: 1.1em;
            color: #333;
        }
        .plot-source {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: 500;
        }
        .source-test { background: #e3f2fd; color: #1565c0; }
        .source-local_file { background: #f3e5f5; color: #7b1fa2; }
        .source-google_drive { background: #e8f5e8; color: #2e7d32; }
        .source-google_sheets { background: #fff3e0; color: #f57c00; }
        .plot-address {
            color: #666;
            margin-bottom: 10px;
            line-height: 1.4;
        }
        .plot-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        .detail-item {
            text-align: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        .detail-label {
            font-size: 0.8em;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .detail-value {
            font-weight: bold;
            margin-top: 5px;
            color: #333;
        }

        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e0e0e0;
        }
        @media print {
            .container {
                box-shadow: none;
                border: none;
            }
            .plot-card {
                break-inside: avoid;
                margin-bottom: 20px;
            }
        }
        @media (max-width: 768px) {
            .plots-grid {
                grid-template-columns: 1fr;
            }
            .plot-details {
                grid-template-columns: 1fr;
            }
            .stats {
                grid-template-columns: 1fr;
            }
            .stat-number {
                font-size: 1.5em;
            }
        }
    </style>
</head>
<body>
    <div className="container">
        <!-- Весь HTML контент буде тут -->
    </div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <!-- JavaScript код для карти -->
</body>
</html>`;

    const dataBlob = new Blob([htmlContent], {type: 'text/html; charset=utf-8'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'land_plots_report.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Групування по джерелах
  const getPlotsBySource = () => {
    const plotsBySource = {};
    filteredPlots.forEach(plot => {
      const source = plot.source || 'unknown';
      if (!plotsBySource[source]) {
        plotsBySource[source] = [];
      }
      plotsBySource[source].push(plot);
    });
    return plotsBySource;
  };

  // Ініціалізація карти
  useEffect(() => {
    if (mapRef.current && !leafletMapRef.current) {
      leafletMapRef.current = { 
        initialized: true,
        layers: [],
        setView: () => {},
        addLayer: () => {},
        removeLayer: () => {},
        fitBounds: () => {}
      };
    }
  }, []);

  // Оновлення дохідності при зміні даних
  useEffect(() => {
    const updatedPlots = allPlots.map(plot => ({
      ...plot,
      profitability: calculateProfitability(plot.value, plot.rentIncome)
    }));
    if (JSON.stringify(updatedPlots) !== JSON.stringify(allPlots)) {
      setAllPlots(updatedPlots);
    }
  }, [allPlots]);

  // Оновлення ділянок на карті
  useEffect(() => {
    if (leafletMapRef.current) {
      plotLayersRef.current = selectedPlots.map(plot => ({
        id: plot.id,
        color: plot.color
      }));
    }
  }, [selectedPlots]);

  // Фільтрація ділянок
  useEffect(() => {
    if (searchTerm) {
      const filtered = allPlots.filter(plot => 
        plot.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plot.cadastralNumber.includes(searchTerm) ||
        plot.purpose.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlots(filtered);
    } else {
      setFilteredPlots(allPlots);
    }
  }, [searchTerm, allPlots]);

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b p-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Map className="text-[#407E6D]" />
          Додаток для роботи з земельними ділянками
        </h1>
        <p className="text-gray-600 mt-1">Інтеграція з Google Drive та Google Sheets</p>
      </div>

      <div className="flex-1 flex">
        {/* Бічна панель */}
        <div className="w-80 bg-white border-r flex flex-col">
          
          {/* Статус підключення */}
          {!isGoogleConfigValid() && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Потрібно налаштувати API ключі</span>
              </div>
              <p className="text-xs text-red-600 mt-1">
                Замініть YOUR_API_KEY_HERE та YOUR_CLIENT_ID_HERE в коді
              </p>
            </div>
          )}

          {/* Google Drive підключення */}
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#407E6D]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.28 3l5.72 9.91L18.28 3h-12zM19.5 6l-4.78 8.28L22 21H2l7.28-12.61L4.5 6h15z"/>
              </svg>
              Google Drive
            </h3>

            {connectionStatus === 'connected' && googleUser && (
              <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Підключено</span>
                </div>
                <p className="text-xs text-green-700 mt-1">{googleUser.email}</p>
                <button
                  onClick={disconnectFromGoogleDrive}
                  className="text-xs text-green-600 hover:text-green-800 mt-1"
                >
                  Відключити
                </button>
              </div>
            )}

            {connectionStatus === 'error' && errorMessage && (
              <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Помилка</span>
                </div>
                <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
              </div>
            )}

            {!isGoogleDriveConnected ? (
              <button
                onClick={connectToGoogleDrive}
                disabled={connectionStatus === 'connecting' || !isGoogleConfigValid()}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm justify-center transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.28 3l5.72 9.91L18.28 3h-12zM19.5 6l-4.78 8.28L22 21H2l7.28-12.61L4.5 6h15z"/>
                </svg>
                {connectionStatus === 'connecting' ? 'Підключення...' : 'Підключити Google Drive'}
              </button>
            ) : (
              <div className="space-y-2">
                {/* Пошук файлів */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Пошук файлів..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    value={fileSearchTerm}
                    onChange={(e) => setFileSearchTerm(e.target.value)}
                  />
                  <button
                    onClick={loadDriveFiles}
                    disabled={isLoadingFiles}
                    className="px-3 py-2 bg-[#407E6D] text-white rounded-lg hover:bg-[#2d5a4f] disabled:opacity-50"
                  >
                    🔍
                  </button>
                </div>

                {/* Google Sheets */}
                <input
                  type="text"
                  placeholder="ID Google Sheets"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={googleSheetsId}
                  onChange={(e) => setGoogleSheetsId(e.target.value)}
                />
                <button
                  onClick={loadFromGoogleSheets}
                  disabled={isLoadingFiles || !googleSheetsId.trim()}
                  className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm justify-center transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                  Завантажити з Sheets
                </button>
              </div>
            )}
          </div>

          {/* Файли з Google Drive */}
          {isGoogleDriveConnected && driveFiles.length > 0 && (
            <div className="p-4 border-b">
              <h4 className="font-medium mb-2 text-sm">Файли на Drive ({driveFiles.length})</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {driveFiles.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded text-xs cursor-pointer"
                    onClick={() => loadFileFromDrive(file)}
                  >
                    <div className="flex-1 truncate">
                      <div className="font-medium truncate">{file.name}</div>
                      <div className="text-gray-500">
                        {file.size ? `${Math.round(file.size / 1024)} KB` : 'N/A'} • 
                        {new Date(file.modifiedTime).toLocaleDateString()}
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Локальні файли */}
          <div className="p-4 border-b" style={{backgroundColor: '#407E6D15'}}>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#407E6D]" />
              Локальні файли
            </h3>
            
            <input
              type="file"
              multiple
              accept=".geojson,.json,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="w-full px-3 py-2 bg-[#407E6D] text-white rounded-lg hover:bg-[#2d5a4f] cursor-pointer flex items-center gap-2 text-sm justify-center transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              {isLoadingFiles ? 'Завантаження...' : 'Вибрати файли'}
            </label>

            {loadedRegions.size > 0 && (
              <div className="mt-2 text-xs text-[#407E6D]">
                Завантажено областей: {Array.from(loadedRegions).map(code => regionCodes[code] || code).join(', ')}
              </div>
            )}
          </div>

          {/* Пошук */}
          <div className="p-4 border-b">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Пошук за адресою, кадастровим номером..."
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#407E6D] focus:border-[#407E6D]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-4 py-2 bg-[#407E6D] text-white rounded-lg hover:bg-[#2d5a4f] disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? '...' : <Search className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Знайдено: {filteredPlots.length} ділянок ({allPlots.length} всього)
            </div>
          </div>

          {/* Список ділянок по джерелах */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Результати пошуку
              </h3>
              
              {Object.entries(getPlotsBySource()).map(([source, plots]) => (
                <div key={source} className="mb-4">
                  <div className="sticky top-0 bg-gray-100 px-3 py-2 rounded-lg mb-2 font-medium text-sm text-gray-700 flex items-center gap-2">
                    {getSourceIcon(source)}
                    {getSourceName(source)} ({plots.length})
                  </div>
                  <div className="space-y-2 ml-2">
                    {plots.map(plot => (
                      <div
                        key={plot.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => addPlotToMap(plot)}
                      >
                        <div className="font-medium text-sm flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded border"
                            style={{ backgroundColor: plot.color }}
                          ></div>
                          {plot.cadastralNumber}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{plot.address}</div>
                        <div className="space-y-1 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {plot.area ? plot.area.toFixed(4) : '0.0000'} га
                            </span>
                            <span className="text-xs text-gray-500">{plot.purpose}</span>
                          </div>
                          
                          {/* Економічні показники */}
                          <div className="grid grid-cols-3 gap-1 text-xs">
                            <div>
                              <div className="text-gray-500">Вартість</div>
                              <input
                                type="number"
                                placeholder="0"
                                className="w-full px-1 py-1 border rounded text-xs"
                                value={plot.value || ''}
                                onChange={(e) => updatePlotFinancials(plot.id, 'value', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div>
                              <div className="text-gray-500">Оренда/міс</div>
                              <input
                                type="number"
                                placeholder="0"
                                className="w-full px-1 py-1 border rounded text-xs"
                                value={plot.rentIncome || ''}
                                onChange={(e) => updatePlotFinancials(plot.id, 'rentIncome', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div>
                              <div className="text-gray-500">Дохідність</div>
                              <div 
                                className={`text-xs font-medium ${
                                  (plot.profitability || 0) > 10 ? 'text-green-600' :
                                  (plot.profitability || 0) > 5 ? 'text-orange-600' : 'text-red-600'
                                }`}
                              >
                                {formatPercentage(plot.profitability || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                        {plot.fileName && (
                          <div className="text-xs text-gray-400 mt-1">📄 {plot.fileName}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Експорт */}
          <div className="p-4 border-t" style={{backgroundColor: '#407E6D15'}}>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-[#407E6D]" />
              Експорт в HTML ({selectedPlots.length})
            </h3>
            <div className="space-y-2">
              <button
                onClick={exportToHTML}
                disabled={selectedPlots.length === 0}
                className="w-full px-3 py-2 bg-[#407E6D] text-white rounded-lg hover:bg-[#2d5a4f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <FileDown className="w-4 h-4" />
                HTML Звіт
              </button>
            </div>
          </div>
        </div>

        {/* Карта */}
        <div className="flex-1 relative bg-gray-200">
          <div ref={mapRef} className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Інтерактивна карта</h3>
              <p className="text-gray-500 max-w-md">
                Тут відображатимуться вибрані земельні ділянки з Google Drive. 
                В повній версії буде інтегрована бібліотека Leaflet для відображення реальної карти.
              </p>
              {selectedPlots.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  Вибрано {selectedPlots.length} ділянок для відображення
                </div>
              )}
            </div>
          </div>
          
          {/* Інформаційна панель */}
          {selectedPlots.length > 0 && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
              <h3 className="font-semibold mb-2">Вибрані ділянки</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedPlots.map(plot => (
                  <div key={plot.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: plot.color }}
                      ></div>
                      <span className="truncate">{plot.cadastralNumber}</span>
                      <span className="text-xs">{getSourceIcon(plot.source)}</span>
                    </div>
                    <button
                      onClick={() => removePlotFromMap(plot.id)}
                      className="text-red-500 hover:text-red-700 text-xs ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t text-xs text-gray-600 space-y-1">
                <div>Загальна площа: {selectedPlots.reduce((sum, plot) => sum + plot.area, 0).toFixed(4)} га</div>
                <div>Загальна вартість: {formatCurrency(selectedPlots.reduce((sum, plot) => sum + (plot.value || 0), 0))}</div>
                <div>Місячна оренда: {formatCurrency(selectedPlots.reduce((sum, plot) => sum + (plot.rentIncome || 0), 0))}</div>
                <div>Річний дохід: {formatCurrency(selectedPlots.reduce((sum, plot) => sum + (plot.rentIncome || 0), 0) * 12)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandPlotMapper;
