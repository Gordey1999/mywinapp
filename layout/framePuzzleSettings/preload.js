
const {exposeInMainWorld} = require("../preload");

exposeInMainWorld(
    [
		'framePuzzleSettingsSave', 'framePuzzleSettingsRun'
    ],
    [
        'framePuzzleSettingsInit'
    ],
	[

	],
	__dirname
)