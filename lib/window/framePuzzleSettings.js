const { BrowserWindow, ipcMain, screen } = require('electron');
const path = require("path");
const {initWindow} = require("../window");

let settings = {
	level: 3, // размер пазла по длине или ширине. С каждой новой игрой увеличивается на 1
	width: 1000, // максимальная ширина пазла
	height: 800, // максимальная высота пазла
	maxOffset: 30, // максимальный разброс кусочков от правильного решения
	spread: 0, // рандомизировать размер и положение пазлов(0 - одинаковые, 1 - может быть в 2 раза больше/меньше, правее/левее)
	showSolution: false // сразу собрать решение
}

let win = null;
let imageSrc = null;

function open(parent, imageSource) {
	win = new BrowserWindow({
		width: 300,
		height: 230,
		minWidth: 50,
		minHeight: 50,
		minimizable: false,
		maximizable: false,
		fullscreenable: false,
		resizable: false,
		frame: false,
		modal: true,
		parent: parent,
		webPreferences: {
			preload: path.join(__dirname, '../../layout/framePuzzleSettings/preload.js'),
			nodeIntegration: true
		}
	});

	imageSrc = imageSource;

	win.loadFile('layout/framePuzzleSettings/index.html');

	initWindow(win);
}

function getSettings() {
	return settings;
}

ipcMain.handle('framePuzzleSettingsInit', async(event) => {
	const primaryDisplay = screen.getPrimaryDisplay();
	const { width, height } = primaryDisplay.workAreaSize;

	return {
		settings: settings,
		maxWidth: width,
		maxHeight: height,
		src: imageSrc
	}
});

ipcMain.on('framePuzzleSettingsSave', (event, newSettings) => {
	settings = { ...settings, ...newSettings };
	win.close();
});

ipcMain.on('framePuzzleSettingsRun', (event, newSettings) => {
	settings = { ...settings, ...newSettings };
	win.close();

	const framePuzzle = require('./framePuzzle');
	framePuzzle.open(imageSrc);
});

module.exports = { open, getSettings };