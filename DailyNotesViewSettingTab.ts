import {App, PluginSettingTab, Setting} from "obsidian";
import DailyNotesViewPlugin from "./main";

/**
 * Unit when capturing the length of notes to include in the view.
 */
export enum LengthUnit {
	Day = "Day",
	Week = "Week",
	Month = "Month",
	Year = "Year"
}

/**
 * Plugin settings:
 * - length: how far back in time we should look for noted to include.
 * - lengthUnit: unit of time to look back.
 * - enableBackspaceCommand: whether to enable the backspace command or not.
 */
export interface DailyNotesViewSettings {
	length: number;
	lengthUnit: LengthUnit;
	enableBackspaceCommand: boolean;
}

export class DailyNotesViewSettingTab extends PluginSettingTab {
	plugin: DailyNotesViewPlugin;

	constructor(app: App, plugin: DailyNotesViewPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Daily Notes'});
		new Setting(containerEl)
			.setName('Length')
			.setDesc('How far back to look for notes')
			.addTextArea(textArea => {
				textArea
					.setValue(this.plugin.settings.length.toString())
					.onChange(async (value) => {
						this.plugin.settings.length = +value;
						await this.plugin.saveSettings();
					});
				textArea.inputEl.maxLength = 3;
			})
			.addDropdown(dropdown => dropdown
				.addOptions(LengthUnit)
				.setValue(this.plugin.settings.lengthUnit)
				.onChange(async (value) => {
					this.plugin.settings.lengthUnit = LengthUnit[value as keyof typeof LengthUnit];
					await this.plugin.saveSettings();
				}));


		containerEl.createEl('h2', {text: 'Keyboard'});
		new Setting(containerEl)
			.setName('Enable Backspace key command')
			.setDesc('Enable adding a command that simulates typing the backspace key.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableBackspaceCommand)
				.onChange(async (value) => {
					this.plugin.settings.enableBackspaceCommand = value
					await this.plugin.saveSettings()
				}));

	}
}
