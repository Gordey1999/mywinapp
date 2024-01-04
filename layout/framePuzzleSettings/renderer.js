"use strict";

import {loadIcon} from "../assets/js/icons.js";

const $container = $('.settings');

const $level = $container.find('input[name="level"]');
const $width = $container.find('input[name="width"]');
const $height = $container.find('input[name="height"]');
const $spread = $container.find('input[name="spread"]');
const $showSolution = $container.find('input[name="showSolution"]');

const $save = $container.find('.js-settings-save');
const $run = $container.find('.js-settings-run');

window.api.invoke('framePuzzleSettingsInit').then((result) => {

	$level.val(result.settings.level);
	$width.val(result.settings.width).attr('max', result.maxWidth);
	$height.val(result.settings.height).attr('max', result.maxHeight);
	$spread.val(Math.floor(result.settings.spread * 100));

	if (result.settings.showSolution) {
		$showSolution.click();
	}
});

$save.click(() => {
	const settings = collectSettings();
	window.api.send('framePuzzleSettingsSave', settings);
});

$run.click(() => {
	const settings = collectSettings();
	window.api.send('framePuzzleSettingsRun', settings);
});

function collectSettings() {
	return {
		level: $level.val(),
		width: $width.val(),
		height: $height.val(),
		spread: $spread.val() / 100,
		showSolution: $showSolution.prop('checked')
	};
}

(function() {
	$('input[type="number"]').on('change', function () {
		const min = parseInt($(this).attr('min'));
		const max = parseInt($(this).attr('max'));
		let value = parseInt($(this).val());

		if (value < min) {
			value = min;
		} else if (value > max) {
			value = max;
		}

		$(this).val(Math.floor(value));
	});

	$('input[type="checkbox"]').each(function () {
		const $input = $(this);
		const $checked = $('<span>').addClass('settings__input-checkbox__checked').append(loadIcon('checked'));
		const $block = $('<span>').addClass('settings__input-checkbox');

		$input.parent().append($block);

		$block.append($checked, $input);

		$block.click((e) => {
			if (e.target !== $input[0]) {
				$input.click();
			}
		});

		$input.change(function () {
			if (this.checked) {
				$checked.show();
			} else {
				$checked.hide();
			}
		});
	});

})();