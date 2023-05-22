import {Editor, MarkdownView, Notice, Plugin} from "obsidian";
import {EditorView} from "@codemirror/view";
import {deleteCharBackward} from "@codemirror/commands";
import {DailyNotesViewSettings, DailyNotesViewSettingTab, DisplayOrder, LengthUnit} from "./DailyNotesViewSettingTab";

/**
 * Default values for setting.
 */
const DEFAULT_SETTINGS: DailyNotesViewSettings = {
	outlineNoteName: "DailyNotesOutline",
	length: 1,
	lengthUnit: LengthUnit.Week,
	enableBackspaceCommand: false,
	displayOrder: DisplayOrder.RecentFirst
};

export default class DailyNotesViewPlugin extends Plugin {
	settings: DailyNotesViewSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon("dice", "Sample Plugin", (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice("This is a notice!");
		});


		// Command to type backspace. Useful on iPad and Pencil.
		if (this.settings.enableBackspaceCommand) {
			this.addCommand({
				id: "dailynotesview-backspace-editor-command",
				name: "Type backspace",
				mobileOnly: true,
				editorCallback: (editor: Editor, view: MarkdownView) => {
					if (view) {
						// @ts-expect-error
						const editorView = view.editor.cm as EditorView;
						deleteCharBackward(editorView);
					}
				}
			});
		}

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new DailyNotesViewSettingTab(this.app, this));

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

