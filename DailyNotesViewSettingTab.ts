import {App, PluginSettingTab, Setting} from "obsidian";
import DailyNotesViewPlugin from "./main";

/**
 * Unit when capturing the length of daily notes to include in the view.
 */
export enum LengthUnit {
	Day = "Day",
	Week = "Week",
	Month = "Month",
	Year = "Year"
}

/**
 * Order in which the notes will appear.
 */
export enum DisplayOrder {
	OlderFirst = "Older first",
	RecentFirst = "Recent first"
}

/**
 * Plugin settings:
 * - length: how far back in time we should look for noted to include.
 * - lengthUnit: unit of time to look back.
 * - enableBackspaceCommand: whether to enable the backspace command or not.
 * - displayOrder: in which order to display daily notes
 * - outlineNoteName: name of the note outline
 */
export interface DailyNotesViewSettings {
	displayOrder: DisplayOrder;
	enableBackspaceCommand: boolean;
	length: number;
	lengthUnit: LengthUnit,
	outlineNoteName: string
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

		// Daily notes settings
		containerEl.createEl("h2", {text: "Daily Notes"});
		new Setting(containerEl)
			.setName("Length")
			.setDesc("How far back to look for notes")
			.addText(text => {
				text.setValue(this.plugin.settings.length.toString())
					.onChange(async (value) => {
						this.plugin.settings.length = +value;
						await this.plugin.saveSettings();
					});
				text.inputEl.maxLength = 3;
			})
			.addDropdown(dropdown => dropdown
				.addOptions(LengthUnit)
				.setValue(this.plugin.settings.lengthUnit)
				.onChange(async (value) => {
					this.plugin.settings.lengthUnit = value as LengthUnit;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Daily Notes order")
			.setDesc("Set the order in which the notes are displayed one after the other.")
			.addDropdown(dropdown => dropdown
				.addOptions(DisplayOrder)
				.setValue(this.plugin.settings.displayOrder)
				.onChange(async (value) => {
					this.plugin.settings.displayOrder = value as DisplayOrder;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Name of notes outline")
			.setDesc("The name of the markdown file that contains links to notes within the date range.")
			.addText(text => {
				text.setValue(this.plugin.settings.outlineNoteName)
					.onChange(async (value) => {
						this.plugin.settings.outlineNoteName = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.maxLength = 30;
			})
			.addButton(button => {
				button.setButtonText("Re-generate")
					.onClick(evt => {
						this.plugin.generateNotesOutline();
					})
			});

		// Keyboard settings
		containerEl.createEl("h2", {text: "Keyboard"});
		new Setting(containerEl)
			.setName("Enable Backspace key command")
			.setDesc("Enable adding a command that simulates typing the backspace key.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableBackspaceCommand)
				.onChange(async (value) => {
					this.plugin.settings.enableBackspaceCommand = value;
					await this.plugin.saveSettings();
				}));

	}
}
