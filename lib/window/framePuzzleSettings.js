const { BrowserWindow, ipcMain, screen } = require('electron');
const path = require("path");
const {WindowManager} = require("../window");

let settings = {
	level: 3, // размер пазла по длине или ширине. С каждой новой игрой увеличивается на 1
	width: 1000, // максимальная ширина пазла
	height: 800, // максимальная высота пазла
	maxOffset: 30, // максимальный разброс кусочков от правильного решения
	spread: 0, // рандомизировать размер и положение пазлов(0 - одинаковые, 1 - может быть в 2 раза больше/меньше, правее/левее)
	showSolution: false, // сразу собрать решение
	mute: false
}

const winManager = WindowManager.getInstance('framePuzzleSettings');

function open(parent, imageSource) {
	const win = winManager.createWindow({
		width: 300,
		height: 260,
		minimizable: false,
		maximizable: false,
		fullscreenable: false,
		resizable: false,
		modal: true,
		parent: parent
	}, {
		imageSource: imageSource
	});
}

function getSettings() {
	return settings;
}

winManager.handle('framePuzzleSettingsInit', async(data) => {
	const primaryDisplay = screen.getPrimaryDisplay();
	const { width, height } = primaryDisplay.workAreaSize;

	return {
		settings: settings,
		maxWidth: width,
		maxHeight: height,
		src: data.imageSource
	}
});

winManager.on('framePuzzleSettingsSave', (data, newSettings) => {
	settings = { ...settings, ...newSettings };
	data.win.close();
});

winManager.on('framePuzzleSettingsRun', (data, newSettings) => {
	settings = { ...settings, ...newSettings };
	data.win.close();

	const framePuzzle = require('./framePuzzle');
	framePuzzle.open(data.imageSource);
});

module.exports = { open, getSettings };