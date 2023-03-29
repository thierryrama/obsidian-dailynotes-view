import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { EditorView } from "@codemirror/view";
import { deleteCharBackward } from "@codemirror/commands";


// Remember to rename these classes and interfaces!

interface DailyNotesViewSettings {

	enableBackspaceCommand: boolean;

}

const DEFAULT_SETTINGS: DailyNotesViewSettings = {
	enableBackspaceCommand: false
}

export default class DailyNotesViewPlugin extends Plugin {
	settings: DailyNotesViewSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});

		//if (this.settings.enableBackspaceCommand) {
			// This adds an editor command that can perform some operation on the current editor instance
			this.addCommand({
				id: 'dailynotesview-backspace-editor-command',
				name: 'Type backspace',
				editorCallback: (editor: Editor, view: MarkdownView) => {
					if (view) {
						// @ts-expect-error
						const editorView = view.editor.cm as EditorView;
						console.log('backspace command called.');
						deleteCharBackward(editorView);
						//editorView.contentDOM.dispatchEvent(new KeyboardEvent('keydown', {keyCode:13}))
					}
				}
			});
		//}


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

class DailyNotesViewSettingTab extends PluginSettingTab {
	plugin: DailyNotesViewPlugin;

	constructor(app: App, plugin: DailyNotesViewPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

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
